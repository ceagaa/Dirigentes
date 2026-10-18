import type { Campo, ConfigEscala, Dirigente } from '../lib/dominio'
import { useState } from 'react'
import {
  CalendarDays,
  Check,
  Clock,
  MapPin,
  Repeat,
  Settings,
  Sparkles,
  Trash,
} from 'lucide-react'
import { DIAS_SEMANA, FREQUENCIAS, HORARIOS_PADRAO, infoDia } from '../lib/constants'
import { Botao, Input, Rotulo, Select, Vazio } from './ui'

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

interface ConfigCamposProps {
  config: ConfigEscala
  campos: Campo[]
  dirigentes: Dirigente[]
  aoAlterarConfig: (patch: Partial<ConfigEscala>) => void
  aoAlterarCampos: (lista: Campo[]) => void
}

export default function ConfigCampos({
  config,
  campos,
  dirigentes,
  aoAlterarConfig,
  aoAlterarCampos,
}: ConfigCamposProps) {
  const [form, setForm] = useState<FormCampo | null>(null)
  const [erro, setErro] = useState('')

  const horarios = [...new Set([...HORARIOS_PADRAO, ...campos.map((c) => c.horario)])].sort()
  const ativos = dirigentes.filter((d) => d.ativo !== false && d.nome)

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
    setForm(null)
    setErro('')
  }

  const ordenados = [...campos].sort((a, b) => {
    if (a.diaSemana !== b.diaSemana) return a.diaSemana - b.diaSemana
    return String(a.horario).localeCompare(String(b.horario))
  })

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <section className="space-y-6 lg:sticky lg:top-[96px] lg:self-start">
        <div className="border border-line bg-paper">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <Settings className="size-4 text-petrol" aria-hidden="true" />
            <h2 className="font-display text-base text-ink">Cabeçalho da escala</h2>
          </div>
          <div className="space-y-4 px-4 py-4">
            <div>
              <Rotulo htmlFor="cfg-titulo">Título</Rotulo>
              <Input
                id="cfg-titulo"
                value={config.titulo}
                onChange={(e) => aoAlterarConfig({ titulo: e.target.value })}
              />
            </div>
            <div>
              <Rotulo htmlFor="cfg-cong">Congregação / Campo</Rotulo>
              <Input
                id="cfg-cong"
                value={config.congregacao}
                onChange={(e) => aoAlterarConfig({ congregacao: e.target.value })}
              />
            </div>
            <p className="border-l-2 border-petrol bg-petrol-soft px-3 py-2 text-[13px] text-ink">
              Este texto aparece no topo da programação e em toda a exportação em PDF e imagem.
            </p>
          </div>
        </div>

        <div className="border border-line bg-paper">
          <div className="flex items-center gap-2 border-b border-line px-4 py-3">
            <Sparkles className="size-4 text-wine" aria-hidden="true" />
            <h2 className="font-display text-base text-ink">Rodízio</h2>
          </div>
          <div className="space-y-4 px-4 py-4">
            <label className="flex cursor-pointer items-start gap-2.5 border border-line bg-canvas px-3 py-2.5">
              <input
                type="checkbox"
                checked={config.designacao_fixa === true}
                onChange={(e) => aoAlterarConfig({ designacao_fixa: e.target.checked })}
                className="mt-0.5 size-4 accent-[#045A6C]"
              />
              <span className="text-sm">
                <span className="font-semibold text-ink">Designação fixa</span>
                <span className="block text-[13px] text-muted">
                  Cada dia de campo usa sempre a pessoa escolhida em “Quem dirige”. Desligado, o
                  rodízio automático distribui conforme a frequência.
                </span>
              </span>
            </label>

            <div>
              <Rotulo htmlFor="cfg-freq">Frequência padrão</Rotulo>
              <Select
                id="cfg-freq"
                value={config.frequencia_padrao}
                onChange={(e) => aoAlterarConfig({ frequencia_padrao: e.target.value })}
              >
                {FREQUENCIAS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </Select>
              <p className="mt-1.5 text-[13px] text-muted">
                Usada nas fichas novas e como referência do rodízio.
              </p>
            </div>

            {config.designacao_fixa && !campos.some((c) => c.fixo) ? (
              <p className="border-l-2 border-wine bg-wine-soft px-3 py-2 text-[13px] text-ink">
                Nenhum dia tem “Quem dirige” definido: informe a pessoa fixa de cada dia na lista
                ao lado.
              </p>
            ) : null}
          </div>
        </div>

        <div className="border border-line bg-paper">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="font-display text-base text-ink">
              {form ? (form.id ? 'Editar dia de campo' : 'Novo dia de campo') : 'Como funciona'}
            </h2>
            {form ? (
              <Botao variante="fantasma" onClick={() => setForm(null)}>
                Cancelar
              </Botao>
            ) : null}
          </div>

          {form ? (
            <div className="space-y-4 px-4 py-4">
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
                <p role="alert" className="text-sm font-semibold text-wine">
                  {erro}
                </p>
              ) : null}

              <Botao variante="primario" className="w-full" onClick={salvar}>
                <Check className="size-4" />
                Salvar dia de campo
              </Botao>
            </div>
          ) : (
            <div className="space-y-2 px-4 py-4 text-sm text-muted">
              <p>
                Os dias cadastrados aqui definem as linhas da programação. Toda vez que você gerar
                a escala, o sistema distribui os dirigentes disponíveis entre esses dias.
              </p>
              <p>
                Alterações valem a partir da próxima geração — as designações já marcadas à mão
                continuam preservadas.
              </p>
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-lg text-ink">
            <CalendarDays className="size-5 text-wine" aria-hidden="true" />
            Dias de campo fixos
          </h2>
          <Botao
            variante="primario"
            onClick={() => {
              setErro('')
              setForm(vazio())
            }}
          >
            Novo dia de campo
          </Botao>
        </div>

        {!ordenados.length ? (
          <Vazio
            icone={MapPin}
            titulo="Nenhum dia de campo configurado. Cadastre ao menos um dia da semana com horário e ponto de encontro para gerar a escala."
            acao={
              <Botao
                variante="primario"
                onClick={() => {
                  setErro('')
                  setForm(vazio())
                }}
              >
                Cadastrar dia de campo
              </Botao>
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {ordenados.map((c) => {
              const fimDeSemana = c.diaSemana === 0 || c.diaSemana === 6
              const cor = fimDeSemana ? 'bg-petrol' : 'bg-wine'
              const fixo = ativos.find((d) => d.id === c.fixo)
              return (
                <li key={c.id} className="border border-line bg-paper">
                  <div className={`flex items-center justify-between gap-3 px-4 py-2.5 ${cor}`}>
                    <p className="font-display text-base font-bold text-white">
                      {infoDia(c.diaSemana).nome}
                    </p>
                    <p className="text-sm font-bold text-white">{c.horario}</p>
                  </div>
                  <div className="space-y-2 px-4 py-3">
                    <p className="flex items-center gap-2 text-sm text-ink">
                      <MapPin className="size-4 shrink-0 text-muted" aria-hidden="true" />
                      {c.local}
                    </p>
                    <p className="flex items-center gap-2 text-[13px]">
                      <Repeat className="size-3.5 shrink-0 text-muted" aria-hidden="true" />
                      {fixo ? (
                        <span className="font-semibold text-petrol">Fixo: {fixo.nome}</span>
                      ) : (
                        <span className="text-muted">Rodízio automático</span>
                      )}
                    </p>
                    <div className="flex items-center justify-between gap-3 border-t border-line-soft pt-2">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-muted">
                        {fimDeSemana ? 'Fim de semana' : 'Dia útil'}
                      </span>
                      <div className="flex shrink-0 gap-1">
                        <Botao
                          variante="fantasma"
                          onClick={() => {
                            setErro('')
                            setForm({ ...c, diaSemana: Number(c.diaSemana), fixo: c.fixo ?? null })
                          }}
                        >
                          Editar
                        </Botao>
                        <Botao
                          variante="fantasma"
                          aria-label={`Excluir ${infoDia(c.diaSemana).nome}`}
                          onClick={() => aoAlterarCampos(campos.filter((x) => x.id !== c.id))}
                        >
                          <Trash className="size-4 text-wine" />
                        </Botao>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <div className="mt-6 border border-line bg-paper px-4 py-3 text-[13px] text-muted">
          <div className="flex items-start gap-2">
            <Clock className="size-4 shrink-0 text-petrol" aria-hidden="true" />
            <p>
              Use o mesmo horário no dia de campo e nas fichas dos dirigentes para que o rodízio
              encontre as pessoas certas.
            </p>
          </div>
          <div className="mt-3 flex flex-wrap gap-4 border-t border-line-soft pt-3">
            <span className="flex items-center gap-2">
              <span className="size-3.5 bg-petrol" aria-hidden="true" />
              Domingo e sábado
            </span>
            <span className="flex items-center gap-2">
              <span className="size-3.5 bg-wine" aria-hidden="true" />
              Dias úteis
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}
