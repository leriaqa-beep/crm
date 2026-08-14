// 05-columns — customizable kanban columns: add, rename, reorder.

import { test } from '@playwright/test';
import { openCRM, readStorage, expect } from './helpers.js';

test.describe('Kanban columns', () => {
  test('add new stage via + button', async ({ page }) => {
    await openCRM(page);
    const before = await page.locator('.col').count();
    await page.locator('button[onclick="addStage()"]').click();
    await expect(page.locator('.col')).toHaveCount(before + 1);
    // addStage() schedules startRenameStage() ~60ms after the render. Wait
    // for the contenteditable to become active, then set its value.
    const lbl = page.locator(`#slbl-${before}`);
    await expect(lbl).toHaveAttribute('contenteditable', 'true');
    await lbl.evaluate(el => { el.textContent = 'Тест-колонка'; });
    await lbl.press('Enter');
    const stages = await readStorage(page, 'crm_stages');
    expect(stages).toContain('Тест-колонка');
  });

  test('arrow buttons reorder columns and preserve client mapping', async ({ page }) => {
    // Seed with a client at stage index 0 ("Первый звонок" — default stage[0])
    const clients = [{
      id: 'c1', name: 'Тестклиент', company: 'ООО',
      stage: 0, phones: [], tasks: [], notes: [], chips: [], contacts: [],
      createdAt: new Date().toISOString(),
      stageHistory: [{ stage: 0, stageName: 'Первый звонок', date: new Date().toISOString() }],
    }];
    await openCRM(page, { seed: { clients } });

    // Move column at index 0 one position right (to index 1). The first
    // column only has ONE arrow button (right-arrow), so nth(0) is correct.
    await page.locator('.col').nth(0).locator('.col-arr-btn').first().click();

    const stages = await readStorage(page, 'crm_stages');
    expect(stages[1]).toBe('Первый звонок');

    // The client that was at stage 0 must now be at stage 1 (index remapped)
    const stored = await readStorage(page, 'crm_v4');
    expect(stored[0].stage).toBe(1);

    // And still visually in the "Первый звонок" column (now second)
    await expect(page.locator('.col').nth(1).locator('.card-name')).toHaveText('Тестклиент');
  });
});
