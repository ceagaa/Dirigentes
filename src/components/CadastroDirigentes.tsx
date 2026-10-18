import type { Campo, Dirigente, FrequenciaId } from '../lib/dominio'
import { useMemo, useState } from 'react'
import { Check, Phone, Plus, Trash, UserPlus, Users } from 'lucide-react'
import { FREQUENCIAS, HORARIOS_PADRAO, ORDEM_DIAS, infoDia } from '../lib/constants'
import { Botao, Chip, Input, Rotulo, Select, Vazio } from './ui'

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
    setForm(null)
    setErro('')
  }

  function remover(id: string) {
    aoAlterar(dirigentes.filter((d) => d.id !== id))
  }

  function alternarAtivo(id: string) {
    aoAlterar(dirigentes.map((d) => (d.id === id ? { ...d, ativo: d.ativo === false } : d)))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <section className="lg:sticky lg:top-[96px] lg:self-start">
        <div className="border border-line bg-paper">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="font-display text-base text-ink">
              {form ? (form.id ? 'Editar dirigente' : 'Novo dirigente') : 'Fichas'}
            </h2>
            {form ? (
              <Botao variante="fantasma" onClick={() => setForm(null)}>
                Cancelar
              </Botao>
            ) : (
              <Botao variante="primario" onClick={() => abrir()}>
                <Plus className="size-4" />
                Novo
              </Botao>
            )}
          </div>

          {form ? (
            <div className="space-y-4 px-4 py-4">
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

              <label className="flex cursor-pointer items-center gap-2.5 border border-line bg-canvas px-3 py-2.5">
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
                <p className="border-l-2 border-wine bg-wine-soft px-3 py-2 text-[13px] text-ink">
                  Sem dias ou horários marcados este dirigente fica fora do rodízio automático.
                </p>
              ) : null}

              <Botao variante="primario" className="w-full" onClick={salvar}>
                <Check className="size-4" />
                Salvar dirigente
              </Botao>
            </div>
          ) : (
            <p className="px-4 py-4 text-sm text-muted">
              Fichas guardam a frequência, os dias e os horários que alimentam o rodízio
              automático.
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-lg text-ink">
            <Users className="size-5 text-petrol" aria-hidden="true" />
            Dirigentes cadastrados
          </h2>
          <p className="text-sm text-muted">
            {ativos} ativo{ativos === 1 ? '' : 's'} de {dirigentes.length}
          </p>
        </div>

        {!dirigentes.length ? (
          <Vazio
            icone={UserPlus}
            titulo="Nenhum dirigente cadastrado. Comece pela ficha ao lado: nome, frequência e dias em que a pessoa pode sair ao campo."
            acao={
              <Botao variante="primario" onClick={() => abrir()}>
                <Plus className="size-4" />
                Cadastrar primeiro dirigente
              </Botao>
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {dirigentes.map((d) => {
              const inativo = d.ativo === false
              return (
                <li
                  key={d.id}
                  className={`flex flex-col gap-3 border bg-paper px-4 py-3.5 ${
                    inativo ? 'border-line opacity-60' : 'border-line'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-base leading-tight text-ink">{d.nome}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-muted">
                        <Phone className="size-3.5" aria-hidden="true" />
                        {d.telefone || 'sem telefone'}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded border px-2 py-0.5 text-[11px] font-bold ${
                        inativo
                          ? 'border-line bg-canvas text-muted'
                          : 'border-petrol bg-petrol-soft text-petrol'
                      }`}
                    >
                      {inativo ? 'Inativo' : 'Ativo'}
                    </span>
                  </div>

                  <dl className="grid gap-2 text-[13px]">
                    <div>
                      <dt className="text-[11px] font-bold text-muted">Frequência</dt>
                      <dd className="text-ink">
                        {FREQUENCIAS.find((f) => f.id === d.frequencia)?.label ?? 'Semanal'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold text-muted">Dias</dt>
                      <dd className="flex flex-wrap gap-1">
                        {(d.dias ?? []).length ? (
                          d.dias.map((idx) => (
                            <span
                              key={idx}
                              className="rounded bg-canvas px-1.5 py-0.5 text-[11px] font-semibold text-ink"
                            >
                              {infoDia(idx).curto}
                            </span>
                          ))
                        ) : (
                          <span className="text-wine">nenhum</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold text-muted">Horários</dt>
                      <dd className="flex flex-wrap gap-1">
                        {(d.horarios ?? []).length ? (
                          d.horarios.map((h) => (
                            <span
                              key={h}
                              className="rounded bg-canvas px-1.5 py-0.5 text-[11px] font-semibold text-ink"
                            >
                              {h}
                            </span>
                          ))
                        ) : (
                          <span className="text-wine">nenhum</span>
                        )}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-auto flex gap-2 border-t border-line-soft pt-3">
                    <Botao className="flex-1" onClick={() => abrir(d)}>
                      Editar
                    </Botao>
                    <Botao onClick={() => alternarAtivo(d.id)}>
                      {inativo ? 'Ativar' : 'Desativar'}
                    </Botao>
                    <Botao
                      variante="fantasma"
                      aria-label={`Excluir ${d.nome}`}
                      onClick={() => remover(d.id)}
                    >
                      <Trash className="size-4 text-wine" />
                    </Botao>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
