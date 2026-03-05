export const AdminDashboard = (data = {}) => {
    const users = data.users || [];
    const emails = data.emails || [];
    const domains = data.domains || [];
    const stats = data.stats || { totalUsers: 0, totalEmails: 0, totalDomains: 0, activeToday: 0 };

    return `
  <section class="admin-dash">
    <div class="admin-side">
      <div class="sidebar-logo" data-action="home" style="cursor:pointer">🗑️ Trash Mails</div>
      <div class="admin-nav">
        <div class="admin-nav-item active" data-admin-tab="overview">📊 Overview</div>
        <div class="admin-nav-item" data-admin-tab="users">👥 Users</div>
        <div class="admin-nav-item" data-admin-tab="emails">📧 Emails</div>
        <div class="admin-nav-item" data-admin-tab="domains">🌐 Domains</div>
        <div class="admin-nav-item" data-admin-tab="settings">⚙️ Settings</div>
        <div class="admin-nav-item mt-auto" data-action="app">⬅️ Back to App</div>
      </div>
    </div>
    <div class="admin-body">
      <!-- Overview Tab -->
      <div class="admin-tab" id="tab-overview">
        <div class="admin-top-bar">
          <h2>Admin Dashboard</h2>
          <span class="admin-badge">Admin</span>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card-icon" style="background:rgba(124,58,237,0.1);color:var(--primary-purple)">👥</div>
            <div>
              <div class="stat-card-value">${stats.totalUsers}</div>
              <div class="stat-card-label">Total Users</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon" style="background:rgba(249,115,22,0.1);color:var(--primary-orange)">📧</div>
            <div>
              <div class="stat-card-value">${stats.totalEmails}</div>
              <div class="stat-card-label">Total Emails</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon" style="background:rgba(34,197,94,0.1);color:#22C55E">🌐</div>
            <div>
              <div class="stat-card-value">${stats.totalDomains}</div>
              <div class="stat-card-label">Domains</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon" style="background:rgba(59,130,246,0.1);color:#3B82F6">🔥</div>
            <div>
              <div class="stat-card-value">${stats.activeToday}</div>
              <div class="stat-card-label">Active Today</div>
            </div>
          </div>
        </div>
        <div class="admin-section">
          <h3>Recent Users</h3>
          <div class="admin-table">
            <div class="table-row table-header">
              <div>Email</div><div>Name</div><div>Created</div><div>Actions</div>
            </div>
            ${users.slice(0, 5).map(u => `
              <div class="table-row">
                <div>${u.email}</div>
                <div>${u.name || '—'}</div>
                <div>${new Date(u.created_at).toLocaleDateString()}</div>
                <div><button class="btn-sm-action" data-action="delete-user" data-user-id="${u.id}">Delete</button></div>
              </div>
            `).join('') || '<div class="table-row"><div style="grid-column:1/-1;text-align:center;color:#555">No users yet</div></div>'}
          </div>
        </div>
      </div>

      <!-- Users Tab -->
      <div class="admin-tab hidden" id="tab-users">
        <div class="admin-top-bar">
          <h2>User Management</h2>
          <button class="btn btn-primary btn-sm" data-action="add-user-modal">+ Add User</button>
        </div>
        <div class="admin-table">
          <div class="table-row table-header">
            <div>ID</div><div>Email</div><div>Name</div><div>Role</div><div>Created</div><div>Actions</div>
          </div>
          ${users.map(u => `
            <div class="table-row">
              <div>#${u.id}</div>
              <div>${u.email}</div>
              <div>${u.name || '—'}</div>
              <div><span class="role-badge ${u.role === 'admin' ? 'role-admin' : ''}">${u.role || 'user'}</span></div>
              <div>${new Date(u.created_at).toLocaleDateString()}</div>
              <div><button class="btn-sm-action danger" data-action="delete-user" data-user-id="${u.id}">Delete</button></div>
            </div>
          `).join('') || '<div class="table-row"><div style="grid-column:1/-1;text-align:center;color:#555">No users</div></div>'}
        </div>
      </div>

      <!-- Emails Tab -->
      <div class="admin-tab hidden" id="tab-emails">
        <div class="admin-top-bar">
          <h2>Email Log</h2>
          <button class="btn btn-outline btn-sm" data-action="refresh-admin">⟳ Refresh</button>
        </div>
        <div class="admin-table">
          <div class="table-row table-header">
            <div>To</div><div>From</div><div>Subject</div><div>Date</div>
          </div>
          ${emails.slice(0, 20).map(e => `
            <div class="table-row">
              <div>${e.to_address || '—'}</div>
              <div>${e.from || '—'}</div>
              <div>${e.subject || '(No Subject)'}</div>
              <div>${new Date(e.received_at || e.created_at).toLocaleDateString()}</div>
            </div>
          `).join('') || '<div class="table-row"><div style="grid-column:1/-1;text-align:center;color:#555">No emails</div></div>'}
        </div>
      </div>

      <!-- Domains Tab -->
      <div class="admin-tab hidden" id="tab-domains">
        <div class="admin-top-bar">
          <h2>Domain Management</h2>
          <button class="btn btn-primary btn-sm" data-action="add-domain-modal">+ Add Domain</button>
        </div>
        <div class="domain-cards">
          <div class="domain-card-item">
            <div class="domain-info"><span class="domain-name-text">trashmails.io</span><span class="domain-status-badge active">Default</span></div>
            <p class="domain-desc-text">System default domain for all users.</p>
          </div>
          ${domains.map(d => `
            <div class="domain-card-item">
              <div class="domain-info"><span class="domain-name-text">${d.name}</span><span class="domain-status-badge ${d.verified ? 'active' : 'pending'}">${d.verified ? 'Verified' : 'Pending'}</span></div>
              <p class="domain-desc-text">Added ${new Date(d.created_at).toLocaleDateString()}</p>
            </div>
          `).join('')}
        </div>
        <div class="dns-guide-section">
          <h3>DNS Setup Guide</h3>
          <p>Add these DNS records to connect your custom domain:</p>
          <div class="dns-table-admin">
            <div class="dns-row-admin header"><div>Type</div><div>Host</div><div>Value</div><div></div></div>
            <div class="dns-row-admin"><div>MX</div><div>@</div><div class="dns-value">mx1.trashmails.io</div><button class="btn-copy" data-copy="mx1.trashmails.io">Copy</button></div>
            <div class="dns-row-admin"><div>TXT</div><div>@</div><div class="dns-value">v=spf1 include:trashmails.io ~all</div><button class="btn-copy" data-copy="v=spf1 include:trashmails.io ~all">Copy</button></div>
          </div>
        </div>
      </div>

      <!-- Settings Tab -->
      <div class="admin-tab hidden" id="tab-settings">
        <div class="admin-top-bar"><h2>System Settings</h2></div>
        <div class="settings-form">
          <div class="setting-group">
            <label>Site Name</label>
            <input type="text" value="Trash Mails" />
          </div>
          <div class="setting-group">
            <label>Default Email Expiry (hours)</label>
            <input type="number" value="1" />
          </div>
          <div class="setting-group">
            <label>Max Emails Per Day (Free Tier)</label>
            <input type="number" value="10" />
          </div>
          <div class="setting-group">
            <label>Allow Signup</label>
            <select><option>Yes</option><option>No</option></select>
          </div>
          <button class="btn btn-primary" data-action="save-settings">Save Settings</button>
        </div>
      </div>
    </div>
  </section>

  <!-- Add User Modal -->
  <div class="modal-overlay hidden" id="add-user-modal">
    <div class="modal-card">
      <h3>Add New User</h3>
      <div class="form-group"><label>Name</label><input type="text" id="new-user-name" placeholder="John Doe" /></div>
      <div class="form-group"><label>Email</label><input type="email" id="new-user-email" placeholder="user@example.com" /></div>
      <div class="form-group"><label>Password</label><input type="password" id="new-user-password" placeholder="••••••••" /></div>
      <div class="form-group">
        <label>Role</label>
        <select id="new-user-role"><option value="user">User</option><option value="admin">Admin</option></select>
      </div>
      <div class="modal-actions">
        <button class="btn btn-outline" data-action="close-modal">Cancel</button>
        <button class="btn btn-primary" data-action="create-user">Create User</button>
      </div>
    </div>
  </div>

  <!-- Add Domain Modal -->
  <div class="modal-overlay hidden" id="add-domain-modal">
    <div class="modal-card">
      <h3>Add Custom Domain</h3>
      <div class="form-group"><label>Domain Name</label><input type="text" id="new-domain-name" placeholder="mail.yourdomain.com" /></div>
      <div class="modal-actions">
        <button class="btn btn-outline" data-action="close-modal">Cancel</button>
        <button class="btn btn-primary" data-action="create-domain">Add Domain</button>
      </div>
    </div>
  </div>
`;
};

export const initAdminTabs = () => {
    document.querySelectorAll('[data-admin-tab]').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.admin-nav-item').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.add('hidden'));
            const target = document.getElementById('tab-' + tab.dataset.adminTab);
            if (target) target.classList.remove('hidden');
        });
    });

    // Copy buttons
    document.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', () => {
            navigator.clipboard.writeText(btn.dataset.copy);
            btn.textContent = '✓ Copied';
            setTimeout(() => btn.textContent = 'Copy', 2000);
        });
    });
};

export const injectAdminStyles = () => {
    if (document.getElementById('admin-dash-styles')) return;
    const style = document.createElement('style');
    style.id = 'admin-dash-styles';
    style.textContent = `
    .admin-dash { display: grid; grid-template-columns: 260px 1fr; height: 100vh; background: var(--bg-dark); }
    .admin-side { background: #000; border-right: 1px solid rgba(124,58,237,0.15); padding: 2rem; display: flex; flex-direction: column; }
    .admin-nav { flex: 1; display: flex; flex-direction: column; gap: 0.3rem; margin-top: 2rem; }
    .admin-nav-item {
      padding: 0.8rem 1rem; border-radius: 8px; cursor: pointer;
      color: var(--text-muted); transition: var(--transition); font-size: 0.9rem;
    }
    .admin-nav-item:hover { background: rgba(124,58,237,0.1); color: white; }
    .admin-nav-item.active { color: var(--primary-purple); font-weight: 600; background: rgba(124,58,237,0.08); }

    .admin-body { overflow-y: auto; padding: 2rem 3rem; }
    .admin-top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .admin-top-bar h2 { text-align: left; margin-bottom: 0; }
    .admin-badge { background: var(--primary-orange); color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; margin-bottom: 3rem; }
    .stat-card {
      background: var(--bg-card); padding: 1.5rem; border-radius: 12px;
      border: 1px solid rgba(124,58,237,0.08); display: flex; align-items: center; gap: 1rem;
      transition: var(--transition);
    }
    .stat-card:hover { border-color: rgba(124,58,237,0.3); transform: translateY(-2px); }
    .stat-card-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0; }
    .stat-card-value { font-size: 1.8rem; font-weight: 700; }
    .stat-card-label { font-size: 0.8rem; color: var(--text-muted); }

    .admin-section { margin-bottom: 2rem; }
    .admin-section h3 { margin-bottom: 1rem; font-size: 1.1rem; }

    .admin-table { background: var(--bg-card); border-radius: 12px; overflow: hidden; border: 1px solid rgba(124,58,237,0.08); }
    .table-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); padding: 1rem 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.03); font-size: 0.85rem; align-items: center; gap: 0.5rem; }
    .table-row:last-child { border-bottom: none; }
    .table-header { background: rgba(0,0,0,0.3); font-weight: 600; color: var(--text-muted); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; }

    .btn-sm-action {
      background: rgba(124,58,237,0.1); border: 1px solid rgba(124,58,237,0.3);
      color: var(--primary-purple); padding: 4px 10px; border-radius: 6px;
      cursor: pointer; font-size: 0.75rem; transition: var(--transition);
    }
    .btn-sm-action:hover { background: var(--primary-purple); color: white; }
    .btn-sm-action.danger { border-color: rgba(239,68,68,0.3); color: #EF4444; background: rgba(239,68,68,0.05); }
    .btn-sm-action.danger:hover { background: #EF4444; color: white; }

    .role-badge { padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; background: rgba(124,58,237,0.1); color: var(--primary-purple); }
    .role-admin { background: rgba(249,115,22,0.1); color: var(--primary-orange); }

    .domain-cards { display: grid; gap: 1rem; margin-bottom: 2rem; }
    .domain-card-item { background: var(--bg-card); padding: 1.5rem; border-radius: 12px; border: 1px solid rgba(124,58,237,0.08); }
    .domain-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .domain-name-text { font-weight: 700; color: var(--primary-purple); }
    .domain-status-badge { font-size: 0.7rem; padding: 3px 8px; border-radius: 20px; font-weight: 600; }
    .domain-status-badge.active { background: rgba(34,197,94,0.1); color: #22C55E; }
    .domain-status-badge.pending { background: rgba(234,179,8,0.1); color: #EAB308; }
    .domain-desc-text { color: var(--text-muted); font-size: 0.85rem; }

    .dns-guide-section { background: rgba(0,0,0,0.2); padding: 2rem; border-radius: 12px; border: 1px solid rgba(124,58,237,0.08); margin-top: 2rem; }
    .dns-guide-section h3 { margin-bottom: 0.5rem; }
    .dns-guide-section > p { color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem; }
    .dns-table-admin { display: flex; flex-direction: column; gap: 0.5rem; }
    .dns-row-admin {
      display: grid; grid-template-columns: 60px 60px 1fr 80px; padding: 0.8rem 1rem;
      background: #000; border-radius: 8px; font-family: monospace; font-size: 0.85rem;
      align-items: center; gap: 0.5rem;
    }
    .dns-row-admin.header { background: none; font-family: var(--font-sans); font-weight: 600; color: var(--text-muted); }
    .dns-value { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-muted); }
    .btn-copy {
      background: rgba(124,58,237,0.1); border: 1px solid var(--primary-purple);
      color: var(--primary-purple); padding: 4px 8px; border-radius: 4px;
      cursor: pointer; font-size: 0.7rem; transition: var(--transition);
    }
    .btn-copy:hover { background: var(--primary-purple); color: white; }

    .settings-form { max-width: 500px; }
    .setting-group { margin-bottom: 1.5rem; }
    .setting-group label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 500; }
    .setting-group input, .setting-group select {
      width: 100%; padding: 0.8rem 1rem; background: rgba(0,0,0,0.3);
      border: 1px solid rgba(255,255,255,0.1); border-radius: 8px;
      color: white; outline: none; font-family: var(--font-sans); font-size: 0.95rem;
      transition: var(--transition);
    }
    .setting-group input:focus, .setting-group select:focus { border-color: var(--primary-purple); }

    .admin-tab.hidden { display: none; }

    /* Modals */
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(4px); }
    .modal-overlay.hidden { display: none; }
    .modal-card { background: var(--bg-card); padding: 2rem; border-radius: 16px; border: 1px solid rgba(124,58,237,0.2); width: 100%; max-width: 450px; }
    .modal-card h3 { margin-bottom: 1.5rem; }
    .modal-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem; }

    @media (max-width: 992px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `;
    document.head.appendChild(style);
};
