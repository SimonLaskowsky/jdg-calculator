'use client';

import { useState, useEffect, useMemo } from 'react';
import { compareAllForms, calculateLinear, type ComparisonResult } from '@/lib/calculations';
import { compareSpzooScenarios, findSpzooThreshold, type SpzooComparisonResult } from '@/lib/calculations-spzoo';
import { RYCZALT_RATES, type ZusType, type YearlyResult, type CitRate } from '@/lib/constants';
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

type BusinessForm = 'jdg' | 'spzoo' | 'comparison' | 'b2bVsUop';

interface ExtendedJdgResults extends ComparisonResult {
  ipBox?: YearlyResult;
}

// UoP calculation helper
function calculateUopNet(grossSalary: number): number {
  if (grossSalary <= 0) return 0;

  // Employee ZUS contributions
  const pension = grossSalary * 0.0976;
  const disability = grossSalary * 0.015;
  const sickness = grossSalary * 0.0245;
  const zusTotal = pension + disability + sickness;

  // Health insurance base
  const healthBase = grossSalary - zusTotal;
  const health = healthBase * 0.09;

  // Tax calculation
  const taxBase = grossSalary - zusTotal - 250; // 250 zł monthly cost deduction
  const yearlyTaxBase = taxBase * 12;
  const yearlyTaxFree = 30000;
  const yearlyThreshold = 120000;

  let yearlyTax = 0;
  if (yearlyTaxBase > yearlyTaxFree) {
    if (yearlyTaxBase <= yearlyThreshold) {
      yearlyTax = (yearlyTaxBase - yearlyTaxFree) * 0.12;
    } else {
      yearlyTax = (yearlyThreshold - yearlyTaxFree) * 0.12 + (yearlyTaxBase - yearlyThreshold) * 0.32;
    }
  }
  const monthlyTax = yearlyTax / 12;

  return Math.max(0, grossSalary - zusTotal - health - monthlyTax);
}

export default function Home() {
  // Shared state
  const [activeTab, setActiveTab] = useState<BusinessForm>('jdg');
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(15000);
  const [monthlyCosts, setMonthlyCosts] = useState<number>(3000);

  // JDG state
  const [zusType, setZusType] = useState<ZusType>('full');
  const [ryczaltRate, setRyczaltRate] = useState<number>(0.12);
  const [useIpBox, setUseIpBox] = useState<boolean>(false);
  const [useCopyrightCosts, setUseCopyrightCosts] = useState<boolean>(false);

  // Sp. z o.o. state
  const [citRate, setCitRate] = useState<CitRate>('small');

  // B2B vs UoP state
  const [uopGross, setUopGross] = useState<number>(15000);

  // Auto-calculate JDG results
  const jdgResults = useMemo<ExtendedJdgResults | null>(() => {
    if (monthlyRevenue <= 0) return null;

    const baseInput = {
      monthlyRevenue,
      monthlyCosts,
      zusType,
      ryczaltRate,
      paysSickness: true,
      useCopyrightCosts,
    };

    const result = compareAllForms(baseInput);
    let extendedResult: ExtendedJdgResults = { ...result };

    if (useIpBox) {
      const ipBoxResult = calculateLinear({ ...baseInput, useIpBox: true });
      ipBoxResult.taxForm = 'linear';
      extendedResult.ipBox = ipBoxResult;

      if (ipBoxResult.yearly.totalBurden < result[result.best].yearly.totalBurden) {
        extendedResult.best = 'linear';
      }
    }

    return extendedResult;
  }, [monthlyRevenue, monthlyCosts, zusType, ryczaltRate, useIpBox, useCopyrightCosts]);

  // Auto-calculate Sp. z o.o. results
  const spzooResults = useMemo<SpzooComparisonResult | null>(() => {
    if (monthlyRevenue <= 0) return null;

    return compareSpzooScenarios({
      monthlyRevenue,
      monthlyOperatingCosts: monthlyCosts,
      citRate,
      payoutMethod: 'mixed',
    });
  }, [monthlyRevenue, monthlyCosts, citRate]);

  // Generate chart data for different revenue levels
  const chartData = useMemo(() => {
    const data = [];
    for (let rev = 5000; rev <= 50000; rev += 2500) {
      const jdg = compareAllForms({
        monthlyRevenue: rev,
        monthlyCosts,
        zusType,
        ryczaltRate,
        paysSickness: true,
        useCopyrightCosts,
      });

      const spzoo = compareSpzooScenarios({
        monthlyRevenue: rev,
        monthlyOperatingCosts: monthlyCosts,
        citRate,
        payoutMethod: 'mixed',
      });

      data.push({
        revenue: rev,
        'Skala': Math.round(jdg.scale.monthly.netAmount),
        'Liniowy': Math.round(jdg.linear.monthly.netAmount),
        'Ryczałt': Math.round(jdg.ryczalt.monthly.netAmount),
        'Sp. z o.o.': Math.round(spzoo.bestNetAmount / 12),
      });
    }
    return data;
  }, [monthlyCosts, zusType, ryczaltRate, useCopyrightCosts, citRate]);

  // B2B vs UoP comparison data
  const b2bVsUopData = useMemo(() => {
    const uopNet = calculateUopNet(uopGross);

    // Calculate equivalent B2B revenue needed to match UoP net
    const b2bResults = jdgResults;
    const bestB2bNet = b2bResults ? b2bResults[b2bResults.best].monthly.netAmount : 0;

    // Calculate B2B at same "gross" level for comparison
    const b2bAtUopGross = compareAllForms({
      monthlyRevenue: uopGross,
      monthlyCosts: 0,
      zusType,
      ryczaltRate,
      paysSickness: true,
      useCopyrightCosts,
    });

    return {
      uopGross,
      uopNet,
      b2bRevenue: monthlyRevenue,
      b2bNet: bestB2bNet,
      b2bAtUopGross: b2bAtUopGross[b2bAtUopGross.best].monthly.netAmount,
      difference: bestB2bNet - uopNet,
    };
  }, [uopGross, monthlyRevenue, jdgResults, zusType, ryczaltRate, useCopyrightCosts]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(value);
  };

  const getBestJdgOption = (results: ExtendedJdgResults) => {
    const options = [
      { key: 'scale', label: 'Skala podatkowa', burden: results.scale.yearly.totalBurden, net: results.scale.yearly.netAmount },
      { key: 'linear', label: 'Podatek liniowy', burden: results.linear.yearly.totalBurden, net: results.linear.yearly.netAmount },
      { key: 'ryczalt', label: 'Ryczałt', burden: results.ryczalt.yearly.totalBurden, net: results.ryczalt.yearly.netAmount },
    ];
    if (results.ipBox) {
      options.push({ key: 'ipBox', label: 'IP Box', burden: results.ipBox.yearly.totalBurden, net: results.ipBox.yearly.netAmount });
    }
    return options.reduce((best, curr) => curr.net > best.net ? curr : best);
  };

  const getBestSpzooOption = (results: SpzooComparisonResult) => {
    const options = [
      { key: 'dividend', label: 'Tylko dywidenda', net: results.dividend.yearly.ownerTotalNet },
      { key: 'minSalaryPlusDividend', label: 'Min. pensja + dywidenda', net: results.minSalaryPlusDividend.yearly.ownerTotalNet },
      { key: 'fullSalary', label: 'Pełna pensja', net: results.fullSalary.yearly.ownerTotalNet },
    ];
    return options.reduce((best, curr) => curr.net > best.net ? curr : best);
  };

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Kalkulator ZUS i PIT 2025
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Porównaj JDG i sp. z o.o. - znajdź najlepszą formę dla swojej działalności
        </p>
      </header>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 flex-wrap justify-center">
          {[
            { id: 'jdg', label: 'JDG' },
            { id: 'spzoo', label: 'Sp. z o.o.' },
            { id: 'comparison', label: 'Porównanie' },
            { id: 'b2bVsUop', label: 'B2B vs Etat' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as BusinessForm)}
              className={`px-4 md:px-6 py-2 rounded-lg font-medium transition-all text-sm md:text-base ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Input Form */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 sticky top-8">
            <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
              Twoje dane
            </h2>

            <div className="space-y-5">
              {/* Monthly Revenue with Slider */}
              {activeTab !== 'b2bVsUop' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Miesięczny przychód brutto
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="5000"
                        max="100000"
                        step="1000"
                        value={monthlyRevenue}
                        onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="relative w-28">
                        <input
                          type="number"
                          value={monthlyRevenue}
                          onChange={(e) => setMonthlyRevenue(Number(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm text-right pr-8"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">zł</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>5 000 zł</span>
                      <span>100 000 zł</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Monthly Costs with Slider */}
              {activeTab !== 'b2bVsUop' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Miesięczne koszty operacyjne
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="30000"
                        step="500"
                        value={monthlyCosts}
                        onChange={(e) => setMonthlyCosts(Number(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="relative w-28">
                        <input
                          type="number"
                          value={monthlyCosts}
                          onChange={(e) => setMonthlyCosts(Number(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm text-right pr-8"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">zł</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>0 zł</span>
                      <span>30 000 zł</span>
                    </div>
                  </div>
                </div>
              )}

              {/* B2B vs UoP inputs */}
              {activeTab === 'b2bVsUop' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Twój przychód B2B (faktura)
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="5000"
                          max="100000"
                          step="1000"
                          value={monthlyRevenue}
                          onChange={(e) => setMonthlyRevenue(Number(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-green-600"
                        />
                        <div className="relative w-28">
                          <input
                            type="number"
                            value={monthlyRevenue}
                            onChange={(e) => setMonthlyRevenue(Number(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm text-right pr-8"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">zł</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Porównaj z etatem brutto
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="4666"
                          max="50000"
                          step="500"
                          value={uopGross}
                          onChange={(e) => setUopGross(Number(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <div className="relative w-28">
                          <input
                            type="number"
                            value={uopGross}
                            onChange={(e) => setUopGross(Number(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm text-right pr-8"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">zł</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>4 666 zł (min.)</span>
                        <span>50 000 zł</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* JDG-specific options */}
              {(activeTab === 'jdg' || activeTab === 'comparison') && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Opcje JDG
                    </p>

                    {/* ZUS Type */}
                    <div className="mb-4">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Rodzaj ZUS</label>
                      <select
                        value={zusType}
                        onChange={(e) => setZusType(e.target.value as ZusType)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value="full">Pełny ZUS (~1 774 zł)</option>
                        <option value="preferential">Preferencyjny (~600 zł)</option>
                        <option value="smallPlus">Mały ZUS Plus</option>
                        <option value="startupRelief">Ulga na start</option>
                      </select>
                    </div>

                    {/* Ryczalt Rate */}
                    <div className="mb-4">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Stawka ryczałtu</label>
                      <select
                        value={ryczaltRate}
                        onChange={(e) => setRyczaltRate(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      >
                        <option value={0.17}>17% - Wolne zawody (lekarze, prawnicy)</option>
                        <option value={0.15}>15% - Usługi niematerialne</option>
                        <option value={0.12}>12% - IT, programowanie</option>
                        <option value={0.085}>8,5% - Usługi dla firm, wynajem</option>
                        <option value={0.055}>5,5% - Produkcja, budowlanka</option>
                        <option value={0.03}>3% - Handel, gastronomia</option>
                        <option value={0.02}>2% - Produkty rolne</option>
                      </select>
                    </div>

                    {/* Checkboxes */}
                    <label className="flex items-center gap-2 cursor-pointer mb-2">
                      <input type="checkbox" checked={useIpBox} onChange={(e) => setUseIpBox(e.target.checked)} className="rounded" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">IP Box (5%)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={useCopyrightCosts} onChange={(e) => setUseCopyrightCosts(e.target.checked)} className="rounded" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">50% koszty autorskie</span>
                    </label>
                  </div>
                </>
              )}

              {/* Sp. z o.o.-specific options */}
              {(activeTab === 'spzoo' || activeTab === 'comparison') && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Opcje Sp. z o.o.
                  </p>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Stawka CIT</label>
                    <select
                      value={citRate}
                      onChange={(e) => setCitRate(e.target.value as CitRate)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="small">9% (mały podatnik)</option>
                      <option value="standard">19% (standardowy)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* B2B options */}
              {activeTab === 'b2bVsUop' && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Opcje B2B (JDG)
                  </p>
                  <div className="mb-4">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Rodzaj ZUS</label>
                    <select
                      value={zusType}
                      onChange={(e) => setZusType(e.target.value as ZusType)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value="full">Pełny ZUS (~1 774 zł)</option>
                      <option value="preferential">Preferencyjny (~600 zł)</option>
                      <option value="smallPlus">Mały ZUS Plus</option>
                      <option value="startupRelief">Ulga na start</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Forma opodatkowania</label>
                    <select
                      value={ryczaltRate}
                      onChange={(e) => setRyczaltRate(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                      <option value={0.12}>12% Ryczałt - IT</option>
                      <option value={0.085}>8,5% Ryczałt - Usługi</option>
                      <option value={0.19}>19% Liniowy</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Real-time indicator */}
              <div className="text-center text-xs text-gray-400 pt-2">
                ⚡ Wyniki aktualizują się w czasie rzeczywistym
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="md:col-span-2">
          {/* JDG Results */}
          {activeTab === 'jdg' && jdgResults && (
            <div className="space-y-6">
              <JdgResultsView results={jdgResults} ryczaltRate={ryczaltRate} formatCurrency={formatCurrency} formatPercent={formatPercent} getBestOption={getBestJdgOption} />

              {/* Chart */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  📊 Porównanie przy różnych przychodach
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
            </div>
          )}

          {/* Sp. z o.o. Results */}
          {activeTab === 'spzoo' && spzooResults && (
            <SpzooResultsView results={spzooResults} formatCurrency={formatCurrency} formatPercent={formatPercent} getBestOption={getBestSpzooOption} />
          )}

          {/* Comparison */}
          {activeTab === 'comparison' && jdgResults && spzooResults && (
            <ComparisonView
              jdgResults={jdgResults}
              spzooResults={spzooResults}
              monthlyRevenue={monthlyRevenue}
              monthlyCosts={monthlyCosts}
              citRate={citRate}
              formatCurrency={formatCurrency}
              getBestJdgOption={getBestJdgOption}
              getBestSpzooOption={getBestSpzooOption}
            />
          )}

          {/* B2B vs UoP */}
          {activeTab === 'b2bVsUop' && jdgResults && (
            <B2bVsUopView
              b2bData={b2bVsUopData}
              jdgResults={jdgResults}
              formatCurrency={formatCurrency}
              getBestJdgOption={getBestJdgOption}
            />
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-sm text-gray-500">
        <p>Kalkulator ZUS i PIT 2025 | Dane aktualne na styczeń 2025</p>
        <p className="mt-1 text-xs">Obliczenia mają charakter poglądowy i nie stanowią porady podatkowej.</p>
      </footer>
    </main>
  );
}

// ===========================================
// KOMPONENTY WYNIKÓW
// ===========================================

function JdgResultsView({
  results,
  ryczaltRate,
  formatCurrency,
  formatPercent,
  getBestOption,
}: {
  results: ExtendedJdgResults;
  ryczaltRate: number;
  formatCurrency: (v: number) => string;
  formatPercent: (v: number) => string;
  getBestOption: (r: ExtendedJdgResults) => { key: string; label: string; net: number };
}) {
  const best = getBestOption(results);

  const cards = [
    { key: 'scale', data: results.scale, label: 'Skala podatkowa (12%/32%)' },
    { key: 'linear', data: results.linear, label: 'Podatek liniowy (19%)' },
    ...(results.ipBox ? [{ key: 'ipBox', data: results.ipBox, label: 'IP Box (5%)' }] : []),
    { key: 'ryczalt', data: results.ryczalt, label: `Ryczałt (${(ryczaltRate * 100).toFixed(1)}%)` },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🏆</span>
          <h3 className="text-xl font-bold text-green-800 dark:text-green-200">
            Najlepsza opcja JDG: {best.label}
          </h3>
        </div>
        <p className="text-green-700 dark:text-green-300">
          Rocznie na rękę: <strong>{formatCurrency(best.net)}</strong>
        </p>
      </div>

      <div className="grid gap-4">
        {cards.map(({ key, data, label }) => (
          <ResultCard
            key={key}
            label={label}
            isBest={best.key === key}
            monthly={{
              zusSocial: data.monthly.zusSocial,
              zusHealth: data.monthly.zusHealth,
              tax: data.monthly.taxAdvance,
              total: data.monthly.totalBurden,
              net: data.monthly.netAmount,
            }}
            yearly={{ net: data.yearly.netAmount, burden: data.yearly.totalBurden }}
            effectiveRate={data.effectiveRate}
            formatCurrency={formatCurrency}
            formatPercent={formatPercent}
          />
        ))}
      </div>
    </div>
  );
}

function SpzooResultsView({
  results,
  formatCurrency,
  formatPercent,
  getBestOption,
}: {
  results: SpzooComparisonResult;
  formatCurrency: (v: number) => string;
  formatPercent: (v: number) => string;
  getBestOption: (r: SpzooComparisonResult) => { key: string; label: string; net: number };
}) {
  const best = getBestOption(results);

  const cards = [
    { key: 'dividend', data: results.dividend, label: 'Tylko dywidenda' },
    { key: 'minSalaryPlusDividend', data: results.minSalaryPlusDividend, label: 'Min. pensja + dywidenda' },
    { key: 'fullSalary', data: results.fullSalary, label: 'Pełna pensja' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🏢</span>
          <h3 className="text-xl font-bold text-purple-800 dark:text-purple-200">
            Najlepsza opcja Sp. z o.o.: {best.label}
          </h3>
        </div>
        <p className="text-purple-700 dark:text-purple-300">
          Rocznie na rękę: <strong>{formatCurrency(best.net)}</strong>
        </p>
      </div>

      <div className="grid gap-4">
        {cards.map(({ key, data, label }) => (
          <div
            key={key}
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-2 ${
              best.key === key ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-transparent'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                {label}
                {best.key === key && (
                  <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">
                    Najlepsza
                  </span>
                )}
              </h3>
              <span className="text-sm text-gray-500">
                Efektywna stawka: {formatPercent(data.effectiveRate)}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">CIT</p>
                <p className="font-semibold">{formatCurrency(data.monthly.cit)}/mc</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Podatek dywidenda</p>
                <p className="font-semibold">{formatCurrency(data.monthly.dividendTax)}/mc</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Pensja netto</p>
                <p className="font-semibold">{formatCurrency(data.monthly.ownerNetSalary)}/mc</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Na rękę łącznie</p>
                <p className="font-bold text-green-600 text-lg">{formatCurrency(data.monthly.ownerTotalNet)}/mc</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between text-sm">
              <span className="text-gray-500">Rocznie na rękę:</span>
              <span className="font-bold text-green-600">{formatCurrency(data.yearly.ownerTotalNet)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm">
        <p className="text-amber-800 dark:text-amber-200">
          <strong>Uwaga:</strong> Sp. z o.o. wymaga pełnej księgowości (~800 zł/mc) oraz ma dodatkowe obowiązki formalne.
        </p>
      </div>
    </div>
  );
}

function ComparisonView({
  jdgResults,
  spzooResults,
  monthlyRevenue,
  monthlyCosts,
  citRate,
  formatCurrency,
  getBestJdgOption,
  getBestSpzooOption,
}: {
  jdgResults: ExtendedJdgResults;
  spzooResults: SpzooComparisonResult;
  monthlyRevenue: number;
  monthlyCosts: number;
  citRate: CitRate;
  formatCurrency: (v: number) => string;
  getBestJdgOption: (r: ExtendedJdgResults) => { key: string; label: string; net: number };
  getBestSpzooOption: (r: SpzooComparisonResult) => { key: string; label: string; net: number };
}) {
  const bestJdg = getBestJdgOption(jdgResults);
  const bestSpzoo = getBestSpzooOption(spzooResults);

  const jdgWins = bestJdg.net > bestSpzoo.net;
  const difference = Math.abs(bestJdg.net - bestSpzoo.net);

  // Calculate the threshold at which sp. z o.o. becomes beneficial
  const jdgMonthlyNet = bestJdg.net / 12;
  const threshold = findSpzooThreshold(jdgMonthlyNet, monthlyCosts, citRate);
  const currentIsAboveThreshold = threshold && monthlyRevenue >= threshold;

  return (
    <div className="space-y-6">
      {/* Winner Banner */}
      <div className={`rounded-2xl p-8 text-center ${
        jdgWins
          ? 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-300 dark:border-green-700'
          : 'bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 border border-purple-300 dark:border-purple-700'
      }`}>
        <div className="text-4xl mb-4">{jdgWins ? '👤' : '🏢'}</div>
        <h2 className="text-2xl font-bold mb-2">
          {jdgWins ? 'JDG wygrywa!' : 'Sp. z o.o. wygrywa!'}
        </h2>
        <p className="text-lg opacity-80 mb-4">
          {jdgWins ? bestJdg.label : bestSpzoo.label}
        </p>
        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
          +{formatCurrency(difference)}/rok
        </div>
        <p className="text-sm opacity-70 mt-2">
          więcej na rękę niż {jdgWins ? 'najlepsza opcja sp. z o.o.' : 'najlepsza opcja JDG'}
        </p>
      </div>

      {/* Side by Side Comparison */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-2 ${
          jdgWins ? 'border-green-500' : 'border-transparent'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">👤</span>
            <h3 className="text-lg font-semibold">JDG - {bestJdg.label}</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {formatCurrency(bestJdg.net)}/rok
          </div>
          <p className="text-sm text-gray-500">
            {formatCurrency(bestJdg.net / 12)}/miesiąc
          </p>
        </div>

        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-2 ${
          !jdgWins ? 'border-purple-500' : 'border-transparent'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🏢</span>
            <h3 className="text-lg font-semibold">Sp. z o.o. - {bestSpzoo.label}</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {formatCurrency(bestSpzoo.net)}/rok
          </div>
          <p className="text-sm text-gray-500">
            {formatCurrency(bestSpzoo.net / 12)}/miesiąc
          </p>
        </div>
      </div>

      {/* Threshold Info */}
      {threshold && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-3xl">📊</div>
            <div className="flex-1">
              <h4 className="font-bold text-amber-800 dark:text-amber-200 text-lg mb-2">
                Próg opłacalności sp. z o.o.
              </h4>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                  {formatCurrency(threshold)}
                </span>
                <span className="text-amber-700 dark:text-amber-300">/miesiąc</span>
              </div>
              <p className="text-amber-700 dark:text-amber-300 text-sm mb-3">
                {currentIsAboveThreshold ? (
                  <>
                    Twój przychód ({formatCurrency(monthlyRevenue)}/mc) <strong>przekracza próg</strong> -
                    sp. z o.o. może być dla Ciebie korzystniejsza.
                  </>
                ) : (
                  <>
                    Twój przychód ({formatCurrency(monthlyRevenue)}/mc) jest <strong>poniżej progu</strong> -
                    JDG jest obecnie korzystniejsza. Brakuje Ci <strong>{formatCurrency(threshold - monthlyRevenue)}/mc</strong> do progu.
                  </>
                )}
              </p>
              <div className="w-full bg-amber-200 dark:bg-amber-800 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    currentIsAboveThreshold
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                      : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`}
                  style={{ width: `${Math.min(100, (monthlyRevenue / threshold) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-amber-600 dark:text-amber-400 mt-1">
                <span>0 PLN</span>
                <span>Próg: {formatCurrency(threshold)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">💡 Rekomendacja</h4>
        <p className="text-blue-700 dark:text-blue-300 text-sm">
          {jdgWins ? (
            <>
              Przy Twoich obecnych zarobkach <strong>JDG jest korzystniejsza</strong>.
              {threshold && (
                <> Sp. z o.o. zacznie się opłacać przy przychodzie około <strong>{formatCurrency(threshold)}/mc</strong>.</>
              )}
            </>
          ) : (
            <>
              Przy Twoich zarobkach <strong>sp. z o.o. może być korzystniejsza</strong>.
              Pamiętaj jednak o dodatkowych kosztach (księgowość ~800 zł/mc) i obowiązkach formalnych.
              Skonsultuj decyzję z doradcą podatkowym.
            </>
          )}
        </p>
      </div>

      {/* Pros and Cons */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            👤 JDG - zalety i wady
          </h4>
          <ul className="text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-600 dark:text-gray-300">Prosta księgowość (200-400 zł/mc)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-600 dark:text-gray-300">Brak podwójnego opodatkowania</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-600 dark:text-gray-300">Łatwe wypłaty (Twoje pieniądze)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">✗</span>
              <span className="text-gray-600 dark:text-gray-300">Wysoki ZUS (~1 774 zł/mc)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">✗</span>
              <span className="text-gray-600 dark:text-gray-300">Odpowiedzialność całym majątkiem</span>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            🏢 Sp. z o.o. - zalety i wady
          </h4>
          <ul className="text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-600 dark:text-gray-300">Niski CIT (9% mały podatnik)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-600 dark:text-gray-300">Ograniczona odpowiedzialność</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-600 dark:text-gray-300">Prestiż i wiarygodność</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">✗</span>
              <span className="text-gray-600 dark:text-gray-300">Droga księgowość (~800 zł/mc)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">✗</span>
              <span className="text-gray-600 dark:text-gray-300">Podwójne opodatkowanie (CIT + dywidenda)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ResultCard({
  label,
  isBest,
  monthly,
  yearly,
  effectiveRate,
  formatCurrency,
  formatPercent,
}: {
  label: string;
  isBest: boolean;
  monthly: { zusSocial: number; zusHealth: number; tax: number; total: number; net: number };
  yearly: { net: number; burden: number };
  effectiveRate: number;
  formatCurrency: (v: number) => string;
  formatPercent: (v: number) => string;
}) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-2 ${
      isBest ? 'border-green-500 ring-2 ring-green-500/20' : 'border-transparent'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          {label}
          {isBest && (
            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full">
              Najlepsza
            </span>
          )}
        </h3>
        <span className="text-sm text-gray-500">
          Efektywna stawka: {formatPercent(effectiveRate)}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">ZUS społeczny</p>
          <p className="font-semibold">{formatCurrency(monthly.zusSocial)}/mc</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Zdrowotna</p>
          <p className="font-semibold">{formatCurrency(monthly.zusHealth)}/mc</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Podatek</p>
          <p className="font-semibold">{formatCurrency(monthly.tax)}/mc</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Suma obciążeń</p>
          <p className="font-semibold text-red-600">{formatCurrency(monthly.total)}/mc</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Na rękę</p>
          <p className="font-bold text-green-600 text-lg">{formatCurrency(monthly.net)}/mc</p>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between text-sm">
        <span className="text-gray-500">Rocznie na rękę:</span>
        <span className="font-bold text-green-600">{formatCurrency(yearly.net)}</span>
      </div>
    </div>
  );
}

function B2bVsUopView({
  b2bData,
  jdgResults,
  formatCurrency,
  getBestJdgOption,
}: {
  b2bData: {
    uopGross: number;
    uopNet: number;
    b2bRevenue: number;
    b2bNet: number;
    b2bAtUopGross: number;
    difference: number;
  };
  jdgResults: ExtendedJdgResults;
  formatCurrency: (v: number) => string;
  getBestJdgOption: (r: ExtendedJdgResults) => { key: string; label: string; net: number };
}) {
  const bestB2b = getBestJdgOption(jdgResults);
  const b2bWins = b2bData.b2bNet > b2bData.uopNet;
  const difference = Math.abs(b2bData.b2bNet - b2bData.uopNet);
  const percentDiff = b2bData.uopNet > 0 ? ((b2bData.b2bNet - b2bData.uopNet) / b2bData.uopNet) * 100 : 0;

  // Calculate what UoP gross would give the same net as B2B
  // This is a rough estimate - solving the inverse is complex
  const b2bAdvantageMonthly = b2bData.b2bNet - b2bData.uopNet;

  return (
    <div className="space-y-6">
      {/* Winner Banner */}
      <div className={`rounded-2xl p-8 text-center ${
        b2bWins
          ? 'bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-300 dark:border-green-700'
          : 'bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 border border-purple-300 dark:border-purple-700'
      }`}>
        <div className="text-4xl mb-4">{b2bWins ? '💼' : '👔'}</div>
        <h2 className="text-2xl font-bold mb-2">
          {b2bWins ? 'B2B wygrywa!' : 'Etat wygrywa!'}
        </h2>
        <p className="text-lg opacity-80 mb-4">
          {b2bWins ? `${bestB2b.label}` : 'Umowa o pracę'}
        </p>
        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
          +{formatCurrency(difference)}/miesiąc
        </div>
        <p className="text-sm opacity-70 mt-2">
          ({percentDiff > 0 ? '+' : ''}{percentDiff.toFixed(1)}% {b2bWins ? 'więcej' : 'mniej'} na B2B)
        </p>
      </div>

      {/* Side by Side Comparison */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-2 ${
          b2bWins ? 'border-green-500' : 'border-transparent'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">💼</span>
            <h3 className="text-lg font-semibold">B2B (JDG)</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Faktura:</span>
              <span className="font-semibold">{formatCurrency(b2bData.b2bRevenue)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Forma:</span>
              <span className="font-semibold text-sm">{bestB2b.label}</span>
            </div>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-500">Na rękę:</span>
                <span className="text-2xl font-bold text-green-600">{formatCurrency(b2bData.b2bNet)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-2 ${
          !b2bWins ? 'border-purple-500' : 'border-transparent'
        }`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">👔</span>
            <h3 className="text-lg font-semibold">Etat (UoP)</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Brutto:</span>
              <span className="font-semibold">{formatCurrency(b2bData.uopGross)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Forma:</span>
              <span className="font-semibold text-sm">Umowa o pracę</span>
            </div>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-500">Na rękę:</span>
                <span className="text-2xl font-bold text-purple-600">{formatCurrency(b2bData.uopNet)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Yearly Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📅 Podsumowanie roczne</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <p className="text-sm text-gray-500 mb-1">B2B rocznie</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(b2bData.b2bNet * 12)}</p>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
            <p className="text-sm text-gray-500 mb-1">Etat rocznie</p>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(b2bData.uopNet * 12)}</p>
          </div>
          <div className={`text-center p-4 rounded-xl ${b2bWins ? 'bg-green-100 dark:bg-green-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
            <p className="text-sm text-gray-500 mb-1">Różnica rocznie</p>
            <p className={`text-2xl font-bold ${b2bWins ? 'text-green-600' : 'text-purple-600'}`}>
              {b2bWins ? '+' : '-'}{formatCurrency(difference * 12)}
            </p>
          </div>
        </div>
      </div>

      {/* Pros and Cons */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            💼 B2B - zalety i wady
          </h4>
          <ul className="text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-600 dark:text-gray-300">Wyższe zarobki netto</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-600 dark:text-gray-300">Możliwość odliczania kosztów</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-600 dark:text-gray-300">Elastyczność i niezależność</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">✗</span>
              <span className="text-gray-600 dark:text-gray-300">Brak płatnego urlopu i L4</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">✗</span>
              <span className="text-gray-600 dark:text-gray-300">Samodzielne rozliczenia i księgowość</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">✗</span>
              <span className="text-gray-600 dark:text-gray-300">Brak stabilności zatrudnienia</span>
            </li>
          </ul>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            👔 Etat - zalety i wady
          </h4>
          <ul className="text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-600 dark:text-gray-300">Płatny urlop (26 dni)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-600 dark:text-gray-300">Płatne L4 (80-100%)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-gray-600 dark:text-gray-300">Stabilność i ochrona prawna</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">✗</span>
              <span className="text-gray-600 dark:text-gray-300">Niższe zarobki netto</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">✗</span>
              <span className="text-gray-600 dark:text-gray-300">Brak możliwości odliczeń</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-500">✗</span>
              <span className="text-gray-600 dark:text-gray-300">Mniejsza elastyczność</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Recommendation */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">💡 Rekomendacja</h4>
        <p className="text-blue-700 dark:text-blue-300 text-sm">
          {b2bWins ? (
            <>
              Przy podanych kwotach <strong>B2B daje Ci {formatCurrency(difference)} więcej miesięcznie</strong>.
              Pamiętaj jednak, że na etacie masz płatny urlop (wart ~{formatCurrency(b2bData.uopNet * 26 / 250)} rocznie)
              i płatne L4. Jeśli cenisz stabilność, etat może być lepszym wyborem mimo niższych zarobków.
            </>
          ) : (
            <>
              Przy podanych kwotach <strong>etat daje Ci {formatCurrency(difference)} więcej miesięcznie</strong>.
              B2B zaczyna się opłacać zazwyczaj gdy stawka B2B jest wyższa o ~20-30% od brutto na etacie,
              co rekompensuje brak benefitów pracowniczych.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
