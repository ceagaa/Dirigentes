import type { Ocorrencia } from '../lib/dominio'
import type { ConfigEscala } from '../lib/dominio'
import { useMemo, useRef } from 'react'
import { FileDown, ImageDown, Link as LinkIcon, MapPin } from 'lucide-react'
import { decodificar } from '../lib/compartilhamento'
import { baixarImagem, baixarPdf } from '../lib/export'
import { Botao } from './ui'
import EscalaCard from './EscalaCard'

interface LinhaCompartilhada {
  key: string
  iso: string
  dia: number
  diaSemana: number
  campo: { horario: string; local: string }
  nome: string
}

function isoParaDia(iso: string): number {
  return new Date(`${iso}T12:00:00`).getDay()
}

export default function TelaVer({
  payload,
  aoVoltar,
  aoAvisar,
}: {
  payload: string
  aoVoltar: () => void
  aoAvisar: (mensagem: string) => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const dados = useMemo(() => decodificar(payload ?? ''), [payload])

  const config = dados ? { titulo: dados.t, congregacao: dados.c } : null
  const chave = dados ? `${dados.a}-${dados.m + 1}` : ''

  const ocorrencias = useMemo(() => {
    if (!dados) return []
    return dados.r
      .filter((linha) => Array.isArray(linha) && linha[0])
      .map((linha, i): LinhaCompartilhada => {
        const [iso, horario, local, nome] = linha
        return {
          key: `v-${i}`,
          iso,
          dia: Number(iso.slice(8, 10)),
          diaSemana: isoParaDia(iso),
          campo: { horario, local },
          nome,
        }
      })
  }, [dados])

  const nomes = useMemo(
    () => Object.fromEntries(ocorrencias.map((oc) => [oc.key, oc.nome])),
    [ocorrencias],
  )

  if (!dados || !config) {
    return (
      <div className="mx-auto flex min-h-svh max-w-lg flex-col items-center justify-center gap-4 px-6 text-center">
        <LinkIcon className="size-8 text-wine" aria-hidden="true" />
        <h1 className="font-display text-2xl text-ink">Link inválido</h1>
        <p className="text-sm text-muted">
          Este link não contém uma designação válida. Peça para a pessoa gerar o link novamente
          na tela da designação pronta.
        </p>
        <Botao variante="primario" onClick={aoVoltar}>
          Voltar para o app
        </Botao>
      </div>
    )
  }

  const ocorrenciasCard = ocorrencias as unknown as Ocorrencia[]
  const configCard = config as unknown as ConfigEscala

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 pb-24">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className="flex size-9 items-center justify-center bg-petrol text-white"
            aria-hidden="true"
          >
            <MapPin className="size-5" />
          </span>
          <div>
            <p className="font-display text-base font-bold leading-tight text-ink">
              Designação compartilhada
            </p>
            <p className="text-xs text-muted">{dados.c}</p>
          </div>
        </div>
        <Botao onClick={aoVoltar}>Voltar para o app</Botao>
      </header>

      <div className="scroll-hint overflow-x-auto pb-2">
        <EscalaCard
          ref={cardRef}
          config={configCard}
          ocorrencias={ocorrenciasCard}
          dirigentes={[]}
          designacoes={{}}
          nomes={nomes}
          somenteLeitura
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Botao
          variante="primario"
          onClick={async () => {
            try {
              await baixarPdf(cardRef.current, chave)
              aoAvisar('PDF baixado.')
            } catch (e) {
              aoAvisar(e instanceof Error ? e.message : 'Não foi possível gerar o PDF.')
            }
          }}
        >
          <FileDown className="size-4" />
          Baixar PDF
        </Botao>
        <Botao
          variante="secundario"
          onClick={async () => {
            try {
              await baixarImagem(cardRef.current, chave)
              aoAvisar('Imagem baixada.')
            } catch (e) {
              aoAvisar(e instanceof Error ? e.message : 'Não foi possível gerar a imagem.')
            }
          }}
        >
          <ImageDown className="size-4" />
          Baixar imagem
        </Botao>
      </div>

      <p className="mt-4 text-[13px] text-muted">
        Somente leitura: esta é a programação que foi compartilhada com você.
      </p>
    </div>
  )
}
