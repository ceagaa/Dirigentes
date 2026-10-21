import type { Campo, ConfigEscala, Dirigente } from '../lib/dominio'
import { useState } from 'react'
import { Check, ChevronRight, Lock, Plus, Repeat, Settings, Trash } from 'lucide-react'
import { DIAS_SEMANA, FREQUENCIAS, HORARIOS_PADRAO, infoDia } from '../lib/constants'
import { definirPin, pinSalvo } from '../lib/api'
import { Botao, Input, Modal, Rotulo, Select, Vazio } from './ui'

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
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{rotulo}</p>
        {descricao ? <p className="mt-0.5 text-[13px] text-muted">{descricao}</p> : null}
        {children ? <div className="mt-1">{children}</div> : null}
      </div>
      {acao}
    </div>
  )
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
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Ajustes</p>
        <h1 className="mt-1.5 font-display text-4xl font-bold leading-none text-ink">
          Configurações
        </h1>
      </header>

      <section>
        <h2 className="mb-2 flex items-center gap-2 px-1 font-display text-lg text-ink">
          <Settings className="size-4 text-petrol" aria-hidden="true" />
          Cabeçalho da escala
        </h2>
        <div className="divide-y divide-line-soft overflow-hidden rounded-2xl border border-line bg-paper">
          <div className="px-4 py-3">
            <label htmlFor="cfg-titulo" className="block text-[13px] text-muted">
              Título
            </label>
            <input
              id="cfg-titulo"
              value={config.titulo}
              onChange={(e) => aoAlterarConfig({ titulo: e.target.value })}
              className="w-full bg-transparent text-sm font-semibold text-ink"
            />
          </div>
          <div className="px-4 py-3">
            <label htmlFor="cfg-cong" className="block text-[13px] text-muted">
              Congregação / Campo
            </label>
            <input
              id="cfg-cong"
              value={config.congregacao}
              onChange={(e) => aoAlterarConfig({ congregacao: e.target.value })}
              className="w-full bg-transparent text-sm font-semibold text-ink"
            />
          </div>
        </div>
        <p className="mt-2 px-1 text-[13px] text-muted">
          Aparece no topo da programação e em toda a exportação em PDF e imagem.
        </p>
      </section>

      <section>
        <h2 className="mb-2 px-1 font-display text-lg text-ink">Rodízio</h2>
        <div className="divide-y divide-line-soft overflow-hidden rounded-2xl border border-line bg-paper">
          <Linha
            rotulo="Designação fixa"
            descricao={
              fixaLigada
                ? 'Cada dia usa a pessoa fixa cadastrada nele.'
                : 'Distribui conforme a frequência de cada ficha.'
            }
            acao={
              <Botao
                variante={fixaLigada ? 'vinho' : 'secundario'}
                onClick={() => aoAlterarConfig({ designacao_fixa: !fixaLigada })}
              >
                {fixaLigada ? 'Desligar' : 'Ligar'}
              </Botao>
            }
          />
          <Linha
            rotulo="Frequência padrão"
            descricao="Usada nas fichas novas e como referência do rodízio."
            acao={
              <Select
                aria-label="Frequência padrão"
                className="w-40"
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
          <p className="mt-2 rounded-xl border-l-2 border-wine bg-wine-soft px-3 py-2 text-[13px] text-ink">
            Nenhum dia tem “Quem dirige” definido: informe a pessoa fixa de cada dia abaixo.
          </p>
        ) : null}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-3 px-1">
          <h2 className="font-display text-lg text-ink">Dias de campo</h2>
          <Botao variante="primario" onClick={() => abrir(vazio())}>
            <Plus className="size-4" />
            Novo
          </Botao>
        </div>

        {!ordenados.length ? (
          <Vazio
            icone={Repeat}
            titulo="Nenhum dia de campo configurado. Cadastre ao menos um dia da semana com horário e ponto de encontro."
            acao={
              <Botao variante="primario" onClick={() => abrir(vazio())}>
                <Plus className="size-4" />
                Cadastrar dia de campo
              </Botao>
            }
          />
        ) : (
          <div className="divide-y divide-line-soft overflow-hidden rounded-2xl border border-line bg-paper">
            {ordenados.map((c) => {
              const fimDeSemana = c.diaSemana === 0 || c.diaSemana === 6
              const fixo = ativos.find((d) => d.id === c.fixo)
              return (
                <div key={c.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span
                    className={`size-2.5 shrink-0 rounded-full ${fimDeSemana ? 'bg-petrol' : 'bg-wine'}`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      {infoDia(c.diaSemana).nome} · {c.horario}
                    </p>
                    <p className="truncate text-[13px] text-muted">{c.local}</p>
                    {fixo ? (
                      <p className="text-[13px] font-semibold text-petrol">Fixo: {fixo.nome}</p>
                    ) : null}
                  </div>
                  <Botao
                    variante="secundario"
                    onClick={() =>
                      abrir({ ...c, diaSemana: Number(c.diaSemana), fixo: c.fixo ?? null })
                    }
                  >
                    Editar
                  </Botao>
                  <Botao
                    variante="fantasma"
                    className="px-2.5"
                    aria-label={`Excluir ${infoDia(c.diaSemana).nome}`}
                    onClick={() => remover(c.id)}
                  >
                    <Trash className="size-4 text-wine" />
                  </Botao>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-4 px-1 text-[13px] text-muted">
          <span className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-petrol" aria-hidden="true" />
            Domingo e sábado
          </span>
          <span className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-wine" aria-hidden="true" />
            Dias úteis
          </span>
        </div>
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-2 px-1 font-display text-lg text-ink">
          <Lock className="size-4 text-petrol" aria-hidden="true" />
          Acesso
        </h2>
        <div className="divide-y divide-line-soft overflow-hidden rounded-2xl border border-line bg-paper">
          <Linha
            rotulo="PIN de proteção"
            descricao={
              pin
                ? 'PIN salvo neste aparelho. Enviado a cada pedido à API.'
                : 'Se o servidor exigir APP_PIN, informe o PIN aqui.'
            }
            acao={
              <Botao onClick={salvarPin}>
                <Check className="size-4" />
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
        <p className="mt-2 px-1 text-[13px] text-muted">
          Fica guardado só neste aparelho; deixe em branco se o servidor não usa PIN.
        </p>
      </section>

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
              <p role="alert" className="text-sm font-semibold text-wine">
                {erro}
              </p>
            ) : null}

            <Botao variante="primario" className="w-full" onClick={salvar}>
              <Check className="size-4" />
              Salvar dia de campo
            </Botao>

            {form.id ? (
              <div className="flex items-center justify-between gap-2 border-t border-line-soft pt-4">
                <p className="flex items-center gap-1.5 text-[13px] text-muted">
                  <ChevronRight className="size-3.5" aria-hidden="true" />
                  Uma linha da programação
                </p>
                <Botao variante="fantasma" onClick={() => remover(form.id!)}>
                  <Trash className="size-4 text-wine" />
                  Excluir
                </Botao>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
