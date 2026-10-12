import { expect, test, type Page } from '@playwright/test';

// O app roda com a API simulada (VITE_API_MOCK=true). A sessão e os dados vivem na memória da página:
// por isso cada jornada começa em /entrar?mockUser= (deslogado) e segue só por navegação interna, sem recarregar.

async function entrar(page: Page, email: string) {
  await page.goto('/entrar?mockUser=');
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill('senha1234');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Minhas turmas' })).toBeVisible();
}

test('o visitante vê a tela de entrada, sem o menu do app', async ({ page }) => {
  await page.goto('/?mockUser=');

  await expect(page.getByRole('heading', { name: 'Rural Sala de Aula', level: 1 })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Criar conta' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toHaveCount(0);
});

test('aluna: entra, abre a turma, envia a entrega e vê o estado mudar', async ({ page }) => {
  await entrar(page, 'maria@ufrpe.br');

  await page.getByRole('article', { name: /Turma A — Algoritmos/ }).getByRole('link', { name: /Ver atividades/ }).click();
  await expect(page.getByRole('heading', { name: 'Turma A — Algoritmos', level: 2 })).toBeVisible();
  await page.getByRole('link', { name: /Lista 1 —/ }).click();

  await expect(page.getByRole('heading', { name: /Lista 1 —/, level: 2 })).toBeVisible();
  await page.getByLabel('Escolher arquivo').setInputFiles({ name: 'lista1.pdf', mimeType: 'application/pdf', buffer: Buffer.from('conteudo') });
  await page.getByRole('button', { name: 'Enviar entrega' }).click();

  const secao = page.getByRole('region', { name: 'Sua entrega' });
  await expect(secao.getByText('lista1.pdf')).toBeVisible();
  await expect(secao.getByText('Entregue', { exact: true })).toBeVisible();

  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Atividades' }).click();
  await expect(page.getByRole('heading', { name: 'Minhas atividades' })).toBeVisible();
  await page.getByRole('group', { name: 'Estado' }).getByRole('button', { name: 'Entregue', exact: true }).click();
  // no desktop a lista vira tabela: a atividade aparece como link da linha
  await expect(page.getByRole('table').getByRole('link', { name: /Lista 1 —/ })).toBeVisible();
  await expect(page.getByRole('row')).toHaveCount(4); // cabeçalho + Trabalho 1, Modelagem e a Lista 1 recém-entregue
});

test('professor: cria turma, cadastra atividade e avalia uma entrega', async ({ page }) => {
  await entrar(page, 'marcos@ufrpe.br');

  await page.getByRole('button', { name: 'Cadastrar turma' }).first().click();
  const folha = page.getByRole('dialog', { name: 'Nova turma' });
  await folha.getByLabel('Nome da turma').fill('Turma D — Redes');
  await folha.getByLabel('Disciplina').fill('Redes de Computadores');
  await folha.getByText('Ter', { exact: true }).click();
  await folha.getByRole('button', { name: 'Cadastrar turma' }).click();
  await expect(folha.getByText(/Turma criada\. Código de inscrição: [A-Z2-9]{6}/)).toBeVisible();
  await folha.getByRole('button', { name: 'Concluir' }).click();

  await page.getByRole('article', { name: /Turma A — Algoritmos/ }).getByRole('link', { name: /Ver atividades/ }).click();
  await page.getByRole('button', { name: 'Cadastrar atividade' }).click();
  const nova = page.getByRole('dialog', { name: 'Nova atividade' });
  await nova.getByLabel('Nome da atividade').fill('Lista 9 — Grafos');
  await nova.getByLabel('Prazo final').fill('2030-05-20T23:59');
  await nova.getByRole('button', { name: 'Cadastrar atividade' }).click();
  await nova.getByRole('button', { name: 'Confirmar e cadastrar' }).click();
  await expect(page.getByRole('heading', { name: 'Lista 9 — Grafos' })).toBeVisible();

  await page.getByRole('article', { name: /Lista 2 —/ }).getByRole('link', { name: 'Ver entregas' }).click();
  await expect(page.getByText('4 entregas · 3 com atraso · 2 avaliadas')).toBeVisible();
  await page.getByRole('button', { name: /^Avaliar entrega de Maria/ }).click();
  const avaliar = page.getByRole('dialog', { name: 'Avaliar entrega' });
  await avaliar.getByLabel('Nota (0 a 10)').fill('9,5');
  await avaliar.getByRole('button', { name: 'Salvar avaliação' }).click();
  await expect(page.getByText('4 entregas · 3 com atraso · 3 avaliadas')).toBeVisible();
});

test('no celular a navegação é a barra inferior; no desktop são links no cabeçalho', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await entrar(page, 'maria@ufrpe.br');
  const nav = page.getByRole('navigation', { name: 'Navegação principal' });
  const caixaMobile = await nav.boundingBox();
  expect(caixaMobile!.y).toBeGreaterThan(500); // embaixo da tela
  expect(caixaMobile!.width).toBeGreaterThanOrEqual(355);

  await page.setViewportSize({ width: 1280, height: 800 });
  const caixaDesktop = await nav.boundingBox();
  expect(caixaDesktop!.y).toBeLessThan(64); // dentro do cabeçalho (64 px de altura), não embaixo
  expect(caixaDesktop!.height).toBeLessThan(64);
  expect(caixaDesktop!.width).toBeLessThan(400);
});

test('o professor não tem a barra inferior no celular', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await entrar(page, 'marcos@ufrpe.br');

  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeHidden();
});
