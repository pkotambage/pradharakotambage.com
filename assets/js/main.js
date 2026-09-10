const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

// Home-page guide cards should take readers straight to published articles.
document.querySelectorAll('.guide-card').forEach((card) => {
  const title = card.querySelector('h3');
  const link = card.querySelector('a');

  if (title && link && title.textContent.trim() === 'Someone owes you money?') {
    link.href = 'legal-guides/someone-owes-you-money/';
  }
});

// Published short guides should be directly linked wherever they appear in the main money-recovery guide.
if (window.location.pathname.includes('/legal-guides/someone-owes-you-money/')) {
  document.querySelectorAll('.article-content p').forEach((paragraph) => {
    if (paragraph.textContent.includes('I Lent Money Without a Written Agreement. Can I Still Recover It?')) {
      paragraph.innerHTML = '<strong>Related guides:</strong> <a class="related-inline-link" href="../no-written-agreement-loan-recovery/">“I Lent Money Without a Written Agreement. Can I Still Recover It?”</a> · <span>“Why Oral Agreements Can Be Dangerous When Land or Property Is Involved”</span> <em>(coming soon)</em>';
    }
  });
}

// Make inline related-guide links visibly identifiable without requiring hover.
document.querySelectorAll('.related-inline-link').forEach((link) => {
  link.style.textDecoration = 'underline';
  link.style.textUnderlineOffset = '3px';
});

// Add newly published short guides to the Legal Guides quick-answer section.
const quickGrid = document.querySelector('.quick-grid');
if (quickGrid && !quickGrid.querySelector('[data-guide="no-written-agreement-loan-recovery"]')) {
  const card = document.createElement('article');
  card.className = 'quick-card';
  card.dataset.guide = 'no-written-agreement-loan-recovery';
  card.innerHTML = '<p class="quick-label">Informal loans · Short guide</p><h3>I Lent Money Without a Written Agreement. Can I Still Recover It?</h3><p>Why an informal loan may still be recoverable, what evidence can matter, and why waiting too long can be risky.</p><a href="./no-written-agreement-loan-recovery/">Read the short guide →</a>';
  quickGrid.appendChild(card);
}
