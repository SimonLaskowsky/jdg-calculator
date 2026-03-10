import type { Metadata } from 'next';
import { Calculator } from '@/components/Calculator';

export const metadata: Metadata = {
  title: 'Kalkulator Sp. z o.o. 2026 — CIT 9% i dywidenda | Ile Zostanie?',
  description: 'Oblicz ile zostanie właścicielowi sp. z o.o. w 2026. Porównaj scenariusze: tylko dywidenda, minimalna pensja + dywidenda, pełna pensja. CIT 9% małego podatnika i 19% standardowy.',
  alternates: { canonical: 'https://ilezostanie.com/kalkulator-spzoo' },
};

const intro = (
  <div className="glass rounded-2xl p-6 text-sm text-gray-300 max-w-3xl mx-auto">
    <p className="mb-3">
      Kalkulator dla <strong className="text-white">spółki z ograniczoną odpowiedzialnością (sp. z o.o.)</strong> w Polsce na rok 2026.
      Sprawdź ile zostanie Ci na rękę jako właściciel spółki — z uwzględnieniem CIT, dywidendy i obowiązkowego ZUS wspólnika.
    </p>
    <ul className="space-y-1 text-gray-400">
      <li>✓ <strong className="text-gray-300">CIT 9%</strong> dla małych podatników (przychód do 8,5 mln zł/rok).</li>
      <li>✓ <strong className="text-gray-300">CIT 19%</strong> standardowy dla większych podmiotów.</li>
      <li>✓ Trzy scenariusze wypłaty: tylko dywidenda, min. pensja + dywidenda, pełna pensja.</li>
      <li>✓ Uwzględnia obowiązkowy ZUS jednoosobowego wspólnika (~2 359 zł/mc) i koszty księgowości.</li>
    </ul>
  </div>
);

export default function SpzooPage() {
  return <Calculator pageIntro={intro} />;
}
