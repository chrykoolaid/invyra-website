// Invyra Portal Demo Authentication v1
// Static preview only. These are non-production demo credentials for local portal walkthroughs.
(function(){
  const DEMO_USERS = {
    'owner@demo.invyra': {
      password: 'InventoryDemo#2026',
      name: 'Demo Owner',
      role: 'Owner',
      organisation: 'ACME Retail Group',
      licence: 'Inventory Active',
      device: 'INV-DEMO-DEVICE-001'
    },
    'manager@demo.invyra': {
      password: 'InventoryDemo#2026',
      name: 'Demo Manager',
      role: 'Manager',
      organisation: 'ACME Retail Group',
      licence: 'Inventory Active',
      device: 'INV-DEMO-DEVICE-002'
    },
    'staff@demo.invyra': {
      password: 'InventoryDemo#2026',
      name: 'Demo Staff',
      role: 'Staff',
      organisation: 'ACME Retail Group',
      licence: 'Inventory Active',
      device: 'INV-DEMO-DEVICE-003'
    }
  };

  const SESSION_KEY = 'invyra_demo_portal_session_v1';

  function setText(selector, value){
    const node = document.querySelector(selector);
    if(node) node.textContent = value;
  }

  function loadSession(){
    try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); }
    catch(e){ return null; }
  }

  function saveSession(session){
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function clearSession(){
    localStorage.removeItem(SESSION_KEY);
  }

  function handleLogin(){
    const form = document.querySelector('[data-demo-login-form]');
    if(!form) return;
    const error = document.querySelector('[data-login-error]');
    const fillButtons = document.querySelectorAll('[data-fill-demo-user]');

    fillButtons.forEach((button) => {
      button.addEventListener('click', () => {
        const email = button.getAttribute('data-fill-demo-user');
        const user = DEMO_USERS[email];
        if(!user) return;
        form.querySelector('[name="identifier"]').value = email;
        form.querySelector('[name="password"]').value = user.password;
        form.querySelector('[name="environment"]').value = button.getAttribute('data-environment') || 'TRAINING';
        if(error) error.hidden = true;
      });
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const identifier = String(formData.get('identifier') || '').trim().toLowerCase();
      const password = String(formData.get('password') || '');
      const environment = String(formData.get('environment') || 'TRAINING');
      const user = DEMO_USERS[identifier];

      if(!user || user.password !== password){
        if(error){
          error.hidden = false;
          error.textContent = 'Login failed. Use one of the demo accounts shown on this page.';
        }
        return;
      }

      saveSession({
        email: identifier,
        name: user.name,
        role: user.role,
        organisation: user.organisation,
        licence: user.licence,
        device: user.device,
        environment,
        loggedInAt: new Date().toISOString()
      });
      window.location.href = '/invyra-website/app/dashboard.html';
    });
  }

  function handleDashboard(){
    const dashboard = document.querySelector('[data-demo-dashboard]');
    if(!dashboard) return;
    const session = loadSession();
    if(!session){
      window.location.href = '/invyra-website/app/?reason=session-required';
      return;
    }

    setText('[data-demo-org]', session.organisation || 'Demo Organisation');
    setText('[data-demo-context]', `${session.role || 'User'} · ${session.environment || 'TRAINING'} · ${session.licence || 'Inventory Active'}`);
    setText('[data-demo-env]', `Environment: ${session.environment || 'TRAINING'}`);
    setText('[data-demo-role]', `Role: ${session.role || 'User'}`);
    setText('[data-demo-device]', `Device: ${session.device || 'Activated'}`);
    setText('[data-demo-user]', `${session.name || 'Demo User'} signed in`);

    const logout = document.querySelector('[data-demo-logout]');
    if(logout){
      logout.addEventListener('click', (event) => {
        event.preventDefault();
        clearSession();
        window.location.href = '/invyra-website/app/';
      });
    }
  }

  function handleSessionReason(){
    const reason = new URLSearchParams(window.location.search).get('reason');
    const notice = document.querySelector('[data-session-notice]');
    if(reason === 'session-required' && notice){
      notice.hidden = false;
      notice.textContent = 'Please sign in with a demo credential before opening the Inventory dashboard.';
    }
  }


  function handlePreviewActions(){
    const buttons = document.querySelectorAll('[data-preview-action]');
    if(!buttons.length) return;
    const notice = document.querySelector('[data-preview-action-notice]');
    buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.getAttribute('data-preview-action') || 'Workflow action';
        if(notice){
          notice.hidden = false;
          notice.textContent = `${action} opened in portal preview mode. Production save/post behaviour remains gated until runtime database certification.`;
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    handleLogin();
    handleDashboard();
    handleSessionReason();
    handlePreviewActions();
  });
})();
