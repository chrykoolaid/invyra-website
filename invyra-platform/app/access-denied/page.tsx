import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <main className="form-wrap">
      <section className="form-card">
        <h1>Access restricted</h1>
        <p className="notice">
          Your session, organisation membership, environment access, role permission, license entitlement,
          or device trust state does not allow this action.
        </p>
        <p><Link href="/portal">Return to portal</Link></p>
      </section>
    </main>
  );
}
