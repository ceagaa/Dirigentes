import type { Campo, ConfigEscala, Dirigente } from '../lib/dominio'
import { useState } from 'react'
import {
  Check,
  ChevronRight,
  Church,
  Cloud,
  FileText,
  Lock,
  MapPin,
  MoreVertical,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Trash,
} from 'lucide-react'
import {
  DIAS_SEMANA,
  FREQUENCIAS,
  HORARIOS_PADRAO,
  MESES,
  infoDia,
} from '../lib/constants'
import { definirPin, pinSalvo } from '../lib/api'
import { Botao, Input, Kicker, Modal, Rotulo, Select, Stepper, Toggle, Vazio } from './ui'

type FormCampo = Partial<Campo> & {
  diaSemana: number
  horario: string
  local: string
  fixo: string | null
}

function novoId(): string {
  return `campo-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

function vazio(): FormCampo {
  return { diaSemana: 3, horario: '19:30', local: '', fixo: null }
}

/** Data de hoje resolvida uma vez (oxlint: sem Date instável no render). */
const HOJE = new Date()
const ATUALIZADO = `em ${MESES[HOJE.getMonth()]} de ${HOJE.getFullYear()}`

function Linha({
  rotulo,
  descricao,
  children,
  acao,
}: {
  rotulo: string
  descricao?: string
  children?: React.ReactNode
  acao?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="min-w-0 pr-1">
        <p className="text-sm font-semibold text-ink">{rotulo}</p>
        {descricao ? <p className="mt-0.5 text-[13px] text-muted">{descricao}</p> : null}
        {children ? <div className="mt-1.5">{children}</div> : null}
      </div>
      {acao}
    </div>
  )
}

function TituloSecao({
  titulo,
  descricao,
  badge,
}: {
  titulo: string
  descricao?: string
  badge?: string
}) {
  return (
    <div className="flex items-end justify-between gap-3 px-1">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-ink">{titulo}</h2>
        {descricao ? <p className="mt-0.5 text-sm text-muted">{descricao}</p> : null}
      </div>
      {badge ? (
        <span className="shrink-0 text-xs font-bold text-muted">{badge}</span>
      ) : null}
    </div>
  )
}

interface CompartilharProps {
  icone: React.ReactNode
  caixa: string
  titulo: string
  descricao: string
  onClick?: () => void
  desabilitado?: boolean
}

function ItemCompartilhar({
  icone,
  caixa,
  titulo,
  descricao,
  onClick,
  desabilitado,
}: CompartilharProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desabilitado}
      className={`flex w-full items-center justify-between gap-3 rounded-xl bg-card p-4 text-left shadow-sm transition-colors ${
        desabilitado ? 'cursor-not-allowed opacity-70' : 'active:bg-canvas'
      }`}
    >
      <span className="flex min-w-0 items-center gap-3.5">
        <span
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${caixa}`}
          aria-hidden="true"
        >
          {icone}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold text-ink">{titulo}</span>
          <span className="truncate text-[13px] text-muted">{descricao}</span>
        </span>
      </span>
      {desabilitado ? (
        <span className="shrink-0 rounded-full bg-line px-2 py-0.5 text-[11px] font-bold text-ink-soft">
          Em breve
        </span>
      ) : (
        <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden="true" />
      )}
    </button>
  )
}

interface ConfigCamposProps {
  config: ConfigEscala
  campos: Campo[]
  dirigentes: Dirigente[]
  sincronizado: boolean
  aoAlterarConfig: (patch: Partial<ConfigEscala>) => void
  aoAlterarCampos: (lista: Campo[]) => void
  aoExportar: () => void
  aoCopiarLink: () => void
}

export default function ConfigCampos({
  config,
  campos,
  dirigentes,
  sincronizado,
  aoAlterarConfig,
  aoAlterarCampos,
  aoExportar,
  aoCopiarLink,
}: ConfigCamposProps) {
  const [form, setForm] = useState<FormCampo | null>(null)
  const [erro, setErro] = useState('')
  const [editandoCong, setEditandoCong] = useState(false)
  const [pin, setPin] = useState(() => pinSalvo())
  const [pinSalvoOk, setPinSalvoOk] = useState(false)

  const horarios = [...new Set([...HORARIOS_PADRAO, ...campos.map((c) => c.horario)])].sort()
  const ativos = dirigentes.filter((d) => d.ativo !== false && d.nome)
  const fixaLigada = config.designacao_fixa === true

  function abrir(novo: FormCampo) {
    setErro('')
    setForm(novo)
  }

  function fechar() {
    setForm(null)
    setErro('')
  }

  function salvar() {
    if (!form?.local.trim()) {
      setErro('Informe o ponto de encontro.')
      return
    }

    const registro: Campo = {
      ...form,
      local: form.local.trim(),
      diaSemana: Number(form.diaSemana),
      fixo: form.fixo || null,
      id: form.id ?? novoId(),
    }

    const existe = campos.some((c) => c.id === registro.id)
    aoAlterarCampos(
      existe ? campos.map((c) => (c.id === registro.id ? registro : c)) : [...campos, registro],
    )
    fechar()
  }

  function remover(id: string) {
    aoAlterarCampos(campos.filter((x) => x.id !== id))
    fechar()
  }

  function salvarPin() {
    definirPin(pin.trim())
    setPin(pin.trim())
    setPinSalvoOk(true)
    window.setTimeout(() => setPinSalvoOk(false), 2000)
  }

  const ordenados = [...campos].sort((a, b) => {
    if (a.diaSemana !== b.diaSemana) return a.diaSemana - b.diaSemana
    return String(a.horario).localeCompare(String(b.horario))
  })

  return (
    <div className="space-y-6">
      <header>
        <Kicker className="text-muted">Ajustes do sistema</Kicker>
        <h1 className="mt-1 text-[26px] font-bold tracking-tight text-ink">Configurações</h1>
      </header>

      <div className="rounded-xl bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-teal-tint text-teal">
              <Church className="size-6" aria-hidden="true" />
            </span>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-ink">
                {config.congregacao || config.titulo || 'Minha congregação'}
              </span>
              <div className="mt-0.5 flex min-w-0 items-center gap-2">
                <span className="truncate text-[13px] text-muted">{config.titulo}</span>
                <span className="text-[10px] text-muted" aria-hidden="true">
                  •
                </span>
                <span className="shrink-0 rounded-full bg-success-bg px-2 py-0.5 text-[11px] font-bold text-success">
                  Em uso
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            aria-label="Editar congregação"
            onClick={() => setEditandoCong(true)}
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-teal-tint hover:text-teal"
          >
            <Pencil className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <section className="space-y-3">
        <TituloSecao
          titulo="Locais e horários"
          badge={`${campos.length} ${campos.length === 1 ? 'dia ativo' : 'dias ativos'}`}
        />
        <div className="flex flex-col gap-2">
          {ordenados.map((c) => {
            const fixo = ativos.find((d) => d.id === c.fixo)
            return (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-card p-4 shadow-sm"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-canvas text-teal">
                    <MapPin className="size-5" aria-hidden="true" />
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-semibold text-ink">{c.local}</span>
                    <span className="mt-0.5 text-[13px] text-ink-soft">
                      {infoDia(c.diaSemana).nome} ({c.horario})
                    </span>
                    {fixo ? (
                      <span className="mt-0.5 text-[13px] font-semibold text-teal">
                        Fixo: {fixo.nome}
                      </span>
                    ) : null}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label={`Editar ${c.local}, ${infoDia(c.diaSemana).nome}`}
                  onClick={() =>
                    abrir({ ...c, diaSemana: Number(c.diaSemana), fixo: c.fixo ?? null })
                  }
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:text-teal"
                >
                  <MoreVertical className="size-[18px]" aria-hidden="true" />
                </button>
              </div>
            )
          })}

          <button
            type="button"
            onClick={() => abrir(vazio())}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-tint px-4 py-3.5 text-sm font-semibold text-teal shadow-sm transition-colors active:bg-canvas"
          >
            <Plus className="size-5" aria-hidden="true" />
            Adicionar ponto de encontro
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <TituloSecao
          titulo="Regras do Rodízio"
          descricao="Critérios inteligentes para a geração automática da escala"
        />
        <div className="divide-y divide-line-soft overflow-hidden rounded-xl bg-card shadow-sm">
          <Linha
            rotulo="Evitar dias consecutivos"
            descricao="Garante intervalo de descanso para o mesmo dirigente"
            acao={
              <Toggle
                rotulo="Evitar dias consecutivos"
                checked={config.evitar_consecutivos !== false}
                aoMudar={(valor) => aoAlterarConfig({ evitar_consecutivos: valor })}
              />
            }
          />
          <Linha
            rotulo="Equilibrar fins de semana"
            descricao="Distribui saídas de sábado e domingo de forma equitativa"
            acao={
              <Toggle
                rotulo="Equilibrar fins de semana"
                checked={config.equilibrar_fds !== false}
                aoMudar={(valor) => aoAlterarConfig({ equilibrar_fds: valor })}
              />
            }
          />
          <Linha
            rotulo="Priorizar apoio ministerial"
            descricao="Pareia novos dirigentes com irmãos experientes"
            acao={
              <span className="flex shrink-0 items-center gap-2">
                <span className="rounded-full bg-line px-2 py-0.5 text-[11px] font-bold text-ink-soft">
                  Em breve
                </span>
                <Toggle rotulo="Priorizar apoio ministerial" checked={false} aoMudar={() => {}} disabled />
              </span>
            }
          />
          <Linha
            rotulo="Limite mensal por dirigente"
            descricao={
              config.limite_mensal
                ? 'Máximo sugerido no algoritmo'
                : 'Sem limite: distribui o máximo possível'
            }
            acao={
              <Stepper
                rotulo="limite mensal"
                valor={config.limite_mensal ?? 3}
                min={0}
                max={10}
                aoMudar={(valor) => aoAlterarConfig({ limite_mensal: valor })}
              />
            }
          />
          <Linha
            rotulo="Designação fixa"
            descricao={
              fixaLigada
                ? 'Cada dia usa a pessoa fixa cadastrada nele.'
                : 'Distribui conforme a frequência de cada ficha.'
            }
            acao={
              <Toggle
                rotulo="Designação fixa"
                checked={fixaLigada}
                aoMudar={(valor) => aoAlterarConfig({ designacao_fixa: valor })}
              />
            }
          />
          <Linha
            rotulo="Frequência padrão"
            descricao="Usada nas fichas novas e como referência do rodízio."
            acao={
              <Select
                aria-label="Frequência padrão"
                className="w-36"
                value={config.frequencia_padrao}
                onChange={(e) => aoAlterarConfig({ frequencia_padrao: e.target.value })}
              >
                {FREQUENCIAS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </Select>
            }
          />
        </div>
        {fixaLigada && !campos.some((c) => c.fixo) ? (
          <p className="rounded-xl border-l-2 border-crimson bg-crimson-bg px-3 py-2 text-[13px] text-ink">
            Nenhum dia tem “Quem dirige” definido: informe a pessoa fixa de cada dia em Locais e
            horários.
          </p>
        ) : null}
      </section>

      <section className="space-y-2">
        <TituloSecao
          titulo="Compartilhamento"
          descricao="Distribuição oficial da escala para o grupo"
        />
        <div className="flex flex-col gap-2">
          <ItemCompartilhar
            icone={<FileText className="size-6" />}
            caixa="bg-teal-tint text-teal"
            titulo="Gerar PDF da Escala Mensal"
            descricao="Quadro de avisos em formato A4"
            onClick={aoExportar}
          />
          <ItemCompartilhar
            icone={<Send className="size-6" />}
            caixa="bg-success-bg text-success"
            titulo="Aviso por WhatsApp"
            descricao="Copie o link da escala e envie ao grupo"
            onClick={aoCopiarLink}
          />
          <ItemCompartilhar
            icone={<RefreshCw className="size-6" />}
            caixa="bg-[#e6f7fb] text-[#006877]"
            titulo="Sincronizar Google Agenda"
            descricao="Feed de calendário em tempo real"
            desabilitado
          />
        </div>
      </section>

      <section>
        <div className="flex flex-col space-y-4 rounded-xl bg-canvas p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2.5">
              <Cloud className="size-[22px] text-ink-soft" aria-hidden="true" />
              <span className="text-sm font-semibold text-ink">Backup e Segurança</span>
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                sincronizado ? 'bg-success-bg text-success' : 'bg-crimson-bg text-crimson'
              }`}
            >
              {sincronizado ? 'Nuvem OK' : 'Salvo local'}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              disabled
              className="flex-1 cursor-not-allowed rounded-lg bg-card px-4 py-2.5 text-sm font-semibold text-ink-soft shadow-sm"
            >
              Fazer Backup
            </button>
            <button
              type="button"
              disabled
              className="flex-1 cursor-not-allowed rounded-lg bg-card px-4 py-2.5 text-sm font-semibold text-muted shadow-sm"
            >
              Restaurar
            </button>
          </div>
          <p className="text-center text-[11px] text-muted">
            Backup manual e restauração: em breve. Enquanto isso, tudo é salvo na nuvem
            automaticamente.
          </p>
        </div>
      </section>

      <section className="space-y-2">
        <TituloSecao titulo="Acesso" descricao="Proteção da API com PIN deste aparelho" />
        <div className="divide-y divide-line-soft overflow-hidden rounded-xl bg-card shadow-sm">
          <Linha
            rotulo="PIN de proteção"
            descricao={
              pin
                ? 'PIN salvo neste aparelho. Enviado a cada pedido à API.'
                : 'Se o servidor exigir APP_PIN, informe o PIN aqui.'
            }
            acao={
              <Botao onClick={salvarPin}>
                <Check className="size-4" aria-hidden="true" />
                {pinSalvoOk ? 'Salvo' : 'Salvar'}
              </Botao>
            }
          >
            <Input
              id="cfg-pin"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              className="mt-1 max-w-44"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Sem PIN"
              aria-describedby="cfg-pin-ajuda"
            />
            <p id="cfg-pin-ajuda" className="sr-only">
              Guardado somente neste aparelho.
            </p>
          </Linha>
        </div>
        <p className="px-1 text-[13px] text-muted">
          Fica guardado só neste aparelho; deixe em branco se o servidor não usa PIN.
        </p>
      </section>

      {!ordenados.length ? (
        <Vazio
          icone={MapPin}
          titulo="Nenhum dia de campo configurado. Cadastre ao menos um dia da semana com horário e ponto de encontro."
          acao={
            <Botao variante="primario" onClick={() => abrir(vazio())}>
              <Plus className="size-4" aria-hidden="true" />
              Cadastrar dia de campo
            </Botao>
          }
        />
      ) : null}

      <footer className="flex flex-col items-center gap-1 pb-4 pt-2 text-center">
        <span className="mb-1 flex size-8 items-center justify-center rounded-full bg-teal-tint text-teal">
          <ShieldCheck className="size-[18px]" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold text-ink">Dirigentes</span>
        <span className="text-[11px] font-semibold text-muted">
          {config.congregacao ? `${config.congregacao} • ` : ''}Atualizado {ATUALIZADO}
        </span>
      </footer>

      <Modal
        aberto={form !== null}
        aoFechar={fechar}
        titulo={form?.id ? 'Editar dia de campo' : 'Novo dia de campo'}
        descricao="Define uma linha da programação."
        largura="max-w-lg"
      >
        {form ? (
          <div className="space-y-4 px-5 py-4">
            <div>
              <Rotulo htmlFor="campo-dia">Dia da semana</Rotulo>
              <Select
                id="campo-dia"
                value={form.diaSemana}
                onChange={(e) => setForm({ ...form, diaSemana: Number(e.target.value) })}
              >
                {DIAS_SEMANA.map((d) => (
                  <option key={d.idx} value={d.idx}>
                    {d.nome}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Rotulo htmlFor="campo-hora">Horário</Rotulo>
              <Input
                id="campo-hora"
                type="time"
                value={form.horario}
                onChange={(e) => setForm({ ...form, horario: e.target.value })}
                list="horarios-campo"
              />
              <datalist id="horarios-campo">
                {horarios.map((h) => (
                  <option key={h} value={h} />
                ))}
              </datalist>
            </div>

            <div>
              <Rotulo htmlFor="campo-local">Ponto de encontro</Rotulo>
              <Input
                id="campo-local"
                value={form.local}
                onChange={(e) => setForm({ ...form, local: e.target.value })}
                placeholder="Ex.: Terminal Rodoviário"
              />
            </div>

            <div>
              <Rotulo htmlFor="campo-fixo">Quem dirige</Rotulo>
              <Select
                id="campo-fixo"
                value={form.fixo ?? ''}
                onChange={(e) => setForm({ ...form, fixo: e.target.value || null })}
              >
                <option value="">Rodízio automático</option>
                {ativos.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nome}
                  </option>
                ))}
              </Select>
              <p className="mt-1.5 text-[13px] text-muted">
                Com a designação fixa ligada, esta pessoa sai em todas as datas deste dia.
              </p>
            </div>

            {erro ? (
              <p role="alert" className="text-sm font-semibold text-crimson">
                {erro}
              </p>
            ) : null}

            <Botao variante="primario" className="w-full" onClick={salvar}>
              <Check className="size-4" aria-hidden="true" />
              Salvar dia de campo
            </Botao>

            {form.id ? (
              <div className="flex items-center justify-between gap-2 border-t border-line-soft pt-4">
                <p className="flex items-center gap-1.5 text-[13px] text-muted">
                  <Lock className="size-3.5" aria-hidden="true" />
                  Uma linha da programação
                </p>
                <Botao variante="fantasma" onClick={() => remover(form.id!)}>
                  <Trash className="size-4 text-crimson" aria-hidden="true" />
                  Excluir
                </Botao>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        aberto={editandoCong}
        aoFechar={() => setEditandoCong(false)}
        titulo="Cabeçalho da escala"
        descricao="Aparece no topo da programação e em toda a exportação em PDF e imagem."
        largura="max-w-lg"
      >
        <div className="space-y-4 px-5 py-4">
          <div>
            <Rotulo htmlFor="cfg-cong">Congregação / Campo</Rotulo>
            <Input
              id="cfg-cong"
              value={config.congregacao}
              onChange={(e) => aoAlterarConfig({ congregacao: e.target.value })}
              placeholder="Ex.: São João do Paraíso"
              autoFocus
            />
          </div>
          <div>
            <Rotulo htmlFor="cfg-titulo">Título da escala</Rotulo>
            <Input
              id="cfg-titulo"
              value={config.titulo}
              onChange={(e) => aoAlterarConfig({ titulo: e.target.value })}
              placeholder="Ex.: Designação de Campo"
            />
          </div>
          <Botao variante="primario" className="w-full" onClick={() => setEditandoCong(false)}>
            <Check className="size-4" aria-hidden="true" />
            Concluir
          </Botao>
        </div>
      </Modal>
    </div>
  )
}
