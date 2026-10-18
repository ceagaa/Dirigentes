export const DIAS_SEMANA = [
  { idx: 0, curto: 'Dom', nome: 'Domingo', fimDeSemana: true },
  { idx: 1, curto: 'Seg', nome: 'Segunda-Feira', fimDeSemana: false },
  { idx: 2, curto: 'Ter', nome: 'Terça-Feira', fimDeSemana: false },
  { idx: 3, curto: 'Qua', nome: 'Quarta-Feira', fimDeSemana: false },
  { idx: 4, curto: 'Qui', nome: 'Quinta-Feira', fimDeSemana: false },
  { idx: 5, curto: 'Sex', nome: 'Sexta-Feira', fimDeSemana: false },
  { idx: 6, curto: 'Sáb', nome: 'Sábado', fimDeSemana: true },
]

/** Nome curto como na planilha base: "Quarta - 05/03", sem o "-Feira". */
export const NOMES_DIAS_CURTOS = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
]

export function nomeDiaCurto(idx) {
  return NOMES_DIAS_CURTOS[idx] ?? 'Dia'
}

/** Ordem de exibição dos chips de disponibilidade (semana de trabalho primeiro). */
export const ORDEM_DIAS = [1, 2, 3, 4, 5, 6, 0]

export const FREQUENCIAS = [
  { id: 'semanal', label: 'Semanal', intervaloSemanas: 1 },
  { id: 'quinzenal', label: 'A cada 2 semanas', intervaloSemanas: 2 },
  { id: 'mensal', label: 'Mensal', intervaloSemanas: 4 },
  { id: 'bimestral', label: 'A cada 2 meses', intervaloSemanas: 8 },
]

export const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export const HORARIOS_PADRAO = [
  '06:00',
  '06:30',
  '07:00',
  '07:30',
  '08:00',
  '09:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
]

export const CORES = {
  petroleo: '#045A6C',
  vinho: '#7E0024',
  conteudoFimDeSemana: '#F9FBFD',
  conteudoSemana: '#FFF3F3',
  linha: '#D9E2E5',
  texto: '#10262B',
}

/** Cores exatas da aba "SAÍDA DE CAMPO" da planilha base (fiel no html2canvas). */
export const CORES_PLANILHA = {
  texto: '#7E0000',
  fundo: '#EAF3FA',
  cabecalho: '#3C7F8B',
  linha: '#D8D8D8',
}

export const TITULO_PADRAO = 'Programação para serviço de campo'
export const CONGREGACAO_PADRAO = 'São João Do Paraíso - 140921'
export const CITACAO = 'Mas que todas as coisas ocorram com decência e ordem - 1 Cor 14:40'

export function infoDia(idx) {
  return DIAS_SEMANA[idx] ?? DIAS_SEMANA[0]
}

export function isFimDeSemana(idx) {
  return idx === 0 || idx === 6
}

export function frequenciaDe(id) {
  return FREQUENCIAS.find((f) => f.id === id) ?? FREQUENCIAS[0]
}

export function frequenciaValida(id) {
  return FREQUENCIAS.some((f) => f.id === id) ? id : 'quinzenal'
}
