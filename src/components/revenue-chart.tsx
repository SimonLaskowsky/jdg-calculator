"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface ChartPoint {
  przychod: string
  skala: number
  liniowy: number
  ryczalt: number
  spzoo: number
}

interface RevenueChartProps {
  data: ChartPoint[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  const formatYAxis = (value: number) => `${(value / 1000).toFixed(0)}k`

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Porównanie przy różnych przychodach</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="przychod"
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fontSize: 12 }}
                className="fill-muted-foreground"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                formatter={(value) => [`${Number(value).toLocaleString("pl-PL")} zł`, ""]}
                contentStyle={{
                  backgroundColor: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
                labelFormatter={(label) => `Przychód: ${label}`}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "16px" }} />
              <Line type="monotone" dataKey="skala" name="Skala podatkowa" stroke="var(--chart-1)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="liniowy" name="Podatek liniowy" stroke="var(--chart-2)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="ryczalt" name="Ryczałt" stroke="var(--chart-3)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              <Line type="monotone" dataKey="spzoo" name="Sp. z o.o." stroke="var(--chart-4)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">Oś Y: miesięczna kwota netto na rękę</p>
      </CardContent>
    </Card>
  )
}
