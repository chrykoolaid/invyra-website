import { EnvironmentName, InventoryPurchaseOrderStatus } from "@prisma/client";
import type { CurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { auditLog } from "@/lib/audit/audit";

export type Sprint4Session = NonNullable<CurrentSession>;
type Scope = { organisationId: string; environmentName: EnvironmentName };

export function sprint4ScopeFromSession(session: Sprint4Session): Scope {
  return { organisationId: session.organisation.id, environmentName: session.environment as EnvironmentName };
}

export function ensureSprint4ReceiveRole(session: Sprint4Session) {
  const role = session.membership.role.name;
  return role === "STAFF" || role === "SUPERVISOR" || role === "MANAGER" || role === "ADMINISTRATOR" || role === "OWNER";
}

export function ensureSprint4ExceptionRole(session: Sprint4Session) {
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

function nonNegativeNumber(value: unknown, label: string): number {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) throw new Error(`${label} must be zero or greater`);
  return numberValue;
}

async function nextReceiptNumber(scope: Scope) {
  const year = new Date().getUTCFullYear();
  const prefix = `RCV-${year}-`;
  const count = await prisma.inventoryReceivingBatch.count({ where: { ...scope } });
  return `${prefix}${String(count + 1).padStart(6, "0")}`;
}

async function getOrCreateDefaultLocation(scope: Scope, userId: string) {
  const existing = await prisma.inventoryLocation.findFirst({ where: { ...scope, code: "MAIN" } });
  if (existing) return existing;
  return prisma.inventoryLocation.create({ data: { ...scope, code: "MAIN", name: "Main Location", createdByUserId: userId, updatedByUserId: userId } });
}

async function currentQty(scope: Scope, itemId: string, locationId: string) {
  const balance = await prisma.inventoryStockBalance.findUnique({ where: { organisationId_environmentName_locationId_itemId: { ...scope, locationId, itemId } } });
  return Number(balance?.quantityOnHand ?? 0);
}

async function getReceivedByLine(scope: Scope, purchaseOrderId: string) {
  const batches = await prisma.inventoryReceivingBatch.findMany({ where: { ...scope, purchaseOrderId, status: { in: ["CONFIRMED", "DISCREPANCY_REPORTED"] } }, select: { id: true } });
  const batchIds = batches.map((batch) => batch.id);
  const received = new Map<string, number>();
  if (!batchIds.length) return received;
  const lines = await prisma.inventoryReceivingLine.findMany({ where: { ...scope, receivingBatchId: { in: batchIds } } });
  for (const line of lines) received.set(line.itemId, (received.get(line.itemId) ?? 0) + Number(line.quantityReceived));
  return received;
}

export async function listReceivablePurchaseOrders(session: Sprint4Session) {
  const scope = sprint4ScopeFromSession(session);
  const orders = await prisma.inventoryPurchaseOrder.findMany({ where: { ...scope, status: { in: ["APPROVED", "SENT", "PARTIALLY_RECEIVED"] } }, orderBy: { createdAt: "desc" }, take: 100 });
  const suppliers = await prisma.inventorySupplier.findMany({ where: scope, select: { id: true, supplierCode: true, name: true } });
  const supplierById = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
  return orders.map((order) => ({ id: order.id, orderNumber: order.orderNumber, status: order.status, supplierName: order.supplierId ? supplierById.get(order.supplierId)?.name ?? "Unknown supplier" : "No supplier", expectedDate: order.expectedDate?.toISOString() ?? null }));
}

export async function getReceivablePurchaseOrder(session: Sprint4Session, purchaseOrderId: string) {
  const scope = sprint4ScopeFromSession(session);
  const order = await prisma.inventoryPurchaseOrder.findFirst({ where: { ...scope, id: purchaseOrderId } });
  if (!order) throw new Error("Purchase order not found in this environment");
  if (!["APPROVED", "SENT", "PARTIALLY_RECEIVED"].includes(order.status)) throw new Error("Only approved, sent, or partially received purchase orders can be received");
  const [supplier, lines, receivedByItem] = await Promise.all([
    order.supplierId ? prisma.inventorySupplier.findFirst({ where: { ...scope, id: order.supplierId } }) : Promise.resolve(null),
    prisma.inventoryPurchaseOrderLine.findMany({ where: { ...scope, purchaseOrderId: order.id }, orderBy: { createdAt: "asc" } }),
    getReceivedByLine(scope, order.id)
  ]);
  const items = await prisma.inventoryItem.findMany({ where: { ...scope, id: { in: Array.from(new Set(lines.map((line) => line.itemId))) } } });
  const itemById = new Map(items.map((item) => [item.id, item]));
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    supplierName: supplier?.name ?? "No supplier",
    lines: lines.map((line) => {
      const item = itemById.get(line.itemId);
      const ordered = Number(line.quantityOrdered);
      const received = receivedByItem.get(line.itemId) ?? 0;
      return { itemId: line.itemId, sku: item?.sku ?? null, itemName: item?.name ?? null, quantityOrdered: ordered.toString(), quantityReceivedToDate: received.toString(), quantityRemaining: Math.max(ordered - received, 0).toString() };
    })
  };
}

export async function listReceivingHistory(session: Sprint4Session) {
  const scope = sprint4ScopeFromSession(session);
  const batches = await prisma.inventoryReceivingBatch.findMany({ where: scope, orderBy: { createdAt: "desc" }, take: 100 });
  const poIds = Array.from(new Set(batches.map((batch) => batch.purchaseOrderId).filter(Boolean))) as string[];
  const orders = poIds.length ? await prisma.inventoryPurchaseOrder.findMany({ where: { ...scope, id: { in: poIds } }, select: { id: true, orderNumber: true } }) : [];
  const orderById = new Map(orders.map((order) => [order.id, order]));
  return batches.map((batch) => ({ id: batch.id, receiptNumber: batch.receiptNumber, purchaseOrderId: batch.purchaseOrderId, orderNumber: batch.purchaseOrderId ? orderById.get(batch.purchaseOrderId)?.orderNumber ?? null : null, status: batch.status, confirmedAt: batch.confirmedAt?.toISOString() ?? null, createdAt: batch.createdAt.toISOString() }));
}

export async function createReceivingBatch(params: { request: Request; session: Sprint4Session; body: unknown }) {
  const scope = sprint4ScopeFromSession(params.session);
  const body = params.body as Record<string, unknown>;
  const purchaseOrderId = requireString(body.purchaseOrderId, "Purchase order");
  const rawLines = Array.isArray(body.lines) ? body.lines : [];
  if (!rawLines.length) throw new Error("At least one receipt line is required");
  const orderView = await getReceivablePurchaseOrder(params.session, purchaseOrderId);
  const remaining = new Map(orderView.lines.map((line) => [line.itemId, Number(line.quantityRemaining)]));
  const hasDiscrepancy = Boolean(body.hasDiscrepancy) || rawLines.some((raw) => Boolean((raw as Record<string, unknown>).discrepancyReason));
  const location = await getOrCreateDefaultLocation(scope, params.session.user.id);
  const receiptNumber = await nextReceiptNumber(scope);

  const normalised = rawLines.map((raw, index) => {
    const line = raw as Record<string, unknown>;
    const itemId = requireString(line.itemId, `Line ${index + 1} item`);
    const quantityReceived = nonNegativeNumber(line.quantityReceived ?? line.quantity, `Line ${index + 1} received quantity`);
    const expected = remaining.get(itemId);
    if (expected === undefined) throw new Error(`Line ${index + 1} is not on the selected purchase order`);
    if (quantityReceived > expected && !ensureSprint4ExceptionRole(params.session)) throw new Error("Manager, Administrator or Owner role required for over-delivery acceptance");
    return { itemId, quantityReceived, quantityExpected: expected, discrepancyReason: cleanString(line.discrepancyReason) };
  }).filter((line) => line.quantityReceived > 0 || line.discrepancyReason);

  if (!normalised.length) throw new Error("At least one received quantity or discrepancy is required");

  const result = await prisma.$transaction(async (tx) => {
    const batch = await tx.inventoryReceivingBatch.create({ data: { ...scope, purchaseOrderId, receiptNumber, status: hasDiscrepancy ? "DISCREPANCY_REPORTED" : "CONFIRMED", receivedByUserId: params.session.user.id, confirmedAt: new Date() } });
    for (const line of normalised) {
      await tx.inventoryReceivingLine.create({ data: { ...scope, receivingBatchId: batch.id, itemId: line.itemId, quantityExpected: line.quantityExpected.toString(), quantityReceived: line.quantityReceived.toString(), discrepancyReason: line.discrepancyReason } });
      if (line.quantityReceived > 0) {
        const before = await currentQty(scope, line.itemId, location.id);
        const after = before + line.quantityReceived;
        const movement = await tx.inventoryMovement.create({ data: { ...scope, itemId: line.itemId, locationId: location.id, movementType: "RECEIVING", quantityDelta: line.quantityReceived.toString(), quantityBefore: before.toString(), quantityAfter: after.toString(), referenceType: "RECEIVING", referenceId: batch.id, reason: `Receipt ${receiptNumber}`, createdByUserId: params.session.user.id } });
        await tx.inventoryStockBalance.upsert({ where: { organisationId_environmentName_locationId_itemId: { ...scope, locationId: location.id, itemId: line.itemId } }, create: { ...scope, locationId: location.id, itemId: line.itemId, quantityOnHand: after.toString(), lastMovementId: movement.id }, update: { quantityOnHand: after.toString(), lastMovementId: movement.id } });
      }
    }
    return batch;
  });

  const updatedView = await getReceivablePurchaseOrder(params.session, purchaseOrderId).catch(() => null);
  if (updatedView) {
    const fullyReceived = updatedView.lines.every((line) => Number(line.quantityRemaining) <= 0);
    const nextStatus: InventoryPurchaseOrderStatus = fullyReceived ? "RECEIVED" : "PARTIALLY_RECEIVED";
    await prisma.inventoryPurchaseOrder.update({ where: { id: purchaseOrderId }, data: { status: nextStatus, updatedByUserId: params.session.user.id } });
  }

  await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: hasDiscrepancy ? "RECEIPT_WITH_DISCREPANCY_CREATED" : "RECEIPT_CREATED", targetType: "InventoryReceivingBatch", targetId: result.id, metadata: { receiptNumber, purchaseOrderId, lineCount: normalised.length, stockMutationEnabled: true, mutationType: "RECEIVING" } });
  return { id: result.id, receiptNumber, status: result.status, purchaseOrderId };
}
