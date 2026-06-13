import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/security/access-control";
import { PortalShell } from "@/components/PortalShell";

const checks = [
  "Organisation A cannot read Organisation B users, sessions, devices, licenses, or onboarding records.",
  "Every protected API route resolves current organisation from the active server session.",
  "Environment access uses the active session context and must not mix LIVE, TRAINING, and TEST.",
  "Expired or missing module licenses block module access even when role permissions exist.",
  "Access-denied, role-change, license-change, environment-switch, and device events are audit logged.",
  "Device activation requires valid activation codes and organisation-scoped entitlement checks."
];

export default async function TenantVerificationPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const allowed = await canAccessModule({ session, module: "ADMINISTRATION", level: "VIEW" });
  if (!allowed) redirect("/access-denied");

  return (
    <PortalShell session={session}>
      <section className="hero-card">
        <div>
          <p className="eyebrow">Security Verification</p>
          <h1>Tenant Verification</h1>
          <p>
            Controlled QA surface for organisation isolation, environment separation, licence checks, role permissions, and device trust.
          </p>
        </div>
      </section>

      <section className="dashboard-grid dashboard-grid-3">
        {checks.map((check) => (
          <article className="module-card compact-module-card" key={check}>
            <div className="module-card-header">
              <h3>Verification Check</h3>
              <span className="status-pill state-foundation">Controlled QA</span>
            </div>
            <p>{check}</p>
            <p className="module-meta">
              Expected result: blocked when invalid, allowed only when session, organisation, environment, permission, licence, and device trust conditions pass.
            </p>
          </article>
        ))}
      </section>
    </PortalShell>
  );
}
