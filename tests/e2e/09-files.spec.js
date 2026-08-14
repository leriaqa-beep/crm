// 09-files — uploading, deleting, and listing file attachments.

import { test } from '@playwright/test';
import { openCRM, openClientByName, switchDetailTab, makeClient, readStorage, expect } from './helpers.js';

test.describe('File attachments', () => {
  test('upload a small text file → appears in list and is stored on client', async ({ page }) => {
    await openCRM(page, { seed: { clients: [makeClient({ name: 'Файловик' })] } });
    await openClientByName(page, 'Файловик');
    await switchDetailTab(page, 'files');

    // Attach a small in-memory file
    await page.setInputFiles('#d-file-input', {
      name: 'note.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('привет из теста', 'utf8'),
    });

    await expect(page.locator('.file-item')).toHaveCount(1);
    await expect(page.locator('.file-name')).toContainText('note.txt');

    const clients = await readStorage(page, 'crm_v4');
    expect(clients[0].files).toHaveLength(1);
    expect(clients[0].files[0].name).toBe('note.txt');
    expect(clients[0].files[0].data.startsWith('data:')).toBe(true);
  });

  test('delete attached file removes it from the list', async ({ page }) => {
    const seeded = makeClient({
      name: 'Чистильщик',
      files: [{ id: 'f1', name: 'x.pdf', size: 100, type: 'application/pdf',
                date: new Date().toISOString(), data: 'data:application/pdf;base64,AAAA' }],
    });
    await openCRM(page, { seed: { clients: [seeded] } });
    await openClientByName(page, 'Чистильщик');
    await switchDetailTab(page, 'files');
    await expect(page.locator('.file-item')).toHaveCount(1);

    page.on('dialog', d => d.accept());
    await page.locator('.file-item button[title="Удалить"]').click();
    await expect(page.locator('.file-item')).toHaveCount(0);
    const clients = await readStorage(page, 'crm_v4');
    expect(clients[0].files).toHaveLength(0);
  });
});
