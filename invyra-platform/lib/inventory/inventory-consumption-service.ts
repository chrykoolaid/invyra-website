import { EnvironmentName } from "@prisma/client";
import type { CurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { auditLog } from "@/lib/audit/audit";

export type Sprint7Session = NonNullable<CurrentSession>;
type Scope = { organisationId: string; environmentName: EnvironmentName };

export function sprint7ScopeFromSession(session: Sprint7Session): Scope {
  return { organisationId: session.organisation.id, environmentName: session.environment as EnvironmentName };
}

export function ensureSprint7ConsumptionRole(session: Sprint7Session) {
  const role = session.membership.role.name;
  return role === "SUPERVISOR" || role === "MANAGER" || role === "ADMINISTRATOR" || role === "OWNER";
}

export function ensureSprint7ApprovalRole(session: Sprint7Session) {
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
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`${label} must be greater than zero`);
  return n;
}

function optionalPositiveNumber(value: unknown, label: string): number | null {
  if (value === undefined || value === null || value === "") return null;
  return positiveNumber(value, label);
}

async function nextConsumptionNumber(scope: Scope) {
  const year = new Date().getUTCFullYear();
  const count = await prisma.inventoryConsumptionEvent.count({ where: scope });
  return `CON-${year}-${String(count + 1).padStart(6, "0")}`;
}

async function getItem(scope: Scope, itemId: string) {
  const item = await prisma.inventoryItem.findFirst({ where: { ...scope, id: itemId } });
  if (!item) throw new Error("Item not found in this environment");
  if (item.status === "ARCHIVED") throw new Error("Archived items cannot be consumed");
  return item;
}

async function getLocation(scope: Scope, locationId: string) {
  const location = await prisma.inventoryLocation.findFirst({ where: { ...scope, id: locationId } });
  if (!location) throw new Error("Location not found in this environment");
  return location;
}

async function getQty(scope: Scope, itemId: string, locationId: string) {
  const balance = await prisma.inventoryStockBalance.findUnique({ where: { organisationId_environmentName_locationId_itemId: { ...scope, itemId, locationId } } });
  return Number(balance?.quantityOnHand ?? 0);
}

async function applyStoreUseMovement(tx: any, params: { scope: Scope; session: Sprint7Session; itemId: string; locationId: string; quantity: number; reason: string; referenceId: string }) {
  const beforeQty = await getQty(params.scope, params.itemId, params.locationId);
  const afterQty = beforeQty - params.quantity;
  if (afterQty < 0) throw new Error("Consumption would create negative stock");
  const movement = await tx.inventoryMovement.create({
    data: {
      ...params.scope,
      itemId: params.itemId,
      locationId: params.locationId,
      movementType: "STORE_USE",
      quantityDelta: (-params.quantity).toString(),
      quantityBefore: beforeQty.toString(),
      quantityAfter: afterQty.toString(),
      referenceType: "CONSUMPTION",
      referenceId: params.referenceId,
      reason: params.reason,
      createdByUserId: params.session.user.id
    }
  });
  await tx.inventoryStockBalance.upsert({
    where: { organisationId_environmentName_locationId_itemId: { ...params.scope, locationId: params.locationId, itemId: params.itemId } },
    create: { ...params.scope, locationId: params.locationId, itemId: params.itemId, quantityOnHand: afterQty.toString(), lastMovementId: movement.id },
    update: { quantityOnHand: afterQty.toString(), lastMovementId: movement.id }
  });
  return movement;
}

export async function listInventoryCostCenters(session: Sprint7Session) {
  const scope = sprint7ScopeFromSession(session);
  return prisma.inventoryCostCenter.findMany({ where: scope, orderBy: { name: "asc" }, take: 100 });
}

export async function createInventoryCostCenter(params: { request: Request; session: Sprint7Session; body: unknown }) {
  const scope = sprint7ScopeFromSession(params.session);
  const body = params.body as Record<string, unknown>;
  const name = requireString(body.name, "Cost center name");
  const code = (cleanString(body.code) ?? name).toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32);
  const costCenter = await prisma.inventoryCostCenter.create({ data: { ...scope, code, name, department: cleanString(body.department), createdByUserId: params.session.user.id, updatedByUserId: params.session.user.id } });
  await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: "COST_CENTER_CREATED", targetType: "InventoryCostCenter", targetId: costCenter.id, metadata: { code, name } });
  return costCenter;
}

export async function listInventoryConsumptionTemplates(session: Sprint7Session) {
  const scope = sprint7ScopeFromSession(session);
  const templates = await prisma.inventoryConsumptionTemplate.findMany({ where: scope, orderBy: { name: "asc" }, take: 100 });
  const ids = templates.map((template) => template.id);
  const lines = ids.length ? await prisma.inventoryConsumptionTemplateLine.findMany({ where: { ...scope, templateId: { in: ids } } }) : [];
  return templates.map((template) => ({ ...template, lines: lines.filter((line) => line.templateId === template.id) }));
}

export async function createInventoryConsumptionTemplate(params: { request: Request; session: Sprint7Session; body: unknown }) {
  const scope = sprint7ScopeFromSession(params.session);
  const body = params.body as Record<string, unknown>;
  const name = requireString(body.name, "Template name");
  const templateCode = (cleanString(body.templateCode) ?? name).toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 32);
  const lines = Array.isArray(body.lines) ? body.lines as Record<string, unknown>[] : [];
  if (!lines.length) throw new Error("At least one template line is required");
  for (const line of lines) await getItem(scope, requireString(line.itemId, "Template item"));
  const template = await prisma.$transaction(async (tx) => {
    const created = await tx.inventoryConsumptionTemplate.create({ data: { ...scope, templateCode, name, department: cleanString(body.department), costCenterId: cleanString(body.costCenterId), createdByUserId: params.session.user.id, updatedByUserId: params.session.user.id } });
    await tx.inventoryConsumptionTemplateLine.createMany({ data: lines.map((line) => ({ ...scope, templateId: created.id, itemId: requireString(line.itemId, "Template item"), quantity: positiveNumber(line.quantity, "Quantity").toString(), unitOfMeasure: cleanString(line.unitOfMeasure) })) });
    return created;
  });
  await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: "CONSUMPTION_TEMPLATE_CREATED", targetType: "InventoryConsumptionTemplate", targetId: template.id, metadata: { templateCode, name, lineCount: lines.length } });
  return template;
}

export async function listInventoryConsumptionEvents(session: Sprint7Session) {
  const scope = sprint7ScopeFromSession(session);
  const events = await prisma.inventoryConsumptionEvent.findMany({ where: scope, orderBy: { createdAt: "desc" }, take: 100 });
  const eventIds = events.map((event) => event.id);
  const [lines, costCenters, locations] = await Promise.all([
    eventIds.length ? prisma.inventoryConsumptionLine.findMany({ where: { ...scope, consumptionEventId: { in: eventIds } } }) : [],
    prisma.inventoryCostCenter.findMany({ where: scope, select: { id: true, name: true, code: true } }),
    prisma.inventoryLocation.findMany({ where: scope, select: { id: true, name: true, code: true } })
  ]);
  const cc = new Map(costCenters.map((item) => [item.id, item]));
  const loc = new Map(locations.map((item) => [item.id, item]));
  return events.map((event) => ({
    id: event.id,
    consumptionNumber: event.consumptionNumber,
    status: event.status,
    sourceType: event.sourceType,
    costCenter: event.costCenterId ? cc.get(event.costCenterId)?.name ?? null : null,
    location: loc.get(event.locationId)?.name ?? null,
    department: event.department,
    reason: event.reason,
    totalCost: event.totalCost?.toString() ?? null,
    lineCount: lines.filter((line) => line.consumptionEventId === event.id).length,
    createdAt: event.createdAt.toISOString()
  }));
}

export async function createInventoryConsumptionEvent(params: { request: Request; session: Sprint7Session; body: unknown }) {
  const scope = sprint7ScopeFromSession(params.session);
  const body = params.body as Record<string, unknown>;
  const locationId = requireString(body.locationId, "Location");
  const reason = requireString(body.reason, "Reason");
  await getLocation(scope, locationId);
  const sourceType = cleanString(body.sourceType) ?? (body.templateId ? "TEMPLATE" : "MANUAL");
  let lines = Array.isArray(body.lines) ? body.lines as Record<string, unknown>[] : [];
  const templateId = cleanString(body.templateId);
  if (templateId && !lines.length) {
    const templateLines = await prisma.inventoryConsumptionTemplateLine.findMany({ where: { ...scope, templateId } });
    lines = templateLines.map((line) => ({ itemId: line.itemId, quantity: line.quantity.toString(), unitOfMeasure: line.unitOfMeasure }));
  }
  if (!lines.length) throw new Error("At least one consumption line is required");
  for (const line of lines) await getItem(scope, requireString(line.itemId, "Consumption item"));
  const consumptionNumber = await nextConsumptionNumber(scope);
  const result = await prisma.$transaction(async (tx) => {
    const event = await tx.inventoryConsumptionEvent.create({ data: { ...scope, consumptionNumber, sourceType, templateId, costCenterId: cleanString(body.costCenterId), department: cleanString(body.department), locationId, reason, createdByUserId: params.session.user.id } });
    let totalCost = 0;
    for (const line of lines) {
      const itemId = requireString(line.itemId, "Consumption item");
      const quantity = positiveNumber(line.quantity, "Quantity");
      const unitCost = optionalPositiveNumber(line.unitCost, "Unit cost");
      const lineCost = unitCost === null ? null : unitCost * quantity;
      if (lineCost !== null) totalCost += lineCost;
      const movement = await applyStoreUseMovement(tx, { scope, session: params.session, itemId, locationId, quantity, reason, referenceId: event.id });
      await tx.inventoryConsumptionLine.create({ data: { ...scope, consumptionEventId: event.id, itemId, quantity: quantity.toString(), unitCost: unitCost === null ? null : unitCost.toString(), lineCost: lineCost === null ? null : lineCost.toString(), movementId: movement.id } });
    }
    return tx.inventoryConsumptionEvent.update({ where: { id: event.id }, data: { totalCost: totalCost ? totalCost.toString() : null } });
  });
  await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: sourceType === "TEMPLATE" ? "CONSUMPTION_TEMPLATE_EXECUTED" : "MANUAL_CONSUMPTION_RECORDED", targetType: "InventoryConsumptionEvent", targetId: result.id, metadata: { consumptionNumber, sourceType, locationId, lineCount: lines.length } });
  return result;
}

export async function getConsumptionDashboard(session: Sprint7Session) {
  const scope = sprint7ScopeFromSession(session);
  const [events, lineCount, costCenters, templates] = await Promise.all([
    prisma.inventoryConsumptionEvent.findMany({ where: scope, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.inventoryConsumptionLine.count({ where: scope }),
    prisma.inventoryCostCenter.count({ where: scope }),
    prisma.inventoryConsumptionTemplate.count({ where: scope })
  ]);
  const totalCost = events.reduce((sum, event) => sum + Number(event.totalCost ?? 0), 0);
  return { eventCount: events.length, lineCount, costCenterCount: costCenters, templateCount: templates, totalCost: totalCost.toFixed(2), ledgerRule: "Internal consumption reduces stock only through STORE_USE ledger movements." };
}
