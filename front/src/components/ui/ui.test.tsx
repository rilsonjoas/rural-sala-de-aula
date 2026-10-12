import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './button';
import { buttonVariants } from './button-variants';
import { Input } from './input';
import { Label } from './label';

describe('componentes base', () => {
  it('o campo é encontrado pelo rótulo visível', () => {
    render(
      <>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" />
      </>,
    );

    expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
  });

  it.each(['default', 'sm', 'lg', 'icon'] as const)('o botão %s tem alvo de toque de no mínimo 44 px', (size) => {
    const classes = buttonVariants({ size });

    expect(classes).toMatch(/\b(min-h-11|h-11|h-12|size-11)\b/);
    expect(classes).not.toMatch(/\bh-(8|9|10)\b/);
  });

  it('tem variante destrutiva em vermelho e secundária em azul claro', () => {
    expect(buttonVariants({ variant: 'destructive' })).toContain('bg-destructive');
    expect(buttonVariants({ variant: 'secondary' })).toContain('bg-secondary');
  });

  it('nenhuma variante usa o amarelo como cor de texto', () => {
    for (const variant of ['default', 'outline', 'secondary', 'ghost', 'link', 'destructive'] as const) {
      expect(buttonVariants({ variant })).not.toMatch(/text-highlight\b/);
    }
  });

  it('o botão renderiza o rótulo e pode ser desabilitado', () => {
    render(<Button disabled>Enviar entrega</Button>);

    expect(screen.getByRole('button', { name: 'Enviar entrega' })).toBeDisabled();
  });
});
