-- Estado do app em um registro único (mesmo formato do antigo Supabase).
CREATE TABLE IF NOT EXISTS estado (
  id TEXT PRIMARY KEY DEFAULT 'default_config',
  dirigentes TEXT NOT NULL DEFAULT '[]',
  config_campos TEXT NOT NULL DEFAULT '[]',
  escalas TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
