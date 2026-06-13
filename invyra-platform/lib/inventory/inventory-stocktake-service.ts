import { EnvironmentName } from "@prisma/client";
import type { CurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { auditLog } from "@/lib/audit/audit";

type Sprint8Session = NonNullable<CurrentSession>;
type Scope = { organisationId: string; environmentName: EnvironmentName };

type StocktakeAction = "start" | "submit" | "approve" | "reconcile" | "cancel";

export function sprint8ScopeFromSession(session: Sprint8Session): Scope {
  return { organisationId: session.organisation.id, environmentName: session.environment as EnvironmentName };
}

export function ensureSprint8CountRole(session: Sprint8Session) {
  const role = session.membership.role.name;
  return role === "SUPERVISOR" || role === "MANAGER" || role === "ADMINISTRATOR" || role === "OWNER";
}

export function ensureSprint8ApprovalRole(session: Sprint8Session) {
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

function numeric(value: unknown, label: string, allowZero = true): number {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue) || (!allowZero && numberValue <= 0)) throw new Error(`${label} must be numeric`);
  return numberValue;
}

async function nextStocktakeNumber(scope: Scope) {
  const year = new Date().getUTCFullYear();
  const count = await prisma.inventoryStocktake.count({ where: scope as any });
  return `STK-${year}-${String(count + 1).padStart(6, "0")}`;
}

async function getLocation(scope: Scope, locationId: string) {
  const location = await prisma.inventoryLocation.findFirst({ where: { ...scope, id: locationId } as any });
  if (!location) throw new Error("Stocktake location not found in this environment");
  return location;
}

async function getItem(scope: Scope, itemId: string) {
  const item = await prisma.inventoryItem.findFirst({ where: { ...scope, id: itemId } as any });
  if (!item) throw new Error("Stocktake item not found in this environment");
  if (item.status === "ARCHIVED") throw new Error("Archived items cannot be counted in stocktakes");
  return item;
}

async function currentQty(scope: Scope, itemId: string, locationId: string) {
  const balance = await prisma.inventoryStockBalance.findUnique({
    where: { organisationId_environmentName_locationId_itemId: { ...scope, locationId, itemId } as any }
  });
  return Number(balance?.quantityOnHand ?? 0);
}

async function applyStocktakeAdjustment(tx: any, params: {
  scope: Scope;
  session: Sprint8Session;
  itemId: string;
  locationId: string;
  varianceQty: number;
  stocktakeId: string;
  reason?: string | null;
}) {
  if (params.varianceQty === 0) return null;
  const beforeQty = await currentQty(params.scope, params.itemId, params.locationId);
  const afterQty = beforeQty + params.varianceQty;
  if (afterQty < 0) throw new Error("Stocktake reconciliation would create negative stock");
  const movement = await tx.inventoryMovement.create({
    data: {
      ...params.scope,
      itemId: params.itemId,
      locationId: params.locationId,
      movementType: "STOCKTAKE_ADJUSTMENT",
      quantityDelta: params.varianceQty.toString(),
      quantityBefore: beforeQty.toString(),
      quantityAfter: afterQty.toString(),
      referenceType: "STOCKTAKE",
      referenceId: params.stocktakeId,
      reason: params.reason ?? "Stocktake reconciliation",
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

export async function listInventoryStocktakes(session: Sprint8Session) {
  const scope = sprint8ScopeFromSession(session);
  const stocktakes = await prisma.inventoryStocktake.findMany({ where: scope as any, orderBy: { createdAt: "desc" }, take: 100 });
  const ids = stocktakes.map((stocktake) => stocktake.id);
  const locationIds = Array.from(new Set(stocktakes.map((stocktake) => stocktake.locationId).filter(Boolean))) as string[];
  const [lines, locations] = await Promise.all([
    ids.length ? prisma.inventoryStocktakeLine.findMany({ where: { ...scope, stocktakeId: { in: ids } } as any }) : [],
    locationIds.length ? prisma.inventoryLocation.findMany({ where: { ...scope, id: { in: locationIds } } as any, select: { id: true, code: true, name: true } }) : []
  ]);
  const locationById = new Map(locations.map((location) => [location.id, location]));
  return stocktakes.map((stocktake) => {
    const stocktakeLines = lines.filter((line) => line.stocktakeId === stocktake.id);
    const varianceLines = stocktakeLines.filter((line) => Number(line.varianceQty ?? 0) !== 0).length;
    return {
      id: stocktake.id,
      stocktakeNumber: stocktake.stocktakeNumber,
      stocktakeType: stocktake.stocktakeType,
      status: stocktake.status,
      blindCount: stocktake.blindCount,
      locationName: stocktake.locationId ? locationById.get(stocktake.locationId)?.name ?? null : "All locations",
      lineCount: stocktakeLines.length,
      varianceLines,
      submittedAt: stocktake.submittedAt?.toISOString() ?? null,
      reconciledAt: stocktake.reconciledAt?.toISOString() ?? null,
      createdAt: stocktake.createdAt.toISOString()
    };
  });
}

export async function createInventoryStocktake(params: { request: Request; session: Sprint8Session; body: unknown }) {
  const scope = sprint8ScopeFromSession(params.session);
  const body = params.body as Record<string, unknown>;
  const locationId = cleanString(body.locationId);
  if (locationId) await getLocation(scope, locationId);
  const stocktakeType = (cleanString(body.stocktakeType)?.toUpperCase() ?? (body.blindCount ? "BLIND" : "CYCLE")) as any;
  const stocktakeNumber = await nextStocktakeNumber(scope);
  const rawLines = Array.isArray(body.lines) ? body.lines as Record<string, unknown>[] : [];
  if (!rawLines.length) throw new Error("At least one stocktake line is required");

  const preparedLines = [];
  for (const line of rawLines) {
    const itemId = requireString(line.itemId, "Stocktake item");
    const lineLocationId = cleanString(line.locationId) ?? locationId;
    if (!lineLocationId) throw new Error("Line location is required when the stocktake has no header location");
    await getItem(scope, itemId);
    await getLocation(scope, lineLocationId);
    const expectedQty = await currentQty(scope, itemId, lineLocationId);
    const countedQty = line.countedQty === undefined || line.countedQty === null || line.countedQty === "" ? null : numeric(line.countedQty, "Counted quantity");
    const varianceQty = countedQty === null ? null : countedQty - expectedQty;
    const unitCost = line.unitCost === undefined || line.unitCost === null || line.unitCost === "" ? null : numeric(line.unitCost, "Unit cost");
    preparedLines.push({
      itemId,
      locationId: lineLocationId,
      expectedQty,
      countedQty,
      varianceQty,
      unitCost,
      varianceValue: varianceQty === null || unitCost === null ? null : varianceQty * unitCost,
      reason: cleanString(line.reason)
    });
  }

  const created = await prisma.$transaction(async (tx) => {
    const stocktake = await tx.inventoryStocktake.create({
      data: {
        ...scope,
        stocktakeNumber,
        stocktakeType,
        status: "DRAFT",
        locationId,
        blindCount: Boolean(body.blindCount) || stocktakeType === "BLIND",
        notes: cleanString(body.notes),
        createdByUserId: params.session.user.id
      }
    });
    await tx.inventoryStocktakeLine.createMany({
      data: preparedLines.map((line) => ({
        ...scope,
        stocktakeId: stocktake.id,
        itemId: line.itemId,
        locationId: line.locationId,
        expectedQty: line.expectedQty.toString(),
        countedQty: line.countedQty === null ? null : line.countedQty.toString(),
        varianceQty: line.varianceQty === null ? null : line.varianceQty.toString(),
        unitCost: line.unitCost === null ? null : line.unitCost.toString(),
        varianceValue: line.varianceValue === null ? null : line.varianceValue.toString(),
        status: line.countedQty === null ? "UNCOUNTED" : (line.varianceQty === 0 ? "COUNTED" : "VARIANCE_REVIEW"),
        reason: line.reason,
        countedByUserId: line.countedQty === null ? null : params.session.user.id
      }))
    });
    return stocktake;
  });

  await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: "STOCKTAKE_CREATED", targetType: "InventoryStocktake", targetId: created.id, metadata: { stocktakeNumber, stocktakeType, lineCount: preparedLines.length } });
  return created;
}

export async function transitionInventoryStocktake(params: { request: Request; session: Sprint8Session; id: string; action: StocktakeAction; body?: unknown }) {
  const scope = sprint8ScopeFromSession(params.session);
  const stocktake = await prisma.inventoryStocktake.findFirst({ where: { ...scope, id: params.id } as any });
  if (!stocktake) throw new Error("Stocktake not found in this environment");

  const updates: Record<string, unknown> = {};
  let auditAction = "STOCKTAKE_UPDATED";
  if (params.action === "start") {
    if (stocktake.status !== "DRAFT") throw new Error("Only draft stocktakes can be started");
    updates.status = "IN_PROGRESS";
    auditAction = "STOCKTAKE_STARTED";
  }
  if (params.action === "submit") {
    if (!["DRAFT", "IN_PROGRESS"].includes(stocktake.status)) throw new Error("Only draft or in-progress stocktakes can be submitted");
    const uncounted = await prisma.inventoryStocktakeLine.count({ where: { ...scope, stocktakeId: stocktake.id, countedQty: null } as any });
    if (uncounted) throw new Error("All stocktake lines must be counted before submit");
    updates.status = "SUBMITTED";
    updates.submittedAt = new Date();
    auditAction = "STOCKTAKE_SUBMITTED";
  }
  if (params.action === "approve") {
    if (stocktake.status !== "SUBMITTED") throw new Error("Only submitted stocktakes can be approved");
    updates.status = "APPROVED";
    updates.approvedAt = new Date();
    updates.approvedByUserId = params.session.user.id;
    auditAction = "STOCKTAKE_APPROVED";
  }
  if (params.action === "cancel") {
    if (["RECONCILED", "CANCELLED"].includes(stocktake.status)) throw new Error("Reconciled or cancelled stocktakes cannot be cancelled");
    updates.status = "CANCELLED";
    updates.cancelledAt = new Date();
    auditAction = "STOCKTAKE_CANCELLED";
  }
  if (params.action !== "reconcile") {
    const updated = await prisma.inventoryStocktake.update({ where: { id: stocktake.id }, data: updates as any });
    await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: auditAction, targetType: "InventoryStocktake", targetId: updated.id, metadata: { stocktakeNumber: updated.stocktakeNumber, status: updated.status } });
    return updated;
  }

  if (stocktake.status !== "APPROVED") throw new Error("Only approved stocktakes can be reconciled");
  const reconciled = await prisma.$transaction(async (tx) => {
    const lines = await tx.inventoryStocktakeLine.findMany({ where: { ...scope, stocktakeId: stocktake.id } });
    for (const line of lines) {
      const varianceQty = Number(line.varianceQty ?? 0);
      const movement = await applyStocktakeAdjustment(tx, { scope, session: params.session, itemId: line.itemId, locationId: line.locationId, varianceQty, stocktakeId: stocktake.id, reason: line.reason });
      await tx.inventoryStocktakeLine.update({ where: { id: line.id }, data: { status: "POSTED", movementId: movement?.id ?? null, reviewedByUserId: params.session.user.id } });
    }
    return tx.inventoryStocktake.update({ where: { id: stocktake.id }, data: { status: "RECONCILED", reconciledAt: new Date(), reconciledByUserId: params.session.user.id } });
  });
  await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: "STOCKTAKE_RECONCILED", targetType: "InventoryStocktake", targetId: reconciled.id, metadata: { stocktakeNumber: reconciled.stocktakeNumber } });
  return reconciled;
}

export async function getStocktakeDashboard(session: Sprint8Session) {
  const scope = sprint8ScopeFromSession(session);
  const [stocktakes, lines, pendingVariance, reconciled] = await Promise.all([
    prisma.inventoryStocktake.count({ where: scope as any }),
    prisma.inventoryStocktakeLine.count({ where: scope as any }),
    prisma.inventoryStocktakeLine.count({ where: { ...scope, status: "VARIANCE_REVIEW" } as any }),
    prisma.inventoryStocktake.count({ where: { ...scope, status: "RECONCILED" } as any })
  ]);
  return { stocktakes, lines, pendingVariance, reconciled, ledgerRule: "Only reconciliation posts STOCKTAKE_ADJUSTMENT movements." };
}
