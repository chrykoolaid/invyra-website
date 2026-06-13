import { EnvironmentName, InventoryPurchaseOrderStatus } from "@prisma/client";
import type { CurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { auditLog } from "@/lib/audit/audit";

export type Sprint3Session = NonNullable<CurrentSession>;

type Scope = { organisationId: string; environmentName: EnvironmentName };

export function sprint3ScopeFromSession(session: Sprint3Session): Scope {
  return { organisationId: session.organisation.id, environmentName: session.environment as EnvironmentName };
}

export function ensureSprint3CreateRole(session: Sprint3Session) {
  const role = session.membership.role.name;
  return role === "SUPERVISOR" || role === "MANAGER" || role === "ADMINISTRATOR" || role === "OWNER";
}

export function ensureSprint3ApproveRole(session: Sprint3Session) {
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

function requirePositiveNumber(value: unknown, label: string): number {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) throw new Error(`${label} must be greater than zero`);
  return numberValue;
}

function optionalDate(value: unknown): Date | null {
  const text = cleanString(value);
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) throw new Error("Expected date is invalid");
  return date;
}

async function nextPurchaseOrderNumber(scope: Scope) {
  const year = new Date().getUTCFullYear();
  const prefix = `PO-${year}-`;
  const count = await prisma.inventoryPurchaseOrder.count({ where: { ...scope, orderNumber: { startsWith: prefix } } });
  return `${prefix}${String(count + 1).padStart(6, "0")}`;
}

async function ensureSupplier(scope: Scope, supplierId: string) {
  const supplier = await prisma.inventorySupplier.findFirst({ where: { ...scope, id: supplierId } });
  if (!supplier) throw new Error("Supplier not found in this environment");
  if (supplier.status === "ARCHIVED") throw new Error("Archived suppliers cannot be used on purchase orders");
  return supplier;
}

async function ensureItem(scope: Scope, itemId: string) {
  const item = await prisma.inventoryItem.findFirst({ where: { ...scope, id: itemId } });
  if (!item) throw new Error("Item not found in this environment");
  if (item.status === "ARCHIVED") throw new Error("Archived items cannot be ordered");
  return item;
}

function normaliseLines(body: Record<string, unknown>) {
  const rawLines = Array.isArray(body.lines) ? body.lines : [];
  if (!rawLines.length) throw new Error("At least one purchase order line is required");
  return rawLines.map((raw, index) => {
    const line = raw as Record<string, unknown>;
    return {
      itemId: requireString(line.itemId, `Line ${index + 1} item`),
      quantityOrdered: requirePositiveNumber(line.quantityOrdered ?? line.quantity, `Line ${index + 1} quantity`),
      unitCost: line.unitCost === undefined || line.unitCost === null || line.unitCost === "" ? null : requirePositiveNumber(line.unitCost, `Line ${index + 1} unit cost`)
    };
  });
}

export async function listPurchaseOrders(session: Sprint3Session) {
  const scope = sprint3ScopeFromSession(session);
  const [orders, suppliers] = await Promise.all([
    prisma.inventoryPurchaseOrder.findMany({ where: scope, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.inventorySupplier.findMany({ where: scope, select: { id: true, supplierCode: true, name: true } })
  ]);
  const supplierById = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
  const orderIds = orders.map((order) => order.id);
  const lines = orderIds.length
    ? await prisma.inventoryPurchaseOrderLine.findMany({ where: { ...scope, purchaseOrderId: { in: orderIds } } })
    : [];
  const lineCounts = new Map<string, number>();
  const totals = new Map<string, number>();
  for (const line of lines) {
    lineCounts.set(line.purchaseOrderId, (lineCounts.get(line.purchaseOrderId) ?? 0) + 1);
    const qty = Number(line.quantityOrdered);
    const cost = line.unitCost === null ? 0 : Number(line.unitCost);
    totals.set(line.purchaseOrderId, (totals.get(line.purchaseOrderId) ?? 0) + qty * cost);
  }
  return orders.map((order) => {
    const supplier = order.supplierId ? supplierById.get(order.supplierId) : null;
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      supplierId: order.supplierId,
      supplierCode: supplier?.supplierCode ?? null,
      supplierName: supplier?.name ?? "No supplier selected",
      expectedDate: order.expectedDate?.toISOString() ?? null,
      notes: order.notes,
      lineCount: lineCounts.get(order.id) ?? 0,
      expectedTotal: (totals.get(order.id) ?? 0).toFixed(2),
      createdAt: order.createdAt.toISOString(),
      submittedAt: order.submittedAt?.toISOString() ?? null,
      approvedAt: order.approvedAt?.toISOString() ?? null,
      sentAt: order.sentAt?.toISOString() ?? null,
      stockMutationEnabled: false
    };
  });
}

export async function getPurchaseOrder(session: Sprint3Session, id: string) {
  const scope = sprint3ScopeFromSession(session);
  const order = await prisma.inventoryPurchaseOrder.findFirst({ where: { ...scope, id } });
  if (!order) throw new Error("Purchase order not found in this environment");
  const [supplier, lines] = await Promise.all([
    order.supplierId ? prisma.inventorySupplier.findFirst({ where: { ...scope, id: order.supplierId } }) : Promise.resolve(null),
    prisma.inventoryPurchaseOrderLine.findMany({ where: { ...scope, purchaseOrderId: order.id }, orderBy: { createdAt: "asc" } })
  ]);
  const items = await prisma.inventoryItem.findMany({ where: { ...scope, id: { in: Array.from(new Set(lines.map((line) => line.itemId))) } } });
  const itemById = new Map(items.map((item) => [item.id, item]));
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    supplier: supplier ? { id: supplier.id, supplierCode: supplier.supplierCode, name: supplier.name, contactName: supplier.contactName, phone: supplier.phone, email: supplier.email } : null,
    expectedDate: order.expectedDate?.toISOString() ?? null,
    notes: order.notes,
    createdAt: order.createdAt.toISOString(),
    lines: lines.map((line) => {
      const item = itemById.get(line.itemId);
      const qty = Number(line.quantityOrdered);
      const cost = line.unitCost === null ? null : Number(line.unitCost);
      return {
        id: line.id,
        itemId: line.itemId,
        sku: item?.sku ?? null,
        itemName: item?.name ?? null,
        quantityOrdered: qty.toString(),
        unitCost: cost === null ? null : cost.toFixed(2),
        lineTotal: cost === null ? null : (qty * cost).toFixed(2)
      };
    }),
    stockMutationEnabled: false
  };
}

async function replacePurchaseOrderLines(scope: Scope, orderId: string, lines: ReturnType<typeof normaliseLines>) {
  for (const line of lines) await ensureItem(scope, line.itemId);
  await prisma.inventoryPurchaseOrderLine.deleteMany({ where: { ...scope, purchaseOrderId: orderId } });
  await prisma.inventoryPurchaseOrderLine.createMany({
    data: lines.map((line) => ({
      ...scope,
      purchaseOrderId: orderId,
      itemId: line.itemId,
      quantityOrdered: line.quantityOrdered.toString(),
      unitCost: line.unitCost === null ? null : line.unitCost.toString()
    }))
  });
}

export async function createPurchaseOrder(params: { request: Request; session: Sprint3Session; body: unknown }) {
  const scope = sprint3ScopeFromSession(params.session);
  const body = params.body as Record<string, unknown>;
  const supplierId = requireString(body.supplierId, "Supplier");
  const supplier = await ensureSupplier(scope, supplierId);
  const lines = normaliseLines(body);
  for (const line of lines) await ensureItem(scope, line.itemId);
  const orderNumber = cleanString(body.orderNumber) ?? await nextPurchaseOrderNumber(scope);
  const duplicate = await prisma.inventoryPurchaseOrder.findUnique({ where: { organisationId_environmentName_orderNumber: { ...scope, orderNumber } } });
  if (duplicate) throw new Error("Purchase order number already exists in this environment");

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.inventoryPurchaseOrder.create({
      data: {
        ...scope,
        orderNumber,
        supplierId: supplier.id,
        expectedDate: optionalDate(body.expectedDate),
        notes: cleanString(body.notes),
        status: "DRAFT",
        createdByUserId: params.session.user.id,
        updatedByUserId: params.session.user.id
      }
    });
    await tx.inventoryPurchaseOrderLine.createMany({
      data: lines.map((line) => ({
        ...scope,
        purchaseOrderId: created.id,
        itemId: line.itemId,
        quantityOrdered: line.quantityOrdered.toString(),
        unitCost: line.unitCost === null ? null : line.unitCost.toString()
      }))
    });
    return created;
  });

  await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: "PO_CREATED", targetType: "InventoryPurchaseOrder", targetId: order.id, metadata: { orderNumber, supplierId: supplier.id, lineCount: lines.length, stockMutationEnabled: false } });
  return getPurchaseOrder(params.session, order.id);
}

export async function updatePurchaseOrder(params: { request: Request; session: Sprint3Session; id: string; body: unknown }) {
  const scope = sprint3ScopeFromSession(params.session);
  const body = params.body as Record<string, unknown>;
  const existing = await prisma.inventoryPurchaseOrder.findFirst({ where: { ...scope, id: params.id } });
  if (!existing) throw new Error("Purchase order not found in this environment");
  if (existing.status !== "DRAFT") throw new Error("Only draft purchase orders can be edited");
  const supplierId = cleanString(body.supplierId) ?? existing.supplierId;
  if (!supplierId) throw new Error("Supplier is required");
  await ensureSupplier(scope, supplierId);
  const lines = Array.isArray(body.lines) ? normaliseLines(body) : null;

  await prisma.$transaction(async (tx) => {
    await tx.inventoryPurchaseOrder.update({
      where: { id: existing.id },
      data: {
        supplierId,
        expectedDate: body.expectedDate === undefined ? existing.expectedDate : optionalDate(body.expectedDate),
        notes: body.notes === undefined ? existing.notes : cleanString(body.notes),
        updatedByUserId: params.session.user.id
      }
    });
  });
  if (lines) await replacePurchaseOrderLines(scope, existing.id, lines);
  await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: "PO_UPDATED", targetType: "InventoryPurchaseOrder", targetId: existing.id, metadata: { orderNumber: existing.orderNumber, stockMutationEnabled: false } });
  return getPurchaseOrder(params.session, existing.id);
}

export async function transitionPurchaseOrder(params: { request: Request; session: Sprint3Session; id: string; action: "submit" | "approve" | "send" | "cancel" }) {
  const scope = sprint3ScopeFromSession(params.session);
  const existing = await prisma.inventoryPurchaseOrder.findFirst({ where: { ...scope, id: params.id } });
  if (!existing) throw new Error("Purchase order not found in this environment");
  const now = new Date();
  let status: InventoryPurchaseOrderStatus;
  let auditAction: string;
  let data: Record<string, unknown> = { updatedByUserId: params.session.user.id };

  if (params.action === "submit") {
    if (existing.status !== "DRAFT") throw new Error("Only draft purchase orders can be submitted");
    status = "SUBMITTED";
    auditAction = "PO_SUBMITTED";
    data = { ...data, status, submittedAt: now };
  } else if (params.action === "approve") {
    if (!ensureSprint3ApproveRole(params.session)) throw new Error("Manager, Administrator or Owner role required");
    if (existing.status !== "SUBMITTED") throw new Error("Only submitted purchase orders can be approved");
    status = "APPROVED";
    auditAction = "PO_APPROVED";
    data = { ...data, status, approvedAt: now };
  } else if (params.action === "send") {
    if (!ensureSprint3ApproveRole(params.session)) throw new Error("Manager, Administrator or Owner role required");
    if (existing.status !== "APPROVED") throw new Error("Only approved purchase orders can be sent");
    status = "SENT";
    auditAction = "PO_SENT";
    data = { ...data, status, sentAt: now };
  } else {
    if (existing.status === "PARTIALLY_RECEIVED" || existing.status === "RECEIVED") throw new Error("Received purchase orders cannot be cancelled in Sprint 3");
    status = "CANCELLED";
    auditAction = "PO_CANCELLED";
    data = { ...data, status, cancelledAt: now };
  }

  const updated = await prisma.inventoryPurchaseOrder.update({ where: { id: existing.id }, data });
  await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: auditAction, targetType: "InventoryPurchaseOrder", targetId: updated.id, metadata: { orderNumber: updated.orderNumber, statusBefore: existing.status, statusAfter: updated.status, stockMutationEnabled: false } });
  return getPurchaseOrder(params.session, updated.id);
}
