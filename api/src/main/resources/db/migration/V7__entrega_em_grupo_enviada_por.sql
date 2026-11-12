-- Entrega em nome do grupo (RF06): guarda quem do grupo enviou o arquivo.
-- A unicidade (uma entrega por grupo e atividade) segue o mesmo caminho da entrega individual:
-- com heranca JOINED nenhuma UNIQUE do banco cobre o par, entao o envio e serializado por lock consultivo.
ALTER TABLE entrega_em_grupo ADD COLUMN enviada_por_id UUID REFERENCES usuario(id) ON DELETE SET NULL;
