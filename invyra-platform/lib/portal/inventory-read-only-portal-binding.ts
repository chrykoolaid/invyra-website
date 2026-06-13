/**
 * Invyra Inventory Read-only Portal Binding — Phase 2G
 *
 * Bridges protected portal pages to the Phase 2F read-only Inventory service.
 * Phase 2K adds display-safe demo UX labels so seeded read-only rows are
 * easier to review without implying that write workflows are active.
 * This file intentionally exposes display-safe summaries only; it does not
 * create, update, delete, import, or mutate stock.
 */

import type { CurrentSession } from "@/lib/auth/session";
import {
  buildInventoryConfigurationApiPayload,
  buildInventoryItemsApiPayload,
  buildInventoryMovementsApiPayload,
  buildInventoryReadinessApiPayload,
  buildInventorySuppliersApiPayload
} from "@/lib/inventory/inventory-read-only-api";

type Session = NonNullable<CurrentSession>;

export type InventoryPortalBindingStatus = "read_only_bound" | "read_only_empty" | "not_bound_to_collection";

export type InventoryPortalDemoUxStatus = "demo_rows_visible" | "empty_demo_ready" | "readiness_only";

export type InventoryPortalReadOnlySummary = {
  phase: "2K";
  backendStatus: "read_only_portal_bound";
  environment: string;
  recordLimit: number;
  writeEnabled: false;
  uploadsEnabled: false;
  stockMutationEnabled: false;
  demoUxStatus: "read_only_demo_review";
  demoUxNote: string;
  counts: {
    locations: number;
    items: number;
    suppliers: number;
    stockBalances: number;
    movements: number;
    configurations: number;
    importBatches: number;
  };
};

export type InventoryPortalTableColumn = {
  key: string;
  label: string;
};

export type InventoryPortalTable = {
  title: string;
  description: string;
  status: InventoryPortalBindingStatus;
  columns: InventoryPortalTableColumn[];
  rows: Record<string, string>[];
  emptyTitle: string;
  emptyDescription: string;
  nextSafeAction: string;
  demoUxStatus: InventoryPortalDemoUxStatus;
  demoUxLabel: string;
  demoUxNote: string;
};

function buildDemoUxMetadata(status: InventoryPortalBindingStatus, rowCount: number) {
  if (status === "read_only_bound") {
    return {
      demoUxStatus: "demo_rows_visible" as const,
      demoUxLabel: `${rowCount} demo row${rowCount === 1 ? "" : "s"} visible`,
      demoUxNote: "Seeded read-only demo rows are visible for runtime UX review only. No edit, upload, import, or stock-changing action is enabled."
    };
  }

  if (status === "read_only_empty") {
    return {
      demoUxStatus: "empty_demo_ready" as const,
      demoUxLabel: "No demo rows yet",
      demoUxNote: "The page is ready for seeded read-only demo data, but the current organisation/environment has no rows to display."
    };
  }

  return {
    demoUxStatus: "readiness_only" as const,
    demoUxLabel: "Readiness only",
    demoUxNote: "This workflow is not yet bound to a dedicated read-only collection, so it shows backend readiness instead of operational rows."
  };
}

type InventoryPortalTableInput = Omit<InventoryPortalTable, "demoUxStatus" | "demoUxLabel" | "demoUxNote">;

function withDemoUx(table: InventoryPortalTableInput): InventoryPortalTable {
  return { ...table, ...buildDemoUxMetadata(table.status, table.rows.length) };
}

export async function getInventoryPortalReadOnlySummary(session: Session): Promise<InventoryPortalReadOnlySummary> {
  const readiness = await buildInventoryReadinessApiPayload(session);

  return {
    phase: "2K",
    backendStatus: "read_only_portal_bound",
    environment: readiness.meta.environment,
    recordLimit: readiness.meta.recordLimit,
    writeEnabled: false,
    uploadsEnabled: false,
    stockMutationEnabled: false,
    demoUxStatus: "read_only_demo_review",
    demoUxNote: "Phase 2K supports runtime UX review of seeded read-only demo data. The portal remains non-mutating.",
    counts: readiness.counts
  };
}

export async function getInventoryDashboardReadOnlyTables(session: Session, options: { includeConfiguration: boolean }): Promise<InventoryPortalTable[]> {
  const [items, suppliers, movements, configuration] = await Promise.all([
    buildInventoryItemsApiPayload(session),
    buildInventorySuppliersApiPayload(session),
    buildInventoryMovementsApiPayload(session),
    options.includeConfiguration ? buildInventoryConfigurationApiPayload(session) : Promise.resolve(null)
  ]);

  const tables: InventoryPortalTableInput[] = [
    {
      title: "Item Master Preview",
      description: "Read-only item records scoped to the current organisation and environment.",
      status: items.records.length ? "read_only_bound" : "read_only_empty",
      columns: [
        { key: "sku", label: "SKU" },
        { key: "name", label: "Item" },
        { key: "unitOfMeasure", label: "Unit" },
        { key: "status", label: "Status" }
      ],
      rows: items.records.slice(0, 5).map((item) => ({
        sku: item.sku,
        name: item.name,
        unitOfMeasure: item.unitOfMeasure,
        status: item.status
      })),
      emptyTitle: items.emptyState.title,
      emptyDescription: items.emptyState.description,
      nextSafeAction: items.emptyState.nextSafeAction
    },
    {
      title: "Supplier Preview",
      description: "Read-only supplier records scoped to the current organisation and environment.",
      status: suppliers.records.length ? "read_only_bound" : "read_only_empty",
      columns: [
        { key: "supplierCode", label: "Code" },
        { key: "name", label: "Supplier" },
        { key: "contactName", label: "Contact" },
        { key: "status", label: "Status" }
      ],
      rows: suppliers.records.slice(0, 5).map((supplier) => ({
        supplierCode: supplier.supplierCode,
        name: supplier.name,
        contactName: supplier.contactName ?? "—",
        status: supplier.status
      })),
      emptyTitle: suppliers.emptyState.title,
      emptyDescription: suppliers.emptyState.description,
      nextSafeAction: suppliers.emptyState.nextSafeAction
    },
    {
      title: "Movement Ledger Preview",
      description: "Read-only movement rows with item and location labels where available.",
      status: movements.records.length ? "read_only_bound" : "read_only_empty",
      columns: [
        { key: "createdAt", label: "Created" },
        { key: "item", label: "Item" },
        { key: "movementType", label: "Type" },
        { key: "quantityDelta", label: "Delta" }
      ],
      rows: movements.records.slice(0, 5).map((movement) => ({
        createdAt: movement.createdAt.slice(0, 10),
        item: movement.itemName ?? movement.itemSku ?? movement.itemId,
        movementType: movement.movementType,
        quantityDelta: movement.quantityDelta
      })),
      emptyTitle: movements.emptyState.title,
      emptyDescription: movements.emptyState.description,
      nextSafeAction: movements.emptyState.nextSafeAction
    },
    {
      title: "Configuration Preview",
      description: "Admin-only read-only configuration rows when Inventory administer access is available.",
      status: configuration?.records.length ? "read_only_bound" : configuration ? "read_only_empty" : "not_bound_to_collection",
      columns: [
        { key: "key", label: "Key" },
        { key: "status", label: "Status" },
        { key: "updatedAt", label: "Updated" }
      ],
      rows: configuration?.records.slice(0, 5).map((config) => ({
        key: config.key,
        status: config.status,
        updatedAt: config.updatedAt.slice(0, 10)
      })) ?? [],
      emptyTitle: configuration?.emptyState.title ?? "Configuration preview restricted",
      emptyDescription: configuration?.emptyState.description ?? "Inventory configuration remains available only to Inventory administrators.",
      nextSafeAction: configuration?.emptyState.nextSafeAction ?? "Use the Admin Configuration route with INVENTORY.ADMINISTER access."
    }
  ];

  return tables.map(withDemoUx);
}

export async function getInventoryWorkflowReadOnlyTable(session: Session, workflowId: string): Promise<InventoryPortalTable> {
  if (workflowId === "items") {
    const payload = await buildInventoryItemsApiPayload(session);
    return withDemoUx({
      title: "Live Read-only Item Rows",
      description: "Item master rows from the activated Inventory Prisma model for the current organisation/environment.",
      status: payload.records.length ? "read_only_bound" : "read_only_empty",
      columns: [
        { key: "sku", label: "SKU" },
        { key: "barcode", label: "Barcode" },
        { key: "name", label: "Item" },
        { key: "unitOfMeasure", label: "Unit" },
        { key: "status", label: "Status" }
      ],
      rows: payload.records.slice(0, 20).map((item) => ({
        sku: item.sku,
        barcode: item.barcode ?? "—",
        name: item.name,
        unitOfMeasure: item.unitOfMeasure,
        status: item.status
      })),
      emptyTitle: payload.emptyState.title,
      emptyDescription: payload.emptyState.description,
      nextSafeAction: payload.emptyState.nextSafeAction
    });
  }

  if (workflowId === "suppliers") {
    const payload = await buildInventorySuppliersApiPayload(session);
    return withDemoUx({
      title: "Live Read-only Supplier Rows",
      description: "Supplier rows from the activated Inventory Prisma model for the current organisation/environment.",
      status: payload.records.length ? "read_only_bound" : "read_only_empty",
      columns: [
        { key: "supplierCode", label: "Code" },
        { key: "name", label: "Supplier" },
        { key: "contactName", label: "Contact" },
        { key: "email", label: "Email" },
        { key: "status", label: "Status" }
      ],
      rows: payload.records.slice(0, 20).map((supplier) => ({
        supplierCode: supplier.supplierCode,
        name: supplier.name,
        contactName: supplier.contactName ?? "—",
        email: supplier.email ?? "—",
        status: supplier.status
      })),
      emptyTitle: payload.emptyState.title,
      emptyDescription: payload.emptyState.description,
      nextSafeAction: payload.emptyState.nextSafeAction
    });
  }

  if (workflowId === "movements") {
    const payload = await buildInventoryMovementsApiPayload(session);
    return withDemoUx({
      title: "Live Read-only Movement Rows",
      description: "Movement ledger rows from the activated Inventory Prisma model for the current organisation/environment.",
      status: payload.records.length ? "read_only_bound" : "read_only_empty",
      columns: [
        { key: "createdAt", label: "Created" },
        { key: "item", label: "Item" },
        { key: "location", label: "Location" },
        { key: "movementType", label: "Type" },
        { key: "quantityDelta", label: "Delta" },
        { key: "reference", label: "Reference" }
      ],
      rows: payload.records.slice(0, 20).map((movement) => ({
        createdAt: movement.createdAt.slice(0, 10),
        item: movement.itemName ?? movement.itemSku ?? movement.itemId,
        location: movement.locationName ?? movement.locationId,
        movementType: movement.movementType,
        quantityDelta: movement.quantityDelta,
        reference: movement.referenceType ? `${movement.referenceType}:${movement.referenceId ?? "—"}` : "—"
      })),
      emptyTitle: payload.emptyState.title,
      emptyDescription: payload.emptyState.description,
      nextSafeAction: payload.emptyState.nextSafeAction
    });
  }

  if (workflowId === "inventory-settings") {
    const payload = await buildInventoryConfigurationApiPayload(session);
    return withDemoUx({
      title: "Live Read-only Configuration Rows",
      description: "Configuration rows from the activated Inventory Prisma model for the current organisation/environment.",
      status: payload.records.length ? "read_only_bound" : "read_only_empty",
      columns: [
        { key: "key", label: "Key" },
        { key: "status", label: "Status" },
        { key: "updatedAt", label: "Updated" }
      ],
      rows: payload.records.slice(0, 20).map((config) => ({
        key: config.key,
        status: config.status,
        updatedAt: config.updatedAt.slice(0, 10)
      })),
      emptyTitle: payload.emptyState.title,
      emptyDescription: payload.emptyState.description,
      nextSafeAction: payload.emptyState.nextSafeAction
    });
  }

  const readiness = await buildInventoryReadinessApiPayload(session);
  return withDemoUx({
    title: "Read-only Backend Readiness",
    description: "This workflow is visible in the portal, but it is not yet bound to a dedicated operational collection.",
    status: "not_bound_to_collection",
    columns: [
      { key: "area", label: "Area" },
      { key: "count", label: "Read-only Count" },
      { key: "status", label: "Status" }
    ],
    rows: [
      { area: "Items", count: String(readiness.counts.items), status: "Read-only service wired" },
      { area: "Suppliers", count: String(readiness.counts.suppliers), status: "Read-only service wired" },
      { area: "Movements", count: String(readiness.counts.movements), status: "Read-only service wired" },
      { area: "Configurations", count: String(readiness.counts.configurations), status: "Read-only service wired" }
    ],
    emptyTitle: "Dedicated workflow data binding not enabled yet",
    emptyDescription: "This page can see read-only Inventory backend readiness, but its operational collection remains deferred.",
    nextSafeAction: "Bind this workflow to its dedicated read-only collection before enabling any actions."
  });
}
