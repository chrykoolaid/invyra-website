import type { ModuleKey, PermissionLevel } from "@prisma/client";

export type PortalRouteGuardType =
  | "session-only"
  | "module-view"
  | "module-administer"
  | "future-roadmap"
  | "dynamic-inventory-workflow";

export type PortalRouteGuardEntry = {
  route: string;
  guardType: PortalRouteGuardType;
  module?: ModuleKey;
  level?: PermissionLevel;
  status: "operational-shell" | "preparation-shell" | "future-only" | "platform-foundation";
  notes: string;
};

export const portalRouteGuardRegistry: PortalRouteGuardEntry[] = [
  {
    route: "/portal",
    guardType: "session-only",
    status: "platform-foundation",
    notes: "Portal home renders visibility from the non-auditing permission snapshot and does not perform module mutation."
  },
  {
    route: "/portal/inventory",
    guardType: "module-view",
    module: "INVENTORY",
    level: "VIEW",
    status: "operational-shell",
    notes: "Primary Inventory entry route. Requires Inventory licence, current-environment access, and Inventory view permission."
  },
  {
    route: "/portal/inventory/[workflow]",
    guardType: "dynamic-inventory-workflow",
    module: "INVENTORY",
    level: "VIEW",
    status: "preparation-shell",
    notes: "Dynamic workflow route uses each workflow access level from inventoryPortalWorkflows; Settings requires ADMINISTER."
  },
  {
    route: "/portal/inventory/readiness",
    guardType: "module-view",
    module: "INVENTORY",
    level: "VIEW",
    status: "preparation-shell",
    notes: "Readiness is now aligned with the same Inventory view guard as setup and imports."
  },
  {
    route: "/portal/inventory/setup",
    guardType: "module-view",
    module: "INVENTORY",
    level: "VIEW",
    status: "preparation-shell",
    notes: "Setup action route is non-mutating and requires Inventory view access."
  },
  {
    route: "/portal/inventory/imports",
    guardType: "module-view",
    module: "INVENTORY",
    level: "VIEW",
    status: "preparation-shell",
    notes: "Import preparation route is non-mutating. Uploads, parsers, and writes remain disabled."
  },
  {
    route: "/portal/inventory/configuration",
    guardType: "module-administer",
    module: "INVENTORY",
    level: "ADMINISTER",
    status: "preparation-shell",
    notes: "Admin configuration shell requires Inventory administer access and does not save settings."
  },
  {
    route: "/portal/licensing",
    guardType: "module-view",
    module: "LICENSING",
    level: "VIEW",
    status: "platform-foundation",
    notes: "Licensing centre keeps CRM/POS and roadmap modules non-operational."
  },
  {
    route: "/portal/crm",
    guardType: "session-only",
    status: "future-only",
    notes: "CRM is a future-only information page. It has no operational Open or Launch path."
  },
  {
    route: "/portal/pos",
    guardType: "session-only",
    status: "future-only",
    notes: "POS is a future-only information page. It has no operational Open or Launch path."
  },
  {
    route: "/portal/roadmap/[module]",
    guardType: "future-roadmap",
    status: "future-only",
    notes: "Roadmap-only destination for Forecasting, Purchasing Extensions, Payroll, Time Tracking, and Advanced Integrations."
  }
];

export const portalRouteQaRules = [
  "Navigation visibility must use getPortalAccessSnapshot so normal rendering does not create access-denied audit noise.",
  "Runtime route entry must use canAccessModule for operational or preparation routes that require module entitlement.",
  "canAccessModule must honour user permission overrides the same way portal visibility does.",
  "Roadmap modules must not deep-link into active Inventory workflow routes.",
  "Future CRM and POS pages must remain session-protected, informational, and non-operational.",
  "Inventory preparation pages must not include upload controls, form submissions, Prisma writes, or live stock mutation."
];
