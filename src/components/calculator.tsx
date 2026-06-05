"use client"

import { useMemo, useState } from "react"
import { CalculatorInputs } from "./calculator-inputs"
import { JDGResults } from "./jdg-results"
import { SpzooResults } from "./spzoo-results"
import { ComparisonResults } from "./comparison-results"
import { B2BResults } from "./b2b-results"
import { RevenueChart } from "./revenue-chart"
import { compareAllForms, calculateLinear } from "@/lib/calculations"
import { compareSpzooScenarios } from "@/lib/calculations-spzoo"
import type { ZusType, CitRate } from "@/lib/constants"
import { type ExtendedJdgResults, getBestJdgOption, calculateUopNet } from "@/lib/calc-helpers"

export interface CalculatorInputState {
  revenue: number
  costs: number
  uopGross: number
  zusType: ZusType
  ryczaltRate: string
  citRate: CitRate
  ipBox: boolean
  authorCosts: boolean
}

export function Calculator() {
  const [activeTab, setActiveTab] = useState("jdg")
  const [inputs, setInputs] = useState<CalculatorInputState>({
    revenue: 20000,
    costs: 3000,
    uopGross: 15000,
    zusType: "full",
    ryczaltRate: "0.12",
    citRate: "small",
    ipBox: false,
    authorCosts: false,
  })

  const handleInputChange = (key: string, value: number | string | boolean) => {
    setInputs((prev) => ({ ...prev, [key]: value }))
  }

  const ryczaltRateNum = Number(inputs.ryczaltRate)

  // JDG results (skala / liniowy / ryczałt + opcjonalnie IP Box)
  const jdgResults = useMemo<ExtendedJdgResults | null>(() => {
    if (inputs.revenue <= 0) return null

    const baseInput = {
      monthlyRevenue: inputs.revenue,
      monthlyCosts: inputs.costs,
      zusType: inputs.zusType,
      ryczaltRate: ryczaltRateNum,
      paysSickness: true,
      useCopyrightCosts: inputs.authorCosts,
    }

    const result = compareAllForms(baseInput)
    const extended: ExtendedJdgResults = { ...result }

    if (inputs.ipBox) {
      const ipBoxResult = calculateLinear({ ...baseInput, useIpBox: true })
      ipBoxResult.taxForm = "linear"
      extended.ipBox = ipBoxResult
      if (ipBoxResult.yearly.totalBurden < result[result.best].yearly.totalBurden) {
        extended.best = "linear"
      }
    }

    return extended
  }, [inputs.revenue, inputs.costs, inputs.zusType, ryczaltRateNum, inputs.ipBox, inputs.authorCosts])

  // Sp. z o.o. results
  const spzooResults = useMemo(() => {
    if (inputs.revenue <= 0) return null
    return compareSpzooScenarios({
      monthlyRevenue: inputs.revenue,
      monthlyOperatingCosts: inputs.costs,
      citRate: inputs.citRate,
      payoutMethod: "mixed",
    })
  }, [inputs.revenue, inputs.costs, inputs.citRate])

  // Chart data across revenue levels
  const chartData = useMemo(() => {
    const data = []
    for (let rev = 5000; rev <= 50000; rev += 2500) {
      const jdg = compareAllForms({
        monthlyRevenue: rev,
        monthlyCosts: inputs.costs,
        zusType: inputs.zusType,
        ryczaltRate: ryczaltRateNum,
        paysSickness: true,
        useCopyrightCosts: inputs.authorCosts,
      })
      const spzoo = compareSpzooScenarios({
        monthlyRevenue: rev,
        monthlyOperatingCosts: inputs.costs,
        citRate: inputs.citRate,
        payoutMethod: "mixed",
      })
      data.push({
        przychod: `${rev / 1000}k`,
        skala: Math.round(jdg.scale.monthly.netAmount),
        liniowy: Math.round(jdg.linear.monthly.netAmount),
        ryczalt: Math.round(jdg.ryczalt.monthly.netAmount),
        spzoo: Math.round(spzoo.bestNetAmount / 12),
      })
    }
    return data
  }, [inputs.costs, inputs.zusType, ryczaltRateNum, inputs.authorCosts, inputs.citRate])

  // B2B vs UoP data
  const b2bData = useMemo(() => {
    const uopNet = calculateUopNet(inputs.uopGross)
    const bestB2bNet = jdgResults ? getBestJdgOption(jdgResults).net / 12 : 0
    return {
      uopGross: inputs.uopGross,
      uopNet,
      b2bRevenue: inputs.revenue,
      b2bNet: bestB2bNet,
      difference: bestB2bNet - uopNet,
    }
  }, [inputs.uopGross, inputs.revenue, jdgResults])

  return (
    <section id="kalkulator" className="py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          {/* Left Column - Inputs */}
          <div className="min-w-0 lg:self-start">
            <CalculatorInputs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              inputs={inputs}
              onInputChange={handleInputChange}
            />
          </div>

          {/* Right Column - Results */}
          <div className="min-w-0 space-y-6">
            {activeTab === "jdg" && jdgResults && (
              <>
                <JDGResults results={jdgResults} ryczaltRate={ryczaltRateNum} />
                <RevenueChart data={chartData} />
              </>
            )}
            {activeTab === "spzoo" && spzooResults && (
              <SpzooResults results={spzooResults} citRate={inputs.citRate} />
            )}
            {activeTab === "porownanie" && jdgResults && spzooResults && (
              <ComparisonResults
                jdgResults={jdgResults}
                spzooResults={spzooResults}
                revenue={inputs.revenue}
                costs={inputs.costs}
                citRate={inputs.citRate}
              />
            )}
            {activeTab === "b2b" && jdgResults && (
              <B2BResults b2bData={b2bData} jdgResults={jdgResults} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
