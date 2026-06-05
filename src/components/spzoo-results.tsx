"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, TriangleAlert } from "lucide-react"
import type { SpzooComparisonResult } from "@/lib/calculations-spzoo"
import type { SpzooYearlyResult, CitRate } from "@/lib/constants"
import { formatCurrency, formatPercent, getBestSpzooOption } from "@/lib/calc-helpers"

interface SpzooResultsProps {
  results: SpzooComparisonResult
  citRate: CitRate
}

export function SpzooResults({ results, citRate }: SpzooResultsProps) {
  const best = getBestSpzooOption(results)
  const citLabel = citRate === "small" ? "9%" : "19%"

  const cards: { key: string; label: string; data: SpzooYearlyResult }[] = [
    { key: "dividend", label: "Tylko dywidenda", data: results.dividend },
    { key: "minSalaryPlusDividend", label: "Min. pensja + dywidenda", data: results.minSalaryPlusDividend },
    { key: "fullSalary", label: "Pełna pensja", data: results.fullSalary },
  ]

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                Najlepszy scenariusz (CIT {citLabel}): {best.label}
              </p>
              <h3 className="text-xl font-bold text-foreground">Na rękę łącznie</h3>
              <p className="mt-2 text-3xl font-bold text-primary">
                {formatCurrency(best.net)}
                <span className="ml-2 text-base font-normal text-muted-foreground">/ rok</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scenario cards */}
      <div className="grid gap-4">
        {cards.map(({ key, label, data }) => {
          const isBest = best.key === key
          return (
            <Card key={key} className={`transition-all ${isBest ? "border-primary/50 shadow-sm" : "border-border/50"}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">{label}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Efekt. {formatPercent(data.effectiveRate)}</span>
                    {isBest && <Badge className="bg-primary text-primary-foreground">Najlepsza</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-muted-foreground">CIT</p>
                    <p className="font-medium">{formatCurrency(data.monthly.cit)}/mc</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pod. dywidenda</p>
                    <p className="font-medium">{formatCurrency(data.monthly.dividendTax)}/mc</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pensja netto</p>
                    <p className="font-medium">{formatCurrency(data.monthly.ownerNetSalary)}/mc</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Na rękę /mc</p>
                    <p className="font-semibold text-foreground">{formatCurrency(data.monthly.ownerTotalNet)}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                  <span className="text-sm text-muted-foreground">Rocznie na rękę</span>
                  <span className="text-lg font-bold text-foreground">{formatCurrency(data.yearly.ownerTotalNet)}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Warning */}
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="flex gap-3 p-4">
          <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Uwaga:</strong> Sp. z o.o. wymaga pełnej księgowości (~800 zł/mc)
            oraz ma dodatkowe obowiązki formalne.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
