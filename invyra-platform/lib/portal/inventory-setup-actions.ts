export type InventorySetupActionState = "complete" | "needs-action" | "prepared" | "deferred";
export type InventoryImportPreparationStatus = "template-ready" | "mapping-planned" | "backend-deferred";

export type InventorySetupActionInput = {
  organisationReady: boolean;
  inventoryLicensed: boolean;
  inventoryViewAllowed: boolean;
  environmentAllowed: boolean;
  teamReady: boolean;
  devicesReady: boolean;
  workflowShellsReady: boolean;
  readinessFlowReady: boolean;
  importPreparationReady: boolean;
  backendConnected: boolean;
  environment: string;
};

export type InventorySetupAction = {
  id: string;
  title: string;
  description: string;
  state: InventorySetupActionState;
  owner: string;
  href: string;
  actionLabel: string;
  whyItMatters: string;
  safeBoundary: string;
  dependencies: string[];
};

export type InventoryImportTemplate = {
  id: string;
  title: string;
  description: string;
  route: string;
  status: InventoryImportPreparationStatus;
  fileType: string;
  requiredColumns: string[];
  optionalColumns: string[];
  validationRules: string[];
  safetyRules: string[];
  backendBoundary: string;
};

export type InventoryImportStage = {
  id: string;
  title: string;
  description: string;
  state: InventorySetupActionState;
  notes: string[];
};

export function getInventorySetupActionLabel(state: InventorySetupActionState) {
  if (state === "complete") return "Complete";
  if (state === "needs-action") return "Needs Action";
  if (state === "prepared") return "Prepared";
  return "Deferred";
}

export function getInventorySetupActionClass(state: InventorySetupActionState) {
  if (state === "complete") return "state-enabled";
  if (state === "needs-action") return "state-early";
  if (state === "prepared") return "state-foundation";
  return "state-muted";
}

export function getInventoryImportStatusLabel(status: InventoryImportPreparationStatus) {
  if (status === "template-ready") return "Template Ready";
  if (status === "mapping-planned") return "Mapping Planned";
  return "Backend Deferred";
}

export function getInventoryImportStatusClass(status: InventoryImportPreparationStatus) {
  if (status === "template-ready") return "state-foundation";
  if (status === "mapping-planned") return "state-early";
  return "state-muted";
}

export const inventoryImportTemplates: InventoryImportTemplate[] = [
  {
    id: "items",
    title: "Item Master Import",
    description: "Prepare item identity, SKU, barcode, unit, category, and active/inactive fields before live item creation is enabled.",
    route: "/portal/inventory/items",
    status: "template-ready",
    fileType: "CSV / spreadsheet template preparation only",
    requiredColumns: ["sku", "item_name", "base_unit", "status"],
    optionalColumns: ["barcode", "category", "brand", "description", "image_reference", "supplier_reference"],
    validationRules: [
      "SKU must be unique within the organisation and environment.",
      "Item name must not be blank.",
      "Base unit must match the approved unit list before import execution.",
      "Barcode values must be stored as text to avoid spreadsheet formatting loss."
    ],
    safetyRules: [
      "No live item records are created in Phase 1G.",
      "TRAINING and TEST item templates must not be imported into LIVE by mistake.",
      "Duplicate SKUs must be resolved before backend import execution."
    ],
    backendBoundary: "Upload, parsing, duplicate detection, and live item creation are deferred until backend import implementation is scoped."
  },
  {
    id: "suppliers",
    title: "Supplier Import",
    description: "Prepare supplier names, contacts, ordering details, and relationship notes before supplier backend wiring.",
    route: "/portal/inventory/suppliers",
    status: "template-ready",
    fileType: "CSV / spreadsheet template preparation only",
    requiredColumns: ["supplier_name", "supplier_status"],
    optionalColumns: ["contact_name", "phone", "email", "address", "payment_terms", "lead_time_days"],
    validationRules: [
      "Supplier name must not be blank.",
      "Email format must be valid when supplied.",
      "Lead time must be numeric when supplied.",
      "Inactive suppliers should be labelled rather than deleted from the source file."
    ],
    safetyRules: [
      "No supplier records are written in Phase 1G.",
      "Supplier contact data must stay organisation-scoped.",
      "Ordering integrations remain off until explicitly enabled later."
    ],
    backendBoundary: "Supplier create/update, matching, and supplier-item relationship sync are deferred."
  },
  {
    id: "opening-balances",
    title: "Opening Stock Balance Import",
    description: "Prepare initial on-hand quantities for a controlled go-live stock position after item master validation is complete.",
    route: "/portal/inventory/stocktake",
    status: "mapping-planned",
    fileType: "CSV / spreadsheet template preparation only",
    requiredColumns: ["sku", "location", "quantity", "counted_at"],
    optionalColumns: ["batch", "expiry_date", "counted_by", "reference_note"],
    validationRules: [
      "SKU must already exist in the validated item master plan.",
      "Quantity must be numeric and cannot be blank.",
      "Location must match the organisation location list before execution.",
      "Opening balance import should be blocked after go-live unless admin-approved."
    ],
    safetyRules: [
      "No stock balances are created in Phase 1G.",
      "Opening balances must create audited movements when backend implementation starts.",
      "TRAINING opening balances must never seed LIVE inventory."
    ],
    backendBoundary: "Opening balance movement creation, stock mutation, and audit events are deferred."
  },
  {
    id: "reorder-levels",
    title: "Reorder Level Import",
    description: "Prepare minimum stock, reorder point, preferred supplier, and coverage settings before replenishment logic is enabled.",
    route: "/portal/inventory/reorder-review",
    status: "mapping-planned",
    fileType: "CSV / spreadsheet template preparation only",
    requiredColumns: ["sku", "minimum_stock", "reorder_point"],
    optionalColumns: ["preferred_supplier", "order_multiple", "coverage_days", "lead_time_days"],
    validationRules: [
      "SKU must match the item master plan.",
      "Minimum stock and reorder point must be numeric.",
      "Reorder point should not be lower than minimum stock without manager review.",
      "Preferred supplier must match the supplier import plan when supplied."
    ],
    safetyRules: [
      "No reorder recommendations are generated in Phase 1G.",
      "Forecasting and AI suggestions remain out of scope.",
      "Reorder settings must be environment-scoped."
    ],
    backendBoundary: "Threshold saving, recommendation generation, and purchase order handoff are deferred."
  },
  {
    id: "supplier-items",
    title: "Supplier Item Mapping Import",
    description: "Prepare supplier-to-item relationships, supplier SKUs, case packs, and lead times for later purchasing workflows.",
    route: "/portal/inventory/orders",
    status: "backend-deferred",
    fileType: "CSV / spreadsheet template preparation only",
    requiredColumns: ["supplier_name", "sku", "supplier_sku"],
    optionalColumns: ["case_pack", "cost_price", "minimum_order_qty", "lead_time_days"],
    validationRules: [
      "Supplier name must match the supplier import plan.",
      "SKU must match the item master plan.",
      "Cost price must be numeric when supplied.",
      "Case pack and minimum order quantity must be numeric when supplied."
    ],
    safetyRules: [
      "No purchase orders are created in Phase 1G.",
      "Supplier pricing remains preparation-only until approval and audit controls exist.",
      "Manual review is required before supplier mapping affects purchasing."
    ],
    backendBoundary: "Supplier item matching, price history, and purchasing integration are deferred."
  }
];

export const inventoryImportStages: InventoryImportStage[] = [
  {
    id: "prepare-template",
    title: "Prepare template",
    description: "Customer or implementation team gathers data into approved import columns.",
    state: "prepared",
    notes: ["Templates are visible in the portal.", "No upload button is active yet.", "Columns are documented before backend work starts."]
  },
  {
    id: "validate-file",
    title: "Validate file later",
    description: "Backend import phase will check required fields, duplicates, formats, and environment scope.",
    state: "deferred",
    notes: ["No parser is active in Phase 1G.", "Validation rules are documented only.", "Failed rows must be reviewable before import execution later."]
  },
  {
    id: "review-preview",
    title: "Review import preview later",
    description: "Users must see what will be created or changed before data is committed.",
    state: "deferred",
    notes: ["No database writes are enabled.", "Preview and approval screens are future work.", "Operational imports will require audit logging."]
  },
  {
    id: "commit-with-audit",
    title: "Commit with audit later",
    description: "Approved imports must write scoped records and audit events in the correct environment.",
    state: "deferred",
    notes: ["LIVE imports must be explicit.", "TRAINING and TEST remain separated.", "Rollback/export evidence will be required before release."]
  }
];

export function buildInventorySetupActions(input: InventorySetupActionInput): InventorySetupAction[] {
  return [
    {
      id: "confirm-organisation",
      title: "Confirm organisation profile",
      description: "Check customer identity, industry, currency, and timezone before Inventory setup continues.",
      state: input.organisationReady ? "complete" : "needs-action",
      owner: "Owner / Admin",
      href: "/portal/admin/organisation",
      actionLabel: "Review Organisation",
      whyItMatters: "Inventory data must be attached to the correct customer organisation before workflows become operational.",
      safeBoundary: "This does not create or change stock records.",
      dependencies: ["Organisation name", "Industry", "Currency", "Timezone"]
    },
    {
      id: "confirm-licence",
      title: "Confirm Inventory licence",
      description: "Make Inventory the active commercial entitlement before exposing workflow access.",
      state: input.inventoryLicensed ? "complete" : "needs-action",
      owner: "Owner / Admin",
      href: "/portal/licensing",
      actionLabel: "Review Licence",
      whyItMatters: "Inventory is the first commercial product and must be licensed before customer use.",
      safeBoundary: "CRM and POS remain future-only regardless of this step.",
      dependencies: ["Active licence", "INVENTORY entitlement", "Environment access"]
    },
    {
      id: "confirm-role-access",
      title: "Confirm role and permission access",
      description: "Verify that the current user and team roles can see only the workflows they should see.",
      state: input.inventoryViewAllowed ? "complete" : "needs-action",
      owner: "Admin / Manager",
      href: "/portal/admin/users",
      actionLabel: "Review Users",
      whyItMatters: "Workflow visibility must be permission-based before actions such as receiving, stocktake, and settings are enabled.",
      safeBoundary: "Restricted workflows stay labelled instead of being silently exposed.",
      dependencies: ["Role", "Permissions", "User overrides"]
    },
    {
      id: "confirm-environment",
      title: "Confirm environment separation",
      description: "Keep LIVE, TRAINING, and TEST visibly separated before import or workflow data is connected.",
      state: input.environmentAllowed ? "complete" : "needs-action",
      owner: "Admin",
      href: "/portal/admin/environments",
      actionLabel: "Review Environments",
      whyItMatters: `${input.environment} must be clear so staff do not mistake practice or validation data for live inventory.`,
      safeBoundary: "TRAINING and TEST must never mutate LIVE stock.",
      dependencies: ["Environment access", "Visible environment banner", "Route guards"]
    },
    {
      id: "prepare-team",
      title: "Prepare team access",
      description: "Invite or review users who will use Inventory workflows after backend connection.",
      state: input.teamReady ? "complete" : "needs-action",
      owner: "Owner / Admin",
      href: "/portal/admin/users",
      actionLabel: "Manage Team",
      whyItMatters: "Inventory rollout should not depend on one admin account once staff training begins.",
      safeBoundary: "Invites do not grant operational actions until permissions and licences allow them.",
      dependencies: ["Active users", "Invited users", "Role assignment"]
    },
    {
      id: "prepare-devices",
      title: "Prepare devices when needed",
      description: "Register terminals, trusted workstations, or scanners before operational Inventory workflows go live.",
      state: input.devicesReady ? "complete" : "prepared",
      owner: "Admin / Support",
      href: "/portal/devices",
      actionLabel: "Review Devices",
      whyItMatters: "Receiving, scanner, and stocktake workflows may depend on trusted devices later.",
      safeBoundary: "The portal can still open without device-based stock mutation enabled.",
      dependencies: ["Registered devices", "Activated devices", "Device lifecycle controls"]
    },
    {
      id: "prepare-workflows",
      title: "Review workflow route shells",
      description: "Open each Inventory workflow shell and confirm the correct empty-state and access labels are visible.",
      state: input.workflowShellsReady && input.readinessFlowReady ? "complete" : "needs-action",
      owner: "Implementation",
      href: "/portal/inventory",
      actionLabel: "Open Inventory",
      whyItMatters: "Workflow pages must be understandable before backend records are connected.",
      safeBoundary: "No fake stock, supplier, order, receiving, or report data is shown.",
      dependencies: ["Inventory dashboard", "Workflow detail routes", "Readiness flow"]
    },
    {
      id: "prepare-imports",
      title: "Prepare data import templates",
      description: "Review item, supplier, opening balance, reorder level, and supplier mapping templates before any upload exists.",
      state: input.importPreparationReady ? "prepared" : "needs-action",
      owner: "Implementation / Admin",
      href: "/portal/inventory/imports",
      actionLabel: "Open Import Preparation",
      whyItMatters: "Clean import planning prevents bad item masters, duplicate SKUs, and unsafe opening balances later.",
      safeBoundary: "Uploads, parsing, and database writes remain disabled in Phase 1G.",
      dependencies: ["Template columns", "Validation rules", "Environment-aware import plan"]
    },
    {
      id: "prepare-admin-configuration",
      title: "Prepare admin configuration shell",
      description: "Review Inventory stock rules, item rules, purchasing rules, receiving rules, training rules, reporting rules, and device/scanner settings before any save action exists.",
      state: "prepared",
      owner: "Inventory Admin",
      href: "/portal/inventory/configuration",
      actionLabel: "Open Admin Configuration",
      whyItMatters: "Configuration must be grouped, environment-scoped, permission-gated, and audit-ready before backend settings persistence starts.",
      safeBoundary: "No save buttons, forms, uploads, database writes, or live stock mutation are enabled in Phase 1H.",
      dependencies: ["INVENTORY.ADMINISTER", "Environment-scoped settings", "Audit-ready configuration contract"]
    },
    {
      id: "backend-connection",
      title: "Connect backend later",
      description: "Only begin live data wiring after setup, import planning, permission visibility, and audit requirements are accepted.",
      state: input.backendConnected ? "complete" : "deferred",
      owner: "Future Scope",
      href: "/portal/inventory/readiness",
      actionLabel: "View Boundaries",
      whyItMatters: "Operational actions must not be introduced before data contracts, audit logging, and environment separation are ready.",
      safeBoundary: "Phase 1G is preparation-only and cannot mutate live customer Inventory data.",
      dependencies: ["Inventory backend scope", "Import engine", "Audit events", "Rollback plan"]
    }
  ];
}

export function getInventorySetupSummary(actions: InventorySetupAction[]) {
  const actionable = actions.filter((action) => action.state !== "deferred");
  const complete = actions.filter((action) => action.state === "complete").length;
  const needsAction = actions.filter((action) => action.state === "needs-action").length;
  const prepared = actions.filter((action) => action.state === "prepared").length;
  const deferred = actions.filter((action) => action.state === "deferred").length;

  return {
    actionableTotal: actionable.length,
    complete,
    needsAction,
    prepared,
    deferred,
    readyForImportPlanning: needsAction === 0 && prepared > 0
  };
}

export function getNextInventorySetupAction(actions: InventorySetupAction[]) {
  return actions.find((action) => action.state === "needs-action") ?? actions.find((action) => action.state === "prepared") ?? actions.find((action) => action.state === "deferred") ?? null;
}
