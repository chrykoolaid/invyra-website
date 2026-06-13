import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { canAccessModule } from "@/lib/security/access-control";
import { PortalShell } from "@/components/PortalShell";

const qaChecks = [
  { area: "Logged-out portal redirect", expected: "Unauthenticated users are redirected away from /portal and protected APIs return 401." },
  { area: "Owner access", expected: "Seeded owner can open protected Administration, Users, Licensing, Devices, Audit, Security, and Runtime QA surfaces." },
  { area: "Staff restriction", expected: "Seeded staff can authenticate but cannot access Administration APIs or security audit review." },
  { area: "Environment", expected: "Current environment is visible in the shell and environment APIs remain protected." },
  { area: "Audit visibility", expected: "Security review surfaces expose access denied and failed-login visibility for administrators." },
  { area: "API smoke harness", expected: "npm run verify:api-smoke checks live local endpoints after migration, seed, and npm run dev." }
];

export default async function RuntimeQAPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const allowed = await canAccessModule({ session, module: "ADMINISTRATION", level: "VIEW" });
  if (!allowed) redirect("/access-denied");

  return (
    <PortalShell session={session}>
      <section className="card">
        <h1>Protected Portal Runtime QA</h1>
        <p className="notice">
          Phase 1H adds a runtime QA surface and API smoke-test harness for validating the protected portal after local install, Prisma migration, seed, and dev server startup.
        </p>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Local Runtime Command</h2>
        <pre>{`npm run verify:api-smoke`}</pre>
        <p>
          Run this after the local server is available. The harness validates logged-out protection, seeded owner access, seeded staff restrictions, and protected API reachability.
        </p>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Runtime QA Checklist</h2>
        <table className="table">
          <thead><tr><th>Area</th><th>Expected Result</th></tr></thead>
          <tbody>
            {qaChecks.map((check) => (
              <tr key={check.area}>
                <td>{check.area}</td>
                <td>{check.expected}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Phase 1H Scope Guard</h2>
        <p>
          This page does not enable live CRM, Inventory, POS, billing, integrations, AI services, or marketplace capabilities. It only supports platform foundation verification.
        </p>
      </section>
    </PortalShell>
  );
}
