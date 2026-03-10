'use client';

import { useState, useMemo, Suspense, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { compareAllForms, calculateLinear, type ComparisonResult } from '@/lib/calculations';
import { compareSpzooScenarios, findSpzooThreshold, type SpzooComparisonResult } from '@/lib/calculations-spzoo';
import { RYCZALT_RATES, type ZusType, type YearlyResult, type CitRate } from '@/lib/constants';

const RevenueChart = dynamic(() => import('./RevenueChart'), {
  ssr: false,
  loading: () => <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 h-96 animate-pulse rounded-2xl" />,
});

type BusinessForm = 'jdg' | 'spzoo' | 'comparison' | 'b2bVsUop';

interface ExtendedJdgResults extends ComparisonResult {
  ipBox?: YearlyResult;
}

const TAB_ROUTES: Record<BusinessForm, string> = {
  jdg: '/',
  spzoo: '/kalkulator-spzoo',
  comparison: '/porownanie',
  b2bVsUop: '/b2b-vs-etat',
};

const ROUTE_TABS: Record<string, BusinessForm> = {
  '/': 'jdg',
  '/kalkulator-spzoo': 'spzoo',
  '/porownanie': 'comparison',
  '/b2b-vs-etat': 'b2bVsUop',
};

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

type RateMode = 'monthly' | 'hourly' | 'daily' | 'yearly';

function toMonthlyRevenue(raw: number, mode: RateMode, hoursPerDay: number, daysPerMonth: number): number {
  switch (mode) {
    case 'hourly': return raw * hoursPerDay * daysPerMonth;
    case 'daily': return raw * daysPerMonth;
    case 'yearly': return raw / 12;
    default: return raw;
  }
}

function fromMonthlyRevenue(monthly: number, mode: RateMode, hoursPerDay: number, daysPerMonth: number): number {
  switch (mode) {
    case 'hourly': return hoursPerDay * daysPerMonth > 0 ? monthly / (hoursPerDay * daysPerMonth) : 0;
    case 'daily': return daysPerMonth > 0 ? monthly / daysPerMonth : 0;
    case 'yearly': return monthly * 12;
    default: return monthly;
  }
}

function CalculatorInner({ pageIntro }: { pageIntro?: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = ROUTE_TABS[pathname] ?? 'jdg';

  // Shared state
  const [monthlyRevenue, setMonthlyRevenue] = useState<number>(() => {
    const rev = searchParams.get('rev');
    return rev && !isNaN(Number(rev)) ? Math.max(0, Number(rev)) : 15000;
  });
  const [monthlyCosts, setMonthlyCosts] = useState<number>(() => {
    const costs = searchParams.get('costs');
    return costs && !isNaN(Number(costs)) ? Math.max(0, Number(costs)) : 3000;
  });

  // JDG state
  const [zusType, setZusType] = useState<ZusType>('full');
  const [ryczaltRate, setRyczaltRate] = useState<number>(0.12);
  const [useIpBox, setUseIpBox] = useState<boolean>(false);
  const [useCopyrightCosts, setUseCopyrightCosts] = useState<boolean>(false);

  // Sp. z o.o. state
  const [citRate, setCitRate] = useState<CitRate>('small');

  // B2B vs UoP state
  const [uopGross, setUopGross] = useState<number>(15000);
  const [vacationDays, setVacationDays] = useState<number>(26);
  const [b2bTaxForm, setB2bTaxForm] = useState<'ryczalt' | 'linear'>('ryczalt');

  // Rate mode state
  const [rateMode, setRateMode] = useState<RateMode>('monthly');
  const [hoursPerDay, setHoursPerDay] = useState<number>(8);
  const [workingDaysPerMonth, setWorkingDaysPerMonth] = useState<number>(21);

  // Currency state
  const [exchangeRates, setExchangeRates] = useState<{ EUR: number; USD: number; GBP: number } | null>(null);
  const [showCurrency, setShowCurrency] = useState<boolean>(false);

  // VAT state
  const [isVatPayer, setIsVatPayer] = useState<boolean>(false);

  useEffect(() => {
    fetch('https://api.frankfurter.app/latest?from=PLN&to=EUR,USD,GBP')
      .then((r) => r.json())
      .then((data) => {
        if (data?.rates) setExchangeRates(data.rates);
      })
      .catch(() => {}); // silently fail
  }, []);

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

    // Koszt pracodawcy = brutto + ZUS pracodawcy (~20.48%)
    const employerZusRate = 0.0976 + 0.065 + 0.0167 + 0.0245 + 0.001; // ~20.48%
    const uopEmployerCost = Math.round(uopGross * (1 + employerZusRate));

    // Calculate B2B net based on selected tax form
    const b2bResults = jdgResults;
    const bestB2bNet = b2bResults
      ? b2bTaxForm === 'linear'
        ? (useIpBox && b2bResults.ipBox
            ? b2bResults.ipBox.monthly.netAmount
            : b2bResults.linear.monthly.netAmount)
        : b2bResults.ryczalt.monthly.netAmount
      : 0;

    // Calculate B2B at same "gross" level for comparison
    const b2bAtUopGross = compareAllForms({
      monthlyRevenue: uopGross,
      monthlyCosts: 0,
      zusType,
      ryczaltRate,
      paysSickness: true,
      useCopyrightCosts,
    });

    // Vacation value
    const vacationValueMonthly = (uopGross / 21) * vacationDays / 12;
    const uopNetWithVacation = uopNet + vacationValueMonthly;

    return {
      uopGross,
      uopNet,
      uopEmployerCost,
      b2bRevenue: monthlyRevenue,
      b2bNet: bestB2bNet,
      b2bAtUopGross: b2bAtUopGross[b2bAtUopGross.best].monthly.netAmount,
      difference: bestB2bNet - uopNetWithVacation,
      vacationDays,
      vacationValueYearly: Math.round((uopGross / 21) * vacationDays),
      uopNetWithVacation: Math.round(uopNetWithVacation),
    };
  }, [uopGross, monthlyRevenue, jdgResults, zusType, ryczaltRate, useCopyrightCosts, vacationDays, b2bTaxForm, useIpBox]);

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

  const handleTabClick = (tabId: BusinessForm) => {
    const params = new URLSearchParams();
    if (monthlyRevenue !== 15000) params.set('rev', String(monthlyRevenue));
    if (monthlyCosts !== 3000) params.set('costs', String(monthlyCosts));
    const qs = params.toString();
    router.push(`${TAB_ROUTES[tabId]}${qs ? '?' + qs : ''}`);
  };

  return (
    <>
      {/* Animated Background */}
      <div className="animated-bg" />
      <div className="floating-orb orb-1" />
      <div className="floating-orb orb-2" />
      <div className="floating-orb orb-3" />

      <main className="container mx-auto px-4 py-8 max-w-6xl relative">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full glass text-sm text-gray-300">
            Aktualne stawki na 2026 rok
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">Ile zostanie Ci na rękę?</span>
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-3">
            Kalkulator ZUS i PIT 2026 — sprawdź, która forma działalności jest dla Ciebie najlepsza
          </p>
          <p className="text-sm text-gray-500 max-w-xl mx-auto">
            Porównaj JDG, sp.&nbsp;z&nbsp;o.o. i B2B vs etat. Skala, liniowy czy ryczałt? Oblicz w&nbsp;kilka sekund.
          </p>
        </header>

        {pageIntro && (
          <div className="mb-8">
            {pageIntro}
          </div>
        )}

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-2xl glass p-1.5 flex-wrap justify-center gap-1">
            {[
              { id: 'jdg', label: 'JDG', icon: '👤' },
              { id: 'spzoo', label: 'Sp. z o.o.', icon: '🏢' },
              { id: 'comparison', label: 'Porównanie', icon: '⚖️' },
              { id: 'b2bVsUop', label: 'B2B vs Etat', icon: '💼' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id as BusinessForm)}
                className={`px-4 md:px-5 py-2.5 rounded-xl font-medium transition-all text-sm md:text-base flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'tab-active text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="hidden md:inline">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Input Form */}
          <div className="md:col-span-1">
            <div className="glass-card rounded-2xl p-6 sticky top-8">
              <h2 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
                <span className="text-2xl">⚙️</span> Twoje dane
              </h2>

            <div className="space-y-5">
              {/* Monthly Revenue with Slider */}
              {activeTab !== 'b2bVsUop' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Przychód
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    {isVatPayer ? 'Kwota netto z faktury (VAT fakturujesz klientowi osobno)' : 'Kwota netto z faktury (bez VAT)'}
                  </p>
                  {/* Mode toggle */}
                  <div className="flex rounded-lg overflow-hidden border border-white/10 mb-3 text-xs">
                    {(['hourly', 'daily', 'monthly', 'yearly'] as RateMode[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => setRateMode(m)}
                        className={`flex-1 py-1.5 transition-all ${rateMode === m ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                      >
                        {m === 'hourly' ? '/h' : m === 'daily' ? '/dzień' : m === 'monthly' ? '/mc' : '/rok'}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <input
                      type="number"
                      value={Math.round(fromMonthlyRevenue(monthlyRevenue, rateMode, hoursPerDay, workingDaysPerMonth))}
                      onChange={(e) => setMonthlyRevenue(toMonthlyRevenue(Number(e.target.value) || 0, rateMode, hoursPerDay, workingDaysPerMonth))}
                      className="flex-1 px-3 py-2 rounded-lg text-white text-sm"
                      min={0}
                    />
                    <span className="text-gray-400 text-xs w-16 text-right">
                      {rateMode === 'hourly' ? 'zł/h' : rateMode === 'daily' ? 'zł/dzień' : rateMode === 'yearly' ? 'zł/rok' : 'zł/mc'}
                    </span>
                  </div>
                  {/* Show derived monthly when not in monthly mode */}
                  {rateMode !== 'monthly' && (
                    <p className="text-xs text-gray-500 mb-2">= {monthlyRevenue.toLocaleString('pl-PL')} zł/mc</p>
                  )}
                  {/* Hours/days inputs for hourly mode */}
                  {rateMode === 'hourly' && (
                    <div className="flex gap-2 mt-2">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">h/dzień</label>
                        <input type="number" value={hoursPerDay} onChange={(e) => setHoursPerDay(Number(e.target.value) || 8)} className="w-full px-2 py-1.5 rounded-lg text-white text-sm" min={1} max={24} />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-1">dni/mc</label>
                        <input type="number" value={workingDaysPerMonth} onChange={(e) => setWorkingDaysPerMonth(Number(e.target.value) || 21)} className="w-full px-2 py-1.5 rounded-lg text-white text-sm" min={1} max={31} />
                      </div>
                    </div>
                  )}
                  {rateMode === 'daily' && (
                    <div className="mt-2">
                      <label className="block text-xs text-gray-500 mb-1">dni roboczych/mc</label>
                      <input type="number" value={workingDaysPerMonth} onChange={(e) => setWorkingDaysPerMonth(Number(e.target.value) || 21)} className="w-full px-2 py-1.5 rounded-lg text-white text-sm" min={1} max={31} />
                    </div>
                  )}
                </div>
              )}

              {/* Monthly Costs with Slider */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Miesięczne koszty operacyjne
                </label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="30000"
                        step="500"
                        value={monthlyCosts}
                        onChange={(e) => setMonthlyCosts(Number(e.target.value))}
                        className="flex-1"
                      />
                      <div className="relative w-28">
                        <input
                          type="number"
                          value={monthlyCosts}
                          onChange={(e) => setMonthlyCosts(Number(e.target.value) || 0)}
                          className="w-full px-2 py-2 rounded-lg text-white text-sm text-right pr-8"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">zł</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>0 zł</span>
                      <span>30 000 zł</span>
                    </div>
                  </div>
                </div>

              {/* B2B vs UoP inputs */}
              {activeTab === 'b2bVsUop' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      💼 Twój przychód B2B (faktura)
                    </label>
                    <p className="text-xs text-gray-500 mb-2">Kwota netto z faktury (VAT fakturujesz osobno)</p>
                    {/* Mode toggle */}
                    <div className="flex rounded-lg overflow-hidden border border-white/10 mb-3 text-xs">
                      {(['hourly', 'daily', 'monthly', 'yearly'] as RateMode[]).map((m) => (
                        <button
                          key={m}
                          onClick={() => setRateMode(m)}
                          className={`flex-1 py-1.5 transition-all ${rateMode === m ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                          {m === 'hourly' ? '/h' : m === 'daily' ? '/dzień' : m === 'monthly' ? '/mc' : '/rok'}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <input
                        type="number"
                        value={Math.round(fromMonthlyRevenue(monthlyRevenue, rateMode, hoursPerDay, workingDaysPerMonth))}
                        onChange={(e) => setMonthlyRevenue(toMonthlyRevenue(Number(e.target.value) || 0, rateMode, hoursPerDay, workingDaysPerMonth))}
                        className="flex-1 px-3 py-2 rounded-lg text-white text-sm"
                        min={0}
                      />
                      <span className="text-gray-400 text-xs w-16 text-right">
                        {rateMode === 'hourly' ? 'zł/h' : rateMode === 'daily' ? 'zł/dzień' : rateMode === 'yearly' ? 'zł/rok' : 'zł/mc'}
                      </span>
                    </div>
                    {rateMode !== 'monthly' && (
                      <p className="text-xs text-gray-500 mb-2">= {monthlyRevenue.toLocaleString('pl-PL')} zł/mc</p>
                    )}
                    {rateMode === 'hourly' && (
                      <div className="flex gap-2 mt-2">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">h/dzień</label>
                          <input type="number" value={hoursPerDay} onChange={(e) => setHoursPerDay(Number(e.target.value) || 8)} className="w-full px-2 py-1.5 rounded-lg text-white text-sm" min={1} max={24} />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">dni/mc</label>
                          <input type="number" value={workingDaysPerMonth} onChange={(e) => setWorkingDaysPerMonth(Number(e.target.value) || 21)} className="w-full px-2 py-1.5 rounded-lg text-white text-sm" min={1} max={31} />
                        </div>
                      </div>
                    )}
                    {rateMode === 'daily' && (
                      <div className="mt-2">
                        <label className="block text-xs text-gray-500 mb-1">dni roboczych/mc</label>
                        <input type="number" value={workingDaysPerMonth} onChange={(e) => setWorkingDaysPerMonth(Number(e.target.value) || 21)} className="w-full px-2 py-1.5 rounded-lg text-white text-sm" min={1} max={31} />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      👔 Porównaj z etatem brutto
                    </label>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="4806"
                          max="50000"
                          step="500"
                          value={uopGross}
                          onChange={(e) => setUopGross(Number(e.target.value))}
                          className="flex-1 slider-purple"
                        />
                        <div className="relative w-28">
                          <input
                            type="number"
                            value={uopGross}
                            onChange={(e) => setUopGross(Number(e.target.value) || 0)}
                            className="w-full px-2 py-2 rounded-lg text-white text-sm text-right pr-8"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">zł</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>4 806 zł (min.)</span>
                        <span>50 000 zł</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* JDG-specific options */}
              {(activeTab === 'jdg' || activeTab === 'comparison') && (
                <>
                  <div className="border-t border-white/10 pt-4">
                    <p className="text-sm font-medium text-gray-300 mb-3">
                      Opcje JDG
                    </p>

                    {/* ZUS Type */}
                    <div className="mb-4">
                      <label className="block text-xs text-gray-500 mb-1.5">Rodzaj ZUS</label>
                      <select
                        value={zusType}
                        onChange={(e) => setZusType(e.target.value as ZusType)}
                        className="w-full px-3 py-2.5 rounded-lg text-white text-sm"
                      >
                        <option value="full">Pełny ZUS (~1 927 zł)</option>
                        <option value="preferential">Preferencyjny (~456 zł)</option>
                        <option value="smallPlus">Mały ZUS Plus</option>
                        <option value="startupRelief">Ulga na start</option>
                      </select>
                    </div>

                    {/* Ryczalt Rate */}
                    <div className="mb-4">
                      <label className="block text-xs text-gray-500 mb-1.5">Stawka ryczałtu</label>
                      <select
                        value={ryczaltRate}
                        onChange={(e) => setRyczaltRate(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-lg text-white text-sm"
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
                    <label className="flex items-center gap-3 cursor-pointer mb-3 group">
                      <input type="checkbox" checked={useIpBox} onChange={(e) => setUseIpBox(e.target.checked)} />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">IP Box (5%)</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" checked={useCopyrightCosts} onChange={(e) => setUseCopyrightCosts(e.target.checked)} />
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">50% koszty autorskie</span>
                    </label>
                    <div className="border-t border-white/10 pt-3 mt-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={isVatPayer} onChange={(e) => setIsVatPayer(e.target.checked)} />
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">Płatnik VAT (23%)</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Sp. z o.o.-specific options */}
              {(activeTab === 'spzoo' || activeTab === 'comparison') && (
                <div className="border-t border-white/10 pt-4">
                  <p className="text-sm font-medium text-gray-300 mb-3">
                    Opcje Sp. z o.o.
                  </p>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Stawka CIT</label>
                    <select
                      value={citRate}
                      onChange={(e) => setCitRate(e.target.value as CitRate)}
                      className="w-full px-3 py-2.5 rounded-lg text-white text-sm"
                    >
                      <option value="small">9% (mały podatnik)</option>
                      <option value="standard">19% (standardowy)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* B2B options */}
              {activeTab === 'b2bVsUop' && (
                <div className="border-t border-white/10 pt-4">
                  <p className="text-sm font-medium text-gray-300 mb-3">
                    Opcje B2B (JDG)
                  </p>
                  <div className="mb-4">
                    <label className="block text-xs text-gray-500 mb-1.5">Rodzaj ZUS</label>
                    <select
                      value={zusType}
                      onChange={(e) => setZusType(e.target.value as ZusType)}
                      className="w-full px-3 py-2.5 rounded-lg text-white text-sm"
                    >
                      <option value="full">Pełny ZUS (~1 927 zł)</option>
                      <option value="preferential">Preferencyjny (~456 zł)</option>
                      <option value="smallPlus">Mały ZUS Plus</option>
                      <option value="startupRelief">Ulga na start</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs text-gray-500 mb-1.5">Forma opodatkowania B2B</label>
                    <select
                      value={b2bTaxForm}
                      onChange={(e) => setB2bTaxForm(e.target.value as 'ryczalt' | 'linear')}
                      className="w-full px-3 py-2.5 rounded-lg text-white text-sm"
                    >
                      <option value="ryczalt">Ryczałt</option>
                      <option value="linear">Podatek liniowy 19%</option>
                    </select>
                  </div>
                  {b2bTaxForm === 'ryczalt' && (
                    <div className="mb-4">
                      <label className="block text-xs text-gray-500 mb-1.5">Stawka ryczałtu</label>
                      <select
                        value={ryczaltRate}
                        onChange={(e) => setRyczaltRate(Number(e.target.value))}
                        className="w-full px-3 py-2.5 rounded-lg text-white text-sm"
                      >
                        <option value={0.12}>12% — IT, programowanie</option>
                        <option value={0.085}>8,5% — Usługi dla firm</option>
                        <option value={0.15}>15% — Usługi niematerialne</option>
                        <option value={0.17}>17% — Wolne zawody</option>
                      </select>
                    </div>
                  )}
                  <div className="mt-4">
                    <label className="block text-xs text-gray-500 mb-1.5">Dni urlopu na etacie</label>
                    <input
                      type="number"
                      value={vacationDays}
                      onChange={(e) => setVacationDays(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-2 rounded-lg text-white text-sm"
                      min={0}
                      max={60}
                    />
                    <p className="text-xs text-gray-500 mt-1">Standard: 26 dni</p>
                  </div>
                </div>
              )}

              {/* Real-time indicator */}
              <div className="text-center text-xs text-gray-500 pt-4 flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Wyniki na żywo
              </div>
              {exchangeRates && (
                <button
                  onClick={() => setShowCurrency(!showCurrency)}
                  className={`w-full mt-2 py-2 rounded-lg text-xs font-medium transition-all border ${showCurrency ? 'border-blue-500/50 text-blue-400 bg-blue-500/10' : 'border-white/10 text-gray-400 hover:text-white'}`}
                >
                  {showCurrency ? '✓ Pokaż w PLN / EUR / USD' : '🌍 Pokaż w EUR / USD / GBP'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="md:col-span-2">
          {/* JDG Results */}
          {activeTab === 'jdg' && jdgResults && (
            <div className="space-y-6">
              {isVatPayer && (
                <div className="glass rounded-xl p-4 mb-4 text-sm">
                  <p className="text-gray-300 font-medium mb-2">🧾 Faktura z VAT (23%)</p>
                  <div className="flex justify-between text-gray-400">
                    <span>Faktura netto (Twój przychód):</span>
                    <span className="text-white">{formatCurrency(monthlyRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>VAT (23%):</span>
                    <span className="text-amber-400">+{formatCurrency(monthlyRevenue * 0.23)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 border-t border-white/10 pt-2 mt-2">
                    <span>Faktura brutto (klient płaci):</span>
                    <span className="text-white font-semibold">{formatCurrency(monthlyRevenue * 1.23)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">VAT przekazujesz do US co miesiąc lub kwartał. Nie wpływa na obliczenia PIT/ZUS.</p>
                </div>
              )}
              <JdgResultsView results={jdgResults} ryczaltRate={ryczaltRate} formatCurrency={formatCurrency} formatPercent={formatPercent} getBestOption={getBestJdgOption} exchangeRates={exchangeRates} showCurrency={showCurrency} />

              {/* Chart */}
              <RevenueChart chartData={chartData} formatCurrency={formatCurrency} />
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
              exchangeRates={exchangeRates}
              showCurrency={showCurrency}
              b2bTaxForm={b2bTaxForm}
            />
          )}
        </div>
      </div>

        {/* FAQ Section */}
        <section className="mt-16" id="faq">
          <h2 className="text-2xl font-bold text-center mb-8">
            <span className="gradient-text">Najczęściej zadawane pytania</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {faqData.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </section>

        {/* SEO Content Section */}
        <section className="mt-16 glass rounded-2xl p-8" id="poradnik">
          <h2 className="text-xl font-bold text-white mb-6">Ile zostanie na rękę? Poradnik 2026</h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-300">
            <article>
              <h3 className="font-semibold text-white mb-2">📊 Skala podatkowa</h3>
              <p>Najlepsza dla osób z niższymi dochodami (do ~10 tys. zł/mc). Stawki 12% i 32%, kwota wolna 30 000 zł rocznie. Możliwość rozliczenia z małżonkiem.</p>
            </article>
            <article>
              <h3 className="font-semibold text-white mb-2">📈 Podatek liniowy 19%</h3>
              <p>Opłaca się przy dochodach powyżej ~12 tys. zł/mc. Stała stawka bez progów. Brak kwoty wolnej i rozliczenia z małżonkiem.</p>
            </article>
            <article>
              <h3 className="font-semibold text-white mb-2">💰 Ryczałt</h3>
              <p>Najczęściej najkorzystniejszy dla IT (12%) i usług (8,5%). Podatek od przychodu, nie dochodu - nie odliczysz kosztów. Najniższa składka zdrowotna.</p>
            </article>
          </div>
          <div className="mt-6 pt-6 border-t border-white/10 grid md:grid-cols-2 gap-6 text-sm text-gray-300">
            <article>
              <h3 className="font-semibold text-white mb-2">🏢 Sp. z o.o. - kiedy się opłaca?</h3>
              <p>Przy wysokich przychodach i planach na rozwój. CIT 9% dla małych podatników + 19% dywidenda. Uwaga: jednoosobowy wspólnik musi płacić ZUS (~2 359 zł/mc). Wymaga pełnej księgowości (~800 zł/mc).</p>
            </article>
            <article>
              <h3 className="font-semibold text-white mb-2">💼 B2B vs etat</h3>
              <p>B2B opłaca się gdy stawka jest wyższa o ~20-30% od brutto na etacie. Pamiętaj o braku urlopu, L4 i stabilności zatrudnienia na B2B.</p>
            </article>
          </div>
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-sm font-semibold text-white mb-3">Sprawdź też nasze kalkulatory:</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">→ Kalkulator JDG (skala, liniowy, ryczałt)</Link>
              <Link href="/kalkulator-spzoo" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">→ Kalkulator Sp. z o.o.</Link>
              <Link href="/porownanie" className="text-sm text-amber-400 hover:text-amber-300 transition-colors">→ Porównanie JDG vs Sp. z o.o.</Link>
              <Link href="/b2b-vs-etat" className="text-sm text-green-400 hover:text-green-300 transition-colors">→ Kalkulator B2B vs Etat</Link>
            </div>
          </div>
        </section>

        {/* Support Section */}
        <section className="mt-16 glass rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-3">Podoba Ci się kalkulator?</h2>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            Jeśli ten darmowy kalkulator pomógł Ci w podjęciu decyzji, rozważ wsparcie jego rozwoju.
          </p>
          <a
            href="https://suppi.pl/simonlaskowski"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-400 hover:to-orange-400 transition-all hover:scale-105 shadow-lg hover:shadow-orange-500/25"
          >
            <span className="text-xl">☕</span>
            Postaw mi kawę
          </a>
        </section>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Author info */}
            <div className="flex items-center gap-4">
              <div className="text-left">
                <p className="text-gray-400 text-sm">Stworzone przez</p>
                <p className="text-white font-medium">Szymon Laskowski</p>
              </div>
              <div className="flex gap-3">
                <a
                  href="https://github.com/SimonLaskowsky"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                  aria-label="GitHub"
                >
                  <svg className="w-5 h-5 text-gray-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                </a>
                <a
                  href="https://www.linkedin.com/in/szymon-laskowski-5b866920a/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5 text-gray-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Center info */}
            <div className="text-center">
              <p className="text-gray-400 text-sm font-medium">ilezostanie.com</p>
              <p className="text-xs text-gray-500">Obliczenia mają charakter poglądowy i nie stanowią porady podatkowej.</p>
            </div>

            {/* Navigation */}
            <nav className="flex flex-wrap gap-4 text-sm text-gray-500">
              <Link href="/" className="hover:text-white transition-colors">Kalkulator JDG</Link>
              <Link href="/kalkulator-spzoo" className="hover:text-white transition-colors">Sp. z o.o.</Link>
              <Link href="/porownanie" className="hover:text-white transition-colors">JDG vs Sp. z o.o.</Link>
              <Link href="/b2b-vs-etat" className="hover:text-white transition-colors">B2B vs Etat</Link>
              <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            </nav>
          </div>
        </footer>

        {/* FAQ Schema JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqData.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: faq.answer,
                },
              })),
            }),
          }}
        />
      </main>
    </>
  );
}

// FAQ Data
const faqData = [
  {
    question: 'Ryczałt czy skala podatkowa - co się bardziej opłaca?',
    answer: 'Zależy od wysokości dochodów i kosztów. Ryczałt (12% dla IT) jest najczęściej korzystniejszy dla programistów i freelancerów z niskimi kosztami. Skala podatkowa opłaca się przy niższych dochodach (do ~10 tys. zł/mc) lub wysokich kosztach uzyskania przychodu. Użyj naszego kalkulatora, aby porównać obie opcje dla Twojej sytuacji.',
  },
  {
    question: 'Ile wynosi ZUS dla JDG w 2026 roku?',
    answer: 'Pełny ZUS społeczny w 2026 roku wynosi około 1 927 zł miesięcznie (bez zdrowotnej). Składka zdrowotna jest osobno. Preferencyjny ZUS (pierwsze 24 miesiące) to około 456 zł (społeczne). Mały ZUS Plus zależy od przychodów. Ulga na start (pierwsze 6 miesięcy) zwalnia ze składek społecznych – płacisz tylko zdrowotną.',
  },
  {
    question: 'Kiedy opłaca się założyć sp. z o.o. zamiast JDG?',
    answer: 'Sp. z o.o. zaczyna się opłacać przy wysokich przychodach — użyj zakładki "Porównanie" aby sprawdzić próg dla Twojej sytuacji. Główne zalety to CIT 9% (mały podatnik), ograniczona odpowiedzialność i prestiż. Wady to podwójne opodatkowanie (CIT + dywidenda), obowiązkowy ZUS wspólnika (~2 359 zł/mc w jednoosobowej spółce), droga księgowość (~800 zł/mc) i więcej formalności.',
  },
  {
    question: 'B2B czy umowa o pracę - co wybrać?',
    answer: 'B2B daje wyższe zarobki netto, ale brak płatnego urlopu, L4 i stabilności. Opłaca się gdy stawka B2B jest wyższa o ~20–30% od brutto na etacie. Na etacie masz 26 dni urlopu (warte ~10% rocznej pensji) i pełne ubezpieczenie chorobowe.',
  },
  {
    question: 'Co to jest IP Box i dla kogo?',
    answer: 'IP Box to preferencyjna stawka 5% podatku dla dochodów z kwalifikowanych praw własności intelektualnej (programy komputerowe, patenty). Wymaga prowadzenia ewidencji i dokumentacji. Opłaca się dla programistów tworzących własne oprogramowanie lub pracujących nad innowacyjnymi projektami.',
  },
  {
    question: 'Jak działa ulga na start dla nowych firm?',
    answer: 'Ulga na start zwalnia z opłacania składek społecznych ZUS przez pierwsze 6 miesięcy działalności. Płacisz tylko składkę zdrowotną (min. ~433 zł). Po 6 miesiącach możesz przejść na preferencyjny ZUS (kolejne 24 miesiące ze zniżką).',
  },
  {
    question: 'Jaka stawka ryczałtu dla programisty?',
    answer: 'Programiści najczęściej płacą ryczałt 12% od przychodu. Ta stawka obejmuje usługi IT, programowanie, doradztwo techniczne. Niektóre usługi mogą kwalifikować się do 8,5% (np. usługi dla firm). Sprawdź klasyfikację PKWiU swojej działalności.',
  },
  {
    question: 'Ile wynosi składka zdrowotna w 2026?',
    answer: 'Składka zdrowotna zależy od formy opodatkowania: Skala podatkowa – 9% dochodu (min. ~433 zł). Podatek liniowy – 4,9% dochodu (min. ~433 zł). Ryczałt – stała kwota zależna od przychodu: do 60 tys. zł/rok (~498 zł/mc), 60–300 tys. zł (~831 zł/mc), powyżej 300 tys. zł (~1495 zł/mc).',
  },
];

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="glass-card rounded-xl p-4 group cursor-pointer h-fit">
      <summary className="font-semibold text-white flex items-center justify-between list-none">
        <span className="pr-4">{question}</span>
        <span className="text-gray-500 group-open:rotate-180 transition-transform">↓</span>
      </summary>
      <p className="mt-3 text-gray-400 text-sm leading-relaxed">{answer}</p>
    </details>
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
  exchangeRates,
  showCurrency,
}: {
  results: ExtendedJdgResults;
  ryczaltRate: number;
  formatCurrency: (v: number) => string;
  formatPercent: (v: number) => string;
  getBestOption: (r: ExtendedJdgResults) => { key: string; label: string; net: number };
  exchangeRates?: { EUR: number; USD: number; GBP: number } | null;
  showCurrency?: boolean;
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
      <div className="glass glow-green rounded-2xl p-6 winner-pulse">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🏆</span>
          <h3 className="text-xl font-bold text-white">
            Najlepsza opcja JDG: <span className="text-green-400">{best.label}</span>
          </h3>
        </div>
        <p className="text-gray-300">
          Rocznie na rękę: <strong className="text-2xl text-green-400">{formatCurrency(best.net)}</strong>
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
            exchangeRates={exchangeRates}
            showCurrency={showCurrency}
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
      <div className="glass glow-purple rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🏢</span>
          <h3 className="text-xl font-bold text-white">
            Najlepsza opcja Sp. z o.o.: <span className="text-purple-400">{best.label}</span>
          </h3>
        </div>
        <p className="text-gray-300">
          Rocznie na rękę: <strong className="text-2xl text-purple-400">{formatCurrency(best.net)}</strong>
        </p>
      </div>

      <div className="grid gap-4">
        {cards.map(({ key, data, label }) => (
          <div
            key={key}
            className={`glass-card rounded-2xl p-6 ${
              best.key === key ? 'glow-purple border-purple-500/50' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4 gap-2">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                {label}
                {best.key === key && (
                  <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full border border-purple-500/30">
                    Najlepsza
                  </span>
                )}
              </h3>
              <span className="text-sm text-gray-500">
                Efektywna stawka: {formatPercent(data.effectiveRate)}
              </span>
            </div>

            <div className={`grid grid-cols-2 ${data.monthly.ownerMandatoryZus > 0 ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-4 mb-4`}>
              <div>
                <p className="text-xs text-gray-500 mb-1">CIT</p>
                <p className="font-semibold text-white">{formatCurrency(data.monthly.cit)}/mc</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Podatek dywidenda</p>
                <p className="font-semibold text-white">{formatCurrency(data.monthly.dividendTax)}/mc</p>
              </div>
              {data.monthly.ownerMandatoryZus > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">ZUS wspólnika</p>
                  <p className="font-semibold text-red-400">{formatCurrency(data.monthly.ownerMandatoryZus)}/mc</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 mb-1">Pensja netto</p>
                <p className="font-semibold text-white">{formatCurrency(data.monthly.ownerNetSalary)}/mc</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Na rękę łącznie</p>
                <p className="font-bold text-green-400 text-lg">{formatCurrency(data.monthly.ownerTotalNet)}/mc</p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between text-sm">
              <span className="text-gray-500">Rocznie na rękę:</span>
              <span className="font-bold text-green-400">{formatCurrency(data.yearly.ownerTotalNet)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="glass glow-orange rounded-xl p-4 text-sm space-y-2">
        <p className="text-amber-300">
          <strong>⚠️ Uwaga:</strong> Jednoosobowy wspólnik sp. z o.o. musi opłacać obowiązkowy ZUS (~2 359 zł/mc: składki społeczne + zdrowotna) niezależnie od formy wypłaty. Uwzględniono w obliczeniach.
        </p>
        <p className="text-amber-300/70">
          Sp. z o.o. wymaga pełnej księgowości (~800 zł/mc) oraz ma dodatkowe obowiązki formalne.
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
              <span className="text-gray-600 dark:text-gray-300">Wysoki ZUS (~1 927 zł/mc)</span>
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
              <span className="text-gray-600 dark:text-gray-300">Obowiązkowy ZUS wspólnika (~2 359 zł/mc)</span>
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
  exchangeRates,
  showCurrency,
}: {
  label: string;
  isBest: boolean;
  monthly: { zusSocial: number; zusHealth: number; tax: number; total: number; net: number };
  yearly: { net: number; burden: number };
  effectiveRate: number;
  formatCurrency: (v: number) => string;
  formatPercent: (v: number) => string;
  exchangeRates?: { EUR: number; USD: number; GBP: number } | null;
  showCurrency?: boolean;
}) {
  return (
    <div className={`glass-card rounded-2xl p-6 ${
      isBest ? 'glow-green border-green-500/50' : ''
    }`}>
      <div className="flex items-center justify-between mb-4 gap-2">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          {label}
          {isBest && (
            <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full border border-green-500/30">
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
          <p className="font-semibold text-white">{formatCurrency(monthly.zusSocial)}/mc</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Zdrowotna</p>
          <p className="font-semibold text-white">{formatCurrency(monthly.zusHealth)}/mc</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Podatek</p>
          <p className="font-semibold text-white">{formatCurrency(monthly.tax)}/mc</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Suma obciążeń</p>
          <p className="font-semibold text-red-400">{formatCurrency(monthly.total)}/mc</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Na rękę</p>
          <p className="font-bold text-green-400 text-lg">{formatCurrency(monthly.net)}/mc</p>
          {showCurrency && exchangeRates && (
            <div className="text-xs text-gray-500 mt-1 space-y-0.5">
              <div>≈ {(monthly.net * exchangeRates.EUR).toFixed(0)} EUR</div>
              <div>≈ {(monthly.net * exchangeRates.USD).toFixed(0)} USD</div>
              <div>≈ {(monthly.net * exchangeRates.GBP).toFixed(0)} GBP</div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-white/10 flex justify-between text-sm">
        <span className="text-gray-500">Rocznie na rękę:</span>
        <span className="font-bold text-green-400">{formatCurrency(yearly.net)}</span>
      </div>
    </div>
  );
}

export function Calculator({ pageIntro }: { pageIntro?: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <CalculatorInner pageIntro={pageIntro} />
    </Suspense>
  );
}

function B2bVsUopView({
  b2bData,
  jdgResults,
  formatCurrency,
  getBestJdgOption,
  exchangeRates,
  showCurrency,
  b2bTaxForm,
}: {
  b2bData: {
    uopGross: number;
    uopNet: number;
    uopEmployerCost: number;
    b2bRevenue: number;
    b2bNet: number;
    b2bAtUopGross: number;
    difference: number;
    vacationDays: number;
    vacationValueYearly: number;
    uopNetWithVacation: number;
  };
  jdgResults: ExtendedJdgResults;
  formatCurrency: (v: number) => string;
  getBestJdgOption: (r: ExtendedJdgResults) => { key: string; label: string; net: number };
  exchangeRates?: { EUR: number; USD: number; GBP: number } | null;
  showCurrency?: boolean;
  b2bTaxForm: 'ryczalt' | 'linear';
}) {
  void getBestJdgOption; void jdgResults;
  const b2bFormLabel = b2bTaxForm === 'linear' ? 'Podatek liniowy' : 'Ryczałt';
  const b2bWins = b2bData.b2bNet > b2bData.uopNetWithVacation;
  const difference = Math.abs(b2bData.difference);
  const percentDiff = b2bData.uopNetWithVacation > 0 ? (b2bData.difference / b2bData.uopNetWithVacation) * 100 : 0;

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
          {b2bWins ? b2bFormLabel : 'Umowa o pracę'}
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
              <span className="font-semibold text-sm">{b2bFormLabel}</span>
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
              <span className="text-gray-500">Koszt pracodawcy:</span>
              <span className="font-semibold text-sm text-gray-400">{formatCurrency(b2bData.uopEmployerCost)}</span>
            </div>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-500">Na rękę:</span>
                <span className="text-2xl font-bold text-purple-600">{formatCurrency(b2bData.uopNet)}</span>
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-500">
              <span>+ Wartość urlopu ({b2bData.vacationDays}d):</span>
              <span className="text-purple-400">+{formatCurrency(b2bData.vacationValueYearly)}/rok</span>
            </div>
            <div className="flex justify-between items-baseline border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
              <span className="text-gray-500">Łącznie z urlopem:</span>
              <span className="text-xl font-bold text-purple-600">{formatCurrency(b2bData.uopNetWithVacation)}/mc</span>
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
            <p className="text-sm text-gray-500 mb-1">Etat rocznie (z urlopem)</p>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(b2bData.uopNetWithVacation * 12)}</p>
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
