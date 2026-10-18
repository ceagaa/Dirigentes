# Dirigentes — Designação do mês

Mini WebApp leve e responsivo para **designação mensal de dirigentes de campo**: cadastro de pessoas, dias de campo fixos, **rodízio automático por frequência/disponibilidade**, **pessoa fixa por dia**, ajuste manual linha a linha e exportação em **PDF fiel à programação, imagem, link de compartilhamento e texto para WhatsApp**.

Sem login. Os dados são gravados no navegador e sincronizados, quando configurado, em **uma única tabela pública do Supabase**.

---

## Rodar o projeto

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # gera /dist
npm run lint     # oxlint
```

---

## Fluxo

1. **Splash** “Dirigentes” abre o app.
2. **Designação do mês** (resumo): mês/ano, status (pendente / pronta), contagem de dias, designados e pendentes, lista das saídas e ação principal.
3. **Montar designação**: gera o rodízio, permite trocar nomes linha a linha e conclui com **Designação pronta**, que libera prévia, PDF, PNG, link e texto.
4. **Dirigentes** e **Configurações** ficam na barra inferior fixa (mobile e desktop).

---

## Conectar ao Supabase (opcional)

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, execute o script [`supabase/schema.sql`](supabase/schema.sql):

```sql
create table if not exists public.escala_dirigentes (
  id text primary key default 'default_config',
  dirigentes jsonb default '[]'::jsonb,
  config_campos jsonb default '[]'::jsonb,
  escalas jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.escala_dirigentes enable row level security;
create policy "Acesso Publico Leitura"  on public.escala_dirigentes for select using (true);
create policy "Acesso Publico Escrita"  on public.escala_dirigentes for insert with check (true);
create policy "Acesso Publico Atualizacao" on public.escala_dirigentes for update using (true);
```

3. Copie `.env.example` para `.env` e preencha:

```bash
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

4. Reinicie o `npm run dev`.

Sem `.env` o app funciona normalmente usando o armazenamento local do navegador (o indicador do topo mostra *"Salvo neste aparelho"*). Com `.env` preenchido, o estado é salvo na tabela e o topo passa a mostrar *"Sincronizado"*.

> Estrutura do registro: `id = default_config`, `dirigentes` (array), `config_campos` (array, com `fixo` opcional) e `escalas` (mapa `{ "2026-10": { auto, manuais, geradoEm }, "_config": { titulo, congregacao, designacao_fixa, frequencia_padrao } }`).

---

## Como funciona

### Telas

| Tela | O que faz |
| --- | --- |
| **Designação** | Resumo do mês + montagem (rodízio, ajustes manuais, conclusão) |
| **Dirigentes** | Fichas: nome, telefone, ativo/inativo, frequência, dias e horários disponíveis |
| **Configurações** | Cabeçalho, **designação fixa**, frequência padrão e dias de campo (dia, horário, ponto de encontro, **quem dirige**) |

### Rodízio automático

A cada geração, para cada ocorrência (data x campo) o algoritmo escolhe o candidato que:

1. está **ativo**, tem o **dia** e o **horário** marcados na ficha;
2. respeita a **folga mínima** da frequência (semanal 3 dias, quinzenal 12, mensal 25, bimestral 50) e a **capacidade** mensal (`ocorrências ÷ intervalo em semanas`);
3. tem a **menor carga** no mês — o empate é decidido por quem espera há mais tempo.

Se ninguém passar pelas regras, o sistema relaxa primeiro a capacidade, depois a folga (escolhendo quem está **mais próximo** da frequência configurada) e, só em último caso, deixa a linha como *Sem designação* para ajuste manual.

### Designação fixa

Em **Configurações → Rodízio**, o toggle **Designação fixa** faz cada dia de campo usar sempre a pessoa escolhida em **“Quem dirige”** (ex.: toda quarta sai o mesmo dirigente, como na programação impressa). Desligado, o rodízio automático distribui conforme a frequência. As designações manuais continuam vencendo em qualquer modo.

### Ajuste manual

- Troque o nome direto na tabela: a linha ganha um **ponto** e passa a ser manual.
- **Manter ajustes manuais ao gerar** mantém essas linhas intactas nas próximas gerações.
- **Limpar manuais** devolve tudo ao rodízio automático.

### Exportação e compartilhamento

Quando todos os dias estão designados, **Designação pronta** libera:

- **Prévia fiel** do cartão (renderizada com `html2canvas`) — mesma aparência do arquivo;
- **Baixar PDF** — A4 retrato, multipágina quando necessário (`jspdf`);
- **Baixar imagem PNG** — 2x de resolução;
- **Compartilhar** — `navigator.share` com a imagem; sem suporte, copia o texto;
- **Copiar texto** — resumo formatado com `*negrito*` e `>` para colar no WhatsApp;
- **Copiar link** — URL com a designação embutida (`#/ver/…`); quem abre vê o cartão em modo somente leitura, com opção de baixar PDF e imagem.

O cartão segue o layout da aba **SAÍDA DE CAMPO** da planilha de referência: título e congregação centralizados em vinho, cabeçalho petróleo (`Dia | Horário | Local | Dirigente`) e linhas em fundo claro `#EAF3FA` com texto vinho em negrito, separadas por linhas em branco.

---

## Paleta

| Uso | Cor |
| --- | --- |
| Azul petróleo — marca / cabeçalho da tabela | `#045A6C` / `#3C7F8B` |
| Vinho — títulos e textos da programação | `#7E0024` / `#7E0000` |
| Fundo das linhas da programação | `#EAF3FA` |
| Linhas / bordas | `#D8D8D8` |

As cores são aplicadas como hex puro (sem `oklch`) justamente para o `html2canvas` exportar fielmente.

---

## Estrutura

```
src/
  App.jsx                    splash, telas, nav inferior, sincronização e avisos
  components/
    Splash.jsx               abertura “Dirigentes”
    BottomNav.jsx            barra inferior (Designação, Dirigentes, Configurações)
    ResumoDesignacao.jsx     tela inicial do mês
    TabelaEscala.jsx         montagem da designação
    EscalaCard.jsx           cartão fiel à planilha (editável ou somente leitura)
    CadastroDirigentes.jsx   fichas e disponibilidade
    ConfigCampos.jsx         cabeçalho, rodízio e dias de campo
    ExportModal.jsx          prévia, PDF/PNG, link e texto
    TelaVer.jsx              visualização do link compartilhado
    ui.jsx                   botões, campos, chips e modal acessível
  lib/
    rodizio.js               algoritmo de designação (automática e fixa)
    compartilhamento.js      codificação/decodificação do link
    export.js                html2canvas, jspdf, share e texto
    supabase.js              carga/gravação com fallback local
    estadoInicial.js         estado padrão e normalização
    constants.js, datas.js   dias, frequências, cores e datas
supabase/schema.sql          script da tabela pública
```

---

## Observações

- **Sem autenticação**: qualquer pessoa com a URL pública e a chave anon pode ler/escrever a tabela. Não cadastre dados sensíveis e revise as políticas do RLS antes de divulgar o endereço.
- Conflitos entre aparelhos são resolvidos por **última gravação** (o registro mais novo substitui o anterior).
- O app é uma SPA estática: `npm run build` gera o `dist/` que pode ir para Vercel, Netlify, GitHub Pages ou qualquer host estático (lembrando de declarar as variáveis `VITE_*` no provedor).
- O link de compartilhamento carrega a designação dentro da própria URL (sem conta e sem servidor); ele mostra o estado do momento em que foi copiado.
