import type { AbaNav } from '../lib/dominio'
import type { LucideIcon } from 'lucide-react'
import { CalendarDays, Settings, Users } from 'lucide-react'

interface ItemNav {
  id: AbaNav
  rotulo: string
  Icone: LucideIcon
}

const ITENS: ItemNav[] = [
  { id: 'designacao', rotulo: 'Designação', Icone: CalendarDays },
  { id: 'dirigentes', rotulo: 'Dirigentes', Icone: Users },
  { id: 'config', rotulo: 'Configurações', Icone: Settings },
]

/** Barra inferior fixa em vidro fosco (igual à referência), com safe-area. */
export default function BottomNav({ aba, aoMudar }: { aba: AbaNav; aoMudar: (aba: AbaNav) => void }) {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_20px_rgba(17,38,43,0.06)] backdrop-blur-xl"
    >
      <ul className="mx-auto flex h-16 w-full max-w-[640px] items-center justify-around px-4">
        {ITENS.map(({ id, rotulo, Icone }) => {
          const ativa = aba === id
          return (
            <li key={id}>
              <button
                type="button"
                aria-current={ativa ? 'page' : undefined}
                onClick={() => aoMudar(id)}
                className={`flex h-14 w-20 flex-col items-center justify-center gap-0.5 rounded-xl transition-colors ${
                  ativa ? 'font-bold text-teal' : 'text-faint hover:text-ink-soft'
                }`}
              >
                <Icone className="size-[22px]" aria-hidden="true" />
                <span className="text-[11px] font-semibold leading-tight">{rotulo}</span>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${ativa ? 'bg-teal' : 'bg-transparent'}`}
                  aria-hidden="true"
                />
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
