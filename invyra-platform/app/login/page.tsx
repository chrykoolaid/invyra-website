
type LoginPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const error = params?.error;

  return (
    <main className="form-wrap portal-auth-wrap">
      <section className="form-card portal-auth-form-card">
        <p className="eyebrow">Invyra Inventory portal</p>
        <h1>Sign in to your Inventory workspace</h1>
        <p className="notice">Login creates a protected session, then checks organisation membership, Inventory licence, role permissions, device context, and environment access.</p>
        {error ? <p className="error">{decodeURIComponent(error)}</p> : null}
        <form method="post" action="/api/auth/login">
          <div className="field">
            <label htmlFor="identifier">Email or username</label>
            <input id="identifier" name="identifier" autoComplete="username" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <button className="primary-btn" type="submit">Sign in to Inventory Portal</button>
        </form>
        <div className="portal-auth-link-row">
          <a href="/forgot-password">Forgot password?</a>
          <a href="/activate">Activate a device</a>
          <a href="/portal/onboarding">First login / onboarding</a>
        </div>
      </section>
      <aside className="form-card portal-auth-side-card">
        <h2>Access gates</h2>
        <ol>
          <li>Identity login</li>
          <li>Organisation membership</li>
          <li>Inventory licence entitlement</li>
          <li>Device and environment check</li>
          <li>Role-based Inventory workflows</li>
        </ol>
        <p className="notice">CRM and POS remain future modules and do not open from this portal path.</p>
      </aside>
    </main>
  );
}
