# ADR-0003: Internacionalização desde o V1

- **Status:** accepted (2026-09-23) · **complementado em** 2026-09-29 (ver *Complemento* abaixo)

## Contexto

O produto terá internacionalização no futuro (mercado/audiência em inglês). Nome verificado em 2026-09-23: **"Rota de Estudo"** está livre na Play/App Store (não há app concorrente com esse nome; concorrentes são Estudez, MyStudyLife, StudyCore etc.); **"StudyFlow"** está saturado (≥ 4 apps) — evitado.

## Decisão

- Nome duplo: **Rota de Estudo** (pt-BR) / **StudyPath** (en).
- **Zero texto hardcoded** no código desde o V1: todas as strings em dicionário de chaves (i18n), pt-BR ativo, catálogo em inglês pronto para ligar.
- Configuração de idioma/fuso por usuário (fuso é obrigatório para notificação "X antes").

## Consequências

- Trocar o idioma no futuro é config, não refactor.
- Exige disciplina de chaves de tradução desde o primeiro commit.

## Complemento (2026-09-29): o MVP entrega em português

A decisão acima se divide em duas, e só uma sobrevive como prioridade agora.

**Continua valendo — a disciplina.** Zero texto hardcoded, tudo em dicionário de chaves. Já está no código desde o primeiro commit e custou quase nada. Reverter isso agora seria jogar fora o que já foi pago, e é o que torna a abertura futura barata.

**Perde a prioridade — o catálogo em inglês.** A entrega do MVP (Fases 1–3) é **em português**. Não há catálogo `en` pronto, não há troca de idioma e o inglês entra na Fase 4.

O motivo é de custo, não de valor: o catálogo precisa ser reescrito a cada tela nova (Hoje, Semana, Disciplinas, Conquistas, preferências, notificações), então é um custo recorrente por tela com valor zero para a demonstração — e disputa o mesmo tempo escasso do esqueleto PWA.

Duas precisões sobre o texto original desta ADR:

- **"catálogo em inglês pronto para ligar" era otimista.** O que existe hoje em `front/src/i18n/messages.ts` são 18 chaves do shell da Fase 0. Não é um catálogo pronto; é o esqueleto que prova que o padrão funciona.
- **O que continua no V1 é o gancho, não a interface.** `usuario.locale` permanece no contrato (`openapi.yaml`, `default: pt-BR`) e o fuso por usuário continua obrigatório, porque o fuso é o que o RF07 depende. Tirar o campo agora seria mudança incompatível no contrato da dupla e não resolveria problema nenhum.

O código já está coerente com isso sem nenhuma alteração: `App.tsx` resolve o idioma por `VITE_LOCALE`, com `'pt-BR'` como padrão, e não detecta o idioma do navegador. Se `VITE_LOCALE=en`, a interface fica em inglês — o que serve para conferir traduções, mas não é caminho de produto no MVP.
