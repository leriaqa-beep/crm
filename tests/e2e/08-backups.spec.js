// 08-backups — versioning: modal opens, snapshots can be restored.

import { test } from '@playwright/test';
import { openCRM, makeClient, readStorage, expect } from './helpers.js';

test.describe('Backups / versions', () => {
  test('opens the backups modal', async ({ page }) => {
    await openCRM(page);
    await page.locator('button', { hasText: 'Версии' }).click();
    await expect(page.locator('#modal-backups.open')).toBeVisible();
  });

  test('restore replaces current clients with the snapshot data', async ({ page }) => {
    const snapshotClients = [makeClient({ id: 'sc1', name: 'Из бэкапа', company: 'Snap' })];
    await openCRM(page, {
      seed: {
        clients: [makeClient({ name: 'Текущий' })],
        backups: [{
          date: new Date().toISOString(),
          label: 'Ручной',
          count: snapshotClients.length,
          data: snapshotClients,
        }],
      },
    });

    // Auto-accept the confirm() dialogs the restore flow throws.
    page.on('dialog', d => d.accept());

    await page.locator('button', { hasText: 'Версии' }).click();
    await page.locator('.bk-btn-restore').first().click();

    // Post-restore, board shows the snapshot's client
    await expect(page.locator('.card-name', { hasText: 'Из бэкапа' })).toBeVisible();
    const stored = await readStorage(page, 'crm_v4');
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('Из бэкапа');
  });
});
