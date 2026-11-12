import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';

// Jornada dos grupos (RF06, RF07 e RF12) pela interface, contra a API real.
// Cada execução cria professor e três alunos novos; a turma e as inscrições são feitas pela API.

const sufixo = Date.now().toString(36);
const SENHA = 'umaSenha123';
const pessoa = (papel: string) => ({ nome: `${papel} ${sufixo}`, email: `${papel.toLowerCase()}.grupos.${sufixo}@teste.rural` });
const prof = pessoa('Professora');
const ana = pessoa('Ana');
const beto = pessoa('Beto');
const caio = pessoa('Caio');
const nomeGrupo = `Time ${sufixo}`;

let tid = '';
let aid = '';
const nomeProjeto = `Projeto ${sufixo}`;
const contextos: BrowserContext[] = [];

async function entrar(browser: Browser, quem: { nome: string; email: string }): Promise<Page> {
  const ctx = await browser.newContext();
  contextos.push(ctx);
  const r = await ctx.request.post('/api/v1/auth/register', { data: { nome: quem.nome, email: quem.email, senha: SENHA } });
  expect(r.status()).toBe(201);
  return ctx.newPage();
}

test.describe.configure({ mode: 'serial' });

let pProf: Page;
let pAna: Page;
let pBeto: Page;
let pCaio: Page;

test.beforeAll(async ({ browser }) => {
  pProf = await entrar(browser, prof);
  const t = await pProf.context().request.post('/api/v1/turmas', {
    data: { nome: `Turma grupos ${sufixo}`, disciplina: 'E2E', semestre: '2026.2', diasAula: [2, 4], descricao: 'e2e' },
  });
  expect(t.status()).toBe(201);
  const turma = await t.json();
  tid = turma.id;
  const a = await pProf.context().request.post(`/api/v1/turmas/${tid}/atividades`, {
    data: { nome: nomeProjeto, descricao: 'projeto em grupo', tipo: 'PROJETO_EM_GRUPO', prazoFinal: '2030-05-20T23:59:00Z', disponivelEm: '2026-01-01T00:00:00Z' },
  });
  expect(a.status()).toBe(201);
  aid = (await a.json()).id;
  for (const quem of [ana, beto, caio]) {
    const p = await entrar(browser, quem);
    const r = await p.context().request.post('/api/v1/inscricoes', { data: { codigo: turma.codigo } });
    expect([200, 201]).toContain(r.status());
    if (quem === ana) pAna = p;
    if (quem === beto) pBeto = p;
    if (quem === caio) pCaio = p;
  }
});

test.afterAll(async () => {
  await Promise.all(contextos.map((c) => c.close()));
});

const abaGrupos = async (page: Page) => {
  await page.goto(`/turmas/${tid}?aba=grupos`);
  await expect(page.getByText(/Grupos de \d+ a \d+ integrantes/)).toBeVisible();
};

test('RF06 a aluna solicita um grupo com um colega e ele fica aguardando aprovação', async () => {
  await abaGrupos(pAna);
  await expect(pAna.getByText('Grupos de 2 a 5 integrantes · sem limite de grupos')).toBeVisible();

  await pAna.getByRole('button', { name: 'Solicitar grupo' }).click();
  const folha = pAna.getByRole('dialog', { name: 'Solicitar grupo' });
  await folha.getByLabel('Nome do grupo').fill(nomeGrupo);
  await folha.getByRole('checkbox', { name: beto.nome }).click();
  await folha.getByRole('button', { name: 'Enviar solicitação' }).click();

  const meu = pAna.getByRole('region', { name: 'Meu grupo' });
  await expect(meu.getByText(nomeGrupo)).toBeVisible();
  await expect(meu.getByText('Aguardando aprovação')).toBeVisible();
});

test('RF12 a professora aprova a solicitação', async () => {
  await abaGrupos(pProf);
  const pendentes = pProf.getByRole('region', { name: 'Solicitações pendentes' });
  await expect(pendentes.getByText(nomeGrupo)).toBeVisible();
  await pendentes.getByRole('button', { name: `Aprovar ${nomeGrupo}` }).click();

  const aprovados = pProf.getByRole('region', { name: 'Grupos aprovados' });
  await expect(aprovados.getByText(nomeGrupo)).toBeVisible();
});

test('RF06 sem grupo aprovado o aluno é levado aos grupos; com grupo aprovado entrega em nome do grupo', async () => {
  // Caio ainda não tem grupo aprovado (antes de entrar no grupo da Ana e do Beto)
  await pCaio.goto(`/atividades/${aid}`);
  await expect(pCaio.getByText(/a entrega é feita em nome de um grupo aprovado/)).toBeVisible();
  await expect(pCaio.getByRole('button', { name: 'Enviar entrega' })).toHaveCount(0);

  await pAna.goto(`/atividades/${aid}`);
  const secao = pAna.getByRole('region', { name: 'Entrega do grupo' });
  await secao.getByLabel('Escolher arquivo').setInputFiles({ name: 'projeto.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.4 projeto do grupo') });
  await secao.getByRole('button', { name: 'Enviar entrega' }).click();
  await expect(secao.getByText(new RegExp(`Grupo ${nomeGrupo}: .*enviada por ${ana.nome}`))).toBeVisible();

  // o colega de grupo vê a mesma entrega
  await pBeto.goto(`/atividades/${aid}`);
  await expect(pBeto.getByRole('region', { name: 'Entrega do grupo' }).getByText('projeto.pdf')).toBeVisible();
});

test('RF15 e RF16 a professora vê uma linha por grupo e avalia; a nota vale para o colega de grupo', async () => {
  await pProf.goto(`/atividades/${aid}/entregas`);
  const item = pProf.getByRole('row', { name: new RegExp(`Grupo ${nomeGrupo}`) });
  await expect(item).toBeVisible();
  await item.getByRole('button', { name: `Avaliar entrega de Grupo ${nomeGrupo}` }).click();
  const folha = pProf.getByRole('dialog');
  await folha.getByLabel('Nota (0 a 10)').fill('9');
  await folha.getByRole('button', { name: 'Salvar avaliação' }).click();
  await expect(pProf.getByText('Avaliação salva.')).toBeVisible();

  await pBeto.goto(`/atividades/${aid}`);
  await expect(pBeto.getByRole('region', { name: 'Entrega do grupo' }).getByText('Nota 9,0')).toBeVisible();
});

test('RF06 outro aluno vê o grupo aprovado e entra nele', async () => {
  await abaGrupos(pCaio);
  const aprovados = pCaio.getByRole('region', { name: 'Grupos aprovados' });
  await expect(aprovados.getByText(nomeGrupo)).toBeVisible();
  await aprovados.getByRole('button', { name: `Entrar no grupo ${nomeGrupo}` }).click();

  const meu = pCaio.getByRole('region', { name: 'Meu grupo' });
  await expect(meu.getByText(nomeGrupo)).toBeVisible();
  await expect(meu.getByText('Aprovado')).toBeVisible();
  await expect(meu).toContainText(caio.nome);
});

test('RF07 o aluno sai do grupo aprovado e volta a poder solicitar', async () => {
  await abaGrupos(pCaio);
  await pCaio.getByRole('button', { name: 'Sair do grupo' }).click();
  await pCaio.getByRole('dialog', { name: 'Sair do grupo?' }).getByRole('button', { name: 'Confirmar saída' }).click();

  await expect(pCaio.getByRole('button', { name: 'Solicitar grupo' })).toBeVisible();
  await expect(pCaio.getByRole('region', { name: 'Meu grupo' })).toHaveCount(0);
});

test('RF07 o grupo aprovado no mínimo não deixa mais ninguém sair e mostra a regra', async () => {
  await abaGrupos(pBeto);
  await pBeto.getByRole('button', { name: 'Sair do grupo' }).click();
  await pBeto.getByRole('dialog', { name: 'Sair do grupo?' }).getByRole('button', { name: 'Confirmar saída' }).click();

  // Ana e Beto são 2 e o mínimo é 2: o back-end recusa e a tela explica
  await expect(pBeto.getByText(/menos de 2 integrantes/)).toBeVisible();
});

test('RF12 a professora muda as regras e a aluna vê o novo limite', async () => {
  await abaGrupos(pProf);
  const minimo = pProf.getByLabel('Mínimo de integrantes');
  await minimo.fill('1');
  const maximo = pProf.getByLabel('Máximo de integrantes');
  await maximo.fill('3');
  await pProf.getByLabel('Limite de grupos da turma').fill('4');
  await pProf.getByRole('button', { name: 'Salvar regras' }).click();
  await expect(pProf.getByText('Regras salvas.')).toBeVisible();

  await abaGrupos(pAna);
  await expect(pAna.getByText('Grupos de 1 a 3 integrantes · até 4 grupos na turma')).toBeVisible();
});

test('RF13 o aviso só para o grupo chega aos integrantes e não aos outros alunos', async () => {
  const texto = `Reunião do grupo ${sufixo}`;
  await pProf.goto(`/turmas/${tid}`);
  await pProf.getByText('Escreva um comunicado para a turma...').click();
  await pProf.getByPlaceholder(/Escreva um comunicado ou orientação/).fill(texto);
  await pProf.getByRole('radio', { name: 'Só para grupos ou alunos' }).click();
  await pProf.getByRole('group', { name: 'Grupos' }).getByRole('checkbox', { name: nomeGrupo }).click();
  await pProf.getByRole('button', { name: 'Postar' }).click();
  await expect(pProf.getByText(texto)).toBeVisible();
  await expect(pProf.getByText(new RegExp(`Só para: .*${ana.nome}`))).toBeVisible();

  await pBeto.goto(`/turmas/${tid}`);
  await expect(pBeto.getByText(texto)).toBeVisible();

  await pCaio.goto(`/turmas/${tid}`);
  await expect(pCaio.getByText('Nenhum aviso postado ainda.')).toBeVisible();
  await expect(pCaio.getByText(texto)).toHaveCount(0);
});
