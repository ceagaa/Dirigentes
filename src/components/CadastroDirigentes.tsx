import type { Campo, Dirigente, FrequenciaId } from '../lib/dominio'
import { useMemo, useState } from 'react'
import { Check, ChevronRight, Plus, Trash, UserPlus, Users } from 'lucide-react'
import { FREQUENCIAS, HORARIOS_PADRAO, ORDEM_DIAS, infoDia } from '../lib/constants'
import { Botao, Chip, Input, Modal, Rotulo, Select, Vazio } from './ui'

type FormDirigente = Partial<Dirigente> & {
  nome: string
  telefone: string
  ativo: boolean
  frequencia: FrequenciaId | string
  dias: number[]
  horarios: string[]
}

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

interface CadastroDirigentesProps {
  dirigentes: Dirigente[]
  campos: Campo[]
  frequenciaPadrao: string
  aoAlterar: (lista: Dirigente[]) => void
}

export default function CadastroDirigentes({
  dirigentes,
  campos,
  frequenciaPadrao,
  aoAlterar,
}: CadastroDirigentesProps) {
  const [form, setForm] = useState<FormDirigente | null>(null)
  const [erro, setErro] = useState('')

  const horarios = useMemo(() => {
    const conjunto = new Set([...HORARIOS_PADRAO])
    for (const c of campos) if (c.horario) conjunto.add(c.horario)
    for (const d of dirigentes) for (const h of d.horarios ?? []) conjunto.add(h)
    return [...conjunto].sort()
  }, [campos, dirigentes])

  const ativos = dirigentes.filter((d) => d.ativo !== false).length

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

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Equipe</p>
          <h1 className="mt-1.5 font-display text-4xl font-bold leading-none text-ink">
            Dirigentes
          </h1>
          <p className="mt-2 text-sm text-muted">
            {ativos} ativo{ativos === 1 ? '' : 's'} de {dirigentes.length}
          </p>
        </div>
        <Botao variante="primario" onClick={() => abrir()}>
          <Plus className="size-4" />
          Novo
        </Botao>
      </header>

      {!dirigentes.length ? (
        <Vazio
          icone={UserPlus}
          titulo="Nenhum dirigente cadastrado. Comece pela ficha: nome, frequência e dias em que a pessoa pode sair ao campo."
          acao={
            <Botao variante="primario" onClick={() => abrir()}>
              <Plus className="size-4" />
              Cadastrar primeiro dirigente
            </Botao>
          }
        />
      ) : (
        <div className="divide-y divide-line-soft overflow-hidden rounded-2xl border border-line bg-paper">
          {dirigentes.map((d) => {
            const inativo = d.ativo === false
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => abrir(d)}
                className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-petrol-soft ${
                  inativo ? 'opacity-60' : ''
                }`}
              >
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-petrol-soft font-display text-sm font-bold text-petrol"
                  aria-hidden="true"
                >
                  {iniciais(d.nome)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{d.nome}</span>
                  <span className="block truncate text-[13px] text-muted">
                    {rotuloFrequencia(d.frequencia)}
                    {(d.dias ?? []).length
                      ? ` · ${d.dias.map((idx) => infoDia(idx).curto).join(' · ')}`
                      : ' · sem dias'}
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold ${
                    inativo
                      ? 'border-line bg-canvas text-muted'
                      : 'border-petrol bg-petrol-soft text-petrol'
                  }`}
                >
                  {inativo ? 'Inativo' : 'Ativo'}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden="true" />
              </button>
            )
          })}
        </div>
      )}

      <p className="px-1 text-[13px] text-muted">
        Toque em um dirigente para editar, ativar ou excluir a ficha.
      </p>

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
                className="size-4 accent-[#045A6C]"
              />
              <span className="text-sm font-semibold text-ink">Dirigente ativo</span>
            </label>

            {erro ? (
              <p role="alert" className="text-sm font-semibold text-wine">
                {erro}
              </p>
            ) : null}

            {!form.dias.length || !form.horarios.length ? (
              <p className="rounded-xl border-l-2 border-wine bg-wine-soft px-3 py-2 text-[13px] text-ink">
                Sem dias ou horários marcados este dirigente fica fora do rodízio automático.
              </p>
            ) : null}

            <Botao variante="primario" className="w-full" onClick={salvar}>
              <Check className="size-4" />
              Salvar dirigente
            </Botao>

            {form.id ? (
              <div className="flex gap-2 border-t border-line-soft pt-4">
                <Botao className="flex-1" onClick={() => alternarAtivo(form.id!)}>
                  {form.ativo === false ? 'Ativar' : 'Desativar'}
                </Botao>
                <Botao variante="fantasma" onClick={() => remover(form.id!)}>
                  <Trash className="size-4 text-wine" />
                  Excluir
                </Botao>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <div className="flex items-start gap-2 px-1 text-[13px] text-muted">
        <Users className="size-4 shrink-0 text-petrol" aria-hidden="true" />
        <p>
          As fichas guardam frequência, dias e horários — é com isso que o rodízio distribui as
          designações.
        </p>
      </div>
    </div>
  )
}
