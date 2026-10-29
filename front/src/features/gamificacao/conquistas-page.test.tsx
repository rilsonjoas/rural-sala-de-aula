import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ALUNA, PROFESSOR } from '@/mocks/fixtures';
import { entrarComo } from '@/test/auth';
import { renderApp } from '@/test/render';

describe('Página de Conquistas (Aba na Navegação)', () => {
  it('mostra a aba Conquistas para estudante sem alternância e com medalhas acadêmicas', async () => {
    const user = userEvent.setup();
    await entrarComo(ALUNA);

    renderApp('/turmas');

    // Link "Conquistas" na navegação
    const linkConquistas = await screen.findByRole('link', { name: 'Conquistas' });
    expect(linkConquistas).toBeInTheDocument();

    // Navega para a página de conquistas
    await user.click(linkConquistas);

    // Título da página
    expect(await screen.findByRole('heading', { name: 'Conquistas', level: 2 })).toBeInTheDocument();

    // Como ALUNA é apenas estudante, não exibe alternador de papel
    expect(screen.queryByRole('button', { name: /como professor/i })).not.toBeInTheDocument();

    // Card de Nível e XP
    expect(screen.getByText(/Nível \d · Estudante/i)).toBeInTheDocument();
    expect(screen.getByText(/XP Acumulados/i)).toBeInTheDocument();
    expect(screen.getByText(/Progresso para o Nível/i)).toBeInTheDocument();

    // Medalhas acadêmicas
    expect(screen.getByText('Medalhas Acadêmicas')).toBeInTheDocument();
    expect(screen.getByText('Primeiro Passo')).toBeInTheDocument();
    expect(screen.getByText('Pontualidade Rural')).toBeInTheDocument();
    expect(screen.getByText('Sempre Adiante')).toBeInTheDocument();
    expect(screen.getByText('Nota de Destaque')).toBeInTheDocument();
    expect(screen.getByText('Semestre em Dia')).toBeInTheDocument();
    expect(screen.getByText('Espírito de Equipe')).toBeInTheDocument();
  });

  it('permite alternar entre visão de estudante e de professor quando o usuário desempenha ambos os papéis', async () => {
    const user = userEvent.setup();
    await entrarComo(PROFESSOR);

    renderApp('/conquistas');

    // Título da página
    expect(await screen.findByRole('heading', { name: 'Conquistas', level: 2 })).toBeInTheDocument();

    // Exibe botões de alternância
    const btnEstudante = screen.getByRole('button', { name: /como estudante/i });
    const btnProfessor = screen.getByRole('button', { name: /como professor/i });
    expect(btnEstudante).toBeInTheDocument();
    expect(btnProfessor).toBeInTheDocument();

    // Clica para alternar para a visão de professor
    await user.click(btnProfessor);

    // Painel de dedicação docente
    expect(screen.getByText('Medalhas de Dedicação Docente')).toBeInTheDocument();
    expect(screen.getByText('Turmas Lecionadas')).toBeInTheDocument();
    expect(screen.getByText('Avaliações Realizadas')).toBeInTheDocument();
    expect(screen.getByText('Com Comentário')).toBeInTheDocument();
    expect(screen.getByText('Respostas no Mural')).toBeInTheDocument();

    // Medalhas docentes
    expect(screen.getByText('Diálogo Aberto')).toBeInTheDocument();
    expect(screen.getByText('Feedback Completo')).toBeInTheDocument();
    expect(screen.getByText('Planejamento Claro')).toBeInTheDocument();
    expect(screen.getByText('Turma em Dia')).toBeInTheDocument();
    expect(screen.getByText('Diversidade Didática')).toBeInTheDocument();
  });
});
