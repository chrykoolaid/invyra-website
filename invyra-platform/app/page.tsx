import Link from "next/link";

export default function PlatformEntryPage() {
  return (
    <main className="form-wrap">
      <section className="form-card">
        <h1>Invyra Platform Foundation</h1>
        <p>
          Wave 5 Phase 1B introduces protected platform APIs for authentication,
          organisation scoping, user lifecycle controls, environments, licensing, devices, and audit logs.
        </p>
        <p className="notice">Public marketing pages remain in the Wave 4 website. Secure platform access starts here.</p>
        <p><Link href="/login">Continue to login</Link></p>
      </section>
    </main>
  );
}
