// 07-storage-safety — lsSet() must never throw and must warn once.
//
// Regression for: contacts / notes silently not saving because localStorage
// was full. Every write goes through lsSet(); we simulate a quota error by
// monkey-patching setItem inside the page and verify:
//   1. subsequent add flows still update the UI in-memory
//   2. the alert appears exactly once

import { test } from '@playwright/test';
import { openCRM, openClientByName, switchDetailTab, makeClient, expect } from './helpers.js';

test.describe('Storage safety (quota)', () => {
  test('failing setItem does not stop addContact from rendering', async ({ page }) => {
    await openCRM(page, { seed: { clients: [makeClient({ name: 'Квота' })] } });
    await openClientByName(page, 'Квота');

    // Patch setItem to throw a QuotaExceededError on subsequent writes.
    await page.evaluate(() => {
      const orig = Storage.prototype.setItem;
      window.__origSet = orig;
      Storage.prototype.setItem = function(k, v){
        if (k === 'crm_v4') {
          const err = new Error('quota'); err.name = 'QuotaExceededError'; throw err;
        }
        return orig.call(this, k, v);
      };
    });

    // Capture any alert() shown by lsSet
    const alerts = [];
    page.on('dialog', async d => { alerts.push(d.message()); await d.dismiss(); });

    await switchDetailTab(page, 'phones');
    await page.locator('#panel-phones button', { hasText: 'Добавить' }).nth(1).click();
    // Even though save failed, the contact card must appear
    await expect(page.locator('.contact-card')).toHaveCount(1);

    // Second attempt must NOT trigger a second alert (one-time warning)
    await page.locator('#panel-phones button', { hasText: 'Добавить' }).nth(1).click();
    await expect(page.locator('.contact-card')).toHaveCount(2);

    expect(alerts.length).toBe(1);
    expect(alerts[0]).toContain('Не удалось сохранить');
  });
});
