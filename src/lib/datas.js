import { MESES } from './constants'

export function chaveMes(ano, mes) {
  return `${ano}-${mes + 1}`
}

export function lerChaveMes(chave) {
  const [ano, mes] = String(chave).split('-').map(Number)
  return { ano, mes: (mes || 1) - 1 }
}

export function nomeMes(mes) {
  return MESES[mes] ?? ''
}

/** Gera todas as designações possíveis (data x campo) de um mês, em ordem cronológica. */
export function ocorrenciasDoMes(ano, mes, campos) {
  const totalDias = new Date(ano, mes + 1, 0).getDate()
  const lista = []

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
    if (a.data - b.data !== 0) return a.data - b.data
    return String(a.campo.horario).localeCompare(String(b.campo.horario))
  })
}

export function rotuloData(ocorrencia) {
  return `Dia ${ocorrencia.dia}`
}

export function dataExtenso(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number)
  const d = new Date(ano, mes - 1, dia)
  return `${d.getDate()} de ${nomeMes(d.getMonth()).toLowerCase()}`
}
