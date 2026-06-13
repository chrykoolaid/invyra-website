/**
 * Invyra Inventory Read-only Data Service — Phase 2F
 *
 * This service is the first controlled bridge between protected Inventory API
 * routes and activated Inventory Prisma models. It is intentionally read-only:
 * no create/update/delete/upsert/import/stock-posting operations are exposed.
 */

import type { CurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

type Session = NonNullable<CurrentSession>;

export type InventoryServiceScope = {
  organisationId: string;
  environmentName: Session["environment"];
};

export type InventoryItemRecord = {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  category: string | null;
  brand: string | null;
  unitOfMeasure: string;
  status: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InventorySupplierRecord = {
  id: string;
  supplierCode: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  status: string;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InventoryMovementRecord = {
  id: string;
  itemId: string;
  itemName: string | null;
  itemSku: string | null;
  locationId: string;
  locationName: string | null;
  movementType: string;
  quantityDelta: string;
  quantityBefore: string | null;
  quantityAfter: string | null;
  referenceType: string | null;
  referenceId: string | null;
  reason: string | null;
  createdAt: string;
};

export type InventoryConfigurationRecord = {
  id: string;
  key: string;
  valueJson: unknown;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type InventoryReadinessCounts = {
  locations: number;
  items: number;
  suppliers: number;
  stockBalances: number;
  movements: number;
  configurations: number;
  importBatches: number;
};

export function inventoryServiceScopeFromSession(session: Session): InventoryServiceScope {
  return {
    organisationId: session.organisation.id,
    environmentName: session.environment
  };
}

export async function getInventoryReadinessCounts(scope: InventoryServiceScope): Promise<InventoryReadinessCounts> {
  const where = {
    organisationId: scope.organisationId,
    environmentName: scope.environmentName
  } as const;

  const [locations, items, suppliers, stockBalances, movements, configurations, importBatches] = await Promise.all([
    prisma.inventoryLocation.count({ where }),
    prisma.inventoryItem.count({ where }),
    prisma.inventorySupplier.count({ where }),
    prisma.inventoryStockBalance.count({ where }),
    prisma.inventoryMovement.count({ where }),
    prisma.inventoryConfiguration.count({ where }),
    prisma.inventoryImportBatch.count({ where })
  ]);

  return { locations, items, suppliers, stockBalances, movements, configurations, importBatches };
}

export async function listInventoryItems(scope: InventoryServiceScope): Promise<InventoryItemRecord[]> {
  const records = await prisma.inventoryItem.findMany({
    where: {
      organisationId: scope.organisationId,
      environmentName: scope.environmentName
    },
    orderBy: [{ name: "asc" }, { sku: "asc" }],
    take: 100
  });

  return records.map((item) => ({
    id: item.id,
    sku: item.sku,
    barcode: item.barcode,
    name: item.name,
    description: item.description,
    category: item.category,
    brand: item.brand,
    unitOfMeasure: item.unitOfMeasure,
    status: item.status,
    archivedAt: item.archivedAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString()
  }));
}

export async function listInventorySuppliers(scope: InventoryServiceScope): Promise<InventorySupplierRecord[]> {
  const records = await prisma.inventorySupplier.findMany({
    where: {
      organisationId: scope.organisationId,
      environmentName: scope.environmentName
    },
    orderBy: [{ name: "asc" }, { supplierCode: "asc" }],
    take: 100
  });

  return records.map((supplier) => ({
    id: supplier.id,
    supplierCode: supplier.supplierCode,
    name: supplier.name,
    contactName: supplier.contactName,
    phone: supplier.phone,
    email: supplier.email,
    address: supplier.address,
    notes: supplier.notes,
    status: supplier.status,
    archivedAt: supplier.archivedAt?.toISOString() ?? null,
    createdAt: supplier.createdAt.toISOString(),
    updatedAt: supplier.updatedAt.toISOString()
  }));
}

export async function listInventoryMovements(scope: InventoryServiceScope): Promise<InventoryMovementRecord[]> {
  const movements = await prisma.inventoryMovement.findMany({
    where: {
      organisationId: scope.organisationId,
      environmentName: scope.environmentName
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  const itemIds = Array.from(new Set(movements.map((movement) => movement.itemId)));
  const locationIds = Array.from(new Set(movements.map((movement) => movement.locationId)));

  const [items, locations] = await Promise.all([
    itemIds.length
      ? prisma.inventoryItem.findMany({
          where: {
            organisationId: scope.organisationId,
            environmentName: scope.environmentName,
            id: { in: itemIds }
          },
          select: { id: true, sku: true, name: true }
        })
      : Promise.resolve([]),
    locationIds.length
      ? prisma.inventoryLocation.findMany({
          where: {
            organisationId: scope.organisationId,
            environmentName: scope.environmentName,
            id: { in: locationIds }
          },
          select: { id: true, name: true }
        })
      : Promise.resolve([])
  ]);

  const itemById = new Map(items.map((item) => [item.id, item]));
  const locationById = new Map(locations.map((location) => [location.id, location]));

  return movements.map((movement) => {
    const item = itemById.get(movement.itemId);
    const location = locationById.get(movement.locationId);
    return {
      id: movement.id,
      itemId: movement.itemId,
      itemName: item?.name ?? null,
      itemSku: item?.sku ?? null,
      locationId: movement.locationId,
      locationName: location?.name ?? null,
      movementType: movement.movementType,
      quantityDelta: movement.quantityDelta.toString(),
      quantityBefore: movement.quantityBefore?.toString() ?? null,
      quantityAfter: movement.quantityAfter?.toString() ?? null,
      referenceType: movement.referenceType,
      referenceId: movement.referenceId,
      reason: movement.reason,
      createdAt: movement.createdAt.toISOString()
    };
  });
}

export async function listInventoryConfiguration(scope: InventoryServiceScope): Promise<InventoryConfigurationRecord[]> {
  const records = await prisma.inventoryConfiguration.findMany({
    where: {
      organisationId: scope.organisationId,
      environmentName: scope.environmentName
    },
    orderBy: { key: "asc" },
    take: 100
  });

  return records.map((configuration) => ({
    id: configuration.id,
    key: configuration.key,
    valueJson: configuration.valueJson,
    status: configuration.status,
    createdAt: configuration.createdAt.toISOString(),
    updatedAt: configuration.updatedAt.toISOString()
  }));
}
