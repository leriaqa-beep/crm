// 01-clients-crud — creating, editing and moving clients between stages.

import { test } from '@playwright/test';
import { openCRM, openClientByName, makeClient, readStorage, expect } from './helpers.js';

test.describe('Clients CRUD', () => {
  test('add a client via the "Добавить" button and see it on the board', async ({ page }) => {
    await openCRM(page);
    await page.locator('button', { hasText: 'Добавить клиента' }).first().click();
    await page.locator('#modal-add.open').waitFor();
    await page.fill('#f-name', 'Иван Тестов');
    await page.fill('#f-company', 'ООО Ромашка');
    await page.locator('#modal-add button[onclick="saveClient()"]').click();
    await page.locator('#modal-add.open').waitFor({ state: 'hidden' });
    await expect(page.locator('.card-name', { hasText: 'Иван Тестов' })).toBeVisible();
    await expect(page.locator('#s-total')).toHaveText('1');
  });

  test('editing the client name in detail modal persists', async ({ page }) => {
    await openCRM(page, { seed: { clients: [makeClient({ name: 'Старое имя' })] } });
    await openClientByName(page, 'Старое имя');
    await page.fill('#d-name', 'Новое имя');
    await page.locator('#d-name').press('Enter');
    await page.locator('#modal-detail .modal-close').click();
    await expect(page.locator('.card-name', { hasText: 'Новое имя' })).toBeVisible();
    const clients = await readStorage(page, 'crm_v4');
    expect(clients[0].name).toBe('Новое имя');
  });
});
