import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Scale, TrendingUp, Percent, Building2, Briefcase } from "lucide-react"

const guideItems = [
  {
    icon: Scale,
    title: "Skala podatkowa",
    description: "Stawka 12% do 120 tys. zł dochodu, powyżej 32%. Idealna dla osób z niższymi dochodami. Pozwala na wspólne rozliczenie z małżonkiem i ulgi rodzinne.",
  },
  {
    icon: TrendingUp,
    title: "Podatek liniowy",
    description: "Stała stawka 19% niezależnie od dochodu. Opłacalny przy rocznych dochodach powyżej 100 tys. zł. Brak możliwości wspólnego rozliczenia z małżonkiem.",
  },
  {
    icon: Percent,
    title: "Ryczałt od przychodów",
    description: "Stawki od 2% do 17% w zależności od rodzaju działalności. Najprostsze rozliczenie, bez możliwości odliczania kosztów. Idealny przy niskich kosztach.",
  },
  {
    icon: Building2,
    title: "Spółka z o.o.",
    description: "CIT 9% lub 19% plus 19% PIT od dywidendy. Ograniczona odpowiedzialność majątkiem. Wymaga wyższych przychodów, by była opłacalna (od ok. 40-50 tys. zł/mc).",
  },
  {
    icon: Briefcase,
    title: "B2B vs etat",
    description: "Kontrakt B2B daje wyższe zarobki netto, ale bez benefitów pracowniczych. Etat to stabilność, płatne urlopy i L4. Kalkuluj różnicę przed podjęciem decyzji.",
  },
]

export function Guide() {
  return (
    <section id="poradnik" className="border-t border-border/50 bg-muted/30 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Jak wybrać formę opodatkowania w 2026?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Krótki przewodnik po dostępnych opcjach dla przedsiębiorców.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {guideItems.map((item, index) => (
            <Card key={index} className="border-border/50 bg-card transition-shadow hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base font-semibold">{item.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
