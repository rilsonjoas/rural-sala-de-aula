# Backlog — Rural Sala de Aula

Tudo o que **não** é P1. Sem datas. O escopo da entrega de 19/10/2026 está no [README](../README.md).

## Requisitos funcionais (do documento de requisitos)

| RF | O que é | Observações |
|---|---|---|
| RF03b | Sair da turma (aluno) | o documento numera duas vezes o RF03 |
| RF06 | Solicitar e participar de grupos | atividade "Em grupo" já pode ser cadastrada, mas o aluno entrega individualmente até este RF entrar |
| RF07 | Sair do grupo | |
| RF08 | Calendário com carga semanal (pesada, média, livre) | |
| RF11 | Atualizar atividades | o P1 não edita atividade, então a folha Nova atividade pede confirmação antes de salvar |
| RF12 | Configurar e aprovar grupos | |
| RF13 | Postar avisos | |
| RF14 | Comentar e responder comentários | |
| RF17 | Receber notificações | |

## Requisitos não funcionais

| RNF | O que falta |
|---|---|
| RNF01 Usabilidade | medir com usuários reais (aluno e professor) depois do P1 |
| RNF02 Integridade das entregas | o P1 guarda aluno, atividade e `enviada_em`. Falta guardar o **hash (SHA-256) do arquivo** para provar que não foi alterado |
| RNF03 Escalabilidade | paginação das listas, índices por consulta real, armazenamento de arquivos em bucket (ADR-0003) |

## Produto e interface

- **Logo própria**, inspirada nos conceitos da UFRPE e não no desenho (o manual veda alterar o símbolo). Troca o capelo provisório do cabeçalho.
- **Lista de inscritos que ainda não entregaram**, na tela de entregas do professor (hoje só aparece quem entregou).
- **Contador de entregas a avaliar** no card de turma do professor.
- **Convite ou aprovação para o papel Professor** (hoje qualquer pessoa escolhe "Professor" ao criar a conta).
- Recuperação de senha, edição de perfil e tema escuro.
- Filtros do aluno salvos no servidor (hoje ficam no navegador).
- Versão desktop das telas no Stitch: Turmas com menu lateral, Minhas atividades (tabela) e Entregas (tabela); o resto segue o DESIGN.md §5.
- Fonte oficial da UFRPE (Akzidenz-Grotesk ou Myriad Pro), se a universidade exigir.

## Back-end e infraestrutura (com o Luiz)

- **P1, mas ainda não implementado:** Spring Security com sessão em cookie httpOnly (ADR-0004) e proteção contra CSRF; todos os endpoints do `docs/openapi.yaml`; armazenamento dos arquivos (ADR-0003).
- Confirmar que o professor define só o **prazo final** (a data de entrega é a do aluno) e ajustar o texto do RF10 no documento de requisitos.
- Confirmar que o aluno entrega individualmente atividades "Em grupo" até os grupos entrarem.
- Antivírus ou verificação do conteúdo dos arquivos enviados.
- Java 25 (LTS) e Postgres 17/18: hoje Java 21 e Postgres 16, alinhado ao Postgres compartilhado do Hetzner. Subir os dois juntos com a infra.
- Primeiro deploy no Hetzner: `1 - Pessoal/hetzner-infra/rural-sala-de-aula/README.md`.
