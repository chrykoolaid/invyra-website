import { EnvironmentName, InventoryLossType, InventoryMovementType } from "@prisma/client";
import type { CurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { auditLog } from "@/lib/audit/audit";

export type Sprint6Session = NonNullable<CurrentSession>;
type Scope = { organisationId: string; environmentName: EnvironmentName };

export function sprint6ScopeFromSession(session: Sprint6Session): Scope {
  return { organisationId: session.organisation.id, environmentName: session.environment as EnvironmentName };
}

export function ensureSprint6LossRole(session: Sprint6Session) {
  const role = session.membership.role.name;
  return role === "SUPERVISOR" || role === "MANAGER" || role === "ADMINISTRATOR" || role === "OWNER";
}

export function ensureSprint6ApprovalRole(session: Sprint6Session) {
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

function optionalPositiveNumber(value: unknown, label: string): number | null {
  if (value === undefined || value === null || value === "") return null;
  return positiveNumber(value, label);
}

function normaliseLossType(value: unknown): InventoryLossType {
  const raw = cleanString(value)?.toUpperCase();
  if (["WASTAGE", "DAMAGE", "EXPIRY", "SHRINKAGE", "MARKDOWN"].includes(raw ?? "")) return raw as InventoryLossType;
  return "WASTAGE";
}

function movementForLossType(lossType: InventoryLossType): InventoryMovementType | null {
  if (lossType === "SHRINKAGE") return "SHRINKAGE";
  if (lossType === "WASTAGE" || lossType === "DAMAGE" || lossType === "EXPIRY") return "WASTAGE";
  return null;
}

async function nextNumber(scope: Scope, prefix: string, model: "loss" | "markdown") {
  const year = new Date().getUTCFullYear();
  const fullPrefix = `${prefix}-${year}-`;
  const count = model === "loss"
    ? await prisma.inventoryLossEvent.count({ where: scope })
    : await prisma.inventoryMarkdownEvent.count({ where: scope });
  return `${fullPrefix}${String(count + 1).padStart(6, "0")}`;
}

async function getItem(scope: Scope, itemId: string) {
  const item = await prisma.inventoryItem.findFirst({ where: { ...scope, id: itemId } });
  if (!item) throw new Error("Item not found in this environment");
  if (item.status === "ARCHIVED") throw new Error("Archived items cannot be used for loss or markdown events");
  return item;
}

async function resolveLocation(scope: Scope, locationId?: string | null) {
  if (!locationId) return null;
  const location = await prisma.inventoryLocation.findFirst({ where: { ...scope, id: locationId } });
  if (!location) throw new Error("Location not found in this environment");
  return location;
}

async function currentQty(scope: Scope, itemId: string, locationId: string | null) {
  if (!locationId) return 0;
  const balance = await prisma.inventoryStockBalance.findUnique({
    where: { organisationId_environmentName_locationId_itemId: { ...scope, locationId, itemId } }
  });
  return Number(balance?.quantityOnHand ?? 0);
}

async function applyLossMovement(params: {
  tx: any;
  scope: Scope;
  session: Sprint6Session;
  itemId: string;
  locationId: string;
  quantity: number;
  movementType: InventoryMovementType;
  referenceType: string;
  reason: string;
}) {
  const beforeQty = await currentQty(params.scope, params.itemId, params.locationId);
  const afterQty = beforeQty - params.quantity;
  if (afterQty < 0) throw new Error("Loss event would create negative stock");
  const movement = await params.tx.inventoryMovement.create({
    data: {
      ...params.scope,
      itemId: params.itemId,
      locationId: params.locationId,
      movementType: params.movementType,
      quantityDelta: (-params.quantity).toString(),
      quantityBefore: beforeQty.toString(),
      quantityAfter: afterQty.toString(),
      referenceType: params.referenceType,
      reason: params.reason,
      createdByUserId: params.session.user.id
    }
  });
  await params.tx.inventoryStockBalance.upsert({
    where: { organisationId_environmentName_locationId_itemId: { ...params.scope, locationId: params.locationId, itemId: params.itemId } },
    create: { ...params.scope, locationId: params.locationId, itemId: params.itemId, quantityOnHand: afterQty.toString(), lastMovementId: movement.id },
    update: { quantityOnHand: afterQty.toString(), lastMovementId: movement.id }
  });
  return movement;
}

export async function listInventoryLossEvents(session: Sprint6Session) {
  const scope = sprint6ScopeFromSession(session);
  const events = await prisma.inventoryLossEvent.findMany({ where: scope, orderBy: { createdAt: "desc" }, take: 100 });
  const itemIds = Array.from(new Set(events.map((event) => event.itemId)));
  const locationIds = Array.from(new Set(events.map((event) => event.locationId).filter(Boolean))) as string[];
  const [items, locations] = await Promise.all([
    itemIds.length ? prisma.inventoryItem.findMany({ where: { ...scope, id: { in: itemIds } }, select: { id: true, sku: true, name: true } }) : [],
    locationIds.length ? prisma.inventoryLocation.findMany({ where: { ...scope, id: { in: locationIds } }, select: { id: true, code: true, name: true } }) : []
  ]);
  const itemById = new Map(items.map((item) => [item.id, item]));
  const locationById = new Map(locations.map((location) => [location.id, location]));
  return events.map((event) => ({
    id: event.id,
    lossNumber: event.lossNumber,
    lossType: event.lossType,
    status: event.status,
    itemSku: itemById.get(event.itemId)?.sku ?? null,
    itemName: itemById.get(event.itemId)?.name ?? null,
    locationName: event.locationId ? locationById.get(event.locationId)?.name ?? null : null,
    quantity: event.quantity.toString(),
    lossValue: event.lossValue?.toString() ?? null,
    reason: event.reason,
    subreason: event.subreason,
    disposition: event.disposition,
    expiryDate: event.expiryDate?.toISOString() ?? null,
    movementId: event.movementId,
    createdAt: event.createdAt.toISOString()
  }));
}

export async function createInventoryLossEvent(params: { request: Request; session: Sprint6Session; body: unknown }) {
  const scope = sprint6ScopeFromSession(params.session);
  const body = params.body as Record<string, unknown>;
  const lossType = normaliseLossType(body.lossType ?? body.type);
  const itemId = requireString(body.itemId, "Item");
  const quantity = positiveNumber(body.quantity, "Quantity");
  const reason = requireString(body.reason, "Reason");
  const locationId = cleanString(body.locationId);
  await getItem(scope, itemId);
  await resolveLocation(scope, locationId);
  const unitCost = optionalPositiveNumber(body.unitCost, "Unit cost");
  const lossValue = unitCost === null ? null : unitCost * quantity;
  const movementType = movementForLossType(lossType);
  const lossNumber = await nextNumber(scope, "LOS", "loss");

  const result = await prisma.$transaction(async (tx) => {
    let movement: { id: string } | null = null;
    if (movementType && locationId) {
      movement = await applyLossMovement({ tx, scope, session: params.session, itemId, locationId, quantity, movementType, referenceType: lossType, reason });
    }
    const event = await tx.inventoryLossEvent.create({
      data: {
        ...scope,
        lossNumber,
        lossType,
        status: movement ? "RECORDED" : "REVIEW_REQUIRED",
        itemId,
        locationId,
        quantity: quantity.toString(),
        unitCost: unitCost === null ? null : unitCost.toString(),
        lossValue: lossValue === null ? null : lossValue.toString(),
        reason,
        subreason: cleanString(body.subreason),
        comment: cleanString(body.comment),
        batchNumber: cleanString(body.batchNumber),
        lotNumber: cleanString(body.lotNumber),
        expiryDate: cleanString(body.expiryDate) ? new Date(String(body.expiryDate)) : null,
        disposition: cleanString(body.disposition)?.toUpperCase() as any ?? (lossType === "DAMAGE" ? "NONE" : null),
        movementId: movement?.id ?? null,
        createdByUserId: params.session.user.id
      }
    });
    return event;
  });

  await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: `${lossType}_RECORDED`, targetType: "InventoryLossEvent", targetId: result.id, metadata: { lossNumber, lossType, itemId, locationId, quantity, lossValue, movementCreated: Boolean(result.movementId) } });
  return result;
}

export async function listInventoryMarkdownEvents(session: Sprint6Session) {
  const scope = sprint6ScopeFromSession(session);
  const events = await prisma.inventoryMarkdownEvent.findMany({ where: scope, orderBy: { createdAt: "desc" }, take: 100 });
  const itemIds = Array.from(new Set(events.map((event) => event.itemId)));
  const items = itemIds.length ? await prisma.inventoryItem.findMany({ where: { ...scope, id: { in: itemIds } }, select: { id: true, sku: true, name: true } }) : [];
  const itemById = new Map(items.map((item) => [item.id, item]));
  return events.map((event) => ({
    id: event.id,
    markdownNumber: event.markdownNumber,
    itemSku: itemById.get(event.itemId)?.sku ?? null,
    itemName: itemById.get(event.itemId)?.name ?? null,
    originalPrice: event.originalPrice.toString(),
    markdownPrice: event.markdownPrice.toString(),
    markdownPercent: event.markdownPercent?.toString() ?? null,
    quantityMarked: event.quantityMarked.toString(),
    quantityRemaining: event.quantityRemaining.toString(),
    expiryDate: event.expiryDate?.toISOString() ?? null,
    replacementBarcode: event.replacementBarcode,
    status: event.status,
    createdAt: event.createdAt.toISOString()
  }));
}

export async function createInventoryMarkdownEvent(params: { request: Request; session: Sprint6Session; body: unknown }) {
  const scope = sprint6ScopeFromSession(params.session);
  const body = params.body as Record<string, unknown>;
  const itemId = requireString(body.itemId, "Item");
  await getItem(scope, itemId);
  const locationId = cleanString(body.locationId);
  await resolveLocation(scope, locationId);
  const originalPrice = positiveNumber(body.originalPrice, "Original price");
  const markdownPrice = positiveNumber(body.markdownPrice, "Markdown price");
  if (markdownPrice >= originalPrice) throw new Error("Markdown price must be lower than original price");
  const quantityMarked = positiveNumber(body.quantityMarked ?? body.quantity, "Quantity marked");
  const markdownPercent = Math.round(((originalPrice - markdownPrice) / originalPrice) * 10000) / 100;
  const markdownNumber = await nextNumber(scope, "MDN", "markdown");
  const replacementBarcode = cleanString(body.replacementBarcode) ?? `${markdownNumber.replace(/-/g, "")}`;
  const event = await prisma.inventoryMarkdownEvent.create({
    data: {
      ...scope,
      markdownNumber,
      itemId,
      locationId,
      batchNumber: cleanString(body.batchNumber),
      lotNumber: cleanString(body.lotNumber),
      expiryDate: cleanString(body.expiryDate) ? new Date(String(body.expiryDate)) : null,
      originalPrice: originalPrice.toString(),
      markdownPrice: markdownPrice.toString(),
      markdownPercent: markdownPercent.toString(),
      quantityMarked: quantityMarked.toString(),
      quantityRemaining: quantityMarked.toString(),
      replacementBarcode,
      reason: cleanString(body.reason) ?? "Expiry or clearance markdown",
      createdByUserId: params.session.user.id
    }
  });
  await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: "MARKDOWN_CREATED", targetType: "InventoryMarkdownEvent", targetId: event.id, metadata: { markdownNumber, itemId, originalPrice, markdownPrice, markdownPercent, replacementBarcode, labelArchitecture: "PRICE_PLUS_REPLACEMENT_BARCODE" } });
  return event;
}

export async function getInventoryLossDashboard(session: Sprint6Session) {
  const scope = sprint6ScopeFromSession(session);
  const [losses, markdowns] = await Promise.all([
    prisma.inventoryLossEvent.findMany({ where: scope, take: 1000 }),
    prisma.inventoryMarkdownEvent.findMany({ where: scope, take: 1000 })
  ]);
  const totalLossValue = losses.reduce((sum, event) => sum + Number(event.lossValue ?? 0), 0);
  const markdownRecovery = markdowns.reduce((sum, event) => sum + Number(event.markdownPrice) * Number(event.quantityMarked), 0);
  const byType = losses.reduce<Record<string, number>>((acc, event) => {
    acc[event.lossType] = (acc[event.lossType] ?? 0) + Number(event.lossValue ?? 0);
    return acc;
  }, {});
  return {
    totalLossValue: totalLossValue.toFixed(2),
    markdownRecovery: markdownRecovery.toFixed(2),
    wasteValue: (byType.WASTAGE ?? 0).toFixed(2),
    damageValue: (byType.DAMAGE ?? 0).toFixed(2),
    expiryLoss: (byType.EXPIRY ?? 0).toFixed(2),
    shrinkageValue: (byType.SHRINKAGE ?? 0).toFixed(2),
    activeMarkdowns: markdowns.filter((event) => event.status === "ACTIVE").length,
    lossEvents: losses.length
  };
}
