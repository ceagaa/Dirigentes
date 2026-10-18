import { MapPin } from 'lucide-react'

export default function Splash({ congregacao, saindo }) {
  return (
    <div
      className={`fixed inset-0 z-[60] flex flex-col items-center justify-center bg-petrol px-6 text-center text-white splash ${
        saindo ? 'splash-saindo' : ''
      }`}
    >
      <span
        className="flex size-16 items-center justify-center border-2 border-white/50"
        aria-hidden="true"
      >
        <MapPin className="size-8" strokeWidth={1.75} />
      </span>
      <h1 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-5xl">
        Dirigentes
      </h1>
      <p className="mt-3 max-w-sm text-sm font-semibold text-white/85">{congregacao}</p>
    </div>
  )
}
