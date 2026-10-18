import { CHAVE_LOCAL, ID_REGISTRO, estadoInicial, normalizarEstado } from './estadoInicial'

const URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseAtivo = Boolean(URL && ANON_KEY)

const TABELA = 'escala_dirigentes'

/** O SDK só é baixado quando há credenciais configuradas. */
let cliente = null
async function obterCliente() {
  if (!supabaseAtivo) return null
  if (!cliente) {
    const { createClient } = await import('@supabase/supabase-js')
    cliente = createClient(URL, ANON_KEY)
  }
  return cliente
}

/**
 * Carrega o estado mais recente: Supabase primeiro, cache local como reserva.
 * Retorna { estado, origem } para a interface sinalizar de onde veio o dado.
 */
export async function carregarEstado() {
  try {
    const supabase = await obterCliente()
    if (supabase) {
      const { data, error } = await supabase
        .from(TABELA)
        .select('*')
        .eq('id', ID_REGISTRO)
        .maybeSingle()

      if (error) throw error
      if (data) {
        const estado = normalizarEstado(data)
        guardarLocal(estado)
        return { estado, origem: 'supabase' }
      }
    }
  } catch (erro) {
    console.warn('Supabase indisponível, usando cache local.', erro)
  }

  try {
    const bruto = localStorage.getItem(CHAVE_LOCAL)
    if (bruto) return { estado: normalizarEstado(JSON.parse(bruto)), origem: 'local' }
  } catch (erro) {
    console.warn('Cache local ilegível.', erro)
  }

  return { estado: estadoInicial(), origem: 'padrao' }
}

function guardarLocal(estado) {
  try {
    localStorage.setItem(CHAVE_LOCAL, JSON.stringify(estado))
  } catch (erro) {
    console.warn('Não foi possível gravar o cache local.', erro)
  }
}

/**
 * Persiste o estado. Sempre grava localmente e, quando configurado,
 * envia para a tabela pública do Supabase.
 * @returns {Promise<'supabase'|'local'>}
 */
export async function salvarEstado(estado) {
  guardarLocal(estado)

  const supabase = await obterCliente()
  if (!supabase) return 'local'

  try {
    const { error } = await supabase.from(TABELA).upsert(
      {
        id: ID_REGISTRO,
        dirigentes: estado.dirigentes,
        config_campos: estado.config_campos,
        escalas: estado.escalas,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    if (error) throw error
    return 'supabase'
  } catch (erro) {
    console.warn('Falha ao sincronizar com o Supabase.', erro)
    throw erro
  }
}
