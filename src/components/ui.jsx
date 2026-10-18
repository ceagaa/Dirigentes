import { useEffect, useRef } from 'react'

const VARIA = {
  primario: 'bg-petrol text-white hover:bg-petrol-dark border border-petrol hover:border-petrol-dark',
  vinho: 'bg-wine text-white hover:bg-wine-dark border border-wine hover:border-wine-dark',
  secundario:
    'bg-paper text-ink border border-line hover:border-petrol hover:text-petrol',
  fantasma: 'border border-transparent text-muted hover:text-ink hover:bg-line-soft',
}

export function Botao({ variante = 'secundario', className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded px-3 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIA[variante]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export function Rotulo({ htmlFor, children }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-[13px] font-semibold text-ink">
      {children}
    </label>
  )
}

const BASE_CAMPO =
  'w-full rounded border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-petrol'

export function Input({ className = '', ...props }) {
  return <input className={`${BASE_CAMPO} ${className}`} {...props} />
}

export function Select({ className = '', children, ...props }) {
  return (
    <select className={`${BASE_CAMPO} appearance-none pr-8 ${className}`} {...props}>
      {children}
    </select>
  )
}

export function Chip({ ativo, children, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      className={`rounded border px-2.5 py-1.5 text-[13px] font-semibold transition-colors ${
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

export function Vazio({ icone: Icone, titulo, acao }) {
  return (
    <div className="flex flex-col items-center gap-3 border border-dashed border-line bg-paper px-6 py-12 text-center">
      {Icone ? <Icone className="size-7 text-muted" aria-hidden="true" /> : null}
      <p className="max-w-md text-sm text-muted">{titulo}</p>
      {acao}
    </div>
  )
}

export function Modal({ aberto, aoFechar, titulo, descricao, children, largura = 'max-w-2xl' }) {
  const painel = useRef(null)
  const anterior = useRef(null)

  useEffect(() => {
    if (!aberto) return undefined

    anterior.current = document.activeElement
    const alvo = painel.current?.querySelector('button, [href], input, select, textarea')
    alvo?.focus()

    const aoTeclar = (evento) => {
      if (evento.key === 'Escape') aoFechar()
      if (evento.key !== 'Tab' || !painel.current) return

      const focaveis = painel.current.querySelectorAll(
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
        className={`max-h-[92svh] w-full overflow-y-auto rounded-t-lg border border-line bg-canvas shadow-2xl sm:rounded-lg ${largura}`}
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
