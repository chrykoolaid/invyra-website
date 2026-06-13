export type InventoryReadinessState = "complete" | "needs-action" | "optional" | "deferred";

export type InventoryReadinessStep = {
  id: string;
  title: string;
  description: string;
  state: InventoryReadinessState;
  href: string;
  actionLabel: string;
  owner: string;
  notes: string[];
};

export type InventoryReadinessInput = {
  organisationReady: boolean;
  inventoryLicensed: boolean;
  inventoryViewAllowed: boolean;
  environmentAllowed: boolean;
  environment: string;
  activeUsers: number;
  pendingInvites: number;
  registeredDevices: number;
  activatedDevices: number;
  workflowShellsReady: boolean;
  importPreparationReady?: boolean;
};

export function getInventoryReadinessLabel(state: InventoryReadinessState) {
  if (state === "complete") return "Complete";
  if (state === "needs-action") return "Needs Setup";
  if (state === "optional") return "Optional";
  return "Deferred";
}

export function getInventoryReadinessClass(state: InventoryReadinessState) {
  if (state === "complete") return "state-enabled";
  if (state === "needs-action") return "state-early";
  if (state === "optional") return "state-foundation";
  return "state-muted";
}

export function buildInventoryReadinessSteps(input: InventoryReadinessInput): InventoryReadinessStep[] {
  return [
    {
      id: "organisation-context",
      title: "Confirm organisation context",
      description: "Verify the customer organisation, industry, timezone, and currency before live Inventory setup.",
      state: input.organisationReady ? "complete" : "needs-action",
      href: "/portal/admin/organisation",
      actionLabel: "Review Organisation",
      owner: "Owner / Admin",
      notes: [
        input.organisationReady ? "Organisation profile is configured." : "Organisation profile needs review.",
        "Currency and timezone affect customer-facing Inventory context.",
        "This does not create or change Inventory stock data."
      ]
    },
    {
      id: "inventory-licence",
      title: "Enable Inventory licence",
      description: "Inventory must be the active commercial entitlement before customers can access Inventory workflows.",
      state: input.inventoryLicensed ? "complete" : "needs-action",
      href: "/portal/licensing",
      actionLabel: "Review Licence",
      owner: "Owner / Admin",
      notes: [
        input.inventoryLicensed ? "Inventory entitlement is present." : "Inventory entitlement is not active yet.",
        "CRM and POS remain future-only and should not be treated as active products.",
        "Licence state controls module access before any workflow data is shown."
      ]
    },
    {
      id: "role-access",
      title: "Confirm role access",
      description: "User role and permissions must allow Inventory visibility before workflow routes open normally.",
      state: input.inventoryViewAllowed ? "complete" : "needs-action",
      href: "/portal/admin/users",
      actionLabel: "Review Users",
      owner: "Admin / Manager",
      notes: [
        input.inventoryViewAllowed ? "This user can view Inventory." : "This user does not currently have Inventory view access.",
        "Restricted workflows stay labelled instead of silently disappearing.",
        "Admin-only settings remain protected by INVENTORY.ADMINISTER."
      ]
    },
    {
      id: "environment-awareness",
      title: "Confirm environment awareness",
      description: "LIVE, TRAINING, and TEST must remain visually separated before any operational workflow is connected.",
      state: input.environmentAllowed ? "complete" : "needs-action",
      href: "/portal/admin/environments",
      actionLabel: "Review Environments",
      owner: "Admin",
      notes: [
        `Current environment: ${input.environment}.`,
        input.environmentAllowed ? "Environment access is allowed for this user." : "Environment access is restricted for this user.",
        "TRAINING and TEST must never affect LIVE stock."
      ]
    },
    {
      id: "team-setup",
      title: "Prepare team access",
      description: "Add the people who will use Inventory and keep invited users visible until they activate access.",
      state: input.activeUsers > 0 ? "complete" : "needs-action",
      href: "/portal/admin/users",
      actionLabel: "Manage Team",
      owner: "Owner / Admin",
      notes: [
        `${input.activeUsers} active user${input.activeUsers === 1 ? "" : "s"}.`,
        `${input.pendingInvites} pending invite${input.pendingInvites === 1 ? "" : "s"}.`,
        "Staff, Supervisor, Manager, Admin, Owner, and future Support visibility is prepared by role."
      ]
    },
    {
      id: "device-readiness",
      title: "Register devices when needed",
      description: "Inventory portal can open without devices, but terminals, scanners, and trusted workstations should be prepared before operations.",
      state: input.activatedDevices > 0 ? "complete" : "optional",
      href: "/portal/devices",
      actionLabel: "Review Devices",
      owner: "Admin / Support",
      notes: [
        `${input.activatedDevices} active device${input.activatedDevices === 1 ? "" : "s"}.`,
        `${input.registeredDevices} total registered device${input.registeredDevices === 1 ? "" : "s"}.`,
        "Device setup becomes more important before scanner and receiving workflows go live."
      ]
    },
    {
      id: "workflow-shells",
      title: "Review Inventory workflow shells",
      description: "Workflow routes and empty states are prepared before backend data is connected.",
      state: input.workflowShellsReady ? "complete" : "needs-action",
      href: "/portal/inventory",
      actionLabel: "Open Inventory",
      owner: "Implementation",
      notes: [
        input.workflowShellsReady ? "Inventory workflow shell routes are available." : "Inventory workflow routes need implementation.",
        "Items, Movements, Suppliers, Orders, Receiving, Wastage, Store Use, Reorder Review, Gap Scan, Stocktake, Reports, Training, and Settings have route shells.",
        "Each shell must show honest empty states until data wiring begins."
      ]
    },
    {
      id: "data-import-preparation",
      title: "Prepare data import templates",
      description: "Review item, supplier, opening balance, reorder level, and supplier mapping templates before backend upload is enabled.",
      state: input.importPreparationReady === false ? "needs-action" : "optional",
      href: "/portal/inventory/imports",
      actionLabel: "Open Import Preparation",
      owner: "Implementation / Admin",
      notes: [
        input.importPreparationReady === false ? "Import template preparation needs review." : "Import template preparation is available.",
        "Uploads, parsing, preview approval, and database writes are not enabled in this phase.",
        "Import planning must keep LIVE, TRAINING, and TEST data separated."
      ]
    },
    {
      id: "backend-connection",
      title: "Connect Inventory backend later",
      description: "Live item, stock, supplier, order, receiving, and reporting data are deliberately deferred until explicitly scoped.",
      state: "deferred",
      href: "/portal/inventory",
      actionLabel: "View Boundaries",
      owner: "Future Scope",
      notes: [
        "No fake stock totals, supplier rows, order queues, reports, or AI outputs are displayed.",
        "Backend integration must preserve organisation, role, licence, device, and environment separation.",
        "Operational actions need audit logging before release."
      ]
    }
  ];
}

export function getInventoryReadinessSummary(steps: InventoryReadinessStep[]) {
  const requiredSteps = steps.filter((step) => step.state !== "optional" && step.state !== "deferred");
  const completeRequired = requiredSteps.filter((step) => step.state === "complete").length;
  const needsAction = steps.filter((step) => step.state === "needs-action").length;
  const optional = steps.filter((step) => step.state === "optional").length;
  const deferred = steps.filter((step) => step.state === "deferred").length;

  return {
    requiredTotal: requiredSteps.length,
    completeRequired,
    needsAction,
    optional,
    deferred,
    readyForShellUse: requiredSteps.length > 0 && completeRequired === requiredSteps.length
  };
}

export const inventoryEmptyStatePrinciples = [
  "Show exactly what is missing before showing data.",
  "Do not display sample stock, suppliers, orders, movements, or report metrics.",
  "Always keep LIVE, TRAINING, and TEST context visible.",
  "Offer the next safe setup action instead of a dead blank page.",
  "Label backend connection as deferred until a dedicated implementation phase starts."
];
