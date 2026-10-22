-- Inscrições de notificação push (Web Push): um aparelho inscrito por endpoint.
CREATE TABLE IF NOT EXISTS push_inscricoes (
  endpoint TEXT PRIMARY KEY NOT NULL,
  chave_p256dh TEXT NOT NULL,
  chave_auth TEXT NOT NULL,
  ativo INTEGER NOT NULL DEFAULT 1,
  criado_em TEXT NOT NULL,
  atualizado_em TEXT NOT NULL
);
