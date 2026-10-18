import { frequenciaDe } from './constants'

/**
 * Intervalo mínimo em dias entre duas designações do mesmo dirigente,
 * conforme a frequência configurada.
 */
const GAP_DIAS = {
  semanal: 3,
  quinzenal: 12,
  mensal: 25,
  bimestral: 50,
}

function hash(texto) {
  let h = 5381
  for (let i = 0; i < texto.length; i += 1) {
    h = ((h << 5) + h + texto.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function preparar(dirigentes, ocorrencias) {
  return dirigentes
    .filter((d) => d && d.ativo !== false && d.nome)
    .map((d) => {
      const freq = frequenciaDe(d.frequencia)
      const dias = new Set((d.dias ?? []).map(Number))
      const horarios = new Set(d.horarios ?? [])
      const aptas = ocorrencias.filter((o) => dias.has(o.diaSemana) && horarios.has(o.campo.horario))
      const capacidade = Math.max(1, Math.ceil(aptas.length / freq.intervaloSemanas))

      return {
        id: d.id,
        nome: d.nome,
        dias,
        horarios,
        gap: GAP_DIAS[freq.id] ?? GAP_DIAS.semanal,
        capacidade,
        restantes: capacidade,
        total: 0,
        ultimoTs: 0,
      }
    })
}

function diasDesde(ultimoTs, dataTs) {
  return ultimoTs ? (dataTs - ultimoTs) / 86400000 : Number.POSITIVE_INFINITY
}

function escolher(candidatos, { chave, semente, dataTs, ignorarCapacidade, ignorarGap }) {
  const validos = candidatos.filter((c) => {
    if (!ignorarCapacidade && c.restantes <= 0) return false
    if (!ignorarGap && diasDesde(c.ultimoTs, dataTs) < c.gap) return false
    return true
  })

  if (!validos.length) return null

  return validos
    .map((c) => {
      // Sem folga disponível, prefere quem está mais próximo da frequência configurada.
      const aderencia = diasDesde(c.ultimoTs, dataTs) / c.gap
      const criterio = ignorarGap ? -aderencia : 0
      return {
        c,
        placar: [criterio, c.total, c.ultimoTs, hash(`${semente}|${chave}|${c.id}`)],
      }
    })
    .sort((a, b) => {
      for (let i = 0; i < a.placar.length; i += 1) {
        if (a.placar[i] !== b.placar[i]) return a.placar[i] - b.placar[i]
      }
      return 0
    })[0].c
}

function comprometer(estatistica, ocorrencia) {
  estatistica.total += 1
  estatistica.restantes -= 1
  estatistica.ultimoTs = ocorrencia.data.getTime()
}

function cascata(candidatos, contexto) {
  const fases = [
    { ignorarCapacidade: false, ignorarGap: false },
    { ignorarCapacidade: true, ignorarGap: false },
    { ignorarCapacidade: false, ignorarGap: true },
    { ignorarCapacidade: true, ignorarGap: true },
  ]
  for (const fase of fases) {
    const escolhido = escolher(candidatos, { ...contexto, ...fase })
    if (escolhido) return escolhido
  }
  return null
}

/**
 * Rodízio inteligente: respeita frequência, disponibilidade de dia/horário,
 * folga mínima entre designações e equilíbrio (menor carga primeiro).
 * Designações marcadas como manuais não são sobrescritas, mas a sugestão
 * automática daquela linha continua calculada para permitir desfazer o ajuste.
 * Com `fixa` ligado, cada dia de campo usa a pessoa fixa cadastrada nele.
 * @returns {{ auto: Record<string,string>, designacoes: Record<string,string> }}
 */
export function gerarEscala({ dirigentes, ocorrencias, manuais = {}, semente = '', fixa = false }) {
  const stats = preparar(dirigentes, ocorrencias)
  const porId = new Map(stats.map((s) => [s.id, s]))
  const auto = {}
  const designacoes = { ...manuais }

  const porChave = new Map(ocorrencias.map((o) => [o.key, o]))
  for (const [chave, id] of Object.entries(manuais)) {
    const s = porId.get(id)
    const oc = porChave.get(chave)
    if (!s) continue
    s.total += 1
    s.restantes -= 1
    if (oc && oc.data.getTime() > s.ultimoTs) s.ultimoTs = oc.data.getTime()
  }

  for (const oc of ocorrencias) {
    const candidatos = stats.filter(
      (s) => s.dias.has(oc.diaSemana) && s.horarios.has(oc.campo.horario),
    )
    const contexto = { chave: oc.key, semente, dataTs: oc.data.getTime() }

    if (manuais[oc.key]) {
      // Calcula o que o rodízio teria escolhido (para poder desfazer o ajuste)
      // e considera essa sugestão nas contagens, mantendo o mapa automático coerente.
      const sugestao = cascata(candidatos, contexto)
      if (sugestao) {
        auto[oc.key] = sugestao.id
        if (sugestao.id !== manuais[oc.key]) comprometer(sugestao, oc)
      }
      continue
    }

    const fixo = fixa ? oc.campo?.fixo : null
    const estatisticaFixa = fixo ? porId.get(fixo) : null
    if (estatisticaFixa) {
      auto[oc.key] = fixo
      designacoes[oc.key] = fixo
      comprometer(estatisticaFixa, oc)
      continue
    }

    const escolhido = cascata(candidatos, contexto)
    if (escolhido) {
      auto[oc.key] = escolhido.id
      designacoes[oc.key] = escolhido.id
      comprometer(escolhido, oc)
    }
  }

  return { auto, designacoes }
}

/** Dirigentes ativos disponíveis para um dia/horário, com os disponíveis primeiro. */
export function candidatosPara(ocorrencia, dirigentes) {
  const ativos = dirigentes.filter((d) => d && d.ativo !== false && d.nome)
  const disponiveis = ativos.filter(
    (d) =>
      (d.dias ?? []).map(Number).includes(ocorrencia.diaSemana) &&
      (d.horarios ?? []).includes(ocorrencia.campo.horario),
  )
  const fora = ativos.filter((d) => !disponiveis.includes(d))

  return [
    ...disponiveis.map((d) => ({ ...d, disponivel: true })),
    ...fora.map((d) => ({ ...d, disponivel: false })),
  ]
}
