const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
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
    },
    {
      title: 'If a Labour Tribunal Finds Your Termination Unfair, Will You Automatically Get Your Job Back — and How Is Compensation Decided?',
      href: '../labour-tribunal-reinstatement-compensation/'
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

  // When the Labour Tribunal compensation guide is referenced in an existing related-guides box, turn it into a live link.
  const labourCompensationEnglish = 'If a Labour Tribunal Finds Your Termination Unfair, Will You Automatically Get Your Job Back — and How Is Compensation Decided?';
  const labourCompensationSinhala = 'කම්කරු විනිශ්චය සභාව ඔබගේ සේවා අවසන් කිරීම අසාධාරණ බව තීරණය කළොත්, ඔබට අනිවාර්යයෙන්ම රැකියාව නැවත ලැබෙනවාද — වන්දි තීරණය කරන්නේ කොහොමද?';

  articleContent.querySelectorAll('.article-callout p, .related-block p').forEach((paragraph) => {
    const text = paragraph.textContent.trim();
    if (!paragraph.querySelector('a') && text.startsWith(labourCompensationEnglish)) {
      paragraph.innerHTML = `<a href="../labour-tribunal-reinstatement-compensation/">${labourCompensationEnglish}</a> — published`;
    }
    if (!paragraph.querySelector('a') && text.startsWith(labourCompensationSinhala)) {
      paragraph.innerHTML = `<a href="../labour-tribunal-reinstatement-compensation/">${labourCompensationSinhala}</a> — පළ කර ඇත`;
    }
  });
}
