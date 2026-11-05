import { test, expect } from '@playwright/test';

test('compact desktop navigation, dropdowns, search and keyboard dismissal', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');

  const nav = page.locator('.site-nav.nav-enhanced');
  await expect(nav).toBeVisible();
  await expect(nav.locator(':scope > *')).toHaveCount(7);
  await expect(nav.locator('a.nav-law-in-practice')).toBeVisible();
  await expect(nav.locator('a.nav-law-in-practice')).toHaveAttribute('href', 'law-in-practice/');
  await expect(nav.getByRole('link', { name: 'Legal Guides', exact: true })).toHaveCount(0);

  const guidesButton = page.getByRole('button', { name: 'Legal Guides menu' });
  await guidesButton.click();
  await expect(guidesButton).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#nav-legal-guides-submenu')).toBeVisible();
  await expect(page).toHaveURL(/\/$/); // Clicking the entire label opens the menu without navigating.
  await expect(page.locator('#nav-legal-guides-submenu a:first-child')).toHaveAttribute('href', '/legal-guides/');
  await expect(page.locator('#nav-legal-guides-submenu a:first-child')).toHaveText('Explore by Legal Topic');
  await expect(page.locator('#nav-legal-guides-submenu a:nth-child(2)')).toHaveAttribute('href', '/legal-guides/all/');
  await expect(page.locator('#nav-legal-guides-submenu a:nth-child(2)')).toHaveText('Search All Articles');
  await expect(page.locator('#nav-legal-guides-submenu a[href="/law-in-practice/"]')).toHaveCount(0);

  const disputeButton = page.getByRole('button', { name: 'Dispute Resolution menu' });
  await disputeButton.click();
  await expect(page.locator('#nav-legal-guides-submenu')).toBeHidden();
  await expect(page.locator('#nav-dispute-resolution-submenu')).toBeVisible();
  await expect(page.locator('#nav-dispute-resolution-submenu a:first-child')).toHaveAttribute('href', '/dispute-resolution/');
  await page.keyboard.press('Escape');
  await expect(page.locator('#nav-dispute-resolution-submenu')).toBeHidden();
  await expect(disputeButton).toBeFocused();

  await page.getByRole('button', { name: 'Search articles', exact: true }).click();
  await expect(page.locator('#site-search-panel')).toBeVisible();
  await expect(page.locator('#site-search-query')).toBeFocused();
  await page.locator('#site-search-query').fill('දික්කසාද');
  await page.locator('#site-search-panel button[type="submit"]').click();
  await expect(page).toHaveURL(/\/legal-guides\/all\/\?q=/);
  await expect(page.locator('#guide-search')).toHaveValue('දික්කසාද');
  // The restored Law in Practice tab is a direct link, not a dropdown option.
  await nav.locator('a.nav-law-in-practice').click();
  await expect(page).toHaveURL(/\/law-in-practice\/$/);
  await expect(page.locator('.site-nav.nav-enhanced > a.nav-law-in-practice')).toHaveClass(/active/);
  expect(errors).toEqual([]);
});

test('Sinhala mobile navigation keeps mediation links and search accessible', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/si/dispute-resolution/civil-commercial-mediation-act-sri-lanka/');
  const nav = page.locator('.site-nav.nav-enhanced');
  await expect(nav).toBeHidden();
  await page.locator('.menu-toggle').click();
  await expect(nav).toBeVisible();

  await page.getByRole('button', { name: 'නීති ලිපි උප මෙනුව' }).click();
  await expect(page.locator('#nav-legal-guides-submenu a:first-child')).toHaveText('නීති විෂය අනුව සොයන්න');
  await expect(page.locator('#nav-legal-guides-submenu a:nth-child(2)')).toHaveText('සියලු ලිපි සොයන්න');
  await page.getByRole('button', { name: 'ආරවුල් නිරාකරණය උප මෙනුව' }).click();
  await expect(page.locator('#nav-dispute-resolution-submenu a[href="/si/dispute-resolution/civil-commercial-mediation-act-sri-lanka/"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#nav-dispute-resolution-submenu')).toBeHidden();

  await page.getByRole('button', { name: 'ලිපි සොයන්න', exact: true }).click();
  await expect(page.locator('#site-search-query')).toBeVisible();
  await page.locator('#site-search-query').fill('සමථකරණය');
  await page.locator('#site-search-panel button[type="submit"]').click();
  await expect(page).toHaveURL(/\/legal-guides\/all\/\?q=/);
  await expect(page.locator('#guide-search')).toHaveValue('සමථකරණය');
  expect(errors).toEqual([]);
});
