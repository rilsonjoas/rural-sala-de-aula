import { describe, expect, it } from 'vitest';
import { LIMITE_BYTES, validarArquivo } from './arquivo';

const arquivo = (nome: string, tamanho = 10) => {
  const f = new File([new Uint8Array(1)], nome);
  Object.defineProperty(f, 'size', { value: tamanho });
  return f;
};

describe('validarArquivo', () => {
  it.each(['trabalho.pdf', 'slides.ppt', 'slides.PPTX', 'texto.doc', 'texto.docx', 'notas.txt', 'Relatório Final.PDF'])(
    'aceita %s',
    (nome) => {
      expect(validarArquivo(arquivo(nome))).toBeNull();
    },
  );

  it.each(['programa.exe', 'foto.png', 'planilha.xlsx', 'semextensao', 'arquivo.pdf.exe'])('rejeita %s pelo tipo', (nome) => {
    expect(validarArquivo(arquivo(nome))).toBe('Esse tipo de arquivo não é aceito. Envie PDF, apresentação ou texto.');
  });

  it('aceita exatamente 25 MB e rejeita acima disso', () => {
    expect(validarArquivo(arquivo('a.pdf', LIMITE_BYTES))).toBeNull();
    expect(validarArquivo(arquivo('a.pdf', LIMITE_BYTES + 1))).toBe('O arquivo passa de 25 MB. Envie um arquivo menor.');
  });

  it('rejeita arquivo vazio', () => {
    expect(validarArquivo(arquivo('a.pdf', 0))).toBe('O arquivo está vazio. Escolha outro.');
  });

  it('o tipo é conferido antes do tamanho', () => {
    expect(validarArquivo(arquivo('a.exe', LIMITE_BYTES + 1))).toMatch(/não é aceito/);
  });
});
