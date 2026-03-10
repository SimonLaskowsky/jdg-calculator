import type { Metadata } from 'next';
import { Calculator } from '@/components/Calculator';

export const metadata: Metadata = {
  title: 'JDG vs Sp. z o.o. — Porównanie 2026 | Ile Zostanie?',
  description: 'Porównaj JDG i sp. z o.o. i znajdź próg opłacalności. Kiedy warto założyć spółkę? Kalkulator uwzględnia ZUS wspólnika, CIT, dywidendę i koszty księgowości.',
  alternates: { canonical: 'https://ilezostanie.com/porownanie' },
};

const intro = (
  <div className="glass rounded-2xl p-6 text-sm text-gray-300 max-w-3xl mx-auto">
    <p className="mb-3">
      Porównaj <strong className="text-white">JDG i sp. z o.o.</strong> i sprawdź, która forma działalności jest dla Ciebie korzystniejsza w 2026 roku.
      Kalkulator wyznacza indywidualny <strong className="text-white">próg opłacalności</strong> — czyli przy jakim przychodzie warto rozważyć zmianę formy.
    </p>
    <ul className="space-y-1 text-gray-400">
      <li>✓ Porównuje najlepszą opcję JDG z najlepszą opcją sp. z o.o. dla Twoich danych.</li>
      <li>✓ Wyznacza próg przychodów, od którego sp. z o.o. staje się korzystniejsza.</li>
      <li>✓ Uwzględnia wszystkie ukryte koszty: ZUS wspólnika, księgowość, podwójne opodatkowanie.</li>
    </ul>
  </div>
);

export default function PorownaniePage() {
  return <Calculator pageIntro={intro} />;
}
