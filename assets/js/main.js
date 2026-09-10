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

// Keep every in-article “Related guides” section visually consistent.
const articleContent = document.querySelector('.article-content');

if (articleContent) {
  articleContent.querySelectorAll(':scope > p').forEach((paragraph) => {
    const firstStrong = paragraph.querySelector(':scope > strong:first-child');
    if (!firstStrong) return;

    const label = firstStrong.textContent.trim().replace(/:$/, '').toLowerCase();
    if (label !== 'related guide' && label !== 'related guides') return;

    let bodyHtml = paragraph.innerHTML
      .replace(/^<strong>Related guides?:<\/strong>\s*/i, '')
      .replace(/\s·\s/g, '<br>');

    const box = document.createElement('div');
    box.className = 'article-callout related-guides-inline';
    box.innerHTML = `<p><strong>Related guides</strong></p><p>${bodyHtml}</p>`;
    paragraph.replaceWith(box);
  });

  // Turn published related-guide titles into direct links wherever they appear.
  const publishedGuides = [
    {
      title: 'The Debtor Has Asked for More Time – Should You Agree?',
      href: '../debtor-asked-for-more-time/'
    }
  ];

  articleContent.querySelectorAll('.related-guides-inline').forEach((box) => {
    publishedGuides.forEach(({ title, href }) => {
      const body = box.querySelector('p:last-child');
      if (!body || !body.textContent.includes(title) || body.querySelector(`a[href="${href}"]`)) return;

      body.querySelectorAll('span').forEach((span) => {
        const cleanText = span.textContent.replace(/\s*\(coming soon\)\s*/i, '').replace(/[“”]/g, '').trim();
        if (cleanText === title.replace(/[“”]/g, '').trim()) {
          const link = document.createElement('a');
          link.href = href;
          link.textContent = title;
          span.replaceWith(link);
        }
      });
      body.innerHTML = body.innerHTML.replace(/\s*<em>\(coming soon\)<\/em>/i, '');
    });
  });
}

// Add the latest published short guide to the Legal Guides quick-answer section.
const quickGrid = document.querySelector('.quick-grid');
if (quickGrid && !quickGrid.querySelector('[data-guide="debtor-asked-for-more-time"]')) {
  const card = document.createElement('article');
  card.className = 'quick-card';
  card.dataset.guide = 'debtor-asked-for-more-time';
  card.innerHTML = '<p class="quick-label">Repayment · Short guide</p><h3>The Debtor Has Asked for More Time – Should You Agree?</h3><p>When an extension may be sensible, what should be recorded, and why repeated promises should not be allowed to drift indefinitely.</p><a href="./debtor-asked-for-more-time/">Read the short guide →</a>';
  quickGrid.appendChild(card);
}
