"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Briefcase, Building, Check, X } from "lucide-react"
import { type ExtendedJdgResults, formatCurrency, getBestJdgOption } from "@/lib/calc-helpers"

interface B2BData {
  uopGross: number
  uopNet: number
  b2bRevenue: number
  b2bNet: number
  difference: number
}

interface B2BResultsProps {
  b2bData: B2BData
  jdgResults: ExtendedJdgResults
}

const prosConsB2B = {
  pros: ["Wyższe zarobki netto", "Możliwość odliczania kosztów", "Elastyczność i niezależność"],
  cons: ["Brak płatnego urlopu i L4", "Samodzielne rozliczenia i księgowość", "Brak stabilności zatrudnienia"],
}

const prosConsUoP = {
  pros: ["Płatny urlop (26 dni)", "Płatne L4 (80-100%)", "Stabilność i ochrona prawna"],
  cons: ["Niższe zarobki netto", "Brak możliwości odliczeń", "Mniejsza elastyczność"],
}

export function B2BResults({ b2bData, jdgResults }: B2BResultsProps) {
  const bestB2b = getBestJdgOption(jdgResults)
  const b2bWins = b2bData.b2bNet > b2bData.uopNet
  const difference = Math.abs(b2bData.b2bNet - b2bData.uopNet)
  const percentDiff = b2bData.uopNet > 0 ? ((b2bData.b2bNet - b2bData.uopNet) / b2bData.uopNet) * 100 : 0

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
              <p className="text-sm font-medium text-muted-foreground">Przy tych kwotach korzystniejsze jest</p>
              <h3 className="text-2xl font-bold text-foreground">{b2bWins ? "B2B (Kontrakt)" : "Umowa o pracę"}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Różnica <span className="font-semibold text-primary">{formatCurrency(difference)}</span> miesięcznie
                {" "}({percentDiff > 0 ? "+" : ""}{percentDiff.toFixed(1)}%)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Side by Side */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className={`border-border/50 ${b2bWins ? "ring-2 ring-primary/30" : ""}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">B2B (Kontrakt)</CardTitle>
              </div>
              {b2bWins && <Badge className="bg-primary text-primary-foreground">Wygrywa</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Faktura — {bestB2b.label}</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(b2bData.b2bRevenue)}</p>
            <div className="mt-4 border-t border-border/50 pt-4">
              <p className="text-sm text-muted-foreground">Na rękę /mc</p>
              <p className="text-3xl font-bold text-primary">{formatCurrency(b2bData.b2bNet)}</p>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-border/50 ${!b2bWins ? "ring-2 ring-primary/30" : ""}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">Umowa o pracę</CardTitle>
              </div>
              {!b2bWins && <Badge className="bg-primary text-primary-foreground">Wygrywa</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Brutto</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(b2bData.uopGross)}</p>
            <div className="mt-4 border-t border-border/50 pt-4">
              <p className="text-sm text-muted-foreground">Na rękę /mc</p>
              <p className="text-3xl font-bold text-foreground">{formatCurrency(b2bData.uopNet)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Annual Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{formatCurrency(b2bData.b2bNet * 12)}</p>
            <p className="mt-1 text-sm text-muted-foreground">B2B rocznie</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{formatCurrency(b2bData.uopNet * 12)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Etat rocznie</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{formatCurrency(difference * 12)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Różnica /rok</p>
          </CardContent>
        </Card>
      </div>

      {/* Pros & Cons */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">B2B — Zalety i wady</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-primary">Zalety</p>
              <ul className="space-y-2">
                {prosConsB2B.pros.map((pro, i) => (
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
                {prosConsB2B.cons.map((con, i) => (
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
              <Building className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-base font-semibold">Etat — Zalety i wady</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-primary">Zalety</p>
              <ul className="space-y-2">
                {prosConsUoP.pros.map((pro, i) => (
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
                {prosConsUoP.cons.map((con, i) => (
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
