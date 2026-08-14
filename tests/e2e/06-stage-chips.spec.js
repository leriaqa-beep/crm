// 06-stage-chips — auto-adding a chip labelled with the target stage
// when a client is moved between columns.

import { test } from '@playwright/test';
import { openCRM, openClientByName, switchDetailTab, makeClient, readStorage, expect } from './helpers.js';

test.describe('Stage chips', () => {
  test('moving via detail dropdown appends a chip named after the new stage', async ({ page }) => {
    await openCRM(page, { seed: { clients: [makeClient({ name: 'Хопер', stage: 0 })] } });
    await openClientByName(page, 'Хопер');
    // Move via the stage <select> in Contacts tab? Actually saveDetailStage
    // is called from the dropdown next to the timeline. Easier: use the "Move"
    // buttons in the History tab.
    await switchDetailTab(page, 'history');
    // Click the button for stage index 2 (Переговоры)
    await page.locator('#d-stages button').nth(1).click();  // stage index 1 = "Переговоры"

    const clients = await readStorage(page, 'crm_v4');
    expect(clients[0].stage).toBe(1);
    const labels = (clients[0].chips || []).map(ch => ch.label);
    expect(labels).toContain('Переговоры');
  });

  test('same stage twice does not duplicate the chip', async ({ page }) => {
    await openCRM(page, { seed: { clients: [makeClient({ name: 'Однажды', stage: 0 })] } });
    await openClientByName(page, 'Однажды');
    await switchDetailTab(page, 'history');
    await page.locator('#d-stages button').nth(1).click();  // stage index 1 = "Переговоры"
    await page.locator('#d-stages button').nth(3).click();
    await page.locator('#d-stages button').nth(1).click();  // stage index 1 = "Переговоры"
    const clients = await readStorage(page, 'crm_v4');
    const negot = (clients[0].chips || []).filter(ch => ch.label === 'Переговоры');
    expect(negot).toHaveLength(1);
  });
});
