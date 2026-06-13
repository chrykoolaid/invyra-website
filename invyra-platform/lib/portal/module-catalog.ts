import type { ModuleKey, PermissionLevel } from "@prisma/client";

export type PortalModuleGroup = "available-first" | "platform-foundation" | "future-module";
export type PortalModuleStatus = "available" | "foundation" | "future" | "roadmap";
export type InventoryWorkflowStatus = "ready-shell" | "backend-next" | "training-safe" | "admin";

export type PortalModuleEntry = {
  id: string;
  moduleKey?: ModuleKey;
  title: string;
  description: string;
  href: string;
  group: PortalModuleGroup;
  status: PortalModuleStatus;
  actionLabel: string;
  badgeLabel: string;
  operational: boolean;
  accessLevel?: PermissionLevel;
};

export type InventoryWorkflowEntry = {
  id: string;
  slug?: string;
  title: string;
  shortTitle: string;
  description: string;
  href: string;
  status: InventoryWorkflowStatus;
  accessLevel: PermissionLevel;
  pageSummary: string;
  environmentRule: string;
  roleGuidance: string;
  readiness: string[];
  preparedFor: string[];
  deferredUntilBackend: string[];
};

export const inventoryPortalWorkflows: InventoryWorkflowEntry[] = [
  {
    id: "inventory-dashboard",
    title: "Inventory Dashboard",
    shortTitle: "Dashboard",
    description: "Inventory-first command view prepared for licensed customer access.",
    status: "ready-shell",
    accessLevel: "VIEW",
    href: "/portal/inventory",
    pageSummary: "Primary Inventory landing view for organisation, role, licence, device, and environment context.",
    environmentRule: "Always displays whether the user is in LIVE, TRAINING, or TEST before any workflow action is introduced.",
    roleGuidance: "Visible to licensed Inventory users with Inventory view access.",
    readiness: ["Portal entry active", "Inventory licence guard active", "Environment banner active"],
    preparedFor: ["Operational inventory overview", "Workflow entry routing", "Audit-aware activity summaries"],
    deferredUntilBackend: ["Live item counts", "Low stock calculations", "Real-time movement metrics"]
  },
  {
    id: "items",
    slug: "items",
    title: "Items",
    shortTitle: "Items",
    description: "Item master entry point for SKUs, names, units, and stock visibility.",
    status: "backend-next",
    accessLevel: "VIEW",
    href: "/portal/inventory/items",
    pageSummary: "Prepared route for item master browsing, item identity, unit setup, and stock visibility.",
    environmentRule: "TRAINING and TEST item records must remain separated from LIVE item masters.",
    roleGuidance: "Staff can view once connected; create/edit actions remain permission-gated later.",
    readiness: ["Route shell active", "Inventory access guard active", "No fake item data shown"],
    preparedFor: ["SKU and item catalogue", "Unit and barcode visibility", "Per-environment item views"],
    deferredUntilBackend: ["Create item", "Edit item", "Live stock balance display", "Barcode/image catalogue sync"]
  },
  {
    id: "movements",
    slug: "movements",
    title: "Inventory Movements",
    shortTitle: "Movements",
    description: "Read-only movement ledger destination for stock adjustments and audit trails.",
    status: "backend-next",
    accessLevel: "VIEW",
    href: "/portal/inventory/movements",
    pageSummary: "Prepared route for viewing stock movement history, adjustment references, and audit-linked changes.",
    environmentRule: "LIVE movement records must never mix with TRAINING or TEST movement practice.",
    roleGuidance: "Movement viewing starts with Inventory view access; adjustment actions are later permission-gated.",
    readiness: ["Route shell active", "Ledger destination named", "Audit-first copy in place"],
    preparedFor: ["Adjustment history", "Receiving and wastage movement links", "Reference/audit traceability"],
    deferredUntilBackend: ["Movement ledger table", "Adjustment creation", "Movement export", "Receipt/order linkage"]
  },
  {
    id: "suppliers",
    slug: "suppliers",
    title: "Suppliers",
    shortTitle: "Suppliers",
    description: "Supplier profile and replenishment relationship entry point.",
    status: "backend-next",
    accessLevel: "VIEW",
    href: "/portal/inventory/suppliers",
    pageSummary: "Prepared route for supplier records, contact context, purchasing links, and replenishment readiness.",
    environmentRule: "Supplier test setup must be clearly separated from LIVE supplier ordering context.",
    roleGuidance: "Managers and authorised users will manage supplier details once backend wiring is scoped.",
    readiness: ["Route shell active", "Supplier destination prepared", "No live supplier claims made"],
    preparedFor: ["Supplier list", "Supplier contacts", "Supplier-to-item relationships", "Purchasing readiness"],
    deferredUntilBackend: ["Add/edit supplier", "Supplier item mapping", "Supplier order history", "Supplier portal integration"]
  },
  {
    id: "orders",
    slug: "orders",
    title: "Orders",
    shortTitle: "Orders",
    description: "Purchase order queue, draft order workspace, and order lifecycle destination.",
    status: "backend-next",
    accessLevel: "VIEW",
    href: "/portal/inventory/orders",
    pageSummary: "Prepared route for purchase order queues, manual order entry, draft packages, approvals, and lifecycle tracking.",
    environmentRule: "TRAINING orders must never submit to LIVE suppliers or mutate LIVE stock.",
    roleGuidance: "View access opens the route shell; create, approve, reject, and amend actions remain permission-gated later.",
    readiness: ["Route shell active", "Order lifecycle destination named", "Approval language kept non-operational"],
    preparedFor: ["Draft order workspace", "Supplier order queue", "Approval and rejection path", "Order tracking states"],
    deferredUntilBackend: ["Create draft PO", "Submit order", "Approve/reject order", "Supplier delivery status sync"]
  },
  {
    id: "receiving",
    slug: "receiving",
    title: "Receiving",
    shortTitle: "Receiving",
    description: "Goods receiving workflow prepared for supplier deliveries and discrepancies.",
    status: "backend-next",
    accessLevel: "VIEW",
    href: "/portal/inventory/receiving",
    pageSummary: "Prepared route for receiving supplier deliveries, confirming quantities, and recording discrepancies.",
    environmentRule: "Only LIVE receiving may eventually affect LIVE on-hand stock; TRAINING receiving is practice only.",
    roleGuidance: "Receiving actions will require workflow-specific permissions when operational data is connected.",
    readiness: ["Route shell active", "Receiving destination prepared", "Discrepancy copy included"],
    preparedFor: ["Delivery confirmation", "Partial receiving", "Discrepancy capture", "Movement creation after backend connection"],
    deferredUntilBackend: ["Receive against PO", "Quantity variance handling", "File upload/sync", "Live stock increment"]
  },
  {
    id: "wastage",
    slug: "wastage",
    title: "Wastage",
    shortTitle: "Wastage",
    description: "Controlled wastage capture destination for damaged, expired, or unusable stock.",
    status: "backend-next",
    accessLevel: "VIEW",
    href: "/portal/inventory/wastage",
    pageSummary: "Prepared route for recording damaged, expired, lost, or unusable stock in a controlled workflow.",
    environmentRule: "Training wastage must not reduce LIVE stock or distort LIVE wastage reports.",
    roleGuidance: "Capture and approval rules will be permission-gated when backend actions are introduced.",
    readiness: ["Route shell active", "Wastage category named", "Safety copy in place"],
    preparedFor: ["Wastage capture", "Reason codes", "Approval path", "Audit linkage"],
    deferredUntilBackend: ["Create wastage event", "Reduce stock", "Attach evidence", "Manager approval"]
  },
  {
    id: "store-use",
    slug: "store-use",
    title: "Store Use",
    shortTitle: "Store Use",
    description: "Internal stock usage workflow for operational consumption and non-sale use.",
    status: "backend-next",
    accessLevel: "VIEW",
    href: "/portal/inventory/store-use",
    pageSummary: "Prepared route for recording internal operational consumption that is not a customer sale.",
    environmentRule: "Internal use practice in TRAINING must not affect LIVE stock levels or LIVE cost reporting.",
    roleGuidance: "Staff may eventually capture allowed store-use events; approvals remain role-gated later.",
    readiness: ["Route shell active", "Store-use workflow identified", "No stock mutation enabled"],
    preparedFor: ["Internal consumption capture", "Reason/category structure", "Audit trail", "Reporting handoff"],
    deferredUntilBackend: ["Submit store-use event", "Stock decrement", "Cost allocation", "Manager review"]
  },
  {
    id: "reorder-review",
    slug: "reorder-review",
    title: "Reorder Review",
    shortTitle: "Reorder Review",
    description: "Replenishment review workspace prepared for recommendation and purchasing flows.",
    status: "backend-next",
    accessLevel: "VIEW",
    href: "/portal/inventory/reorder-review",
    pageSummary: "Prepared route for reviewing replenishment needs before purchase orders are created.",
    environmentRule: "TEST recommendations may validate logic, but only LIVE approved reorder decisions may feed LIVE purchasing.",
    roleGuidance: "Managers and authorised inventory users will use this route once stock thresholds and demand data are connected.",
    readiness: ["Route shell active", "Reorder review destination prepared", "Recommendation claims deferred"],
    preparedFor: ["Low stock review", "Supplier grouping", "Draft PO handoff", "Manager approval readiness"],
    deferredUntilBackend: ["Generate recommendations", "Create draft orders", "Demand coverage calculations", "Supplier consolidation"]
  },
  {
    id: "gap-scan",
    slug: "gap-scan",
    title: "Gap Scan",
    shortTitle: "Gap Scan",
    description: "Inventory risk scan destination for stock gaps, coverage issues, and exceptions.",
    status: "backend-next",
    accessLevel: "VIEW",
    href: "/portal/inventory/gap-scan",
    pageSummary: "Prepared route for identifying risk gaps, out-of-stock issues, threshold gaps, and coverage exceptions.",
    environmentRule: "TRAINING scans are practice only and must not create LIVE ordering pressure or LIVE exceptions.",
    roleGuidance: "Risk visibility can start with view access; corrective actions remain permission-gated later.",
    readiness: ["Route shell active", "Risk scan destination prepared", "No calculated results fabricated"],
    preparedFor: ["Stock gap list", "Threshold missing notice", "Coverage risk state", "Reorder handoff"],
    deferredUntilBackend: ["Run scan", "Calculate days left", "Explain selected issue", "Export scan results"]
  },
  {
    id: "stocktake",
    slug: "stocktake",
    title: "Stocktake",
    shortTitle: "Stocktake",
    description: "Stock count and variance workflow destination for controlled validation.",
    status: "backend-next",
    accessLevel: "VIEW",
    href: "/portal/inventory/stocktake",
    pageSummary: "Prepared route for physical counts, count sessions, variance review, and controlled approval.",
    environmentRule: "TEST stocktake validates process; LIVE stocktake must require explicit approval before stock changes.",
    roleGuidance: "Count entry, variance approval, and adjustment posting will be separated by role later.",
    readiness: ["Route shell active", "Stocktake destination prepared", "Variance controls described"],
    preparedFor: ["Count session list", "Variance review", "Approval workflow", "Adjustment posting after approval"],
    deferredUntilBackend: ["Start stocktake", "Enter counts", "Approve variance", "Post adjustments"]
  },
  {
    id: "reports",
    slug: "reports",
    title: "Reports",
    shortTitle: "Reports",
    description: "Inventory reports destination prepared for live operational reporting once connected.",
    status: "backend-next",
    accessLevel: "VIEW",
    href: "/portal/inventory/reports",
    pageSummary: "Prepared route for inventory reporting, exports, audit views, stock movement summaries, and operational visibility.",
    environmentRule: "LIVE reports are operational; TRAINING and TEST reports must be visually separated and non-operational.",
    roleGuidance: "Report visibility starts with view access and can be narrowed by report type later.",
    readiness: ["Route shell active", "Report destination prepared", "No fake metrics shown"],
    preparedFor: ["Stock report", "Movement report", "Supplier/order report", "Wastage and store-use report"],
    deferredUntilBackend: ["Generate reports", "Export CSV/PDF", "Schedule reports", "Cross-environment reporting controls"]
  },
  {
    id: "training-mode",
    slug: "training-mode",
    title: "Training Mode",
    shortTitle: "Training Mode",
    description: "Safe staff practice destination that must never affect live stock.",
    status: "training-safe",
    accessLevel: "VIEW",
    href: "/portal/inventory/training-mode",
    pageSummary: "Prepared route for staff practice flows with strong separation from LIVE stock and LIVE reporting.",
    environmentRule: "Training mode is safe practice only and must never affect LIVE stock, LIVE orders, or tax/commercial records.",
    roleGuidance: "Staff, supervisors, and managers may use training flows according to assigned environment access.",
    readiness: ["Route shell active", "Training safety rule visible", "Environment separation enforced by access guard"],
    preparedFor: ["Practice item lookup", "Practice receiving", "Practice stocktake", "Staff onboarding exercises"],
    deferredUntilBackend: ["Training reset", "Practice datasets", "Training audit log", "Scenario walkthroughs"]
  },
  {
    id: "inventory-settings",
    slug: "settings",
    title: "Settings / Admin",
    shortTitle: "Settings",
    description: "Inventory configuration destination for authorised managers and administrators.",
    status: "admin",
    accessLevel: "ADMINISTER",
    href: "/portal/inventory/settings",
    pageSummary: "Prepared route for Inventory configuration, thresholds, permissions, workflow settings, and admin controls.",
    environmentRule: "Settings must clearly identify which environment is being configured before operational changes are allowed.",
    roleGuidance: "Restricted to users with Inventory administer access.",
    readiness: ["Route shell active", "Admin guard active", "Configuration claims deferred"],
    preparedFor: ["Threshold configuration", "Workflow permissions", "Training reset controls", "Inventory admin settings"],
    deferredUntilBackend: ["Save thresholds", "Change workflow rules", "Manage scanner settings", "Configure supplier integrations"]
  }
];

export const portalModuleCatalog: PortalModuleEntry[] = [
  {
    id: "inventory",
    moduleKey: "INVENTORY",
    title: "Inventory",
    description: "Available first: stock control, suppliers, purchasing workflows, receiving, and inventory reporting.",
    href: "/portal/inventory",
    group: "available-first",
    status: "available",
    actionLabel: "Open Inventory",
    badgeLabel: "Available First",
    operational: true,
    accessLevel: "VIEW"
  },
  {
    id: "licensing",
    moduleKey: "LICENSING",
    title: "Licensing",
    description: "Plan status, seats, device allocations, and module entitlement visibility.",
    href: "/portal/licensing",
    group: "platform-foundation",
    status: "foundation",
    actionLabel: "Open Licensing",
    badgeLabel: "Platform Foundation",
    operational: true,
    accessLevel: "VIEW"
  },
  {
    id: "users",
    moduleKey: "ADMINISTRATION",
    title: "Users",
    description: "User invitations, role assignment, and staff access preparation.",
    href: "/portal/admin/users",
    group: "platform-foundation",
    status: "foundation",
    actionLabel: "Manage Users",
    badgeLabel: "Platform Foundation",
    operational: true,
    accessLevel: "ADMINISTER"
  },
  {
    id: "organisations",
    moduleKey: "ADMINISTRATION",
    title: "Organisations",
    description: "Organisation settings, customer context, currency, timezone, and operating profile.",
    href: "/portal/admin/organisation",
    group: "platform-foundation",
    status: "foundation",
    actionLabel: "Open Organisation",
    badgeLabel: "Platform Foundation",
    operational: true,
    accessLevel: "VIEW"
  },
  {
    id: "devices",
    moduleKey: "DEVICES",
    title: "Devices",
    description: "Registered terminals, scanners, inventory devices, and trusted workstations.",
    href: "/portal/devices",
    group: "platform-foundation",
    status: "foundation",
    actionLabel: "Open Devices",
    badgeLabel: "Platform Foundation",
    operational: true,
    accessLevel: "VIEW"
  },
  {
    id: "admin",
    moduleKey: "ADMINISTRATION",
    title: "Admin",
    description: "Controlled administration, onboarding, security review, and runtime QA visibility.",
    href: "/portal/admin/organisation",
    group: "platform-foundation",
    status: "foundation",
    actionLabel: "Open Admin",
    badgeLabel: "Platform Foundation",
    operational: true,
    accessLevel: "VIEW"
  },
  {
    id: "audit",
    moduleKey: "ADMINISTRATION",
    title: "Audit",
    description: "Read-only audit log visibility for portal and platform governance events.",
    href: "/portal/admin/audit",
    group: "platform-foundation",
    status: "foundation",
    actionLabel: "Open Audit",
    badgeLabel: "Platform Foundation",
    operational: true,
    accessLevel: "VIEW"
  },
  {
    id: "environment-settings",
    moduleKey: "ADMINISTRATION",
    title: "Environment Settings",
    description: "LIVE, TRAINING, and TEST environment access and separation controls.",
    href: "/portal/admin/environments",
    group: "platform-foundation",
    status: "foundation",
    actionLabel: "Open Environments",
    badgeLabel: "Platform Foundation",
    operational: true,
    accessLevel: "VIEW"
  },
  {
    id: "crm",
    moduleKey: "CRM",
    title: "CRM",
    description: "Future customer relationship module. Not part of the first Inventory commercial release.",
    href: "/portal/crm",
    group: "future-module",
    status: "future",
    actionLabel: "View Roadmap",
    badgeLabel: "Coming Later",
    operational: false
  },
  {
    id: "pos",
    moduleKey: "POS",
    title: "Point of Sale",
    description: "Future POS module. It should not be presented as operational customer access yet.",
    href: "/portal/pos",
    group: "future-module",
    status: "future",
    actionLabel: "View Roadmap",
    badgeLabel: "Coming Later",
    operational: false
  },
  {
    id: "forecasting",
    title: "Forecasting",
    description: "Roadmap module for demand forecasting and advanced inventory intelligence.",
    href: "/portal/roadmap/forecasting",
    group: "future-module",
    status: "roadmap",
    actionLabel: "View Roadmap",
    badgeLabel: "Roadmap Module",
    operational: false
  },
  {
    id: "purchasing-extensions",
    title: "Purchasing Extensions",
    description: "Roadmap extension for deeper purchasing, approvals, and supplier collaboration.",
    href: "/portal/roadmap/purchasing-extensions",
    group: "future-module",
    status: "roadmap",
    actionLabel: "View Roadmap",
    badgeLabel: "Roadmap Module",
    operational: false
  },
  {
    id: "payroll",
    title: "Payroll",
    description: "Roadmap module. Not included in the Inventory-first commercial portal build.",
    href: "/portal/roadmap/payroll",
    group: "future-module",
    status: "roadmap",
    actionLabel: "View Roadmap",
    badgeLabel: "Roadmap Module",
    operational: false
  },
  {
    id: "time-tracking",
    title: "Time Tracking",
    description: "Roadmap module. Kept secondary until Inventory is commercially ready.",
    href: "/portal/roadmap/time-tracking",
    group: "future-module",
    status: "roadmap",
    actionLabel: "View Roadmap",
    badgeLabel: "Roadmap Module",
    operational: false
  },
  {
    id: "advanced-integrations",
    title: "Advanced Integrations",
    description: "Roadmap capability for future integrations after core Inventory readiness.",
    href: "/portal/roadmap/advanced-integrations",
    group: "future-module",
    status: "roadmap",
    actionLabel: "View Roadmap",
    badgeLabel: "Roadmap Module",
    operational: false
  }
];

export function getPortalModulesByGroup(group: PortalModuleGroup) {
  return portalModuleCatalog.filter((module) => module.group === group);
}

export function getWorkflowStatusLabel(status: InventoryWorkflowStatus) {
  if (status === "ready-shell") return "Portal Shell Ready";
  if (status === "training-safe") return "Training Safe";
  if (status === "admin") return "Admin Controlled";
  return "Backend Wiring Next";
}

export function getInventoryWorkflowBySlug(slug: string) {
  return inventoryPortalWorkflows.find((workflow) => workflow.slug === slug) ?? null;
}

export function getInventoryWorkflowById(id: string) {
  return inventoryPortalWorkflows.find((workflow) => workflow.id === id) ?? null;
}

export function getInventoryWorkflowRoutes() {
  return inventoryPortalWorkflows.filter((workflow) => Boolean(workflow.slug));
}
