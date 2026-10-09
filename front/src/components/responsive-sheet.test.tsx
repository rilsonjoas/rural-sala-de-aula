import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ResponsiveSheet } from './responsive-sheet';

function simularLargura(desktop: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (consulta) =>
      ({
        matches: desktop,
        media: consulta,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        onchange: null,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  );
}

afterEach(() => vi.restoreAllMocks());

describe('ResponsiveSheet', () => {
  it('abaixo de 1024 px abre como folha vinda de baixo', () => {
    simularLargura(false);
    render(
      <ResponsiveSheet open onOpenChange={() => {}} titulo="Nova turma">
        <p>conteúdo</p>
      </ResponsiveSheet>,
    );

    const dialogo = screen.getByRole('dialog', { name: 'Nova turma' });
    expect(dialogo).toHaveAttribute('data-variante', 'folha');
    expect(screen.getByText('conteúdo')).toBeInTheDocument();
  });

  it('a partir de 1024 px abre como modal centrado', () => {
    simularLargura(true);
    render(
      <ResponsiveSheet open onOpenChange={() => {}} titulo="Nova turma">
        <p>conteúdo</p>
      </ResponsiveSheet>,
    );

    expect(screen.getByRole('dialog', { name: 'Nova turma' })).toHaveAttribute('data-variante', 'modal');
  });

  it('mostra a descrição quando existe', () => {
    simularLargura(false);
    render(
      <ResponsiveSheet open onOpenChange={() => {}} titulo="Entrar em turma" descricao="Peça o código ao professor">
        <p>conteúdo</p>
      </ResponsiveSheet>,
    );

    expect(screen.getByText('Peça o código ao professor')).toBeInTheDocument();
  });

  it.each([false, true])('fecha com Esc (desktop: %s)', async (desktop) => {
    simularLargura(desktop);
    const aoMudar = vi.fn();
    render(
      <ResponsiveSheet open onOpenChange={aoMudar} titulo="Avaliar">
        <p>conteúdo</p>
      </ResponsiveSheet>,
    );

    await userEvent.keyboard('{Escape}');

    expect(aoMudar).toHaveBeenCalledWith(false);
  });

  it('não renderiza nada quando fechada', () => {
    simularLargura(false);
    render(
      <ResponsiveSheet open={false} onOpenChange={() => {}} titulo="Avaliar">
        <p>conteúdo</p>
      </ResponsiveSheet>,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
