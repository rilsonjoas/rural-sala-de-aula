import { Fragment } from 'react';

/** Nome de arquivo com pontos de quebra depois de _, . e -: quebra entre palavras, não no meio delas. */
export function NomeDeArquivo({ nome }: { nome: string }) {
  const partes = nome.split(/([_.-])/);
  return (
    <span>
      {partes.map((parte, i) => (
        <Fragment key={i}>
          {parte}
          {/^[_.-]$/.test(parte) ? <wbr /> : null}
        </Fragment>
      ))}
    </span>
  );
}
