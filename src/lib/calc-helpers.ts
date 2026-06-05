/**
 * Pomocnicze funkcje i typy łączące logikę obliczeń z komponentami UI.
 */

import type { ComparisonResult } from "./calculations";
import type { SpzooComparisonResult } from "./calculations-spzoo";
import type { YearlyResult } from "./constants";

export interface ExtendedJdgResults extends ComparisonResult {
  ipBox?: YearlyResult;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pl-PL").format(Math.round(value)) + " zł";
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export interface BestJdgOption {
  key: string;
  label: string;
  net: number;
  burden: number;
}

export function getBestJdgOption(results: ExtendedJdgResults): BestJdgOption {
  const options: BestJdgOption[] = [
    { key: "scale", label: "Skala podatkowa", net: results.scale.yearly.netAmount, burden: results.scale.yearly.totalBurden },
    { key: "linear", label: "Podatek liniowy", net: results.linear.yearly.netAmount, burden: results.linear.yearly.totalBurden },
    { key: "ryczalt", label: "Ryczałt", net: results.ryczalt.yearly.netAmount, burden: results.ryczalt.yearly.totalBurden },
  ];
  if (results.ipBox) {
    options.push({ key: "ipBox", label: "IP Box", net: results.ipBox.yearly.netAmount, burden: results.ipBox.yearly.totalBurden });
  }
  return options.reduce((best, curr) => (curr.net > best.net ? curr : best));
}

export interface BestSpzooOption {
  key: string;
  label: string;
  net: number;
}

export function getBestSpzooOption(results: SpzooComparisonResult): BestSpzooOption {
  const options: BestSpzooOption[] = [
    { key: "dividend", label: "Tylko dywidenda", net: results.dividend.yearly.ownerTotalNet },
    { key: "minSalaryPlusDividend", label: "Min. pensja + dywidenda", net: results.minSalaryPlusDividend.yearly.ownerTotalNet },
    { key: "fullSalary", label: "Pełna pensja", net: results.fullSalary.yearly.ownerTotalNet },
  ];
  return options.reduce((best, curr) => (curr.net > best.net ? curr : best));
}

/**
 * Oblicza wynagrodzenie netto na umowie o pracę (uproszczone, na potrzeby B2B vs etat).
 */
export function calculateUopNet(grossSalary: number): number {
  if (grossSalary <= 0) return 0;

  const pension = grossSalary * 0.0976;
  const disability = grossSalary * 0.015;
  const sickness = grossSalary * 0.0245;
  const zusTotal = pension + disability + sickness;

  const healthBase = grossSalary - zusTotal;
  const health = healthBase * 0.09;

  const taxBase = grossSalary - zusTotal - 250;
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
