/**
 * Funkcje obliczeniowe dla sp. z o.o.
 * Oblicza CIT, dywidendę, wynagrodzenie zarządu i różne scenariusze wypłaty.
 *
 * WAŻNE: Jednoosobowy wspólnik sp. z o.o. (kod ZUS 05 10) jest traktowany
 * jak osoba prowadząca pozarolniczą działalność i ZAWSZE opłaca pełny ZUS
 * od podstawy FULL_ZUS_BASE (60% przeciętnego wynagrodzenia), niezależnie
 * od formy wypłaty. Nie może być zatrudniony we własnej jednoosobowej spółce
 * na umowę o pracę. Scenariusze "pensja" modelują wynagrodzenie zarządu
 * (art. 202 KSH) — brak składek ZUS pracodawcy/pracownika od tej kwoty.
 */

import {
  CIT_SMALL_RATE,
  CIT_STANDARD_RATE,
  DIVIDEND_TAX_RATE,
  SPZOO_ACCOUNTING_COST,
  TAX_FREE_AMOUNT,
  TAX_THRESHOLD,
  TAX_SCALE_RATES,
  MINIMUM_WAGE,
  FULL_ZUS_BASE,
  ZUS_RATES,
  HEALTH_MIN,
  type CitRate,
  type SpzooCalculationInput,
  type SpzooMonthlyBreakdown,
  type SpzooYearlyResult,
} from './constants';

// ===========================================
// FUNKCJE POMOCNICZE
// ===========================================

/**
 * Oblicza obowiązkowe składki ZUS jednoosobowego wspólnika sp. z o.o.
 * Wspólnik zawsze opłaca pełny ZUS społeczny od FULL_ZUS_BASE + min. zdrowotna,
 * niezależnie od formy wypłaty (dywidenda, wynagrodzenie zarządu).
 */
function calculateOwnerMandatoryZus(): number {
  const social =
    FULL_ZUS_BASE * ZUS_RATES.pension +
    FULL_ZUS_BASE * ZUS_RATES.disability +
    FULL_ZUS_BASE * ZUS_RATES.sickness +
    FULL_ZUS_BASE * ZUS_RATES.accident +
    FULL_ZUS_BASE * ZUS_RATES.laborFund;

  // Minimalna składka zdrowotna (9% minimalnego wynagrodzenia)
  const health = HEALTH_MIN;

  return Math.round((social + health) * 100) / 100;
}

/**
 * Oblicza PIT od wynagrodzenia zarządu (art. 13 pkt 7 PDoF).
 * Wynagrodzenie zarządu na podstawie powołania NIE jest objęte składkami
 * ZUS społecznymi ani zdrowotnymi — jedynie PIT według skali podatkowej.
 * KUP = 250 zł/mc (art. 22 ust. 9 pkt 5 ustawy o PIT).
 */
function calculateManagementFeePit(monthlyFee: number): number {
  if (monthlyFee <= 0) return 0;

  const kup = 250;
  const base = Math.max(0, monthlyFee - kup);
  const yearlyTaxable = base * 12;

  let yearlyTax = 0;
  if (yearlyTaxable > TAX_FREE_AMOUNT) {
    if (yearlyTaxable <= TAX_THRESHOLD) {
      yearlyTax = (yearlyTaxable - TAX_FREE_AMOUNT) * TAX_SCALE_RATES.lower;
    } else {
      yearlyTax =
        (TAX_THRESHOLD - TAX_FREE_AMOUNT) * TAX_SCALE_RATES.lower +
        (yearlyTaxable - TAX_THRESHOLD) * TAX_SCALE_RATES.upper;
    }
  }

  return yearlyTax / 12;
}

/**
 * Oblicza CIT
 */
function calculateCit(profit: number, citRate: CitRate): number {
  if (profit <= 0) return 0;
  const rate = citRate === 'small' ? CIT_SMALL_RATE : CIT_STANDARD_RATE;
  return profit * rate;
}

/**
 * Oblicza podatek od dywidendy
 */
function calculateDividendTax(dividend: number): number {
  if (dividend <= 0) return 0;
  return dividend * DIVIDEND_TAX_RATE;
}

// ===========================================
// SCENARIUSZE WYPŁATY
// ===========================================

/**
 * Scenariusz 1: Tylko dywidenda
 * Właściciel nie pobiera wynagrodzenia zarządu, cały zysk wypłaca jako dywidendę.
 * ZUS wspólnika (pełny ZUS od FULL_ZUS_BASE) opłacany osobno.
 */
export function calculateDividendOnly(input: SpzooCalculationInput): SpzooYearlyResult {
  const monthlyRevenue = input.monthlyRevenue;
  const monthlyOperatingCosts = input.monthlyOperatingCosts;
  const accountingCost = SPZOO_ACCOUNTING_COST;

  // Zysk przed CIT (przychód - koszty operacyjne - księgowość)
  const profitBeforeTax = monthlyRevenue - monthlyOperatingCosts - accountingCost;

  // CIT
  const cit = calculateCit(profitBeforeTax, input.citRate);

  // Zysk po CIT = dywidenda brutto
  const profitAfterTax = profitBeforeTax - cit;

  // Podatek od dywidendy
  const dividendTax = calculateDividendTax(Math.max(0, profitAfterTax));

  // Dywidenda netto
  const netDividend = Math.max(0, profitAfterTax - dividendTax);

  // Obowiązkowy ZUS wspólnika jednoosobowej sp. z o.o.
  const ownerMandatoryZus = calculateOwnerMandatoryZus();

  // Właściciel na rękę = dywidenda netto - obowiązkowy ZUS
  const ownerTotalNet = Math.max(0, netDividend - ownerMandatoryZus);

  const monthly: SpzooMonthlyBreakdown = {
    companyRevenue: monthlyRevenue,
    operatingCosts: monthlyOperatingCosts,
    employmentCosts: 0,
    profitBeforeTax: Math.max(0, profitBeforeTax),
    cit,
    profitAfterTax: Math.max(0, profitAfterTax),
    dividendTax,
    ownerNetSalary: 0,
    ownerNetDividend: netDividend,
    ownerTotalNet,
    ownerMandatoryZus,
    accountingCost,
  };

  const totalTaxBurden = (cit + dividendTax + ownerMandatoryZus + accountingCost) * 12;

  return {
    payoutMethod: 'dividend',
    citRate: input.citRate,
    monthly,
    yearly: {
      revenue: monthlyRevenue * 12,
      operatingCosts: monthlyOperatingCosts * 12,
      employmentCosts: 0,
      profitBeforeTax: monthly.profitBeforeTax * 12,
      cit: cit * 12,
      profitAfterTax: monthly.profitAfterTax * 12,
      dividendTax: dividendTax * 12,
      ownerNetSalary: 0,
      ownerNetDividend: netDividend * 12,
      ownerTotalNet: ownerTotalNet * 12,
      ownerMandatoryZus: ownerMandatoryZus * 12,
      accountingCost: accountingCost * 12,
      totalTaxBurden,
    },
    effectiveRate: monthlyRevenue > 0 ? totalTaxBurden / (monthlyRevenue * 12) : 0,
  };
}

/**
 * Scenariusz 2: Wynagrodzenie zarządu (min. pensja) + dywidenda
 * Właściciel pobiera minimalne wynagrodzenie zarządu (brak ZUS pracodawcy/pracownika),
 * reszta zysku jako dywidenda. ZUS wspólnika (pełny) opłacany osobno przez właściciela.
 */
export function calculateMinSalaryPlusDividend(input: SpzooCalculationInput): SpzooYearlyResult {
  const monthlyRevenue = input.monthlyRevenue;
  const monthlyOperatingCosts = input.monthlyOperatingCosts;
  const accountingCost = SPZOO_ACCOUNTING_COST;

  // Wynagrodzenie zarządu = minimalne wynagrodzenie (koszt spółki bez ZUS pracodawcy)
  const managementFee = MINIMUM_WAGE;
  const feePit = calculateManagementFeePit(managementFee);
  const feeNet = Math.max(0, managementFee - feePit);

  // Zysk przed CIT (przychód - koszty - wynagrodzenie zarządu - księgowość)
  const profitBeforeTax = monthlyRevenue - monthlyOperatingCosts - managementFee - accountingCost;

  // CIT
  const cit = calculateCit(Math.max(0, profitBeforeTax), input.citRate);

  // Zysk po CIT = dywidenda brutto
  const profitAfterTax = Math.max(0, profitBeforeTax - cit);

  // Podatek od dywidendy
  const dividendTax = calculateDividendTax(profitAfterTax);

  // Dywidenda netto
  const netDividend = Math.max(0, profitAfterTax - dividendTax);

  // ZUS wspólnika — zawsze od FULL_ZUS_BASE, niezależnie od formy wypłaty
  const ownerMandatoryZus = calculateOwnerMandatoryZus();

  // Łącznie na rękę = wynagrodzenie netto + dywidenda netto - ZUS wspólnika
  const totalNet = Math.max(0, feeNet + netDividend - ownerMandatoryZus);

  const monthly: SpzooMonthlyBreakdown = {
    companyRevenue: monthlyRevenue,
    operatingCosts: monthlyOperatingCosts,
    employmentCosts: managementFee, // wynagrodzenie zarządu (bez ZUS pracodawcy)
    profitBeforeTax: Math.max(0, profitBeforeTax),
    cit,
    profitAfterTax,
    dividendTax,
    ownerNetSalary: feeNet,
    ownerNetDividend: netDividend,
    ownerTotalNet: totalNet,
    ownerMandatoryZus,
    accountingCost,
  };

  const totalTaxBurden = (feePit + cit + dividendTax + ownerMandatoryZus + accountingCost) * 12;

  return {
    payoutMethod: 'mixed',
    citRate: input.citRate,
    monthly,
    yearly: {
      revenue: monthlyRevenue * 12,
      operatingCosts: monthlyOperatingCosts * 12,
      employmentCosts: managementFee * 12,
      profitBeforeTax: monthly.profitBeforeTax * 12,
      cit: cit * 12,
      profitAfterTax: profitAfterTax * 12,
      dividendTax: dividendTax * 12,
      ownerNetSalary: feeNet * 12,
      ownerNetDividend: netDividend * 12,
      ownerTotalNet: totalNet * 12,
      ownerMandatoryZus: ownerMandatoryZus * 12,
      accountingCost: accountingCost * 12,
      totalTaxBurden,
    },
    effectiveRate: monthlyRevenue > 0 ? totalTaxBurden / (monthlyRevenue * 12) : 0,
  };
}

/**
 * Scenariusz 3: Pełne wynagrodzenie zarządu (bez dywidendy)
 * Właściciel wypłaca całość dostępnych środków jako wynagrodzenie zarządu
 * (brak ZUS pracodawcy/pracownika — bez overhead ZUS). ZUS wspólnika (pełny)
 * opłacany osobno.
 */
export function calculateFullSalary(input: SpzooCalculationInput): SpzooYearlyResult {
  const monthlyRevenue = input.monthlyRevenue;
  const monthlyOperatingCosts = input.monthlyOperatingCosts;
  const accountingCost = SPZOO_ACCOUNTING_COST;

  // Maksymalne wynagrodzenie zarządu = wszystkie dostępne środki
  // (brak ZUS pracodawcy, więc całość trafia do właściciela jako wynagrodzenie)
  const availableFunds = monthlyRevenue - monthlyOperatingCosts - accountingCost;
  const managementFee = Math.max(0, availableFunds);

  const feePit = calculateManagementFeePit(managementFee);
  const feeNet = Math.max(0, managementFee - feePit);

  // Przy pełnym wynagrodzeniu zarządu brak zysku do CIT
  const profitBeforeTax = Math.max(
    0,
    monthlyRevenue - monthlyOperatingCosts - managementFee - accountingCost
  );
  const cit = calculateCit(profitBeforeTax, input.citRate);
  const profitAfterTax = Math.max(0, profitBeforeTax - cit);

  // ZUS wspólnika — zawsze od FULL_ZUS_BASE
  const ownerMandatoryZus = calculateOwnerMandatoryZus();

  // Na rękę = wynagrodzenie netto - ZUS wspólnika
  const totalNet = Math.max(0, feeNet - ownerMandatoryZus);

  const monthly: SpzooMonthlyBreakdown = {
    companyRevenue: monthlyRevenue,
    operatingCosts: monthlyOperatingCosts,
    employmentCosts: managementFee,
    profitBeforeTax,
    cit,
    profitAfterTax,
    dividendTax: 0,
    ownerNetSalary: feeNet,
    ownerNetDividend: 0,
    ownerTotalNet: totalNet,
    ownerMandatoryZus,
    accountingCost,
  };

  const totalTaxBurden = (feePit + cit + ownerMandatoryZus + accountingCost) * 12;

  return {
    payoutMethod: 'salary',
    citRate: input.citRate,
    monthly,
    yearly: {
      revenue: monthlyRevenue * 12,
      operatingCosts: monthlyOperatingCosts * 12,
      employmentCosts: managementFee * 12,
      profitBeforeTax: profitBeforeTax * 12,
      cit: cit * 12,
      profitAfterTax: profitAfterTax * 12,
      dividendTax: 0,
      ownerNetSalary: feeNet * 12,
      ownerNetDividend: 0,
      ownerTotalNet: totalNet * 12,
      ownerMandatoryZus: ownerMandatoryZus * 12,
      accountingCost: accountingCost * 12,
      totalTaxBurden,
    },
    effectiveRate: monthlyRevenue > 0 ? totalTaxBurden / (monthlyRevenue * 12) : 0,
  };
}

// ===========================================
// PORÓWNANIE SCENARIUSZY
// ===========================================

export interface SpzooComparisonResult {
  dividend: SpzooYearlyResult;
  minSalaryPlusDividend: SpzooYearlyResult;
  fullSalary: SpzooYearlyResult;
  best: 'dividend' | 'minSalaryPlusDividend' | 'fullSalary';
  bestNetAmount: number;
}

/**
 * Porównuje wszystkie scenariusze wypłaty dla sp. z o.o.
 */
export function compareSpzooScenarios(input: SpzooCalculationInput): SpzooComparisonResult {
  const dividend = calculateDividendOnly(input);
  const minSalaryPlusDividend = calculateMinSalaryPlusDividend(input);
  const fullSalary = calculateFullSalary(input);

  const scenarios = [
    { key: 'dividend' as const, result: dividend },
    { key: 'minSalaryPlusDividend' as const, result: minSalaryPlusDividend },
    { key: 'fullSalary' as const, result: fullSalary },
  ];

  const best = scenarios.reduce((a, b) =>
    b.result.yearly.ownerTotalNet > a.result.yearly.ownerTotalNet ? b : a
  );

  return {
    dividend,
    minSalaryPlusDividend,
    fullSalary,
    best: best.key,
    bestNetAmount: best.result.yearly.ownerTotalNet,
  };
}

/**
 * Znajduje próg opłacalności przejścia na sp. z o.o.
 * Zwraca miesięczny przychód, przy którym sp. z o.o. zaczyna się opłacać
 */
export function findSpzooThreshold(
  jdgMonthlyNet: number,
  monthlyCosts: number,
  citRate: CitRate = 'small'
): number | null {
  let low = 5000;
  let high = 100000;

  while (high - low > 100) {
    const mid = (low + high) / 2;

    const spzooResult = compareSpzooScenarios({
      monthlyRevenue: mid,
      monthlyOperatingCosts: monthlyCosts,
      citRate,
      payoutMethod: 'mixed',
    });

    if (spzooResult.bestNetAmount / 12 > jdgMonthlyNet) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return Math.round((low + high) / 2);
}
