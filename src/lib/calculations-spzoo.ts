/**
 * Funkcje obliczeniowe dla sp. z o.o.
 * Oblicza CIT, dywidendę, pensję i różne scenariusze wypłaty
 */

import {
  CIT_SMALL_RATE,
  CIT_STANDARD_RATE,
  DIVIDEND_TAX_RATE,
  SPZOO_ACCOUNTING_COST,
  EMPLOYEE_ZUS_RATES,
  EMPLOYER_ZUS_RATES,
  EMPLOYEE_HEALTH_RATE,
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
 * Jednoosobowy wspólnik jest traktowany jak osoba prowadząca działalność
 * i musi opłacać pełne składki społeczne + zdrowotną niezależnie od formy wypłaty.
 */
function calculateOwnerMandatoryZus(): number {
  // Składki społeczne na podstawie 60% prognozowanego przeciętnego wynagrodzenia
  const social =
    FULL_ZUS_BASE * ZUS_RATES.pension +
    FULL_ZUS_BASE * ZUS_RATES.disability +
    FULL_ZUS_BASE * ZUS_RATES.sickness +
    FULL_ZUS_BASE * ZUS_RATES.accident +
    FULL_ZUS_BASE * ZUS_RATES.laborFund;

  // Składka zdrowotna - minimum (9% minimalnego wynagrodzenia)
  // Wspólnik na samej dywidendzie nie ma dochodu z działalności, więc płaci minimum
  const health = HEALTH_MIN;

  return Math.round((social + health) * 100) / 100;
}

/**
 * Oblicza składki ZUS pracownika (część pracownika)
 */
function calculateEmployeeZus(grossSalary: number): number {
  return grossSalary * (
    EMPLOYEE_ZUS_RATES.pension +
    EMPLOYEE_ZUS_RATES.disability +
    EMPLOYEE_ZUS_RATES.sickness
  );
}

/**
 * Oblicza składki ZUS pracodawcy
 */
function calculateEmployerZus(grossSalary: number): number {
  return grossSalary * (
    EMPLOYER_ZUS_RATES.pension +
    EMPLOYER_ZUS_RATES.disability +
    EMPLOYER_ZUS_RATES.accident +
    EMPLOYER_ZUS_RATES.laborFund +
    EMPLOYER_ZUS_RATES.fgsp
  );
}

/**
 * Oblicza składkę zdrowotną pracownika
 */
function calculateEmployeeHealth(grossSalary: number): number {
  const zusEmployee = calculateEmployeeZus(grossSalary);
  const base = grossSalary - zusEmployee;
  return base * EMPLOYEE_HEALTH_RATE;
}

/**
 * Oblicza zaliczkę na PIT pracownika (uproszczone)
 */
function calculateEmployeePit(grossSalary: number): number {
  const zusEmployee = calculateEmployeeZus(grossSalary);
  const base = grossSalary - zusEmployee;

  // Koszty uzyskania przychodu pracownika (250 zł/mc)
  const taxableIncome = Math.max(0, base - 250);

  // Miesięczna kwota wolna (~2500 zł/mc)
  const monthlyTaxFree = TAX_FREE_AMOUNT / 12;

  // Uproszczona kalkulacja (12% dla większości)
  const yearlyTaxable = taxableIncome * 12;
  let yearlyTax = 0;

  if (yearlyTaxable > TAX_FREE_AMOUNT) {
    if (yearlyTaxable <= TAX_THRESHOLD) {
      yearlyTax = (yearlyTaxable - TAX_FREE_AMOUNT) * TAX_SCALE_RATES.lower;
    } else {
      yearlyTax = (TAX_THRESHOLD - TAX_FREE_AMOUNT) * TAX_SCALE_RATES.lower +
                  (yearlyTaxable - TAX_THRESHOLD) * TAX_SCALE_RATES.upper;
    }
  }

  return yearlyTax / 12;
}

/**
 * Oblicza pensję netto pracownika
 */
function calculateNetSalary(grossSalary: number): number {
  if (grossSalary <= 0) return 0;

  const zusEmployee = calculateEmployeeZus(grossSalary);
  const health = calculateEmployeeHealth(grossSalary);
  const pit = calculateEmployeePit(grossSalary);

  return Math.max(0, grossSalary - zusEmployee - health - pit);
}

/**
 * Oblicza całkowity koszt pracodawcy za pracownika
 */
function calculateTotalEmploymentCost(grossSalary: number): number {
  if (grossSalary <= 0) return 0;
  return grossSalary + calculateEmployerZus(grossSalary);
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
 * Właściciel nie pobiera pensji, cały zysk wypłaca jako dywidendę
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
 * Scenariusz 2: Minimalna pensja + dywidenda
 * Właściciel pobiera minimalną pensję, reszta jako dywidenda
 */
export function calculateMinSalaryPlusDividend(input: SpzooCalculationInput): SpzooYearlyResult {
  const monthlyRevenue = input.monthlyRevenue;
  const monthlyOperatingCosts = input.monthlyOperatingCosts;
  const accountingCost = SPZOO_ACCOUNTING_COST;

  // Pensja minimalna
  const grossSalary = MINIMUM_WAGE;
  const employmentCost = calculateTotalEmploymentCost(grossSalary);
  const netSalary = calculateNetSalary(grossSalary);

  // Zysk przed CIT (przychód - koszty - pensja z ZUS pracodawcy - księgowość)
  const profitBeforeTax = monthlyRevenue - monthlyOperatingCosts - employmentCost - accountingCost;

  // CIT
  const cit = calculateCit(Math.max(0, profitBeforeTax), input.citRate);

  // Zysk po CIT = dywidenda brutto
  const profitAfterTax = Math.max(0, profitBeforeTax - cit);

  // Podatek od dywidendy
  const dividendTax = calculateDividendTax(profitAfterTax);

  // Dywidenda netto
  const netDividend = profitAfterTax - dividendTax;

  // Łącznie na rękę
  const totalNet = netSalary + netDividend;

  const monthly: SpzooMonthlyBreakdown = {
    companyRevenue: monthlyRevenue,
    operatingCosts: monthlyOperatingCosts,
    employmentCosts: employmentCost,
    profitBeforeTax: Math.max(0, profitBeforeTax),
    cit,
    profitAfterTax,
    dividendTax,
    ownerNetSalary: netSalary,
    ownerNetDividend: Math.max(0, netDividend),
    ownerTotalNet: Math.max(0, totalNet),
    ownerMandatoryZus: 0, // ZUS opłacany przez pensję
    accountingCost,
  };

  // Całkowite obciążenia = ZUS pracodawcy + ZUS pracownika + zdrowotna + PIT od pensji + CIT + podatek od dywidendy
  const zusEmployee = calculateEmployeeZus(grossSalary);
  const zusEmployer = calculateEmployerZus(grossSalary);
  const health = calculateEmployeeHealth(grossSalary);
  const pitSalary = calculateEmployeePit(grossSalary);

  const totalTaxBurden = (zusEmployee + zusEmployer + health + pitSalary + cit + dividendTax + accountingCost) * 12;

  return {
    payoutMethod: 'mixed',
    citRate: input.citRate,
    monthly,
    yearly: {
      revenue: monthlyRevenue * 12,
      operatingCosts: monthlyOperatingCosts * 12,
      employmentCosts: employmentCost * 12,
      profitBeforeTax: monthly.profitBeforeTax * 12,
      cit: cit * 12,
      profitAfterTax: profitAfterTax * 12,
      dividendTax: dividendTax * 12,
      ownerNetSalary: netSalary * 12,
      ownerNetDividend: Math.max(0, netDividend * 12),
      ownerTotalNet: Math.max(0, totalNet * 12),
      ownerMandatoryZus: 0,
      accountingCost: accountingCost * 12,
      totalTaxBurden,
    },
    effectiveRate: monthlyRevenue > 0 ? totalTaxBurden / (monthlyRevenue * 12) : 0,
  };
}

/**
 * Scenariusz 3: Pełna pensja (bez dywidendy)
 * Właściciel pobiera całość jako pensję (optymalizacja przy niższych dochodach)
 */
export function calculateFullSalary(input: SpzooCalculationInput): SpzooYearlyResult {
  const monthlyRevenue = input.monthlyRevenue;
  const monthlyOperatingCosts = input.monthlyOperatingCosts;
  const accountingCost = SPZOO_ACCOUNTING_COST;

  // Maksymalna pensja = przychód - koszty - księgowość - ZUS pracodawcy
  // Rozwiązujemy równanie: pensja + ZUS_pracodawcy(pensja) = dostępne środki
  const availableFunds = monthlyRevenue - monthlyOperatingCosts - accountingCost;

  // ZUS pracodawcy to ~20% pensji, więc pensja ≈ dostępne / 1.2
  const employerZusRate = EMPLOYER_ZUS_RATES.pension + EMPLOYER_ZUS_RATES.disability +
                          EMPLOYER_ZUS_RATES.accident + EMPLOYER_ZUS_RATES.laborFund +
                          EMPLOYER_ZUS_RATES.fgsp;
  const grossSalary = Math.max(0, availableFunds / (1 + employerZusRate));

  const employmentCost = calculateTotalEmploymentCost(grossSalary);
  const netSalary = calculateNetSalary(grossSalary);

  // Przy pełnej pensji nie ma zysku do opodatkowania CIT
  const profitBeforeTax = Math.max(0, monthlyRevenue - monthlyOperatingCosts - employmentCost - accountingCost);
  const cit = calculateCit(profitBeforeTax, input.citRate);
  const profitAfterTax = profitBeforeTax - cit;

  const monthly: SpzooMonthlyBreakdown = {
    companyRevenue: monthlyRevenue,
    operatingCosts: monthlyOperatingCosts,
    employmentCosts: employmentCost,
    profitBeforeTax,
    cit,
    profitAfterTax,
    dividendTax: 0,
    ownerNetSalary: netSalary,
    ownerNetDividend: 0,
    ownerTotalNet: netSalary,
    ownerMandatoryZus: 0, // ZUS opłacany przez pensję
    accountingCost,
  };

  const zusEmployee = calculateEmployeeZus(grossSalary);
  const zusEmployer = calculateEmployerZus(grossSalary);
  const health = calculateEmployeeHealth(grossSalary);
  const pitSalary = calculateEmployeePit(grossSalary);

  const totalTaxBurden = (zusEmployee + zusEmployer + health + pitSalary + cit + accountingCost) * 12;

  return {
    payoutMethod: 'salary',
    citRate: input.citRate,
    monthly,
    yearly: {
      revenue: monthlyRevenue * 12,
      operatingCosts: monthlyOperatingCosts * 12,
      employmentCosts: employmentCost * 12,
      profitBeforeTax: profitBeforeTax * 12,
      cit: cit * 12,
      profitAfterTax: profitAfterTax * 12,
      dividendTax: 0,
      ownerNetSalary: netSalary * 12,
      ownerNetDividend: 0,
      ownerTotalNet: netSalary * 12,
      ownerMandatoryZus: 0,
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
  // Szukamy binarnie przychodu, przy którym sp. z o.o. daje więcej netto
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
