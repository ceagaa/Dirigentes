/** Feriados nacionais do Brasil (fixos e móveis) e utilidades de último domingo. */

interface DataSimples {
  mes: number
  dia: number
}

const FIXOS: readonly DataSimples[] = [
  { mes: 1, dia: 1 },
  { mes: 4, dia: 21 },
  { mes: 5, dia: 1 },
  { mes: 9, dia: 7 },
  { mes: 10, dia: 12 },
  { mes: 11, dia: 2 },
  { mes: 11, dia: 15 },
  { mes: 11, dia: 20 },
  { mes: 12, dia: 25 },
]

/** Domingo de Páscoa (algoritmo de Meeus/Butcher, calendário gregoriano). */
function pascoa(ano: number): Date {
  const a = ano % 19
  const b = Math.floor(ano / 100)
  const c = ano % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31)
  const dia = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(ano, mes - 1, dia)
}

function isoDe(ano: number, mes: number, dia: number): string {
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

/** Soma dias a uma data simples (mês 1-12). */
function deslocar(data: Date, dias: number): { mes: number; dia: number } {
  const d = new Date(data.getFullYear(), data.getMonth(), data.getDate() + dias)
  return { mes: d.getMonth() + 1, dia: d.getDate() }
}

const cache = new Map<number, ReadonlySet<string>>()

/** Todos os isos (YYYY-MM-DD) de feriados nacionais de um ano. */
export function feriadosDoAno(ano: number): ReadonlySet<string> {
  const existente = cache.get(ano)
  if (existente) return existente

  const isos = new Set<string>()
  for (const f of FIXOS) isos.add(isoDe(ano, f.mes, f.dia))

  const p = pascoa(ano)
  const carnaval = deslocar(p, -47)
  const sexta = deslocar(p, -2)
  const corpus = deslocar(p, 60)
  isos.add(isoDe(ano, carnaval.mes, carnaval.dia))
  isos.add(isoDe(ano, sexta.mes, sexta.dia))
  isos.add(isoDe(ano, corpus.mes, corpus.dia))

  cache.set(ano, isos)
  return isos
}

/** O ISO (YYYY-MM-DD) é feriado nacional? */
export function ehFeriado(iso: string): boolean {
  const ano = Number(String(iso).slice(0, 4))
  if (!ano) return false
  return feriadosDoAno(ano).has(iso)
}

/** O ISO é o último domingo do mês dele? */
export function ehUltimoDomingo(iso: string): boolean {
  const [ano, mes, dia] = String(iso).split('-').map(Number)
  if (!ano || !mes || !dia) return false
  const ultimoDia = new Date(ano, mes, 0).getDate()
  if (dia > ultimoDia) return false
  if (new Date(ano, mes - 1, dia).getDay() !== 0) return false
  return dia + 7 > ultimoDia
}

/** Rótulo especial da ocorrência para a UI: "Feriado" ou "Último Domingo". */
export function rotuloEspecial(oc: { feriado?: boolean; ultimoDomingo?: boolean }): string | null {
  if (oc.feriado) return 'Feriado'
  if (oc.ultimoDomingo) return 'Último Domingo'
  return null
}
