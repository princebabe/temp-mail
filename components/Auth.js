export const Auth = (type = 'login') => `
  <section class="auth fade-in">
    <div class="container container-auth">
      <div class="auth-card">
        <div class="auth-header">
          <h2>${type === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p>${type === 'login' ? 'Enter your credentials to access your trash mails.' : 'Join 1M+ users and secure your privacy today.'}</p>
        </div>
        <form class="auth-form" id="auth-form">
          ${type === 'signup' ? `
            <div class="form-group">
              <label>Full Name</label>
              <input type="text" id="auth-name" placeholder="John Doe" />
            </div>
          ` : ''}
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="auth-email" placeholder="name@example.com" />
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="auth-password" placeholder="••••••••" />
          </div>
          <button type="submit" class="btn btn-primary btn-block" data-action="submit-auth" data-auth-type="${type}">${type === 'login' ? 'Sign In' : 'Create Account'}</button>
        </form>
        <div class="auth-footer">
          <p>${type === 'login' ? "Don't have an account?" : "Already have an account?"} <a href="#" data-action="${type === 'login' ? 'signup' : 'login'}" class="auth-link">${type === 'login' ? 'Sign Up' : 'Login'}</a></p>
        </div>
      </div>
    </div>
  </section>
`;

export const injectAuthStyles = () => {
  if (document.getElementById('auth-styles')) return;
  const style = document.createElement('style');
  style.id = 'auth-styles';
  style.textContent = `
    .container-auth { max-width: 450px; display: flex; align-items: center; justify-content: center; min-height: 80vh; }
    .auth-card {
      background: var(--bg-card);
      padding: 3rem;
      border-radius: var(--border-radius);
      border: 1px solid rgba(124, 58, 237, 0.2);
      width: 100%;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
    }
    .auth-header { text-align: center; margin-bottom: 2rem; }
    .auth-header h2 { font-size: 2rem; margin-bottom: 0.5rem; }
    .auth-header p { color: var(--text-muted); font-size: 0.9rem; }
    .form-group { margin-bottom: 1.5rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 500; }
    .form-group input {
      width: 100%;
      padding: 0.8rem 1rem;
      background: rgba(0,0,0,0.2);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px;
      color: white;
      outline: none;
      font-family: var(--font-sans);
      font-size: 0.95rem;
      transition: var(--transition);
    }
    .form-group input:focus { border-color: var(--primary-purple); box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15); }
    .btn-block { width: 100%; margin-top: 1rem; }
    .auth-footer { margin-top: 2rem; text-align: center; font-size: 0.9rem; color: var(--text-muted); }
    .auth-link { color: var(--primary-purple); font-weight: 600; }
    .auth-link:hover { text-decoration: underline; }
    .toast {
      position: fixed; bottom: 2rem; right: 2rem;
      background: var(--bg-card); border: 1px solid var(--primary-purple);
      padding: 1rem 2rem; border-radius: 10px; color: white;
      font-size: 0.9rem; z-index: 9999;
      animation: slideUp 0.3s ease, fadeOut 0.3s ease 2.5s forwards;
    }
    .toast.error { border-color: #EF4444; }
    .toast.success { border-color: #22C55E; }
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes fadeOut { to { opacity: 0; transform: translateY(20px); } }
  `;
  document.head.appendChild(style);
};
