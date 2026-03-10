import type { Metadata } from 'next';
import { Calculator } from '@/components/Calculator';

export const metadata: Metadata = {
  title: 'B2B vs Etat 2026 — Kalkulator | Ile Zostanie?',
  description: 'Sprawdź czy B2B czy umowa o pracę jest dla Ciebie korzystniejsza w 2026. Kalkulator uwzględnia ZUS, podatek, urlop i koszty pracodawcy.',
  alternates: { canonical: 'https://ilezostanie.com/b2b-vs-etat' },
};

const intro = (
  <div className="glass rounded-2xl p-6 text-sm text-gray-300 max-w-3xl mx-auto">
    <p className="mb-3">
      Porównaj <strong className="text-white">B2B (JDG) i umowę o pracę (etat)</strong> — sprawdź co bardziej opłaca się finansowo w 2026 roku.
      Wpisz swoje przychody B2B i brutto na etacie, a zobaczysz dokładną różnicę na rękę.
    </p>
    <ul className="space-y-1 text-gray-400">
      <li>✓ Oblicza netto B2B (JDG) z uwzględnieniem ZUS i wybranej formy opodatkowania.</li>
      <li>✓ Oblicza netto na etacie (ZUS pracownika, zdrowotna, PIT skala).</li>
      <li>✓ Pokazuje koszt pracodawcy — ile faktycznie kosztuje Twoje zatrudnienie.</li>
      <li>✓ Uwzględnia wartość urlopu i różnice w bezpieczeństwie zatrudnienia.</li>
    </ul>
  </div>
);

export default function B2bVsEtatPage() {
  return <Calculator pageIntro={intro} />;
}
