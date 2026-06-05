"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy } from "lucide-react"
import type { YearlyResult } from "@/lib/constants"
import { type ExtendedJdgResults, formatCurrency, formatPercent, getBestJdgOption } from "@/lib/calc-helpers"

interface JDGResultsProps {
  results: ExtendedJdgResults
  ryczaltRate: number
}

export function JDGResults({ results, ryczaltRate }: JDGResultsProps) {
  const best = getBestJdgOption(results)

  const cards: { key: string; label: string; data: YearlyResult }[] = [
    { key: "scale", label: "Skala podatkowa 12%/32%", data: results.scale },
    { key: "linear", label: "Podatek liniowy 19%", data: results.linear },
    ...(results.ipBox ? [{ key: "ipBox", label: "IP Box 5%", data: results.ipBox }] : []),
    { key: "ryczalt", label: `Ryczałt ${(ryczaltRate * 100).toFixed(1).replace(".", ",")}%`, data: results.ryczalt },
  ]

  return (
    <div className="space-y-6">
      {/* Winner Card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Najlepsza opcja</p>
              <h3 className="text-xl font-bold text-foreground">{best.label}</h3>
              <p className="mt-2 text-3xl font-bold text-primary">
                {formatCurrency(best.net)}
                <span className="ml-2 text-base font-normal text-muted-foreground">/ rok</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Cards */}
      <div className="grid gap-4">
        {cards.map(({ key, label, data }) => {
          const isBest = best.key === key
          return (
            <Card key={key} className={`transition-all ${isBest ? "border-primary/50 shadow-sm" : "border-border/50"}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">{label}</CardTitle>
                  {isBest && <Badge className="bg-primary text-primary-foreground">Najlepsza</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground">ZUS społeczny</p>
                    <p className="font-medium">{formatCurrency(data.monthly.zusSocial)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Skł. zdrowotna</p>
                    <p className="font-medium">{formatCurrency(data.monthly.zusHealth)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Podatek</p>
                    <p className="font-medium">{formatCurrency(data.monthly.taxAdvance)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Suma obciążeń</p>
                    <p className="font-medium">{formatCurrency(data.monthly.totalBurden)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Na rękę /mc</p>
                    <p className="font-semibold text-foreground">{formatCurrency(data.monthly.netAmount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Efektywna stawka</p>
                    <p className="font-medium">{formatPercent(data.effectiveRate)}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                  <span className="text-sm text-muted-foreground">Rocznie na rękę</span>
                  <span className="text-lg font-bold text-foreground">{formatCurrency(data.yearly.netAmount)}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
