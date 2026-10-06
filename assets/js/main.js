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
  const mobileMenu = window.matchMedia('(max-width: 1280px)');
  let lastFocused = document.activeElement;
  function setMenu(open, returnFocus = false) {
    siteNav.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    if (returnFocus) menuToggle.focus();
  }
  menuToggle.addEventListener('click', () => {
    setMenu(!siteNav.classList.contains('open'));
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobileMenu.matches && siteNav.classList.contains('open')) {
      event.preventDefault();
      setMenu(false, true);
    }
  });
  document.addEventListener('focusin', (event) => {
    lastFocused = event.target;
    if (mobileMenu.matches && !siteNav.contains(event.target) && event.target !== menuToggle) setMenu(false);
  });
  mobileMenu.addEventListener('change', () => {
    // A breakpoint can hide and blur the focused element before this callback.
    const focusHidden = mobileMenu.matches && siteNav.contains(lastFocused);
    if (!mobileMenu.matches && lastFocused === menuToggle) siteNav.querySelector('a')?.focus();
    setMenu(false, focusHidden);
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
    // Only conventional, non-personal campaign labels survive URL sanitisation.
    const campaign = {};
    const query = new URLSearchParams(location.search);
    [['utm_source', 'campaign_source'], ['utm_medium', 'campaign_medium'], ['utm_campaign', 'campaign_name']].forEach(([key, field]) => {
      const value = query.get(key);
      if (value && /^[a-zA-Z0-9_-]{1,100}$/.test(value)) campaign[field] = value;
    });
    window.gtag('config', measurementId, {
      ...campaign,
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
  document.querySelectorAll('.site-footer').forEach((footer) => {
    const links = footer.querySelector('.footer-links') || footer;
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
