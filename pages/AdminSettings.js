export const AdminSettings = () => `
  <section class="admin-container fade-in">
    <div class="admin-sidebar">
      <div class="sidebar-logo">⚙️ Settings</div>
      <div class="sidebar-nav">
        <div class="nav-item active">🏠 General</div>
        <div class="nav-item">🌐 Domains</div>
        <div class="nav-item">📊 Usage</div>
        <div class="nav-item">🔑 API Keys</div>
        <div class="nav-item mt-auto">⬅️ Back to Inbox</div>
      </div>
    </div>
    <div class="admin-main">
      <div class="admin-header">
        <h2>Domain Management</h2>
        <button class="btn btn-primary btn-sm">+ Add Custom Domain</button>
      </div>
      <div class="admin-content">
        <div class="domain-card">
          <div class="domain-info">
            <span class="domain-name">trashmails.io</span>
            <span class="domain-status status-active">System Default</span>
          </div>
          <p class="domain-desc">This is the default domain for all users.</p>
        </div>
        
        <div class="dns-guide">
          <h3>DNS Setup Guide</h3>
          <p>To connect your custom domain, add the following records to your DNS provider:</p>
          <div class="dns-table">
            <div class="dns-row header">
              <div>Type</div>
              <div>Host</div>
              <div>Value</div>
              <div>Action</div>
            </div>
            <div class="dns-row">
              <div>MX</div>
              <div>@</div>
              <div>mx1.trashmails.io</div>
              <button class="btn-copy">Copy</button>
            </div>
            <div class="dns-row">
              <div>TXT</div>
              <div>@</div>
              <div>v=spf1 include:trashmails.io ~all</div>
              <button class="btn-copy">Copy</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
`;

export const injectAdminStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
    .admin-container {
      display: grid;
      grid-template-columns: 260px 1fr;
      height: 100vh;
      background: var(--bg-dark);
    }
    .admin-sidebar { background: #000; border-right: 1px solid #111; padding: 2rem; display: flex; flex-direction: column; }
    .admin-main { padding: 3rem; overflow-y: auto; }
    .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; }
    
    .domain-card {
      background: var(--bg-card);
      padding: 2rem;
      border-radius: 12px;
      border: 1px solid rgba(124, 58, 237, 0.1);
      margin-bottom: 2rem;
    }
    .domain-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .domain-name { font-size: 1.2rem; font-weight: 700; color: var(--primary-purple); }
    .domain-status { font-size: 0.75rem; padding: 4px 10px; border-radius: 20px; font-weight: 600; }
    .status-active { background: rgba(39, 201, 63, 0.1); color: #27C93F; }
    .domain-desc { color: var(--text-muted); font-size: 0.9rem; }

    .dns-guide { background: rgba(0,0,0,0.2); padding: 2rem; border-radius: 12px; border: 1px solid #111; }
    .dns-guide h3 { margin-bottom: 1rem; font-size: 1.2rem; }
    .dns-guide p { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 2rem; }
    
    .dns-table { display: flex; flex-direction: column; gap: 0.5rem; }
    .dns-row {
      display: grid;
      grid-template-columns: 80px 100px 1fr 80px;
      padding: 1rem;
      background: #000;
      border-radius: 8px;
      font-family: monospace;
      font-size: 0.85rem;
      align-items: center;
      gap: 1rem;
    }
    .dns-row.header { background: none; font-weight: 700; color: var(--text-muted); font-family: var(--font-sans); }
    .btn-copy {
      background: rgba(124, 58, 237, 0.1);
      border: 1px solid var(--primary-purple);
      color: var(--primary-purple);
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.7rem;
      transition: var(--transition);
    }
    .btn-copy:hover { background: var(--primary-purple); color: white; }
  `;
    document.head.appendChild(style);
};
