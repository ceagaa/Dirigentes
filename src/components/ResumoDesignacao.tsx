import type { Campo, Dirigente, Ocorrencia } from '../lib/dominio'
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Clock,
  Eye,
  MapPin,
  Sparkles,
  UserPlus,
} from 'lucide-react'
import { MESES, nomeDiaCurto } from '../lib/constants'
import { isoDeHoje } from '../lib/datas'
import { Botao, Select } from './ui'

function ddMm(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
}

/** Data de hoje resolvida uma vez (evita chamada instável de Date no render). */
const HOJE_ISO = isoDeHoje()
const [HOJE_ANO, HOJE_MES] = HOJE_ISO.split('-').map(Number)

interface Status {
  rotulo: string
  estilo: string
}

interface ResumoDesignacaoProps {
  ano: number
  mes: number
  aoMudarData: (ano: number, mes: number) => void
  ocorrencias: Ocorrencia[]
  efetivas: Record<string, string>
  dirigentes: Dirigente[]
  campos: Campo[]
  pronta: boolean
  proximoNome: string
  proximoPronto: boolean
  aoAdiantar: () => void
  aoVerProximo: () => void
  aoMontar: () => void
  aoVer: () => void
  aoCopiarLink: () => void
  aoConfigurar: () => void
  aoCadastrar: () => void
}

export default function ResumoDesignacao({
  ano,
  mes,
  aoMudarData,
  ocorrencias,
  efetivas,
  dirigentes,
  campos,
  pronta,
  proximoNome,
  proximoPronto,
  aoAdiantar,
  aoVerProximo,
  aoMontar,
  aoVer,
  aoCopiarLink,
  aoConfigurar,
  aoCadastrar,
}: ResumoDesignacaoProps) {
  const ehMesAtual = ano === HOJE_ANO && mes === HOJE_MES - 1

  const proximas = ehMesAtual ? ocorrencias.filter((o) => o.iso >= HOJE_ISO) : ocorrencias
  const deHoje = proximas.find((o) => o.iso === HOJE_ISO) ?? null
  const destaque = deHoje ?? proximas[0] ?? null
  const lista = proximas.slice(0, 8)
  const restam = proximas.length - lista.length

  const anos = Array.from({ length: 9 }, (_, i) => ano - 4 + i)
  const porId = new Map(dirigentes.map((d) => [d.id, d]))
  const designados = ocorrencias.filter((o) => efetivas[o.key]).length
  const semCampos = !campos.length
  const semDirigentes = !dirigentes.length

  const status: Status = semCampos
    ? { rotulo: 'Sem dias de campo', estilo: 'bg-canvas text-muted border-line' }
    : !ocorrencias.length
      ? { rotulo: 'Mês sem saídas', estilo: 'bg-canvas text-muted border-line' }
      : pronta
        ? { rotulo: 'Designação pronta', estilo: 'bg-petrol-soft text-petrol border-petrol' }
        : { rotulo: 'Pendente de montar', estilo: 'bg-wine-soft text-wine border-wine' }

  const nomeDestaque = destaque ? porId.get(efetivas[destaque.key])?.nome : undefined

  const rotuloDestaque = deHoje
    ? 'Quem dirige hoje'
    : ehMesAtual
      ? 'Próxima saída'
      : 'Primeira saída'

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted">Designação</p>
          <span className={`border px-2.5 py-1 text-[11px] font-bold ${status.estilo}`} role="status">
            {status.rotulo}
          </span>
        </div>
        <h1 className="mt-1.5 font-display text-4xl font-bold leading-none text-ink">
          {MESES[mes]} <span className="text-2xl text-muted">{ano}</span>
        </h1>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Botao
            variante="secundario"
            className="px-3"
            aria-label="Mês anterior"
            onClick={() => (mes === 0 ? aoMudarData(ano - 1, 11) : aoMudarData(ano, mes - 1))}
          >
            <ChevronLeft className="size-4" />
          </Botao>
          <Select
            aria-label="Mês"
            className="w-36"
            value={mes}
            onChange={(e) => aoMudarData(ano, Number(e.target.value))}
          >
            {MESES.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Ano"
            className="w-24"
            value={ano}
            onChange={(e) => aoMudarData(Number(e.target.value), mes)}
          >
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
          <Botao
            variante="secundario"
            className="px-3"
            aria-label="Próximo mês"
            onClick={() => (mes === 11 ? aoMudarData(ano + 1, 0) : aoMudarData(ano, mes + 1))}
          >
            <ChevronRight className="size-4" />
          </Botao>
        </div>
      </header>

      {destaque ? (
        <section className="rounded-3xl bg-petrol px-6 py-7 text-white">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/70">
              {rotuloDestaque}
            </p>
            <p className="text-xs font-semibold text-white/70">
              {nomeDiaCurto(destaque.diaSemana)}, {ddMm(destaque.iso)}
            </p>
          </div>
          <p
            className={`mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl ${
              nomeDestaque ? '' : 'text-white/70'
            }`}
          >
            {nomeDestaque ?? 'Sem designação'}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/85">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              {destaque.campo.local}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="size-4 shrink-0" aria-hidden="true" />
              {destaque.campo.horario}
            </span>
          </div>
          {!nomeDestaque ? (
            <Botao variante="secundario" className="mt-5" onClick={aoMontar}>
              <Sparkles className="size-4" />
              Montar designação
            </Botao>
          ) : null}
        </section>
      ) : (
        <section className="rounded-3xl border border-dashed border-line bg-paper px-6 py-9 text-center">
          <CalendarDays className="mx-auto size-7 text-muted" aria-hidden="true" />
          <p className="mx-auto mt-3 max-w-sm text-sm text-muted">
            {semCampos
              ? 'Cadastre os dias de campo (dia, horário e ponto de encontro) para ver a programação daqui.'
              : 'Este mês não tem saídas de campo configuradas.'}
          </p>
          {semCampos ? (
            <Botao className="mt-4" onClick={aoConfigurar}>
              Configurar dias de campo
            </Botao>
          ) : null}
        </section>
      )}

      {proximas.length ? (
        <section>
          <div className="mb-2 flex items-baseline justify-between gap-2 px-1">
            <h2 className="font-display text-lg text-ink">Próximos dias</h2>
            <p className="text-[13px] text-muted">
              {designados}/{ocorrencias.length} designados
            </p>
          </div>
          <div className="divide-y divide-line-soft overflow-hidden rounded-2xl border border-line bg-paper">
            {lista.map((oc) => {
              const nome = porId.get(efetivas[oc.key])?.nome
              return (
                <div
                  key={oc.key}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">
                      {nomeDiaCurto(oc.diaSemana)}, {ddMm(oc.iso)}
                    </p>
                    <p className="truncate text-[13px] text-muted">
                      {oc.campo.horario} · {oc.campo.local}
                    </p>
                  </div>
                  <p
                    className={`shrink-0 text-right text-sm font-bold ${
                      nome ? 'text-petrol' : 'text-wine'
                    }`}
                  >
                    {nome ?? 'Sem designação'}
                  </p>
                </div>
              )
            })}
          </div>
          {restam > 0 ? (
            <p className="mt-2 px-1 text-[13px] text-muted">
              + {restam} saída{restam === 1 ? '' : 's'} neste mês
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-3">
        {semDirigentes ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-line bg-paper px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm text-muted">
              <UserPlus className="size-4 shrink-0 text-wine" aria-hidden="true" />
              Cadastre pelo menos um dirigente para que o rodízio encontre alguém designado.
            </p>
            <Botao onClick={aoCadastrar}>Cadastrar dirigentes</Botao>
          </div>
        ) : pronta ? (
          <>
            <div className="flex flex-wrap gap-2">
              <Botao variante="primario" onClick={aoVer}>
                <Eye className="size-4" />
                Ver e baixar
              </Botao>
              <Botao onClick={aoCopiarLink}>
                <ClipboardCopy className="size-4" />
                Copiar link
              </Botao>
              <Botao variante="fantasma" onClick={aoMontar}>
                <Sparkles className="size-4" />
                Ajustar
              </Botao>
            </div>
            <p className="flex items-center gap-1.5 px-1 text-[13px] font-semibold text-petrol">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Todos os {ocorrencias.length} dias com dirigente.
            </p>
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-paper px-4 py-4">
            <p className="text-sm text-muted">
              {designados
                ? 'Ajuste o restante linha a linha e conclua a designação.'
                : 'Monte a escala com o rodízio automático.'}
            </p>
            <Botao variante="primario" onClick={aoMontar}>
              <Sparkles className="size-4" />
              {designados ? 'Ajustar designação' : 'Montar designação'}
            </Botao>
          </div>
        )}
      </section>

      {!semCampos && !semDirigentes ? (
        <section className="border-t border-line-soft pt-4">
          {proximoPronto ? (
            <button
              type="button"
              onClick={aoVerProximo}
              className="flex items-center gap-1.5 px-1 text-left text-[13px] font-semibold text-petrol transition-opacity hover:opacity-80"
            >
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Escala de {proximoNome} pronta →
            </button>
          ) : (
            <Botao variante="fantasma" onClick={aoAdiantar}>
              <CalendarDays className="size-4" />
              Adiantar escala de {proximoNome}
            </Botao>
          )}
        </section>
      ) : null}
    </div>
  )
}
