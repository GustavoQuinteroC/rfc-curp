import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (e) => { throw e; });
  await page.goto('./');
});

test('desglosa un RFC válido', async ({ page }) => {
  await page.getByLabel('RFC o CURP').fill('gode-561231-gr8');
  await expect(page.locator('.veredicto__titulo')).toHaveText('Válido: RFC de persona física');
  await expect(page.locator('.parte')).toHaveCount(4);
  await expect(page.locator('.parte').nth(1)).toContainText('Nació 1956-12-31');
});

test('marca la parte con error en una CURP', async ({ page }) => {
  await page.getByLabel('RFC o CURP').fill('BOXW310820HNERXN08');
  await expect(page.locator('.veredicto__titulo')).toHaveText('No es válido');
  await expect(page.locator('.parte--mal')).toHaveText(/8/);
  await expect(page.locator('.veredicto li')).toContainText('debería ser "9"');
});

test('revisa una lista y descarga el CSV', async ({ page }) => {
  await page.getByLabel('Lista de claves').fill('GODE561231GR8\nEKU9003173C9\nBOXW310820HNERXN09\nGODE561231GR9');
  await expect(page.locator('#resumen-lote')).toHaveText('3 de 4 válidos.');
  const descarga = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Descargar resultados (CSV)' }).click();
  expect((await descarga).suggestedFilename()).toBe('rfc-curp-revisados.csv');
});
