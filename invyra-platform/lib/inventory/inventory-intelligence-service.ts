import { EnvironmentName, InventoryMovementType } from "@prisma/client";
import type { CurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { auditLog } from "@/lib/audit/audit";

type Sprint9Session = NonNullable<CurrentSession>;
type Scope = { organisationId: string; environmentName: EnvironmentName };

export function sprint9ScopeFromSession(session: Sprint9Session): Scope {
  return { organisationId: session.organisation.id, environmentName: session.environment as EnvironmentName };
}

export function ensureSprint9PlannerRole(session: Sprint9Session) {
  const role = session.membership.role.name;
  return role === "MANAGER" || role === "ADMINISTRATOR" || role === "OWNER";
}

function cleanString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function positiveInteger(value: unknown, fallback: number, max = 365) {
  const numberValue = Number(value ?? fallback);
  if (!Number.isFinite(numberValue) || numberValue <= 0) return fallback;
  return Math.min(Math.round(numberValue), max);
}

async function nextRunNumber(scope: Scope) {
  const year = new Date().getUTCFullYear();
  const count = await prisma.inventoryForecastRun.count({ where: scope as any });
  return `FRC-${year}-${String(count + 1).padStart(6, "0")}`;
}

function asNumber(value: unknown) {
  return Number(value ?? 0);
}

function isDemandMovement(type: InventoryMovementType) {
  return ["STORE_USE", "WASTAGE", "SHRINKAGE", "TRANSFER_OUT"].includes(type);
}

export async function listInventoryForecastRuns(session: Sprint9Session) {
  const scope = sprint9ScopeFromSession(session);
  const runs = await prisma.inventoryForecastRun.findMany({ where: scope as any, orderBy: { generatedAt: "desc" }, take: 50 });
  const runIds = runs.map((run) => run.id);
  const recommendations = runIds.length ? await prisma.inventoryForecastRecommendation.findMany({ where: { ...scope, forecastRunId: { in: runIds } } as any }) : [];
  return runs.map((run) => ({
    id: run.id,
    runNumber: run.runNumber,
    status: run.status,
    sourceWindowDays: run.sourceWindowDays,
    forecastHorizonDays: run.forecastHorizonDays,
    generatedAt: run.generatedAt.toISOString(),
    recommendationCount: recommendations.filter((item) => item.forecastRunId === run.id).length
  }));
}

export async function listInventoryForecastRecommendations(session: Sprint9Session) {
  const scope = sprint9ScopeFromSession(session);
  const recommendations = await prisma.inventoryForecastRecommendation.findMany({ where: scope as any, orderBy: { generatedAt: "desc" }, take: 100 });
  const itemIds = Array.from(new Set(recommendations.map((recommendation) => recommendation.itemId)));
  const [items, suppliers, locations] = await Promise.all([
    itemIds.length ? prisma.inventoryItem.findMany({ where: { ...scope, id: { in: itemIds } } as any, select: { id: true, sku: true, name: true } }) : [],
    prisma.inventorySupplier.findMany({ where: scope as any, select: { id: true, name: true } }),
    prisma.inventoryLocation.findMany({ where: scope as any, select: { id: true, name: true, code: true } })
  ]);
  const itemById = new Map(items.map((item) => [item.id, item]));
  const supplierById = new Map(suppliers.map((supplier) => [supplier.id, supplier]));
  const locationById = new Map(locations.map((location) => [location.id, location]));
  return recommendations.map((recommendation) => ({
    id: recommendation.id,
    recommendationType: recommendation.recommendationType,
    status: recommendation.status,
    itemSku: itemById.get(recommendation.itemId)?.sku ?? null,
    itemName: itemById.get(recommendation.itemId)?.name ?? null,
    supplierName: recommendation.supplierId ? supplierById.get(recommendation.supplierId)?.name ?? null : null,
    sourceLocation: recommendation.sourceLocationId ? locationById.get(recommendation.sourceLocationId)?.name ?? null : null,
    targetLocation: recommendation.targetLocationId ? locationById.get(recommendation.targetLocationId)?.name ?? null : null,
    demand30Days: recommendation.demand30Days?.toString() ?? null,
    forecastQty: recommendation.forecastQty?.toString() ?? null,
    recommendedQty: recommendation.recommendedQty.toString(),
    reorderPoint: recommendation.reorderPoint?.toString() ?? null,
    reorderQty: recommendation.reorderQty?.toString() ?? null,
    coverageDays: recommendation.coverageDays?.toString() ?? null,
    confidenceScore: recommendation.confidenceScore?.toString() ?? null,
    reason: recommendation.reason,
    generatedAt: recommendation.generatedAt.toISOString()
  }));
}

export async function generateInventoryForecastRun(params: { request: Request; session: Sprint9Session; body?: unknown }) {
  const scope = sprint9ScopeFromSession(params.session);
  const body = (params.body ?? {}) as Record<string, unknown>;
  const sourceWindowDays = positiveInteger(body.sourceWindowDays, 30);
  const forecastHorizonDays = positiveInteger(body.forecastHorizonDays, 30);
  const since = new Date(Date.now() - sourceWindowDays * 24 * 60 * 60 * 1000);
  const runNumber = await nextRunNumber(scope);

  const [items, locations, balances, movements, supplierItems, suppliers] = await Promise.all([
    prisma.inventoryItem.findMany({ where: { ...scope, status: "ACTIVE" } as any, orderBy: { name: "asc" }, take: 250 }),
    prisma.inventoryLocation.findMany({ where: { ...scope, status: "ACTIVE" } as any, orderBy: { name: "asc" }, take: 50 }),
    prisma.inventoryStockBalance.findMany({ where: scope as any }),
    prisma.inventoryMovement.findMany({ where: { ...scope, createdAt: { gte: since } } as any, orderBy: { createdAt: "desc" } }),
    prisma.inventorySupplierItem.findMany({ where: scope as any }),
    prisma.inventorySupplier.findMany({ where: { ...scope, status: "ACTIVE" } as any })
  ]);

  const demandByItem = new Map<string, number>();
  for (const movement of movements) {
    if (!isDemandMovement(movement.movementType)) continue;
    demandByItem.set(movement.itemId, (demandByItem.get(movement.itemId) ?? 0) + Math.abs(asNumber(movement.quantityDelta)));
  }

  const totalByItem = new Map<string, number>();
  const locationByItem = new Map<string, { locationId: string; qty: number }[]>();
  for (const balance of balances) {
    const qty = asNumber(balance.quantityOnHand);
    totalByItem.set(balance.itemId, (totalByItem.get(balance.itemId) ?? 0) + qty);
    const rows = locationByItem.get(balance.itemId) ?? [];
    rows.push({ locationId: balance.locationId, qty });
    locationByItem.set(balance.itemId, rows);
  }

  const supplierByItem = new Map<string, string>();
  for (const supplierItem of supplierItems) {
    if (!supplierByItem.has(supplierItem.itemId) || supplierItem.preferred) supplierByItem.set(supplierItem.itemId, supplierItem.supplierId);
  }

  const recommendations: any[] = [];
  for (const item of items) {
    const demandWindow = demandByItem.get(item.id) ?? 0;
    const dailyDemand = demandWindow / sourceWindowDays;
    const forecastQty = Math.ceil(dailyDemand * forecastHorizonDays);
    const currentQty = totalByItem.get(item.id) ?? 0;
    const reorderPoint = Math.ceil(dailyDemand * 14);
    const reorderQty = Math.max(0, forecastQty + reorderPoint - currentQty);
    const coverageDays = dailyDemand > 0 ? currentQty / dailyDemand : 999;
    if (reorderQty > 0 || currentQty === 0) {
      recommendations.push({
        ...scope,
        recommendationType: "ROP",
        itemId: item.id,
        supplierId: supplierByItem.get(item.id) ?? null,
        demand30Days: demandWindow.toString(),
        forecastQty: forecastQty.toString(),
        recommendedQty: Math.max(reorderQty, 1).toString(),
        reorderPoint: reorderPoint.toString(),
        reorderQty: Math.max(reorderQty, 1).toString(),
        coverageDays: coverageDays.toFixed(2),
        confidenceScore: demandWindow > 0 ? "0.78" : "0.45",
        reason: currentQty === 0 ? "Item is out of stock; recommend replenishment before launch or sale period." : "Projected coverage falls below reorder point."
      });
    }

    const rows = (locationByItem.get(item.id) ?? []).sort((a, b) => b.qty - a.qty);
    if (rows.length >= 2 && rows[0].qty > rows[rows.length - 1].qty * 3 + 5) {
      recommendations.push({
        ...scope,
        recommendationType: "TRANSFER_OPTIMIZATION",
        itemId: item.id,
        sourceLocationId: rows[0].locationId,
        targetLocationId: rows[rows.length - 1].locationId,
        demand30Days: demandWindow.toString(),
        forecastQty: forecastQty.toString(),
        recommendedQty: Math.max(1, Math.floor((rows[0].qty - rows[rows.length - 1].qty) / 2)).toString(),
        coverageDays: coverageDays.toFixed(2),
        confidenceScore: "0.70",
        reason: "Location balance spread indicates a transfer may reduce stock imbalance."
      });
    }
  }

  if (locations.length && items.length) {
    const targetLocation = locations[0];
    for (const item of items.slice(0, 20)) {
      const existingAtTarget = balances.find((balance) => balance.itemId === item.id && balance.locationId === targetLocation.id);
      if (!existingAtTarget || asNumber(existingAtTarget.quantityOnHand) === 0) {
        const demandWindow = demandByItem.get(item.id) ?? 0;
        recommendations.push({
          ...scope,
          recommendationType: "NEW_STORE_STOCKING",
          itemId: item.id,
          targetLocationId: targetLocation.id,
          supplierId: supplierByItem.get(item.id) ?? null,
          demand30Days: demandWindow.toString(),
          forecastQty: Math.max(1, Math.ceil((demandWindow / sourceWindowDays) * forecastHorizonDays)).toString(),
          recommendedQty: Math.max(1, Math.ceil((demandWindow / sourceWindowDays) * 14) || 1).toString(),
          confidenceScore: demandWindow > 0 ? "0.62" : "0.40",
          reason: "New-store stocking baseline generated from available demand history and active item catalogue."
        });
      }
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const run = await tx.inventoryForecastRun.create({
      data: { ...scope, runNumber, sourceWindowDays, forecastHorizonDays, createdByUserId: params.session.user.id, notes: cleanString(body.notes) }
    });
    if (recommendations.length) {
      await tx.inventoryForecastRecommendation.createMany({
        data: recommendations.map((recommendation) => ({ ...recommendation, forecastRunId: run.id, createdByUserId: params.session.user.id }))
      });
    }
    for (const supplier of suppliers) {
      const linkedItems = supplierItems.filter((supplierItem) => supplierItem.supplierId === supplier.id).length;
      const score = Math.min(100, 50 + linkedItems * 10);
      await tx.inventorySupplierScorecard.upsert({
        where: { organisationId_environmentName_supplierId: { ...scope, supplierId: supplier.id } },
        create: { ...scope, supplierId: supplier.id, score: score.toString(), leadTimeScore: "70", fulfillmentScore: "70", discrepancyScore: "70", priceStabilityScore: "70", notes: "Initial Sprint 9 scorecard baseline from supplier-item coverage." },
        update: { score: score.toString(), calculatedAt: new Date(), notes: "Updated Sprint 9 scorecard baseline from supplier-item coverage." }
      });
    }
    return run;
  });

  await auditLog({ request: params.request, organisationId: scope.organisationId, userId: params.session.user.id, environment: scope.environmentName, module: "INVENTORY", action: "FORECAST_RUN_GENERATED", targetType: "InventoryForecastRun", targetId: result.id, metadata: { runNumber, recommendationCount: recommendations.length, sourceWindowDays, forecastHorizonDays } });
  return result;
}

export async function getInventoryIntelligenceDashboard(session: Sprint9Session) {
  const scope = sprint9ScopeFromSession(session);
  const [runs, openRecommendations, supplierScorecards, transferRecommendations, newStoreRecommendations] = await Promise.all([
    prisma.inventoryForecastRun.count({ where: scope as any }),
    prisma.inventoryForecastRecommendation.count({ where: { ...scope, status: "OPEN" } as any }),
    prisma.inventorySupplierScorecard.count({ where: scope as any }),
    prisma.inventoryForecastRecommendation.count({ where: { ...scope, recommendationType: "TRANSFER_OPTIMIZATION", status: "OPEN" } as any }),
    prisma.inventoryForecastRecommendation.count({ where: { ...scope, recommendationType: "NEW_STORE_STOCKING", status: "OPEN" } as any })
  ]);
  return { runs, openRecommendations, supplierScorecards, transferRecommendations, newStoreRecommendations, intelligenceRule: "Recommendations are advisory until converted into an approved PO, transfer, or stocking plan." };
}
