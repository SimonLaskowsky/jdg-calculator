import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { Calculator } from "@/components/calculator"
import { FAQ } from "@/components/faq"
import { Guide } from "@/components/guide"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Kalkulator Sp. z o.o. 2026 — CIT 9% i dywidenda",
  description:
    "Oblicz ile zostanie właścicielowi sp. z o.o. w 2026. Porównaj scenariusze: tylko dywidenda, minimalna pensja + dywidenda, pełna pensja. CIT 9% małego podatnika i 19% standardowy.",
  alternates: { canonical: "https://ilezostanie.com/kalkulator-spzoo" },
}

export default function SpzooPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero
          title={
            <>
              Kalkulator{" "}
              <span className="bg-linear-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                sp. z o.o.
              </span>
            </>
          }
          subtitle="Sprawdź ile zostanie Ci na rękę jako właściciel spółki — z uwzględnieniem CIT, dywidendy i obowiązkowego ZUS jednoosobowego wspólnika."
        />
        <Calculator defaultTab="spzoo" />
        <FAQ />
        <Guide />
      </main>
      <Footer />
    </div>
  )
}
