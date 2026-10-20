# Requisitos — texto de origem

Cópia do documento "Projeto de Software Educacional — Rural Sala de Aula" e do relatório da reunião, recebidos em 08/10/2026 (Luiz Felipe e Rilson Joás). **É a fonte dos requisitos**; o que o projeto decidiu diferente está na seção final.

> O primeiro texto recebido (lista de prioridades P1/P2/P3) veio **cortado no RF05**. A classificação dos demais RFs além dos nove P1 não foi vista; tratamos tudo fora dos nove como backlog.

## Proposta

A proposta do projeto é desenvolver uma alternativa ao Google Classroom voltada à organização das atividades acadêmicas e à comunicação entre alunos e professores. O sistema terá como foco central facilitar o gerenciamento das atividades de usuários matriculados em múltiplas disciplinas, reunindo essas informações em uma interface que permita ao usuário visualizar e organizar as informações de acordo com suas necessidades.

A aplicação será destinada principalmente a alunos e professores, oferecendo funcionalidades específicas de acordo com o papel desempenhado por cada usuário. Os professores poderão administrar suas turmas, cadastrar e atualizar atividades, definir prazos e outras informações relevantes e publicar avisos para os alunos. Os alunos poderão inscrever-se em turmas, acompanhar suas atividades, realizar entregas e participar das discussões relacionadas às atividades.

O sistema será capaz de organizar e apresentar as atividades do usuário de acordo com diferentes critérios, permitindo que cada aluno escolha quais informações deseja visualizar e em qual ordem elas serão apresentadas. Entre os critérios disponíveis estarão o prazo de entrega, a complexidade da atividade, seu estado, tipo, modalidade e turma. Dessa forma, o usuário poderá, por exemplo, visualizar primeiro as atividades de maior complexidade ou aquelas cujo prazo de entrega esteja mais próximo.

Também será disponibilizado um calendário capaz de representar a carga acadêmica de cada semana, considerando o volume e as características das atividades previstas para cada período.

A aplicação permitirá ainda que os usuários personalizem a apresentação das informações, por meio de filtros e opções de ordenação. Essa personalização será individual, de modo que as escolhas de um usuário não alterem a forma como as informações são apresentadas aos demais.

O sistema também manterá o acompanhamento do estado das atividades, permitindo identificar atividades pendentes, concluídas, entregues e atrasadas. Além disso, fornecerá notificações sobre prazos próximos, alterações nas atividades e novos avisos publicados pelos professores.

Para atividades realizadas em conjunto, os alunos poderão solicitar a criação e participar de grupos dentro de uma determinada turma. A criação de um grupo dependerá do consentimento do professor responsável pela turma. Os grupos poderão ser configurados de acordo com limites de integrantes definidos pelo professor. As atividades poderão ser associadas a um grupo, permitindo que seus integrantes tenham acesso compartilhado à mesma atividade e que um dos integrantes realize uma única entrega em nome do grupo.

Os alunos poderão realizar a entrega de trabalhos diretamente pelo sistema, através do envio de arquivos associados às atividades. As entregas terão sua data e horário registrados e poderão posteriormente ser acessadas e baixadas pelos professores. Os professores poderão avaliar as entregas, registrar notas e adicionar comentários particulares aos alunos ou grupos.

A comunicação entre professores e alunos ocorrerá por meio de avisos publicados pelos professores e comentários realizados pelos alunos nas atividades. Os alunos poderão realizar comentários relacionados às atividades, e os professores poderão responder a esses comentários.

## Stakeholders

- P1: Alunos e Professores
- P2: Coordenações dos cursos, Departamentos, Reitoria e Administradores/TI
- P3: Google Classroom, Sociedade e MEC

## Requisitos funcionais

| RF | Título | Texto |
|---|---|---|
| RF01 | Cadastro e Login | Os usuários devem ser capazes de criar contas no sistema utilizando as informações de nome, e-mail e senha e utilizar essas informações para acessar a conta cadastrada. |
| RF02 | Inscrever-se em turma | Os alunos devem ser capazes de se inscrever em turmas utilizando o código fornecido pelo professor. |
| RF03 | Consultar turma | Os alunos devem ser capazes de consultar as turmas que ele se inscreveu. |
| RF03 (repetido) | Sair da turma | Os alunos devem ser capazes de sair das turmas nas quais estejam previamente inscritos. |
| RF04 | Entregar atividade | Os alunos devem ser capazes de enviar arquivos associados às atividades, em formatos como PDF, apresentação de slides ou arquivo de texto. |
| RF05 | Acessar e organizar atividades | Os alunos devem ser capazes de acessar as atividades atribuídas a eles e utilizar filtros e opções de ordenação para definir quais atividades serão apresentadas e em qual ordem. Os filtros e critérios de ordenação devem contemplar, entre outros: estado da atividade (pendente, entregue, concluída, atrasada ou entregue com atraso); prazo de entrega; nível de complexidade; tipo de atividade; modalidade individual ou em grupo; turma. O aluno poderá, por exemplo, ordenar as atividades da maior para a menor complexidade ou pelo prazo de entrega mais próximo. |
| RF06 | Solicitar e participar de grupos | Os alunos devem ser capazes de solicitar a criação de grupos dentro de uma determinada turma e participar de grupos previamente aprovados pelo professor. A solicitação deve conter o nome do grupo e os alunos que farão parte dele. A criação do grupo dependerá do consentimento do professor responsável pela turma. Os alunos pertencentes ao mesmo grupo devem compartilhar as atividades configuradas como atividades em grupo, sendo possível que um integrante realize a entrega em nome do grupo. |
| RF07 | Sair do grupo | Os alunos devem ser capazes de sair dos grupos dos quais participam, respeitando as regras definidas pelo professor para a formação dos grupos. |
| RF08 | Acessar calendário | Os alunos e professores devem ser capazes de acessar um calendário contendo as atividades atribuídas às turmas. O calendário deve apresentar a carga acadêmica de cada semana, classificando-a como pesada, média ou livre, considerando a quantidade e a complexidade das atividades, trabalhos e provas previstos para o período. |
| RF09 | Cadastrar turmas | Os professores devem ser capazes de cadastrar turmas contendo informações como nome da turma, nome da disciplina, semestre e dias de aula. |
| RF10 | Cadastrar atividades | Os professores devem ser capazes de cadastrar atividades nas turmas que administram, contendo atributos como nome, descrição, complexidade, tipo de atividade, data de entrega, prazo final, modalidade individual ou em grupo e data em que a atividade ficará disponível aos alunos. |
| RF11 | Atualizar atividades | Os professores devem ser capazes de alterar as informações das atividades cadastradas nas turmas que administram, incluindo datas, descrição, complexidade, tipo e modalidade da atividade. |
| RF12 | Configurar e aprovar grupos | Os professores devem ser capazes de configurar o número mínimo e máximo de integrantes dos grupos e a quantidade de grupos permitida na turma. Também devem ser capazes de aprovar ou reprovar as solicitações de criação de grupos realizadas pelos alunos. |
| RF13 | Postar avisos | Os professores devem ser capazes de publicar avisos para os alunos de uma turma, podendo direcioná-los para toda a turma, grupos específicos ou alunos específicos. |
| RF14 | Comentar e responder comentários | Os alunos devem ser capazes de realizar comentários relacionados às atividades das turmas das quais participam. Os professores devem ser capazes de responder aos comentários realizados pelos alunos. |
| RF15 | Avaliar entrega de atividade | Os professores devem ser capazes de avaliar as entregas realizadas pelos alunos ou grupos, registrando uma nota e adicionando comentários particulares relacionados à entrega. |
| RF16 | Acessar e baixar entregas | Os professores devem ser capazes de acessar e baixar os arquivos enviados pelos alunos ou grupos nas atividades das turmas que administram. |
| RF17 | Receber notificações | Os usuários devem ser capazes de receber notificações relacionadas às suas atividades acadêmicas, incluindo: prazos de entrega próximos; alterações nas atividades; novos avisos publicados pelos professores; outras alterações relevantes nas atividades ou turmas das quais participam. |

## Requisitos não funcionais

| RNF | Título | Texto |
|---|---|---|
| RNF01 | Usabilidade | A interface deve apresentar as informações acadêmicas de forma clara e organizada, permitindo que alunos e professores encontrem as funcionalidades e informações relevantes sem necessidade de procedimentos complexos. |
| RNF02 | Integridade das entregas | Os arquivos enviados pelos alunos devem ser armazenados de forma que sua associação à atividade, ao aluno ou ao grupo e à respectiva data e horário de entrega seja preservada. |
| RNF03 | Escalabilidade | A arquitetura do sistema deve permitir o aumento da quantidade de usuários, turmas, atividades e arquivos armazenados sem comprometer significativamente seu funcionamento. |

## Relatório da reunião (data não informada; prazo 19/10/2026)

- **Objetivo:** dividir responsabilidades e definir os requisitos prioritários a entregar até 19/10/2026.
- **Divisão:** Luiz Felipe = back-end (lógica de negócio, processamento, comunicação com o banco). Rilson Joás = front-end (interfaces e recursos de interação).
- **Escopo P1:** RF01, RF02, RF03, RF09, RF10, RF05, RF04, RF16, RF15.
- **Ordem interna:** RF04 (Entregar atividade) e RF16 (Acessar e baixar entregas) têm menor prioridade relativa e vêm depois dos demais P1, sem deixar de ser P1.
- **Encaminhamentos:** cada um conduz a sua parte; o desenvolvimento segue as prioridades; entrega e download de arquivos depois dos demais P1; a integração front-back deve permitir o funcionamento conjunto.

## Onde o projeto decidiu diferente do texto

| Ponto | Texto de origem | Decisão (08–09/10/2026) | Onde está |
|---|---|---|---|
| Numeração | dois "RF03" (consultar e sair da turma) | "Sair da turma" é **RF03b** | README, BACKLOG |
| RF10 — datas | o professor informa "data de entrega" **e** "prazo final" | o professor define só o **prazo final**; a data de entrega é a do aluno (`Entrega.enviadaEm`) | ADR-0006 |
| RF05 — "prazo de entrega" | critério de filtro e ordenação | **ordenação** por prazo final (não há filtro por intervalo de datas) | `openapi.yaml` |
| RF05 — "concluída" | estado distinto de "entregue" | "Concluída" = entrega **avaliada** pelo professor (o texto não define) | CONTEXT.md, DESIGN.md §7 |
| RF04 — formatos | "formatos como PDF, apresentação de slides ou arquivo de texto" | lista fechada: pdf, ppt, pptx, doc, docx, txt; até 25 MB | ADR-0003 |
| RF01 — papel | não diz como se define aluno ou professor | contextual por turma: quem cria leciona, quem entra estuda | ADR-0008 |
| RF06/RF12 | grupos | atividade "Em grupo" pode ser cadastrada; entrega individual até os grupos entrarem | BACKLOG |
| RF10 e RF05 — complexidade | a atividade tem "complexidade", e o aluno filtra e ordena por ela ("da maior para a menor complexidade") | **não implementada**: a atividade não tem complexidade, e o aluno não filtra nem ordena por ela. Decisão confirmada com o Luiz Felipe em conversa direta (sem data registrada) | README, BACKLOG, INTEGRACAO |
| RF10 e RF05 — modalidade | a atividade é "individual ou em grupo", e o aluno filtra por modalidade | **não implementada como campo**: o **tipo** da atividade já diz se é em grupo (`PROJETO_EM_GRUPO`), e o filtro por tipo cobre o caso. Decisão confirmada com o Luiz Felipe em conversa direta (sem data registrada) | README, BACKLOG, INTEGRACAO |
