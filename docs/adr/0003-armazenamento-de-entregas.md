# ADR-0003 — Armazenamento dos arquivos de entrega (RNF02)

Status: parcialmente aceito — limites decididos (2026-10-08); local de armazenamento segue com o Luiz

## Contexto

Entregas são arquivos (PDF, slides, texto) que precisam manter associação à atividade, ao aluno e ao horário.

## Decisão

Limites aceitos: até 25 MB; extensões pdf, ppt, pptx, doc, docx, txt (413 para tamanho, 415 para tipo). Recomendação para 19/10: volume Docker em disco, com chave relativa em entrega.arquivo_chave. Alternativa: bucket S3-compatível. A coluna serve às duas.

## Consequências

Disco é mais simples agora; migrar para bucket depois exige copiar os arquivos, não mudar o schema.
