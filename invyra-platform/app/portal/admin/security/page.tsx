import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/security/access-control";
import { PortalShell } from "@/components/PortalShell";
import { getSecuritySummary, listAccessDeniedAuditLogs, listFailedLoginAttempts, listOrganisationSessions } from "@/lib/security/session-security";

function metadataReason(metadata: unknown) {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata) && "reason" in metadata) {
    return String((metadata as { reason?: unknown }).reason ?? "Access denied");
  }
  return "Access denied";
}

export default async function SecurityReviewPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const allowed = await canAccessModule({ session, module: "ADMINISTRATION", level: "VIEW" });
  if (!allowed) redirect("/access-denied");

  const [summary, sessions, failedLogins, deniedLogs] = await Promise.all([
    getSecuritySummary(session),
    listOrganisationSessions(session),
    listFailedLoginAttempts(session),
    listAccessDeniedAuditLogs(session)
  ]);

  return (
    <PortalShell session={session}>
      <section className="card">
        <h1>Session Security Review</h1>
        <p className="notice">
          Phase 1E adds organisation-scoped session visibility, failed login visibility, access-denied review, and protected session revocation APIs.
        </p>
      </section>

      <section className="grid" style={{ marginTop: 16 }}>
        <div className="card"><h2>Active sessions</h2><p style={{ fontSize: 28, fontWeight: 800 }}>{summary.activeSessions}</p></div>
        <div className="card"><h2>Expired sessions</h2><p style={{ fontSize: 28, fontWeight: 800 }}>{summary.expiredSessions}</p></div>
        <div className="card"><h2>Failed logins / 24h</h2><p style={{ fontSize: 28, fontWeight: 800 }}>{summary.failedLoginsLast24h}</p></div>
        <div className="card"><h2>Access denied / 24h</h2><p style={{ fontSize: 28, fontWeight: 800 }}>{summary.accessDeniedLast24h}</p></div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Organisation Sessions</h2>
        <table className="table">
          <thead><tr><th>User</th><th>Environment</th><th>State</th><th>Current</th><th>Last Activity</th><th>Expires</th><th>IP</th></tr></thead>
          <tbody>
            {sessions.map((record) => (
              <tr key={record.id}>
                <td>{record.userDisplayName}<br /><span style={{ color: "#647089" }}>{record.userEmail}</span></td>
                <td>{record.environment}</td>
                <td>{record.state}</td>
                <td>{record.current ? "Yes" : "No"}</td>
                <td>{record.lastActivityAt.toISOString()}</td>
                <td>{record.expiresAt.toISOString()}</td>
                <td>{record.ipAddress ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Recent Failed Logins</h2>
        <table className="table">
          <thead><tr><th>Time</th><th>Email / Username</th><th>Reason</th><th>IP</th></tr></thead>
          <tbody>
            {failedLogins.length ? failedLogins.slice(0, 20).map((attempt) => (
              <tr key={attempt.id}>
                <td>{attempt.createdAt.toISOString()}</td>
                <td>{attempt.emailOrUsername}</td>
                <td>{attempt.reason}</td>
                <td>{attempt.ipAddress ?? "-"}</td>
              </tr>
            )) : <tr><td colSpan={4}>No failed logins recorded.</td></tr>}
          </tbody>
        </table>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Recent Access Denied Events</h2>
        <table className="table">
          <thead><tr><th>Time</th><th>User</th><th>Module</th><th>Environment</th><th>Reason</th></tr></thead>
          <tbody>
            {deniedLogs.length ? deniedLogs.slice(0, 20).map((log) => (
              <tr key={log.id}>
                <td>{log.createdAt.toISOString()}</td>
                <td>{log.user?.email ?? "System"}</td>
                <td>{log.module ?? "-"}</td>
                <td>{log.environment ?? "-"}</td>
                <td>{metadataReason(log.metadata)}</td>
              </tr>
            )) : <tr><td colSpan={5}>No access denied events recorded.</td></tr>}
          </tbody>
        </table>
      </section>
    </PortalShell>
  );
}
