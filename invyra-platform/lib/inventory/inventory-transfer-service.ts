import { EnvironmentName, InventoryLocationType } from "@prisma/client";
import type { CurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { auditLog } from "@/lib/audit/audit";

export type Sprint5Session = NonNullable<CurrentSession>;
type Scope = { organisationId: string; environmentName: EnvironmentName };

type TransferAction = "submit" | "approve" | "dispatch" | "receive" | "cancel";

export function sprint5ScopeFromSession(session: Sprint5Session): Scope {
  return { organisationId: session.organisation.id, environmentName: session.environment as EnvironmentName };
}

export function ensureSprint5CreateRole(session: Sprint5Session) {
  const role = session.membership.role.name;
  return role === "STAFF" || role === "SUPERVISOR" || role === "MANAGER" || role === "ADMINISTRATOR" || role === "OWNER";
}

export function ensureSprint5ApproveRole(session: Sprint5Session) {
  const role = session.membership.role.name;
  return role === "MANAGER" || role === "ADMINISTRATOR" || role === "OWNER";
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function requireString(value: unknown, label: string): string {
  const cleaned = cleanString(value);
  if (!cleaned) throw new Error(`${label} is required`);
  return cleaned;
}

function positiveNumber(value: unknown, label: string): number {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) throw new Error(`${label} must be greater than zero`);
  return numberValue;
}

function nonNegativeNumber(value: unknown, label: string): number {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) throw new Error(`${label} must be zero or greater`);
  return numberValue;
}

function normaliseLocationType(value: unknown): InventoryLocationType {
  const raw = cleanString(value)?.toUpperCase();
  if (["WAREHOUSE", "STORE", "BRANCH", "PRODUCTION", "VEHICLE", "OTHER"].includes(raw ?? "")) return raw as InventoryLocationType;
  return "WAREHOUSE";
}

async function nextTransferNumber(scope: Scope) {
  const year = new Date().getUTCFullYear();
  const prefix = `TRF-${year}-`;
  const count = await prisma.inventoryTransfer.count({ where: scope });
  return `${prefix}${String(count + 1).padStart(6, "0")}`;
}

async function currentQty(scope: Scope, itemId: string, locationId: string) {
  const balance = await prisma.inventoryStockBalance.findUnique({
    where: { organisationId_environmentName_locationId_itemId: { ...scope, locationId, itemId } }
  });
  return Number(balance?.quantityOnHand ?? 0);
}

async function getLocation(scope: Scope, id: string) {
  const location = await prisma.inventoryLocation.findFirst({ where: { ...scope, id } });
  if (!location) throw new Error("Location not found in this environment");
  if (location.status === "ARCHIVED") throw new Error("Archived locations cannot be used for transfers");
  return location;
}

async function getItem(scope: Scope, id: string) {
  const item = await prisma.inventoryItem.findFirst({ where: { ...scope, id } });
  if (!item) throw new Error("Item not found in this environment");
  if (item.status === "ARCHIVED") throw new Error("Archived items cannot be transferred");
  return item;
}

export async function listInventoryLocations(session: Sprint5Session) {
  const scope = sprint5ScopeFromSession(session);
  const locations = await prisma.inventoryLocation.findMany({ where: scope, orderBy: [{ status: "asc" }, { name: "asc" }] });
  return locations.map((location) => ({
    id: location.id,
    code: location.code,
    name: location.name,
    type: location.type,
    status: location.status,
    createdAt: location.createdAt.toISOString(),
    updatedAt: location.updatedAt.toISOString()
  }));
}

export async function createInventoryLocation(params: { request: Request; session: Sprint5Session; body: unknown }) {
  const scope = sprint5ScopeFromSession(params.session);
  const body = params.body as Record<string, unknown>;
  const code = requireString(body.code, "Location code").toUpperCase();
  const name = requireString(body.name, "Location name");
  const type = normaliseLocationType(body.type);
  const location = await prisma.inventoryLocation.create({
    data: { ...scope, code, name, type, createdByUserId: params.session.user.id, updatedByUserId: params.session.user.id }
  });
  await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: "LOCATION_CREATED", targetType: "InventoryLocation", targetId: location.id, metadata: { code, name, type } });
  return location;
}

export async function archiveInventoryLocation(params: { request: Request; session: Sprint5Session; id: string }) {
  const scope = sprint5ScopeFromSession(params.session);
  const location = await getLocation(scope, params.id);
  const activeStock = await prisma.inventoryStockBalance.findFirst({ where: { ...scope, locationId: location.id, quantityOnHand: { not: 0 } } });
  if (activeStock) throw new Error("Locations with stock balances cannot be archived");
  const updated = await prisma.inventoryLocation.update({ where: { id: location.id }, data: { status: "ARCHIVED", updatedByUserId: params.session.user.id } });
  await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: "LOCATION_ARCHIVED", targetType: "InventoryLocation", targetId: location.id, metadata: { code: location.code, name: location.name } });
  return updated;
}

async function hydrateTransfers(scope: Scope, transfers: Array<{ id: string; transferNumber: string; sourceLocationId: string; destinationLocationId: string; status: string; reason: string | null; createdAt: Date; updatedAt: Date }>) {
  const locationIds = Array.from(new Set(transfers.flatMap((transfer) => [transfer.sourceLocationId, transfer.destinationLocationId])));
  const transferIds = transfers.map((transfer) => transfer.id);
  const [locations, lines] = await Promise.all([
    locationIds.length ? prisma.inventoryLocation.findMany({ where: { ...scope, id: { in: locationIds } }, select: { id: true, code: true, name: true } }) : [],
    transferIds.length ? prisma.inventoryTransferLine.findMany({ where: { ...scope, transferId: { in: transferIds } } }) : []
  ]);
  const locationById = new Map(locations.map((location) => [location.id, location]));
  const linesByTransfer = new Map<string, typeof lines>();
  for (const line of lines) linesByTransfer.set(line.transferId, [...(linesByTransfer.get(line.transferId) ?? []), line]);
  return transfers.map((transfer) => {
    const transferLines = linesByTransfer.get(transfer.id) ?? [];
    const requestedQty = transferLines.reduce((sum, line) => sum + Number(line.requestedQty), 0);
    const dispatchedQty = transferLines.reduce((sum, line) => sum + Number(line.dispatchedQty ?? 0), 0);
    const receivedQty = transferLines.reduce((sum, line) => sum + Number(line.receivedQty ?? 0), 0);
    return {
      id: transfer.id,
      transferNumber: transfer.transferNumber,
      sourceLocation: locationById.get(transfer.sourceLocationId)?.name ?? "Unknown source",
      destinationLocation: locationById.get(transfer.destinationLocationId)?.name ?? "Unknown destination",
      status: transfer.status,
      reason: transfer.reason,
      lineCount: transferLines.length,
      requestedQty: requestedQty.toString(),
      inTransitQty: Math.max(dispatchedQty - receivedQty, 0).toString(),
      createdAt: transfer.createdAt.toISOString(),
      updatedAt: transfer.updatedAt.toISOString()
    };
  });
}

export async function listInventoryTransfers(session: Sprint5Session) {
  const scope = sprint5ScopeFromSession(session);
  const transfers = await prisma.inventoryTransfer.findMany({ where: scope, orderBy: { createdAt: "desc" }, take: 100 });
  return hydrateTransfers(scope, transfers);
}

export async function getInventoryTransfer(session: Sprint5Session, id: string) {
  const scope = sprint5ScopeFromSession(session);
  const transfer = await prisma.inventoryTransfer.findFirst({ where: { ...scope, id } });
  if (!transfer) throw new Error("Transfer not found in this environment");
  const [source, destination, lines] = await Promise.all([
    prisma.inventoryLocation.findFirst({ where: { ...scope, id: transfer.sourceLocationId } }),
    prisma.inventoryLocation.findFirst({ where: { ...scope, id: transfer.destinationLocationId } }),
    prisma.inventoryTransferLine.findMany({ where: { ...scope, transferId: transfer.id }, orderBy: { createdAt: "asc" } })
  ]);
  const items = lines.length ? await prisma.inventoryItem.findMany({ where: { ...scope, id: { in: Array.from(new Set(lines.map((line) => line.itemId))) } } }) : [];
  const itemById = new Map(items.map((item) => [item.id, item]));
  return {
    id: transfer.id,
    transferNumber: transfer.transferNumber,
    status: transfer.status,
    reason: transfer.reason,
    sourceLocation: source ? { id: source.id, code: source.code, name: source.name } : null,
    destinationLocation: destination ? { id: destination.id, code: destination.code, name: destination.name } : null,
    lines: lines.map((line) => {
      const item = itemById.get(line.itemId);
      return {
        id: line.id,
        itemId: line.itemId,
        sku: item?.sku ?? null,
        itemName: item?.name ?? null,
        requestedQty: line.requestedQty.toString(),
        approvedQty: line.approvedQty?.toString() ?? null,
        dispatchedQty: line.dispatchedQty?.toString() ?? null,
        receivedQty: line.receivedQty?.toString() ?? null,
        discrepancyReason: line.discrepancyReason
      };
    })
  };
}

export async function createInventoryTransfer(params: { request: Request; session: Sprint5Session; body: unknown }) {
  const scope = sprint5ScopeFromSession(params.session);
  const body = params.body as Record<string, unknown>;
  const sourceLocationId = requireString(body.sourceLocationId, "Source location");
  const destinationLocationId = requireString(body.destinationLocationId, "Destination location");
  if (sourceLocationId === destinationLocationId) throw new Error("Source and destination locations must be different");
  await Promise.all([getLocation(scope, sourceLocationId), getLocation(scope, destinationLocationId)]);
  const rawLines = Array.isArray(body.lines) ? body.lines : [];
  if (!rawLines.length) throw new Error("At least one transfer line is required");
  const lines = [] as Array<{ itemId: string; requestedQty: number }>;
  for (const [index, raw] of rawLines.entries()) {
    const line = raw as Record<string, unknown>;
    const itemId = requireString(line.itemId, `Line ${index + 1} item`);
    await getItem(scope, itemId);
    lines.push({ itemId, requestedQty: positiveNumber(line.requestedQty ?? line.quantity, `Line ${index + 1} requested quantity`) });
  }
  const transferNumber = await nextTransferNumber(scope);
  const transfer = await prisma.$transaction(async (tx) => {
    const createdTransfer = await tx.inventoryTransfer.create({ data: { ...scope, transferNumber, sourceLocationId, destinationLocationId, reason: cleanString(body.reason), createdByUserId: params.session.user.id, updatedByUserId: params.session.user.id } });
    for (const line of lines) await tx.inventoryTransferLine.create({ data: { ...scope, transferId: createdTransfer.id, itemId: line.itemId, requestedQty: line.requestedQty.toString() } });
    return createdTransfer;
  });
  await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: "TRANSFER_CREATED", targetType: "InventoryTransfer", targetId: transfer.id, metadata: { transferNumber, lineCount: lines.length, stockMutationEnabled: false } });
  return getInventoryTransfer(params.session, transfer.id);
}

async function updateTransferStatus(params: { request: Request; session: Sprint5Session; id: string; action: TransferAction; body?: unknown }) {
  const scope = sprint5ScopeFromSession(params.session);
  const transfer = await prisma.inventoryTransfer.findFirst({ where: { ...scope, id: params.id } });
  if (!transfer) throw new Error("Transfer not found in this environment");
  const now = new Date();

  if (params.action === "submit") {
    if (transfer.status !== "DRAFT") throw new Error("Only draft transfers can be submitted");
    const updated = await prisma.inventoryTransfer.update({ where: { id: transfer.id }, data: { status: "SUBMITTED", submittedAt: now, updatedByUserId: params.session.user.id } });
    await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: "TRANSFER_SUBMITTED", targetType: "InventoryTransfer", targetId: transfer.id, metadata: { transferNumber: transfer.transferNumber } });
    return updated;
  }

  if (params.action === "approve") {
    if (!ensureSprint5ApproveRole(params.session)) throw new Error("Manager, Administrator or Owner role required to approve transfers");
    if (transfer.status !== "SUBMITTED" && transfer.status !== "DRAFT") throw new Error("Only draft or submitted transfers can be approved");
    const lines = await prisma.inventoryTransferLine.findMany({ where: { ...scope, transferId: transfer.id } });
    for (const line of lines) {
      const available = await currentQty(scope, line.itemId, transfer.sourceLocationId);
      if (available < Number(line.requestedQty)) throw new Error("Source location does not have enough stock to approve this transfer");
    }
    const updated = await prisma.inventoryTransfer.update({ where: { id: transfer.id }, data: { status: "APPROVED", approvedAt: now, approvedByUserId: params.session.user.id, updatedByUserId: params.session.user.id } });
    for (const line of lines) await prisma.inventoryTransferLine.update({ where: { id: line.id }, data: { approvedQty: line.requestedQty } });
    await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: "TRANSFER_APPROVED", targetType: "InventoryTransfer", targetId: transfer.id, metadata: { transferNumber: transfer.transferNumber, stockMutationEnabled: false } });
    return updated;
  }

  if (params.action === "cancel") {
    if (["IN_TRANSIT", "RECEIVED"].includes(transfer.status)) throw new Error("In-transit or received transfers cannot be cancelled");
    const updated = await prisma.inventoryTransfer.update({ where: { id: transfer.id }, data: { status: "CANCELLED", cancelledAt: now, updatedByUserId: params.session.user.id } });
    await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: "TRANSFER_CANCELLED", targetType: "InventoryTransfer", targetId: transfer.id, metadata: { transferNumber: transfer.transferNumber } });
    return updated;
  }

  throw new Error("Unsupported transfer status action");
}

export async function transitionInventoryTransfer(params: { request: Request; session: Sprint5Session; id: string; action: TransferAction; body?: unknown }) {
  if (params.action === "dispatch") return dispatchInventoryTransfer(params);
  if (params.action === "receive") return receiveInventoryTransfer(params);
  return updateTransferStatus(params);
}

async function dispatchInventoryTransfer(params: { request: Request; session: Sprint5Session; id: string }) {
  const scope = sprint5ScopeFromSession(params.session);
  const transfer = await prisma.inventoryTransfer.findFirst({ where: { ...scope, id: params.id } });
  if (!transfer) throw new Error("Transfer not found in this environment");
  if (transfer.status !== "APPROVED") throw new Error("Only approved transfers can be dispatched");
  const lines = await prisma.inventoryTransferLine.findMany({ where: { ...scope, transferId: transfer.id } });
  const result = await prisma.$transaction(async (tx) => {
    for (const line of lines) {
      const qty = Number(line.approvedQty ?? line.requestedQty);
      const balance = await tx.inventoryStockBalance.findUnique({ where: { organisationId_environmentName_locationId_itemId: { ...scope, locationId: transfer.sourceLocationId, itemId: line.itemId } } });
      const before = Number(balance?.quantityOnHand ?? 0);
      const after = before - qty;
      if (after < 0) throw new Error("Dispatch would create negative stock at source location");
      const movement = await tx.inventoryMovement.create({ data: { ...scope, locationId: transfer.sourceLocationId, itemId: line.itemId, movementType: "TRANSFER_OUT", quantityDelta: (-qty).toString(), quantityBefore: before.toString(), quantityAfter: after.toString(), referenceType: "TRANSFER", referenceId: transfer.id, reason: `Dispatch ${transfer.transferNumber}`, createdByUserId: params.session.user.id } });
      await tx.inventoryStockBalance.upsert({ where: { organisationId_environmentName_locationId_itemId: { ...scope, locationId: transfer.sourceLocationId, itemId: line.itemId } }, create: { ...scope, locationId: transfer.sourceLocationId, itemId: line.itemId, quantityOnHand: after.toString(), lastMovementId: movement.id }, update: { quantityOnHand: after.toString(), lastMovementId: movement.id } });
      await tx.inventoryTransferLine.update({ where: { id: line.id }, data: { dispatchedQty: qty.toString() } });
    }
    return tx.inventoryTransfer.update({ where: { id: transfer.id }, data: { status: "IN_TRANSIT", dispatchedAt: new Date(), dispatchedByUserId: params.session.user.id, updatedByUserId: params.session.user.id } });
  });
  await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: "TRANSFER_DISPATCHED", targetType: "InventoryTransfer", targetId: transfer.id, metadata: { transferNumber: transfer.transferNumber, movementType: "TRANSFER_OUT", stockMutationEnabled: true } });
  return result;
}

async function receiveInventoryTransfer(params: { request: Request; session: Sprint5Session; id: string; body?: unknown }) {
  const scope = sprint5ScopeFromSession(params.session);
  const transfer = await prisma.inventoryTransfer.findFirst({ where: { ...scope, id: params.id } });
  if (!transfer) throw new Error("Transfer not found in this environment");
  if (transfer.status !== "IN_TRANSIT" && transfer.status !== "PARTIALLY_RECEIVED") throw new Error("Only in-transit transfers can be received");
  const body = (params.body ?? {}) as Record<string, unknown>;
  const rawLines = Array.isArray(body.lines) ? body.lines : [];
  const existingLines = await prisma.inventoryTransferLine.findMany({ where: { ...scope, transferId: transfer.id } });
  const lineInput = new Map<string, { receivedQty: number; discrepancyReason: string | null }>();
  if (rawLines.length) {
    for (const raw of rawLines) {
      const line = raw as Record<string, unknown>;
      const lineId = requireString(line.lineId ?? line.id, "Transfer line");
      lineInput.set(lineId, { receivedQty: nonNegativeNumber(line.receivedQty ?? line.quantity, "Received quantity"), discrepancyReason: cleanString(line.discrepancyReason) });
    }
  }
  const result = await prisma.$transaction(async (tx) => {
    for (const line of existingLines) {
      const dispatched = Number(line.dispatchedQty ?? line.approvedQty ?? line.requestedQty);
      const alreadyReceived = Number(line.receivedQty ?? 0);
      const input = lineInput.get(line.id);
      const qty = input ? input.receivedQty : Math.max(dispatched - alreadyReceived, 0);
      if (qty + alreadyReceived > dispatched) throw new Error("Received quantity cannot exceed dispatched quantity");
      if (qty > 0) {
        const balance = await tx.inventoryStockBalance.findUnique({ where: { organisationId_environmentName_locationId_itemId: { ...scope, locationId: transfer.destinationLocationId, itemId: line.itemId } } });
        const before = Number(balance?.quantityOnHand ?? 0);
        const after = before + qty;
        const movement = await tx.inventoryMovement.create({ data: { ...scope, locationId: transfer.destinationLocationId, itemId: line.itemId, movementType: "TRANSFER_IN", quantityDelta: qty.toString(), quantityBefore: before.toString(), quantityAfter: after.toString(), referenceType: "TRANSFER", referenceId: transfer.id, reason: `Receive ${transfer.transferNumber}`, createdByUserId: params.session.user.id } });
        await tx.inventoryStockBalance.upsert({ where: { organisationId_environmentName_locationId_itemId: { ...scope, locationId: transfer.destinationLocationId, itemId: line.itemId } }, create: { ...scope, locationId: transfer.destinationLocationId, itemId: line.itemId, quantityOnHand: after.toString(), lastMovementId: movement.id }, update: { quantityOnHand: after.toString(), lastMovementId: movement.id } });
      }
      await tx.inventoryTransferLine.update({ where: { id: line.id }, data: { receivedQty: (alreadyReceived + qty).toString(), discrepancyReason: input?.discrepancyReason ?? line.discrepancyReason } });
    }
    const refreshed = await tx.inventoryTransferLine.findMany({ where: { ...scope, transferId: transfer.id } });
    const fullyReceived = refreshed.every((line) => Number(line.receivedQty ?? 0) >= Number(line.dispatchedQty ?? line.approvedQty ?? line.requestedQty));
    return tx.inventoryTransfer.update({ where: { id: transfer.id }, data: { status: fullyReceived ? "RECEIVED" : "PARTIALLY_RECEIVED", receivedAt: fullyReceived ? new Date() : null, receivedByUserId: params.session.user.id, updatedByUserId: params.session.user.id } });
  });
  await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: "TRANSFER_RECEIVED", targetType: "InventoryTransfer", targetId: transfer.id, metadata: { transferNumber: transfer.transferNumber, movementType: "TRANSFER_IN", stockMutationEnabled: true } });
  return result;
}

export async function listInTransitInventory(session: Sprint5Session) {
  const scope = sprint5ScopeFromSession(session);
  const transfers = await prisma.inventoryTransfer.findMany({ where: { ...scope, status: { in: ["IN_TRANSIT", "PARTIALLY_RECEIVED"] } } });
  const lines = transfers.length ? await prisma.inventoryTransferLine.findMany({ where: { ...scope, transferId: { in: transfers.map((transfer) => transfer.id) } } }) : [];
  const itemIds = Array.from(new Set(lines.map((line) => line.itemId)));
  const locationIds = Array.from(new Set(transfers.flatMap((transfer) => [transfer.sourceLocationId, transfer.destinationLocationId])));
  const [items, locations] = await Promise.all([
    itemIds.length ? prisma.inventoryItem.findMany({ where: { ...scope, id: { in: itemIds } }, select: { id: true, sku: true, name: true, unitOfMeasure: true } }) : [],
    locationIds.length ? prisma.inventoryLocation.findMany({ where: { ...scope, id: { in: locationIds } }, select: { id: true, name: true } }) : []
  ]);
  const itemById = new Map(items.map((item) => [item.id, item]));
  const locationById = new Map(locations.map((location) => [location.id, location]));
  const transferById = new Map(transfers.map((transfer) => [transfer.id, transfer]));
  return lines.map((line) => {
    const transfer = transferById.get(line.transferId)!;
    const dispatched = Number(line.dispatchedQty ?? 0);
    const received = Number(line.receivedQty ?? 0);
    return {
      transferId: transfer.id,
      transferNumber: transfer.transferNumber,
      itemId: line.itemId,
      sku: itemById.get(line.itemId)?.sku ?? null,
      itemName: itemById.get(line.itemId)?.name ?? null,
      unitOfMeasure: itemById.get(line.itemId)?.unitOfMeasure ?? null,
      sourceLocation: locationById.get(transfer.sourceLocationId)?.name ?? "Unknown source",
      destinationLocation: locationById.get(transfer.destinationLocationId)?.name ?? "Unknown destination",
      inTransitQty: Math.max(dispatched - received, 0).toString()
    };
  }).filter((row) => Number(row.inTransitQty) > 0);
}
