import { USUARIOS_INICIAIS, type Usuario, type UsuarioComSenha } from './fixtures';

type Estado = {
  usuarios: UsuarioComSenha[];
  sessaoUsuarioId: string | null;
};

function estadoInicial(): Estado {
  return { usuarios: USUARIOS_INICIAIS.map((u) => ({ ...u })), sessaoUsuarioId: null };
}

export const db: Estado = estadoInicial();

export function resetDb() {
  Object.assign(db, estadoInicial());
}

export function usuarioDaSessao(): UsuarioComSenha | undefined {
  return db.usuarios.find((u) => u.id === db.sessaoUsuarioId);
}

export function semSenha(usuario: UsuarioComSenha): Usuario {
  return { id: usuario.id, nome: usuario.nome, email: usuario.email, papel: usuario.papel };
}
