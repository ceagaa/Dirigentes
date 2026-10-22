import type { Campo, Dirigente, Ocorrencia } from '../lib/dominio'
import {
  ArrowRight,
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
import { Botao, Kicker, Select } from './ui'

function ddMm(iso: string): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}`
}

/** Data de hoje resolvida uma vez (evita chamada instável de Date no render). */
const HOJE_ISO = isoDeHoje()
const [HOJE_ANO, HOJE_MES] = HOJE_ISO.split('-').map(Number)

interface Status {
  rotulo: string
  estilo: string
  ponto: string
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
  const pendentes = ocorrencias.length - designados
  const semCampos = !campos.length
  const semDirigentes = !dirigentes.length

  const status: Status = semCampos
    ? { rotulo: 'Sem dias de campo', estilo: 'bg-canvas text-muted', ponto: 'bg-muted' }
    : !ocorrencias.length
      ? { rotulo: 'Mês sem saídas', estilo: 'bg-canvas text-muted', ponto: 'bg-muted' }
      : pronta
        ? { rotulo: 'Designação pronta', estilo: 'bg-success-bg text-success', ponto: 'bg-success' }
        : {
            rotulo: 'Pendente de montar',
            estilo: 'bg-crimson-bg text-crimson',
            ponto: 'bg-crimson animate-pulse',
          }

  const nomeDestaque = destaque ? porId.get(efetivas[destaque.key])?.nome : undefined

  const rotuloDestaque = deHoje
    ? 'Quem dirige hoje'
    : ehMesAtual
      ? 'Próxima saída'
      : 'Primeira saída'

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="flex min-w-0 items-baseline gap-2">
            <span className="truncate text-[26px] font-bold tracking-tight text-ink">
              {MESES[mes]}
            </span>
            <span className="text-lg font-semibold text-muted">{ano}</span>
          </h1>
          <span
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${status.estilo}`}
            role="status"
          >
            <span className={`size-2 rounded-full ${status.ponto}`} aria-hidden="true" />
            {status.rotulo}
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-card p-1 shadow-sm">
          <button
            type="button"
            aria-label="Mês anterior"
            onClick={() => (mes === 0 ? aoMudarData(ano - 1, 11) : aoMudarData(ano, mes - 1))}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-canvas text-teal transition-all hover:bg-teal-tint active:scale-95"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>
          <div className="flex min-w-0 items-center gap-2">
            <Select
              aria-label="Mês"
              className="w-[8.5rem] border-transparent bg-canvas py-2 text-center font-semibold"
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
              className="w-20 border-transparent bg-canvas py-2 text-center font-semibold"
              value={ano}
              onChange={(e) => aoMudarData(Number(e.target.value), mes)}
            >
              {anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </div>
          <button
            type="button"
            aria-label="Próximo mês"
            onClick={() => (mes === 11 ? aoMudarData(ano + 1, 0) : aoMudarData(ano, mes + 1))}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-canvas text-teal transition-all hover:bg-teal-tint active:scale-95"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>
        </div>
      </header>

      {destaque ? (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal to-teal-deep p-6 text-white shadow-xl">
          <div
            className="pointer-events-none absolute -bottom-10 -right-8 size-44 rounded-full bg-white/10 blur-2xl"
            aria-hidden="true"
          />
          <div className="relative z-10 flex items-center justify-between gap-3">
            <Kicker className="text-white/80">{rotuloDestaque}</Kicker>
            <span className="shrink-0 rounded-full bg-white/15 px-3 py-0.5 text-xs font-bold tracking-wide text-white">
              {nomeDiaCurto(destaque.diaSemana)}, {ddMm(destaque.iso)}
            </span>
          </div>
          <div className="relative z-10 mt-3">
            <p className="text-[34px] font-extrabold leading-tight sm:text-4xl">
              {nomeDestaque ?? 'Sem designação'}
            </p>
            <p className="mt-1 text-sm text-white/80">
              {nomeDestaque
                ? 'Designação confirmada para a reunião de campo de hoje.'
                : 'Nenhum dirigente escalado para a reunião de campo de hoje.'}
            </p>
          </div>
          <div className="relative z-10 mt-4 grid grid-cols-2 gap-2">
            <span className="flex min-w-0 items-center gap-2 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate text-sm">{destaque.campo.local}</span>
            </span>
            <span className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
              <Clock className="size-4 shrink-0" aria-hidden="true" />
              <span className="text-sm">{destaque.campo.horario}</span>
            </span>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-line bg-card px-6 py-9 text-center">
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
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="text-lg font-semibold text-ink">Próximos dias</h2>
              {pendentes > 0 ? (
                <span className="shrink-0 rounded-full bg-line px-2 py-0.5 text-[11px] font-bold text-ink-soft">
                  {pendentes} pendência{pendentes === 1 ? '' : 's'}
                </span>
              ) : null}
            </div>
            <p className="shrink-0 text-sm text-muted">
              {designados}/{ocorrencias.length} designados
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {lista.map((oc) => {
              const nome = porId.get(efetivas[oc.key])?.nome
              return (
                <button
                  type="button"
                  key={oc.key}
                  onClick={aoMontar}
                  aria-label={`Montar designação: ${nomeDiaCurto(oc.diaSemana)}, ${ddMm(oc.iso)}`}
                  className="flex w-full items-center justify-between gap-3 rounded-xl bg-card p-4 text-left shadow-sm transition-colors active:bg-teal-tint/30"
                >
                  <span className="flex min-w-0 items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-tint text-teal">
                      <CalendarDays className="size-5" aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm font-semibold text-ink">
                        {nomeDiaCurto(oc.diaSemana)}, {ddMm(oc.iso)}
                      </span>
                      <span className="mt-0.5 flex min-w-0 items-center gap-1 text-sm text-ink-soft">
                        <span className="shrink-0">{oc.campo.horario}</span>
                        <span className="text-muted" aria-hidden="true">
                          •
                        </span>
                        <span className="truncate">{oc.campo.local}</span>
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {nome ? (
                      <span className="max-w-28 truncate text-sm font-bold text-teal">{nome}</span>
                    ) : (
                      <span className="whitespace-nowrap rounded-full bg-crimson-bg px-3 py-1 text-xs font-bold text-crimson">
                        Sem designação
                      </span>
                    )}
                    <ChevronRight className="size-[18px] text-muted" aria-hidden="true" />
                  </span>
                </button>
              )
            })}
          </div>
          {restam > 0 ? (
            <p className="px-1 text-[13px] text-muted">
              + {restam} saída{restam === 1 ? '' : 's'} neste mês
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-4 rounded-2xl bg-teal-tint/60 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal text-white shadow-sm">
            <Sparkles className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-ink">
              {semDirigentes
                ? 'Comece cadastrando a equipe'
                : pronta
                  ? 'Designação pronta'
                  : 'Distribuição Inteligente'}
            </h3>
            <p className="mt-0.5 text-sm text-ink-soft">
              {semDirigentes
                ? 'Cadastre pelo menos um dirigente para o rodízio encontrar alguém.'
                : pronta
                  ? 'Confira, baixe ou compartilhe a escala do mês.'
                  : 'Monte a escala com o rodízio automático.'}
            </p>
          </div>
        </div>
        {pronta && !semDirigentes ? (
          <div className="flex flex-wrap gap-2">
            <Botao variante="primario" onClick={aoVer}>
              <Eye className="size-4" aria-hidden="true" />
              Ver e baixar
            </Botao>
            <Botao onClick={aoCopiarLink}>
              <ClipboardCopy className="size-4" aria-hidden="true" />
              Copiar link
            </Botao>
            <Botao variante="fantasma" onClick={aoMontar}>
              <Sparkles className="size-4" aria-hidden="true" />
              Ajustar
            </Botao>
          </div>
        ) : semDirigentes ? (
          <Botao variante="primario" className="w-full" onClick={aoCadastrar}>
            <UserPlus className="size-4" aria-hidden="true" />
            Cadastrar dirigentes
          </Botao>
        ) : (
          <Botao
            variante="primario"
            className="w-full shadow-[0_2px_8px_rgba(13,92,104,0.25)]"
            onClick={aoMontar}
          >
            <Sparkles className="size-4" aria-hidden="true" />
            {designados ? 'Ajustar designação' : 'Montar designação'}
          </Botao>
        )}
      </section>

      {!semCampos && !semDirigentes ? (
        <div className="flex justify-center pt-1">
          {proximoPronto ? (
            <button
              type="button"
              onClick={aoVerProximo}
              className="inline-flex items-center gap-2 rounded-full bg-success-bg px-4 py-2.5 text-sm font-semibold text-success shadow-sm transition-all hover:bg-success/10 active:scale-95"
            >
              <CheckCircle2 className="size-[18px]" aria-hidden="true" />
              Escala de {proximoNome} pronta
              <ArrowRight className="size-[18px]" aria-hidden="true" />
            </button>
          ) : (
            <Botao onClick={aoAdiantar}>
              <CalendarDays className="size-4" aria-hidden="true" />
              Adiantar escala de {proximoNome}
            </Botao>
          )}
        </div>
      ) : null}
    </div>
  )
}
