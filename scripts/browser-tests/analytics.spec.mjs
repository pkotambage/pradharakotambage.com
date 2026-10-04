import { test, expect } from '@playwright/test';

// Serve local content at the production origin, intercepting the Google script.
// These tests never send test visits to the live property.
async function setup(page) {
  await page.route('https://pradharakotambage.com/**', async route => {
    const url = new URL(route.request().url());
    const response = await page.request.get('http://127.0.0.1:8765' + url.pathname + url.search);
    await route.fulfill({ response });
  });
  const tags = [];
  await page.route('https://www.googletagmanager.com/**', route => {
    tags.push(route.request().url());
    return route.fulfill({ contentType: 'application/javascript', body: '' });
  });
  return tags;
}

test('no analytics before consent or after decline; allow is persistent and sanitized; withdrawal removes cookies', async ({ page, context }) => {
  const tags = await setup(page);
  await page.goto('https://pradharakotambage.com/?q=private-search&utm_source=whatsapp&utm_medium=social&utm_campaign=guide_october#private-fragment');
  await expect(page.getByRole('button', {name: 'Decline analytics', exact:true})).toBeVisible();
  expect(tags).toHaveLength(0);
  await page.getByRole('button', {name:'Decline analytics',exact:true}).click();
  await page.reload();
  await expect(page.locator('.analytics-choice')).toBeHidden();
  expect(tags).toHaveLength(0);
  await page.getByRole('button',{name:'Analytics settings',exact:true}).click();
  await page.getByRole('button',{name:'Allow analytics',exact:true}).click();
  await expect.poll(() => tags.length).toBe(1);
  const config = await page.evaluate(() => Array.from(window.dataLayer.find(x => x[0] === 'config')));
  expect(config[1]).toBe('G-WNM4XQ40B7');
  expect(config[2].page_location).toBe('https://pradharakotambage.com/');
  expect(config[2].campaign_source).toBe('whatsapp');
  expect(config[2].campaign_name).toBe('guide_october');
  expect(config[2].allow_google_signals).toBe(false);
  await page.reload();
  await expect.poll(() => tags.length).toBe(2);
  await context.addCookies([{name:'_ga',value:'test',domain:'.pradharakotambage.com',path:'/'}]);
  await page.getByRole('button',{name:'Analytics settings',exact:true}).click();
  await page.getByRole('button',{name:'Decline analytics',exact:true}).click();
  await expect(page.locator('.analytics-choice')).toBeHidden();
  await page.reload();
  expect(tags).toHaveLength(2);
  expect((await context.cookies()).filter(x=>x.name.startsWith('_ga'))).toEqual([]);
});

test('mobile Sinhala choices fit and expiry asks again', async ({ page }) => {
  await setup(page);
  await page.setViewportSize({width:375,height:667});
  await page.goto('https://pradharakotambage.com/si/dispute-resolution/');
  await expect(page.getByRole('button',{name:'අවසර නොදෙන්න',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'විශ්ලේෂණ සැකසුම්',exact:true})).toBeAttached();
  const box = await page.locator('.analytics-choice').boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x+box.width).toBeLessThanOrEqual(375);
  await page.evaluate(() => localStorage.setItem('pk-analytics-choice-v1',JSON.stringify({value:'allow',time:0})));
  await page.reload();
  await expect(page.locator('.analytics-choice')).toBeVisible();
  expect(await page.evaluate(() => Boolean(window.gtag))).toBe(false);
});
