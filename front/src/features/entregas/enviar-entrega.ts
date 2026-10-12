import { api } from '@/lib/api-client';

/** Envia o arquivo como multipart (o contrato descreve o campo "arquivo" como binário). */
export function enviarEntrega(atividadeId: string, arquivo: File) {
  return api.POST('/atividades/{atividadeId}/entregas', {
    params: { path: { atividadeId } },
    body: { arquivo: '' },
    bodySerializer: () => {
      const formulario = new FormData();
      formulario.append('arquivo', arquivo, arquivo.name);
      return formulario;
    },
  });
}
