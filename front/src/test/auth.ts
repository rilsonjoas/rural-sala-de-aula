import { api } from '@/lib/api-client';

export async function entrarComo(usuario: { email: string; senha: string }) {
  await api.POST('/auth/login', { body: { email: usuario.email, senha: usuario.senha } });
}
