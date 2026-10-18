/** Tipos de domínio do app — fonte única de verdade para as entidades. */

export type FrequenciaId = 'semanal' | 'quinzenal' | 'mensal' | 'bimestral'

/** Ids de dirigente ("dir-…") ou de campo ("campo-…"). */
export type Identificador = string

export interface Dirigente {
  id: Identificador
  nome: string
  telefone: string
  ativo: boolean
  frequencia: FrequenciaId | string
  dias: number[]
  horarios: string[]
}

export interface Campo {
  id: Identificador
  diaSemana: number
  horario: string
  local: string
  /** Dirigente que sai sempre neste dia (designação fixa). */
  fixo: Identificador | null
}

export interface ConfigEscala {
  titulo: string
  congregacao: string
  designacao_fixa: boolean
  frequencia_padrao: FrequenciaId | string
}

/** `MapaDesignacoes` cobre os registros de `escalas` (também guarda `_config`). */
export type MapaDesignacoes = Record<string, unknown>

export interface Escalas {
  _config: ConfigEscala
  [chave: string]: MapaDesignacoes | ConfigEscala
}

export interface Estado {
  dirigentes: Dirigente[]
  config_campos: Campo[]
  escalas: Escalas
}

/** Registro mensal: automático, manuais e carimbo da última geração. */
export interface RegistroMes {
  auto?: Record<string, Identificador>
  manuais?: Record<string, Identificador>
  geradoEm?: string
}

/** Ocorrência (data x campo) de um mês. */
export interface Ocorrencia {
  key: string
  data: Date
  iso: string
  dia: number
  diaSemana: number
  campo: Campo
}

/** Candidato do rodízio (ficha + disponibilidade). */
export interface Candidato extends Dirigente {
  disponivel: boolean
}

/** Payload codificado no link compartilhado (linhas [iso, horário, local, nome]). */
export interface PayloadCompartilhado {
  t: string
  c: string
  a: number
  m: number
  r: Array<[string, string, string, string]>
}

/** Origem de onde o estado veio ao carregar. */
export type OrigemEstado = 'supabase' | 'local' | 'padrao'

/** Onde o estado foi persistido na última gravação. */
export type DestinoEstado = 'supabase' | 'local'

/** Abas inferiores do app. */
export type AbaNav = 'designacao' | 'dirigentes' | 'config'

/** Telas internas do app (montagem é filha da aba Designação). */
export type Tela = 'resumo' | 'montagem' | AbaNav

/** Variantes visuais do Botão da UI. */
export type VarianteBotao = 'primario' | 'vinho' | 'secundario' | 'fantasma'
