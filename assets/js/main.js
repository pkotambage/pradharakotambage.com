const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

// Keep core website wording consistent wherever this introductory sentence appears.
const oldProblemIntro = 'Legal problems rarely arrive in neat legal categories. They arrive as letters, unpaid money, workplace problems, family questions and disputes.';
const newProblemIntro = 'Legal problems rarely arrive in neat legal categories. They arrive as letters, unpaid money, workplace problems, family issues and disputes, and land problems.';
document.querySelectorAll('p').forEach((paragraph) => {
  if (paragraph.textContent.trim() === oldProblemIntro) {
    paragraph.textContent = newProblemIntro;
  }
});

// Home-page guide cards should reflect the current guide plan and take readers straight to published articles.
document.querySelectorAll('.guide-card').forEach((card) => {
  const title = card.querySelector('h3');
  const description = card.querySelector('p');
  const link = card.querySelector('a');

  if (title && link && title.textContent.trim() === 'Someone owes you money?') {
    link.href = 'legal-guides/someone-owes-you-money/';
  }

  if (title && link && title.textContent.trim() === 'Can a person under 16 legally marry in Sri Lanka?') {
    title.textContent = 'Why Oral Agreements Can Be Dangerous When Land or Property Is Involved';
    if (description) {
      description.textContent = 'Why promises, plain-paper agreements, advances, possession and family understandings do not automatically replace the legal formalities required for land transactions.';
    }
    link.href = 'legal-guides/oral-agreements-land-property/';
  }

  if (title && title.textContent.trim() === 'Employer terminated you without proper notice?') {
    title.textContent = 'What Can You Do If Your Employer Terminates You Unfairly or Without Proper Procedure?';
    if (description) {
      description.textContent = 'A practical guide to the legal questions, procedures and possible remedies that may arise when employment is terminated unfairly or without proper procedure.';
    }
    if (link) {
      link.href = 'legal-guides/unfair-termination-proper-procedure/';
    }
  }
});

// Keep “Received a Letter of Demand?” as the final home-page guide card without changing the order of the others.
const homeGuideCards = Array.from(document.querySelectorAll('.guide-card'));
const letterOfDemandCard = homeGuideCards.find((card) => card.querySelector('h3')?.textContent.trim() === 'Received a Letter of Demand?');
if (letterOfDemandCard?.parentElement) {
  letterOfDemandCard.parentElement.appendChild(letterOfDemandCard);
}

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

  // Shared article-ending blocks. These are injected once at site level so every Legal Guide stays consistent.
  const articleBack = articleContent.querySelector(':scope > .article-back');
  const insertionPoint = articleBack || null;
  const isSinhala = document.documentElement.lang.toLowerCase().startsWith('si');

  if (!articleContent.querySelector(':scope > .author-note')) {
    const authorNote = document.createElement('section');
    authorNote.className = 'author-note';

    if (isSinhala) {
      authorNote.innerHTML = '<h2>කතුවරයා ගැන</h2><p><strong>ප්‍රධාර කොටඹගේ</strong> නීතිඥවරයෙකි. මෙම Legal Guides ව්‍යාපෘතිය ප්‍රායෝගික නීති දැනුවත්භාවය සහ දෛනික ගැටලු වලදී මිනිසුන් මුහුණ දෙන ප්‍රශ්න පැහැදිලිව විස්තර කිරීම කෙරෙහි අවධානය යොමු කරයි.</p>';
    } else {
      authorNote.innerHTML = '<h2>About the author</h2><p><strong>Pradhara Kotambage</strong> is an Attorney-at-Law in Sri Lanka. This Legal Guides project focuses on practical legal literacy and clear explanations of the questions people encounter in everyday disputes.</p>';
    }

    articleContent.insertBefore(authorNote, insertionPoint);
  }

  if (!articleContent.querySelector(':scope > .article-disclaimer')) {
    const disclaimer = document.createElement('div');
    disclaimer.className = 'article-disclaimer';

    if (isSinhala) {
      disclaimer.innerHTML = '<p><strong>සාමාන්‍ය තොරතුරු පමණි.</strong> මෙම ලිපිය සාමාන්‍ය නීතිමය තොරතුරු සපයයි. සුදුසු නීතිමය සහනය එක් එක් කරුණට අදාළ කරුණු සහ ලේඛන මත රඳා පවතී. මෙම මාර්ගෝපදේශය කියවීමෙන් පමණක් Attorney-at-Law/client relationship එකක් ඇති නොවේ.</p>';
    } else {
      disclaimer.innerHTML = '<p><strong>General information only.</strong> This article provides general legal information. The appropriate legal remedy depends on the facts and documents relating to each individual matter. Reading this guide does not by itself create an Attorney-at-Law/client relationship.</p>';
    }

    articleContent.insertBefore(disclaimer, insertionPoint);
  }
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

if (featuredGuides && !featuredGuides.querySelector('[data-guide="unfair-termination-proper-procedure"]')) {
  const card = document.createElement('article');
  card.className = 'featured-guide';
  card.dataset.guide = 'unfair-termination-proper-procedure';
  card.style.borderTop = '6px solid #829a67';
  card.innerHTML = '<span class="status published">Published</span><h3><a href="./unfair-termination-proper-procedure/">What Can You Do If Your Employer Terminates You Unfairly or Without Proper Procedure?</a></h3><p>A practical guide to the first legal questions, possible remedies and important time limits when employment is terminated.</p><a class="read-link" href="./unfair-termination-proper-procedure/">Read the guide →</a><a class="read-link" href="../si/legal-guides/unfair-termination-proper-procedure/" lang="si">සිංහලෙන් කියවන්න →</a><div class="guide-note">Sri Lanka · Work &amp; employment · English &amp; සිංහල</div>';
  featuredGuides.appendChild(card);
}

// Remove the employment guide from the planned list now that it has been published, then keep numbering tidy.
const comingList = document.querySelector('.coming-list');
if (comingList) {
  comingList.querySelectorAll('.coming-item').forEach((item) => {
    const heading = item.querySelector('h3')?.textContent.trim();
    if (heading === 'What Can You Do if Your Employer Terminates You Without Proper Notice?' || heading === 'What Can You Do If Your Employer Terminates You Unfairly or Without Proper Procedure?') {
      item.remove();
    }
  });

  comingList.querySelectorAll('.coming-num').forEach((num, index) => {
    num.textContent = String(index + 1).padStart(2, '0');
  });
}
