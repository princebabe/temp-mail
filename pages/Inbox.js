export const Inbox = (emails = []) => {
  const emailListHTML = emails.length > 0
    ? emails.map((e, i) => `
      <div class="email-row ${!e.read ? 'unread' : ''}" data-action="read-email" data-email-index="${i}">
        <div class="sender">${e.from || 'Unknown'}</div>
        <div class="subject">${e.subject || '(No Subject)'}</div>
        <div class="time">${timeAgo(e.received_at || e.created_at)}</div>
      </div>
    `).join('')
    : `<div class="empty-inbox"><div class="empty-icon">📭</div><p>No emails yet</p><p class="sub">Emails sent to your address will appear here</p></div>`;

  return `
  <section class="app-container">
    <div class="app-sidebar">
      <div class="sidebar-logo" data-action="home" style="cursor:pointer">🗑️ Trash Mails</div>
      <div class="sidebar-nav">
        <div class="nav-item active" data-action="inbox">📥 Inbox <span class="badge-mini" id="inbox-count">${emails.length}</span></div>
        <div class="nav-item" data-action="inbox">📤 Sent</div>
        <div class="nav-item" data-action="inbox">🗑️ Trash</div>
        <div class="nav-item mt-auto" data-action="settings">⚙️ Settings</div>
        <div class="nav-item" data-action="admin">🛡️ Admin</div>
        <div class="nav-item" data-action="logout" style="color:#EF4444">🚪 Logout</div>
      </div>
    </div>
    <div class="app-main">
      <div class="app-header">
        <div class="current-email" id="current-email-display">Loading... <button class="btn-icon" data-action="copy-email" title="Copy email">📋</button></div>
        <div class="app-actions">
          <button class="btn btn-primary btn-sm" data-action="refresh-inbox">⟳ Refresh</button>
          <button class="btn btn-outline btn-sm" data-action="new-identity">New Identity</button>
        </div>
      </div>
      <div class="inbox-view">
        <div class="email-list" id="email-list">
          ${emailListHTML}
        </div>
        <div class="email-body" id="email-body">
          <div class="body-placeholder">
            <div class="placeholder-icon">📧</div>
            <p>Select an email to read its content</p>
          </div>
        </div>
      </div>
    </div>
  </section>
`;
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return mins + ' min ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  return Math.floor(hrs / 24) + 'd ago';
}

export const injectInboxStyles = () => {
  if (document.getElementById('inbox-styles')) return;
  const style = document.createElement('style');
  style.id = 'inbox-styles';
  style.textContent = `
    .app-container {
      display: grid;
      grid-template-columns: 260px 1fr;
      height: 100vh;
      background: var(--bg-dark);
    }
    .app-sidebar {
      background: #000;
      border-right: 1px solid rgba(124, 58, 237, 0.15);
      padding: 2rem;
      display: flex;
      flex-direction: column;
    }
    .sidebar-logo { font-size: 1.2rem; font-weight: 700; margin-bottom: 3rem; }
    .sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 0.3rem; }
    .nav-item {
      padding: 0.8rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      color: var(--text-muted);
      transition: var(--transition);
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.9rem;
    }
    .nav-item:hover { background: rgba(124, 58, 237, 0.1); color: white; }
    .nav-item.active { color: var(--primary-purple); font-weight: 600; background: rgba(124, 58, 237, 0.08); }
    .mt-auto { margin-top: auto; }
    .app-main { display: flex; flex-direction: column; overflow: hidden; }
    .app-header {
      height: 70px;
      padding: 0 2rem;
      border-bottom: 1px solid rgba(124, 58, 237, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(0,0,0,0.5);
    }
    .current-email {
      font-family: 'JetBrains Mono', monospace;
      background: rgba(124, 58, 237, 0.08);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: 1px solid rgba(124, 58, 237, 0.2);
      font-size: 0.9rem;
      color: var(--primary-purple);
    }
    .btn-icon { background: none; border: none; cursor: pointer; margin-left: 0.5rem; filter: none; font-size: 1rem; }
    .app-actions { display: flex; gap: 0.5rem; }
    .btn-sm { padding: 0.5rem 1rem; font-size: 0.8rem; }
    .inbox-view { display: grid; grid-template-columns: 380px 1fr; flex: 1; overflow: hidden; }
    .email-list { border-right: 1px solid rgba(124, 58, 237, 0.08); overflow-y: auto; }
    .email-row {
      padding: 1.2rem 1.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.03);
      cursor: pointer;
      transition: var(--transition);
    }
    .email-row:hover { background: rgba(124, 58, 237, 0.04); }
    .email-row.unread { border-left: 3px solid var(--primary-orange); background: rgba(249, 115, 22, 0.03); }
    .email-row.selected { background: rgba(124, 58, 237, 0.08); border-left: 3px solid var(--primary-purple); }
    .sender { font-weight: 600; font-size: 0.9rem; margin-bottom: 0.3rem; }
    .subject { font-size: 0.85rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .time { font-size: 0.75rem; color: #555; margin-top: 0.5rem; }
    .email-body { background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; overflow-y: auto; padding: 2rem; }
    .body-placeholder { text-align: center; color: #333; }
    .placeholder-icon { font-size: 4rem; margin-bottom: 1rem; opacity: 0.15; }
    .body-placeholder p { font-size: 0.9rem; }
    .badge-mini { background: var(--primary-purple); color: white; font-size: 0.7rem; padding: 2px 8px; border-radius: 10px; }
    .empty-inbox { text-align: center; padding: 4rem 2rem; color: #333; }
    .empty-icon { font-size: 4rem; margin-bottom: 1rem; opacity: 0.15; }
    .empty-inbox .sub { font-size: 0.8rem; margin-top: 0.5rem; }
    .email-detail { max-width: 700px; width: 100%; }
    .email-detail-header { margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); }
    .email-detail-subject { font-size: 1.3rem; font-weight: 700; margin-bottom: 0.5rem; }
    .email-detail-meta { color: var(--text-muted); font-size: 0.85rem; }
    .email-detail-body { line-height: 1.8; color: var(--text-muted); }
  `;
  document.head.appendChild(style);
};
