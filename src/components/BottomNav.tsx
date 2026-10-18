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

export default function BottomNav({ aba, aoMudar }: { aba: AbaNav; aoMudar: (aba: AbaNav) => void }) {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto grid max-w-6xl grid-cols-3">
        {ITENS.map(({ id, rotulo, Icone }) => {
          const ativa = aba === id
          return (
            <li key={id}>
              <button
                type="button"
                aria-current={ativa ? 'page' : undefined}
                onClick={() => aoMudar(id)}
                className={`relative flex w-full flex-col items-center gap-1 px-2 py-2.5 text-[11px] font-semibold transition-colors ${
                  ativa ? 'text-petrol' : 'text-muted hover:text-ink'
                }`}
              >
                {ativa ? (
                  <span
                    className="absolute inset-x-4 top-0 h-0.5 bg-petrol"
                    aria-hidden="true"
                  />
                ) : null}
                <Icone className="size-5" aria-hidden="true" />
                {rotulo}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
