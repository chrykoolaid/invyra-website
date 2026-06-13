
export default function ResetPasswordPage() {
  return (
    <main className="form-wrap portal-auth-wrap">
      <section className="form-card portal-auth-form-card">
        <p className="eyebrow">Account recovery</p>
        <h1>Choose a new portal password</h1>
        <p className="notice">Password reset tokens are hashed in the database and expire automatically.</p>
        <form method="post" action="/api/auth/reset-password">
          <div className="field">
            <label htmlFor="token">Reset token</label>
            <input id="token" name="token" required />
          </div>
          <div className="field">
            <label htmlFor="password">New password</label>
            <input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required />
          </div>
          <button className="primary-btn" type="submit">Update password</button>
        </form>
        <p><a href="/login">Return to login</a></p>
      </section>
      <aside className="form-card portal-auth-side-card">
        <h2>Security rule</h2>
        <p className="notice">Reset does not grant portal access by itself. The user still passes organisation, licence, device, environment, and role checks after login.</p>
      </aside>
    </main>
  );
}
