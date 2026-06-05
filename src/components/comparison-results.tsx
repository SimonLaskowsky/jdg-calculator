"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Trophy, User, Building2, Check, X, Lightbulb } from "lucide-react"
import { findSpzooThreshold, type SpzooComparisonResult } from "@/lib/calculations-spzoo"
import type { CitRate } from "@/lib/constants"
import { type ExtendedJdgResults, formatCurrency, getBestJdgOption, getBestSpzooOption } from "@/lib/calc-helpers"

interface ComparisonResultsProps {
  jdgResults: ExtendedJdgResults
  spzooResults: SpzooComparisonResult
  revenue: number
  costs: number
  citRate: CitRate
}

const prosConsJDG = {
  pros: ["Prosta księgowość (200-400 zł/mc)", "Brak podwójnego opodatkowania", "Łatwe wypłaty (Twoje pieniądze)"],
  cons: ["Wysoki ZUS (~1 774 zł/mc)", "Odpowiedzialność całym majątkiem"],
}

const prosConsSpzoo = {
  pros: ["Niski CIT (9% mały podatnik)", "Ograniczona odpowiedzialność", "Prestiż i wiarygodność"],
  cons: ["Droga księgowość (~800 zł/mc)", "Podwójne opodatkowanie (CIT + dywidenda)"],
}

export function ComparisonResults({ jdgResults, spzooResults, revenue, costs, citRate }: ComparisonResultsProps) {
  const bestJdg = getBestJdgOption(jdgResults)
  const bestSpzoo = getBestSpzooOption(spzooResults)

  const jdgWins = bestJdg.net > bestSpzoo.net
  const winner = jdgWins ? "JDG" : "Sp. z o.o."
  const difference = Math.abs(bestJdg.net - bestSpzoo.net)

  const threshold = useMemo(
    () => findSpzooThreshold(bestJdg.net / 12, costs, citRate),
    [bestJdg.net, costs, citRate]
  )
  const progress = threshold ? Math.min((revenue / threshold) * 100, 100) : 0
  const isAboveThreshold = threshold ? revenue >= threshold : false

  return (
    <div className="space-y-6">
      {/* Winner Banner */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Przy Twoich przychodach wygrywa</p>
              <h3 className="text-2xl font-bold text-foreground">{winner}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Różnica <span className="font-semibold text-primary">{formatCurrency(difference)}</span> rocznie
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Side by Side */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className={`border-border/50 ${jdgWins ? "ring-2 ring-primary/30" : ""}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">JDG — {bestJdg.label}</CardTitle>
              </div>
              {jdgWins && <Badge className="bg-primary text-primary-foreground">Wygrywa</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{formatCurrency(bestJdg.net)}</p>
            <p className="mt-1 text-sm text-muted-foreground">rocznie na rękę</p>
            <p className="mt-3 text-lg font-semibold text-foreground">{formatCurrency(bestJdg.net / 12)}</p>
            <p className="text-sm text-muted-foreground">miesięcznie</p>
          </CardContent>
        </Card>

        <Card className={`border-border/50 ${!jdgWins ? "ring-2 ring-primary/30" : ""}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">Sp. z o.o. — {bestSpzoo.label}</CardTitle>
              </div>
              {!jdgWins && <Badge className="bg-primary text-primary-foreground">Wygrywa</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{formatCurrency(bestSpzoo.net)}</p>
            <p className="mt-1 text-sm text-muted-foreground">rocznie na rękę</p>
            <p className="mt-3 text-lg font-semibold text-foreground">{formatCurrency(bestSpzoo.net / 12)}</p>
            <p className="text-sm text-muted-foreground">miesięcznie</p>
          </CardContent>
        </Card>
      </div>

      {/* Threshold Progress */}
      {threshold && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Próg opłacalności sp. z o.o.</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Twój przychód</span>
                <span className="font-medium">{formatCurrency(revenue)}</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Próg: {formatCurrency(threshold)}/mc</span>
                <span className={`font-medium ${isAboveThreshold ? "text-primary" : "text-muted-foreground"}`}>
                  {isAboveThreshold ? "Powyżej progu" : `Brakuje ${formatCurrency(threshold - revenue)}/mc`}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendation */}
      <Card className="border-border/50 bg-muted/30">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Rekomendacja</h4>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {jdgWins ? (
                  <>
                    Przy Twoich obecnych zarobkach <strong>JDG jest korzystniejsza</strong>.
                    {threshold && <> Sp. z o.o. zacznie się opłacać przy przychodzie ok. <strong>{formatCurrency(threshold)}/mc</strong>.</>}
                  </>
                ) : (
                  <>
                    Przy Twoich zarobkach <strong>sp. z o.o. może być korzystniejsza</strong>. Pamiętaj jednak o
                    dodatkowych kosztach (księgowość ~800 zł/mc) i obowiązkach formalnych. Skonsultuj decyzję z doradcą podatkowym.
                  </>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pros & Cons */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">JDG — Zalety i wady</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-primary">Zalety</p>
              <ul className="space-y-2">
                {prosConsJDG.pros.map((pro, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-destructive">Wady</p>
              <ul className="space-y-2">
                {prosConsJDG.cons.map((con, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <span className="text-muted-foreground">{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">Sp. z o.o. — Zalety i wady</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-primary">Zalety</p>
              <ul className="space-y-2">
                {prosConsSpzoo.pros.map((pro, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{pro}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-destructive">Wady</p>
              <ul className="space-y-2">
                {prosConsSpzoo.cons.map((con, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <span className="text-muted-foreground">{con}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
