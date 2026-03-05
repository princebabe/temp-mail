import './style.css'

const API = 'http://localhost:3001/api';

// ── State ───────────────────────────────────────────────────────
let mailbox = null;
let emails = [];
let selectedEmail = null;
let pollTimer = null;
let countdownTimer = null;
let adSlots = [];

// ── Ad Helper ───────────────────────────────────────────────────
function renderAdSlot(slotId, cssClass, icon, label, dims) {
  const ad = adSlots.find(a => a.slot_id === slotId);
  if (ad && !ad.enabled) return ''; // hidden by admin
  const hasCode = ad && ad.ad_code && ad.ad_code.trim();
  const content = hasCode
    ? `<div class="ad-custom-code">${ad.ad_code}</div>`
    : `<div class="ad-placeholder"><div class="ad-placeholder-inner"><div class="ad-icon">${icon}</div><div class="ad-label">${label}</div><div class="ad-dimensions">${dims}</div></div></div>`;
  return `<div class="ad-slot ${cssClass}" id="${slotId}" data-ad-size="${dims}" data-ad-position="${slotId}">${content}</div>`;
}


// ── API ─────────────────────────────────────────────────────────
async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed');
  return data;
}

function toast(msg, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) { container = document.createElement('div'); container.className = 'toast-container'; document.body.appendChild(container); }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `${type === 'success' ? '✅' : '❌'} ${msg}`;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(100%)'; setTimeout(() => el.remove(), 300); }, 3000);
}

// ── Time Helpers ────────────────────────────────────────────────
function timeAgo(d) {
  if (!d) return '';
  const ms = Date.now() - new Date(d).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return m + ' min ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

function formatCountdown(ms) {
  if (ms <= 0) return 'Expired';
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}m ${s < 10 ? '0' : ''}${s}s`;
}

// ── Core: Create Mailbox ────────────────────────────────────────
async function createMailbox() {
  try {
    mailbox = await api('/mailbox/create', { method: 'POST' });
    emails = [];
    selectedEmail = null;
    localStorage.setItem('tm_mailbox', JSON.stringify(mailbox));
    return mailbox;
  } catch (e) {
    toast('Failed to create mailbox', 'error');
  }
}

async function fetchEmails() {
  if (!mailbox) return;
  try {
    const newEmails = await api(`/emails/${mailbox.id}`);
    if (newEmails.length > emails.length) {
      const diff = newEmails.length - emails.length;
      if (emails.length > 0) toast(`${diff} new email${diff > 1 ? 's' : ''} received!`);
    }
    emails = newEmails;
    renderEmailList();
    updateInboxCount();
  } catch { }
}

function startPolling() {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(fetchEmails, 5000);
}

function startCountdown() {
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    const el = document.getElementById('countdown');
    if (!el || !mailbox) return;
    const remaining = new Date(mailbox.expires_at).getTime() - Date.now();
    el.textContent = formatCountdown(remaining);
    if (remaining <= 0) {
      el.textContent = 'Expired';
      el.style.color = 'var(--danger)';
    }
  }, 1000);
}

// ── Render: Full Page ───────────────────────────────────────────
async function renderPage() {
  // Try to restore session
  const saved = localStorage.getItem('tm_mailbox');
  if (saved) {
    try {
      mailbox = JSON.parse(saved);
      const check = await api(`/mailbox/${mailbox.id}`);
      if (check) mailbox = check;
    } catch { await createMailbox(); }
  } else {
    await createMailbox();
  }

  // Load ad configuration
  try { adSlots = await api('/ads'); } catch { adSlots = []; }

  // Load blog posts
  let blogPosts = [];
  try { blogPosts = await api('/blog?limit=3'); } catch { blogPosts = []; }


  document.querySelector('#app').innerHTML = `
    <!-- Navbar -->
    <nav class="nav">
      <div class="container nav-inner">
        <div class="nav-brand">🗑️ <span>Trash Mails</span></div>
        <div class="nav-links">
          <a href="#inbox-section">Inbox</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#blog">Blog</a>
          <a href="#faq">FAQ</a>
        </div>
        <button class="btn btn-sm btn-ghost" id="admin-btn">🛡️ Admin</button>
      </div>
    </nav>

    <!-- AD: Top Leaderboard 728x90 -->
    <div class="ad-container ad-leaderboard-top">
      ${renderAdSlot('ad-top-leaderboard', 'ad-728x90', '📢', 'Advertisement', '728 × 90')}
    </div>

    <!-- Hero + Inbox Section -->
    <section class="hero-inbox" id="inbox-section">
      <div class="container">
        <div class="hero-top fade-up">
          <h1>Instant <span class="gradient-text">Disposable Email</span></h1>
          <p class="hero-sub">No signup. No login. Just a temp email. Receive emails instantly and keep your real inbox clean.</p>
        </div>

        <!-- AD: Below Hero Text -->
        <div class="ad-container ad-hero-below-wrap fade-up" style="animation-delay:0.08s">
          ${renderAdSlot('ad-hero-below', 'ad-728x90', '📣', 'Advertisement', '728 × 90')}
        </div>

        <!-- Email Generator with Left + Right Ads -->
        <div class="email-generator-wrapper fade-up" style="animation-delay:0.15s">
          <!-- AD: Left of Generator -->
          <div class="ad-generator-side ad-generator-left-col">
            ${renderAdSlot('ad-generator-left', 'ad-300x250', '◀️', 'Ad', '300 × 250')}
          </div>

          <!-- Email Generator Bar -->
          <div class="email-bar">
            <div class="email-address-box">
              <span class="email-label">Your temporary email:</span>
              <div class="email-display">
                <span id="email-address" class="mono">${mailbox?.address || 'Loading...'}</span>
                <button class="btn-icon" id="copy-btn" title="Copy email">📋</button>
              </div>
            </div>
            <div class="email-actions">
              <button class="btn btn-primary" id="copy-btn-main">📋 Copy</button>
              <button class="btn btn-outline" id="refresh-btn">🔄 Change</button>
              <button class="btn btn-outline" id="edit-email-btn" title="Edit email name">✏️ Edit</button>
              <button class="btn btn-outline" id="qr-btn" title="Show QR Code">📱 QR</button>
              <button class="btn btn-ghost" id="delete-all-btn" title="Delete all emails">🗑️</button>
            </div>
            <div class="email-meta">
              <span class="meta-item">⏱️ Expires in: <strong id="countdown">--:--</strong></span>
              <span class="meta-item" id="auto-refresh-indicator">🟢 Auto-refreshing</span>
            </div>
          </div>

          <!-- QR Code Modal -->
          <div class="qr-modal-overlay" id="qr-modal" style="display:none">
            <div class="qr-modal">
              <div class="qr-modal-header">
                <h3>📱 QR Code</h3>
                <button class="ad-modal-close" id="close-qr-modal">✕</button>
              </div>
              <div class="qr-modal-body">
                <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:1rem;text-align:center">Scan this QR code to share your temporary email</p>
                <div class="qr-code-wrapper" id="qr-code-wrapper">
                  <img id="qr-code-img" src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mailbox?.address || '')}" alt="QR Code" style="border-radius:12px;background:white;padding:12px;">
                </div>
                <div class="qr-email-label mono" style="text-align:center;margin-top:1rem;color:var(--accent);font-size:0.9rem;font-weight:600;word-break:break-all">${mailbox?.address || ''}</div>
              </div>
              <div class="qr-modal-footer">
                <button class="btn btn-primary" id="download-qr-btn">⬇️ Download QR</button>
                <button class="btn btn-ghost" id="close-qr-modal-2">Close</button>
              </div>
            </div>
          </div>

          <!-- Edit Email Modal -->
          <div class="qr-modal-overlay" id="edit-email-modal" style="display:none">
            <div class="qr-modal">
              <div class="qr-modal-header">
                <h3>✏️ Edit Email Name</h3>
                <button class="ad-modal-close" id="close-edit-modal">✕</button>
              </div>
              <div class="qr-modal-body">
                <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:1rem">Choose a custom username for your email address:</p>
                <div class="edit-email-input-wrap">
                  <input type="text" id="custom-email-input" class="ad-input mono" placeholder="your.name" maxlength="30" style="font-size:1rem;">
                  <span class="edit-email-domain">@trashmails.io</span>
                </div>
                <p style="color:var(--text-dim);font-size:0.72rem;margin-top:0.5rem">3-30 characters. Letters, numbers, dots, hyphens, underscores only.</p>
                <div id="edit-email-error" style="color:var(--danger);font-size:0.8rem;margin-top:0.5rem;display:none"></div>
              </div>
              <div class="qr-modal-footer">
                <button class="btn btn-primary" id="save-custom-email">✅ Set Email</button>
                <button class="btn btn-ghost" id="close-edit-modal-2">Cancel</button>
              </div>
            </div>
          </div>

          <!-- AD: Right of Generator -->
          <div class="ad-generator-side ad-generator-right-col">
            ${renderAdSlot('ad-generator-right', 'ad-300x250', '▶️', 'Ad', '300 × 250')}
          </div>
        </div>

        <!-- AD: Below Email Generator -->
        <div class="ad-container ad-generator-below-wrap fade-up" style="animation-delay:0.2s">
          ${renderAdSlot('ad-generator-below', 'ad-728x90', '📢', 'Advertisement', '728 × 90')}
        </div>


        <!-- Inbox -->
        <div class="inbox-wrapper fade-up" style="animation-delay:0.3s">
          <div class="inbox-container">
            <div class="inbox-header">
              <div class="inbox-title">📥 Inbox <span class="inbox-count" id="inbox-count">0</span></div>
              <div class="inbox-toolbar">
                <button class="btn btn-sm btn-ghost" id="manual-refresh">⟳ Refresh</button>
                <button class="btn btn-sm btn-primary" id="simulate-btn">📨 Simulate Email</button>
              </div>
            </div>
            <div class="inbox-body">
              <div class="email-list" id="email-list">
                <div class="empty-state" id="empty-state">
                  <div class="empty-icon">📭</div>
                  <h3>Waiting for emails...</h3>
                  <p>Emails sent to <strong>${mailbox?.address || ''}</strong> will appear here automatically.</p>
                  <div class="pulse-dot"></div>
                </div>
              </div>
              <div class="email-reader" id="email-reader">
                <div class="reader-placeholder">
                  <div class="reader-icon">✉️</div>
                  <p>Select an email to read</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- AD: Mid-page Leaderboard 728x90 -->
    <div class="ad-container ad-leaderboard-mid">
      ${renderAdSlot('ad-mid-leaderboard', 'ad-728x90', '📣', 'Advertisement', '728 × 90')}
    </div>

    <!-- Features -->
    <section id="features" class="features-section">
      <div class="container">
        <h2>Why Trash Mails?</h2>
        <p class="section-subtitle">Everything you need for disposable email, nothing you don't.</p>
        <div class="features-grid">
          <div class="feature-card fade-up"><div class="f-icon">⚡</div><h3>Instant Generation</h3><p>Get a fresh email in milliseconds. No forms, no friction.</p></div>
          <div class="feature-card fade-up" style="animation-delay:0.1s"><div class="f-icon">🔒</div><h3>Zero Data Storage</h3><p>We don't track you. All emails auto-delete after expiry.</p></div>
          <div class="feature-card fade-up" style="animation-delay:0.2s"><div class="f-icon">🔄</div><h3>Auto-Refresh</h3><p>Inbox updates every 5 seconds. No manual refresh needed.</p></div>
          <div class="feature-card fade-up" style="animation-delay:0.3s"><div class="f-icon">🛡️</div><h3>Spam Shield</h3><p>Use temp emails for signups and keep your real inbox clean.</p></div>
          <div class="feature-card fade-up" style="animation-delay:0.4s"><div class="f-icon">🌐</div><h3>Custom Domains</h3><p>Premium users can connect their own domains.</p></div>
          <div class="feature-card fade-up" style="animation-delay:0.5s"><div class="f-icon">📱</div><h3>Works Everywhere</h3><p>Fully responsive — works on phone, tablet, and desktop.</p></div>
        </div>
      </div>
    </section>

    <!-- AD: Between Features & Pricing -->
    <div class="ad-container ad-between-sections">
      ${renderAdSlot('ad-features-pricing', 'ad-728x90', '🔥', 'Advertisement', '728 × 90')}
    </div>

    <!-- Pricing -->
    <section id="pricing" class="pricing-section">
      <div class="container">
        <h2>Simple Pricing</h2>
        <p class="section-subtitle">Start for free. Upgrade when you need more.</p>
        <div class="pricing-grid">
          <div class="price-card">
            <h3>Free</h3>
            <div class="price-amount">$0 <span>/forever</span></div>
            <ul><li>✅ Unlimited mailboxes</li><li>✅ 1 hour expiry</li><li>✅ Auto-refresh inbox</li><li>❌ Custom domains</li></ul>
            <button class="btn btn-outline" onclick="document.getElementById('inbox-section').scrollIntoView({behavior:'smooth'})">Get Started</button>
          </div>
          <div class="price-card featured">
            <div class="price-badge">Popular</div>
            <h3>Premium</h3>
            <div class="price-amount">$9 <span>/mo</span></div>
            <ul><li>✅ Unlimited mailboxes</li><li>✅ 24h expiry</li><li>✅ Custom domains</li><li>✅ Priority delivery</li></ul>
            <button class="btn btn-primary">Upgrade</button>
          </div>
          <div class="price-card">
            <h3>Enterprise</h3>
            <div class="price-amount">$29 <span>/mo</span></div>
            <ul><li>✅ Everything in Premium</li><li>✅ API access</li><li>✅ Team dashboard</li><li>✅ Priority support</li></ul>
            <button class="btn btn-outline">Contact Sales</button>
          </div>
        </div>
      </div>
    </section>

    <!-- AD: Between Pricing & FAQ -->
    <div class="ad-container ad-between-sections">
      ${renderAdSlot('ad-pricing-faq', 'ad-300x250', '⭐', 'Sponsored Content', '300 × 250')}
    </div>

    <!-- FAQ -->
    <section id="faq" class="faq-section">
      <div class="container" style="max-width:750px">
        <h2>Frequently Asked Questions</h2>
        <div class="faq-list">
          <div class="faq-item"><div class="faq-q">What is a disposable email?<span>+</span></div><div class="faq-a">A temporary email address you can use for signups without exposing your real email. It auto-deletes after expiry.</div></div>
          <div class="faq-item"><div class="faq-q">Do I need to sign up?<span>+</span></div><div class="faq-a">No! You get an email address instantly just by visiting the page. No registration required.</div></div>
          <div class="faq-item"><div class="faq-q">How long do emails last?<span>+</span></div><div class="faq-a">Free emails expire in 1 hour. Premium users get 24-hour expiry, and Enterprise users can set custom durations.</div></div>
          <div class="faq-item"><div class="faq-q">Is it safe?<span>+</span></div><div class="faq-a">Yes. We don't store personal data. All emails are encrypted in transit and permanently deleted after expiry.</div></div>
        </div>
      </div>
    </section>

    <!-- Blog Section -->
    <section id="blog" class="blog-section">
      <div class="container">
        <h2>Latest from our <span class="gradient-text">Blog</span></h2>
        <p class="section-subtitle">Tips, guides, and updates from the Trash Mails team</p>
        <div class="blog-grid" id="blog-grid">
          ${blogPosts.slice(0, 3).map(post => `
            <article class="blog-card">
              <div class="blog-cover">${post.cover_image || '📝'}</div>
              <div class="blog-card-body">
                <div class="blog-card-meta">
                  <span class="blog-category">${post.category}</span>
                  <span class="blog-date">${new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <h3 class="blog-card-title">${post.title}</h3>
                <p class="blog-card-excerpt">${post.excerpt}</p>
                <div class="blog-card-footer">
                  <span class="blog-author">✍️ ${post.author}</span>
                  <button class="btn btn-sm btn-outline blog-read-more" data-slug="${post.slug}">Read More →</button>
                </div>
              </div>
            </article>
          `).join('')}
        </div>
        <div class="blog-view-all">
          <button class="btn btn-primary blog-view-all-btn" id="view-all-posts">📚 View All Posts</button>
        </div>
      </div>
    </section>

    <!-- AD: Pre-footer Leaderboard -->
    <div class="ad-container ad-pre-footer">
      ${renderAdSlot('ad-pre-footer', 'ad-728x90', '📢', 'Advertisement', '728 × 90')}
    </div>

    <!-- Footer -->
    <footer class="site-footer">
      <div class="container footer-inner">
        <div class="footer-brand"><div class="nav-brand">🗑️ <span>Trash Mails</span></div><p>Secure disposable emails. No signup required.</p></div>
        <div class="footer-cols">
          <div><h4>Product</h4><a href="#features">Features</a><a href="#pricing">Pricing</a></div>
          <div><h4>Support</h4><a href="#faq">FAQ</a><a href="#">Contact</a></div>
        </div>
      </div>
      <div class="container"><div class="footer-bottom">© 2026 Trash Mails. All rights reserved.</div></div>
    </footer>

    <!-- AD: Sticky Bottom Bar -->
    ${(adSlots.find(a => a.slot_id === 'ad-bottom-sticky')?.enabled !== 0) ? `
    <div class="ad-sticky-bottom" id="ad-sticky-bottom">
      <div class="ad-sticky-inner">
        ${renderAdSlot('ad-bottom-sticky', 'ad-728x90-sticky', '📌', 'Sticky Ad · 728 × 90', '728 × 90')}
        <button class="ad-close-btn" id="close-sticky-ad" title="Close ad">✕</button>
      </div>
    </div>` : ''}

    <!-- AD: Floating Right Side Rail (Skyscraper) -->
    ${(adSlots.find(a => a.slot_id === 'ad-skyscraper-right')?.enabled !== 0) ? `
    <div class="ad-side-rail ad-side-rail-right" id="ad-side-rail-right">
      ${renderAdSlot('ad-skyscraper-right', 'ad-160x600', '🗼', 'Ad', '160 × 600')}
    </div>` : ''}

    <!-- AD: Floating Left Side Rail (Skyscraper) -->
    ${(adSlots.find(a => a.slot_id === 'ad-skyscraper-left')?.enabled !== 0) ? `
    <div class="ad-side-rail ad-side-rail-left" id="ad-side-rail-left">
      ${renderAdSlot('ad-skyscraper-left', 'ad-160x600', '🗼', 'Ad', '160 × 600')}
    </div>` : ''}
  `;

  injectStyles();
  initEventListeners();
  startPolling();
  startCountdown();
  fetchEmails();
}

// ── Render: Email List ──────────────────────────────────────────
function renderEmailList() {
  const list = document.getElementById('email-list');
  const empty = document.getElementById('empty-state');
  if (!list) return;

  if (emails.length === 0) {
    list.innerHTML = `
      <div class="empty-state" id="empty-state">
        <div class="empty-icon">📭</div>
        <h3>Waiting for emails...</h3>
        <p>Emails sent to <strong>${mailbox?.address || ''}</strong> will appear here automatically.</p>
        <div class="pulse-dot"></div>
      </div>
    `;
    return;
  }

  list.innerHTML = emails.map((e, i) => `
    <div class="email-row ${!e.is_read ? 'unread' : ''} ${selectedEmail?.id === e.id ? 'selected' : ''}" data-email-idx="${i}">
      <div class="email-row-left">
        <div class="sender-avatar" style="background:${avatarColor(e.sender)}">${(e.sender || '?')[0]}</div>
        <div class="email-row-content">
          <div class="email-sender">${e.sender || 'Unknown'}</div>
          <div class="email-subject">${e.subject || '(No Subject)'}</div>
        </div>
      </div>
      <div class="email-time">${timeAgo(e.received_at)}</div>
    </div>
  `).join('');

  // Click handlers
  list.querySelectorAll('.email-row').forEach(row => {
    row.addEventListener('click', () => {
      const idx = parseInt(row.dataset.emailIdx);
      selectEmail(idx);
    });
  });
}

function avatarColor(sender) {
  const colors = ['#7C3AED', '#F97316', '#22C55E', '#3B82F6', '#EF4444', '#EAB308', '#EC4899', '#06B6D4'];
  let hash = 0;
  for (let i = 0; i < (sender || '').length; i++) hash = sender.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

async function selectEmail(idx) {
  const email = emails[idx];
  if (!email) return;

  try {
    const full = await api(`/email/${email.id}`);
    selectedEmail = full;
    emails[idx].is_read = 1;
    renderEmailList();
    renderEmailReader(full);
  } catch {
    renderEmailReader(email);
  }
}

function renderEmailReader(email) {
  const reader = document.getElementById('email-reader');
  if (!reader) return;

  // Add mobile-active class so reader is visible on mobile
  reader.classList.add('mobile-active');

  reader.innerHTML = `
    <div class="reader-content">
      <button class="btn btn-sm btn-ghost reader-back-btn" id="reader-back-btn" style="display:none; margin-bottom:0.8rem; gap:0.4rem;">
        ← Back to Inbox
      </button>
      <div class="reader-header">
        <div class="reader-subject">${email.subject || '(No Subject)'}</div>
        <div class="reader-meta">
          <div class="reader-sender"><div class="sender-avatar sm" style="background:${avatarColor(email.sender)}">${(email.sender || '?')[0]}</div> <strong>${email.sender || 'Unknown'}</strong></div>
          <div class="reader-time">${new Date(email.received_at).toLocaleString()}</div>
        </div>
        <div class="reader-to">To: <span class="mono">${email.to_address || mailbox?.address || ''}</span></div>
      </div>
      <div class="reader-body">${(email.body || '').replace(/\n/g, '<br>')}</div>
      <div class="reader-actions">
        <button class="btn btn-sm btn-ghost" data-delete-email="${email.id}">🗑️ Delete</button>
      </div>
    </div>
  `;

  // Scroll reader into view on mobile
  if (window.innerWidth <= 768) {
    setTimeout(() => reader.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }

  // Back button (mobile) — hides reader and scrolls back to list
  document.getElementById('reader-back-btn')?.addEventListener('click', () => {
    reader.classList.remove('mobile-active');
    reader.innerHTML = `<div class="reader-placeholder"><div class="reader-icon">✉️</div><p>Select an email to read</p></div>`;
    selectedEmail = null;
    renderEmailList();
    document.getElementById('email-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  reader.querySelector('[data-delete-email]')?.addEventListener('click', async (e) => {
    const id = e.target.closest('[data-delete-email]').dataset.deleteEmail;
    try {
      await api(`/email/${id}`, { method: 'DELETE' });
      emails = emails.filter(em => em.id !== parseInt(id));
      selectedEmail = null;
      renderEmailList();
      reader.classList.remove('mobile-active');
      reader.innerHTML = `<div class="reader-placeholder"><div class="reader-icon">✉️</div><p>Select an email to read</p></div>`;
      toast('Email deleted');
    } catch { toast('Failed to delete', 'error'); }
  });
}

function updateInboxCount() {
  const el = document.getElementById('inbox-count');
  if (el) el.textContent = emails.length;
}

// ── Event Listeners ─────────────────────────────────────────────
function initEventListeners() {
  // Copy email
  document.getElementById('copy-btn')?.addEventListener('click', copyEmail);
  document.getElementById('copy-btn-main')?.addEventListener('click', copyEmail);

  // Change email
  document.getElementById('refresh-btn')?.addEventListener('click', async () => {
    await createMailbox();
    document.getElementById('email-address').textContent = mailbox.address;
    document.getElementById('email-list').innerHTML = `
      <div class="empty-state"><div class="empty-icon">📭</div><h3>Waiting for emails...</h3>
      <p>Emails sent to <strong>${mailbox.address}</strong> will appear here.</p><div class="pulse-dot"></div></div>`;
    document.getElementById('email-reader').innerHTML = `<div class="reader-placeholder"><div class="reader-icon">✉️</div><p>Select an email to read</p></div>`;
    startCountdown();
    toast('New email address generated!');
  });

  // Manual refresh
  document.getElementById('manual-refresh')?.addEventListener('click', () => { fetchEmails(); toast('Refreshed!'); });

  // Simulate
  document.getElementById('simulate-btn')?.addEventListener('click', async () => {
    if (!mailbox) return;
    try {
      const result = await api('/simulate', { method: 'POST', body: { mailboxId: mailbox.id } });
      toast(`Email from ${result.sender}!`);
      fetchEmails();
    } catch { toast('Simulation failed', 'error'); }
  });

  // Delete all
  document.getElementById('delete-all-btn')?.addEventListener('click', async () => {
    if (!mailbox || emails.length === 0) return;
    try {
      await api(`/emails/${mailbox.id}`, { method: 'DELETE' });
      emails = [];
      selectedEmail = null;
      renderEmailList();
      document.getElementById('email-reader').innerHTML = `<div class="reader-placeholder"><div class="reader-icon">✉️</div><p>Select an email to read</p></div>`;
      toast('All emails deleted');
    } catch { toast('Failed to delete', 'error'); }
  });

  // ── QR Code Modal ──────────────────────────────────────────────
  document.getElementById('qr-btn')?.addEventListener('click', () => {
    document.getElementById('qr-modal').style.display = 'flex';
  });
  const closeQr = () => { document.getElementById('qr-modal').style.display = 'none'; };
  document.getElementById('close-qr-modal')?.addEventListener('click', closeQr);
  document.getElementById('close-qr-modal-2')?.addEventListener('click', closeQr);
  document.getElementById('qr-modal')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeQr(); });
  document.getElementById('download-qr-btn')?.addEventListener('click', () => {
    const img = document.getElementById('qr-code-img');
    if (!img) return;
    const a = document.createElement('a');
    a.href = img.src;
    a.download = `trashmails-qr-${Date.now()}.png`;
    a.target = '_blank';
    a.click();
    toast('QR code download started!');
  });

  // ── Edit Email Modal ──────────────────────────────────────────
  document.getElementById('edit-email-btn')?.addEventListener('click', () => {
    document.getElementById('edit-email-modal').style.display = 'flex';
    const input = document.getElementById('custom-email-input');
    if (input && mailbox?.address) {
      input.value = mailbox.address.split('@')[0];
      input.focus();
      input.select();
    }
    document.getElementById('edit-email-error').style.display = 'none';
  });
  const closeEdit = () => { document.getElementById('edit-email-modal').style.display = 'none'; };
  document.getElementById('close-edit-modal')?.addEventListener('click', closeEdit);
  document.getElementById('close-edit-modal-2')?.addEventListener('click', closeEdit);
  document.getElementById('edit-email-modal')?.addEventListener('click', e => { if (e.target === e.currentTarget) closeEdit(); });

  document.getElementById('save-custom-email')?.addEventListener('click', async () => {
    const input = document.getElementById('custom-email-input');
    const errDiv = document.getElementById('edit-email-error');
    const username = input?.value?.trim();
    if (!username || username.length < 3) {
      errDiv.textContent = 'Username must be at least 3 characters';
      errDiv.style.display = 'block'; return;
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
      errDiv.textContent = 'Only letters, numbers, dots, hyphens, underscores allowed';
      errDiv.style.display = 'block'; return;
    }
    try {
      const result = await api('/mailbox/custom', { method: 'POST', body: { username } });
      mailbox = result;
      localStorage.setItem('mailbox', JSON.stringify(result));
      document.getElementById('email-address').textContent = result.address;
      // Update QR code image
      const qrImg = document.getElementById('qr-code-img');
      if (qrImg) qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(result.address)}`;
      closeEdit();
      startCountdown();
      emails = [];
      selectedEmail = null;
      renderEmailList();
      document.getElementById('email-reader').innerHTML = `<div class="reader-placeholder"><div class="reader-icon">✉️</div><p>Select an email to read</p></div>`;
      toast(`Email set to ${result.address}!`);
    } catch (err) {
      errDiv.textContent = err.message || 'Failed to set email';
      errDiv.style.display = 'block';
    }
  });

  // FAQ accordion
  document.querySelectorAll('.faq-q').forEach(q => {
    const a = q.nextElementSibling;
    const icon = q.querySelector('span');
    a.style.maxHeight = '0'; a.style.overflow = 'hidden'; a.style.transition = 'max-height 0.35s ease, padding 0.35s ease'; a.style.padding = '0 1.5rem';
    q.addEventListener('click', () => {
      const open = a.style.maxHeight !== '0px' && a.style.maxHeight !== '0';
      if (open) { a.style.maxHeight = '0'; a.style.padding = '0 1.5rem'; icon.textContent = '+'; }
      else { a.style.maxHeight = a.scrollHeight + 30 + 'px'; a.style.padding = '0 1.5rem 1.5rem'; icon.textContent = '−'; }
    });
  });

  // Admin button
  document.getElementById('admin-btn')?.addEventListener('click', renderAdminDashboard);

  // Close sticky ad
  document.getElementById('close-sticky-ad')?.addEventListener('click', () => {
    const stickyAd = document.getElementById('ad-sticky-bottom');
    if (stickyAd) {
      stickyAd.style.transform = 'translateY(100%)';
      setTimeout(() => stickyAd.style.display = 'none', 400);
    }
  });

  // Show sticky ad after 3 seconds
  setTimeout(() => {
    const stickyAd = document.getElementById('ad-sticky-bottom');
    if (stickyAd) stickyAd.classList.add('visible');
  }, 3000);

  // Show side rails after 1 second
  setTimeout(() => {
    document.getElementById('ad-side-rail-right')?.classList.add('visible');
    document.getElementById('ad-side-rail-left')?.classList.add('visible');
  }, 1000);

  // Blog: Read More buttons
  document.querySelectorAll('.blog-read-more').forEach(btn => {
    btn.addEventListener('click', () => renderBlogPost(btn.dataset.slug));
  });

  // Blog: View All Posts
  document.getElementById('view-all-posts')?.addEventListener('click', renderAllBlogPosts);
}

function copyEmail() {
  if (!mailbox?.address) return;
  navigator.clipboard.writeText(mailbox.address);
  toast('Email copied to clipboard!');
  const btn = document.getElementById('copy-btn-main');
  if (btn) { btn.textContent = '✅ Copied!'; setTimeout(() => btn.textContent = '📋 Copy', 2000); }
}

// ── Blog: Single Post Page ──────────────────────────────────────
async function renderBlogPost(slug) {
  if (pollTimer) clearInterval(pollTimer);
  if (countdownTimer) clearInterval(countdownTimer);

  let post;
  try { post = await api(`/blog/${slug}`); } catch { toast('Post not found', 'error'); return; }

  const shareUrl = encodeURIComponent(window.location.origin + '/#blog/' + post.slug);
  const shareTitle = encodeURIComponent(post.title);

  document.querySelector('#app').innerHTML = `
    <nav class="nav">
      <div class="container nav-inner">
        <div class="nav-brand" style="cursor:pointer" id="blog-home">🗑️ <span>Trash Mails</span></div>
        <div class="nav-links">
          <a href="#" id="blog-back-home">← Home</a>
          <a href="#" id="blog-back-list">Blog</a>
        </div>
      </div>
    </nav>
    <article class="blog-detail">
      <div class="container" style="max-width:800px">
        <div class="blog-detail-cover">${post.cover_image || '📝'}</div>
        <div class="blog-detail-meta">
          <span class="blog-category">${post.category}</span>
          <span class="blog-date">${new Date(post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          <span class="blog-views">👁️ ${post.views} views</span>
        </div>
        <h1 class="blog-detail-title">${post.title}</h1>
        <div class="blog-detail-author">
          <div class="sender-avatar sm" style="background:${avatarColor(post.author)}">${post.author[0]}</div>
          <span>${post.author}</span>
        </div>
        <div class="blog-detail-body">${post.body}</div>

        ${post.tags ? `<div class="blog-tags">${post.tags.split(',').map(t => `<span class="blog-tag">#${t.trim()}</span>`).join('')}</div>` : ''}

        <!-- Social Sharing -->
        <div class="blog-share-section">
          <h3>Share this article</h3>
          <div class="blog-share-buttons">
            <a href="https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}" target="_blank" class="share-btn share-twitter">𝕏 Twitter</a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" class="share-btn share-facebook">f Facebook</a>
            <a href="https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}" target="_blank" class="share-btn share-linkedin">in LinkedIn</a>
            <a href="https://api.whatsapp.com/send?text=${shareTitle}%20${shareUrl}" target="_blank" class="share-btn share-whatsapp">💬 WhatsApp</a>
            <a href="mailto:?subject=${shareTitle}&body=Check%20this%20out:%20${shareUrl}" class="share-btn share-email">✉️ Email</a>
          </div>
        </div>

        <div class="blog-back-wrap">
          <button class="btn btn-outline" id="blog-back-btn">← Back to Blog</button>
        </div>
      </div>
    </article>
  `;

  injectStyles();
  document.getElementById('blog-home')?.addEventListener('click', renderPage);
  document.getElementById('blog-back-home')?.addEventListener('click', (e) => { e.preventDefault(); renderPage(); });
  document.getElementById('blog-back-list')?.addEventListener('click', (e) => { e.preventDefault(); renderAllBlogPosts(); });
  document.getElementById('blog-back-btn')?.addEventListener('click', renderAllBlogPosts);
  window.scrollTo(0, 0);
}

// ── Blog: All Posts Page ────────────────────────────────────────
async function renderAllBlogPosts() {
  if (pollTimer) clearInterval(pollTimer);
  if (countdownTimer) clearInterval(countdownTimer);

  let posts = [];
  try { posts = await api('/blog'); } catch { }

  document.querySelector('#app').innerHTML = `
    <nav class="nav">
      <div class="container nav-inner">
        <div class="nav-brand" style="cursor:pointer" id="blog-home">🗑️ <span>Trash Mails</span></div>
        <div class="nav-links">
          <a href="#" id="blog-back-home">← Back to Home</a>
        </div>
      </div>
    </nav>
    <section class="blog-section blog-all-section">
      <div class="container">
        <h1 style="text-align:center;margin-bottom:0.5rem">📚 All Blog Posts</h1>
        <p class="section-subtitle">${posts.length} articles about email privacy, security & tips</p>
        <div class="blog-grid blog-grid-all">
          ${posts.map(post => `
            <article class="blog-card">
              <div class="blog-cover">${post.cover_image || '📝'}</div>
              <div class="blog-card-body">
                <div class="blog-card-meta">
                  <span class="blog-category">${post.category}</span>
                  <span class="blog-date">${new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <h3 class="blog-card-title">${post.title}</h3>
                <p class="blog-card-excerpt">${post.excerpt}</p>
                <div class="blog-card-footer">
                  <span class="blog-author">✍️ ${post.author}</span>
                  <button class="btn btn-sm btn-outline blog-read-more" data-slug="${post.slug}">Read More →</button>
                </div>
              </div>
            </article>
          `).join('')}
        </div>
      </div>
    </section>
  `;

  injectStyles();
  document.getElementById('blog-home')?.addEventListener('click', renderPage);
  document.getElementById('blog-back-home')?.addEventListener('click', (e) => { e.preventDefault(); renderPage(); });
  document.querySelectorAll('.blog-read-more').forEach(btn => {
    btn.addEventListener('click', () => renderBlogPost(btn.dataset.slug));
  });
  window.scrollTo(0, 0);
}

// ── Admin Dashboard ─────────────────────────────────────────────
async function renderAdminDashboard() {
  // Save current active tab before re-render
  const activeTabBtn = document.querySelector('.admin-menu-item.active[data-tab]');
  if (activeTabBtn) window._adminActiveTab = activeTabBtn.dataset.tab;

  if (pollTimer) clearInterval(pollTimer);
  if (countdownTimer) clearInterval(countdownTimer);

  let stats = {}, mailboxes = [], adminEmails = [], domains = [], adminAds = [], adminBlog = [];
  try {
    [stats, mailboxes, adminEmails, domains, adminAds, adminBlog] = await Promise.all([
      api('/admin/stats'), api('/admin/mailboxes'), api('/admin/emails'), api('/admin/domains'), api('/admin/ads'), api('/admin/blog')
    ]);
  } catch { }

  const enabledCount = adminAds.filter(a => a.enabled).length;
  const totalAds = adminAds.length;

  document.querySelector('#app').innerHTML = `
    <div class="admin-layout">
      <div class="admin-sidebar">
        <div class="nav-brand" id="admin-home" style="cursor:pointer">🗑️ <span>Trash Mails</span></div>
        <div class="admin-menu">
          <div class="admin-menu-item active" data-tab="overview">📊 Overview</div>
          <div class="admin-menu-item" data-tab="mailboxes">📬 Mailboxes</div>
          <div class="admin-menu-item" data-tab="emails">📧 Emails</div>
          <div class="admin-menu-item" data-tab="domains">🌐 Domains</div>
          <div class="admin-menu-item" data-tab="ads">📢 Ads Manager</div>
          <div class="admin-menu-item" data-tab="blog">📝 Blog Manager</div>
          <div class="admin-menu-item back" id="back-to-app">⬅️ Back to Site</div>
        </div>
      </div>
      <div class="admin-content">
        <div class="admin-panel" id="panel-overview">
          <h2 style="text-align:left">Dashboard</h2>
          <div class="stat-grid">
            <div class="stat-box"><div class="stat-icon" style="background:rgba(124,58,237,0.1);color:var(--primary)">📬</div><div><div class="stat-num">${stats.totalMailboxes || 0}</div><div class="stat-lbl">Mailboxes</div></div></div>
            <div class="stat-box"><div class="stat-icon" style="background:rgba(249,115,22,0.1);color:var(--accent)">📧</div><div><div class="stat-num">${stats.totalEmails || 0}</div><div class="stat-lbl">Emails</div></div></div>
            <div class="stat-box"><div class="stat-icon" style="background:rgba(34,197,94,0.1);color:var(--success)">🌐</div><div><div class="stat-num">${stats.totalDomains || 0}</div><div class="stat-lbl">Domains</div></div></div>
            <div class="stat-box"><div class="stat-icon" style="background:rgba(59,130,246,0.1);color:#3B82F6">🔥</div><div><div class="stat-num">${stats.activeToday || 0}</div><div class="stat-lbl">Active Today</div></div></div>
          </div>
          <h3 style="margin-top:2rem">Recent Mailboxes</h3>
          <div class="admin-table">
            <div class="t-row t-head"><div>Address</div><div>Emails</div><div>Created</div><div></div></div>
            ${mailboxes.slice(0, 8).map(m => `<div class="t-row"><div class="mono" style="font-size:0.8rem">${m.address}</div><div>${m.email_count}</div><div>${new Date(m.created_at).toLocaleDateString()}</div><div><button class="btn btn-sm btn-ghost" data-del-mb="${m.id}">🗑️</button></div></div>`).join('') || '<div class="t-row"><div style="grid-column:1/-1;text-align:center;color:var(--text-dim)">No mailboxes</div></div>'}
          </div>
        </div>
        <div class="admin-panel hidden" id="panel-mailboxes">
          <h2 style="text-align:left">All Mailboxes</h2>
          <div class="admin-table">
            <div class="t-row t-head"><div>Address</div><div>Emails</div><div>Created</div><div>Expires</div><div></div></div>
            ${mailboxes.map(m => `<div class="t-row"><div class="mono" style="font-size:0.8rem">${m.address}</div><div>${m.email_count}</div><div>${new Date(m.created_at).toLocaleDateString()}</div><div>${m.expires_at ? new Date(m.expires_at).toLocaleString() : '—'}</div><div><button class="btn btn-sm btn-ghost" data-del-mb="${m.id}">🗑️</button></div></div>`).join('')}
          </div>
        </div>
        <div class="admin-panel hidden" id="panel-emails">
          <h2 style="text-align:left">Email Log</h2>
          <div class="admin-table">
            <div class="t-row t-head"><div>From</div><div>Subject</div><div>To</div><div>Date</div></div>
            ${adminEmails.slice(0, 30).map(e => `<div class="t-row"><div>${e.sender || '—'}</div><div>${e.subject || '—'}</div><div class="mono" style="font-size:0.75rem">${e.to_address || '—'}</div><div>${new Date(e.received_at).toLocaleDateString()}</div></div>`).join('') || '<div class="t-row"><div style="grid-column:1/-1;text-align:center;color:var(--text-dim)">No emails</div></div>'}
          </div>
        </div>
        <div class="admin-panel hidden" id="panel-domains">
          <div style="display:flex;justify-content:space-between;align-items:center"><h2 style="text-align:left">Domains</h2><button class="btn btn-sm btn-primary" id="add-domain-btn">+ Add Domain</button></div>
          <div class="domain-list">
            <div class="domain-item"><div class="domain-name-d">trashmails.io</div><span class="d-badge active">Default</span></div>
            ${domains.map(d => `<div class="domain-item"><div class="domain-name-d">${d.name}</div><span class="d-badge ${d.verified ? 'active' : 'pending'}">${d.verified ? 'Verified' : 'Pending'}</span></div>`).join('')}
          </div>
        </div>

        <!-- ═══ ADS MANAGER PANEL ═══ -->
        <div class="admin-panel hidden" id="panel-ads">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem">
            <div>
              <h2 style="text-align:left;margin:0">Ads Manager</h2>
              <p style="color:var(--text-dim);font-size:0.85rem;margin-top:0.3rem">${enabledCount}/${totalAds} ad slots active</p>
            </div>
            <div style="display:flex;gap:0.5rem">
              <button class="btn btn-sm btn-primary" id="enable-all-ads">✅ Enable All</button>
              <button class="btn btn-sm btn-ghost" id="disable-all-ads" style="color:var(--danger)">🚫 Disable All</button>
            </div>
          </div>

          <div class="ads-manager-grid">
            ${adminAds.map(ad => `
              <div class="ad-manager-card ${ad.enabled ? '' : 'disabled'}" data-slot="${ad.slot_id}">
                <div class="ad-mgr-header">
                  <div class="ad-mgr-info">
                    <div class="ad-mgr-name">${ad.name}</div>
                    <div class="ad-mgr-meta">
                      <span class="ad-mgr-size">${ad.size}</span>
                      <span class="ad-mgr-pos">📍 ${ad.position}</span>
                    </div>
                  </div>
                  <label class="ad-toggle">
                    <input type="checkbox" ${ad.enabled ? 'checked' : ''} data-toggle-ad="${ad.slot_id}">
                    <span class="ad-toggle-slider"></span>
                  </label>
                </div>
                <div class="ad-mgr-status">
                  <span class="ad-status-dot ${ad.enabled ? 'active' : 'inactive'}"></span>
                  <span>${ad.enabled ? 'Active' : 'Inactive'}</span>
                  ${ad.ad_code ? '<span class="ad-has-code">📝 Custom Code</span>' : '<span class="ad-no-code">⬜ Placeholder</span>'}
                </div>
                <div class="ad-mgr-actions">
                  <button class="btn btn-sm btn-outline" data-edit-ad="${ad.slot_id}" data-ad-name="${ad.name}">✏️ Edit Code</button>
                  <button class="btn btn-sm btn-ghost" data-preview-ad="${ad.slot_id}">👁️ Preview</button>
                </div>
                ${ad.notes ? `<div class="ad-mgr-notes">📋 ${ad.notes}</div>` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

        <!-- ═══ BLOG MANAGER PANEL ═══ -->
        <div class="admin-panel hidden" id="panel-blog">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem">
            <div>
              <h2 style="text-align:left;margin-bottom:0.3rem">📝 Blog Manager</h2>
              <p style="color:var(--text-dim);font-size:0.85rem">${adminBlog.length} posts total</p>
            </div>
            <button class="btn btn-primary" id="new-blog-post-btn">+ New Post</button>
          </div>
          <div class="admin-table">
            <div class="t-row t-head"><div>Title</div><div>Status</div><div>Category</div><div>Views</div><div>Date</div><div>Actions</div></div>
            ${adminBlog.map(p => `
              <div class="t-row">
                <div style="font-weight:600;font-size:0.85rem">${p.cover_image || '📝'} ${p.title}</div>
                <div><span class="d-badge ${p.status === 'published' ? 'active' : p.status === 'hidden' ? 'pending' : ''}">${p.status}</span></div>
                <div>${p.category}</div>
                <div>👁️ ${p.views}</div>
                <div style="font-size:0.75rem">${new Date(p.created_at).toLocaleDateString()}</div>
                <div style="display:flex;gap:0.3rem;flex-wrap:wrap">
                  <button class="btn btn-sm btn-outline" data-edit-blog="${p.id}">✏️</button>
                  <button class="btn btn-sm btn-ghost" data-toggle-blog="${p.id}" data-current-status="${p.status}">${p.status === 'published' ? '👁️‍🗨️ Hide' : '✅ Show'}</button>
                  <button class="btn btn-sm btn-ghost" style="color:var(--danger)" data-delete-blog="${p.id}">🗑️</button>
                </div>
              </div>
            `).join('') || '<div class="t-row"><div style="grid-column:1/-1;text-align:center;color:var(--text-dim)">No blog posts yet</div></div>'}
          </div>
        </div>
      </div>
    </div>

    <!-- Blog Edit Modal -->
    <div class="ad-modal-overlay" id="blog-modal" style="display:none">
      <div class="ad-modal" style="max-width:700px">
        <div class="ad-modal-header">
          <h3 id="blog-modal-title">New Blog Post</h3>
          <button class="ad-modal-close" id="close-blog-modal">✕</button>
        </div>
        <div class="ad-modal-body" style="max-height:70vh;overflow-y:auto">
          <input type="hidden" id="blog-edit-id" value="">
          <div class="ad-form-group"><label>Title *</label><input type="text" id="blog-edit-title" class="ad-input" placeholder="My awesome blog post"></div>
          <div class="ad-form-group"><label>Slug <span style="color:var(--text-dim);font-weight:400">(auto-generated if empty)</span></label><input type="text" id="blog-edit-slug" class="ad-input mono" placeholder="my-awesome-blog-post"></div>
          <div class="ad-form-group"><label>Excerpt</label><textarea id="blog-edit-excerpt" class="ad-textarea" rows="2" placeholder="A brief summary of the post..."></textarea></div>
          <div class="ad-form-group"><label>Body <span style="color:var(--text-dim);font-weight:400">(HTML supported)</span></label><textarea id="blog-edit-body" class="ad-textarea mono" rows="12" placeholder="<h2>My Heading</h2>\n<p>Your content here...</p>"></textarea></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem">
            <div class="ad-form-group"><label>Cover Emoji</label><input type="text" id="blog-edit-cover" class="ad-input" placeholder="📝" style="font-size:1.5rem;text-align:center"></div>
            <div class="ad-form-group"><label>Author</label><input type="text" id="blog-edit-author" class="ad-input" placeholder="Admin"></div>
            <div class="ad-form-group"><label>Category</label><input type="text" id="blog-edit-category" class="ad-input" placeholder="General"></div>
            <div class="ad-form-group"><label>Status</label>
              <select id="blog-edit-status" class="ad-input">
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>
          <div class="ad-form-group"><label>Tags <span style="color:var(--text-dim);font-weight:400">(comma separated)</span></label><input type="text" id="blog-edit-tags" class="ad-input" placeholder="privacy,email,tips"></div>
        </div>
        <div class="ad-modal-footer">
          <button class="btn btn-ghost" id="cancel-blog-modal">Cancel</button>
          <button class="btn btn-primary" id="save-blog-post">💾 Save Post</button>
        </div>
      </div>
    </div>

    <!-- Ad Edit Modal -->
    <div class="ad-modal-overlay" id="ad-modal" style="display:none">
      <div class="ad-modal">
        <div class="ad-modal-header">
          <h3 id="ad-modal-title">Edit Ad Code</h3>
          <button class="ad-modal-close" id="close-ad-modal">✕</button>
        </div>
        <div class="ad-modal-body">
          <div class="ad-form-group">
            <label>Ad Slot ID</label>
            <input type="text" id="ad-edit-id" readonly class="ad-input mono">
          </div>
          <div class="ad-form-group">
            <label>Ad Code <span style="color:var(--text-dim);font-weight:400">(HTML/JS — paste your AdSense, Ezoic, or custom ad code)</span></label>
            <textarea id="ad-edit-code" class="ad-textarea mono" rows="10" placeholder="<!-- Paste your ad code here -->\n<script async src='https://pagead2.googlesyndication.com/...'></script>\n<ins class='adsbygoogle'...></ins>\n<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>"></textarea>
          </div>
          <div class="ad-form-group">
            <label>Notes <span style="color:var(--text-dim);font-weight:400">(optional — for your reference)</span></label>
            <input type="text" id="ad-edit-notes" class="ad-input" placeholder="e.g. Google AdSense Unit #12345">
          </div>
        </div>
        <div class="ad-modal-footer">
          <button class="btn btn-ghost" id="cancel-ad-modal">Cancel</button>
          <button class="btn btn-primary" id="save-ad-code">💾 Save Changes</button>
        </div>
      </div>
    </div>
  `;

  injectAdminStyles();

  // Tab switching
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.admin-menu-item').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.admin-panel').forEach(p => p.classList.add('hidden'));
      document.getElementById('panel-' + btn.dataset.tab)?.classList.remove('hidden');
      window._adminActiveTab = btn.dataset.tab;
    });
  });

  // Restore active tab after re-render
  if (window._adminActiveTab && window._adminActiveTab !== 'overview') {
    const tabBtn = document.querySelector(`[data-tab="${window._adminActiveTab}"]`);
    if (tabBtn) tabBtn.click();
  }

  // Back
  document.getElementById('back-to-app')?.addEventListener('click', renderPage);
  document.getElementById('admin-home')?.addEventListener('click', renderPage);

  // Delete mailbox
  document.querySelectorAll('[data-del-mb]').forEach(btn => {
    btn.addEventListener('click', async () => {
      try { await api(`/admin/mailbox/${btn.dataset.delMb}`, { method: 'DELETE' }); toast('Mailbox deleted'); renderAdminDashboard(); } catch { toast('Failed', 'error'); }
    });
  });

  // Add domain
  document.getElementById('add-domain-btn')?.addEventListener('click', () => {
    const name = prompt('Enter domain name:');
    if (name) api('/admin/domains', { method: 'POST', body: { name } }).then(() => { toast('Domain added!'); renderAdminDashboard(); }).catch(() => toast('Failed', 'error'));
  });

  // ── Ads Manager Events ──────────────────────────────────────────

  // Toggle individual ad
  document.querySelectorAll('[data-toggle-ad]').forEach(toggle => {
    toggle.addEventListener('change', async () => {
      const slotId = toggle.dataset.toggleAd;
      try {
        await api(`/admin/ads/${slotId}`, { method: 'PUT', body: { enabled: toggle.checked } });
        toast(`${slotId} ${toggle.checked ? 'enabled' : 'disabled'}`);
        renderAdminDashboard();
      } catch { toast('Failed to update', 'error'); }
    });
  });

  // Enable all ads
  document.getElementById('enable-all-ads')?.addEventListener('click', async () => {
    try {
      await api('/admin/ads-bulk', { method: 'PUT', body: { enabled: true } });
      toast('All ads enabled!');
      renderAdminDashboard();
    } catch { toast('Failed', 'error'); }
  });

  // Disable all ads
  document.getElementById('disable-all-ads')?.addEventListener('click', async () => {
    if (!confirm('Disable ALL ads on the site?')) return;
    try {
      await api('/admin/ads-bulk', { method: 'PUT', body: { enabled: false } });
      toast('All ads disabled');
      renderAdminDashboard();
    } catch { toast('Failed', 'error'); }
  });

  // Edit ad code modal
  document.querySelectorAll('[data-edit-ad]').forEach(btn => {
    btn.addEventListener('click', () => {
      const slotId = btn.dataset.editAd;
      const ad = adminAds.find(a => a.slot_id === slotId);
      if (!ad) return;
      document.getElementById('ad-modal').style.display = 'flex';
      document.getElementById('ad-modal-title').textContent = `Edit: ${ad.name}`;
      document.getElementById('ad-edit-id').value = ad.slot_id;
      document.getElementById('ad-edit-code').value = ad.ad_code || '';
      document.getElementById('ad-edit-notes').value = ad.notes || '';
    });
  });

  // Close modal
  const closeModal = () => { document.getElementById('ad-modal').style.display = 'none'; };
  document.getElementById('close-ad-modal')?.addEventListener('click', closeModal);
  document.getElementById('cancel-ad-modal')?.addEventListener('click', closeModal);
  document.getElementById('ad-modal')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });

  // Save ad code
  document.getElementById('save-ad-code')?.addEventListener('click', async () => {
    const slotId = document.getElementById('ad-edit-id').value;
    const ad_code = document.getElementById('ad-edit-code').value;
    const notes = document.getElementById('ad-edit-notes').value;
    try {
      await api(`/admin/ads/${slotId}`, { method: 'PUT', body: { ad_code, notes } });
      toast('Ad code saved!');
      closeModal();
      renderAdminDashboard();
    } catch { toast('Failed to save', 'error'); }
  });

  // Preview ad - scroll to it after switching back
  document.querySelectorAll('[data-preview-ad]').forEach(btn => {
    btn.addEventListener('click', () => {
      toast(`Preview: switch to site view to see "${btn.dataset.previewAd}"`, 'success');
    });
  });


  // ── Blog Manager Events ──────────────────────────────────────────

  const closeBlogModal = () => { document.getElementById('blog-modal').style.display = 'none'; };
  document.getElementById('close-blog-modal')?.addEventListener('click', closeBlogModal);
  document.getElementById('cancel-blog-modal')?.addEventListener('click', closeBlogModal);
  document.getElementById('blog-modal')?.addEventListener('click', (e) => { if (e.target === e.currentTarget) closeBlogModal(); });

  // New Post
  document.getElementById('new-blog-post-btn')?.addEventListener('click', () => {
    document.getElementById('blog-modal').style.display = 'flex';
    document.getElementById('blog-modal-title').textContent = 'New Blog Post';
    document.getElementById('blog-edit-id').value = '';
    document.getElementById('blog-edit-title').value = '';
    document.getElementById('blog-edit-slug').value = '';
    document.getElementById('blog-edit-excerpt').value = '';
    document.getElementById('blog-edit-body').value = '';
    document.getElementById('blog-edit-cover').value = '📝';
    document.getElementById('blog-edit-author').value = 'Admin';
    document.getElementById('blog-edit-category').value = 'General';
    document.getElementById('blog-edit-status').value = 'published';
    document.getElementById('blog-edit-tags').value = '';
  });

  // Edit Post
  document.querySelectorAll('[data-edit-blog]').forEach(btn => {
    btn.addEventListener('click', () => {
      const postId = btn.dataset.editBlog;
      const post = adminBlog.find(p => p.id === parseInt(postId));
      if (!post) return;
      document.getElementById('blog-modal').style.display = 'flex';
      document.getElementById('blog-modal-title').textContent = `Edit: ${post.title}`;
      document.getElementById('blog-edit-id').value = post.id;
      document.getElementById('blog-edit-title').value = post.title;
      document.getElementById('blog-edit-slug').value = post.slug;
      document.getElementById('blog-edit-excerpt').value = post.excerpt || '';
      document.getElementById('blog-edit-body').value = post.body || '';
      document.getElementById('blog-edit-cover').value = post.cover_image || '';
      document.getElementById('blog-edit-author').value = post.author || '';
      document.getElementById('blog-edit-category').value = post.category || '';
      document.getElementById('blog-edit-status').value = post.status || 'published';
      document.getElementById('blog-edit-tags').value = post.tags || '';
    });
  });

  // Toggle visibility
  document.querySelectorAll('[data-toggle-blog]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.toggleBlog;
      const current = btn.dataset.currentStatus;
      const newStatus = current === 'published' ? 'hidden' : 'published';
      try {
        await api(`/admin/blog/${id}`, { method: 'PUT', body: { status: newStatus } });
        toast(`Post ${newStatus === 'published' ? 'published' : 'hidden'}!`);
        renderAdminDashboard();
      } catch { toast('Failed to update', 'error'); }
    });
  });

  // Delete post
  document.querySelectorAll('[data-delete-blog]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this blog post permanently?')) return;
      try {
        await api(`/admin/blog/${btn.dataset.deleteBlog}`, { method: 'DELETE' });
        toast('Post deleted!');
        renderAdminDashboard();
      } catch { toast('Failed to delete', 'error'); }
    });
  });

  // Save post (create or update)
  document.getElementById('save-blog-post')?.addEventListener('click', async () => {
    const id = document.getElementById('blog-edit-id').value;
    const data = {
      title: document.getElementById('blog-edit-title').value,
      slug: document.getElementById('blog-edit-slug').value,
      excerpt: document.getElementById('blog-edit-excerpt').value,
      body: document.getElementById('blog-edit-body').value,
      cover_image: document.getElementById('blog-edit-cover').value,
      author: document.getElementById('blog-edit-author').value,
      category: document.getElementById('blog-edit-category').value,
      status: document.getElementById('blog-edit-status').value,
      tags: document.getElementById('blog-edit-tags').value,
    };
    if (!data.title) { toast('Title is required', 'error'); return; }
    try {
      if (id) {
        await api(`/admin/blog/${id}`, { method: 'PUT', body: data });
        toast('Post updated!');
      } else {
        await api('/admin/blog', { method: 'POST', body: data });
        toast('Post created!');
      }
      closeBlogModal();
      renderAdminDashboard();
    } catch (err) {
      toast(err.message || 'Failed to save', 'error');
    }
  });

}

// ── Styles ───────────────────────────────────────────────────────
function injectStyles() {
  if (document.getElementById('app-styles')) return;
  const s = document.createElement('style');
  s.id = 'app-styles';
  s.textContent = `
    /* Nav */
    .nav { height: 70px; display: flex; align-items: center; background: rgba(10,14,26,0.85); backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 100; border-bottom: 1px solid var(--border); }
    .nav-inner { display: flex; justify-content: space-between; align-items: center; width: 100%; }
    .nav-brand { font-size: 1.3rem; font-weight: 800; display: flex; align-items: center; gap: 0.4rem; }
    .nav-links { display: flex; gap: 1.8rem; }
    .nav-links a { color: var(--text-muted); font-weight: 500; font-size: 0.9rem; transition: var(--transition); }
    .nav-links a:hover { color: var(--primary-light); }

    /* Hero + Inbox */
    .hero-inbox { padding: 3rem 0 4rem; }
    .hero-top { text-align: center; margin-bottom: 2.5rem; }
    .hero-top h1 { font-size: 3.5rem; font-weight: 800; margin-bottom: 1rem; }
    .gradient-text { background: linear-gradient(135deg, var(--accent), #fb923c, var(--primary-light)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .hero-sub { color: var(--text-muted); font-size: 1.15rem; max-width: 550px; margin: 0 auto; }

    /* Email Bar */
    .email-bar {
      background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg);
      padding: 1.5rem 2rem; margin-bottom: 1.5rem;
      display: flex; flex-wrap: wrap; align-items: center; gap: 1.5rem;
    }
    .email-address-box { flex: 1; min-width: 250px; }
    .email-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-dim); font-weight: 600; display: block; margin-bottom: 0.4rem; }
    .email-display { display: flex; align-items: center; gap: 0.5rem; }
    .mono { font-family: var(--mono); }
    #email-address { font-size: 1.2rem; color: var(--accent); font-weight: 600; word-break: break-all; }
    .email-actions { display: flex; gap: 0.5rem; }
    .email-meta { display: flex; gap: 1.5rem; width: 100%; border-top: 1px solid var(--border); padding-top: 0.8rem; margin-top: 0.5rem; }
    .meta-item { font-size: 0.8rem; color: var(--text-dim); display: flex; align-items: center; gap: 0.3rem; }
    #countdown { color: var(--primary-light); }

    /* Inbox Container */
    .inbox-container {
      background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg);
      overflow: hidden; min-height: 450px;
    }
    .inbox-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1rem 1.5rem; border-bottom: 1px solid var(--border); background: rgba(0,0,0,0.2);
    }
    .inbox-title { font-weight: 700; font-size: 1rem; display: flex; align-items: center; gap: 0.5rem; }
    .inbox-count { background: var(--primary); color: white; font-size: 0.7rem; padding: 2px 8px; border-radius: 20px; font-weight: 600; }
    .inbox-toolbar { display: flex; gap: 0.5rem; }
    .inbox-body { display: grid; grid-template-columns: 380px 1fr; min-height: 400px; }

    /* Email List */
    .email-list { border-right: 1px solid var(--border); overflow-y: auto; max-height: 450px; }
    .email-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1rem 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.02);
      cursor: pointer; transition: var(--transition); gap: 0.5rem;
    }
    .email-row:hover { background: rgba(124,58,237,0.04); }
    .email-row.unread { background: rgba(249,115,22,0.03); border-left: 3px solid var(--accent); }
    .email-row.selected { background: rgba(124,58,237,0.08); border-left: 3px solid var(--primary); }
    .email-row-left { display: flex; align-items: center; gap: 0.8rem; min-width: 0; flex: 1; }
    .sender-avatar { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; color: white; flex-shrink: 0; }
    .sender-avatar.sm { width: 28px; height: 28px; font-size: 0.75rem; border-radius: 6px; }
    .email-row-content { min-width: 0; }
    .email-sender { font-weight: 600; font-size: 0.85rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .email-subject { font-size: 0.8rem; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .email-time { font-size: 0.7rem; color: var(--text-dim); white-space: nowrap; flex-shrink: 0; }

    /* Empty State */
    .empty-state { padding: 4rem 2rem; text-align: center; color: var(--text-dim); }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.3; }
    .empty-state h3 { color: var(--text-muted); margin-bottom: 0.5rem; font-size: 1rem; }
    .empty-state p { font-size: 0.85rem; }
    .pulse-dot { width: 10px; height: 10px; background: var(--success); border-radius: 50%; margin: 1.5rem auto 0; animation: pulse 2s infinite; }

    /* Email Reader */
    .email-reader { overflow-y: auto; max-height: 450px; }
    .reader-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-dim); }
    .reader-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.15; }
    .reader-content { padding: 2rem; }
    .reader-header { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border); }
    .reader-subject { font-size: 1.2rem; font-weight: 700; margin-bottom: 0.8rem; }
    .reader-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .reader-sender { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; }
    .reader-time { font-size: 0.8rem; color: var(--text-dim); }
    .reader-to { font-size: 0.8rem; color: var(--text-dim); }
    .reader-body { line-height: 1.8; color: var(--text-muted); font-size: 0.9rem; }
    .reader-actions { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border); }

    /* Reader back button — hidden on desktop, shown on mobile via responsive CSS */
    .reader-back-btn {
      display: none !important; align-items: center; gap: 0.4rem;
      color: var(--primary-light); font-weight: 600;
      border-bottom: 1px solid var(--border); padding-bottom: 0.8rem;
      width: 100%;
    }

    /* Features */
    .features-section { background: rgba(0,0,0,0.3); }
    .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
    .feature-card {
      background: var(--bg-card); padding: 2rem; border-radius: var(--radius);
      border: 1px solid var(--border); transition: var(--transition);
    }
    .feature-card:hover { transform: translateY(-5px); border-color: var(--border-hover); box-shadow: 0 15px 40px rgba(0,0,0,0.3); }
    .f-icon { font-size: 2rem; margin-bottom: 1rem; }
    .feature-card h3 { margin-bottom: 0.5rem; font-size: 1.05rem; }
    .feature-card p { color: var(--text-muted); font-size: 0.9rem; line-height: 1.5; }
    @media(max-width:768px){ .features-grid { grid-template-columns: 1fr; } }

    /* Pricing */
    .pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; align-items: center; }
    .price-card {
      background: var(--bg-card); padding: 2.5rem 2rem; border-radius: var(--radius);
      border: 1px solid var(--border); text-align: center; transition: var(--transition); position: relative;
    }
    .price-card:hover { border-color: var(--border-hover); }
    .price-card.featured { border: 2px solid var(--primary); transform: scale(1.04); }
    .price-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--accent); color: white; padding: 4px 16px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; }
    .price-card h3 { margin-bottom: 0.5rem; }
    .price-amount { font-size: 2.5rem; font-weight: 800; margin-bottom: 1.5rem; }
    .price-amount span { font-size: 0.9rem; color: var(--text-muted); font-weight: 400; }
    .price-card ul { text-align: left; margin-bottom: 2rem; }
    .price-card li { padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.03); color: var(--text-muted); font-size: 0.9rem; }
    @media(max-width:768px){ .pricing-grid { grid-template-columns: 1fr; } .price-card.featured { transform: none; } }

    /* FAQ */
    .faq-section { background: rgba(0,0,0,0.15); }
    .faq-item { background: var(--bg-card); border-radius: var(--radius); margin-bottom: 0.8rem; border: 1px solid var(--border); overflow: hidden; }
    .faq-q { padding: 1.2rem 1.5rem; font-weight: 600; cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: var(--transition); user-select: none; }
    .faq-q:hover { background: rgba(124,58,237,0.04); }
    .faq-q span { color: var(--primary); font-size: 1.3rem; }
    .faq-a { color: var(--text-muted); line-height: 1.7; font-size: 0.9rem; }

    /* ── Blog Section ────────────────────────────────────── */
    .blog-section { padding: 5rem 0; background: rgba(0,0,0,0.15); }
    .blog-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .blog-grid-all { grid-template-columns: repeat(3, 1fr); }
    .blog-all-section { padding-top: 6rem; min-height: 100vh; }
    .blog-card {
      background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius-lg);
      overflow: hidden; transition: var(--transition); display: flex; flex-direction: column;
    }
    .blog-card:hover { transform: translateY(-6px); border-color: var(--border-hover); box-shadow: 0 20px 50px rgba(0,0,0,0.3); }
    .blog-cover {
      height: 160px; display: flex; align-items: center; justify-content: center;
      font-size: 4rem; background: linear-gradient(135deg, rgba(124,58,237,0.15), rgba(249,115,22,0.1));
      border-bottom: 1px solid var(--border);
    }
    .blog-card-body { padding: 1.5rem; flex: 1; display: flex; flex-direction: column; }
    .blog-card-meta { display: flex; align-items: center; gap: 0.8rem; margin-bottom: 0.8rem; }
    .blog-category {
      background: rgba(124,58,237,0.15); color: var(--primary-light); padding: 3px 10px;
      border-radius: 20px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
    }
    .blog-date { font-size: 0.75rem; color: var(--text-dim); }
    .blog-views { font-size: 0.75rem; color: var(--text-dim); }
    .blog-card-title { font-size: 1.05rem; font-weight: 700; margin-bottom: 0.6rem; line-height: 1.4; }
    .blog-card-excerpt { color: var(--text-muted); font-size: 0.85rem; line-height: 1.6; flex: 1; margin-bottom: 1rem; }
    .blog-card-footer { display: flex; justify-content: space-between; align-items: center; }
    .blog-author { font-size: 0.75rem; color: var(--text-dim); }
    .blog-view-all { text-align: center; margin-top: 1.5rem; }
    .blog-view-all-btn { padding: 0.8rem 2.5rem; font-size: 1rem; border-radius: 50px; }

    /* Blog Detail Page */
    .blog-detail { padding: 6rem 0 4rem; min-height: 100vh; }
    .blog-detail-cover {
      font-size: 5rem; text-align: center; padding: 2.5rem;
      background: linear-gradient(135deg, rgba(124,58,237,0.12), rgba(249,115,22,0.08));
      border-radius: var(--radius-lg); margin-bottom: 2rem;
    }
    .blog-detail-meta { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-bottom: 1rem; }
    .blog-detail-title { font-size: 2.2rem; font-weight: 800; line-height: 1.3; margin-bottom: 1rem; }
    .blog-detail-author { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: var(--text-muted); margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); }
    .blog-detail-body { line-height: 1.9; color: var(--text-muted); font-size: 1rem; }
    .blog-detail-body h2 { color: var(--text); font-size: 1.5rem; margin: 2rem 0 1rem; }
    .blog-detail-body h3 { color: var(--text); font-size: 1.2rem; margin: 1.5rem 0 0.8rem; }
    .blog-detail-body p { margin-bottom: 1rem; }
    .blog-detail-body ul, .blog-detail-body ol { padding-left: 1.5rem; margin-bottom: 1rem; }
    .blog-detail-body li { margin-bottom: 0.5rem; }
    .blog-detail-body strong { color: var(--text); }

    /* Blog Tags */
    .blog-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 2rem 0; padding-top: 1.5rem; border-top: 1px solid var(--border); }
    .blog-tag {
      background: rgba(124,58,237,0.1); color: var(--primary-light); padding: 4px 14px;
      border-radius: 20px; font-size: 0.78rem; font-weight: 500;
    }

    /* Social Sharing */
    .blog-share-section {
      margin-top: 2.5rem; padding: 2rem; background: var(--bg-card);
      border: 1px solid var(--border); border-radius: var(--radius-lg);
    }
    .blog-share-section h3 { font-size: 1rem; margin-bottom: 1rem; }
    .blog-share-buttons { display: flex; flex-wrap: wrap; gap: 0.6rem; }
    .share-btn {
      padding: 0.6rem 1.2rem; border-radius: 8px; font-size: 0.82rem; font-weight: 600;
      text-decoration: none; color: white; transition: var(--transition); display: inline-flex; align-items: center; gap: 0.4rem;
    }
    .share-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.3); }
    .share-twitter { background: #1DA1F2; }
    .share-facebook { background: #4267B2; }
    .share-linkedin { background: #0A66C2; }
    .share-whatsapp { background: #25D366; color: #000; }
    .share-email { background: rgba(124,58,237,0.8); }

    .blog-back-wrap { margin-top: 2.5rem; text-align: center; }

    @media(max-width:768px) {
      .blog-grid, .blog-grid-all { grid-template-columns: 1fr; }
      .blog-detail-title { font-size: 1.5rem; }
      .blog-detail-cover { font-size: 3rem; padding: 1.5rem; }
      .blog-share-buttons { flex-direction: column; }
      .share-btn { justify-content: center; }
    }
    @media(max-width:1024px) and (min-width:769px) {
      .blog-grid, .blog-grid-all { grid-template-columns: repeat(2, 1fr); }
    }

    /* Footer */
    .site-footer { background: #000; padding: 3rem 0 1.5rem; border-top: 1px solid var(--border); }
    .footer-inner { display: flex; justify-content: space-between; margin-bottom: 2rem; gap: 3rem; }
    .footer-brand p { color: var(--text-dim); font-size: 0.85rem; margin-top: 0.5rem; max-width: 250px; }
    .footer-cols { display: flex; gap: 4rem; }\r\n    .footer-cols div { display: flex; flex-direction: column; gap: 0.4rem; }
    .footer-cols h4 { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-dim); margin-bottom: 0.3rem; }
    .footer-cols a { color: var(--text-dim); font-size: 0.85rem; transition: var(--transition); }
    .footer-cols a:hover { color: var(--primary); }
    .footer-bottom { border-top: 1px solid rgba(255,255,255,0.05); padding-top: 1.5rem; color: var(--text-dim); font-size: 0.8rem; padding-bottom: 100px; }
    @media(max-width:600px){ .footer-inner { flex-direction: column; } }

    /* ═══════════════════════════════════════════════════════════════
       AD PLACEMENTS
       ═══════════════════════════════════════════════════════════════ */

    /* Base Ad Container */
    .ad-container {
      display: flex; justify-content: center; align-items: center;
      padding: 1rem 0; position: relative;
    }
    .ad-container::before {
      content: ''; position: absolute; top: 0; left: 50%; transform: translateX(-50%);
      width: 80%; height: 1px;
      background: linear-gradient(90deg, transparent, rgba(124,58,237,0.15), transparent);
    }

    /* Ad Slot Base */
    .ad-slot {
      position: relative; overflow: hidden; border-radius: 8px;
      border: 1px dashed rgba(124,58,237,0.2);
      background: linear-gradient(135deg, rgba(17,24,39,0.8), rgba(31,41,55,0.6));
      transition: all 0.3s ease;
    }
    .ad-slot:hover {
      border-color: rgba(124,58,237,0.4);
      box-shadow: 0 0 20px rgba(124,58,237,0.08);
    }

    /* Placeholder Content */
    .ad-placeholder {
      width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
    }
    .ad-placeholder-inner {
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.3rem;
      text-align: center;
    }
    .ad-placeholder-inner.horizontal {
      flex-direction: row; gap: 0.8rem;
    }
    .ad-placeholder-inner.vertical {
      gap: 0.6rem;
    }
    .ad-icon { font-size: 1.5rem; opacity: 0.4; }
    .ad-label {
      font-size: 0.6rem; text-transform: uppercase; letter-spacing: 1.5px;
      color: var(--text-dim); font-weight: 600;
    }
    .ad-dimensions {
      font-size: 0.65rem; color: rgba(124,58,237,0.5); font-family: var(--mono);
      font-weight: 500;
    }

    /* ── Specific Ad Sizes ─────────────────────────────── */

    /* 728x90 Leaderboard */
    .ad-728x90 { width: 728px; height: 90px; max-width: 100%; }
    .ad-728x90-sticky { width: 728px; height: 90px; max-width: calc(100vw - 80px); }

    /* 300x250 Medium Rectangle */
    .ad-300x250 { width: 300px; height: 250px; max-width: 100%; }

    /* 160x600 Skyscraper */
    .ad-160x600 { width: 160px; height: 600px; }

    /* ── Email Generator + Side Ads Wrapper ─────────────── */
    .email-generator-wrapper {
      display: flex; align-items: stretch; gap: 1rem;
      justify-content: center; width: 100%;
    }
    .email-generator-wrapper .email-bar {
      flex: 1; min-width: 0;
    }
    .ad-generator-side {
      flex-shrink: 0; display: flex; align-items: center;
    }
    .ad-hero-below-wrap { padding: 0.5rem 0; }
    .ad-generator-below-wrap { padding: 0.5rem 0; }

    /* Custom Ad Code Container */
    .ad-custom-code { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; }


    /* ── Leaderboard Top ───────────────────────────────── */
    .ad-leaderboard-top {
      background: rgba(0,0,0,0.3); padding: 0.8rem 0;
      border-bottom: 1px solid rgba(124,58,237,0.08);
    }
    .ad-leaderboard-top::before { display: none; }

    /* ── Between-sections ads ──────────────────────────── */
    .ad-between-sections {
      padding: 1.2rem 0;
    }

    .ad-leaderboard-mid {
      background: rgba(0,0,0,0.15);
      padding: 1.5rem 0;
    }

    /* ── Pre-footer ────────────────────────────────────── */
    .ad-pre-footer {
      padding: 1.5rem 0;
      background: rgba(0,0,0,0.1);
    }

    /* ── Inbox + Sidebar Ad Wrapper ────────────────────── */
    .inbox-ad-wrapper {
      display: flex; gap: 1.5rem; align-items: flex-start;
    }
    .inbox-ad-wrapper .inbox-container {
      flex: 1; min-width: 0;
    }
    .ad-sidebar-left, .ad-sidebar-right {
      flex-shrink: 0; position: sticky; top: 90px;
    }

    /* ── Sticky Bottom Ad ──────────────────────────────── */
    .ad-sticky-bottom {
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 9990;
      display: flex; justify-content: center; align-items: center;
      background: linear-gradient(180deg, rgba(10,14,26,0.0) 0%, rgba(10,14,26,0.95) 30%, rgba(10,14,26,0.98) 100%);
      padding: 0.8rem 1rem 1rem;
      transform: translateY(100%);
      transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .ad-sticky-bottom.visible {
      transform: translateY(0);
    }
    .ad-sticky-inner {
      position: relative;
      display: flex; align-items: center; gap: 0.5rem;
    }
    .ad-close-btn {
      position: absolute; top: -12px; right: -12px;
      width: 28px; height: 28px; border-radius: 50%;
      background: rgba(30,30,50,0.95); border: 1px solid rgba(124,58,237,0.3);
      color: var(--text-muted); font-size: 0.75rem; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: var(--transition); z-index: 1;
    }
    .ad-close-btn:hover {
      background: var(--danger); color: white; border-color: var(--danger);
      transform: scale(1.1);
    }

    /* ── Side Rail Skyscraper ──────────────────────────── */
    .ad-side-rail {
      position: fixed; right: 10px; top: 50%; transform: translateY(-50%) translateX(200px);
      z-index: 50; transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .ad-side-rail.visible {
      transform: translateY(-50%) translateX(0);
    }
    .ad-side-rail .ad-160x600 {
      border-radius: 10px;
      box-shadow: -5px 0 30px rgba(0,0,0,0.3);
    }

    /* Right rail */
    .ad-side-rail-right { right: 10px; }
    .ad-side-rail-right { transform: translateY(-50%) translateX(200px); }
    .ad-side-rail-right.visible { transform: translateY(-50%) translateX(0); }

    /* Left rail */
    .ad-side-rail-left { left: 10px; right: auto; }
    .ad-side-rail-left { transform: translateY(-50%) translateX(-200px); }
    .ad-side-rail-left.visible { transform: translateY(-50%) translateX(0); }
    .ad-side-rail-left .ad-160x600 {
      box-shadow: 5px 0 30px rgba(0,0,0,0.3);
    }

    /* ── Responsive Ad Handling ─────────────────────────── */
    @media (max-width: 1500px) {
      .ad-side-rail { display: none; }
    }
    @media (max-width: 1100px) {
      .ad-sidebar-left, .ad-sidebar-right { display: none; }
      .inbox-ad-wrapper { flex-direction: column; }
      .ad-generator-side { display: none; }
    }
    @media (max-width: 768px) {
      .ad-728x90 { width: 100%; height: 60px; }
      .ad-728x90-sticky { width: 100%; height: 50px; }
      .ad-300x250 { width: 100%; max-width: 300px; height: auto; min-height: 200px; }
      .ad-side-rail { display: none; }
      .ad-sidebar-left, .ad-sidebar-right { display: none; }
      .ad-leaderboard-top { padding: 0.5rem 0.5rem; }
      .ad-generator-side { display: none; }
      .email-generator-wrapper { flex-direction: column; }
    }
    @media (max-width: 480px) {
      .ad-between-sections .ad-300x250 { height: 200px; }
      .ad-sticky-bottom { padding: 0.5rem; }
    }

    /* ═══════════════════════════════════════════════════════
       QR CODE & EDIT EMAIL MODALS
       ═══════════════════════════════════════════════════════ */
    .qr-modal-overlay {
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      padding: 1rem;
    }
    .qr-modal {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 16px; width: 100%; max-width: 420px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.6);
      animation: modalIn 0.3s ease;
    }
    .qr-modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.2rem 1.5rem; border-bottom: 1px solid var(--border);
    }
    .qr-modal-header h3 { margin: 0; font-size: 1.1rem; }
    .qr-modal-body { padding: 1.5rem; }
    .qr-modal-footer {
      display: flex; justify-content: center; gap: 0.8rem;
      padding: 1.2rem 1.5rem; border-top: 1px solid var(--border);
    }
    .qr-code-wrapper {
      display: flex; justify-content: center; align-items: center;
      padding: 1rem; background: rgba(255,255,255,0.03);
      border-radius: 12px; border: 1px solid var(--border);
    }
    .edit-email-input-wrap {
      display: flex; align-items: center; gap: 0;
      background: rgba(0,0,0,0.3); border: 1px solid var(--border);
      border-radius: 8px; overflow: hidden;
    }
    .edit-email-input-wrap .ad-input {
      border: none; border-radius: 0; background: transparent;
    }
    .edit-email-input-wrap .ad-input:focus { box-shadow: none; }
    .edit-email-domain {
      padding: 0.7rem 1rem; color: var(--text-dim); font-family: var(--mono);
      font-size: 0.9rem; white-space: nowrap; background: rgba(0,0,0,0.2);
      border-left: 1px solid var(--border); font-weight: 500;
    }

    /* ═══════════════════════════════════════════════════════
       COMPREHENSIVE MOBILE & TABLET RESPONSIVE
       ═══════════════════════════════════════════════════════ */

    /* ── Tablet (768px - 1100px) ────────────────────────── */
    @media (max-width: 1100px) {
      .inbox-ad-wrapper { flex-direction: column; }
      .ad-sidebar-left, .ad-sidebar-right { display: none; }
      .features-grid { grid-template-columns: repeat(2, 1fr); }
      .pricing-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
      .stat-grid { grid-template-columns: repeat(2, 1fr); }
    }

    /* ── Mobile (768px and below) ───────────────────────── */
    @media (max-width: 768px) {
      .nav { height: 56px; }
      .nav-links { display: none; }
      .nav-brand { font-size: 1.1rem; }
      .container { padding: 0 1rem; }

      /* Hero */
      .hero-inbox { padding: 1.5rem 0 2rem; }
      .hero-top { margin-bottom: 1.5rem; }
      .hero-top h1 { font-size: 1.8rem; }
      .hero-sub { font-size: 0.95rem; padding: 0 0.5rem; }

      /* Section titles */
      h2 { font-size: 1.6rem; }
      section { padding: 3rem 0; }
      .section-subtitle { font-size: 0.9rem; margin-bottom: 2rem; }

      /* Email Bar */
      .email-bar {
        padding: 1rem; gap: 0.8rem;
        flex-direction: column;
      }
      .email-address-box { min-width: 0; width: 100%; }
      #email-address { font-size: 0.95rem; }
      .email-actions {
        flex-wrap: wrap; width: 100%; justify-content: center;
        gap: 0.4rem;
      }
      .email-actions .btn { font-size: 0.78rem; padding: 0.5rem 0.8rem; flex: 1; min-width: 60px; }
      .email-meta { gap: 0.8rem; flex-wrap: wrap; justify-content: center; }
      .meta-item { font-size: 0.72rem; }

      /* Inbox - Stacked layout on mobile */
      .inbox-container { min-height: auto; }
      .inbox-body {
        grid-template-columns: 1fr !important;
        min-height: auto;
        display: flex !important; flex-direction: column;
      }
      .email-list { border-right: none; max-height: 300px; }
      .email-reader {
        display: none; border-top: 2px solid var(--primary);
        max-height: none; min-height: 200px;
      }
      .email-reader.mobile-active {
        display: block !important;
        animation: fadeInUp 0.3s ease;
      }
      .reader-back-btn { display: flex !important; }
      .inbox-header { padding: 0.8rem 1rem; flex-wrap: wrap; gap: 0.5rem; }
      .inbox-toolbar { width: 100%; justify-content: flex-end; }
      .inbox-toolbar .btn { font-size: 0.72rem; padding: 0.4rem 0.6rem; }
      .inbox-title { font-size: 0.9rem; }
      .email-row { padding: 0.8rem; }
      .sender-avatar { width: 30px; height: 30px; font-size: 0.75rem; }
      .email-sender { font-size: 0.8rem; }
      .email-subject { font-size: 0.75rem; }
      .empty-state { padding: 2rem 1rem; }
      .empty-icon { font-size: 2rem; }

      /* Features */
      .features-grid { grid-template-columns: 1fr; gap: 1rem; }
      .feature-card { padding: 1.5rem; }

      /* Pricing */
      .pricing-grid { grid-template-columns: 1fr; gap: 1rem; }
      .price-card { padding: 1.5rem; }
      .price-amount { font-size: 2rem; }

      /* FAQ */
      .faq-section .container { padding: 0 0.8rem; }

      /* Footer */
      .footer-inner { flex-direction: column; gap: 1.5rem; text-align: center; }
      .footer-cols { flex-direction: row; gap: 2rem; justify-content: center; }
      .footer-bottom { font-size: 0.75rem; }

      /* Ad containers on mobile */
      .ad-container { display: flex; justify-content: center; overflow: hidden; }
      .ad-generator-side { display: none; }
      .email-generator-wrapper { flex-direction: column; }
      .ad-side-rail { display: none !important; }
      .ad-sidebar-left, .ad-sidebar-right { display: none; }

      /* Modals */
      .qr-modal, .ad-modal { max-width: 95vw; }
    }

    /* ── Small Mobile (480px and below) ─────────────────── */
    @media (max-width: 480px) {
      .hero-top h1 { font-size: 1.5rem; }
      .hero-sub { font-size: 0.85rem; }
      #email-address { font-size: 0.82rem; }
      .email-actions .btn { font-size: 0.7rem; padding: 0.45rem 0.6rem; }
      .nav-brand { font-size: 0.95rem; }
      .nav { height: 50px; }
      .inbox-container { min-height: 250px; }
      .email-list { max-height: 280px; }
      .ad-sticky-bottom { padding: 0.5rem; }
      .ad-between-sections .ad-300x250 { height: 200px; }
      h2 { font-size: 1.3rem; }
      .feature-card h3 { font-size: 0.95rem; }
      .feature-card p { font-size: 0.82rem; }
      .qr-modal { max-width: 98vw; }
      .edit-email-input-wrap { flex-direction: column; }
      .edit-email-domain { border-left: none; border-top: 1px solid var(--border); text-align: center; }
      .reader-content { padding: 1rem; }
      .reader-subject { font-size: 1rem; }
      .reader-meta { flex-direction: column; gap: 0.3rem; }
      .reader-body { font-size: 0.82rem; }
    }
  `;
  document.head.appendChild(s);
}

function injectAdminStyles() {
  if (document.getElementById('admin-styles')) return;
  const s = document.createElement('style');
  s.id = 'admin-styles';
  s.textContent = `
    .admin-layout { display: grid; grid-template-columns: 250px 1fr; height: 100vh; }
    .admin-sidebar { background: #000; border-right: 1px solid var(--border); padding: 2rem; display: flex; flex-direction: column; }
    .admin-menu { display: flex; flex-direction: column; gap: 0.3rem; margin-top: 2rem; flex: 1; }
    .admin-menu-item { padding: 0.8rem 1rem; border-radius: 8px; cursor: pointer; color: var(--text-muted); transition: var(--transition); font-size: 0.9rem; }
    .admin-menu-item:hover { background: rgba(124,58,237,0.08); color: white; }
    .admin-menu-item.active { color: var(--primary); font-weight: 600; background: rgba(124,58,237,0.08); }
    .admin-menu-item.back { margin-top: auto; color: var(--text-dim); }
    .admin-content { overflow-y: auto; padding: 2rem 3rem; }
    .admin-panel.hidden { display: none; }
    .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .stat-box { background: var(--bg-card); padding: 1.5rem; border-radius: var(--radius); border: 1px solid var(--border); display: flex; align-items: center; gap: 1rem; transition: var(--transition); }
    .stat-box:hover { border-color: var(--border-hover); }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0; }
    .stat-num { font-size: 1.6rem; font-weight: 700; }
    .stat-lbl { font-size: 0.8rem; color: var(--text-muted); }
    .admin-table { background: var(--bg-card); border-radius: var(--radius); border: 1px solid var(--border); overflow: hidden; margin-top: 1rem; }
    .t-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); padding: 0.8rem 1.2rem; border-bottom: 1px solid rgba(255,255,255,0.02); font-size: 0.82rem; align-items: center; }
    .t-head { background: rgba(0,0,0,0.3); font-weight: 600; color: var(--text-dim); text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.5px; }
    .domain-list { display: flex; flex-direction: column; gap: 0.8rem; margin-top: 1rem; }
    .domain-item { background: var(--bg-card); padding: 1.2rem; border-radius: var(--radius); border: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
    .domain-name-d { font-weight: 700; color: var(--primary); }
    .d-badge { font-size: 0.7rem; padding: 3px 10px; border-radius: 20px; font-weight: 600; }
    .d-badge.active { background: rgba(34,197,94,0.1); color: var(--success); }
    .d-badge.pending { background: rgba(234,179,8,0.1); color: var(--warning); }

    /* ═══════════════════════════════════════════════════════════════
       ADS MANAGER ADMIN STYLES
       ═══════════════════════════════════════════════════════════════ */

    /* Grid of Ad Cards */
    .ads-manager-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 1rem; margin-top: 1.5rem;
    }

    /* Individual Ad Card */
    .ad-manager-card {
      background: var(--bg-card); border-radius: var(--radius);
      border: 1px solid var(--border); padding: 1.2rem;
      transition: all 0.3s ease; position: relative; overflow: hidden;
    }
    .ad-manager-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
      background: linear-gradient(90deg, var(--primary), var(--accent));
      opacity: 1; transition: opacity 0.3s;
    }
    .ad-manager-card.disabled { opacity: 0.6; }
    .ad-manager-card.disabled::before { opacity: 0.2; }
    .ad-manager-card:hover { border-color: var(--border-hover); transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.3); }

    /* Card Header */
    .ad-mgr-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.8rem; }
    .ad-mgr-info { flex: 1; }
    .ad-mgr-name { font-weight: 700; font-size: 0.95rem; color: white; margin-bottom: 0.3rem; }
    .ad-mgr-meta { display: flex; gap: 0.8rem; flex-wrap: wrap; }
    .ad-mgr-size {
      font-size: 0.7rem; font-family: var(--mono); color: var(--primary);
      background: rgba(124,58,237,0.1); padding: 2px 8px; border-radius: 4px; font-weight: 600;
    }
    .ad-mgr-pos { font-size: 0.7rem; color: var(--text-dim); }

    /* Toggle Switch */
    .ad-toggle { position: relative; display: inline-block; width: 48px; height: 26px; flex-shrink: 0; }
    .ad-toggle input { opacity: 0; width: 0; height: 0; }
    .ad-toggle-slider {
      position: absolute; cursor: pointer; inset: 0; border-radius: 26px;
      background: rgba(255,255,255,0.1); transition: 0.3s; border: 1px solid rgba(255,255,255,0.1);
    }
    .ad-toggle-slider::before {
      content: ''; position: absolute; height: 20px; width: 20px; left: 2px; bottom: 2px;
      background: white; border-radius: 50%; transition: 0.3s;
    }
    .ad-toggle input:checked + .ad-toggle-slider { background: var(--primary); border-color: var(--primary); }
    .ad-toggle input:checked + .ad-toggle-slider::before { transform: translateX(22px); }

    /* Status Row */
    .ad-mgr-status {
      display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.8rem;
      font-size: 0.78rem; color: var(--text-muted);
    }
    .ad-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .ad-status-dot.active { background: var(--success); box-shadow: 0 0 8px rgba(34,197,94,0.5); }
    .ad-status-dot.inactive { background: var(--danger); box-shadow: 0 0 8px rgba(239,68,68,0.3); }
    .ad-has-code { color: var(--primary); font-size: 0.7rem; margin-left: auto; }
    .ad-no-code { color: var(--text-dim); font-size: 0.7rem; margin-left: auto; }

    /* Actions */
    .ad-mgr-actions { display: flex; gap: 0.5rem; }
    .ad-mgr-actions .btn { font-size: 0.75rem; padding: 0.35rem 0.8rem; }

    /* Notes */
    .ad-mgr-notes {
      font-size: 0.72rem; color: var(--text-dim); margin-top: 0.6rem;
      padding: 0.5rem 0.7rem; background: rgba(0,0,0,0.2); border-radius: 6px;
      border-left: 2px solid var(--primary);
    }

    /* ── Ad Edit Modal ─────────────────────────────────── */
    .ad-modal-overlay {
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(0,0,0,0.7); backdrop-filter: blur(8px);
      display: flex; align-items: center; justify-content: center;
      padding: 2rem;
    }
    .ad-modal {
      background: var(--bg-card); border: 1px solid var(--border);
      border-radius: 16px; width: 100%; max-width: 640px;
      box-shadow: 0 25px 60px rgba(0,0,0,0.6);
      animation: modalIn 0.3s ease;
    }
    @keyframes modalIn {
      from { opacity: 0; transform: translateY(20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .ad-modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.2rem 1.5rem; border-bottom: 1px solid var(--border);
    }
    .ad-modal-header h3 { margin: 0; font-size: 1.1rem; }
    .ad-modal-close {
      width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border);
      background: transparent; color: var(--text-muted); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: var(--transition); font-size: 1rem;
    }
    .ad-modal-close:hover { background: var(--danger); color: white; border-color: var(--danger); }
    .ad-modal-body { padding: 1.5rem; }
    .ad-form-group { margin-bottom: 1.2rem; }
    .ad-form-group label { display: block; font-size: 0.82rem; font-weight: 600; margin-bottom: 0.4rem; color: var(--text-muted); }
    .ad-input {
      width: 100%; padding: 0.7rem 0.9rem; border-radius: 8px;
      border: 1px solid var(--border); background: rgba(0,0,0,0.3);
      color: white; font-size: 0.85rem; transition: var(--transition);
      box-sizing: border-box;
    }
    .ad-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(124,58,237,0.15); }
    .ad-textarea {
      width: 100%; padding: 0.7rem 0.9rem; border-radius: 8px;
      border: 1px solid var(--border); background: rgba(0,0,0,0.3);
      color: white; font-size: 0.8rem; resize: vertical; min-height: 120px;
      transition: var(--transition); line-height: 1.5; box-sizing: border-box;
    }
    .ad-textarea:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(124,58,237,0.15); }
    .ad-modal-footer {
      display: flex; justify-content: flex-end; gap: 0.8rem;
      padding: 1.2rem 1.5rem; border-top: 1px solid var(--border);
    }

    @media (max-width: 600px) {
      .ads-manager-grid { grid-template-columns: 1fr; }
      .ad-modal { margin: 1rem; max-height: 90vh; overflow-y: auto; }
    }
  `;
  document.head.appendChild(s);
}

// ── Init ────────────────────────────────────────────────────────
renderPage();
