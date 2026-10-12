import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Auditoria automática (axe, WCAG 2.2 A e AA) das telas e dos estados principais.
// Atenção: axe não prova conformidade (não avalia a qualidade de rótulos nem a ordem de foco); ele pega o mecânico.
const TURMA_A = '10000000-0000-4000-8000-000000000001';
const A_LISTA_0 = '20000000-0000-4000-8000-000000000005';
const A_LISTA_1 = '20000000-0000-4000-8000-000000000001';
const A_LISTA_2 = '20000000-0000-4000-8000-000000000003';
const A_PROVA_1 = '20000000-0000-4000-8000-000000000004';
const A_TRABALHO_1 = '20000000-0000-4000-8000-000000000002';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function auditar(page: Page, nome: string) {
  const resultado = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const resumo = resultado.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length}x ${v.nodes[0]?.target.join(' ')} — ${v.help}`);
  expect(resumo, `violações em ${nome}`).toEqual([]);
}

async function ir(page: Page, usuario: string, caminho: string, largura: number) {
  await page.setViewportSize({ width: largura, height: largura < 700 ? 800 : 900 });
  await page.goto(`${caminho}?mockUser=${usuario}`);
  await page.waitForSelector('h1, h2');
  await page.waitForTimeout(500);
}

for (const largura of [360, 1280]) {
  test.describe(`largura ${largura}`, () => {
    test('entrar e criar conta', async ({ page }) => {
      await ir(page, '', '/entrar', largura);
      await auditar(page, 'entrar');
      await page.getByRole('tab', { name: 'Criar conta' }).click();
      await auditar(page, 'criar conta');
      await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
      await auditar(page, 'criar conta com erros');
    });

    test('aluna: turmas, turma, minhas atividades, detalhes', async ({ page }) => {
      await ir(page, 'aluna', '/turmas', largura);
      await auditar(page, 'turmas (aluna)');
      await page.getByRole('button', { name: 'Entrar em turma' }).first().click();
      await auditar(page, 'folha entrar em turma');
      await page.keyboard.press('Escape');

      for (const [id, nome] of [
        [TURMA_A, 'turma (aluna)'],
      ] as const) {
        await ir(page, 'aluna', `/turmas/${id}`, largura);
        await auditar(page, nome);
      }
      await ir(page, 'aluna', '/atividades', largura);
      await auditar(page, 'minhas atividades');
      for (const [id, nome] of [
        [A_LISTA_1, 'detalhe pendente'],
        [A_LISTA_0, 'detalhe atrasada'],
        [A_TRABALHO_1, 'detalhe entregue'],
        [A_LISTA_2, 'detalhe entregue com atraso'],
        [A_PROVA_1, 'detalhe concluída'],
      ] as const) {
        await ir(page, 'aluna', `/atividades/${id}`, largura);
        await auditar(page, nome);
      }
      await ir(page, 'aluna', '/rota-que-nao-existe', largura);
      await auditar(page, '404');
    });

    test('professor: turmas, turma, nova atividade, entregas, avaliar', async ({ page }) => {
      await ir(page, 'professor', '/turmas', largura);
      await auditar(page, 'turmas (professor)');
      await page.getByRole('button', { name: 'Cadastrar turma' }).first().click();
      await auditar(page, 'folha nova turma');
      await page.keyboard.press('Escape');

      await ir(page, 'professor', `/turmas/${TURMA_A}`, largura);
      await auditar(page, 'turma (professor)');
      await page.getByRole('button', { name: 'Cadastrar atividade' }).first().click();
      await auditar(page, 'folha nova atividade');
      await page.keyboard.press('Escape');

      await ir(page, 'professor', `/atividades/${A_LISTA_2}/entregas`, largura);
      await auditar(page, 'entregas');
      await page.getByRole('button', { name: /^Avaliar entrega de Maria/ }).click();
      await auditar(page, 'folha avaliar');
    });
  });
}
