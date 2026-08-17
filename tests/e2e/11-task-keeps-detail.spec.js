// 11-task-keeps-detail — regression: after saving a task, the client
// detail modal must stay open (previously it was force-closed and the
// user lost the card she was working on).

import { test } from '@playwright/test';
import { openCRM, openClientByName, makeClient, readStorage, expect } from './helpers.js';

test.describe('Task creation from detail modal', () => {
  test('saving a task keeps the detail modal open and refreshes the task list', async ({ page }) => {
    await openCRM(page, { seed: { clients: [makeClient({ name: 'Планировщик' })] } });
    await openClientByName(page, 'Планировщик');

    // Open the "add task" modal from the detail card
    await page.locator('#panel-tasks button[onclick="openTaskFromDetail()"]').click();
    await expect(page.locator('#modal-task.open')).toBeVisible();
    // Detail modal must still be open in the background
    await expect(page.locator('#modal-detail.open')).toBeVisible();

    // Fill in a task and save
    const today = new Date().toISOString().slice(0, 10);
    await page.fill('#qt-date', today);
    await page.fill('#qt-time', '15:30');
    await page.fill('#qt-text', 'Позвонить и уточнить');
    await page.locator('#modal-task button[onclick="saveTask()"]').click();

    // Task modal closes, detail modal stays open
    await expect(page.locator('#modal-task.open')).toBeHidden();
    await expect(page.locator('#modal-detail.open')).toBeVisible();

    // Newly added task shows inside the detail's Tasks panel
    await expect(page.locator('#d-tasks')).toContainText('Позвонить и уточнить');
    await expect(page.locator('#d-tasks')).toContainText('15:30');

    // Persisted to storage
    const clients = await readStorage(page, 'crm_v4');
    expect(clients[0].tasks).toHaveLength(1);
    expect(clients[0].tasks[0].text).toBe('Позвонить и уточнить');
  });
});
