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
    },
    {
      title: 'How Long Can You Wait Before Taking Legal Action to Recover a Debt?',
      href: '../how-long-to-recover-debt/'
    },
    {
      title: 'Why Oral Agreements Can Be Dangerous When Land or Property Is Involved',
      href: '../oral-agreements-land-property/'
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

  // Replace bottom-of-article “coming soon” cards when the related guide is now published.
  articleContent.querySelectorAll('.related-coming').forEach((item) => {
    const cleanText = item.textContent.replace(/\s*Coming soon\s*/i, '').trim();
    if (cleanText === 'How Long Can You Wait Before Taking Legal Action to Recover a Debt?') {
      const link = document.createElement('a');
      link.className = 'related-link';
      link.href = '../how-long-to-recover-debt/';
      link.textContent = cleanText;
      item.replaceWith(link);
    }
  });
}

// Add newly published short guides to the Legal Guides quick-answer section.
const quickGrid = document.querySelector('.quick-grid');
if (quickGrid) {
  if (!quickGrid.querySelector('[data-guide="debtor-asked-for-more-time"]')) {
    const card = document.createElement('article');
    card.className = 'quick-card';
    card.dataset.guide = 'debtor-asked-for-more-time';
    card.innerHTML = '<p class="quick-label">Repayment · Short guide</p><h3>The Debtor Has Asked for More Time – Should You Agree?</h3><p>When an extension may be sensible, what should be recorded, and why repeated promises should not be allowed to drift indefinitely.</p><a href="./debtor-asked-for-more-time/">Read the short guide →</a>';
    quickGrid.appendChild(card);
  }

  if (!quickGrid.querySelector('[data-guide="how-long-to-recover-debt"]')) {
    const card = document.createElement('article');
    card.className = 'quick-card';
    card.dataset.guide = 'how-long-to-recover-debt';
    card.innerHTML = '<p class="quick-label">Prescription · Short guide</p><h3>How Long Can You Wait Before Taking Legal Action to Recover a Debt?</h3><p>Why there is no single time limit for every debt, and why the nature of the claim and the date the right to sue arose both matter.</p><a href="./how-long-to-recover-debt/">Read the short guide →</a>';
    quickGrid.appendChild(card);
  }
}

// Surface newly published main guides on the Legal Guides landing page.
const featuredGuides = document.querySelector('.featured-guides');
if (featuredGuides && !featuredGuides.querySelector('[data-guide="oral-agreements-land-property"]')) {
  const card = document.createElement('article');
  card.className = 'featured-guide';
  card.dataset.guide = 'oral-agreements-land-property';
  card.style.borderTop = '6px solid var(--teal)';
  card.innerHTML = '<span class="status published">Published</span><h3><a href="./oral-agreements-land-property/">Why Oral Agreements Can Be Dangerous When Land or Property Is Involved</a></h3><p>Why promises, plain-paper agreements, advances, possession and family understandings do not automatically replace the legal formalities required for land transactions.</p><a class="read-link" href="./oral-agreements-land-property/">Read the guide →</a><div class="guide-note">Sri Lanka · Land &amp; property</div>';
  featuredGuides.appendChild(card);
}
