// 10-copy-card — one-click copy of the client's key info as plain text.

import { test } from '@playwright/test';
import { openCRM, openClientByName, makeClient, expect } from './helpers.js';

test.describe('Copy client card', () => {
  // Grant clipboard permissions to the browser context.
  test.beforeEach(async ({ context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  });

  test('copy button on the board writes name + company + phone to clipboard', async ({ page }) => {
    await openCRM(page, {
      seed: {
        clients: [makeClient({
          name: 'Замковой Евгений Викторович',
          company: 'ГАП, ОАО "Промпроект"',
          phones: [{ num: '+996 555 774 074', msn: 'phone' }],
        })],
      },
    });
    await page.locator('.card .card-copy-btn').first().click();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain('Замковой Евгений Викторович');
    expect(text).toContain('ГАП, ОАО "Промпроект"');
    expect(text).toContain('+996 555 774 074');
    // Toast appears
    await expect(page.locator('body', { hasText: 'скопирована' })).toBeVisible();
  });

  test('copy button in detail modal writes the same info + contact persons', async ({ page }) => {
    await openCRM(page, {
      seed: {
        clients: [makeClient({
          name: 'Клиент К',
          company: 'ООО Мир',
          phones: [{ num: '+996 555 111 22 33', msn: 'phone' }],
          email: 'k@mir.kg',
          contacts: [{ name: 'Айгуль', role: 'Помощник', phones: [{ num: '+996 555 999 88 77', msn: 'phone' }] }],
        })],
      },
    });
    await openClientByName(page, 'Клиент К');
    await page.locator('#d-meta button', { hasText: 'Копировать' }).click();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain('Клиент К');
    expect(text).toContain('ООО Мир');
    expect(text).toContain('+996 555 111 22 33');
    expect(text).toContain('k@mir.kg');
    expect(text).toContain('Айгуль');
    expect(text).toContain('+996 555 999 88 77');
  });
});
