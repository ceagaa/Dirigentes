import type { Estado, RegistroMes } from './dominio'
import { chaveMes, lerChaveMes, ocorrenciasDoMes } from './datas'
import { registroDe } from './estadoInicial'
import { gerarEscala } from './rodizio'

/** Chave do mês seguinte ao informado. */
export function proximoMes(ano: number, mes: number): { ano: number; mes: number; chave: string } {
  const nMes = mes === 11 ? 0 : mes + 1
  const nAno = mes === 11 ? ano + 1 : ano
  return { ano: nAno, mes: nMes, chave: chaveMes(nAno, nMes) }
}

export interface OpcoesGeracao {
  /** Sobrescreve mesmo quando o mês já foi gerado (montagem manual). */
  forcar?: boolean
}

/**
 * Gera a escala do mês da chave analisando frequência, disponibilidade,
 * folga mínima e capacidade de cada dirigente (rodízio, não sorteio).
 * Preserva os ajustes manuais existentes. Idempotente sem `forcar`.
 * Retorna o mesmo estado quando nada foi gerado.
 */
export function gerarEscalaDoMes(estado: Estado, chave: string, { forcar = false }: OpcoesGeracao = {}): Estado {
  const registro = registroDe(estado.escalas, chave)
  if (registro.geradoEm && !forcar) return estado

  const { ano, mes } = lerChaveMes(chave)
  const ocorrencias = ocorrenciasDoMes(ano, mes, estado.config_campos)
  const manuais = registro.manuais ?? {}

  const { auto } = gerarEscala({
    dirigentes: estado.dirigentes,
    ocorrencias,
    manuais,
    semente: chave,
    fixa: estado.escalas._config.designacao_fixa === true,
  })

  const novoRegistro: RegistroMes = {
    auto,
    manuais,
    geradoEm: new Date().toISOString(),
  }

  return { ...estado, escalas: { ...estado.escalas, [chave]: novoRegistro } as Estado['escalas'] }
}
