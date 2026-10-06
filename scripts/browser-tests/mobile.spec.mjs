import { test, expect } from '@playwright/test';

const representativePages = [
  ['home', '/'],
  ['guide directory', '/legal-guides/all/'],
  ['topic page', '/legal-guides/topics/family-personal-law/'],
  ['long English article', '/legal-guides/divorce-without-unnecessary-conflict/'],
  ['long Sinhala article', '/si/legal-guides/divorce-without-unnecessary-conflict/'],
  ['contact', '/contact/']
];

async function expectNoPageOverflow(page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(metrics.scrollWidth, `page width ${metrics.scrollWidth}px should fit ${metrics.clientWidth}px viewport`)
    .toBeLessThanOrEqual(metrics.clientWidth + 1);
}

for (const width of [360, 390]) {
  for (const [name, path] of representativePages) {
    test(`${name} fits at ${width}px without horizontal page scrolling`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(path);
      await expectNoPageOverflow(page);
    });
  }

  test(`mobile navigation has usable tap targets at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');

    const toggle = page.locator('.menu-toggle');
    await expect(toggle).toBeVisible();
    const toggleBox = await toggle.boundingBox();
    expect(toggleBox?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(toggleBox?.height ?? 0).toBeGreaterThanOrEqual(44);

    await toggle.click();
    const links = page.locator('#site-navigation a');
    await expect(links.first()).toBeVisible();

    for (let i = 0; i < await links.count(); i++) {
      const box = await links.nth(i).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      expect((box?.right ?? 0)).toBeLessThanOrEqual(width + 1);
    }
  });
}

test('long Sinhala article keeps readable heading spacing on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto('/si/legal-guides/divorce-without-unnecessary-conflict/');

  await expect(page.locator('html')).toHaveAttribute('lang', 'si');
  const heading = page.locator('.article-hero h1');
  await expect(heading).toBeVisible();

  const spacing = await heading.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      lineHeight: parseFloat(cs.lineHeight),
      fontSize: parseFloat(cs.fontSize),
      letterSpacing: cs.letterSpacing
    };
  });
  expect(spacing.lineHeight / spacing.fontSize).toBeGreaterThanOrEqual(1.2);
  expect(['normal', '0px']).toContain(spacing.letterSpacing);
  await expectNoPageOverflow(page);
});

for (const [name, path] of representativePages) {
  test(`${name} remains usable with enlarged text`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(path);
    await page.addStyleTag({ content: 'html { font-size: 200% !important; }' });
    await expectNoPageOverflow(page);
  });
}
