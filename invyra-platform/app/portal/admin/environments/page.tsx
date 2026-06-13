import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/security/access-control";
import { listEnvironmentAccess } from "@/lib/environments/environment-management";
import { PortalShell } from "@/components/PortalShell";

export default async function EnvironmentsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const allowed = await canAccessModule({ session, module: "ADMINISTRATION", level: "VIEW" });
  if (!allowed) redirect("/access-denied");

  const environments = await listEnvironmentAccess(session);

  return (
    <PortalShell session={session}>
      <section className="card">
        <h1>Environment Management</h1>
        <p className="notice">LIVE, TRAINING, and TEST remain isolated. Switching environment updates the server session and creates an audit log.</p>
        <table className="table">
          <thead><tr><th>Environment</th><th>Organisation Enabled</th><th>User Allowed</th><th>Current</th></tr></thead>
          <tbody>
            {environments.map((environment) => (
              <tr key={environment.environment}>
                <td>{environment.visibleLabel}</td>
                <td>{environment.organisationEnabled ? "Enabled" : "Disabled"}</td>
                <td>{environment.memberAllowed ? "Allowed" : "Blocked"}</td>
                <td>{environment.active ? "Active" : "Available"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="notice">
          API: <code>GET /api/environments</code>, <code>GET /api/environments/current</code>, <code>POST /api/environments/switch</code>
        </div>
      </section>
    </PortalShell>
  );
}
