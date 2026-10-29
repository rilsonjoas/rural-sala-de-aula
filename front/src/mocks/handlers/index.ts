import { atividadesHandlers } from './atividades';
import { authHandlers } from './auth';
import { avisosHandlers } from './avisos';
import { entregasHandlers } from './entregas';
import { gamificacaoHandlers } from './gamificacao';
import { turmasHandlers } from './turmas';

export const handlers = [
  ...authHandlers,
  ...turmasHandlers,
  ...atividadesHandlers,
  ...entregasHandlers,
  ...avisosHandlers,
  ...gamificacaoHandlers,
];
