import type { Campo, Dirigente, FrequenciaId } from '../lib/dominio'
import { useMemo, useState } from 'react'
import {
  Ban,
  CalendarDays,
  Check,
  ChevronRight,
  CircleAlert,
  Info,
  MessageCircle,
  Phone,
  Scale,
  Search,
  SlidersHorizontal,
  Trash,
  UserPlus,
  UserX,
  Users,
} from 'lucide-react'
import { FREQUENCIAS, HORARIOS_PADRAO, MESES, ORDEM_DIAS, infoDia } from '../lib/constants'
import { Botao, Chip, Input, Kicker, Modal, Rotulo, Select, Vazio } from './ui'

type FormDirigente = Partial<Dirigente> & {
  nome: string
  telefone: string
  ativo: boolean
  frequencia: FrequenciaId | string
  dias: number[]
  horarios: string[]
}

type Filtro = 'todos' | 'ativos' | 'inativos'

function novoId(): string {
  return `dir-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

function formularioVazio(frequenciaPadrao?: string): FormDirigente {
  return {
    nome: '',
    telefone: '',
    ativo: true,
    frequencia: frequenciaPadrao ?? 'quinzenal',
    dias: [],
    horarios: [],
  }
}

function iniciais(nome: string): string {
  return (
    nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0] ?? '')
      .join('')
      .toUpperCase() || '?'
  )
}

function rotuloFrequencia(id: string): string {
  return FREQUENCIAS.find((f) => f.id === id)?.label ?? 'Semanal'
}

function linkWhatsApp(telefone: string): string {
  const digitos = telefone.replace(/\D/g, '')
  if (!digitos) return ''
  const comDdi = digitos.startsWith('55') ? digitos : `55${digitos}`
  return `https://wa.me/${comDdi}`
}

interface CadastroDirigentesProps {
  dirigentes: Dirigente[]
  campos: Campo[]
  frequenciaPadrao: string
  ano: number
  mes: number
  /** Designações efetivas do mês corrente (iso → id). */
  efetivas: Record<string, string>
  aoAlterar: (lista: Dirigente[]) => void
  aoIrParaConfig: () => void
}

export default function CadastroDirigentes({
  dirigentes,
  campos,
  frequenciaPadrao,
  ano,
  mes,
  efetivas,
  aoAlterar,
  aoIrParaConfig,
}: CadastroDirigentesProps) {
  const [form, setForm] = useState<FormDirigente | null>(null)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')

  const horarios = useMemo(() => {
    const conjunto = new Set([...HORARIOS_PADRAO])
    for (const c of campos) if (c.horario) conjunto.add(c.horario)
    for (const d of dirigentes) for (const h of d.horarios ?? []) conjunto.add(h)
    return [...conjunto].sort()
  }, [campos, dirigentes])

  const ativos = dirigentes.filter((d) => d.ativo !== false)
  const inativos = dirigentes.filter((d) => d.ativo === false)

  const contagem = useMemo(() => {
    const mapa: Record<string, number> = {}
    for (const id of Object.values(efetivas)) {
      if (id) mapa[id] = (mapa[id] ?? 0) + 1
    }
    return mapa
  }, [efetivas])

  const diasGerados = Object.values(contagem).reduce((soma, n) => soma + n, 0)
  const ativosComEscala = ativos.filter((d) => (contagem[d.id] ?? 0) > 0).length
  const semEscala = ativos.length - ativosComEscala
  const media = ativos.length ? diasGerados / ativos.length : 0
  const resumoMes = `${MESES[mes].slice(0, 3)}/${String(ano).slice(2)}`

  const textoBusca = busca.trim().toLowerCase()
  const visiveis = dirigentes.filter((d) => {
    if (filtro === 'ativos' && d.ativo === false) return false
    if (filtro === 'inativos' && d.ativo !== false) return false
    if (!textoBusca) return true
    const partes = [
      d.nome,
      rotuloFrequencia(d.frequencia),
      ...(d.dias ?? []).map((idx) => infoDia(idx).curto),
      ...(d.horarios ?? []),
    ]
    return partes.join(' ').toLowerCase().includes(textoBusca)
  })

  function abrir(novo: Dirigente | null = null) {
    setErro('')
    setForm(
      novo
        ? { ...novo, dias: [...(novo.dias ?? [])], horarios: [...(novo.horarios ?? [])] }
        : formularioVazio(frequenciaPadrao),
    )
  }

  function fechar() {
    setForm(null)
    setErro('')
  }

  function alternar<K extends keyof FormDirigente>(campo: K, valor: FormDirigente[K]) {
    setForm((f) => (f ? { ...f, [campo]: valor } : f))
  }

  function alternarNaLista(campo: 'dias' | 'horarios', valor: number | string) {
    setForm((f) => {
      if (!f) return f
      const lista = new Set<number | string>(f[campo])
      if (lista.has(valor)) lista.delete(valor)
      else lista.add(valor)
      return {
        ...f,
        [campo]: [...lista].sort((a, b) => String(a).localeCompare(String(b))),
      }
    })
  }

  function salvar() {
    if (!form?.nome.trim()) {
      setErro('Informe o nome do dirigente.')
      return
    }

    const registro: Dirigente = {
      ...form,
      nome: form.nome.trim(),
      telefone: form.telefone.trim(),
      id: form.id ?? novoId(),
      dias: [...form.dias].sort((a, b) => a - b),
      horarios: form.horarios,
    }

    const existe = dirigentes.some((d) => d.id === registro.id)
    aoAlterar(
      existe
        ? dirigentes.map((d) => (d.id === registro.id ? registro : d))
        : [...dirigentes, registro],
    )
    fechar()
  }

  function remover(id: string) {
    aoAlterar(dirigentes.filter((d) => d.id !== id))
    fechar()
  }

  function alternarAtivo(id: string) {
    aoAlterar(dirigentes.map((d) => (d.id === id ? { ...d, ativo: d.ativo === false } : d)))
    fechar()
  }

  const chips: Array<{ id: Filtro; rotulo: string; contagem: number; ponto?: string }> = [
    { id: 'todos', rotulo: 'Todos', contagem: dirigentes.length },
    { id: 'ativos', rotulo: 'Disponíveis', contagem: ativos.length, ponto: 'bg-success' },
    { id: 'inativos', rotulo: 'Inativos', contagem: inativos.length, ponto: 'bg-muted' },
  ]

  return (
    <div className="space-y-6">
      <section className="space-y-3 pt-1">
        <div className="flex items-center justify-between gap-3">
          <Kicker className="flex items-center gap-1.5 text-muted">
            <SlidersHorizontal className="size-[18px] text-teal" aria-hidden="true" />
            Gestão de equipe
          </Kicker>
          <Botao variante="primario" className="py-2" onClick={() => abrir()}>
            <UserPlus className="size-5" aria-hidden="true" />
            Novo dirigente
          </Botao>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl bg-card p-4 shadow-sm">
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-teal-tint text-teal">
              <Users className="size-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <Kicker className="text-muted">Dirigentes ativos</Kicker>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-ink">{ativos.length}</span>
                <span className="text-sm font-medium text-ink-soft">aptos para escala</span>
              </div>
            </div>
          </div>
          <div className="hidden shrink-0 flex-col items-end gap-1 text-right sm:flex">
            <span className="flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-xs font-bold text-success">
              <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
              {ativos.length} em dia
            </span>
            <span className="text-[13px] text-muted">
              {inativos.length ? `${inativos.length} inativo${inativos.length === 1 ? '' : 's'}` : 'todos disponíveis'}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted"
              aria-hidden="true"
            />
            <Input
              type="search"
              className="h-11 bg-card pl-11 shadow-sm focus:bg-white"
              placeholder="Buscar por nome ou disponibilidade..."
              aria-label="Buscar dirigentes"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1">
            {chips.map((c) => {
              const ativo = filtro === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => setFiltro(c.id)}
                  className={`flex h-8 shrink-0 snap-start items-center gap-1.5 rounded-full px-3.5 text-xs font-bold shadow-sm transition-all ${
                    ativo ? 'bg-teal text-white' : 'bg-card text-ink-soft hover:text-teal'
                  }`}
                >
                  {c.ponto ? (
                    <span className={`size-2 rounded-full ${c.ponto}`} aria-hidden="true" />
                  ) : null}
                  {c.rotulo}
                  <span className={`text-[11px] font-normal ${ativo ? 'text-white/80' : 'text-muted'}`}>
                    ({c.contagem})
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {dirigentes.length ? (
        <>
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal to-teal-deep p-4 text-white shadow-[0_8px_24px_rgba(13,92,104,0.18)]">
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <Kicker className="flex min-w-0 items-center gap-2 text-[#a3eeff]">
                  <Scale className="size-5 shrink-0" aria-hidden="true" />
                  <span className="truncate">Equilíbrio de escala · {MESES[mes]}</span>
                </Kicker>
                <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-0.5 text-[13px]">
                  {diasGerados} dias gerados
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="flex flex-col justify-between rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                  <span className="text-[13px] text-white/75">Média individual</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold tracking-tight text-white">
                      {media.toFixed(1).replace('.', ',')}
                    </span>
                    <span className="text-[13px] text-white/80">designações</span>
                  </div>
                  <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold">
                    {diasGerados > 0 && semEscala === 0 ? (
                      <>
                        <Check className="size-3.5 text-[#6ffbbe]" aria-hidden="true" />
                        <span className="text-[#6ffbbe]">Distribuição balanceada</span>
                      </>
                    ) : (
                      <>
                        <Info className="size-3.5 text-white/75" aria-hidden="true" />
                        <span className="text-white/75">
                          {diasGerados ? `${semEscala} sem designação` : 'Ainda sem escala no mês'}
                        </span>
                      </>
                    )}
                  </span>
                </div>

                <div className="flex flex-col justify-between rounded-xl bg-white/10 p-3 backdrop-blur-sm">
                  <span className="text-[13px] text-white/75">Sem escala no mês</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold tracking-tight text-[#a3eeff]">
                      {semEscala}
                    </span>
                    <span className="text-[13px] text-white/80">irmãos</span>
                  </div>
                  <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-white/75">
                    <Info className="size-3.5" aria-hidden="true" />
                    {inativos.length
                      ? `${inativos.length} inativo${inativos.length === 1 ? '' : 's'} no período`
                      : 'Todos aptos para escala'}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {inativos.length ? (
            <section className="relative overflow-hidden rounded-2xl bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-crimson-bg text-crimson">
                    <UserX className="size-6" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <Kicker className="font-bold text-crimson">Atenção de escala</Kicker>
                    <h3 className="text-sm font-semibold text-ink">Inativos no período</h3>
                  </div>
                </div>
                <span className="flex shrink-0 items-baseline gap-1 rounded-xl bg-crimson-bg px-3 py-1.5 text-crimson">
                  <span className="text-2xl font-bold tracking-tight">{inativos.length}</span>
                  <span className="text-sm font-medium">indisponíveis</span>
                </span>
              </div>

              <div className="mt-3 space-y-2 rounded-xl bg-canvas/70 p-3">
                {inativos.slice(0, 4).map((d, indice) => (
                  <div
                    key={d.id}
                    className={`flex items-center justify-between gap-2 text-[13px] ${
                      indice < Math.min(inativos.length, 4) - 1 ? 'border-b border-line-soft pb-2' : ''
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="size-2 shrink-0 rounded-full bg-muted" aria-hidden="true" />
                      <span className="truncate font-medium text-ink">{d.nome}</span>
                      <span className="shrink-0 text-muted">({rotuloFrequencia(d.frequencia)})</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-crimson-bg px-2 py-0.5 text-xs font-bold text-crimson">
                      <Ban className="size-3.5" aria-hidden="true" />
                      Fora da escala
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-2.5 flex items-center justify-between gap-2 pt-0.5">
                <span className="flex min-w-0 items-center gap-1.5 text-[13px] text-muted">
                  <Info className="size-4 shrink-0 text-teal" aria-hidden="true" />
                  <span className="truncate">O rodízio ignora inativos automaticamente.</span>
                </span>
                <button
                  type="button"
                  onClick={() => setFiltro('inativos')}
                  className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-teal transition-colors hover:text-teal-deep"
                >
                  Ver fichas
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            </section>
          ) : null}

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2 px-0.5">
              <h2 className="text-lg font-semibold text-ink">Quadro de dirigentes</h2>
              <p className="text-sm text-muted">{visiveis.length} exibidos</p>
            </div>

            {visiveis.length ? (
              <div className="flex flex-col gap-2">
                {visiveis.map((d) => {
                  const inativo = d.ativo === false
                  const n = contagem[d.id] ?? 0
                  const wa = linkWhatsApp(d.telefone ?? '')
                  const diasTexto = (d.dias ?? []).map((idx) => infoDia(idx).curto).join(' · ')
                  const nota = inativo
                    ? 'Fora da escala'
                    : (d.horarios ?? []).length
                      ? (d.horarios ?? []).join(' · ')
                      : 'Sem horário'

                  return (
                    <article
                      key={d.id}
                      className={`rounded-2xl bg-card p-4 shadow-sm transition-all hover:shadow-md ${
                        inativo ? 'opacity-85 hover:opacity-100' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm ${
                              inativo ? 'bg-line text-muted' : 'bg-teal-tint text-teal-deep'
                            }`}
                            aria-hidden="true"
                          >
                            {iniciais(d.nome)}
                          </span>
                          <div className="flex min-w-0 flex-col">
                            <h3
                              className={`truncate text-sm font-semibold ${
                                inativo ? 'text-ink-soft' : 'text-ink'
                              }`}
                            >
                              {d.nome}
                            </h3>
                            <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[13px]">
                              <span
                                className={`shrink-0 font-medium ${
                                  inativo ? 'text-muted' : 'text-teal'
                                }`}
                              >
                                {rotuloFrequencia(d.frequencia)}
                              </span>
                              {!inativo && diasTexto ? (
                                <>
                                  <span className="size-1 shrink-0 rounded-full bg-muted" aria-hidden="true" />
                                  <span className="truncate text-muted">{diasTexto}</span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <span
                          className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                            inativo ? 'bg-line text-ink-soft' : 'bg-success-bg text-success'
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full ${inativo ? 'bg-muted' : 'bg-success'}`}
                            aria-hidden="true"
                          />
                          {inativo ? 'Inativo' : 'Disponível'}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-canvas/70 px-3 py-2 text-[13px]">
                        <span className="flex min-w-0 items-center gap-1.5">
                          <CalendarDays
                            className={`size-[18px] shrink-0 ${inativo ? 'text-muted' : 'text-teal'}`}
                            aria-hidden="true"
                          />
                          <span className="truncate">
                            <span className="font-semibold text-ink">
                              {n} designação{n === 1 ? '' : 's'}
                            </span>{' '}
                            <span className="text-muted">em {resumoMes}</span>
                          </span>
                        </span>
                        <span
                          className={`shrink-0 text-right ${
                            !inativo && !(d.horarios ?? []).length
                              ? 'font-medium text-crimson'
                              : 'text-muted'
                          }`}
                        >
                          {nota}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          {wa ? (
                            <a
                              href={wa}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`Mensagem WhatsApp para ${d.nome}`}
                              className={`flex size-9 items-center justify-center rounded-full transition-colors ${
                                inativo
                                  ? 'bg-canvas text-muted hover:bg-teal-tint hover:text-teal'
                                  : 'bg-teal-tint text-teal hover:bg-teal hover:text-white'
                              }`}
                            >
                              <MessageCircle className="size-[18px]" aria-hidden="true" />
                            </a>
                          ) : null}
                          {d.telefone ? (
                            <a
                              href={`tel:${d.telefone}`}
                              aria-label={`Ligar para ${d.nome}`}
                              className={`flex size-9 items-center justify-center rounded-full transition-colors ${
                                inativo
                                  ? 'bg-canvas text-muted hover:bg-teal-tint hover:text-teal'
                                  : 'bg-canvas text-ink-soft hover:bg-teal-tint hover:text-teal'
                              }`}
                            >
                              <Phone className="size-[18px]" aria-hidden="true" />
                            </a>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => abrir(d)}
                          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[13px] text-muted transition-colors hover:text-teal"
                        >
                          {inativo ? 'Gerenciar ficha' : 'Ver detalhes'}
                          <ChevronRight className="size-[18px]" aria-hidden="true" />
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <Vazio
                icone={Search}
                titulo="Nenhum dirigente corresponde à busca ou ao filtro selecionado."
                acao={
                  <Botao
                    onClick={() => {
                      setBusca('')
                      setFiltro('todos')
                    }}
                  >
                    Limpar filtros
                  </Botao>
                }
              />
            )}
          </section>
        </>
      ) : (
        <Vazio
          icone={UserPlus}
          titulo="Nenhum dirigente cadastrado. Comece pela ficha: nome, frequência e dias em que a pessoa pode sair ao campo."
          acao={
            <Botao variante="primario" onClick={() => abrir()}>
              <UserPlus className="size-4" aria-hidden="true" />
              Cadastrar primeiro dirigente
            </Botao>
          }
        />
      )}

      <section className="space-y-3 pb-2">
        <Kicker className="block px-1 text-muted">Ações e configurações rápidas</Kicker>
        <button
          type="button"
          onClick={aoIrParaConfig}
          className="flex w-full items-center gap-3 rounded-2xl bg-card p-3.5 text-left shadow-sm transition-colors hover:bg-canvas"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-tint text-teal">
            <SlidersHorizontal className="size-[22px]" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-ink">Regras do rodízio</span>
            <span className="truncate text-[13px] text-muted">
              Equilíbrio, folgas e limites mensais
            </span>
          </span>
          <ChevronRight className="ml-auto size-[18px] shrink-0 text-muted" aria-hidden="true" />
        </button>
      </section>

      <Modal
        aberto={form !== null}
        aoFechar={fechar}
        titulo={form?.id ? 'Editar dirigente' : 'Novo dirigente'}
        descricao="Ficha alimenta o rodízio automático."
        largura="max-w-lg"
      >
        {form ? (
          <div className="space-y-4 px-5 py-4">
            <div>
              <Rotulo htmlFor="dir-nome">Nome do dirigente</Rotulo>
              <Input
                id="dir-nome"
                value={form.nome}
                onChange={(e) => alternar('nome', e.target.value)}
                placeholder="Ex.: Carlos Andrade"
                autoFocus
              />
            </div>

            <div>
              <Rotulo htmlFor="dir-telefone">Telefone (opcional)</Rotulo>
              <Input
                id="dir-telefone"
                type="tel"
                value={form.telefone}
                onChange={(e) => alternar('telefone', e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div>
              <Rotulo htmlFor="dir-freq">Frequência de designação</Rotulo>
              <Select
                id="dir-freq"
                value={form.frequencia}
                onChange={(e) => alternar('frequencia', e.target.value)}
              >
                {FREQUENCIAS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </div>

            <fieldset>
              <legend className="mb-1.5 text-[13px] font-semibold text-ink">
                Dias disponíveis
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {ORDEM_DIAS.map((idx) => (
                  <Chip
                    key={idx}
                    ativo={form.dias.includes(idx)}
                    onClick={() => alternarNaLista('dias', idx)}
                  >
                    {infoDia(idx).curto}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-1.5 text-[13px] font-semibold text-ink">
                Horários disponíveis
              </legend>
              <div className="flex flex-wrap gap-1.5">
                {horarios.map((h) => (
                  <Chip
                    key={h}
                    ativo={form.horarios.includes(h)}
                    onClick={() => alternarNaLista('horarios', h)}
                  >
                    {h}
                  </Chip>
                ))}
              </div>
            </fieldset>

            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-canvas px-3 py-2.5">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => alternar('ativo', e.target.checked)}
                className="size-4 accent-teal"
              />
              <span className="text-sm font-semibold text-ink">Dirigente ativo</span>
            </label>

            {erro ? (
              <p role="alert" className="text-sm font-semibold text-crimson">
                {erro}
              </p>
            ) : null}

            {!form.dias.length || !form.horarios.length ? (
              <p className="rounded-xl border-l-2 border-crimson bg-crimson-bg px-3 py-2 text-[13px] text-ink">
                Sem dias ou horários marcados este dirigente fica fora do rodízio automático.
              </p>
            ) : null}

            <Botao variante="primario" className="w-full" onClick={salvar}>
              <Check className="size-4" aria-hidden="true" />
              Salvar dirigente
            </Botao>

            {form.id ? (
              <div className="flex gap-2 border-t border-line-soft pt-4">
                <Botao className="flex-1" onClick={() => alternarAtivo(form.id!)}>
                  {form.ativo === false ? 'Ativar' : 'Desativar'}
                </Botao>
                <Botao variante="fantasma" onClick={() => remover(form.id!)}>
                  <Trash className="size-4 text-crimson" aria-hidden="true" />
                  Excluir
                </Botao>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      {!dirigentes.length ? null : (
        <p className="px-1 text-[13px] text-muted">
          {inativos.length
            ? `Sem designações no mês para os ${inativos.length} inativo${inativos.length === 1 ? '' : 's'}. Toque em "Gerenciar ficha" para reativar.`
            : 'Toque em "Ver detalhes" para editar frequência, dias e horários da ficha.'}
        </p>
      )}

      {campos.length ? null : (
        <p className="flex items-start gap-2 rounded-xl border-l-2 border-crimson bg-crimson-bg px-3 py-2 text-[13px] text-ink">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-crimson" aria-hidden="true" />
          Configure os dias de campo em Configurações para que o rodízio comece a distribuir.
        </p>
      )}
    </div>
  )
}
