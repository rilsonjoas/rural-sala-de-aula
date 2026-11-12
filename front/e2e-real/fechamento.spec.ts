import { expect, test } from '@playwright/test';

// Calendário do professor, membros da turma, excluir turma e excluir a própria conta, pela interface e contra a API real.

const sufixo = Date.now().toString(36);
const SENHA = 'umaSenha123';
const prof = { nome: `Professor fim ${sufixo}`, email: `prof.fim.${sufixo}@teste.rural` };
const aluno = { nome: `Aluno fim ${sufixo}`, email: `aluno.fim.${sufixo}@teste.rural` };
const nomeTurma = `Turma fim ${sufixo}`;
const nomeAtividade = `Lista fim ${sufixo}`;

test('calendário do professor, membros, excluir turma e excluir conta', async ({ browser }) => {
  const ctxProf = await browser.newContext();
  const ctxAluno = await browser.newContext();
  try {
    for (const [ctx, quem] of [[ctxProf, prof], [ctxAluno, aluno]] as const) {
      const r = await ctx.request.post('/api/v1/auth/register', { data: { nome: quem.nome, email: quem.email, senha: SENHA } });
      expect(r.status()).toBe(201);
    }
    const t = await ctxProf.request.post('/api/v1/turmas', {
      data: { nome: nomeTurma, disciplina: 'E2E', semestre: '2026.2', diasAula: [2], descricao: 'fechamento' },
    });
    const turma = await t.json();
    const prazo = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
    const a = await ctxProf.request.post(`/api/v1/turmas/${turma.id}/atividades`, {
      data: { nome: nomeAtividade, descricao: 'd', tipo: 'LISTA_DE_EXERCICIO', prazoFinal: prazo, disponivelEm: '2026-01-01T00:00:00Z' },
    });
    expect(a.status()).toBe(201);
    expect((await ctxAluno.request.post('/api/v1/inscricoes', { data: { codigo: turma.codigo } })).status()).toBe(201);

    const pProf = await ctxProf.newPage();
    const pAluno = await ctxAluno.newPage();

    // RF08: o professor vê o prazo das turmas que leciona
    await pProf.goto('/calendario');
    await expect(pProf.getByRole('link', { name: new RegExp(nomeAtividade) })).toBeVisible();

    // membros da turma
    await pAluno.goto(`/turmas/${turma.id}`);
    await pAluno.getByRole('button', { name: 'Membros' }).click();
    await expect(pAluno.getByRole('list', { name: 'Alunos da turma' }).getByText(aluno.nome)).toBeVisible();
    await expect(pAluno.getByText(prof.nome, { exact: true })).toBeVisible();

    // o aluno exclui a própria conta
    await pAluno.getByRole('button', { name: 'Menu da conta' }).click();
    await pAluno.getByRole('menuitem', { name: 'Excluir minha conta' }).click();
    const folhaAluno = pAluno.getByRole('dialog', { name: 'Excluir minha conta?' });
    await folhaAluno.getByLabel('Sua senha').fill(SENHA);
    await folhaAluno.getByRole('button', { name: 'Excluir minha conta' }).click();
    await expect(pAluno.getByRole('tab', { name: 'Criar conta' })).toBeVisible();

    // o professor não exclui a conta enquanto leciona; exclui a turma e depois a conta
    await pProf.goto(`/turmas/${turma.id}`);
    await pProf.getByRole('button', { name: 'Menu da conta' }).click();
    await pProf.getByRole('menuitem', { name: 'Excluir minha conta' }).click();
    const folhaProf = pProf.getByRole('dialog', { name: 'Excluir minha conta?' });
    await folhaProf.getByLabel('Sua senha').fill(SENHA);
    await folhaProf.getByRole('button', { name: 'Excluir minha conta' }).click();
    await expect(folhaProf.getByRole('alert')).toContainText('Você leciona 1 turma');
    await pProf.keyboard.press('Escape');

    await pProf.getByRole('button', { name: 'Excluir turma' }).click();
    await pProf.getByRole('dialog', { name: 'Excluir a turma?' }).getByRole('button', { name: 'Excluir turma' }).click();
    await expect(pProf.getByRole('heading', { name: 'Minhas turmas' })).toBeVisible();
    await expect(pProf.getByText(nomeTurma)).toHaveCount(0);
  } finally {
    await ctxProf.close();
    await ctxAluno.close();
  }
});
