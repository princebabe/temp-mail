import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// ── Database ────────────────────────────────────────────────────
const db = new Database(join(__dirname, 'trashmails.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS mailboxes (
    id TEXT PRIMARY KEY,
    address TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    expires_at TEXT
  );

  CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mailbox_id TEXT NOT NULL,
    to_address TEXT,
    sender TEXT,
    subject TEXT,
    body TEXT,
    is_read INTEGER DEFAULT 0,
    received_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (mailbox_id) REFERENCES mailboxes(id)
  );

  CREATE TABLE IF NOT EXISTS domains (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    verified INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS ad_slots (
    slot_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    size TEXT NOT NULL,
    position TEXT NOT NULL,
    enabled INTEGER DEFAULT 1,
    ad_code TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT DEFAULT '',
    body TEXT DEFAULT '',
    cover_image TEXT DEFAULT '',
    author TEXT DEFAULT 'Admin',
    category TEXT DEFAULT 'General',
    tags TEXT DEFAULT '',
    status TEXT DEFAULT 'published',
    views INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

// Seed admin
const adminExists = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin');
if (!adminExists) {
  db.prepare('INSERT INTO admin_users (username, password) VALUES (?, ?)').run('admin', 'admin123');
}

// Seed default ad slots
const defaultAds = [
  { slot_id: 'ad-top-leaderboard', name: 'Top Leaderboard', size: '728x90', position: 'Below Navbar' },
  { slot_id: 'ad-hero-below', name: 'Below Hero Text', size: '728x90', position: 'After Hero Subtitle' },
  { slot_id: 'ad-generator-left', name: 'Generator Left', size: '300x250', position: 'Left of Email Bar' },
  { slot_id: 'ad-generator-right', name: 'Generator Right', size: '300x250', position: 'Right of Email Bar' },
  { slot_id: 'ad-generator-below', name: 'Below Generator', size: '728x90', position: 'After Email Bar' },
  { slot_id: 'ad-mid-leaderboard', name: 'Mid-Page Leaderboard', size: '728x90', position: 'Before Features' },
  { slot_id: 'ad-features-pricing', name: 'Features-Pricing', size: '728x90', position: 'Between Features & Pricing' },
  { slot_id: 'ad-pricing-faq', name: 'Pricing-FAQ', size: '300x250', position: 'Between Pricing & FAQ' },
  { slot_id: 'ad-pre-footer', name: 'Pre-Footer', size: '728x90', position: 'Before Footer' },
  { slot_id: 'ad-bottom-sticky', name: 'Sticky Bottom', size: '728x90', position: 'Fixed Bottom Bar' },
  { slot_id: 'ad-skyscraper-right', name: 'Right Skyscraper', size: '160x600', position: 'Right Side Rail' },
  { slot_id: 'ad-skyscraper-left', name: 'Left Skyscraper', size: '160x600', position: 'Left Side Rail' },
];
const insertAd = db.prepare('INSERT OR IGNORE INTO ad_slots (slot_id, name, size, position) VALUES (?, ?, ?, ?)');
for (const ad of defaultAds) {
  insertAd.run(ad.slot_id, ad.name, ad.size, ad.position);
}

// ── Generate Email Address ──────────────────────────────────────
function generateAddress() {
  const adj = ['swift', 'cool', 'dark', 'fast', 'red', 'blue', 'wild', 'zen', 'neo', 'cyber', 'pixel', 'alpha', 'turbo', 'hyper', 'mega'];
  const nouns = ['fox', 'wolf', 'hawk', 'bear', 'lion', 'star', 'byte', 'node', 'code', 'mail', 'box', 'dev', 'ace', 'io', 'net'];
  const a = adj[Math.floor(Math.random() * adj.length)];
  const n = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9999);
  return `${a}.${n}${num}@trashmails.io`;
}

// ── Mailbox Routes ──────────────────────────────────────────────

// Create a new temp mailbox (no auth needed)
app.post('/api/mailbox/create', (req, res) => {
  const id = randomUUID();
  const address = generateAddress();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
  db.prepare('INSERT INTO mailboxes (id, address, expires_at) VALUES (?, ?, ?)').run(id, address, expiresAt);
  res.json({ id, address, expires_at: expiresAt });
});

// Change / refresh email address for existing session
app.post('/api/mailbox/refresh', (req, res) => {
  const id = randomUUID();
  const address = generateAddress();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO mailboxes (id, address, expires_at) VALUES (?, ?, ?)').run(id, address, expiresAt);
  res.json({ id, address, expires_at: expiresAt });
});

// Set custom email username
app.post('/api/mailbox/custom', (req, res) => {
  const { username } = req.body;
  if (!username || username.length < 3 || username.length > 30) {
    return res.status(400).json({ error: 'Username must be 3-30 characters' });
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    return res.status(400).json({ error: 'Only letters, numbers, dots, hyphens, underscores allowed' });
  }
  const address = `${username}@trashmails.io`;
  const existing = db.prepare('SELECT id FROM mailboxes WHERE address = ?').get(address);
  if (existing) {
    return res.status(409).json({ error: 'This email is already taken' });
  }
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO mailboxes (id, address, expires_at) VALUES (?, ?, ?)').run(id, address, expiresAt);
  res.json({ id, address, expires_at: expiresAt });
});

// Get mailbox info
app.get('/api/mailbox/:id', (req, res) => {
  const mb = db.prepare('SELECT * FROM mailboxes WHERE id = ?').get(req.params.id);
  if (!mb) return res.status(404).json({ error: 'Mailbox not found' });
  res.json(mb);
});

// ── Email Routes ────────────────────────────────────────────────

// Get all emails for a mailbox
app.get('/api/emails/:mailboxId', (req, res) => {
  const emails = db.prepare('SELECT * FROM emails WHERE mailbox_id = ? ORDER BY received_at DESC').all(req.params.mailboxId);
  res.json(emails);
});

// Get single email
app.get('/api/email/:id', (req, res) => {
  const email = db.prepare('SELECT * FROM emails WHERE id = ?').get(req.params.id);
  if (!email) return res.status(404).json({ error: 'Email not found' });
  // Mark as read
  db.prepare('UPDATE emails SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ ...email, is_read: 1 });
});

// Delete single email
app.delete('/api/email/:id', (req, res) => {
  db.prepare('DELETE FROM emails WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Delete all emails for mailbox
app.delete('/api/emails/:mailboxId', (req, res) => {
  db.prepare('DELETE FROM emails WHERE mailbox_id = ?').run(req.params.mailboxId);
  res.json({ ok: true });
});

// ── Simulate Incoming Email (for demo) ──────────────────────────
app.post('/api/simulate', (req, res) => {
  const { mailboxId } = req.body;
  if (!mailboxId) return res.status(400).json({ error: 'mailboxId required' });

  const mb = db.prepare('SELECT address FROM mailboxes WHERE id = ?').get(mailboxId);
  if (!mb) return res.status(404).json({ error: 'Mailbox not found' });

  const templates = [
    { sender: 'Amazon', subject: 'Your order #4829 has been shipped! 📦', body: `Hello,\n\nGreat news! Your order #4829 has been shipped and is on its way.\n\nTracking Number: 1Z999AA10123456784\nEstimated Delivery: March 5, 2026\n\nYou can track your package at any time by visiting our tracking page.\n\nThank you for shopping with us!!\n\nBest regards,\nAmazon Customer Service` },
    { sender: 'GitHub', subject: 'New sign-in to your account', body: `Hi there,\n\nWe noticed a new sign-in to your GitHub account.\n\nDevice: Chrome on Windows\nLocation: Karachi, Pakistan\nTime: ${new Date().toLocaleString()}\n\nIf this was you, you can safely ignore this email.\nIf you didn't sign in, please secure your account immediately.\n\nGitHub Security Team` },
    { sender: 'Netflix', subject: 'Start your free trial today! 🎬', body: `Welcome to Netflix!\n\nYour 30-day free trial is ready to go. Start watching thousands of movies and TV shows right now.\n\nWhat's included:\n• Unlimited streaming\n• HD & Ultra HD quality\n• Watch on any device\n• Cancel anytime\n\nClick here to start watching now.\n\nEnjoy!\nThe Netflix Team` },
    { sender: 'Spotify', subject: 'Your Discover Weekly is ready 🎵', body: `Hey there!\n\nYour personalized Discover Weekly playlist has been updated with 30 fresh tracks based on your listening habits.\n\nThis week's highlights:\n1. "Midnight Rain" - New Artist\n2. "Electric Dreams" - Synthwave Mix\n3. "Coffee Morning" - Lo-fi Beats\n\nListen now and discover your new favorite songs!\n\nHappy listening,\nSpotify` },
    { sender: 'LinkedIn', subject: 'You have 5 new profile views', body: `Hi there,\n\nPeople are looking at your profile!\n\nYou've had 5 new profile views this week:\n• Software Engineer at Google\n• Product Manager at Meta\n• CTO at StartupXYZ\n• Recruiter at Microsoft\n• Developer at Apple\n\nUpdate your profile to make a great impression.\n\nLinkedIn Team` },
    { sender: 'Twitter/X', subject: 'Trending topics you might like', body: `Here's what's trending right now:\n\n🔥 #TechNews - 125K posts\n🔥 #AI - 89K posts\n🔥 #WebDev - 45K posts\n🔥 #JavaScript - 32K posts\n\nJoin the conversation and share your thoughts!\n\nBest,\nThe X Team` },
    { sender: 'Stripe', subject: 'Payment received - $49.99', body: `Payment Confirmation\n\nYou've received a payment!\n\nAmount: $49.99 USD\nFrom: customer@example.com\nDescription: Pro Plan Subscription\nDate: ${new Date().toLocaleDateString()}\n\nThe funds will be available in your account within 2 business days.\n\nStripe Payments` },
    { sender: 'Vercel', subject: 'Deployment successful ✅', body: `Your deployment is live!\n\nProject: trash-mails-app\nBranch: main\nStatus: ✅ Ready\nURL: https://trash-mails.vercel.app\n\nBuild time: 12s\nFunctions: 3 serverless\nEdge: 2 edge functions\n\nView your deployment dashboard for more details.\n\nVercel Team` },
  ];

  const pick = templates[Math.floor(Math.random() * templates.length)];
  const result = db.prepare('INSERT INTO emails (mailbox_id, to_address, sender, subject, body) VALUES (?, ?, ?, ?, ?)')
    .run(mailboxId, mb.address, pick.sender, pick.subject, pick.body);

  res.json({ id: result.lastInsertRowid, sender: pick.sender, subject: pick.subject, to_address: mb.address });
});

// ── Admin Routes ────────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const admin = db.prepare('SELECT id, username FROM admin_users WHERE username = ? AND password = ?').get(username, password);
  if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ admin });
});

app.get('/api/admin/stats', (req, res) => {
  const totalMailboxes = db.prepare('SELECT COUNT(*) as c FROM mailboxes').get().c;
  const totalEmails = db.prepare('SELECT COUNT(*) as c FROM emails').get().c;
  const totalDomains = db.prepare('SELECT COUNT(*) as c FROM domains').get().c + 1;
  const activeToday = db.prepare("SELECT COUNT(*) as c FROM mailboxes WHERE created_at >= date('now')").get().c;
  res.json({ totalMailboxes, totalEmails, totalDomains, activeToday });
});

app.get('/api/admin/mailboxes', (req, res) => {
  const mbs = db.prepare('SELECT m.*, (SELECT COUNT(*) FROM emails WHERE mailbox_id = m.id) as email_count FROM mailboxes m ORDER BY created_at DESC LIMIT 50').all();
  res.json(mbs);
});

app.get('/api/admin/emails', (req, res) => {
  const emails = db.prepare('SELECT * FROM emails ORDER BY received_at DESC LIMIT 100').all();
  res.json(emails);
});

app.delete('/api/admin/mailbox/:id', (req, res) => {
  db.prepare('DELETE FROM emails WHERE mailbox_id = ?').run(req.params.id);
  db.prepare('DELETE FROM mailboxes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

app.get('/api/admin/domains', (req, res) => {
  res.json(db.prepare('SELECT * FROM domains ORDER BY created_at DESC').all());
});

app.post('/api/admin/domains', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Domain name required' });
  try {
    const r = db.prepare('INSERT INTO domains (name) VALUES (?)').run(name);
    res.json({ id: r.lastInsertRowid, name, verified: false });
  } catch (e) {
    res.status(409).json({ error: 'Domain already exists' });
  }
});

// ── Ad Management Routes ────────────────────────────────────────

// Public: Get enabled ads (for frontend)
app.get('/api/ads', (req, res) => {
  res.json(db.prepare('SELECT slot_id, name, size, position, enabled, ad_code FROM ad_slots').all());
});

// Admin: Get all ads
app.get('/api/admin/ads', (req, res) => {
  res.json(db.prepare('SELECT * FROM ad_slots ORDER BY slot_id').all());
});

// Admin: Update an ad slot
app.put('/api/admin/ads/:slotId', (req, res) => {
  const { enabled, ad_code, notes } = req.body;
  const slot = db.prepare('SELECT * FROM ad_slots WHERE slot_id = ?').get(req.params.slotId);
  if (!slot) return res.status(404).json({ error: 'Ad slot not found' });

  db.prepare('UPDATE ad_slots SET enabled = ?, ad_code = ?, notes = ?, updated_at = datetime(\'now\') WHERE slot_id = ?')
    .run(enabled !== undefined ? (enabled ? 1 : 0) : slot.enabled, ad_code !== undefined ? ad_code : slot.ad_code, notes !== undefined ? notes : slot.notes, req.params.slotId);

  res.json(db.prepare('SELECT * FROM ad_slots WHERE slot_id = ?').get(req.params.slotId));
});

// Admin: Bulk toggle all ads
app.put('/api/admin/ads-bulk', (req, res) => {
  const { enabled } = req.body;
  db.prepare('UPDATE ad_slots SET enabled = ?, updated_at = datetime(\'now\')').run(enabled ? 1 : 0);
  res.json({ ok: true, enabled });
});

// ── Blog Seed ───────────────────────────────────────────────────
const blogCount = db.prepare('SELECT COUNT(*) as c FROM blog_posts').get().c;
if (blogCount === 0) {
  const seedPosts = [
    {
      title: 'Why Disposable Emails Are Essential for Online Privacy',
      slug: 'disposable-emails-online-privacy',
      excerpt: 'In an era of data breaches and spam, disposable emails have become a crucial tool for protecting your digital identity.',
      body: `<h2>The Growing Threat to Email Privacy</h2>
<p>Every time you sign up for a new service, newsletter, or free trial, you hand over your email address — and with it, a key piece of your digital identity. Data breaches exposed over 22 billion records in 2023 alone, and your email is often the first thing hackers target.</p>

<h2>What Are Disposable Emails?</h2>
<p>Disposable (or temporary) email addresses are short-lived inboxes that you can use once and forget. They receive emails just like regular mailboxes, but they self-destruct after a set period — typically 1 hour with Trash Mails.</p>

<h2>Top Use Cases</h2>
<ul>
<li><strong>Free trials</strong> — Sign up without committing your real email</li>
<li><strong>One-time verifications</strong> — Confirm accounts on forums or downloads</li>
<li><strong>Newsletter testing</strong> — Preview email campaigns before sending</li>
<li><strong>Avoiding spam</strong> — Keep your primary inbox clean</li>
</ul>

<h2>How Trash Mails Protects You</h2>
<p>Trash Mails generates instant disposable addresses with zero signup required. All emails are encrypted in transit and permanently deleted after expiry. No personal data is ever stored or shared.</p>

<p>Start protecting your privacy today — visit <strong>trashmails.io</strong> and get your temporary email in seconds.</p>`,
      cover_image: '🛡️',
      author: 'Trash Mails Team',
      category: 'Privacy',
      tags: 'privacy,email,security,disposable'
    },
    {
      title: '10 Situations Where You Need a Temporary Email',
      slug: '10-situations-temporary-email',
      excerpt: 'From free trials to sketchy WiFi signups — here are 10 real-world scenarios where a temp email saves the day.',
      body: `<h2>When Should You Use a Temporary Email?</h2>
<p>Temporary emails aren't just for the privacy-paranoid. They're practical tools for everyday internet use. Here are 10 common scenarios:</p>

<h3>1. Free Trial Signups</h3>
<p>Want to try a service without commitment? Use a temp email to sign up and evaluate without future spam.</p>

<h3>2. Online Shopping Discounts</h3>
<p>Many stores offer 10-20% off for email signups. Get the discount without the endless marketing emails.</p>

<h3>3. Forum Registration</h3>
<p>Need to ask one question on a forum? Register with a disposable address.</p>

<h3>4. WiFi Hotspot Login</h3>
<p>Airports, cafes, and hotels often require an email. Use a temp one instead of your real address.</p>

<h3>5. Downloading Free Resources</h3>
<p>eBooks, templates, and guides often require email verification. Keep your inbox clean.</p>

<h3>6. Testing Email Campaigns</h3>
<p>If you're a marketer, temp emails let you preview campaigns before sending to real subscribers.</p>

<h3>7. Avoiding Data Brokers</h3>
<p>Data brokers collect and sell email addresses. Temp emails break the chain.</p>

<h3>8. Gaming Accounts</h3>
<p>Create secondary gaming accounts without exposing your main email.</p>

<h3>9. Social Media Research</h3>
<p>Researching competitors? Create accounts without linking to your identity.</p>

<h3>10. Bug Bounty Testing</h3>
<p>Security researchers use temp emails to test email-related vulnerabilities safely.</p>`,
      cover_image: '📋',
      author: 'Trash Mails Team',
      category: 'Tips',
      tags: 'tips,temporary-email,use-cases'
    },
    {
      title: 'How We Keep Your Temporary Emails Secure',
      slug: 'how-we-keep-emails-secure',
      excerpt: 'A deep dive into the security measures behind Trash Mails — from encryption to auto-deletion.',
      body: `<h2>Security at Every Layer</h2>
<p>At Trash Mails, security isn't an afterthought — it's the foundation. Here's how we protect your temporary communications:</p>

<h2>Encryption in Transit</h2>
<p>All emails received by Trash Mails are encrypted using TLS (Transport Layer Security). This ensures that your messages can't be intercepted while traveling across the internet.</p>

<h2>Automatic Deletion</h2>
<p>Every mailbox has a strict expiration timer. Once it expires, all associated emails are permanently deleted from our servers — no archives, no backups, no traces.</p>

<h2>Zero Personal Data</h2>
<p>We never ask for your name, phone number, or any identifying information. Your temporary mailbox is completely anonymous.</p>

<h2>No Tracking</h2>
<p>Unlike many email providers, we don't track your usage patterns, read your emails, or serve targeted ads based on email content.</p>

<p>Your privacy is our promise. That's why millions trust Trash Mails for their disposable email needs.</p>`,
      cover_image: '🔒',
      author: 'Security Team',
      category: 'Security',
      tags: 'security,encryption,privacy'
    },
    {
      title: 'Disposable Email vs Email Alias: Which Is Better?',
      slug: 'disposable-email-vs-alias',
      excerpt: 'Both protect your privacy, but they work very differently. Learn which one fits your needs.',
      body: `<h2>Two Approaches to Email Privacy</h2>
<p>When it comes to protecting your real email address, you have two main options: disposable emails and email aliases. Let's compare them.</p>

<h2>Disposable Emails</h2>
<p><strong>How they work:</strong> Generate a temporary inbox that expires after a set time. No account needed.</p>
<p><strong>Best for:</strong> One-time signups, quick verifications, avoiding spam entirely.</p>
<p><strong>Pros:</strong> Instant, anonymous, zero setup</p>
<p><strong>Cons:</strong> Temporary — you lose access after expiry</p>

<h2>Email Aliases</h2>
<p><strong>How they work:</strong> Create alternate addresses that forward to your real inbox.</p>
<p><strong>Best for:</strong> Long-term use where you need ongoing access.</p>
<p><strong>Pros:</strong> Persistent, organizable, traceable</p>
<p><strong>Cons:</strong> Requires account setup, linked to real email</p>

<h2>The Verdict</h2>
<p>Use disposable emails for anything temporary. Use aliases for services you plan to keep using. For maximum privacy, combine both strategies.</p>`,
      cover_image: '⚖️',
      author: 'Trash Mails Team',
      category: 'Guide',
      tags: 'guide,comparison,alias,privacy'
    },
    {
      title: 'The Ultimate Guide to Avoiding Email Spam in 2026',
      slug: 'avoiding-email-spam-2026',
      excerpt: 'Spam is getting smarter, but so are the tools to fight it. Here\'s your complete anti-spam playbook.',
      body: `<h2>Spam Is Evolving</h2>
<p>In 2026, spam emails have become more sophisticated than ever. AI-generated phishing, deepfake sender names, and hyper-personalized scams make it harder to distinguish legitimate emails from junk.</p>

<h2>Your Anti-Spam Toolkit</h2>

<h3>1. Use Disposable Emails for Signups</h3>
<p>The #1 source of spam is giving your real email to random services. Use Trash Mails instead.</p>

<h3>2. Enable Two-Factor Authentication</h3>
<p>Even if spammers get your email, 2FA prevents account takeover.</p>

<h3>3. Check Email Headers</h3>
<p>Before clicking links, verify the sender domain matches the claimed organization.</p>

<h3>4. Use Email Filtering Rules</h3>
<p>Set up aggressive filters in your primary email client.</p>

<h3>5. Report Phishing</h3>
<p>Report suspicious emails to help AI models learn and protect others.</p>

<h2>Stay Ahead</h2>
<p>The best defense is proactive. By using disposable emails for non-essential signups, you dramatically reduce your spam exposure.</p>`,
      cover_image: '🚫',
      author: 'Trash Mails Team',
      category: 'Tips',
      tags: 'spam,email,tips,security'
    },
    {
      title: 'Introducing Custom Email Names on Trash Mails',
      slug: 'custom-email-names-feature',
      excerpt: 'You can now choose your own email username! Create memorable disposable addresses like john@trashmails.io.',
      body: `<h2>Your Email, Your Name</h2>
<p>We're excited to announce a highly requested feature: <strong>Custom Email Names</strong>! You can now choose your own username for your temporary email address.</p>

<h2>How It Works</h2>
<p>Simply click the ✏️ Edit button next to your email address, type your preferred username (3-30 characters), and hit "Set Email". Your new custom address is ready instantly!</p>

<h2>Why Custom Names?</h2>
<ul>
<li><strong>Professional testing</strong> — Use realistic-looking addresses for QA</li>
<li><strong>Easy to remember</strong> — No more random strings</li>
<li><strong>Better organization</strong> — Name your addresses by purpose</li>
</ul>

<h2>Rules</h2>
<p>Custom names can include letters, numbers, dots, hyphens, and underscores. Each name is unique — first come, first served!</p>

<p>Try it now at <strong>trashmails.io</strong> 🚀</p>`,
      cover_image: '✨',
      author: 'Product Team',
      category: 'Updates',
      tags: 'feature,update,custom-email'
    }
  ];

  const insertPost = db.prepare('INSERT INTO blog_posts (title, slug, excerpt, body, cover_image, author, category, tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  for (const p of seedPosts) {
    insertPost.run(p.title, p.slug, p.excerpt, p.body, p.cover_image, p.author, p.category, p.tags);
  }
}

// ── Blog API (Public) ───────────────────────────────────────────

// List published posts
app.get('/api/blog', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const posts = db.prepare('SELECT id, title, slug, excerpt, cover_image, author, category, tags, views, created_at FROM blog_posts WHERE status = ? ORDER BY created_at DESC LIMIT ?').all('published', limit);
  res.json(posts);
});

// Get single post by slug
app.get('/api/blog/:slug', (req, res) => {
  const post = db.prepare('SELECT * FROM blog_posts WHERE slug = ? AND status = ?').get(req.params.slug, 'published');
  if (!post) return res.status(404).json({ error: 'Post not found' });
  // Increment views
  db.prepare('UPDATE blog_posts SET views = views + 1 WHERE id = ?').run(post.id);
  post.views += 1;
  res.json(post);
});

// ── Blog API (Admin) ────────────────────────────────────────────

// List all posts (including drafts/hidden)
app.get('/api/admin/blog', (req, res) => {
  const posts = db.prepare('SELECT * FROM blog_posts ORDER BY created_at DESC').all();
  res.json(posts);
});

// Create post
app.post('/api/admin/blog', (req, res) => {
  const { title, slug, excerpt, body, cover_image, author, category, tags, status } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  try {
    const result = db.prepare('INSERT INTO blog_posts (title, slug, excerpt, body, cover_image, author, category, tags, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .run(title, finalSlug, excerpt || '', body || '', cover_image || '📝', author || 'Admin', category || 'General', tags || '', status || 'published');
    res.json(db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(result.lastInsertRowid));
  } catch (e) {
    res.status(400).json({ error: e.message.includes('UNIQUE') ? 'Slug already exists' : e.message });
  }
});

// Update post
app.put('/api/admin/blog/:id', (req, res) => {
  const post = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const { title, slug, excerpt, body, cover_image, author, category, tags, status } = req.body;
  db.prepare('UPDATE blog_posts SET title=?, slug=?, excerpt=?, body=?, cover_image=?, author=?, category=?, tags=?, status=?, updated_at=datetime(\'now\') WHERE id=?')
    .run(title || post.title, slug || post.slug, excerpt !== undefined ? excerpt : post.excerpt, body !== undefined ? body : post.body, cover_image || post.cover_image, author || post.author, category || post.category, tags !== undefined ? tags : post.tags, status || post.status, post.id);
  res.json(db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(post.id));
});

// Delete post
app.delete('/api/admin/blog/:id', (req, res) => {
  db.prepare('DELETE FROM blog_posts WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ── Start ───────────────────────────────────────────────────────
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🗑️  Trash Mails API running on http://localhost:${PORT}`);
});
