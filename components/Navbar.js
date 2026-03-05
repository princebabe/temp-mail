export const Navbar = () => `
  <nav class="navbar">
    <div class="container navbar-content">
      <div class="logo" data-action="home" style="cursor:pointer">
        <span class="logo-icon">🗑️</span>
        <span class="logo-text">Trash Mails</span>
      </div>
      <ul class="nav-links">
        <li><a href="#features">Features</a></li>
        <li><a href="#pricing">Pricing</a></li>
        <li><a href="#blog">Blog</a></li>
        <li><a href="#faq">FAQ</a></li>
      </ul>
      <div class="nav-actions">
        <button class="btn btn-outline" data-action="login">Login</button>
        <button class="btn btn-primary" data-action="signup">Get Started</button>
      </div>
    </div>
  </nav>
`;

export const injectNavbarStyles = () => {
  if (document.getElementById('navbar-styles')) return;
  const style = document.createElement('style');
  style.id = 'navbar-styles';
  style.textContent = `
    .navbar {
      height: 80px;
      display: flex;
      align-items: center;
      background-color: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(10px);
      position: sticky;
      top: 0;
      z-index: 1000;
      border-bottom: 1px solid rgba(124, 58, 237, 0.2);
    }
    .navbar-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-main);
    }
    .logo-icon { font-size: 2rem; }
    .nav-links {
      display: flex;
      gap: 2rem;
    }
    .nav-links a {
      font-weight: 500;
      color: var(--text-muted);
      transition: var(--transition);
    }
    .nav-links a:hover {
      color: var(--primary-purple);
    }
    .nav-actions {
      display: flex;
      gap: 1rem;
    }
    @media (max-width: 768px) {
      .nav-links { display: none; }
    }
  `;
  document.head.appendChild(style);
};
