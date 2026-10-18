import type { Campo, ConfigEscala, Dirigente, Ocorrencia } from '../lib/dominio'
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Eye,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react'
import { MESES, nomeDiaCurto } from '../lib/constants'
import { Botao, Select } from './ui'

function Tile({ valor, rotulo, alerta }: { valor: number; rotulo: string; alerta?: boolean }) {
  return (
    <div className="border border-line bg-paper px-4 py-3">
      <p
        className={`font-display text-2xl font-bold leading-none ${
          alerta ? 'text-wine' : 'text-petrol'
        }`}
      >
        {valor}
      </p>
      <p className="mt-1.5 text-[13px] font-semibold text-muted">{rotulo}</p>
    </div>
  )
}

interface Status {
  rotulo: string
  estilo: string
}

interface ResumoDesignacaoProps {
  ano: number
  mes: number
  aoMudarData: (ano: number, mes: number) => void
  config: ConfigEscala
  ocorrencias: Ocorrencia[]
  efetivas: Record<string, string>
  dirigentes: Dirigente[]
  campos: Campo[]
  pronta: boolean
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
  config,
  ocorrencias,
  efetivas,
  dirigentes,
  campos,
  pronta,
  aoMontar,
  aoVer,
  aoCopiarLink,
  aoConfigurar,
  aoCadastrar,
}: ResumoDesignacaoProps) {
  const anos = Array.from({ length: 9 }, (_, i) => ano - 4 + i)
  const designados = ocorrencias.filter((o) => efetivas[o.key]).length
  const pendentes = ocorrencias.length - designados
  const porId = new Map(dirigentes.map((d) => [d.id, d]))
  const semCampos = !campos.length
  const semDirigentes = !dirigentes.length

  const status: Status = semCampos
    ? { rotulo: 'Sem dias de campo', estilo: 'bg-canvas text-muted border-line' }
    : !ocorrencias.length
      ? { rotulo: 'Mês sem saídas', estilo: 'bg-canvas text-muted border-line' }
      : pronta
        ? { rotulo: 'Designação pronta', estilo: 'bg-petrol-soft text-petrol border-petrol' }
        : { rotulo: 'Pendente de montar', estilo: 'bg-wine-soft text-wine border-wine' }

  return (
    <div className="space-y-4">
      <section className="bg-petrol px-5 py-6 text-white sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/75">
              Designação do mês
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold leading-none sm:text-5xl">
              {MESES[mes]}
            </h1>
            <p className="mt-3 text-sm font-semibold text-white/85">{config.congregacao}</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <span
              className={`border px-2.5 py-1 text-xs font-bold ${status.estilo}`}
              role="status"
            >
              {status.rotulo}
            </span>
            <p className="font-display text-2xl font-bold">{ano}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Botao
            variante="secundario"
            aria-label="Mês anterior"
            onClick={() => (mes === 0 ? aoMudarData(ano - 1, 11) : aoMudarData(ano, mes - 1))}
          >
            <ChevronLeft className="size-4" />
          </Botao>
          <Botao
            variante="secundario"
            aria-label="Próximo mês"
            onClick={() => (mes === 11 ? aoMudarData(ano + 1, 0) : aoMudarData(ano, mes + 1))}
          >
            <ChevronRight className="size-4" />
          </Botao>
          <div className="ml-1 flex gap-2">
            <label className="sr-only" htmlFor="resumo-mes">
              Mês
            </label>
            <Select
              id="resumo-mes"
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
            <label className="sr-only" htmlFor="resumo-ano">
              Ano
            </label>
            <Select
              id="resumo-ano"
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
          </div>
        </div>
      </section>

      <div className="grid grid-cols-3 gap-3">
        <Tile valor={ocorrencias.length} rotulo="Dias de campo" />
        <Tile valor={designados} rotulo="Designados" />
        <Tile valor={pendentes} rotulo="Pendentes" alerta={pendentes > 0} />
      </div>

      <section className="border border-line bg-paper">
        <h2 className="border-b border-line px-4 py-3 font-display text-base text-ink">
          Saídas de {MESES[mes].toLowerCase()}
        </h2>
        {!ocorrencias.length ? (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
            {semCampos ? (
              <CalendarDays className="size-7 text-muted" aria-hidden="true" />
            ) : (
              <Users className="size-7 text-muted" aria-hidden="true" />
            )}
            <p className="max-w-md text-sm text-muted">
              {semCampos
                ? 'Cadastre os dias de campo (dia, horário e ponto de encontro) para ver a programação daqui.'
                : 'Este mês não tem saídas de campo configuradas.'}
            </p>
            {semCampos ? (
              <Botao variante="primario" onClick={aoConfigurar}>
                Configurar dias de campo
              </Botao>
            ) : null}
          </div>
        ) : (
          <ul className="divide-y divide-line-soft">
            {ocorrencias.slice(0, 6).map((oc) => {
              const nome = porId.get(efetivas[oc.key])?.nome
              return (
                <li
                  key={oc.key}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3"
                >
                  <p className="font-semibold text-ink">
                    {nomeDiaCurto(oc.diaSemana)} - {oc.iso.slice(8, 10)}/
                    {oc.iso.slice(5, 7)}
                    <span className="ml-3 font-normal text-muted">
                      {oc.campo.horario} · {oc.campo.local}
                    </span>
                  </p>
                  <p
                    className={`text-sm font-bold ${nome ? 'text-petrol' : 'text-wine'}`}
                  >
                    {nome ?? 'Sem designação'}
                  </p>
                </li>
              )
            })}
            {ocorrencias.length > 6 ? (
              <li className="px-4 py-2.5 text-[13px] text-muted">
                + {ocorrencias.length - 6} saída
                {ocorrencias.length - 6 === 1 ? '' : 's'} neste mês
              </li>
            ) : null}
          </ul>
        )}
      </section>

      <section className="border border-line bg-paper px-4 py-4">
        {semDirigentes ? (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2 text-sm text-muted">
              <UserPlus className="size-4 shrink-0 text-wine" aria-hidden="true" />
              Cadastre pelo menos um dirigente para que o rodízio encontre alguém designado.
            </p>
            <Botao variante="primario" onClick={aoCadastrar}>
              Cadastrar dirigentes
            </Botao>
          </div>
        ) : pronta ? (
          <div className="flex flex-wrap items-center gap-2">
            <Botao variante="primario" onClick={aoVer}>
              <Eye className="size-4" />
              Ver e baixar
            </Botao>
            <Botao variante="vinho" onClick={aoCopiarLink}>
              <ClipboardCopy className="size-4" />
              Copiar link
            </Botao>
            <Botao variante="fantasma" onClick={aoMontar}>
              <Sparkles className="size-4" />
              Ajustar designação
            </Botao>
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-petrol">
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Todos os {ocorrencias.length} dias com dirigente.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              Monte a escala com o rodízio automático e ajuste o que precisar linha a linha.
            </p>
            <Botao variante="primario" onClick={aoMontar}>
              <Sparkles className="size-4" />
              {designados ? 'Ajustar designação' : 'Montar designação'}
            </Botao>
          </div>
        )}
      </section>

      <p className="px-1 text-[13px] text-muted">
        A designação pronta libera a prévia fiel do PDF, o download e o link de
        compartilhamento — tudo sem sair daqui.
      </p>
    </div>
  )
}
