// 04-search — verifies the debounced client search.

import { test } from '@playwright/test';
import { openCRM, makeClient, boardCardNames, expect } from './helpers.js';

test.describe('Search', () => {
  const seed = {
    clients: [
      makeClient({ id: 'a', name: 'Абаев Ким',    company: 'ООО Ромашка',  stage: 0 }),
      makeClient({ id: 'b', name: 'Петров Иван',  company: 'ОсОО Ромашка', stage: 1 }),
      makeClient({ id: 'c', name: 'Сидоров Олег', company: 'АО Лютик',     stage: 2 }),
    ],
  };

  test('filters by name', async ({ page }) => {
    await openCRM(page, { seed });
    await page.fill('#srch', 'Петров');
    // Wait past the 200ms debounce
    await page.waitForTimeout(350);
    const names = await boardCardNames(page);
    expect(names).toEqual(['Петров Иван']);
    await expect(page.locator('#s-total')).toHaveText('1/3');
  });

  test('filters by company (case-insensitive)', async ({ page }) => {
    await openCRM(page, { seed });
    await page.fill('#srch', 'ромашка');
    await page.waitForTimeout(350);
    const names = await boardCardNames(page);
    expect(names.sort()).toEqual(['Абаев Ким', 'Петров Иван']);
  });

  test('clear button (×) restores full list', async ({ page }) => {
    await openCRM(page, { seed });
    await page.fill('#srch', 'сидор');
    await page.waitForTimeout(350);
    await expect(page.locator('.card')).toHaveCount(1);
    await page.click('#srch-clr');
    await expect(page.locator('.card')).toHaveCount(3);
    await expect(page.locator('#srch')).toHaveValue('');
  });
});
