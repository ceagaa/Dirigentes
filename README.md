# Dirigentes — Designação do mês

Mini WebApp leve e responsivo para **designação mensal de dirigentes de campo**: cadastro de pessoas, dias de campo fixos, **rodízio automático por frequência/disponibilidade**, **pessoa fixa por dia**, ajuste manual linha a linha e exportação em **PDF fiel à programação, imagem, link de compartilhamento e texto para WhatsApp**.

Sem login. O app é um Worker da **Cloudflare** (Workers + Pages) que serve o frontend e uma API; os dados ficam no banco **D1** (SQLite) em um único registro, com cache local no navegador.

---

## Rodar o projeto

```bash
npm install
npm run dev      # frontend  http://localhost:5173
npm run dev:api  # Worker + D1 local  http://127.0.0.1:8787 (terminal separado)
npm run build    # typecheck + gera /dist
npm run lint     # oxlint
npm run typecheck
```

Em dev, o Vite encaminha `/api` para o `wrangler dev` (porta 8787). Sem o Worker rodando, o app segue funcionando só com o cache local do navegador.

---

## Fluxo

1. **Splash** “Dirigentes” abre o app.
2. **Designação do mês** (resumo): mês/ano, status (pendente / pronta), contagem de dias, designados e pendentes, lista das saídas e ação principal.
3. **Montar designação**: gera o rodízio, permite trocar nomes linha a linha e conclui com **Designação pronta**, que libera prévia, PDF, PNG, link e texto.
4. **Dirigentes** e **Configurações** ficam na barra inferior fixa (mobile e desktop).

---

## Hospedagem: Cloudflare Workers + D1

1. **Banco**: crie o banco D1 (já existe o `dirigentes`) e aplique a migração:
   ```bash
   npm run db:migrate         # remoto (usa seu login/token do Wrangler)
   npm run db:migrate:local   # banco local (Miniflare) para testes
   ```
2. **Deploy**: 
   ```bash
   npx wrangler login         # uma vez, abre o navegador
   npm run deploy             # build + publica o Worker (site + API)
   ```
3. **Deploy automático**: publique este repositório no GitHub e, no painel do Cloudflare, importe-o em **Workers & Pages → Create → Import repository** (Workers Builds). Build command: `npm run build`. Todo `git push` publica sozinho; PRs geram prévia.

### API e geração agendada

| Rota | O que faz |
| --- | --- |
| `GET /api/estado` | Devolve o estado completo (seed inicial se vazio) |
| `PUT /api/estado` | Grava o estado inteiro (última gravação vence) |
| `POST /api/escala/gerar` | Gera a escala do mês do corpo `{ "chave": "2026-11" }` (409 se já existir) |
| cron `0 3 * * *` | **Dia 20, 00:00 (BRT)**: gera automaticamente a escala do mês seguinte — idempotente, preserva ajustes manuais |

No app, a tela **Designação** mostra *“Adiantar escala de {mês}”* (mesmo efeito do cron) e, quando o próximo mês já foi gerado, o atalho *“Escala de {mês} pronta →”*.

### PIN opcional (APP_PIN)

Para exigir um PIN em todas as rotas da API:

```bash
npx wrangler secret put APP_PIN   # defina um valor
```

No app: **Configurações → Acesso → PIN de proteção** (guardado só no aparelho; enviado no header `x-app-pin`). Sem o secret, o app funciona sem PIN.

> Estrutura do registro (`estado` no D1): `id = default_config`, `dirigentes` (JSON), `config_campos` (JSON, com `fixo` opcional) e `escalas` (JSON `{ "2026-10": { auto, manuais, geradoEm }, "_config": { titulo, congregacao, designacao_fixa, frequencia_padrao } }`).

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
  App.tsx                    splash, telas, nav inferior, sincronização e avisos
  server.ts                  Worker Hono: API + cron do dia 20
  components/
    Splash.tsx               abertura “Dirigentes”
    BottomNav.tsx            barra inferior flutuante (Designação, Dirigentes, Configurações)
    ResumoDesignacao.tsx     tela inicial do mês (+ adiantar próximo mês)
    TabelaEscala.tsx         montagem da designação
    EscalaCard.tsx           cartão fiel à planilha (editável ou somente leitura)
    CadastroDirigentes.tsx   fichas e disponibilidade
    ConfigCampos.tsx         cabeçalho, rodízio, dias de campo e PIN
    ExportModal.tsx          prévia, PDF/PNG, link e texto
    TelaVer.tsx              visualização do link compartilhado
    ui.tsx                   botões pílula, campos, chips e modal acessível
  lib/
    dominio.ts               tipos de domínio (fonte única)
    rodizio.ts               algoritmo de designação (automática e fixa)
    gerador.ts               geração do mês compartilhada cliente/servidor
    api.ts                   carga/gravação via /api com fallback local
    compartilhamento.ts      codificação/decodificação do link
    export.ts                html2canvas, jspdf, share e texto
    estadoInicial.ts         estado padrão e normalização
    constants.ts, datas.ts   dias, frequências, cores e datas
migrations/0001_init.sql     tabela do D1
wrangler.jsonc               Worker: assets, D1 e cron
```

---

## Observações

- **Sem autenticação de usuário**: quem tiver a URL acessa o app. A API pode ser protegida pelo `APP_PIN` opcional (ver acima).
- Conflitos entre aparelhos são resolvidos por **última gravação** (o registro mais novo substitui o anterior).
- O Worker serve o `dist/` (SPA com fallback) e a API no mesmo domínio; deploy e previews ficam por conta do Workers Builds (GitHub).
- O link de compartilhamento carrega a designação dentro da própria URL (sem conta e sem servidor); ele mostra o estado do momento em que foi copiado.
