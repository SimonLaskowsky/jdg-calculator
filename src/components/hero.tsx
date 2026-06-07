import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"

const trustPoints = ["Bezpłatny kalkulator", "Wyniki w czasie rzeczywistym", "Aktualne stawki ZUS i PIT 2026"]

interface HeroProps {
  /** Nagłówek H1. Domyślnie „Ile zostanie Ci na rękę?" z zielonym akcentem. */
  title?: ReactNode
  /** Podtytuł pod nagłówkiem. */
  subtitle?: ReactNode
}

const defaultTitle = (
  <>
    <span className="bg-linear-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
      Ile zostanie
    </span>{" "}
    Ci na rękę?
  </>
)

export function Hero({ title, subtitle }: HeroProps = {}) {
  return (
    <section className="relative overflow-hidden pb-6 pt-12 sm:pt-16">
      {/* Soft gradient backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-130 w-[min(900px,90vw)] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute left-[15%] top-[20%] h-65 w-65 rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="mx-auto max-w-4xl text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {title ?? defaultTitle}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {subtitle ?? "Porównaj JDG i sp. z o.o. - znajdź najkorzystniejszą formę opodatkowania dla swojej działalności."}
          </p>

          {/* Trust points */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {trustPoints.map((point) => (
              <span key={point} className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-primary" />
                {point}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
