// 02-contacts-notes — regression tests for the "add contact / add note doesn't work" bug.
//
// Root cause of the original bug: a throwing localStorage.setItem inside save()
// aborted the function before the UI re-render. Fix: lsSet() helper wraps every
// write in try/catch and returns false on failure. These tests verify the
// contact and note flows work end-to-end and survive a page reload.

import { test } from '@playwright/test';
import { openCRM, openClientByName, switchDetailTab, makeClient, readStorage, expect } from './helpers.js';

test.describe('Contacts and Notes', () => {
  test('adding a contact person renders it and persists', async ({ page }) => {
    await openCRM(page, { seed: { clients: [makeClient({ name: 'Контактный тест' })] } });
    await openClientByName(page, 'Контактный тест');
    await switchDetailTab(page, 'phones');

    // Add a contact
    await page.locator('#panel-phones button[onclick="addContact()"]').click();
    const card = page.locator('.contact-card').first();
    await expect(card).toBeVisible();

    // Fill it in
    await card.locator('input[placeholder="Иван Петров"]').fill('Айгуль');
    await card.locator('input[placeholder="Помощник директора"]').fill('Помощник');
    await card.locator('input[placeholder="Помощник директора"]').blur();

    const clients = await readStorage(page, 'crm_v4');
    expect(clients[0].contacts).toHaveLength(1);
    expect(clients[0].contacts[0].name).toBe('Айгуль');
    expect(clients[0].contacts[0].role).toBe('Помощник');

    // Reload page — data must survive
    await page.reload();
    await openClientByName(page, 'Контактный тест');
    await switchDetailTab(page, 'phones');
    await expect(page.locator('.contact-card input').first()).toHaveValue('Айгуль');
  });

  test('adding a note renders and persists', async ({ page }) => {
    await openCRM(page, { seed: { clients: [makeClient({ name: 'Заметочник' })] } });
    await openClientByName(page, 'Заметочник');
    await switchDetailTab(page, 'notes');
    await page.fill('#d-note-input', 'Позвонить в понедельник');
    await page.locator('#d-note-input').press('Enter');
    await expect(page.locator('.note-item', { hasText: 'Позвонить в понедельник' })).toBeVisible();
    const clients = await readStorage(page, 'crm_v4');
    expect(clients[0].notes[0].text).toBe('Позвонить в понедельник');
  });

  test('deleting a contact removes it from storage and DOM', async ({ page }) => {
    const client = makeClient({
      name: 'Удалятор',
      contacts: [{ name: 'A', role: 'X', phones: [] }, { name: 'B', role: 'Y', phones: [] }],
    });
    await openCRM(page, { seed: { clients: [client] } });
    await openClientByName(page, 'Удалятор');
    await switchDetailTab(page, 'phones');
    await expect(page.locator('.contact-card')).toHaveCount(2);
    // Icon-only .contact-del button collapses to 0×0 when the tabler-icons
    // webfont hasn't loaded — click via dispatched event to avoid viewport
    // checks. This still exercises the deleteContact() code path.
    await page.locator('.contact-card').first().locator('.contact-del')
      .evaluate(btn => btn.click());
    await expect(page.locator('.contact-card')).toHaveCount(1);
    const clients = await readStorage(page, 'crm_v4');
    expect(clients[0].contacts).toHaveLength(1);
    expect(clients[0].contacts[0].name).toBe('B');
  });
});
