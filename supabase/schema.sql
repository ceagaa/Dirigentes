-- Tabela única (key/value JSONB) do Mini App de Dirigentes de Campo
-- Execute no SQL Editor do Supabase.

create table if not exists public.escala_dirigentes (
  id text primary key default 'default_config',
  dirigentes jsonb default '[]'::jsonb,
  config_campos jsonb default '[]'::jsonb,
  escalas jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Liberar acesso de leitura e escrita sem autenticação
alter table public.escala_dirigentes enable row level security;

create policy "Acesso Publico Leitura"
  on public.escala_dirigentes for select using (true);

create policy "Acesso Publico Escrita"
  on public.escala_dirigentes for insert with check (true);

create policy "Acesso Publico Atualizacao"
  on public.escala_dirigentes for update using (true);
