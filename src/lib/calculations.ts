/**
 * Funkcje obliczeniowe dla kalkulatora JDG
 * Oblicza ZUS, składkę zdrowotną i podatek dla różnych form opodatkowania
 */

import {
  ZUS_RATES,
  FULL_ZUS_BASE,
  PREFERENTIAL_ZUS_BASE,
  SMALL_ZUS_PLUS_MIN_BASE,
  SMALL_ZUS_PLUS_MAX_BASE,
  HEALTH_RATE_SCALE,
  HEALTH_RATE_LINEAR,
  HEALTH_MIN,
  HEALTH_RYCZALT_THRESHOLDS,
  TAX_FREE_AMOUNT,
  TAX_THRESHOLD,
  TAX_SCALE_RATES,
  TAX_LINEAR_RATE,
  IP_BOX_RATE,
  COPYRIGHT_COSTS_RATE,
  type ZusType,
  type TaxForm,
  type CalculationInput,
  type MonthlyBreakdown,
  type YearlyResult,
} from './constants';

// ===========================================
// SKŁADKI ZUS SPOŁECZNE
// ===========================================

/**
 * Oblicza miesięczną podstawę ZUS dla Małego ZUS Plus
 * Podstawa = 50% średniego miesięcznego dochodu z poprzedniego roku
 * (uproszczenie - zakładamy że poprzedni rok = bieżący)
 */
function calculateSmallZusPlusBase(yearlyIncome: number): number {
  const averageMonthlyIncome = yearlyIncome / 12;
  let base = averageMonthlyIncome * 0.5;

  // Ograniczenia
  base = Math.max(base, SMALL_ZUS_PLUS_MIN_BASE);
  base = Math.min(base, SMALL_ZUS_PLUS_MAX_BASE);

  return base;
}

/**
 * Oblicza miesięczne składki społeczne ZUS
 */
export function calculateZusSocial(
  zusType: ZusType,
  yearlyIncome: number = 0,
  paysSickness: boolean = true
): number {
  if (zusType === 'none') return 0;

  // Ulga na start - brak składek społecznych (tylko zdrowotna)
  if (zusType === 'startupRelief') return 0;

  let base: number;

  switch (zusType) {
    case 'full':
      base = FULL_ZUS_BASE;
      break;
    case 'preferential':
      base = PREFERENTIAL_ZUS_BASE;
      break;
    case 'smallPlus':
      base = calculateSmallZusPlusBase(yearlyIncome);
      break;
    default:
      base = FULL_ZUS_BASE;
  }

  // Składki podstawowe
  let total =
    base * ZUS_RATES.pension +
    base * ZUS_RATES.disability +
    base * ZUS_RATES.accident;

  // Chorobowa (opcjonalna)
  if (paysSickness) {
    total += base * ZUS_RATES.sickness;
  }

  // Fundusz Pracy (nie płaci się przy preferencyjnym i małym ZUS plus)
  if (zusType === 'full') {
    total += base * ZUS_RATES.laborFund;
  }

  return Math.round(total * 100) / 100;
}

// ===========================================
// SKŁADKA ZDROWOTNA
// ===========================================

/**
 * Oblicza miesięczną składkę zdrowotną dla skali podatkowej
 */
export function calculateHealthScale(monthlyIncome: number): number {
  const health = monthlyIncome * HEALTH_RATE_SCALE;
  return Math.max(health, HEALTH_MIN);
}

/**
 * Oblicza miesięczną składkę zdrowotną dla podatku liniowego
 */
export function calculateHealthLinear(monthlyIncome: number): number {
  const health = monthlyIncome * HEALTH_RATE_LINEAR;
  return Math.max(health, HEALTH_MIN);
}

/**
 * Oblicza miesięczną składkę zdrowotną dla ryczałtu
 */
export function calculateHealthRyczalt(yearlyRevenue: number): number {
  if (yearlyRevenue <= HEALTH_RYCZALT_THRESHOLDS.tier1.maxRevenue) {
    return HEALTH_RYCZALT_THRESHOLDS.tier1.monthlyAmount;
  }
  if (yearlyRevenue <= HEALTH_RYCZALT_THRESHOLDS.tier2.maxRevenue) {
    return HEALTH_RYCZALT_THRESHOLDS.tier2.monthlyAmount;
  }
  return HEALTH_RYCZALT_THRESHOLDS.tier3.monthlyAmount;
}

// ===========================================
// PODATEK DOCHODOWY
// ===========================================

/**
 * Oblicza roczny podatek według skali podatkowej
 */
export function calculateTaxScale(yearlyIncome: number): number {
  // Odejmujemy kwotę wolną
  const taxableIncome = Math.max(0, yearlyIncome - TAX_FREE_AMOUNT);

  if (taxableIncome <= 0) return 0;

  if (taxableIncome <= TAX_THRESHOLD - TAX_FREE_AMOUNT) {
    // Cały dochód w pierwszym progu (12%)
    return taxableIncome * TAX_SCALE_RATES.lower;
  }

  // Część w pierwszym progu, reszta w drugim
  const firstThresholdTax =
    (TAX_THRESHOLD - TAX_FREE_AMOUNT) * TAX_SCALE_RATES.lower;
  const secondThresholdIncome = taxableIncome - (TAX_THRESHOLD - TAX_FREE_AMOUNT);
  const secondThresholdTax = secondThresholdIncome * TAX_SCALE_RATES.upper;

  return firstThresholdTax + secondThresholdTax;
}

/**
 * Oblicza roczny podatek liniowy
 */
export function calculateTaxLinear(yearlyIncome: number): number {
  if (yearlyIncome <= 0) return 0;
  return yearlyIncome * TAX_LINEAR_RATE;
}

/**
 * Oblicza roczny podatek ryczałtowy
 */
export function calculateTaxRyczalt(
  yearlyRevenue: number,
  ryczaltRate: number
): number {
  if (yearlyRevenue <= 0) return 0;
  return yearlyRevenue * ryczaltRate;
}

/**
 * Oblicza roczny podatek IP Box (5%)
 */
export function calculateTaxIpBox(yearlyIncome: number): number {
  if (yearlyIncome <= 0) return 0;
  return yearlyIncome * IP_BOX_RATE;
}

/**
 * Oblicza koszty przy 50% kosztach autorskich
 */
export function calculateCopyrightCosts(yearlyRevenue: number): number {
  return yearlyRevenue * COPYRIGHT_COSTS_RATE;
}

// ===========================================
// KALKULACJA PEŁNA
// ===========================================

/**
 * Oblicza pełny wynik dla skali podatkowej
 */
export function calculateScale(input: CalculationInput): YearlyResult {
  const yearlyRevenue = input.monthlyRevenue * 12;

  // Koszty - normalne lub 50% autorskie
  const yearlyCosts = input.useCopyrightCosts
    ? calculateCopyrightCosts(yearlyRevenue)
    : input.monthlyCosts * 12;

  const yearlyIncome = yearlyRevenue - yearlyCosts;

  // ZUS społeczny
  const monthlyZusSocial = calculateZusSocial(
    input.zusType,
    yearlyIncome,
    input.paysSickness ?? true
  );
  const yearlyZusSocial = monthlyZusSocial * 12;

  // Dochód po odliczeniu ZUS (podstawa do zdrowotnej i podatku)
  const incomeAfterZus = yearlyIncome - yearlyZusSocial;
  const monthlyIncomeAfterZus = incomeAfterZus / 12;

  // Składka zdrowotna
  const monthlyHealth = calculateHealthScale(Math.max(0, monthlyIncomeAfterZus));
  const yearlyHealth = monthlyHealth * 12;

  // Podatek (od dochodu po odliczeniu ZUS społecznego)
  // IP Box nie działa ze skalą - tylko z liniowym
  const yearlyTax = calculateTaxScale(Math.max(0, incomeAfterZus));
  const monthlyTax = yearlyTax / 12;

  // Sumy
  const monthlyBurden = monthlyZusSocial + monthlyHealth + monthlyTax;
  const yearlyBurden = yearlyZusSocial + yearlyHealth + yearlyTax;

  // Net amount = revenue - costs - all taxes/ZUS
  const monthlyNetAmount = input.monthlyRevenue - input.monthlyCosts - monthlyBurden;
  const yearlyNetAmount = yearlyRevenue - yearlyCosts - yearlyBurden;

  return {
    taxForm: 'scale',
    monthly: {
      zusSocial: Math.round(monthlyZusSocial * 100) / 100,
      zusHealth: Math.round(monthlyHealth * 100) / 100,
      taxAdvance: Math.round(monthlyTax * 100) / 100,
      totalBurden: Math.round(monthlyBurden * 100) / 100,
      netAmount: Math.round(monthlyNetAmount * 100) / 100,
    },
    yearly: {
      revenue: yearlyRevenue,
      costs: yearlyCosts,
      income: yearlyIncome,
      zusSocial: Math.round(yearlyZusSocial * 100) / 100,
      zusHealth: Math.round(yearlyHealth * 100) / 100,
      tax: Math.round(yearlyTax * 100) / 100,
      totalBurden: Math.round(yearlyBurden * 100) / 100,
      netAmount: Math.round(yearlyNetAmount * 100) / 100,
    },
    effectiveRate: yearlyRevenue > 0 ? yearlyBurden / yearlyRevenue : 0,
  };
}

/**
 * Oblicza pełny wynik dla podatku liniowego
 */
export function calculateLinear(input: CalculationInput): YearlyResult {
  const yearlyRevenue = input.monthlyRevenue * 12;

  // Koszty - normalne lub 50% autorskie
  const yearlyCosts = input.useCopyrightCosts
    ? calculateCopyrightCosts(yearlyRevenue)
    : input.monthlyCosts * 12;

  const yearlyIncome = yearlyRevenue - yearlyCosts;

  // ZUS społeczny
  const monthlyZusSocial = calculateZusSocial(
    input.zusType,
    yearlyIncome,
    input.paysSickness ?? true
  );
  const yearlyZusSocial = monthlyZusSocial * 12;

  // Dochód po odliczeniu ZUS
  const incomeAfterZus = yearlyIncome - yearlyZusSocial;
  const monthlyIncomeAfterZus = incomeAfterZus / 12;

  // Składka zdrowotna (4.9% dla liniowego)
  const monthlyHealth = calculateHealthLinear(Math.max(0, monthlyIncomeAfterZus));
  const yearlyHealth = monthlyHealth * 12;

  // Podatek - IP Box (5%) lub liniowy (19%)
  const yearlyTax = input.useIpBox
    ? calculateTaxIpBox(Math.max(0, incomeAfterZus))
    : calculateTaxLinear(Math.max(0, incomeAfterZus));
  const monthlyTax = yearlyTax / 12;

  // Sumy
  const monthlyBurden = monthlyZusSocial + monthlyHealth + monthlyTax;
  const yearlyBurden = yearlyZusSocial + yearlyHealth + yearlyTax;

  // Net amount = revenue - costs - all taxes/ZUS
  const monthlyNetAmount = input.monthlyRevenue - input.monthlyCosts - monthlyBurden;
  const yearlyNetAmount = yearlyRevenue - yearlyCosts - yearlyBurden;

  return {
    taxForm: 'linear',
    monthly: {
      zusSocial: Math.round(monthlyZusSocial * 100) / 100,
      zusHealth: Math.round(monthlyHealth * 100) / 100,
      taxAdvance: Math.round(monthlyTax * 100) / 100,
      totalBurden: Math.round(monthlyBurden * 100) / 100,
      netAmount: Math.round(monthlyNetAmount * 100) / 100,
    },
    yearly: {
      revenue: yearlyRevenue,
      costs: yearlyCosts,
      income: yearlyIncome,
      zusSocial: Math.round(yearlyZusSocial * 100) / 100,
      zusHealth: Math.round(yearlyHealth * 100) / 100,
      tax: Math.round(yearlyTax * 100) / 100,
      totalBurden: Math.round(yearlyBurden * 100) / 100,
      netAmount: Math.round(yearlyNetAmount * 100) / 100,
    },
    effectiveRate: yearlyRevenue > 0 ? yearlyBurden / yearlyRevenue : 0,
  };
}

/**
 * Oblicza pełny wynik dla ryczałtu
 */
export function calculateRyczalt(input: CalculationInput): YearlyResult {
  const yearlyRevenue = input.monthlyRevenue * 12;
  const ryczaltRate = input.ryczaltRate ?? 0.12; // Domyślnie IT (12%)

  // Ryczałt nie ma kosztów - opodatkowany jest przychód
  const yearlyCosts = 0;

  // ZUS społeczny (dla ryczałtu podstawa to przychód, nie dochód)
  const monthlyZusSocial = calculateZusSocial(
    input.zusType,
    yearlyRevenue, // Dla ryczałtu używamy przychodu
    input.paysSickness ?? true
  );
  const yearlyZusSocial = monthlyZusSocial * 12;

  // Składka zdrowotna (stała kwota zależna od przychodu)
  const monthlyHealth = calculateHealthRyczalt(yearlyRevenue);
  const yearlyHealth = monthlyHealth * 12;

  // Podatek ryczałtowy
  const yearlyTax = calculateTaxRyczalt(yearlyRevenue, ryczaltRate);
  const monthlyTax = yearlyTax / 12;

  // Sumy
  const monthlyBurden = monthlyZusSocial + monthlyHealth + monthlyTax;
  const yearlyBurden = yearlyZusSocial + yearlyHealth + yearlyTax;

  // Net amount = revenue - actual costs - all taxes/ZUS
  // Note: costs don't reduce ryczałt tax, but they're still real expenses
  const actualMonthlyCosts = input.monthlyCosts;
  const actualYearlyCosts = input.monthlyCosts * 12;
  const monthlyNetAmount = input.monthlyRevenue - actualMonthlyCosts - monthlyBurden;
  const yearlyNetAmount = yearlyRevenue - actualYearlyCosts - yearlyBurden;

  return {
    taxForm: 'ryczalt',
    monthly: {
      zusSocial: Math.round(monthlyZusSocial * 100) / 100,
      zusHealth: Math.round(monthlyHealth * 100) / 100,
      taxAdvance: Math.round(monthlyTax * 100) / 100,
      totalBurden: Math.round(monthlyBurden * 100) / 100,
      netAmount: Math.round(monthlyNetAmount * 100) / 100,
    },
    yearly: {
      revenue: yearlyRevenue,
      costs: actualYearlyCosts, // Show actual costs for clarity
      income: yearlyRevenue, // Dla ryczałtu dochód = przychód (for tax purposes)
      zusSocial: Math.round(yearlyZusSocial * 100) / 100,
      zusHealth: Math.round(yearlyHealth * 100) / 100,
      tax: Math.round(yearlyTax * 100) / 100,
      totalBurden: Math.round(yearlyBurden * 100) / 100,
      netAmount: Math.round(yearlyNetAmount * 100) / 100,
    },
    effectiveRate: yearlyRevenue > 0 ? yearlyBurden / yearlyRevenue : 0,
  };
}

// ===========================================
// PORÓWNANIE WARIANTÓW
// ===========================================

export interface ComparisonResult {
  scale: YearlyResult;
  linear: YearlyResult;
  ryczalt: YearlyResult;
  best: TaxForm;
  savings: {
    vsScale: number;
    vsLinear: number;
    vsRyczalt: number;
  };
}

/**
 * Porównuje wszystkie trzy formy opodatkowania
 */
export function compareAllForms(input: CalculationInput): ComparisonResult {
  const scale = calculateScale(input);
  const linear = calculateLinear(input);
  const ryczalt = calculateRyczalt(input);

  // Znajdź najlepszą opcję (najniższe obciążenia)
  const results = [
    { form: 'scale' as TaxForm, burden: scale.yearly.totalBurden },
    { form: 'linear' as TaxForm, burden: linear.yearly.totalBurden },
    { form: 'ryczalt' as TaxForm, burden: ryczalt.yearly.totalBurden },
  ];

  results.sort((a, b) => a.burden - b.burden);
  const best = results[0].form;
  const bestBurden = results[0].burden;

  return {
    scale,
    linear,
    ryczalt,
    best,
    savings: {
      vsScale: Math.round((scale.yearly.totalBurden - bestBurden) * 100) / 100,
      vsLinear: Math.round((linear.yearly.totalBurden - bestBurden) * 100) / 100,
      vsRyczalt: Math.round((ryczalt.yearly.totalBurden - bestBurden) * 100) / 100,
    },
  };
}
