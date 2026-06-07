import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { Calculator } from "@/components/calculator"
import { FAQ } from "@/components/faq"
import { Guide } from "@/components/guide"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "B2B vs Etat 2026 — Kalkulator",
  description:
    "Sprawdź czy B2B czy umowa o pracę jest dla Ciebie korzystniejsza w 2026. Kalkulator uwzględnia ZUS, podatek, urlop i koszty pracodawcy.",
  alternates: { canonical: "https://ilezostanie.com/b2b-vs-etat" },
}

export default function B2bVsEtatPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero
          title={
            <>
              B2B czy{" "}
              <span className="bg-linear-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                etat
              </span>
              ?
            </>
          }
          subtitle="Porównaj netto na B2B (JDG) z wynagrodzeniem na umowie o pracę. Wpisz przychód B2B i brutto na etacie, a zobaczysz dokładną różnicę na rękę."
        />
        <Calculator defaultTab="b2b" />
        <FAQ />
        <Guide />
      </main>
      <Footer />
    </div>
  )
}
