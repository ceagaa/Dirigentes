import type { ReactNode } from 'react'
import type { VarianteBotao } from '../lib/dominio'
import { useEffect, useRef } from 'react'
import type { LucideIcon } from 'lucide-react'

const VARIA: Record<VarianteBotao, string> = {
  primario: 'bg-petrol text-white hover:bg-petrol-dark border border-petrol hover:border-petrol-dark',
  vinho: 'bg-wine text-white hover:bg-wine-dark border border-wine hover:border-wine-dark',
  secundario:
    'bg-paper text-ink border border-line hover:border-petrol hover:text-petrol',
  fantasma: 'border border-transparent text-muted hover:text-ink hover:bg-line-soft',
}

type BotaoProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: VarianteBotao
}

export function Botao({ variante = 'secundario', className = '', children, ...props }: BotaoProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIA[variante]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

type RotuloProps = React.LabelHTMLAttributes<HTMLLabelElement>

export function Rotulo({ htmlFor, children }: RotuloProps) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-[13px] font-semibold text-ink">
      {children}
    </label>
  )
}

const BASE_CAMPO =
  'w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-muted focus:border-petrol'

export function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${BASE_CAMPO} ${className}`} {...props} />
}

export function Select({ className = '', children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`${BASE_CAMPO} appearance-none pr-8 ${className}`} {...props}>
      {children}
    </select>
  )
}

type ChipProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  ativo: boolean
}

export function Chip({ ativo, children, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
        ativo
          ? 'border-petrol bg-petrol text-white'
          : 'border-line bg-paper text-muted hover:border-petrol hover:text-petrol'
      }`}
      {...props}
    >
      {children}
    </button>
  )
}

type VazioProps = {
  icone?: LucideIcon
  titulo: string
  acao?: ReactNode
}

export function Vazio({ icone: Icone, titulo, acao }: VazioProps) {
  return (
    <div className="flex flex-col items-center gap-3 border border-dashed border-line bg-paper px-6 py-12 text-center">
      {Icone ? <Icone className="size-7 text-muted" aria-hidden="true" /> : null}
      <p className="max-w-md text-sm text-muted">{titulo}</p>
      {acao}
    </div>
  )
}

type ModalProps = {
  aberto: boolean
  aoFechar: () => void
  titulo: string
  descricao?: string
  children: ReactNode
  largura?: string
}

export function Modal({ aberto, aoFechar, titulo, descricao, children, largura = 'max-w-2xl' }: ModalProps) {
  const painel = useRef<HTMLDivElement>(null)
  const anterior = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!aberto) return undefined

    anterior.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const alvo = painel.current?.querySelector<HTMLElement>('button, [href], input, select, textarea')
    alvo?.focus()

    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') aoFechar()
      if (evento.key !== 'Tab' || !painel.current) return

      const focaveis = painel.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focaveis.length) return

      const primeiro = focaveis[0]
      const ultimo = focaveis[focaveis.length - 1]
      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault()
        primeiro.focus()
      }
    }

    document.addEventListener('keydown', aoTeclar)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', aoTeclar)
      document.body.style.overflow = overflow
      anterior.current?.focus?.()
    }
  }, [aberto, aoFechar])

  if (!aberto) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) aoFechar()
      }}
    >
      <div
        ref={painel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        className={`max-h-[92svh] w-full overflow-y-auto rounded-t-3xl border border-line bg-canvas shadow-2xl sm:rounded-3xl ${largura}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line bg-paper px-5 py-4">
          <div>
            <h2 id="modal-titulo" className="font-display text-lg text-ink">
              {titulo}
            </h2>
            {descricao ? <p className="mt-0.5 text-sm text-muted">{descricao}</p> : null}
          </div>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar"
            className="rounded p-1.5 text-muted transition-colors hover:bg-line-soft hover:text-ink"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
              <path
                d="M18 6 6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

