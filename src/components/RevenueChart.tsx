'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChartDataPoint {
  revenue: number;
  'Skala': number;
  'Liniowy': number;
  'Ryczałt': number;
  'Sp. z o.o.': number;
}

interface RevenueChartProps {
  chartData: ChartDataPoint[];
  formatCurrency: (value: number) => string;
}

export default function RevenueChart({ chartData }: RevenueChartProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Porównanie przy różnych przychodach
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="revenue"
              tickFormatter={(v) => `${v / 1000}k`}
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis
              tickFormatter={(v) => `${v / 1000}k`}
              stroke="#9CA3AF"
              fontSize={12}
            />
            <Tooltip
              formatter={(value) => [`${Number(value).toLocaleString('pl-PL')} zł`, '']}
              labelFormatter={(label) => `Przychód: ${Number(label).toLocaleString('pl-PL')} zł`}
              contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#F3F4F6' }}
            />
            <Legend />
            <Line type="monotone" dataKey="Skala" stroke="#10B981" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Liniowy" stroke="#3B82F6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Ryczałt" stroke="#F59E0B" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="Sp. z o.o." stroke="#8B5CF6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Oś Y: miesięczna kwota netto na rękę
      </p>
    </div>
  );
}
