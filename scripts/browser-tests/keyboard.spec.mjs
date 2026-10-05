import { test, expect } from '@playwright/test';

for (const path of ['/', '/legal-guides/all/', '/si/dispute-resolution/what-is-mediation/']) {
  test(`keyboard skip and mobile navigation: ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);
    await page.keyboard.press('Tab');
    const skip = page.locator('.skip-link');
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.querySelector('main').contains(document.activeElement))).toBe(true);
    const toggle = page.locator('.menu-toggle');
    const nav = page.locator('.site-nav');
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-controls', 'site-navigation');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toHaveAccessibleName('Close navigation');
    await page.keyboard.press('Tab');
    await expect(nav.locator('a').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAccessibleName('Open navigation');
    await page.keyboard.press('Space');
    await nav.locator('a').last().focus();
    await page.keyboard.press('Tab');
    await expect(nav).toBeHidden();
    await expect(toggle).not.toBeFocused();
    await toggle.focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('Tab');
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(nav).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(toggle).toBeFocused();
    await expect(nav).toBeHidden();
    expect(await toggle.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  });
}

test('skip link works without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:8765/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
  await context.close();
});
