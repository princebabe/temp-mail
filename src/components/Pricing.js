export const Pricing = () => `
  <section id="pricing" class="pricing">
    <div class="container">
      <h2>Simple & Transparent Pricing</h2>
      <div class="pricing-grid">
        <div class="pricing-card">
          <div class="pricing-header">
            <h3>Free</h3>
            <p class="price">$0<span>/mo</span></p>
          </div>
          <ul class="pricing-features">
            <li>✅ 1 Session Active</li>
            <li>✅ 10 Emails per day</li>
            <li>✅ 1 Hour Expiry</li>
            <li>❌ Custom Domains</li>
          </ul>
          <button class="btn btn-outline" data-action="signup">Choose Free</button>
        </div>
        <div class="pricing-card featured">
          <div class="pricing-header">
            <span class="badge">Popular</span>
            <h3>Premium</h3>
            <p class="price">$9<span>/mo</span></p>
          </div>
          <ul class="pricing-features">
            <li>✅ Unlimited Sessions</li>
            <li>✅ Unlimited Emails</li>
            <li>✅ Forever Expiry</li>
            <li>✅ Custom Domains</li>
          </ul>
          <button class="btn btn-primary" data-action="signup">Go Premium</button>
        </div>
        <div class="pricing-card">
          <div class="pricing-header">
            <h3>Enterprise</h3>
            <p class="price">$29<span>/mo</span></p>
          </div>
          <ul class="pricing-features">
            <li>✅ Everything in Premium</li>
            <li>✅ Team Roles</li>
            <li>✅ API Access</li>
            <li>✅ Priority Support</li>
          </ul>
          <button class="btn btn-outline" data-action="signup">Contact Us</button>
        </div>
      </div>
    </div>
  </section>
`;

export const injectPricingStyles = () => {
  if (document.getElementById('pricing-styles')) return;
  const style = document.createElement('style');
  style.id = 'pricing-styles';
  style.textContent = `
    .pricing-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
      margin-top: 3rem;
      align-items: center;
    }
    .pricing-card {
      background: var(--bg-card);
      padding: 3rem 2rem;
      border-radius: var(--border-radius);
      border: 1px solid rgba(124, 58, 237, 0.1);
      transition: var(--transition);
      text-align: center;
    }
    .pricing-card:hover {
      transform: translateY(-5px);
      border-color: rgba(124, 58, 237, 0.3);
    }
    .pricing-card.featured {
      background: linear-gradient(135deg, var(--bg-card) 0%, rgba(124, 58, 237, 0.05) 100%);
      border: 2px solid var(--primary-purple);
      transform: scale(1.05);
      position: relative;
    }
    .pricing-card.featured:hover {
      transform: scale(1.07);
    }
    .badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: var(--primary-orange);
      color: white;
      padding: 0.3rem 0.8rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
    }
    .pricing-header h3 { font-size: 1.5rem; margin-bottom: 1rem; }
    .price { font-size: 3rem; font-weight: 700; color: var(--text-main); margin-bottom: 2rem; }
    .price span { font-size: 1rem; color: var(--text-muted); }
    .pricing-features { text-align: left; margin-bottom: 2.5rem; }
    .pricing-features li { padding: 0.8rem 0; border-bottom: 1px solid rgba(255,255,255,0.05); color: var(--text-muted); }
    .pricing-features li:last-child { border-bottom: none; }

    @media (max-width: 992px) {
      .pricing-grid { grid-template-columns: 1fr; max-width: 400px; margin: 3rem auto 0; }
      .pricing-card.featured { transform: none; }
    }
  `;
  document.head.appendChild(style);
};
