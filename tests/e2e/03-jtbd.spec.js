// 03-jtbd — the JTBD tab: autosave + regression that fields don't carry
// stale data from a previously opened client.

import { test } from '@playwright/test';
import { openCRM, openClientByName, switchDetailTab, closeDetail, makeClient, readStorage, expect } from './helpers.js';

test.describe('JTBD tab', () => {
  test('fields autosave on blur and are stored under c.jtbd', async ({ page }) => {
    await openCRM(page, { seed: { clients: [makeClient({ name: 'Джобс' })] } });
    await openClientByName(page, 'Джобс');
    await switchDetailTab(page, 'jtbd');

    await page.fill('#jtbd-interviewee', 'Айгерим, помощник ГАП');
    await page.locator('#jtbd-interviewee').blur();
    await page.fill('#jtbd-a_activity', 'Проектирование, экспертиза');
    await page.locator('#jtbd-a_activity').blur();
    await page.fill('#jtbd-priorityPain', 'каждый раз как в чёрный ящик');
    await page.locator('#jtbd-priorityPain').blur();

    const clients = await readStorage(page, 'crm_v4');
    expect(clients[0].jtbd.interviewee).toBe('Айгерим, помощник ГАП');
    expect(clients[0].jtbd.a_activity).toBe('Проектирование, экспертиза');
    expect(clients[0].jtbd.priorityPain).toBe('каждый раз как в чёрный ящик');
  });

  test('switching to another client does not show previous client fields', async ({ page }) => {
    const a = makeClient({ name: 'Клиент А', id: 'ca', jtbd: { interviewee: 'ААА', a_activity: 'aaa activity' } });
    const b = makeClient({ name: 'Клиент Б', id: 'cb' });
    await openCRM(page, { seed: { clients: [a, b] } });

    await openClientByName(page, 'Клиент А');
    await switchDetailTab(page, 'jtbd');
    await expect(page.locator('#jtbd-interviewee')).toHaveValue('ААА');
    await expect(page.locator('#jtbd-a_activity')).toHaveValue('aaa activity');

    await closeDetail(page);
    await openClientByName(page, 'Клиент Б');
    // JTBD fields must be empty for the second client
    await switchDetailTab(page, 'jtbd');
    await expect(page.locator('#jtbd-interviewee')).toHaveValue('');
    await expect(page.locator('#jtbd-a_activity')).toHaveValue('');
    await expect(page.locator('#jtbd-priorityPain')).toHaveValue('');
  });

  test('all five jobs rows render with layer labels Ф/Ф/Э/Э/С', async ({ page }) => {
    await openCRM(page, { seed: { clients: [makeClient({ name: 'Слои' })] } });
    await openClientByName(page, 'Слои');
    await switchDetailTab(page, 'jtbd');
    const layers = await page.locator('.jtbd-job-layer').allTextContents();
    expect(layers).toEqual(['Ф', 'Ф', 'Э', 'Э', 'С']);
  });
});
