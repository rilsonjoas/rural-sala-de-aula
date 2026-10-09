import { expect, test } from '@playwright/test';

test('abre o shell do Rural Sala de Aula', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Rural Sala de Aula' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Turmas' })).toBeVisible();
});
