"use client";

import { FormEvent, useState } from "react";

export default function CreateOrganisationAccessRequestPage() {
  const [status, setStatus] = useState<string>("");

  async function submitAccessRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus("Submitting access request...");

    const response = await fetch("/api/onboarding/access-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requesterName: form.get("requesterName"),
        requesterEmail: form.get("requesterEmail"),
        companyName: form.get("companyName"),
        message: form.get("message")
      })
    });

    const result = await response.json();
    setStatus(result.ok ? "Access request submitted." : result.error?.message ?? "Unable to submit access request.");
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>Request Invyra Platform Access</h1>
        <p>
          Submit an access request to begin organisation onboarding. Portal access remains invite-only until review,
          licensing, and device assignment are complete.
        </p>

        <form onSubmit={submitAccessRequest}>
          <label>
            Your name
            <input name="requesterName" required minLength={2} placeholder="Atilla Cokyavuz" />
          </label>
          <label>
            Email
            <input name="requesterEmail" required type="email" placeholder="you@example.com" />
          </label>
          <label>
            Company / organisation
            <input name="companyName" required minLength={2} placeholder="Invyra Demo Organisation" />
          </label>
          <label>
            Message
            <textarea name="message" rows={4} placeholder="Tell us what modules you are interested in." />
          </label>
          <button type="submit">Submit Access Request</button>
        </form>

        {status ? <p className="notice">{status}</p> : null}
      </section>
    </main>
  );
}
