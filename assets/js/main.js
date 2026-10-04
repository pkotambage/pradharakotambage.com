const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');

// Make article search reachable from every page's main navigation.
if (siteNav && !siteNav.querySelector('.article-search-nav')) {
  const searchLink = document.createElement('a');
  searchLink.className = 'article-search-nav';
  searchLink.href = '/legal-guides/all/';
  searchLink.textContent = 'Search articles';
  if (window.location.pathname.replace(/index\.html$/, '') === '/legal-guides/all/') {
    searchLink.classList.add('active');
    searchLink.setAttribute('aria-current', 'page');
  }
  siteNav.append(searchLink);
}

if (menuToggle && siteNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });
}

// Connect the official Facebook page from the site-wide footer.
document.querySelectorAll('.site-footer .footer-links').forEach((links) => {
  if (links.querySelector('a[href*="facebook.com/lawinpractice.lk"]')) return;

  const separator = document.createElement('span');
  separator.textContent = '·';
  separator.setAttribute('aria-hidden', 'true');

  const facebookLink = document.createElement('a');
  facebookLink.className = 'facebook-footer-link';
  facebookLink.href = 'https://www.facebook.com/lawinpractice.lk';
  facebookLink.target = '_blank';
  facebookLink.rel = 'noopener noreferrer';
  facebookLink.setAttribute('aria-label', 'Law in Practice on Facebook (opens in a new tab)');
  facebookLink.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8.5V7c0-.7.5-1 1.2-1H17V3h-2.6C11.7 3 10 4.6 10 7.1v1.4H7V12h3v9h4v-9h2.7l.5-3.5H14Z"/></svg><span>Facebook</span>';

  links.append(separator, facebookLink);
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


// Optional GA4: no Google script or analytics request before an explicit choice.
(() => {
  const measurementId = 'G-WNM4XQ40B7';
  const storageKey = 'pk-analytics-choice-v1';
  const maxAge = 180 * 24 * 60 * 60 * 1000;
  let started = false;
  let choice = null;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && ['allow', 'deny'].includes(saved.value) && Date.now() - saved.time < maxAge) choice = saved.value;
  } catch (_) { /* Storage is optional; a fresh choice is required when unavailable. */ }
  window['ga-disable-' + measurementId] = choice !== 'allow';

  function startAnalytics() {
    if (started) return;
    // Keep development and preview traffic out of the production property.
    if (!['pradharakotambage.com', 'www.pradharakotambage.com'].includes(location.hostname)) return;
    started = true;
    window['ga-disable-' + measurementId] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'granted', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    let referrer = '';
    try { referrer = new URL(document.referrer).origin + '/'; } catch (_) {}
    window.gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: location.origin + location.pathname,
      page_referrer: referrer,
      cookie_expires: 15552000,
      cookie_update: false
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    document.head.append(script);
  }

  function clearAnalyticsCookies() {
    document.cookie.split(';').forEach((cookie) => {
      const name = cookie.split('=')[0].trim();
      if (name !== '_ga' && !name.startsWith('_ga_')) return;
      ['', location.hostname, '.' + location.hostname, 'pradharakotambage.com', '.pradharakotambage.com'].forEach((domain) => {
        document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax' + (domain ? '; domain=' + domain : '');
      });
    });
  }

  const sinhala = document.documentElement.lang.toLowerCase().startsWith('si');
  const panel = document.createElement('section');
  panel.className = 'analytics-choice';
  panel.setAttribute('aria-label', sinhala ? 'වෙබ් අඩවි විශ්ලේෂණ සැකසුම්' : 'Analytics preferences');
  panel.hidden = choice !== null;
  panel.innerHTML = sinhala
    ? '<p><strong>වෙබ් අඩවි භාවිතය පිළිබඳ විශ්ලේෂණය</strong><br>ඔබ අවසර දුන්නොත් පමණක්, මෙම වෙබ් අඩවිය භාවිත කරන ආකාරය තේරුම් ගැනීමට Google Analytics භාවිත කරමු. ඔබගේ තේරීම පසුව වෙනස් කළ හැක. <a href="/privacy/">රහස්‍යතා තොරතුරු (English)</a></p>'
    : '<p><strong>Optional website analytics</strong><br>With your permission, we use Google Analytics to understand how this website is used. You can change your choice at any time. <a href="/privacy/">Privacy details</a></p>';
  const actions = document.createElement('div');
  actions.className = 'analytics-actions';
  const settingsButtons = [];
  function saveChoice(value) {
    const wasStarted = started;
    choice = value;
    try { localStorage.setItem(storageKey, JSON.stringify({ value, time: Date.now() })); } catch (_) {}
    panel.hidden = true;
    if (value === 'allow') startAnalytics();
    else {
      window['ga-disable-' + measurementId] = true;
      clearAnalyticsCookies();
      if (wasStarted) { location.reload(); return; }
    }
    settingsButtons[0]?.focus();
  }
  [['deny', sinhala ? 'අවසර නොදෙන්න' : 'Decline analytics'], ['allow', sinhala ? 'අවසර දෙන්න' : 'Allow analytics']].forEach(([value, label]) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', () => saveChoice(value));
    actions.append(button);
  });
  panel.append(actions);
  document.body.append(panel);
  document.querySelectorAll('.site-footer .footer-links').forEach((links) => {
    const separator = document.createElement('span');
    separator.textContent = '·';
    separator.setAttribute('aria-hidden', 'true');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'analytics-settings';
    button.textContent = sinhala ? 'විශ්ලේෂණ සැකසුම්' : 'Analytics settings';
    button.addEventListener('click', () => { panel.hidden = false; actions.querySelector('button').focus(); });
    settingsButtons.push(button);
    links.append(separator, button);
  });
  window.addEventListener('storage', (event) => {
    if (event.key === storageKey || event.key === null) {
      window['ga-disable-' + measurementId] = true;
      location.reload();
    }
  });
  if (choice === 'allow') startAnalytics();
  else clearAnalyticsCookies();
})();
