export type CampoErro = { campo: string; mensagem: string };

export const MENSAGEM_PADRAO = 'Algo deu errado. Tente de novo.';

export class ApiError extends Error {
  readonly status: number;
  readonly campos?: CampoErro[];

  constructor(status: number, message: string, campos?: CampoErro[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.campos = campos;
  }
}

function ehCampoErro(valor: unknown): valor is CampoErro {
  return (
    typeof valor === 'object' &&
    valor !== null &&
    typeof (valor as CampoErro).campo === 'string' &&
    typeof (valor as CampoErro).mensagem === 'string'
  );
}

export function toApiError(status: number, corpo: unknown): ApiError {
  if (typeof corpo === 'object' && corpo !== null) {
    const { message, campos } = corpo as { message?: unknown; campos?: unknown };
    if (typeof message === 'string' && message.length > 0) {
      const camposValidos = Array.isArray(campos) ? campos.filter(ehCampoErro) : undefined;
      return new ApiError(status, message, camposValidos?.length ? camposValidos : undefined);
    }
  }
  return new ApiError(status, MENSAGEM_PADRAO);
}
