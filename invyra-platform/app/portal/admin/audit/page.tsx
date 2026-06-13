import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { canAccessModule } from "@/lib/security/access-control";
import { PortalShell } from "@/components/PortalShell";

export default async function AuditPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const allowed = await canAccessModule({ session, module: "ADMINISTRATION", level: "VIEW" });
  if (!allowed) redirect("/access-denied");

  const [logs, accessDeniedCount, securityEventCount] = await Promise.all([
    prisma.auditLog.findMany({
      where: { organisationId: session.organisation.id },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    prisma.auditLog.count({ where: { organisationId: session.organisation.id, action: "ACCESS_DENIED" } }),
    prisma.auditLog.count({
      where: {
        organisationId: session.organisation.id,
        action: {
          in: [
            "LOGIN_SUCCESS",
            "LOGIN_FAILED",
            "LOGOUT",
            "PASSWORD_RESET_REQUESTED",
            "PASSWORD_RESET_COMPLETED",
            "SESSION_REVOKED",
            "SESSION_REVOKE_FAILED",
            "ACCESS_DENIED"
          ]
        }
      }
    })
  ]);

  return (
    <PortalShell session={session}>
      <section className="card">
        <h1>Audit Review</h1>
        <p className="notice">
          Phase 1E upgrades audit review from a simple event table into a security review surface. Logs remain organisation-scoped and environment-aware.
        </p>
      </section>

      <section className="grid" style={{ marginTop: 16 }}>
        <div className="card"><h2>Total events shown</h2><p style={{ fontSize: 28, fontWeight: 800 }}>{logs.length}</p></div>
        <div className="card"><h2>Access denied events</h2><p style={{ fontSize: 28, fontWeight: 800 }}>{accessDeniedCount}</p></div>
        <div className="card"><h2>Security events</h2><p style={{ fontSize: 28, fontWeight: 800 }}>{securityEventCount}</p></div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Recent Audit Events</h2>
        <table className="table">
          <thead><tr><th>Time</th><th>User</th><th>Action</th><th>Result</th><th>Module</th><th>Environment</th><th>Target</th></tr></thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.createdAt.toISOString()}</td>
                <td>{log.user?.email ?? "System"}</td>
                <td>{log.action}</td>
                <td>{log.result}</td>
                <td>{log.module ?? "-"}</td>
                <td>{log.environment ?? "-"}</td>
                <td>{log.targetType ? `${log.targetType}: ${log.targetId ?? "-"}` : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Phase 1E API Coverage</h2>
        <code>GET /api/audit</code><br />
        <code>GET /api/audit/security</code><br />
        <code>GET /api/audit/access-denied</code><br />
        <code>GET /api/security/sessions</code><br />
        <code>PATCH /api/security/sessions/:id/revoke</code>
      </section>
    </PortalShell>
  );
}
