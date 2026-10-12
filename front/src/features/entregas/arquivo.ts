export const LIMITE_BYTES = 25 * 1024 * 1024;
export const EXTENSOES = ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'txt'];
export const ACCEPT = EXTENSOES.map((e) => `.${e}`).join(',');

export const MSG_TIPO = 'Esse tipo de arquivo não é aceito. Envie PDF, apresentação ou texto.';
export const MSG_TAMANHO = 'O arquivo passa de 25 MB. Envie um arquivo menor.';

/** Mesmas regras da API (ADR-0003), conferidas antes do envio para avisar na hora. */
export function validarArquivo(arquivo: File): string | null {
  const ponto = arquivo.name.lastIndexOf('.');
  const extensao = ponto >= 0 ? arquivo.name.slice(ponto + 1).toLowerCase() : '';
  if (!EXTENSOES.includes(extensao)) return MSG_TIPO;
  if (arquivo.size === 0) return 'O arquivo está vazio. Escolha outro.';
  if (arquivo.size > LIMITE_BYTES) return MSG_TAMANHO;
  return null;
}
