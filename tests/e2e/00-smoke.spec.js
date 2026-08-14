// 00-smoke — basic sanity that the app loads and the default stages exist.

import { test } from '@playwright/test';
import { openCRM, expect } from './helpers.js';

test.describe('Smoke', () => {
  test('app loads and shows the five default stages', async ({ page }) => {
    // NB: "База Лидов" is added by the one-time leads-import IIFE. Our test
    // helper suppresses that import (crm_leads_imported=1) so we get the
    // hardcoded default STAGES list — 5 columns.
    await openCRM(page);
    const columns = page.locator('.col .col-title');
    await expect(columns).toHaveCount(5);
    await expect(columns.nth(0)).toContainText('Первый звонок');
    await expect(columns.nth(4)).toContainText('Закрытие сделки');
  });

  test('client counter shows 0 with a clean base', async ({ page }) => {
    await openCRM(page);
    await expect(page.locator('#s-total')).toHaveText('0');
  });

  test('scroll-to-top button is hidden at rest', async ({ page }) => {
    await openCRM(page);
    await expect(page.locator('#scroll-top-btn')).toBeHidden();
  });
});
