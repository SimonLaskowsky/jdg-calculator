import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { Calculator } from "@/components/calculator"
import { FAQ } from "@/components/faq"
import { Guide } from "@/components/guide"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "JDG vs Sp. z o.o. — Porównanie 2026",
  description:
    "Porównaj JDG i sp. z o.o. i znajdź próg opłacalności. Kiedy warto założyć spółkę? Kalkulator uwzględnia ZUS wspólnika, CIT, dywidendę i koszty księgowości.",
  alternates: { canonical: "https://ilezostanie.com/porownanie" },
}

export default function PorownaniePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero
          title={
            <>
              JDG czy{" "}
              <span className="bg-linear-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                sp. z o.o.
              </span>
              ?
            </>
          }
          subtitle="Znajdź indywidualny próg opłacalności — przy jakim przychodzie sp. z o.o. staje się korzystniejsza od JDG. Uwzględnia ZUS wspólnika, CIT, dywidendę i księgowość."
        />
        <Calculator defaultTab="porownanie" />
        <FAQ />
        <Guide />
      </main>
      <Footer />
    </div>
  )
}
