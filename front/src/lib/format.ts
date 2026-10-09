/** Iniciais para o avatar: primeira e última palavra do nome (ou as duas primeiras letras, se for uma só). */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

const DIAS_DA_SEMANA = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const doisDigitos = (n: number) => String(n).padStart(2, '0');

/** "15/10 às 23:59", com o ano só quando for diferente do atual ("15/10/2027 às 23:59"). Fuso do navegador. */
export function formatDataHora(iso: string, agora: Date = new Date()): string {
  const data = new Date(iso);
  const ano = data.getFullYear() === agora.getFullYear() ? '' : `/${data.getFullYear()}`;
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}${ano} às ${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}

/** Nota de 0 a 10 com vírgula e uma casa decimal: "9,5", "8,0". */
export function formatNota(nota: number): string {
  return nota.toFixed(1).replace('.', ',');
}

/** Dias de aula (1 = segunda ... 7 = domingo) como "Seg · Qua". */
export function formatDias(dias: number[]): string {
  return [...new Set(dias)]
    .sort((a, b) => a - b)
    .map((dia) => DIAS_DA_SEMANA[dia - 1])
    .join(' · ');
}

const MS_POR_DIA = 24 * 60 * 60 * 1000;
const inicioDoDia = (data: Date) => new Date(data.getFullYear(), data.getMonth(), data.getDate()).getTime();
const quantosDias = (n: number) => `${n} ${n === 1 ? 'dia' : 'dias'}`;

/** Apoio ao prazo final: "Restam 2 dias", "Prazo final hoje", "Prazo final passou há 1 dia". Conta dias de calendário. */
export function formatPrazoRelativo(prazoFinalIso: string, agora: Date = new Date()): string {
  const prazo = new Date(prazoFinalIso);
  const dias = Math.round((inicioDoDia(prazo) - inicioDoDia(agora)) / MS_POR_DIA);

  if (prazo.getTime() >= agora.getTime()) {
    if (dias === 0) return 'Prazo final hoje';
    return dias === 1 ? 'Resta 1 dia' : `Restam ${dias} dias`;
  }
  if (dias === 0) return 'Prazo final passou hoje';
  return `Prazo final passou há ${quantosDias(-dias)}`;
}

/** "1 turma" / "3 turmas". Para plurais irregulares, passe a forma no plural. */
export function plural(n: number, singular: string, formaPlural = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : formaPlural}`;
}

/** "20/10", com o ano só quando for diferente do atual. */
export function formatData(iso: string, agora: Date = new Date()): string {
  const data = new Date(iso);
  const ano = data.getFullYear() === agora.getFullYear() ? '' : `/${data.getFullYear()}`;
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}${ano}`;
}

/** Valor para <input type="datetime-local">: "2026-10-15T23:59" no fuso do navegador. */
export function paraInputDataHora(data: Date): string {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}T${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}

/** Tamanho de arquivo legível: "512 B", "950 KB", "1,8 MB". */
export function formatTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}
