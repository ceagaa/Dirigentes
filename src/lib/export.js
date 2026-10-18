import { CITACAO, nomeDiaCurto } from './constants'
import { lerChaveMes, nomeMes } from './datas'

async function carregarHtml2canvas() {
  const { default: html2canvas } = await import('html2canvas')
  return html2canvas
}

function nomeArquivo(chave) {
  const { ano, mes } = lerChaveMes(chave)
  return `designacao-${nomeMes(mes).toLowerCase()}-${ano}`
}

/** Renderiza o card da escala exatamente como está na tela. */
export async function capturarNo(no) {
  if (!no) throw new Error('Card da escala não encontrado.')

  const html2canvas = await carregarHtml2canvas()
  await (document.fonts?.ready ?? Promise.resolve())

  // Troca os dropdowns pelos nomes em texto para a exportação sair como planilha.
  no.classList.add('capturando')
  try {
    return await html2canvas(no, {
      backgroundColor: '#FFFFFF',
      scale: 2,
      useCORS: true,
      logging: false,
      imageTimeout: 15000,
    })
  } finally {
    no.classList.remove('capturando')
  }
}

function paraArquivo(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Falha ao gerar a imagem.'))), 'image/png')
  })
}

export async function baixarImagem(canvas, chave) {
  const blob = await paraArquivo(canvas)
  baixar(blob, `${nomeArquivo(chave)}.png`)
}

export async function baixarPdf(canvas, chave) {
  const { jsPDF } = await import('jspdf')
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const larguraPag = pdf.internal.pageSize.getWidth()
  const alturaPag = pdf.internal.pageSize.getHeight()
  const margem = 6
  const largura = larguraPag - margem * 2
  const altura = (canvas.height * largura) / canvas.width
  const dados = canvas.toDataURL('image/jpeg', 0.95)

  let restante = altura
  let posicao = margem

  pdf.addImage(dados, 'JPEG', margem, posicao, largura, altura)
  restante -= alturaPag - margem

  while (restante > 0) {
    posicao = margem - (altura - restante)
    pdf.addPage()
    pdf.addImage(dados, 'JPEG', margem, posicao, largura, altura)
    restante -= alturaPag - margem * 2
  }

  pdf.save(`${nomeArquivo(chave)}.pdf`)
  return canvas
}

function tituloDaEscala(chave) {
  const { ano, mes } = lerChaveMes(chave)
  return `Designação de ${nomeMes(mes)} de ${ano}`
}

/** Abre o menu nativo do sistema (WhatsApp, etc.). Sem suporte, copia o texto. */
export async function compartilhar({ canvas, chave, texto }) {
  const blob = await paraArquivo(canvas)
  const arquivo = new File([blob], `${nomeArquivo(chave)}.png`, { type: 'image/png' })
  const titulo = tituloDaEscala(chave)

  if (navigator.canShare?.({ files: [arquivo] })) {
    await navigator.share({ files: [arquivo], title: titulo, text: texto })
    return 'arquivo'
  }

  if (navigator.share) {
    await navigator.share({ title: titulo, text: texto })
    return 'texto'
  }

  await copiarTexto(texto)
  return 'copiado'
}

export async function copiarTexto(texto) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(texto)
    return
  }

  const area = document.createElement('textarea')
  area.value = texto
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  document.execCommand('copy')
  area.remove()
}

/** Resumo em texto pronto para colar no WhatsApp. */
export function textoSimplificado({ config, chave, ocorrencias, designacoes, dirigentes }) {
  const { ano, mes } = lerChaveMes(chave)
  const porId = new Map(dirigentes.map((d) => [d.id, d]))
  const linhas = [
    `*${config.titulo}*`,
    `${config.congregacao} — ${nomeMes(mes)} de ${ano}`,
    '',
  ]

  if (!ocorrencias.length) {
    linhas.push('Nenhum dia de campo configurado para este mês.')
  }

  for (const oc of ocorrencias) {
    const id = designacoes[oc.key]
    const dirigente = porId.get(id)
    const dia = nomeDiaCurto(oc.diaSemana)
    const nome = dirigente ? dirigente.nome : 'Sem designação'
    linhas.push(
      `*${dia}, ${oc.iso.slice(8, 10)}/${oc.iso.slice(5, 7)}* — ${oc.campo.horario} — ${oc.campo.local}`,
      `> ${nome}`,
      '',
    )
  }

  linhas.push(`_${CITACAO}_`)
  return linhas.join('\n')
}

function baixar(blob, nome) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nome
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
