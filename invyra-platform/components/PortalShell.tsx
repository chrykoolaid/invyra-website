import Link from "next/link";
import type { ReactNode } from "react";
import type { ModuleKey, PermissionLevel } from "@prisma/client";
import type { CurrentSession } from "@/lib/auth/session";
import { getPortalModulesByGroup, inventoryPortalWorkflows } from "@/lib/portal/module-catalog";
import {
  getInventoryWorkflowVisibility,
  getPortalAccessSnapshot,
  getPortalModuleVisibility,
  getVisibilityLabel,
  type PortalVisibilityState
} from "@/lib/portal/portal-access";

type NavLink = {
  label: string;
  href: string;
  state: PortalVisibilityState;
  module?: ModuleKey;
  accessLevel?: PermissionLevel;
};

const extraPlatformNav: NavLink[] = [
  { label: "First Login", href: "/portal/onboarding", state: "available", module: "ADMINISTRATION", accessLevel: "VIEW" },
  { label: "Onboarding Admin", href: "/portal/admin/onboarding", state: "available", module: "ADMINISTRATION", accessLevel: "VIEW" },
  { label: "Security Review", href: "/portal/admin/security", state: "available", module: "ADMINISTRATION", accessLevel: "VIEW" },
  { label: "Tenant Verification", href: "/portal/admin/tenant-verification", state: "available", module: "ADMINISTRATION", accessLevel: "VIEW" },
  { label: "Runtime QA", href: "/portal/admin/qa", state: "available", module: "ADMINISTRATION", accessLevel: "VIEW" }
];

const futureNav: NavLink[] = getPortalModulesByGroup("future-module").map((module) => ({
  label: module.title,
  href: module.href,
  state: module.status === "future" ? "future" : "roadmap"
}));

function NavGroup({ title, links }: { title: string; links: NavLink[] }) {
  return (
    <div className="sidebar-group">
      <span className="sidebar-group-title">{title}</span>
      {links.map((link) => {
        const label = link.state === "available" ? link.label : `${link.label} · ${getVisibilityLabel(link.state)}`;
        if (link.state === "restricted") {
          return (
            <span className="sidebar-disabled-link" key={`${title}-${link.label}`}>
              {label}
            </span>
          );
        }

        return (
          <Link
            className={link.state === "available" ? undefined : `sidebar-soft-link sidebar-${link.state}`}
            href={link.state === "licence-required" ? "/portal/licensing" : link.href}
            key={`${title}-${link.label}`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

export async function PortalShell({ session, children }: { session: NonNullable<CurrentSession>; children: ReactNode }) {
  const accessSnapshot = await getPortalAccessSnapshot(session);

  const inventoryAdminWorkflow = inventoryPortalWorkflows.find((workflow) => workflow.id === "inventory-settings") ?? inventoryPortalWorkflows[0];

  const inventoryNav: NavLink[] = [
    ...inventoryPortalWorkflows.map((workflow) => ({
      label: workflow.shortTitle,
      href: workflow.href,
      state: getInventoryWorkflowVisibility(workflow, accessSnapshot),
      module: "INVENTORY" as ModuleKey,
      accessLevel: workflow.accessLevel
    })),
    {
      label: "Ledger",
      href: "/portal/inventory/ledger",
      state: getInventoryWorkflowVisibility(inventoryPortalWorkflows[0], accessSnapshot),
      module: "INVENTORY" as ModuleKey,
      accessLevel: "VIEW" as PermissionLevel
    },
    {
      label: "Readiness",
      href: "/portal/inventory/readiness",
      state: getInventoryWorkflowVisibility(inventoryPortalWorkflows[0], accessSnapshot),
      module: "INVENTORY" as ModuleKey,
      accessLevel: "VIEW" as PermissionLevel
    },
    {
      label: "Setup Actions",
      href: "/portal/inventory/setup",
      state: getInventoryWorkflowVisibility(inventoryPortalWorkflows[0], accessSnapshot),
      module: "INVENTORY" as ModuleKey,
      accessLevel: "VIEW" as PermissionLevel
    },
    {
      label: "Data Import Prep",
      href: "/portal/inventory/imports",
      state: getInventoryWorkflowVisibility(inventoryPortalWorkflows[0], accessSnapshot),
      module: "INVENTORY" as ModuleKey,
      accessLevel: "VIEW" as PermissionLevel
    },
    {
      label: "Admin Config",
      href: "/portal/inventory/configuration",
      state: getInventoryWorkflowVisibility(inventoryAdminWorkflow, accessSnapshot),
      module: "INVENTORY" as ModuleKey,
      accessLevel: "ADMINISTER" as PermissionLevel
    }
  ];

  const platformNav: NavLink[] = [
    ...getPortalModulesByGroup("platform-foundation").map((module) => ({
      label: module.title,
      href: module.href,
      state: getPortalModuleVisibility(module, accessSnapshot),
      module: module.moduleKey,
      accessLevel: module.accessLevel ?? "VIEW"
    })),
    ...extraPlatformNav.map((link) => ({
      ...link,
      state: link.module ? (
        accessSnapshot.environmentAllowed &&
        accessSnapshot.enabledModules.has(link.module) &&
        accessSnapshot.permissions.has(`${link.module}.${link.accessLevel ?? "VIEW"}`)
          ? "available"
          : accessSnapshot.enabledModules.has(link.module)
            ? "restricted"
            : "licence-required"
      ) : link.state
    }))
  ];

  return (
    <div className="shell">
      <aside className="sidebar">
        <h1>Invyra Portal</h1>
        <nav>
          <Link className="sidebar-home-link" href="/portal">Portal Home</Link>
          <NavGroup title="Inventory" links={inventoryNav} />
          <NavGroup title="Platform" links={platformNav} />
          <NavGroup title="Future" links={futureNav} />
          <form method="post" action="/api/auth/logout">
            <button type="submit">Logout</button>
          </form>
        </nav>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <strong>{session.organisation.name}</strong>
            <div style={{ color: "#647089", fontSize: 14 }}>{session.user.displayName}</div>
          </div>
          <div className="badges">
            <span className="badge">Environment: {session.environment}</span>
            <span className="badge">Role: {session.membership.role.name}</span>
            <span className="badge">Inventory-first portal</span>
            {!accessSnapshot.environmentAllowed ? <span className="badge badge-warning">Environment access restricted</span> : null}
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
