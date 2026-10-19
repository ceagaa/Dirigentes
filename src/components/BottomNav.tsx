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
      className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]"
    >
      <ul className="mx-auto flex w-full max-w-md items-center gap-1 rounded-full border border-line bg-paper/95 p-1.5 shadow-[0_10px_38px_-10px_rgba(16,38,43,0.25)] backdrop-blur">
        {ITENS.map(({ id, rotulo, Icone }) => {
          const ativa = aba === id
          return (
            <li key={id} className="flex-1">
              <button
                type="button"
                aria-current={ativa ? 'page' : undefined}
                onClick={() => aoMudar(id)}
                className={`flex w-full flex-col items-center gap-0.5 rounded-full px-2 py-2 text-[11px] font-semibold transition-colors ${
                  ativa ? 'bg-canvas text-petrol' : 'text-muted hover:text-ink'
                }`}
              >
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
