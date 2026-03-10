import type { Metadata } from 'next';
import { Calculator } from '@/components/Calculator';

export const metadata: Metadata = {
  title: 'Kalkulator JDG 2026 — Skala, Liniowy, Ryczałt | Ile Zostanie?',
  description: 'Oblicz ile zostanie Ci na rękę z JDG w 2026 roku. Porównaj skalę podatkową (12%/32%), podatek liniowy (19%) i ryczałt. Uwzględnia pełny ZUS, preferencyjny, mały ZUS Plus i ulgę na start.',
  alternates: { canonical: 'https://ilezostanie.com/' },
};

const intro = (
  <div className="glass rounded-2xl p-6 text-sm text-gray-300 max-w-3xl mx-auto">
    <p className="mb-3">
      Kalkulator dla <strong className="text-white">jednoosobowej działalności gospodarczej (JDG)</strong> w Polsce na rok 2026.
      Wpisz swój miesięczny przychód i koszty, a zobaczysz ile zostanie Ci na rękę przy każdej formie opodatkowania.
    </p>
    <ul className="space-y-1 text-gray-400">
      <li>✓ <strong className="text-gray-300">Skala podatkowa</strong> — 12% do 120 tys. zł, 32% powyżej. Kwota wolna 30 tys. zł.</li>
      <li>✓ <strong className="text-gray-300">Podatek liniowy</strong> — stałe 19%, opłaca się od ~12 tys. zł/mc dochodu.</li>
      <li>✓ <strong className="text-gray-300">Ryczałt</strong> — 12% dla IT, 8,5% dla usług. Podatek od przychodu, bez kosztów.</li>
      <li>✓ Obsługuje IP Box, 50% koszty autorskie, preferencyjny ZUS, ulgę na start.</li>
    </ul>
  </div>
);

export default function JdgPage() {
  return <Calculator pageIntro={intro} />;
}
