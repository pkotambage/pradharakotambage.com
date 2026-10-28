// Shared, progressively enhanced navigation.
// Original HTML links remain readable if JavaScript is disabled.
const menuToggle = document.querySelector('.menu-toggle');
const siteNav = document.querySelector('.site-nav');

if (siteNav && menuToggle) {
  const isSinhala = document.documentElement.lang.toLowerCase().startsWith('si');
  const currentPath = window.location.pathname.replace(/index\.html$/, '');
  const original = Array.from(siteNav.querySelectorAll(':scope > a'));
  const pathOf = (anchor) => {
    try { return new URL(anchor.getAttribute('href'), window.location.href).pathname.replace(/index\.html$/, ''); }
    catch (_) { return ''; }
  };
  const find = (match) => original.find((a) => match(pathOf(a)));
  const home = find((p) => p === '/');
  const about = find((p) => p === '/about/');
  const guides = find((p) => p === '/legal-guides/');
  const dispute = find((p) => p === '/dispute-resolution/' || p === '/si/dispute-resolution/');
  const contact = find((p) => p === '/contact/');

  // Keep every existing top-level link as the no-script fallback.
  if (home && about && guides && dispute && contact) {
    const closedMenus = [];
    const closeSubmenus = (except) => {
      closedMenus.forEach(({ group, button, panel }) => {
        if (group === except) return;
        group.classList.remove('is-open');
        button.setAttribute('aria-expanded', 'false');
        panel.hidden = true;
      });
    };

    function addDropdown(anchor, id, items, name) {
      const group = document.createElement('div');
      group.className = 'nav-group';
      anchor.classList.add('nav-parent-link');
      anchor.textContent = name;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'nav-submenu-toggle';
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', id);
      button.setAttribute('aria-label', isSinhala ? name + ' උප මෙනුව විවෘත කරන්න' : 'Open ' + name + ' submenu');
      button.innerHTML = '<span class="nav-chevron" aria-hidden="true"></span>';
      const panel = document.createElement('div');
      panel.className = 'nav-submenu';
      panel.id = id;
      panel.hidden = true;
      items.forEach(([label, href]) => {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = label;
        if (currentPath === href) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page');
        }
        panel.append(link);
      });
      group.append(anchor, button, panel);
      const record = { group, button, panel };
      closedMenus.push(record);
      button.addEventListener('click', () => {
        const opening = panel.hidden;
        closeSubmenus();
        panel.hidden = !opening;
        group.classList.toggle('is-open', opening);
        button.setAttribute('aria-expanded', String(opening));
        if (opening) closeSearch();
      });
      return group;
    }

    const prefix = isSinhala ? '/si' : '';
    const disputeRoot = prefix + '/dispute-resolution/';
    const guideItems = [
      [isSinhala ? 'සියලු නීති ලිපි / All Guides' : 'All Legal Guides', '/legal-guides/all/'],
      ['Law in Practice | නීතිය ප්‍රායෝගිකව', '/law-in-practice/'],
      [isSinhala ? 'සිවිල් නඩු / Civil Litigation' : 'Civil Litigation', '/legal-guides/topics/civil-litigation/'],
      [isSinhala ? 'පවුල් නීතිය / Family Law' : 'Family Law', '/legal-guides/topics/family-personal-law/'],
      [isSinhala ? 'ඉඩම් හා දේපළ / Land & Property' : 'Land & Property', '/legal-guides/topics/land-property/'],
      [isSinhala ? 'ගිවිසුම් හා මුදල් අයකර ගැනීම' : 'Contracts & Recovery', '/legal-guides/topics/contracts-recovery/'],
      [isSinhala ? 'නීති සම්පත් / Legal Resources' : 'Legal Resources', '/legal-resources/']
    ];
    const disputeItems = [
      [isSinhala ? 'සියලු ආරවුල් නිරාකරණ ලිපි' : 'Dispute Resolution Overview', disputeRoot],
      [isSinhala ? 'සමථකරණය යනු කුමක්ද?' : 'What Is Mediation?', disputeRoot + 'what-is-mediation/'],
      [isSinhala ? 'සමථකරණයකට සූදානම් වීම' : 'Preparing for Mediation', disputeRoot + 'preparing-for-mediation/'],
      [isSinhala ? '2026 සිවිල් හා වාණිජ සමථකරණ පනත' : 'Civil & Commercial Mediation Act', disputeRoot + 'civil-commercial-mediation-act-sri-lanka/'],
      [isSinhala ? 'සහාය සහිත සාකච්ඡාවක් ලෙස සමථකරණය' : 'Mediation Is Assisted Negotiation', disputeRoot + 'mediation-assisted-negotiation/']
    ];
    if (currentPath.startsWith('/legal-guides/') || currentPath.startsWith('/law-in-practice/') || currentPath.startsWith('/legal-resources/')) {
      guides.classList.add('active');
    }
    if (currentPath.startsWith('/dispute-resolution/') || currentPath.startsWith('/si/dispute-resolution/')) {
      dispute.classList.add('active');
    }

    const guidesMenu = addDropdown(guides, 'nav-legal-guides-submenu', guideItems, isSinhala ? 'නීති ලිපි' : 'Legal Guides');
    const disputeMenu = addDropdown(dispute, 'nav-dispute-resolution-submenu', disputeItems, isSinhala ? 'ආරවුල් නිරාකරණය' : 'Dispute Resolution');

    const searchControl = document.createElement('div');
    searchControl.className = 'site-search-control';
    const searchButton = document.createElement('button');
    searchButton.type = 'button';
    searchButton.className = 'site-search-toggle';
    searchButton.setAttribute('aria-expanded', 'false');
    searchButton.setAttribute('aria-controls', 'site-search-panel');
    searchButton.setAttribute('aria-label', isSinhala ? 'ලිපි සොයන්න' : 'Search articles');
    searchButton.title = isSinhala ? 'ලිපි සොයන්න' : 'Search articles';
    searchButton.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="10.8" cy="10.8" r="7.3"></circle><path d="m16.3 16.3 5 5"></path></svg><span class="site-search-toggle-label">' + (isSinhala ? 'ලිපි සොයන්න' : 'Search articles') + '</span>';

    const searchPanel = document.createElement('form');
    searchPanel.id = 'site-search-panel';
    searchPanel.className = 'site-search-panel';
    searchPanel.setAttribute('role', 'search');
    searchPanel.setAttribute('aria-label', isSinhala ? 'නීති ලිපි සෙවීම' : 'Search legal articles');
    searchPanel.action = '/legal-guides/all/';
    searchPanel.method = 'get';
    searchPanel.hidden = true;
    const searchLabel = document.createElement('label');
    searchLabel.htmlFor = 'site-search-query';
    searchLabel.textContent = isSinhala ? 'සිංහල හෝ ඉංග්‍රීසි ලිපි සොයන්න' : 'Find English or Sinhala articles';
    const searchRow = document.createElement('div');
    searchRow.className = 'site-search-row';
    const searchInput = document.createElement('input');
    searchInput.id = 'site-search-query';
    searchInput.type = 'search';
    searchInput.name = 'q';
    searchInput.autocomplete = 'off';
    searchInput.maxLength = 150;
    searchInput.required = true;
    searchInput.placeholder = 'Search articles / ලිපි සොයන්න';
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = isSinhala ? 'සොයන්න' : 'Search';
    searchRow.append(searchInput, submitButton);
    searchPanel.append(searchLabel, searchRow);
    searchControl.append(searchButton, searchPanel);

    function closeSearch(returnFocus = false) {
      const wasOpen = !searchPanel.hidden;
      searchPanel.hidden = true;
      searchButton.setAttribute('aria-expanded', 'false');
      searchControl.classList.remove('is-open');
      if (returnFocus && wasOpen) searchButton.focus();
    }
    searchButton.addEventListener('click', () => {
      const opening = searchPanel.hidden;
      closeSubmenus();
      searchPanel.hidden = !opening;
      searchButton.setAttribute('aria-expanded', String(opening));
      searchControl.classList.toggle('is-open', opening);
      if (opening) searchInput.focus();
    });

    // The main navigation has five items, plus the icon-only search control.
    siteNav.replaceChildren(home, about, guidesMenu, disputeMenu, contact, searchControl);
    siteNav.classList.add('nav-enhanced');
    menuToggle.classList.add('nav-toggle-enhanced');
    const mobileMenu = window.matchMedia('(max-width: 1100px)');
    function setMobileMenu(open, returnFocus = false) {
      siteNav.classList.toggle('open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
      if (!open) {
        closeSubmenus();
        closeSearch();
      }
      if (returnFocus) menuToggle.focus();
    }
    menuToggle.addEventListener('click', () => {
      setMobileMenu(!siteNav.classList.contains('open'));
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const openedSubmenu = closedMenus.find(({ panel }) => !panel.hidden);
      if (!searchPanel.hidden) {
        event.preventDefault();
        closeSearch(true);
      } else if (openedSubmenu) {
        event.preventDefault();
        closeSubmenus();
        openedSubmenu.button.focus();
      } else if (mobileMenu.matches && siteNav.classList.contains('open')) {
        event.preventDefault();
        setMobileMenu(false, true);
      }
    });
    document.addEventListener('pointerdown', (event) => {
      if (!siteNav.contains(event.target)) {
        closeSubmenus();
        closeSearch();
      }
    });
    document.addEventListener('focusin', (event) => {
      if (!siteNav.contains(event.target)) {
        closeSubmenus();
        closeSearch();
        if (mobileMenu.matches && event.target !== menuToggle) setMobileMenu(false);
        return;
      }
      if (!searchControl.contains(event.target)) closeSearch();
      const focusedGroup = closedMenus.find(({ group }) => group.contains(event.target));
      if (focusedGroup) closeSubmenus(focusedGroup.group);
      else closeSubmenus();
    });
    mobileMenu.addEventListener('change', () => {
      const focusInMenu = siteNav.contains(document.activeElement);
      setMobileMenu(false, focusInMenu && mobileMenu.matches);
    });
  }
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
