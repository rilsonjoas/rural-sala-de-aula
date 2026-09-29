# DESIGN.md — StudyPath / Rota de Estudo

Este arquivo tem duas partes: a **spec de identidade visual** (§1 a §8, o tema *Academic Kinetic*) e, no fim, o **registro da decisão de base de componentes** (§9, shadcn/ui e a não herança do Design Narniano). Antes eram dois arquivos que só diferiam na caixa do nome — `design.md` e `DESIGN.md` — o que quebrava em qualquer sistema que não distingue maiúsculas de minúsculas. Foram unificados aqui em 2026-09-29.
**Design System & Architecture Specification**
*Academic Kinetic Theme — Mobile-First PWA (React + TypeScript + Tailwind CSS + shadcn/ui)*

---

## 1. Visão Geral & Princípios Fundamentais

O **StudyPath (Rota de Estudo)** é uma agenda acadêmica mobile-first (PWA) de alta densidade informativa e atrito operacional zero para estudantes universitários. A interface equilibra gamificação leve (XP, streak, níveis) com rigor acadêmico (colisões de prazos, cálculo de médias, controle de faltas e cancelamento pontual de aulas — UC05).

### Princípios de Design & Usabilidade

1. **Mobile-First Inegociável (360px a 430px base, escalável até 2560px)**:
   - Toda interação crítica é acessível com o polegar (Thumb Zone).
   - Touch targets mínimos de `44px x 44px` (sem dependência de hover).
   - Zero dependência de *drag-and-drop* no V1.
2. **Semana Acadêmica Padrão ISO**:
   - A grade semanal começa impreterivelmente na **Segunda-feira** (`Seg -> Ter -> Qua -> Qui -> Sex -> Sáb -> Dom`).
3. **Clareza de Estado & Não-Destrutibilidade**:
   - Ações críticas como cancelamento pontual de aula (UC05) contam com feedback visual imediato, silenciamento automático de Web Push, indicação de reversibilidade (*Desfazer*) e autorização estrita por dono (respostas `404 Not Found` em requisições de outros recursos).

### 1.1 Regras de Atribuição de Cor

Estas regras existem porque a versão anterior do documento falhava em contraste WCAG AA. Elas valem para toda cor nova.

1. **Um matiz, um trabalho, para sempre.** Antes de criar um tom, ele já tem dono. Se dois estados disputam o mesmo tom, um deles muda de matiz — nunca os dois. Um token empurrado para servir três trabalhos sempre perde no mais fraco, e é aí que o contraste quebra.
2. **Nunca comunicar estado por cor sozinha.** Todo estado carrega **cor + ícone + texto**. A cor é reforço, nunca o único canal.
3. **Gamificação não é estado.** Streak, XP e nível são decoração positiva: usam os slots neutros ou a família primary, nunca um matiz semântico reservado.
4. **Estados mínimos obrigatórios:** `loading`, `empty`, `error` e `offline`. Toda tela que busca dados precisa dos quatro, mesmo no MVP.

---

## 2. Tipografia

- **Família Tipográfica Primária**: `Plus Jakarta Sans`, sans-serif (Google Fonts).
- **Fallbacks**: `Inter`, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif.

| Token de Estilo | Tamanho / Line Height | Peso | Uso Principal |
| :--- | :--- | :--- | :--- |
| `display-lg` | 24px (1.5rem) / 1.2 | Bold (700) | Títulos principais de tela e cabeçalhos |
| `title-md` | 18px (1.125rem) / 1.3 | Semi-bold (600) | Títulos de seções, nomes de disciplinas nos cards |
| `subtitle-sm` | 15px (0.9375rem) / 1.4 | Medium (500) | Subtítulos contextuais, avisos de colisão |
| `body-md` | 14px (0.875rem) / 1.5 | Regular (400) / Medium (500) | Texto descritivo, corpo de cartões, formulários |
| `body-sm` | 13px (0.8125rem) / 1.4 | Regular (400) | Metadados (professores, salas, horários) |
| `caption-xs` | 11px (0.6875rem) / 1.3 | Semi-bold (600) / Bold (700) | Badges de status, contagem regressiva D-N, chips de XP |
| `badge-mono` | 11px (0.6875rem) / 1.0 | Bold (700) | Códigos de matérias (`CC204`, `MAT102`), badges de horário |

> **Nota de implementação:** `Plus Jakarta Sans` ainda não está instalada no projeto — o `front/src/styles.css` usa `Inter`. A troca é parte da Fase 1.

---

## 3. Paleta de Cores & Tokens Hexadecimais

O tema **Academic Kinetic** emprega tons indigo/violeta profundos para expressar autoridade acadêmica, combinados com acentos funcionais de alerta e status.

A paleta é organizada por **slot semântico → feature**, nunca por feature. Essa ordem é deliberada: é ela que impede que um tom passe a servir dois estados.

### 3.1 Cores Base & Neutras (Light Mode)

- **Background / Superfície Geral**: `#faf8ff` (lavanda acinzentado ultra-claro)
- **Card Background (Superfície Primária)**: `#ffffff` (branco puro com borda sutil)
- **Superfície Secundária / Input**: `#f2f3ff` (lavanda claro para containers internos)
- **Divisores / Bordas Neutras**: `#e2e5f5` (divisores decorativos) / `#cbd5e1` (bordas de input, que precisam de contorno visível)
- **Texto Primário (Headings / Body Principal)**: `#0f172a` (slate-900)
- **Texto Secundário (Labels / Subtítulos)**: `#475569` (slate-600)
- **Texto Mudo / Placeholders**: `#64748b` (slate-500)

> **Correção:** a versão anterior usava `#94a3b8` (slate-400) como texto mudo, placeholder **e** cor do estado cancelado. Sobre branco, essa cor rendia 2.56:1 — reprovando WCAG AA. Passa a ser `#64748b` (4.76:1).

### 3.2 Cores de Marca & Primárias

- **Primary / Brand Indigo**: `#4f46e5` (indigo-600) — 6.29:1 com texto branco
- **Primary Dark / Pressed**: `#4338ca` (indigo-700)
- **Primary Light / Container**: `#e0e7ff` (indigo-100)
- **Primary Text on Brand**: `#ffffff`

### 3.3 Slots Semânticos

Quatro slots, de uso **exclusivo e mutuamente distinto**. Antes de introduzir um tom novo, ele precisa ser atribuído a um destes slots.

| Slot | Uso | Texto | Fundo | HSL (texto / fundo) |
| :--- | :--- | :--- | :--- | :--- |
| **Impossível** | colisão de horário, prazo vencido | `#b91c1c` | `#fee2e2` | `0 74% 42%` / `0 93% 94%` |
| **Atenção** | 2ª VA, prazo próximo, avaliação | `#c2410c` | `#ffedd5` | `17 88% 40%` / `34 100% 92%` |
| **Feito** | tarefa concluída, frequência 100% | `#166534` | `#dcfce7` | `143 64% 24%` / `141 84% 93%` |
| **Neutro** | placeholder, cancelado, ghost, inativo | `#475569` | `#f1f5f9` | `215 19% 35%` / `210 40% 96%` |

**Detalhamento por feature (lê a partir dos slots, nunca o contrário):**

- **Colisão Crítica & Urgência Máxima** — slot *Impossível*:
  - Fundo `#fee2e2`, borda `#fca5a5`, texto `#b91c1c`
  - Ícone `#dc2626` (3.95:1 — atende o mínimo de 3:1 para elemento gráfico)
  - Destaque em prova urgente (`D-1` / `D-2`): `#ef4444` / `#dc2626`
- **Alerta de Atenção Acadêmica (2ª VA / avaliações)** — slot *Atenção*:
  - Fundo `#ffedd5`, borda `#fed7aa`, texto `#c2410c`
- **Status Sucesso & Frequência 100%** — slot *Feito*:
  - Texto `#166534` sobre `#dcfce7`
- **Estado Cancelado Pontual / Silenciado (UC05)** — slot *Neutro*:
  - Fundo do card `#f8fafc`, borda `#e2e8f0`
  - Texto tachado `#64748b` (era `#94a3b8`, que reprovava em 2.34:1)
  - Badge `#f1f5f9` com texto `#475569` + ícone de sino cortado
  - **Não usar vermelho nem âmbar aqui**: cancelamento é um estado neutro por definição, e usar cor de alerta faria o usuário procurar o que deu errado.

### 3.4 Gamificação (decoração, não estado)

Por regra 1.1.3, gamificação não disputa matiz semântico.

- **Streak 🔥**: texto `#9a3412` sobre fundo `#fff7ed` (6.38:1). A versão anterior usava `#f97316` sobre `#ffedd5` (2.45:1, reprovado) — e ainda colidia visualmente com o alerta de 2ª VA.
- **XP ⚡**: gradiente `#3b82f6` → `#06b6d4` na barra de progresso; tag de ganho (`+30 XP`) em `#fef3c7` com texto `#92400e` (6.37:1).
- **Nível**: badge neutro `#f1f5f9` / `#475569`, nunca um matiz próprio.

### 3.5 Mapeamento para tokens CSS (HSL)

O projeto usa variáveis CSS HSL (padrão shadcn, `components.json` com `cssVariables: true`). **A paleta acima é mapeada para dentro dessa arquitetura — ela não a substitui.** Não há hex solto em componente.

```css
:root {
  --background: 257 100% 99%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --primary: 243 75% 59%;
  --primary-foreground: 0 0% 100%;
  --secondary: 235 100% 97%;
  --secondary-foreground: 215 19% 35%;
  --muted: 235 100% 97%;
  --muted-foreground: 215 19% 35%;
  --accent: 226 100% 94%;
  --accent-foreground: 245 58% 51%;
  --destructive: 0 72% 51%;
  --border: 231 49% 92%;
  --input: 213 27% 84%;
  --ring: 243 75% 59%;

  /* slots semânticos */
  --slot-impossivel: 0 74% 42%;
  --slot-impossivel-bg: 0 93% 94%;
  --slot-atencao: 17 88% 40%;
  --slot-atencao-bg: 34 100% 92%;
  --slot-feito: 143 64% 24%;
  --slot-feito-bg: 141 84% 93%;
  --slot-neutro: 215 19% 35%;
  --slot-neutro-bg: 210 40% 96%;

  --streak: 15 79% 34%;
  --streak-bg: 33 100% 96%;
  --xp-badge-bg: 48 96% 89%;
  --xp-badge-fg: 23 82% 31%;
}
```

---

## 4. Spacing, Raios & Elevação

- **Espaçamento Base (Grid 4px / 8px)**:
  - Margem horizontal de página: `px-4` (16px) a `px-5` (20px)
  - Espaçamento entre cards: `gap-3` (12px) a `gap-4` (16px)
  - Padding interno dos cards: `p-3.5` a `p-4` (14px a 16px)
- **Border Radius**:
  - Botões, Inputs, Cards Pequenos: `rounded-xl` (12px)
  - Cards de Disciplinas / Aulas: `rounded-2xl` (16px)
  - Badges e Pills: `rounded-full` (9999px)
- **Elevação & Sombras**:
  - `shadow-sm`: `0 1px 2px 0 rgb(0 0 0 / 0.05)` (cards e inputs padrão)
  - `shadow-md`: `0 4px 6px -1px rgb(0 0 0 / 0.08)` (floating bottom nav, action bar)
  - `shadow-lg`: `0 10px 15px -3px rgb(79 70 229 / 0.12)` (botão flutuante principal / modals)

---

## 5. Biblioteca de Componentes Principais

### 5.0 Regra de Precedência na Tela "Hoje"

Sem esta regra, seis cards competem no mesmo viewport de 360px e a tela vira um buffet de cartões — o oposto de "alta densidade informativa". A ordem de renderização na home é fixa:

1. **Colisão crítica** (slot *Impossível*) — só aparece quando existe. Nunca é omitida em favor de card de gamificação.
2. **Próxima prova / contagem D-N** (slot *Atenção* ou *Impossível* se `D-1`/`D-2`).
3. **Aula de agora / próxima aula** — o bloco que o estudante precisa agora.
4. **Tarefas pendentes** do dia.
5. **Gamificação** (streak, XP, nível) — por definição nunca compete por urgência; fica abaixo da dobra.

Regras de aplicação:

- **Regra da dobra:** em 360×640, os itens 1–3 cabem acima da dobra. Card que não cabe, rola.
- **Regra de um destaque por card:** no máximo um elemento `display-lg` ou `badge-mono` de alto contraste por card. É o que cria a leitura em 1 segundo.
- **Regra de densidade:** se dois cards disputam o mesmo slot, o de maior urgência sobe; empate se resolve por horário, não por ordem de inserção.
- **Estados `loading` / `empty` / `error` / `offline` ocupam o lugar do card principal** (regra 1.1.4), preservando a mesma geometria para não quebrar o layout ao alternar.

### 5.1 Top App Bar (Header Persistente)
- Logotipo StudyPath + Chip de Semestre Ativo (`2024.2`).
- Indicador de Streak no canto superior direito (slot *Neutro*, texto `--streak`).
- Avatar do estudante com borda sutil.
- Barra de sincronismo: `● Sync OK • <fuso do usuário>` e seletor rápido de semestre.
  - **O fuso é renderizado a partir do usuário (`usuario.fuso_horario`), nunca fixo em `UTC-3`.** O domínio trata o fuso como parte do contrato; o texto fixo violaria essa regra.

### 5.2 Card de Gamificação & Nível
- Exibição de dias seguidos (streak).
- Barra de progresso linear (840/1000 XP) com feedback visual de XP faltante para o próximo nível.
- Sem matiz próprio — ver 3.4.

### 5.3 Card de Colisão Crítica
- Slot *Impossível*: fundo `#fee2e2`, borda `#fca5a5`.
- Ícone de perigo + título "COLISÃO CRÍTICA" em badge `#b91c1c`.
- Listagem dos eventos em sobrecarga (ex: Prova 1 Cálculo às 08h e Entrega Projeto BD às 11h59).
- Ação tátil principal: botão com ícone para *Reorganizar plano de estudo*.

### 5.4 Card de Aula do Dia com Ação UC05
- Identificador de horário (`08:00 - 10:00`) em badge primary.
- Título da matéria, sala, bloco e professor.
- Ação tátil secundária em destaque: *Toque para gerenciar ou cancelar pontualmente*.
- **Estado Cancelado Pontualmente** (slot *Neutro*, ver 3.3):
  - Estilização com opacidade reduzida e texto tachado em `#64748b`.
  - Badge *Lembrete silenciado* + ícone de sino cortado.
  - Botão *Desfazer* com contorno nítido.

### 5.5 Card de Prova & Contagem Regressiva (D-N)
- Quadrante lateral esquerdo destacado com badge de urgência: `D-2 DIAS` (slot *Impossível*) ou `D-5 DIAS` (slot *Atenção*).
- Informações de peso da avaliação (`Peso 3.0`), data e horário exato.

### 5.6 Bottom Navigation Bar (Barra de Abas Mobile)
- Fixada no rodapé (`fixed bottom-0 left-0 right-0`).
- 4 destinos com touch targets de 56px de altura:
  1. **Hoje** (com badge indicador de itens pendentes)
  2. **Semana** (grade acadêmica)
  3. **Disciplinas** (visão geral do semestre)
  4. **Conquistas** (gamificação, medalhas e níveis)

> **Pendente de decisão:** o shell atual (`front/src/App.tsx`) rota `/hoje`, `/semana`, `/mes`. Esta especificação troca *Mês* por *Disciplinas* + *Conquistas*. O endpoint de mês (`From`/`To`) já existe no contrato. A troca de abas precisa ser decidida antes da Fase 1 e registrada em ADR.

---

## 6. Fluxos de Tela Mapeados

```
[Hoje (Home)] ──(toque no card de aula)──► [UC05: Cancelar Aula Pontual]
     │                                                │
     │                                      (Confirmar cancelamento)
     │                                                ▼
     │◄──(Toast com "Desfazer" & card silenciado)─────┘
     │
     ├──► [Grade Semanal (Aba 2)] ──► Seleção de Dias (Segunda a Domingo)
     │                                 & Alertas de 2ª VA
     │
     └──► [Disciplinas (Aba 3)] ──► Panorama Geral (Créditos, Média, Freq.)
                                    & Ações (Grade, Provas, Notas, Freq.)
```

---

## 7. Configuração Técnica (Tailwind & shadcn/ui)

A identidade visual é fechada aqui; a camada de componentes segue o que já existe no repositório (`front/src/components/ui/`, `front/src/lib/utils.ts`).

> **Dois cuidados com o snippet original.** (1) `require("tailwindcss-animate")` quebra num projeto com `"type": "module"` — o repo é ESM. (2) Um `tailwind.config.ts` com hex literal substitui a arquitetura de variáveis CSS HSL que o shadcn já establish; a paleta da §3.5 deve entrar **dentro** dela.

```typescript
// front/tailwind.config.ts
import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      minHeight: { touch: "44px" },
      minWidth: { touch: "44px" },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [animate],
};

export default config;
```

### Estrutura de Diretórios (React + Vite)

```
front/src/
├── assets/             # Logos, ícones SVG e avatares locais
├── components/
│   ├── layout/         # Header, BottomNav, PageShell
│   ├── ui/             # shadcn/ui (Button, Card, Badge, Dialog, Input, Progress, Sonner)
│   ├── academic/       # ClassCard, ExamCountdownCard, CollisionAlert
│   ├── gamification/   # StreakCounter, XPProgressBar, LevelBadge
│   └── uc05/           # CancelClassModal, CancellationReasonChips
├── hooks/              # useAcademicCalendar, usePushNotifications
├── lib/                # api.ts, api.generated.ts, utils.ts
├── i18n/               # messages.ts (dicionário pt-BR/en)
├── pages/
│   ├── HojePage.tsx
│   ├── SemanaPage.tsx
│   └── DisciplinasPage.tsx
├── styles.css
└── App.tsx
```

> **Ajustes em relação ao rascunho original:** os tipos gerados do contrato vivem em `lib/api.generated.ts` (não `contracts/`), gerados por `npm run generate:api` a partir de `docs/openapi.yaml`; as páginas seguem o nome de rota pt-BR existente; o `usePWA` some porque não há plugin PWA instalado no `package.json` — a decisão de instalá-lo é da Fase 2.

---

## 8. Lacunas Conhecidas (fora do escopo deste documento)

Registradas para que ninguém as descubra tarde e para que a Fase 1 não as trate como decisões tomadas:

| Lacuna | Impacto | Onde resolver |
| :--- | :--- | :--- |
| `disciplina` não tem campo `codigo` | Os badges `CC204` / `MAT102` da §2 não têm dado | Migration V2 + `openapi.yaml` |
| `horario` não tem `sala`, `bloco` nem `professor` | O card 5.4 mostra metadados inexistentes | Migration V2 + `openapi.yaml` |
| Não há entidade de frequência/`falta` | "Controle de faltas" aparece na §1 e no fluxo §6, mas não existe no domínio | Definir RF antes de prometer na UI |
| Gamificação não tem tabelas | §5.2, §5.6-Conquistas e §3.4 dependem da Fase 3 | Backlog Fase 3 |
| `prova` não tem `tipo` | "Trabalho em Grupo" como badge não tem origem | migration ou texto livre |
| **"Cálculo de médias" não existe** | §1 e §6 prometem "Panorama Geral (Créditos, Média, Freq.)"; não há endpoint, tabela nem RF | ADR-0007 — sai do MVP, volta na Fase 3 |
| **Unidade do `peso` em conflito** | §5.3 mostra "Peso 3.0" (coeficiente); contrato e banco guardam 0–100 (percentual) | ADR-0007 — decidir antes de construir a média |
| **Escala da `nota` em conflito** | banco e contrato guardam 0–100; `CONTEXT.md` e a conquista da pauta falam em "≥ 7" (0–10) | ADR-0007 — decidir antes de escrever regra de XP |
| `usuario` não tem avatar | O avatar da §5.1 é estático | migration ou asset local |
| Colisão não é endpoint | O card 5.3 é cálculo do cliente sobre a semana | Definir na Fase 1 |
| "Reorganizar plano de estudo" não está em RF | Botão da §5.3 sem destino definido | Definir na Fase 1 |
| Troca de abas (Mês → Disciplinas/Conquistas) | §5.6 diverge do shell atual | ADR antes da Fase 1 |
| `Plus Jakarta Sans` não instalada | §2 não é a fonte da verdade ainda | Fase 1 |
| Sem plugin PWA no `package.json` | ADR-0002 assume PWA; não há service worker | Manifest, SW e push vão todos para a Fase 2 — ADR-0006 |
| Tema escuro | `styles.css` hoje é dark-only | A §3.5 define só o claro |

---

## 9. Registro da decisão de base de componentes
O projeto usa **shadcn/ui** como camada de componentes acessíveis, com tokens CSS e Tailwind. A configuração fica em [`front/components.json`](../front/components.json), o tema em [`front/tailwind.config.ts`](../front/tailwind.config.ts) e os tokens em [`front/src/styles.css`](../front/src/styles.css).

shadcn/ui é a base de componentes, não a identidade visual. A identidade foi fechada em [`DESIGN.md`](./DESIGN.md) — tema *Academic Kinetic*, tipografia, paleta por slot semântico, espaçamento e regra de precedência da tela Hoje. A identidade visual correspondente está nas §1 a §8 acima.

## Por que não aplicar o Design Narniano

O Design Narniano é aplicado ao cluster A Biblioteca, cujo usuário é de contemplação e leitura devocional. A Rota de Estudo é uma ferramenta de organização acadêmica: o usuário busca dado, prazo e ação rápida. Portanto, este projeto não herda molduras, dourado, ornamentos ou tipografia devocional.

A base atual é neutra, escura, semântica e mobile-first. Tokens novos devem preservar contraste WCAG AA, foco por teclado, áreas de toque adequadas e funcionamento sem hover.

## Componentes já disponíveis

- `Button` em [`front/src/components/ui/button.tsx`](../front/src/components/ui/button.tsx), com variantes `default`, `outline`, `ghost` e `link`.
- `cn` em [`front/src/lib/utils.ts`](../front/src/lib/utils.ts), para combinar classes sem conflitos do Tailwind.
- Dicionário de chaves em [`front/src/i18n/messages.ts`](../front/src/i18n/messages.ts).

A Fase 1 deve adicionar componentes conforme a necessidade real das telas, usando a CLI do shadcn e registrando a decisão de cada componente que carregue comportamento ou acessibilidade.

## Checklist visual

- Usar tokens, não hex soltos nos componentes.
- Validar contraste de texto, bordas e foco em ambos os temas quando o tema claro entrar.
- Manter alvo de toque mínimo adequado e navegação por teclado.
- Não depender de cor, ícone ou hover para comunicar estado.
- Manter strings dentro do dicionário de tradução.
- **Um matiz, um trabalho.** Antes de criar um tom, atribuir a um slot semântico da §3.3 do DESIGN.md. Gamificação não usa matiz de estado.
- Estados `loading`, `empty`, `error` e `offline` são obrigatórios em toda tela que busca dados.

## Registro

- Decisão de não herança do Design Narniano: 2026-09-25.
- Base shadcn/ui adicionada durante a preparação da Fase 0, antes das telas de produto.
- Identidade visual fechada na §1 a §8 acima: paleta reorganizada por slot semântico após medição de contraste WCAG AA (quatro combinações do rascunho inicial reprovavam em 2.34–2.56:1), e regra de precedência da tela Hoje adicionada.
