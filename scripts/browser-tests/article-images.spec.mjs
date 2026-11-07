import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
function walk(folder) {
  const result = [];
  for (const entry of readdirSync(join(root, folder), { withFileTypes: true })) {
    const path = join(folder, entry.name);
    if (entry.isDirectory()) result.push(...walk(path));
    else if (entry.isFile() && entry.name === 'index.html') result.push(path);
  }
  return result;
}
const articleRoutes = ['legal-guides', 'dispute-resolution', 'law-in-practice', 'si']
  .flatMap(walk)
  .filter(path => readFileSync(join(root, path), 'utf8').includes('class="article-feature-image"'))
  .map(path => '/' + path.replace(/\/index\.html$/, '/') );
if (articleRoutes.length !== 55) {
  throw new Error('Expected exactly 55 published article editions, found ' + articleRoutes.length);
}

test('All 55 article feature images fully load, keep 16:9 and fit Android widths', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();
  for (const route of articleRoutes) {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    const figure = page.locator('.article-feature-image');
    const image = figure.locator('img');
    await expect(image, route).toHaveCount(1);
    const state = await image.evaluate(async el => {
      await el.decode();
      const rect = el.getBoundingClientRect();
      const frame = el.closest('figure').getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        width: rect.width, height: rect.height,
        frameWidth: frame.width,
        frameRight: frame.right,
        frameLeft: frame.left,
        natWidth: el.naturalWidth,
        natHeight: el.naturalHeight,
        fit: style.objectFit,
        currentSrc: el.currentSrc,
        srcset: el.getAttribute('srcset') || ''
      };
    });
    expect(state.natWidth, route).toBeGreaterThan(0);
    expect(state.natHeight, route).toBeGreaterThan(0);
    expect(state.fit, route).toBe('contain');
    expect(Math.abs(state.width / state.height - 16 / 9), route).toBeLessThan(0.03);
    expect(state.width, route).toBeLessThanOrEqual(390);
    expect(state.frameLeft, route).toBeGreaterThanOrEqual(-1);
    expect(state.frameRight, route).toBeLessThanOrEqual(391);
    expect(state.srcset, route).toContain('-640.webp 640w');
    expect(state.srcset, route).toContain('-960.webp 960w');
    expect(state.srcset, route).toContain('-1280.webp 1280w');
    expect(state.srcset, route).toContain('-1600.webp 1600w');
    expect(state.currentSrc, route).toMatch(/-(640|960|1280)\.webp$/);
  }
  await context.close();
});

test('Directory thumbnails and featured image fit desktop and Android layouts', async ({ page }) => {
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      '/legal-guides/',
      '/legal-guides/all/',
      '/legal-guides/topics/inheritance-succession/',
      '/dispute-resolution/',
      '/law-in-practice/'
    ]) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const imgs = page.locator('img[src*="/assets/images/articles/"]');
      const count = await imgs.count();
      expect(count, route).toBeGreaterThan(0);
      for (let i = 0; i < Math.min(count, 3); i++) {
        const img = imgs.nth(i);
        await img.scrollIntoViewIfNeeded();
        const check = await img.evaluate(async el => {
          await el.decode();
          const r = el.getBoundingClientRect();
          return {
            fit: getComputedStyle(el).objectFit,
            ratio: r.width / r.height,
            width: r.width,
            left: r.left, right: r.right,
            src: el.currentSrc,
            srcset: el.getAttribute('srcset') || ''
          };
        });
        expect(check.fit, route).toBe('contain');
        expect(Math.abs(check.ratio - 16 / 9), route).toBeLessThan(0.05);
        expect(check.width, route).toBeLessThanOrEqual(width + 1);
        expect(check.left, route).toBeGreaterThanOrEqual(-1);
        expect(check.right, route).toBeLessThanOrEqual(width + 1);
        expect(check.srcset, route).toContain('-640.webp 640w');
        expect(check.src, route).toMatch(/-(640|960|1280|1600)\.webp$/);
      }
    }
  }
});
