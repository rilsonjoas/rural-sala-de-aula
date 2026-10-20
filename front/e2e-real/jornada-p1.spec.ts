import { expect, test, type Page } from '@playwright/test';

// Jornada dos requisitos P1 (RF01, RF09, RF10, RF02, RF03, RF05, RF04, RF16, RF15) pela interface,
// contra a API real. Cada execucao cria professor e aluno novos, sem depender do seed.

const sufixo = Date.now().toString(36);
const SENHA = 'umaSenha123';
const prof = { nome: `Professor ${sufixo}`, email: `prof.${sufixo}@teste.rural` };
const aluno = { nome: `Aluno ${sufixo}`, email: `aluno.${sufixo}@teste.rural` };
const turma = `Turma E2E ${sufixo}`;
const atividade = `Lista E2E ${sufixo}`;
let codigo = '';

async function cadastrar(page: Page, pessoa: { nome: string; email: string }) {
  await page.goto('/entrar');
  await page.getByRole('tab', { name: 'Criar conta' }).click();
  await page.getByLabel('Nome', { exact: true }).fill(pessoa.nome);
  await page.getByLabel('E-mail', { exact: true }).fill(pessoa.email);
  await page.getByLabel('Senha', { exact: true }).fill(SENHA);
  await page.getByRole('button', { name: 'Criar conta', exact: true }).last().click();
  await expect(page.getByRole('heading', { name: 'Minhas turmas' })).toBeVisible();
}

test.describe.configure({ mode: 'serial' });

test('RF01 cadastro, saída e login do professor', async ({ page }) => {
  await cadastrar(page, prof);
  await page.getByRole('button', { name: 'Menu da conta' }).click();
  await page.getByRole('menuitem', { name: 'Sair' }).click();
  await expect(page.getByRole('tab', { name: 'Criar conta' })).toBeVisible();
  await page.getByLabel('E-mail', { exact: true }).fill(prof.email);
  await page.getByLabel('Senha', { exact: true }).fill('senhaErrada1');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByLabel('Senha', { exact: true }).fill(SENHA);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Minhas turmas' })).toBeVisible();
});

test('RF09 e RF10 professor cria turma e atividade', async ({ page }) => {
  await page.goto('/entrar');
  await page.getByLabel('E-mail', { exact: true }).fill(prof.email);
  await page.getByLabel('Senha', { exact: true }).fill(SENHA);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Minhas turmas' })).toBeVisible();

  await page.getByRole('button', { name: 'Cadastrar turma' }).first().click();
  const folha = page.getByRole('dialog', { name: 'Nova turma' });
  await folha.getByLabel('Nome da turma').fill(turma);
  await folha.getByText('Ter', { exact: true }).click();
  await folha.getByRole('button', { name: 'Cadastrar turma' }).click();
  const aviso = folha.getByText(/Turma criada\. Código de inscrição: [A-Z2-9]{6}/);
  await expect(aviso).toBeVisible();
  codigo = ((await aviso.textContent()) ?? '').match(/[A-Z2-9]{6}/)![0];
  await folha.getByRole('button', { name: 'Concluir' }).click();

  await page.getByRole('article', { name: new RegExp(turma) }).getByRole('link', { name: /Ver (turma|atividades)/ }).click();
  await page.getByRole('button', { name: 'Atividades', exact: true }).click();
  await page.getByRole('button', { name: 'Cadastrar atividade' }).click();
  const nova = page.getByRole('dialog', { name: 'Nova atividade' });
  await nova.getByLabel('Nome da atividade').fill(atividade);
  await nova.getByRole('textbox', { name: /^Prazo final/ }).fill('2030-05-20T23:59');
  await nova.getByRole('button', { name: 'Cadastrar atividade' }).click();
  await nova.getByRole('button', { name: 'Confirmar e cadastrar' }).click();
  await expect(page.getByRole('heading', { name: atividade })).toBeVisible();
});

test('RF02, RF03, RF05 e RF04 aluno entra pelo código, filtra e entrega', async ({ page }) => {
  await cadastrar(page, aluno);

  await page.getByRole('button', { name: 'Entrar em turma' }).first().click();
  const entrar = page.getByRole('dialog', { name: /Entrar em turma/ });
  await entrar.getByLabel(/Código/).fill(codigo);
  await entrar.getByRole('button', { name: 'Entrar na turma' }).click();
  await expect(page.getByRole('article', { name: new RegExp(turma) })).toBeVisible();

  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Atividades' }).click();
  await expect(page.getByRole('heading', { name: 'Minhas atividades' })).toBeVisible();
  await page.getByRole('group', { name: 'Estado' }).getByRole('button', { name: 'Pendente', exact: true }).click();
  await expect(page.getByRole('link', { name: new RegExp(atividade) }).first()).toBeVisible();
  await page.getByRole('link', { name: new RegExp(atividade) }).first().click();

  await expect(page.getByRole('heading', { name: atividade, level: 2 })).toBeVisible();
  await page.getByLabel('Escolher arquivo').setInputFiles({ name: 'entrega-e2e.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 conteudo e2e') });
  await page.getByRole('button', { name: 'Enviar entrega' }).click();
  const secao = page.getByRole('region', { name: 'Sua entrega' });
  await expect(secao.getByText('entrega-e2e.pdf')).toBeVisible();
  await expect(secao.getByText('Entregue', { exact: true })).toBeVisible();
});

test('RF16 e RF15 professor baixa a entrega e avalia', async ({ page }) => {
  await page.goto('/entrar');
  await page.getByLabel('E-mail', { exact: true }).fill(prof.email);
  await page.getByLabel('Senha', { exact: true }).fill(SENHA);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.getByRole('article', { name: new RegExp(turma) }).getByRole('link', { name: /Ver (turma|atividades)/ }).click();
  await page.getByRole('button', { name: 'Atividades', exact: true }).click();
  await page.getByRole('article', { name: new RegExp(atividade) }).getByRole('link', { name: 'Ver entregas' }).click();

  const baixar = page.waitForEvent('download');
  await page.getByRole('button', { name: new RegExp(`^Baixar arquivo de ${aluno.nome}`) }).click();
  const arquivo = await baixar;
  expect(arquivo.suggestedFilename()).toBe('entrega-e2e.pdf');

  await page.getByRole('button', { name: new RegExp(`^Avaliar entrega de ${aluno.nome}`) }).click();
  const avaliar = page.getByRole('dialog', { name: 'Avaliar entrega' });
  await avaliar.getByLabel('Nota (0 a 10)').fill('9,5');
  await avaliar.getByLabel(/Comentário privado/).fill('Bom trabalho, e2e');
  await avaliar.getByRole('button', { name: 'Salvar avaliação' }).click();
  await expect(page.getByText(/1 entrega · 0 com atraso · 1 avaliada/)).toBeVisible();
});

test('RF15 aluno vê a nota e a atividade concluída', async ({ page }) => {
  await page.goto('/entrar');
  await page.getByLabel('E-mail', { exact: true }).fill(aluno.email);
  await page.getByLabel('Senha', { exact: true }).fill(SENHA);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Atividades' }).click();
  await page.getByRole('group', { name: 'Estado' }).getByRole('button', { name: 'Concluída', exact: true }).click();
  await page.getByRole('link', { name: new RegExp(atividade) }).first().click();
  const secao = page.getByRole('region', { name: 'Sua entrega' });
  await expect(secao.getByText(/9,5/)).toBeVisible();
});
