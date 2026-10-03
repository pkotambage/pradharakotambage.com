import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const register = JSON.parse(readFileSync(new URL('../guide-register.json', import.meta.url), 'utf8'));
const total = register.guides.length;

async function expectResults(page, count) {
  const cards = page.locator('#guide-results .library-guide');
  await expect(cards).toHaveCount(total);
  await expect(page.locator('#guide-count')).toHaveText(`${count} ${count === 1 ? 'article' : 'articles'}`);
  // A hidden attribute alone is insufficient: CSS must actually remove the card from layout.
  await expect(cards.filter({ visible: true })).toHaveCount(count);
  const hidden = cards.locator('xpath=self::*[@hidden]');
  await expect(hidden).toHaveCount(total - count);
  for (const card of await hidden.all()) {
    await expect(card).toBeHidden();
    expect(await card.evaluate(element => element.getClientRects().length)).toBe(0);
  }
  if (count === 0) await expect(page.locator('#guide-empty')).toBeVisible();
  else await expect(page.locator('#guide-empty')).toBeHidden();
}

test('search form, English/Sinhala filtering, hidden cards, empty results and Clear', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/legal-guides/');
  await page.locator('#article-search').fill('mediation');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page).toHaveURL(/\/legal-guides\/all\/\?q=mediation$/);
  await expect(page.locator('#guide-search')).toHaveValue('mediation');
  await expectResults(page, 4);
  await expect(page.locator('#guide-results .library-guide').filter({ visible: true }).getByRole('heading')).toContainText([
    'Mediation Is Assisted Negotiation', 'What Is Mediation?', 'Preparing for Mediation',
    "Sri Lanka's New Civil and Commercial Mediation Law"
  ]);
  await page.locator('#guide-search').fill('මුදල්');
  await expectResults(page, 7);
  await expect(page.getByRole('heading', { name: 'Someone Owes You Money: What Legal Options Are Available in Sri Lanka?' })).toBeVisible();
  await page.locator('#guide-search').fill('දික්කසාද');
  await expectResults(page, 2);
  await expect(page.locator('#guide-results img').filter({ visible: true })).toHaveCount(2);
  await page.locator('#guide-search').fill('zzzznotfound');
  await expectResults(page, 0);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expectResults(page, 0);
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(page.locator('#guide-search')).toHaveValue('');
  await expect(page.locator('#guide-search')).toBeFocused();
  await expectResults(page, total);
  expect(errors).toEqual([]);
});
