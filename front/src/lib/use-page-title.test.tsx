import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePageTitle } from './use-page-title';

describe('usePageTitle', () => {
  it('põe o título da página seguido do nome do app', () => {
    renderHook(() => usePageTitle('Minhas turmas'));

    expect(document.title).toBe('Minhas turmas · Rural Sala de Aula');
  });

  it('atualiza quando o título muda e volta ao nome do app ao sair', () => {
    const { rerender, unmount } = renderHook(({ t }) => usePageTitle(t), { initialProps: { t: 'Turma A' } });
    expect(document.title).toBe('Turma A · Rural Sala de Aula');

    rerender({ t: 'Turma B' });
    expect(document.title).toBe('Turma B · Rural Sala de Aula');

    unmount();
    expect(document.title).toBe('Rural Sala de Aula');
  });

  it('sem título (ainda carregando) mostra só o nome do app', () => {
    renderHook(() => usePageTitle(undefined));

    expect(document.title).toBe('Rural Sala de Aula');
  });
});
