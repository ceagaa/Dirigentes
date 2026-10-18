import { lerChaveMes } from './datas'

/** Codifica um objeto JSON em texto seguro para URL (base64url, sem padding). */
function codificar(valor) {
  const bytes = new TextEncoder().encode(JSON.stringify(valor))
  let binario = ''
  for (let i = 0; i < bytes.length; i += 1) binario += String.fromCharCode(bytes[i])
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Desfaz o codificar. Retorna null quando o conteúdo é inválido. */
export function decodificar(texto) {
  try {
    const base64 = String(texto).replace(/-/g, '+').replace(/_/g, '/')
    const preenchido = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const binario = atob(preenchido)
    const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0))
    const dados = JSON.parse(new TextDecoder().decode(bytes))
    if (!dados || !Array.isArray(dados.r)) return null
    return dados
  } catch {
    return null
  }
}

/**
 * Monta o payload mínimo da designação pronta: cabeçalho + linhas
 * [iso, horário, local, nome] — cabe em um link de WhatsApp.
 */
export function montarPayload({ config, chave, ocorrencias, designacoes, dirigentes }) {
  const { ano, mes } = lerChaveMes(chave)
  const porId = new Map(dirigentes.map((d) => [d.id, d]))

  const linhas = ocorrencias
    .filter((oc) => designacoes[oc.key])
    .map((oc) => [
      oc.iso,
      String(oc.campo.horario),
      String(oc.campo.local),
      porId.get(designacoes[oc.key])?.nome ?? '',
    ])

  return {
    t: config.titulo,
    c: config.congregacao,
    a: ano,
    m: mes,
    r: linhas,
  }
}

export function linkDe(payload) {
  const base = `${window.location.origin}${window.location.pathname}`
  return `${base}#/ver/${codificar(payload)}`
}

export function lerHashVer() {
  const hash = window.location.hash || ''
  const inicio = '#/ver/'
  if (!hash.startsWith(inicio)) return null
  return hash.slice(inicio.length) || null
}
