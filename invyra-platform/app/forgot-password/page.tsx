
export default function ForgotPasswordPage() {
  return (
    <main className="form-wrap portal-auth-wrap">
      <section className="form-card portal-auth-form-card">
        <p className="eyebrow">Account recovery</p>
        <h1>Reset your Inventory portal password</h1>
        <p className="notice">
          Enter your email address. If the account exists, a reset workflow will be created and audit-visible.
          Production email delivery is reserved for the deployment hardening pass.
        </p>
        <form method="post" action="/api/auth/forgot-password">
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <button className="primary-btn" type="submit">Request reset</button>
        </form>
        <p><a href="/login">Back to login</a></p>
      </section>
      <aside className="form-card portal-auth-side-card">
        <h2>Password workflow</h2>
        <ol>
          <li>Request reset</li>
          <li>Generate hashed token</li>
          <li>Validate expiry</li>
          <li>Set new password</li>
          <li>Return to portal login</li>
        </ol>
      </aside>
    </main>
  );
}
