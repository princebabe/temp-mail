export const Hero = () => `
  <section class="hero fade-in">
    <div class="container hero-content">
      <div class="hero-text">
        <h1 class="hero-title">Secure Your Privacy with <span class="highlight">Trash Mails</span></h1>
        <p class="hero-subtitle">Generate disposable temporary emails instantly. Keep your real inbox clean and safe from spam, trackers, and data breaches.</p>
        <div class="hero-btns">
          <button class="btn btn-primary btn-large" data-action="signup">Create Free Email</button>
          <button class="btn btn-outline btn-large" data-action="scroll-features">How it Works</button>
        </div>
        <div class="hero-stats">
          <div class="stat"><span class="stat-value">1M+</span><span class="stat-label">Users</span></div>
          <div class="stat"><span class="stat-value">50M+</span><span class="stat-label">Blocked Spam</span></div>
          <div class="stat"><span class="stat-value">24/7</span><span class="stat-label">Uptime</span></div>
        </div>
      </div>
      <div class="hero-image">
        <div class="mockup-container">
          <div class="mockup-browser">
            <div class="browser-header">
              <div class="dots"><span class="red"></span><span class="yellow"></span><span class="green"></span></div>
              <div class="search-bar">trashmails.io/inbox</div>
            </div>
            <div class="browser-body">
              <div class="inbox-mockup">
                <div class="inbox-sidebar-mock"></div>
                <div class="inbox-list-mock">
                  <div class="email-item-mock active-mock"></div>
                  <div class="email-item-mock"></div>
                  <div class="email-item-mock"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
`;

export const injectHeroStyles = () => {
  if (document.getElementById('hero-styles')) return;
  const style = document.createElement('style');
  style.id = 'hero-styles';
  style.textContent = `
    .hero {
      min-height: calc(100vh - 80px);
      display: flex;
      align-items: center;
      position: relative;
      overflow: hidden;
    }
    .hero::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -30%;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
    }
    .hero-content {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 4rem;
      align-items: center;
    }
    .highlight {
      background: linear-gradient(120deg, var(--primary-orange), #fb923c);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero-title { margin-bottom: 1.5rem; font-size: 4rem; }
    .hero-subtitle { font-size: 1.2rem; color: var(--text-muted); margin-bottom: 2.5rem; max-width: 600px; }
    .hero-btns { display: flex; gap: 1.5rem; margin-bottom: 3rem; }
    .btn-large { padding: 1.2rem 3rem; font-size: 1.1rem; }
    .hero-stats { display: flex; gap: 3rem; }
    .stat { display: flex; flex-direction: column; }
    .stat-value { font-size: 1.8rem; font-weight: 700; color: var(--primary-purple); }
    .stat-label { color: var(--text-muted); font-size: 0.9rem; }
    .mockup-container { position: relative; }
    .mockup-browser {
      background: var(--bg-card);
      border-radius: 12px;
      border: 1px solid rgba(124, 58, 237, 0.3);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      aspect-ratio: 16/10;
    }
    .browser-header {
      background: rgba(255,255,255,0.05);
      padding: 0.8rem 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .dots { display: flex; gap: 6px; }
    .dots span { width: 10px; height: 10px; border-radius: 50%; }
    .red { background: #FF5F56; }
    .yellow { background: #FFBD2E; }
    .green { background: #27C93F; }
    .search-bar {
      flex: 1;
      background: rgba(0,0,0,0.2);
      border-radius: 6px;
      padding: 4px 12px;
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .inbox-mockup {
      display: grid;
      grid-template-columns: 60px 1fr;
      height: 100%;
    }
    .inbox-sidebar-mock { background: rgba(0,0,0,0.1); }
    .inbox-list-mock { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .email-item-mock { height: 40px; background: rgba(255,255,255,0.03); border-radius: 8px; }
    .email-item-mock.active-mock { border-left: 4px solid var(--primary-orange); background: rgba(249, 115, 22, 0.05); }

    @media (max-width: 1024px) {
      .hero-content { grid-template-columns: 1fr; text-align: center; }
      .hero-subtitle { margin: 0 auto 2.5rem; }
      .hero-btns { justify-content: center; }
      .hero-stats { justify-content: center; }
      .hero-image { display: none; }
      .hero-title { font-size: 2.5rem; }
    }
  `;
  document.head.appendChild(style);
};
