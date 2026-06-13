import { EnvironmentName, InventoryMovementType } from "@prisma/client";
import type { CurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { auditLog } from "@/lib/audit/audit";

export type Sprint2Session = NonNullable<CurrentSession>;

export function sprint2ScopeFromSession(session: Sprint2Session) {
  return { organisationId: session.organisation.id, environmentName: session.environment as EnvironmentName };
}

export function ensureSprint2TransactionRole(session: Sprint2Session) {
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

function requireNonZeroNumber(value: unknown, label: string): number {
  const numberValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numberValue) || numberValue === 0) throw new Error(`${label} must be a non-zero number`);
  return numberValue;
}

async function getOrCreateDefaultLocation(scope: { organisationId: string; environmentName: EnvironmentName }, userId: string) {
  const existing = await prisma.inventoryLocation.findFirst({
    where: { ...scope, code: "MAIN" }
  });
  if (existing) return existing;
  return prisma.inventoryLocation.create({
    data: {
      ...scope,
      code: "MAIN",
      name: "Main Location",
      createdByUserId: userId,
      updatedByUserId: userId
    }
  });
}

async function resolveLocation(scope: { organisationId: string; environmentName: EnvironmentName }, userId: string, locationId?: string | null) {
  if (locationId) {
    const existing = await prisma.inventoryLocation.findFirst({ where: { ...scope, id: locationId } });
    if (!existing) throw new Error("Location not found in this environment");
    return existing;
  }
  return getOrCreateDefaultLocation(scope, userId);
}

async function getItem(scope: { organisationId: string; environmentName: EnvironmentName }, itemId: string) {
  const item = await prisma.inventoryItem.findFirst({ where: { ...scope, id: itemId } });
  if (!item) throw new Error("Item not found in this environment");
  if (item.status === "ARCHIVED") throw new Error("Archived items cannot receive stock movements");
  return item;
}

async function getCurrentQuantity(scope: { organisationId: string; environmentName: EnvironmentName }, itemId: string, locationId: string) {
  const balance = await prisma.inventoryStockBalance.findUnique({
    where: { organisationId_environmentName_locationId_itemId: { ...scope, locationId, itemId } }
  });
  return Number(balance?.quantityOnHand ?? 0);
}

export async function listInventoryStockBalances(params: { session: Sprint2Session }) {
  const scope = sprint2ScopeFromSession(params.session);
  const balances = await prisma.inventoryStockBalance.findMany({
    where: scope,
    orderBy: { updatedAt: "desc" },
    take: 100
  });
  const itemIds = Array.from(new Set(balances.map((balance) => balance.itemId)));
  const locationIds = Array.from(new Set(balances.map((balance) => balance.locationId)));

  const [items, locations] = await Promise.all([
    itemIds.length ? prisma.inventoryItem.findMany({ where: { ...scope, id: { in: itemIds } }, select: { id: true, sku: true, name: true, unitOfMeasure: true } }) : Promise.resolve([]),
    locationIds.length ? prisma.inventoryLocation.findMany({ where: { ...scope, id: { in: locationIds } }, select: { id: true, code: true, name: true } }) : Promise.resolve([])
  ]);

  const itemById = new Map(items.map((item) => [item.id, item]));
  const locationById = new Map(locations.map((location) => [location.id, location]));

  return balances.map((balance) => {
    const item = itemById.get(balance.itemId);
    const location = locationById.get(balance.locationId);
    return {
      id: balance.id,
      itemId: balance.itemId,
      itemSku: item?.sku ?? null,
      itemName: item?.name ?? null,
      unitOfMeasure: item?.unitOfMeasure ?? null,
      locationId: balance.locationId,
      locationCode: location?.code ?? null,
      locationName: location?.name ?? null,
      quantityOnHand: balance.quantityOnHand.toString(),
      lastMovementId: balance.lastMovementId,
      updatedAt: balance.updatedAt.toISOString()
    };
  });
}

async function postMovement(params: {
  request: Request;
  session: Sprint2Session;
  itemId: string;
  locationId?: string | null;
  quantityDelta: number;
  movementType: InventoryMovementType;
  reason?: string | null;
  referenceType: string;
}) {
  const scope = sprint2ScopeFromSession(params.session);
  const item = await getItem(scope, params.itemId);
  const location = await resolveLocation(scope, params.session.user.id, params.locationId ?? null);
  const beforeQty = await getCurrentQuantity(scope, item.id, location.id);
  const afterQty = beforeQty + params.quantityDelta;
  if (afterQty < 0) throw new Error("Movement would create negative stock");

  const movement = await prisma.$transaction(async (tx) => {
    const createdMovement = await tx.inventoryMovement.create({
      data: {
        ...scope,
        itemId: item.id,
        locationId: location.id,
        movementType: params.movementType,
        quantityDelta: params.quantityDelta.toString(),
        quantityBefore: beforeQty.toString(),
        quantityAfter: afterQty.toString(),
        referenceType: params.referenceType,
        reason: params.reason ?? null,
        createdByUserId: params.session.user.id
      }
    });

    await tx.inventoryStockBalance.upsert({
      where: { organisationId_environmentName_locationId_itemId: { ...scope, locationId: location.id, itemId: item.id } },
      create: { ...scope, locationId: location.id, itemId: item.id, quantityOnHand: afterQty.toString(), lastMovementId: createdMovement.id },
      update: { quantityOnHand: afterQty.toString(), lastMovementId: createdMovement.id }
    });

    return createdMovement;
  });

  await auditLog({
    request: params.request,
    organisationId: scope.organisationId,
    userId: params.session.user.id,
    environment: scope.environmentName,
    module: "INVENTORY",
    action: params.movementType === "OPENING_BALANCE" ? "OPENING_BALANCE_CREATED" : "STOCK_ADJUSTMENT_CREATED",
    targetType: "InventoryMovement",
    targetId: movement.id,
    metadata: {
      itemId: item.id,
      sku: item.sku,
      locationId: location.id,
      quantityBefore: beforeQty,
      quantityDelta: params.quantityDelta,
      quantityAfter: afterQty,
      reason: params.reason ?? null
    }
  });

  return movement;
}

export async function createOpeningBalance(params: { request: Request; session: Sprint2Session; body: unknown }) {
  const body = params.body as Record<string, unknown>;
  const scope = sprint2ScopeFromSession(params.session);
  const itemId = requireString(body.itemId, "Item");
  const quantity = requirePositiveNumber(body.quantity ?? body.quantityDelta, "Opening balance quantity");
  const location = await resolveLocation(scope, params.session.user.id, cleanString(body.locationId));
  const item = await getItem(scope, itemId);

  const existingOpening = await prisma.inventoryMovement.findFirst({
    where: { ...scope, itemId: item.id, locationId: location.id, movementType: "OPENING_BALANCE" }
  });
  if (existingOpening) throw new Error("Opening balance already exists for this item/location/environment. Use an adjustment instead.");

  return postMovement({
    request: params.request,
    session: params.session,
    itemId: item.id,
    locationId: location.id,
    quantityDelta: quantity,
    movementType: "OPENING_BALANCE",
    reason: cleanString(body.reason) ?? "Initial opening balance",
    referenceType: "OPENING_BALANCE"
  });
}

export async function createStockAdjustment(params: { request: Request; session: Sprint2Session; body: unknown }) {
  const body = params.body as Record<string, unknown>;
  const itemId = requireString(body.itemId, "Item");
  const quantityDelta = requireNonZeroNumber(body.quantityDelta ?? body.quantity, "Adjustment quantity");
  const reason = requireString(body.reason, "Adjustment reason");

  return postMovement({
    request: params.request,
    session: params.session,
    itemId,
    locationId: cleanString(body.locationId),
    quantityDelta,
    movementType: "MANUAL_ADJUSTMENT",
    reason,
    referenceType: "ADJUSTMENT"
  });
}
