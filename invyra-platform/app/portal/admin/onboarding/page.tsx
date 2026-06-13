import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";
import { PortalShell } from "@/components/PortalShell";
import { canAccessModule } from "@/lib/security/access-control";
import { getCurrentOnboardingWorkflow, listOrganisationAccessRequests } from "@/lib/onboarding/onboarding-management";

export default async function OnboardingAdminPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");

  const allowed = await canAccessModule({ session, module: "ADMINISTRATION", level: "VIEW" });
  if (!allowed) redirect("/access-denied");

  const [workflow, accessRequests] = await Promise.all([
    getCurrentOnboardingWorkflow(session),
    listOrganisationAccessRequests(session)
  ]);

  return (
    <PortalShell session={session}>
      <section className="card">
        <h1>Customer Onboarding</h1>
        <p>
          Wave 5 Phase 1D introduces the onboarding control layer for access requests, organisation setup,
          license assignment, device assignment, and portal access readiness.
        </p>
      </section>

      <section className="grid" style={{ marginTop: 16 }}>
        <div className="card">
          <h2>Current Workflow</h2>
          {workflow ? (
            <>
              <p><strong>Status:</strong> {workflow.status}</p>
              <p><strong>Started:</strong> {workflow.startedAt.toLocaleString()}</p>
              <ul>
                {workflow.steps.map((step) => (
                  <li key={step.id}>{step.order}. {step.label}: <strong>{step.status}</strong></li>
                ))}
              </ul>
            </>
          ) : (
            <p>No onboarding workflow has been created for this organisation yet.</p>
          )}
        </div>

        <div className="card">
          <h2>Organisation Access Requests</h2>
          {accessRequests.length ? (
            <ul>
              {accessRequests.map((request) => (
                <li key={request.id}>
                  <strong>{request.companyName}</strong> — {request.status}<br />
                  <span style={{ color: "#647089" }}>{request.requesterName} · {request.requesterEmail}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p>No organisation-scoped access requests are attached yet.</p>
          )}
        </div>
      </section>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>Phase 1D API Coverage</h2>
        <p>Protected onboarding APIs now support workflow creation, step updates, completion, and review logging.</p>
        <code>POST /api/onboarding/workflows</code><br />
        <code>PATCH /api/onboarding/workflows/:id/steps/:stepKey</code><br />
        <code>POST /api/onboarding/workflows/:id/complete</code>
      </section>
    </PortalShell>
  );
}
