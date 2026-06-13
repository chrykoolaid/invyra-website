/**
 * Invyra Inventory Read-only API Foundation — Phase 2F
 *
 * Protected Inventory API routes now read from the activated Inventory Prisma
 * models through a dedicated read-only service layer. These handlers still do
 * not create records, update stock, parse uploads, or mutate operational data.
 */

import type { CurrentSession } from "@/lib/auth/session";
import { inventoryReadOnlyApiContract } from "@/lib/inventory/inventory-data-model-contract";
import {
  getInventoryReadinessCounts,
  inventoryServiceScopeFromSession,
  listInventoryConfiguration,
  listInventoryItems,
  listInventoryMovements,
  listInventorySuppliers,
  type InventoryConfigurationRecord,
  type InventoryItemRecord,
  type InventoryMovementRecord,
  type InventoryReadinessCounts,
  type InventorySupplierRecord
} from "@/lib/inventory/inventory-read-only-service";

export const INVENTORY_READ_ONLY_API_PHASE = "2F" as const;

export type InventoryBackendConnectionStatus = "read_only_data_service_wired";

export type InventoryReadOnlyMeta = {
  phase: typeof INVENTORY_READ_ONLY_API_PHASE;
  backendStatus: InventoryBackendConnectionStatus;
  organisationId: string;
  environment: string;
  readOnlyDataServiceConnected: true;
  liveDataConnected: true;
  writeEnabled: false;
  uploadsEnabled: false;
  stockMutationEnabled: false;
  recordLimit: number;
  message: string;
};

export type InventoryReadOnlyCollection<T> = {
  meta: InventoryReadOnlyMeta;
  records: T[];
  emptyState: {
    title: string;
    description: string;
    nextSafeAction: string;
  };
};

export type InventoryReadinessApiPayload = {
  meta: InventoryReadOnlyMeta;
  readiness: {
    portalShellReady: true;
    readOnlyApiReady: true;
    dataModelsLive: true;
    readOnlyDataServiceConnected: true;
    operationalDataConnected: true;
    writeOperationsEnabled: false;
    recommendedNextPhase: "Phase 2G — Inventory Read-only Portal Data Binding";
  };
  counts: InventoryReadinessCounts;
  endpoints: readonly string[];
};

function buildMeta(session: NonNullable<CurrentSession>): InventoryReadOnlyMeta {
  return {
    phase: INVENTORY_READ_ONLY_API_PHASE,
    backendStatus: "read_only_data_service_wired",
    organisationId: session.organisation.id,
    environment: session.environment,
    readOnlyDataServiceConnected: true,
    liveDataConnected: true,
    writeEnabled: false,
    uploadsEnabled: false,
    stockMutationEnabled: false,
    recordLimit: 100,
    message: "Inventory Prisma schema is activated and read-only data services are wired. Writes, uploads, imports, and stock mutation remain disabled."
  };
}

export async function buildInventoryReadinessApiPayload(
  session: NonNullable<CurrentSession>
): Promise<InventoryReadinessApiPayload> {
  const scope = inventoryServiceScopeFromSession(session);
  return {
    meta: buildMeta(session),
    readiness: {
      portalShellReady: true,
      readOnlyApiReady: true,
      dataModelsLive: true,
      readOnlyDataServiceConnected: true,
      operationalDataConnected: true,
      writeOperationsEnabled: false,
      recommendedNextPhase: "Phase 2G — Inventory Read-only Portal Data Binding"
    },
    counts: await getInventoryReadinessCounts(scope),
    endpoints: inventoryReadOnlyApiContract
  };
}

export async function buildInventoryItemsApiPayload(
  session: NonNullable<CurrentSession>
): Promise<InventoryReadOnlyCollection<InventoryItemRecord>> {
  const scope = inventoryServiceScopeFromSession(session);
  return {
    meta: buildMeta(session),
    records: await listInventoryItems(scope),
    emptyState: {
      title: "No item master records found for this organisation and environment",
      description: "The Items API route is protected and read-only. If records exist, this endpoint returns live database rows scoped to the current organisation and environment.",
      nextSafeAction: "Prepare item import templates before enabling governed item creation."
    }
  };
}

export async function buildInventorySuppliersApiPayload(
  session: NonNullable<CurrentSession>
): Promise<InventoryReadOnlyCollection<InventorySupplierRecord>> {
  const scope = inventoryServiceScopeFromSession(session);
  return {
    meta: buildMeta(session),
    records: await listInventorySuppliers(scope),
    emptyState: {
      title: "No supplier records found for this organisation and environment",
      description: "The Suppliers API route is protected and read-only. If records exist, this endpoint returns live supplier rows scoped to the current organisation and environment.",
      nextSafeAction: "Prepare supplier import templates before enabling governed supplier creation."
    }
  };
}

export async function buildInventoryMovementsApiPayload(
  session: NonNullable<CurrentSession>
): Promise<InventoryReadOnlyCollection<InventoryMovementRecord>> {
  const scope = inventoryServiceScopeFromSession(session);
  return {
    meta: buildMeta(session),
    records: await listInventoryMovements(scope),
    emptyState: {
      title: "No movement ledger records found for this organisation and environment",
      description: "The Movements API route is protected and read-only. If records exist, this endpoint returns live movement rows with item/location labels where available.",
      nextSafeAction: "Keep movement posting disabled until governed stock workflows are implemented."
    }
  };
}

export async function buildInventoryConfigurationApiPayload(
  session: NonNullable<CurrentSession>
): Promise<InventoryReadOnlyCollection<InventoryConfigurationRecord>> {
  const scope = inventoryServiceScopeFromSession(session);
  return {
    meta: buildMeta(session),
    records: await listInventoryConfiguration(scope),
    emptyState: {
      title: "No persisted Inventory configuration found for this organisation and environment",
      description: "The Configuration API route is protected and read-only. If configuration rows exist, this endpoint returns them without allowing edits.",
      nextSafeAction: "Review admin configuration contracts before enabling any settings writes."
    }
  };
}
