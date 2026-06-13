import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/security/access-control";
import { listOrganisationUsers } from "@/lib/users/user-management";
import { PortalShell } from "@/components/PortalShell";

export default async function UsersPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const allowed = await canAccessModule({ session, module: "ADMINISTRATION", level: "ADMINISTER" });
  if (!allowed) redirect("/access-denied");

  const memberships = await listOrganisationUsers(session);

  return (
    <PortalShell session={session}>
      <section className="card">
        <h1>User Management</h1>
        <p className="notice">Phase 1B adds protected APIs for invite, activate, suspend, deactivate, and role assignment. Owner transfer remains intentionally blocked.</p>
        <table className="table">
          <thead><tr><th>User</th><th>Email</th><th>Role</th><th>User Status</th><th>Membership</th></tr></thead>
          <tbody>
            {memberships.map((membership) => (
              <tr key={membership.id}>
                <td>{membership.user.displayName}</td>
                <td>{membership.user.email}</td>
                <td>{membership.role.name}</td>
                <td>{membership.user.status}</td>
                <td>{membership.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="notice">
          APIs: <code>GET /api/users</code>, <code>POST /api/users/invite</code>, <code>PATCH /api/users/:id/activate</code>, <code>PATCH /api/users/:id/suspend</code>, <code>PATCH /api/users/:id/deactivate</code>, <code>PATCH /api/users/:id/role</code>
        </div>
      </section>
    </PortalShell>
  );
}
