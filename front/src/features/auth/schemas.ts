import { z } from 'zod';

const email = z.string().min(1, 'Informe seu e-mail.').email('Informe um e-mail válido.');

export const loginSchema = z.object({
  email,
  senha: z.string().min(1, 'Informe sua senha.'),
});

export const registroSchema = z.object({
  nome: z.string().trim().min(1, 'Informe seu nome.'),
  email,
  senha: z.string().min(8, 'A senha precisa ter no mínimo 8 caracteres.'),
  dataNascimento: z.string().optional(),
});

export type LoginValores = z.infer<typeof loginSchema>;
export type RegistroValores = z.infer<typeof registroSchema>;
