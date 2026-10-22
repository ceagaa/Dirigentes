import type { RefObject } from 'react'
import type { Campo, ConfigEscala, Dirigente, Ocorrencia, RegistroMes } from '../lib/dominio'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eraser,
  Sparkles,
} from 'lucide-react'
import { MESES } from '../lib/constants'
import { Botao, Rotulo, Select } from './ui'
import EscalaCard from './EscalaCard'

interface TabelaEscalaProps {
  ano: number
  mes: number
  config: ConfigEscala
  aoMudarData: (ano: number, mes: number) => void
  dirigentes: Dirigente[]
  campos: Campo[]
  ocorrencias: Ocorrencia[]
  registro: RegistroMes
  efetivas: Record<string, string>
  efetivasAjudante: Record<string, string>
  manterManuais: boolean
  aoAlterarManter: (valor: boolean) => void
  aoGerar: () => void
  aoAlterarDesignacao: (chaves: string[], idDirigente: string) => void
  aoAlterarAjudante: (chaves: string[], idDirigente: string) => void
  aoLimparManuais: () => void
  aoConfigurar: () => void
  aoCadastrar: () => void
  cardRef: RefObject<HTMLDivElement | null>
  aoConcluir: () => void
  pronta: boolean
}

export default function TabelaEscala({
  ano,
  mes,
  config,
  aoMudarData,
  dirigentes,
  campos,
  ocorrencias,
  registro,
  efetivas,
  efetivasAjudante,
  manterManuais,
  aoAlterarManter,
  aoGerar,
  aoAlterarDesignacao,
  aoAlterarAjudante,
  aoLimparManuais,
  aoConfigurar,
  aoCadastrar,
  cardRef,
  aoConcluir,
  pronta,
}: TabelaEscalaProps) {
  const anos = Array.from({ length: 9 }, (_, i) => ano - 4 + i)
  const manuais = registro.manuais ?? {}
  const totalManuais = Object.keys(manuais).length
  const designados = ocorrencias.filter((o) => efetivas[o.key]).length
  const semDesignacao = ocorrencias.length - designados
  const gerado = Boolean(registro.geradoEm)
  const semCampos = !campos.length
  const semDirigentes = !dirigentes.length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border border-line bg-paper px-4 py-3">
        <div>
          <h1 className="font-display text-lg leading-tight text-ink">Montar designação</h1>
          <p className="text-[13px] text-muted">
            {MESES[mes]} de {ano} · {ocorrencias.length} saída
            {ocorrencias.length === 1 ? '' : 's'} de campo
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Rotulo htmlFor="escala-mes">Mês</Rotulo>
            <Select
              id="escala-mes"
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
          </div>
          <div>
            <Rotulo htmlFor="escala-ano">Ano</Rotulo>
            <Select
              id="escala-ano"
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
          <div className="flex gap-1">
            <Botao
              aria-label="Mês anterior"
              onClick={() => (mes === 0 ? aoMudarData(ano - 1, 11) : aoMudarData(ano, mes - 1))}
            >
              <ChevronLeft className="size-4" />
            </Botao>
            <Botao
              aria-label="Próximo mês"
              onClick={() => (mes === 11 ? aoMudarData(ano + 1, 0) : aoMudarData(ano, mes + 1))}
            >
              <ChevronRight className="size-4" />
            </Botao>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border border-line bg-canvas px-4 py-2.5 text-sm">
        <p aria-live="polite" className="flex flex-wrap gap-x-4 gap-y-1 text-muted">
          <span>
            <strong className="text-ink">{ocorrencias.length}</strong> dia
            {ocorrencias.length === 1 ? '' : 's'} de campo
          </span>
          <span>
            <strong className="text-ink">{designados}</strong> designado
            {designados === 1 ? '' : 's'}
          </span>
          <span className={semDesignacao ? 'font-semibold text-crimson' : ''}>
            <strong className={semDesignacao ? 'text-crimson' : 'text-ink'}>{semDesignacao}</strong>{' '}
            sem designação
          </span>
          {totalManuais ? (
            <span>
              <strong className="text-ink">{totalManuais}</strong> ajuste
              {totalManuais === 1 ? '' : 's'} manual{totalManuais === 1 ? '' : 'is'}
            </span>
          ) : null}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={manterManuais}
              onChange={(e) => aoAlterarManter(e.target.checked)}
              className="size-4 accent-[#045A6C]"
            />
            <span className="font-semibold text-ink">Manter ajustes manuais ao gerar</span>
          </label>
          {totalManuais ? (
            <Botao variante="fantasma" onClick={aoLimparManuais}>
              <Eraser className="size-4" />
              Limpar manuais
            </Botao>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Botao variante="primario" disabled={semCampos || semDirigentes} onClick={aoGerar}>
          <Sparkles className="size-4" />
          {gerado ? 'Gerar novamente' : 'Gerar escala'}
        </Botao>
        <Botao
          variante={pronta ? 'vinho' : 'secundario'}
          disabled={!ocorrencias.length || semDesignacao > 0}
          onClick={aoConcluir}
        >
          <CheckCircle2 className="size-4" />
          {pronta ? 'Designação pronta — ver' : 'Designação pronta'}
        </Botao>
      </div>

      {semCampos || semDirigentes ? (
        <div className="border border-dashed border-line bg-paper px-6 py-10 text-center">
          <p className="mx-auto max-w-md text-sm text-muted">
            {semCampos
              ? 'A escala precisa de dias de campo. Defina dia da semana, horário e ponto de encontro para começar.'
              : 'Cadastre pelo menos um dirigente ativo para que o rodízio encontre alguém designado.'}
          </p>
          <Botao
            variante="primario"
            className="mt-4"
            onClick={semCampos ? aoConfigurar : aoCadastrar}
          >
            {semCampos ? 'Configurar dias de campo' : 'Cadastrar dirigentes'}
          </Botao>
        </div>
      ) : (
        <div>
          <p className="mb-2 text-[13px] text-muted sm:hidden">
            Deslize para a lateral para ver a escala inteira →
          </p>
          <div className="scroll-hint overflow-x-auto pb-2">
            <EscalaCard
              ref={cardRef}
              config={config}
              ocorrencias={ocorrencias}
              dirigentes={dirigentes}
              designacoes={efetivas}
              manuais={manuais}
              ajudantes={efetivasAjudante}
              manuaisAjudante={registro.manuaisAjudante ?? {}}
              aoAlterarDesignacao={aoAlterarDesignacao}
              aoAlterarAjudante={aoAlterarAjudante}
            />
          </div>
        </div>
      )}

      {ocorrencias.length && !semDesignacao ? (
        <p className="text-[13px] text-muted">
          Todos os dias com dirigente. Toque em{' '}
          <strong className="text-ink">Designação pronta</strong> para liberar a prévia, o PDF e o
          link de compartilhamento.
        </p>
      ) : null}

      {ocorrencias.length && semDesignacao ? (
        <p className="text-[13px] text-muted">
          Troque qualquer nome direto na tabela — a linha marcada com o ponto ficou definida à mão
          e não muda na próxima geração.
        </p>
      ) : null}
    </div>
  )
}
