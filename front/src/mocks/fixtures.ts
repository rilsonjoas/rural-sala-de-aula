import type { components } from '@/lib/api.generated';

export type Usuario = components['schemas']['Usuario'];
export type UsuarioComSenha = Usuario & { senha: string };

export const PROFESSOR: UsuarioComSenha = {
  id: '00000000-0000-4000-8000-000000000001',
  nome: 'Marcos Silva',
  email: 'marcos@ufrpe.br',
  papel: 'PROFESSOR',
  senha: 'senha1234',
};

export const ALUNA: UsuarioComSenha = {
  id: '00000000-0000-4000-8000-000000000002',
  nome: 'Maria Clara Albuquerque',
  email: 'maria@ufrpe.br',
  papel: 'ALUNO',
  senha: 'senha1234',
};

export const ALUNO: UsuarioComSenha = {
  id: '00000000-0000-4000-8000-000000000003',
  nome: 'Lucas Mendes',
  email: 'lucas@ufrpe.br',
  papel: 'ALUNO',
  senha: 'senha1234',
};

export const USUARIOS_INICIAIS: UsuarioComSenha[] = [PROFESSOR, ALUNA, ALUNO];
