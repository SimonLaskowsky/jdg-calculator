"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CircleDot, User, Building2, Scale, Briefcase } from "lucide-react"
import type { CalculatorInputState } from "./calculator"

interface CalculatorInputsProps {
  activeTab: string
  onTabChange: (tab: string) => void
  inputs: CalculatorInputState
  onInputChange: (key: string, value: number | string | boolean) => void
}

const ZUS_ITEMS: Record<string, string> = {
  full: "Pełny ZUS (~1 927 zł)",
  preferential: "Preferencyjny (~456 zł)",
  smallPlus: "Mały ZUS Plus",
  startupRelief: "Ulga na start",
}

const RYCZALT_ITEMS: Record<string, string> = {
  "0.17": "17% - Wolne zawody",
  "0.15": "15% - Usługi niematerialne",
  "0.12": "12% - IT, programowanie",
  "0.085": "8,5% - Usługi dla firm, wynajem",
  "0.055": "5,5% - Produkcja, budowlanka",
  "0.03": "3% - Handel, gastronomia",
  "0.02": "2% - Produkty rolne",
}

const CIT_ITEMS: Record<string, string> = {
  small: "9% (mały podatnik)",
  standard: "19% (standardowy)",
}

/** Edytowalne pole liczbowe sprzężone z suwakiem (zł). */
function NumberInput({
  value,
  min,
  max,
  onCommit,
}: {
  value: number
  min: number
  max: number
  onCommit: (n: number) => void
}) {
  const [text, setText] = useState(String(value))
  useEffect(() => setText(String(value)), [value])

  const commit = (raw: string) => {
    const n = Number(raw.replace(/\s/g, ""))
    if (Number.isNaN(n) || raw.trim() === "") {
      setText(String(value))
      return
    }
    const clamped = Math.min(max, Math.max(min, Math.round(n)))
    setText(String(clamped))
    onCommit(clamped)
  }

  return (
    <div className="flex items-center gap-1 rounded-md border border-input bg-background px-2 py-0.5 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/50">
      <input
        type="number"
        inputMode="numeric"
        value={text}
        min={min}
        max={max}
        aria-label="Kwota w zł"
        onChange={(e) => {
          setText(e.target.value)
          const n = Number(e.target.value)
          if (!Number.isNaN(n) && n >= min && n <= max) onCommit(Math.round(n))
        }}
        onBlur={(e) => commit(e.target.value)}
        className="w-20 bg-transparent text-right text-sm font-semibold text-primary outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <span className="text-xs text-muted-foreground">zł</span>
    </div>
  )
}

export function CalculatorInputs({ activeTab, onTabChange, inputs, onInputChange }: CalculatorInputsProps) {
  const isB2B = activeTab === "b2b"
  const showJdgOptions = activeTab === "jdg" || activeTab === "porownanie" || activeTab === "b2b"
  const showCit = activeTab === "spzoo" || activeTab === "porownanie"

  return (
    <Card className="sticky top-24 border-border/50 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Twoje dane</CardTitle>
          <div className="flex items-center gap-2">
            <CircleDot className="h-2.5 w-2.5 animate-pulse text-primary" />
            <span className="text-xs text-muted-foreground">Wyniki na żywo</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="grid !h-auto w-full grid-cols-2 gap-1">
            <TabsTrigger value="jdg" className="!h-8 gap-1.5 text-xs">
              <User className="h-3.5 w-3.5 shrink-0" />
              <span>JDG</span>
            </TabsTrigger>
            <TabsTrigger value="spzoo" className="!h-8 gap-1.5 text-xs">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span>Sp. z o.o.</span>
            </TabsTrigger>
            <TabsTrigger value="porownanie" className="!h-8 gap-1.5 text-xs">
              <Scale className="h-3.5 w-3.5 shrink-0" />
              <span>Porównanie</span>
            </TabsTrigger>
            <TabsTrigger value="b2b" className="!h-8 gap-1.5 text-xs">
              <Briefcase className="h-3.5 w-3.5 shrink-0" />
              <span>B2B vs Etat</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Revenue Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              {isB2B ? "Przychód B2B (faktura)" : "Miesięczny przychód brutto"}
            </Label>
            <NumberInput value={inputs.revenue} min={5000} max={100000} onCommit={(v) => onInputChange("revenue", v)} />
          </div>
          <Slider
            value={[inputs.revenue]}
            onValueChange={(value) => onInputChange("revenue", Array.isArray(value) ? value[0] : value)}
            min={5000}
            max={100000}
            step={500}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>5 000 zł</span>
            <span>100 000 zł</span>
          </div>
        </div>

        {/* UoP gross — B2B tab only */}
        {isB2B && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Porównaj z etatem brutto</Label>
              <NumberInput value={inputs.uopGross} min={4666} max={50000} onCommit={(v) => onInputChange("uopGross", v)} />
            </div>
            <Slider
              value={[inputs.uopGross]}
              onValueChange={(value) => onInputChange("uopGross", Array.isArray(value) ? value[0] : value)}
              min={4666}
              max={50000}
              step={500}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>4 666 zł (min.)</span>
              <span>50 000 zł</span>
            </div>
          </div>
        )}

        {/* Costs Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Miesięczne koszty operacyjne</Label>
            <NumberInput value={inputs.costs} min={0} max={30000} onCommit={(v) => onInputChange("costs", v)} />
          </div>
          <Slider
            value={[inputs.costs]}
            onValueChange={(value) => onInputChange("costs", Array.isArray(value) ? value[0] : value)}
            min={0}
            max={30000}
            step={500}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 zł</span>
            <span>30 000 zł</span>
          </div>
        </div>

        {/* ZUS Type */}
        {showJdgOptions && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Rodzaj ZUS</Label>
            <Select items={ZUS_ITEMS} value={inputs.zusType} onValueChange={(value) => onInputChange("zusType", value as string)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ZUS_ITEMS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Ryczałt Rate */}
        {showJdgOptions && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Stawka ryczałtu</Label>
            <Select items={RYCZALT_ITEMS} value={inputs.ryczaltRate} onValueChange={(value) => onInputChange("ryczaltRate", value as string)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RYCZALT_ITEMS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* CIT Rate */}
        {showCit && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Stawka CIT</Label>
            <Select items={CIT_ITEMS} value={inputs.citRate} onValueChange={(value) => onInputChange("citRate", value as string)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CIT_ITEMS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Checkboxes */}
        {showJdgOptions && (
          <div className="space-y-3 rounded-lg border border-border/50 bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <Checkbox
                id="ipbox"
                checked={inputs.ipBox}
                onCheckedChange={(checked) => onInputChange("ipBox", checked as boolean)}
              />
              <Label htmlFor="ipbox" className="cursor-pointer text-sm">
                IP Box (5%)
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="author"
                checked={inputs.authorCosts}
                onCheckedChange={(checked) => onInputChange("authorCosts", checked as boolean)}
              />
              <Label htmlFor="author" className="cursor-pointer text-sm">
                50% koszty autorskie
              </Label>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
