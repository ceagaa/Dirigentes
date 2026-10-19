import type { Campo, Ocorrencia } from './dominio'
import { MESES } from './constants'

export function chaveMes(ano: number, mes: number): string {
  return `${ano}-${mes + 1}`
}

/** Data de hoje no formato ISO (YYYY-MM-DD). */
export function isoDeHoje(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function lerChaveMes(chave: string): { ano: number; mes: number } {
  const [ano, mes] = String(chave).split('-').map(Number)
  return { ano, mes: (mes || 1) - 1 }
}

export function nomeMes(mes: number): string {
  return MESES[mes] ?? ''
}

/** Gera todas as designações possíveis (data x campo) de um mês, em ordem cronológica. */
export function ocorrenciasDoMes(ano: number, mes: number, campos: Campo[]): Ocorrencia[] {
  const totalDias = new Date(ano, mes + 1, 0).getDate()
  const lista: Ocorrencia[] = []

  for (let dia = 1; dia <= totalDias; dia += 1) {
    const data = new Date(ano, mes, dia)
    const diaSemana = data.getDay()
    const doCampo = campos.filter((c) => Number(c.diaSemana) === diaSemana)

    for (const campo of doCampo) {
      lista.push({
        key: `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}_${campo.id}`,
        data,
        iso: `${ano}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`,
        dia,
        diaSemana,
        campo,
      })
    }
  }

  return lista.sort((a, b) => {
    if (a.data.getTime() - b.data.getTime() !== 0) return a.data.getTime() - b.data.getTime()
    return String(a.campo.horario).localeCompare(String(b.campo.horario))
  })
}

export function rotuloData(ocorrencia: Ocorrencia): string {
  return `Dia ${ocorrencia.dia}`
}

export function dataExtenso(iso: string): string {
  const [ano, mes, dia] = iso.split('-').map(Number)
  const d = new Date(ano, mes - 1, dia)
  return `${d.getDate()} de ${nomeMes(d.getMonth()).toLowerCase()}`
}
