# ADR-0003 — Armazenamento dos arquivos de entrega (RNF02)

Status: aceito e implementado (2026-10-19) — limites decididos em 2026-10-08; arquivos em volume Docker

## Contexto

Entregas são arquivos (PDF, slides, texto) que precisam manter associação à atividade, ao aluno e ao horário.

## Decisão

Limites aceitos: até 25 MB; extensões pdf, ppt, pptx, doc, docx, txt (413 para tamanho, 415 para tipo). Recomendação para 19/10: volume Docker em disco, com chave relativa em entrega.arquivo_chave. Alternativa: bucket S3-compatível. A coluna serve às duas.

## Consequências

Disco é mais simples agora; migrar para bucket depois exige copiar os arquivos, não mudar o schema.

## Como ficou (19/10/2026)

- Os arquivos ficam em `/app/uploads` da API, num **volume Docker** (`uploads_data` no compose de desenvolvimento; `rural-sala-de-aula_uploads` na VPS, incluído no backup via `DOCKER_VOLUMES`). Sem o volume, cada deploy apagaria as entregas.
- A tabela `arquivo` guarda `nome_original`, `nome_armazenado`, `caminho` (relativo, `uploads/<nome>`), `tipo_conteudo`, `tamanho` e `data_envio`, ligada à entrega; a entrega guarda a atividade, o aluno e `enviada_em`.
- 413 para mais de 25 MB e 415 para tipo fora da lista. Em produção o nginx do front recusa corpos acima de 26 MB e pode fechar a conexão antes de a resposta chegar; por isso o front também barra acima de 25 MB no navegador.
- O reenvio (antes da avaliação) troca o arquivo e **apaga o antigo do disco depois do commit**. Envios simultâneos do mesmo aluno são serializados por `pg_advisory_xact_lock`.
- Ainda falta o hash SHA-256 do arquivo (RNF02, no BACKLOG).
