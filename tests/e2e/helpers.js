// Shared test helpers.
//
// The CRM stores everything in localStorage; each test starts from a clean
// slate to keep runs deterministic. Real business data (from the user's
// browser) is never touched — Playwright uses its own browser context.

import { expect } from '@playwright/test';

export const KEYS = {
  clients: 'crm_v4',
  stages: 'crm_stages',
  backups: 'crm_backups',
  goals: 'crm_goals',
  freeTasks: 'crm_free_tasks',
  dayPlan: 'crm_day_plan',
  tgSettings: 'crm_tg_settings',
  assignees: 'crm_assignees',
  payStages: 'crm_pay_stages',
  leadsImported: 'crm_leads_imported',
};

/** Open the app with a clean localStorage.
 *
 * Uses a sessionStorage flag so that page.reload() inside a test keeps the
 * localStorage populated by the initial seed (init scripts re-run on every
 * navigation — we only want to clear+seed on the very first load).
 */
export async function openCRM(page, { seed } = {}) {
  await page.addInitScript((s) => {
    if (!sessionStorage.getItem('__crm_test_seeded')) {
      localStorage.clear();
      // Prevent the one-time leads import IIFE from injecting 209 clients.
      localStorage.setItem('crm_leads_imported', '1');
      if (s?.clients) localStorage.setItem('crm_v4', JSON.stringify(s.clients));
      if (s?.stages) localStorage.setItem('crm_stages', JSON.stringify(s.stages));
      if (s?.backups) localStorage.setItem('crm_backups', JSON.stringify(s.backups));
      sessionStorage.setItem('__crm_test_seeded', '1');
    }
  }, seed || {});
  await page.goto('/index.html');
  // Wait for the board or main content to render.
  await page.waitForSelector('.topbar', { state: 'visible' });
}

export async function readStorage(page, key) {
  return page.evaluate((k) => {
    const v = localStorage.getItem(k);
    try { return v ? JSON.parse(v) : null; } catch { return v; }
  }, key);
}

export async function writeStorage(page, key, value) {
  await page.evaluate(({ k, v }) => {
    localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
  }, { k: key, v: value });
}

/** Convenience: build a minimal valid client object. */
export function makeClient(overrides = {}) {
  const id = overrides.id || ('c_' + Math.random().toString(36).slice(2, 8));
  return {
    id,
    name: 'Тест Клиент',
    company: 'ООО Тест',
    phones: [{ num: '+7 900 000 00 00', msn: 'phone' }],
    stage: 0,
    createdAt: new Date().toISOString(),
    stageHistory: [{ stage: 0, stageName: 'База Лидов', date: new Date().toISOString() }],
    tasks: [],
    notes: [],
    chips: [],
    contacts: [],
    ...overrides,
  };
}

/** Open a client's detail modal by name (partial match). */
export async function openClientByName(page, name) {
  const card = page.locator('.card').filter({ hasText: name }).first();
  await card.waitFor({ state: 'visible' });
  await card.click();
  await page.locator('#modal-detail.open').waitFor({ state: 'visible' });
}

export async function closeDetail(page) {
  await page.locator('#modal-detail .modal-close').click();
  await page.locator('#modal-detail.open').waitFor({ state: 'hidden' });
}

/** Switch to a tab inside the detail modal. */
export async function switchDetailTab(page, tab) {
  await page.locator(`#tab-${tab}`).click();
  await expect(page.locator(`#panel-${tab}`)).toBeVisible();
}

/** Return all client card display names on the current board. */
export async function boardCardNames(page) {
  return page.locator('.card .card-name').allTextContents();
}

export { expect };
