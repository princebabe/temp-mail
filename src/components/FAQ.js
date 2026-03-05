export const FAQ = () => `
  <section id="faq" class="faq">
    <div class="container container-narrow">
      <h2>Frequently Asked Questions</h2>
      <div class="faq-list">
        <div class="faq-item">
          <div class="faq-question" data-faq-toggle>What is a disposable temporary email? <span>+</span></div>
          <div class="faq-answer">It's a short-lived email address that you can use for signing up for services without revealing your real email. It protects you from spam and data breaches.</div>
        </div>
        <div class="faq-item">
          <div class="faq-question" data-faq-toggle>How long do the emails last? <span>+</span></div>
          <div class="faq-answer">On the free plan, emails last for 1 hour. On the premium plan, you can keep them indefinitely.</div>
        </div>
        <div class="faq-item">
          <div class="faq-question" data-faq-toggle>Can I use my own domain? <span>+</span></div>
          <div class="faq-answer">Yes, our Premium plan allows you to connect your own custom domains and manage them through our simple DNS guide.</div>
        </div>
        <div class="faq-item">
          <div class="faq-question" data-faq-toggle>Is it safe? <span>+</span></div>
          <div class="faq-answer">Absolutely. We don't store any personal data, and all messages are permanently deleted once they expire.</div>
        </div>
      </div>
    </div>
  </section>
`;

export const initFAQ = () => {
  document.querySelectorAll('[data-faq-toggle]').forEach(q => {
    const answer = q.nextElementSibling;
    const icon = q.querySelector('span');
    // Start collapsed
    answer.style.maxHeight = '0';
    answer.style.overflow = 'hidden';
    answer.style.padding = '0 2rem';
    answer.style.transition = 'max-height 0.35s ease, padding 0.35s ease';

    q.addEventListener('click', () => {
      const isOpen = answer.style.maxHeight !== '0px' && answer.style.maxHeight !== '0';
      if (isOpen) {
        answer.style.maxHeight = '0';
        answer.style.padding = '0 2rem';
        icon.textContent = '+';
      } else {
        answer.style.maxHeight = answer.scrollHeight + 30 + 'px';
        answer.style.padding = '0 2rem 1.5rem';
        icon.textContent = '−';
      }
    });
  });
};

export const injectFAQStyles = () => {
  if (document.getElementById('faq-styles')) return;
  const style = document.createElement('style');
  style.id = 'faq-styles';
  style.textContent = `
    .container-narrow { max-width: 800px; }
    .faq-list { margin-top: 3rem; }
    .faq-item {
      background: var(--bg-card);
      border-radius: 12px;
      margin-bottom: 1rem;
      border: 1px solid rgba(124, 58, 237, 0.1);
      overflow: hidden;
      transition: var(--transition);
    }
    .faq-item:hover { border-color: rgba(124, 58, 237, 0.3); }
    .faq-question {
      padding: 1.5rem 2rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: var(--transition);
      user-select: none;
    }
    .faq-question:hover { background: rgba(124, 58, 237, 0.05); }
    .faq-answer {
      color: var(--text-muted);
      line-height: 1.6;
    }
    .faq-question span { color: var(--primary-purple); font-size: 1.5rem; font-weight: 400; }
  `;
  document.head.appendChild(style);
};
