import { atividadesHandlers } from './atividades';
import { authHandlers } from './auth';
import { entregasHandlers } from './entregas';
import { turmasHandlers } from './turmas';

export const handlers = [...authHandlers, ...turmasHandlers, ...atividadesHandlers, ...entregasHandlers];
