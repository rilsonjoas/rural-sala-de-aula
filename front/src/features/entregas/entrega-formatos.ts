import { formatDataHora } from '@/lib/format';
import type { Entrega } from './api';

export const enviadaEm = (entrega: Entrega) => `Enviada em ${formatDataHora(entrega.enviadaEm)}`;
