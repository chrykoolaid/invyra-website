import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/security/access-control";
import { listDevices } from "@/lib/devices/device-activation";
import { PortalShell } from "@/components/PortalShell";

export default async function DevicesPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const allowed = await canAccessModule({ session, module: "DEVICES", level: "VIEW" });
  if (!allowed) redirect("/access-denied");

  const devices = await listDevices(session);

  return (
    <PortalShell session={session}>
      <section className="card">
        <h1>Device Activation Foundation</h1>
        <p className="notice">Phase 1B adds activation-code generation, public device claiming, device suspension, and device retirement APIs with organisation scoping and audit logging.</p>
        <table className="table">
          <thead><tr><th>Name</th><th>Type</th><th>Status</th><th>Location</th><th>Activated</th></tr></thead>
          <tbody>
            {devices.length === 0 ? (
              <tr><td colSpan={5}>No devices registered yet.</td></tr>
            ) : devices.map((device) => (
              <tr key={device.id}>
                <td>{device.deviceName}</td>
                <td>{device.deviceType}</td>
                <td>{device.status}</td>
                <td>{device.assignedLocation ?? "Unassigned"}</td>
                <td>{device.activatedAt ? device.activatedAt.toLocaleString() : "Pending"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="notice">
          APIs: <code>GET /api/devices</code>, <code>POST /api/devices/activation-code</code>, <code>POST /api/devices/activate</code>, <code>PATCH /api/devices/:id/suspend</code>, <code>PATCH /api/devices/:id/retire</code>
        </div>
      </section>
    </PortalShell>
  );
}
