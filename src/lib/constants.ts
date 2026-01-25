/**
 * Stałe podatkowe i ZUS na rok 2025
 * Źródła: ZUS.pl, podatki.gov.pl
 * Ostatnia aktualizacja: Styczeń 2025
 */

export const TAX_YEAR = 2025;

// ===========================================
// WYNAGRODZENIA BAZOWE
// ===========================================

/** Prognozowane przeciętne wynagrodzenie 2025 */
export const PROJECTED_AVERAGE_WAGE = 8673;

/** Minimalne wynagrodzenie 2025 (od stycznia) */
export const MINIMUM_WAGE = 4666;

// ===========================================
// ZUS - SKŁADKI SPOŁECZNE
// ===========================================

/** Stopy procentowe składek ZUS */
export const ZUS_RATES = {
  /** Emerytalna */
  pension: 0.1952,
  /** Rentowa */
  disability: 0.08,
  /** Chorobowa (dobrowolna dla JDG) */
  sickness: 0.0245,
  /** Wypadkowa (średnia) */
  accident: 0.0167,
  /** Fundusz Pracy */
  laborFund: 0.0245,
} as const;

/** Podstawa wymiaru - pełny ZUS (60% prognozowanego przeciętnego) */
export const FULL_ZUS_BASE = PROJECTED_AVERAGE_WAGE * 0.6; // ~5203.80 PLN

/** Podstawa wymiaru - preferencyjny ZUS (30% minimalnego) */
export const PREFERENTIAL_ZUS_BASE = MINIMUM_WAGE * 0.3; // ~1399.80 PLN

/** Mały ZUS Plus - maksymalna podstawa (60% prognozowanego) */
export const SMALL_ZUS_PLUS_MAX_BASE = PROJECTED_AVERAGE_WAGE * 0.6;

/** Mały ZUS Plus - minimalna podstawa (30% minimalnego) */
export const SMALL_ZUS_PLUS_MIN_BASE = MINIMUM_WAGE * 0.3;

/** Limit przychodu dla Małego ZUS Plus (120 000 PLN rocznie) */
export const SMALL_ZUS_PLUS_REVENUE_LIMIT = 120000;

// ===========================================
// SKŁADKA ZDROWOTNA
// ===========================================

/** Stopa składki zdrowotnej - skala podatkowa */
export const HEALTH_RATE_SCALE = 0.09;

/** Stopa składki zdrowotnej - podatek liniowy */
export const HEALTH_RATE_LINEAR = 0.049;

/** Minimalna składka zdrowotna (9% minimalnego wynagrodzenia) */
export const HEALTH_MIN = MINIMUM_WAGE * 0.09; // ~419.94 PLN

/** Składka zdrowotna ryczałt - progi przychodowe */
export const HEALTH_RYCZALT_THRESHOLDS = {
  /** Do 60 000 PLN przychodu rocznie */
  tier1: { maxRevenue: 60000, monthlyAmount: 461.66 },
  /** 60 001 - 300 000 PLN przychodu rocznie */
  tier2: { maxRevenue: 300000, monthlyAmount: 769.43 },
  /** Powyżej 300 000 PLN przychodu rocznie */
  tier3: { maxRevenue: Infinity, monthlyAmount: 1384.97 },
} as const;

// ===========================================
// PODATEK DOCHODOWY
// ===========================================

/** Kwota wolna od podatku (skala) */
export const TAX_FREE_AMOUNT = 30000;

/** Próg podatkowy (skala) */
export const TAX_THRESHOLD = 120000;

/** Stawki podatku - skala */
export const TAX_SCALE_RATES = {
  /** Do 120 000 PLN */
  lower: 0.12,
  /** Powyżej 120 000 PLN */
  upper: 0.32,
} as const;

/** Stawka podatku liniowego */
export const TAX_LINEAR_RATE = 0.19;

/** Wszystkie stawki ryczałtu (od najwyższej do najniższej) */
export const RYCZALT_RATES = {
  /** Wolne zawody (lekarze, prawnicy, inżynierowie, architekci) */
  professionals: 0.17,
  /** Niektóre usługi niematerialne (reprodukcja, pośrednictwo) */
  services15: 0.15,
  /** IT, programowanie, doradztwo */
  it: 0.12,
  /** Usługi dla firm, wynajem, najem prywatny */
  businessServices: 0.085,
  /** Produkcja, roboty budowlane */
  manufacturing: 0.055,
  /** Handel, gastronomia, usługi transportowe */
  trade: 0.03,
  /** Sprzedaż produktów roślinnych/zwierzęcych z własnej uprawy */
  agriculture: 0.02,
} as const;

// ===========================================
// DODATKOWE ULGI I OPCJE
// ===========================================

/** IP Box - preferencyjna stawka 5% dla dochodów z kwalifikowanych IP */
export const IP_BOX_RATE = 0.05;

/** Koszty autorskie - 50% przychodu jako koszty */
export const COPYRIGHT_COSTS_RATE = 0.5;

/** Ulga na start - brak ZUS społecznego przez pierwsze 6 miesięcy */
export const STARTUP_RELIEF_MONTHS = 6;

// ===========================================
// SP. Z O.O. - STAŁE
// ===========================================

/** CIT - mały podatnik (przychód < 2M EUR) */
export const CIT_SMALL_RATE = 0.09;

/** CIT - standardowa stawka */
export const CIT_STANDARD_RATE = 0.19;

/** Podatek od dywidendy */
export const DIVIDEND_TAX_RATE = 0.19;

/** Próg małego podatnika CIT (~2M EUR w PLN) */
export const CIT_SMALL_TAXPAYER_LIMIT = 9218000; // ~2M EUR × 4.6 PLN

/** Szacunkowy koszt księgowości sp. z o.o. (miesięcznie) */
export const SPZOO_ACCOUNTING_COST = 800;

/** Składki ZUS pracownika (część pracownika) */
export const EMPLOYEE_ZUS_RATES = {
  pension: 0.0976,      // Emerytalna
  disability: 0.015,    // Rentowa
  sickness: 0.0245,     // Chorobowa
} as const;

/** Składki ZUS pracodawcy */
export const EMPLOYER_ZUS_RATES = {
  pension: 0.0976,      // Emerytalna
  disability: 0.065,    // Rentowa
  accident: 0.0167,     // Wypadkowa
  laborFund: 0.0245,    // Fundusz Pracy
  fgsp: 0.001,          // FGŚP
} as const;

/** Składka zdrowotna pracownika */
export const EMPLOYEE_HEALTH_RATE = 0.09;

// ===========================================
// TYPY
// ===========================================

export type TaxForm = 'scale' | 'linear' | 'ryczalt';
export type ZusType = 'full' | 'preferential' | 'smallPlus' | 'startupRelief' | 'none';

export interface CalculationInput {
  /** Miesięczny przychód brutto */
  monthlyRevenue: number;
  /** Miesięczne koszty uzyskania przychodu (dla skali/liniowego) */
  monthlyCosts: number;
  /** Rodzaj ZUS */
  zusType: ZusType;
  /** Stawka ryczałtu (jeśli dotyczy) */
  ryczaltRate?: number;
  /** Czy płaci chorobowe (domyślnie tak) */
  paysSickness?: boolean;
  /** Czy korzysta z IP Box (5% podatku) */
  useIpBox?: boolean;
  /** Czy stosuje 50% koszty autorskie */
  useCopyrightCosts?: boolean;
}

export interface MonthlyBreakdown {
  /** Składki społeczne ZUS */
  zusSocial: number;
  /** Składka zdrowotna */
  zusHealth: number;
  /** Zaliczka na podatek */
  taxAdvance: number;
  /** Suma obciążeń */
  totalBurden: number;
  /** Kwota netto (na rękę) */
  netAmount: number;
}

export interface YearlyResult {
  /** Forma opodatkowania */
  taxForm: TaxForm;
  /** Rozbicie miesięczne */
  monthly: MonthlyBreakdown;
  /** Roczne wartości */
  yearly: {
    revenue: number;
    costs: number;
    income: number;
    zusSocial: number;
    zusHealth: number;
    tax: number;
    totalBurden: number;
    netAmount: number;
  };
  /** Efektywna stawka podatkowa (całkowite obciążenia / przychód) */
  effectiveRate: number;
}

// ===========================================
// TYPY SP. Z O.O.
// ===========================================

export type SpzooPayoutMethod = 'dividend' | 'salary' | 'mixed';
export type CitRate = 'small' | 'standard';

export interface SpzooCalculationInput {
  /** Miesięczny przychód firmy brutto */
  monthlyRevenue: number;
  /** Miesięczne koszty operacyjne firmy (bez wypłat dla właściciela) */
  monthlyOperatingCosts: number;
  /** Stawka CIT (mały podatnik 9% lub standardowy 19%) */
  citRate: CitRate;
  /** Metoda wypłaty dla właściciela */
  payoutMethod: SpzooPayoutMethod;
  /** Pensja brutto właściciela (dla 'salary' i 'mixed') */
  ownerSalary?: number;
}

export interface SpzooMonthlyBreakdown {
  /** Przychód firmy */
  companyRevenue: number;
  /** Koszty operacyjne */
  operatingCosts: number;
  /** Koszty pracownicze (pensja + ZUS pracodawcy) */
  employmentCosts: number;
  /** Zysk przed CIT */
  profitBeforeTax: number;
  /** CIT */
  cit: number;
  /** Zysk po CIT (do dywidendy) */
  profitAfterTax: number;
  /** Podatek od dywidendy */
  dividendTax: number;
  /** Pensja netto właściciela */
  ownerNetSalary: number;
  /** Dywidenda netto */
  ownerNetDividend: number;
  /** Łącznie na rękę właściciela */
  ownerTotalNet: number;
  /** Księgowość */
  accountingCost: number;
}

export interface SpzooYearlyResult {
  /** Metoda wypłaty */
  payoutMethod: SpzooPayoutMethod;
  /** Stawka CIT */
  citRate: CitRate;
  /** Rozbicie miesięczne */
  monthly: SpzooMonthlyBreakdown;
  /** Roczne wartości */
  yearly: {
    revenue: number;
    operatingCosts: number;
    employmentCosts: number;
    profitBeforeTax: number;
    cit: number;
    profitAfterTax: number;
    dividendTax: number;
    ownerNetSalary: number;
    ownerNetDividend: number;
    ownerTotalNet: number;
    accountingCost: number;
    totalTaxBurden: number;
  };
  /** Efektywna stawka podatkowa */
  effectiveRate: number;
}
