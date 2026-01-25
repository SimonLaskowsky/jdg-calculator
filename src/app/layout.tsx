import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kalkulator ZUS i PIT dla JDG 2025 | Porównaj formy opodatkowania',
  description:
    'Bezpłatny kalkulator ZUS i podatku dla jednoosobowej działalności gospodarczej. Porównaj skalę podatkową, podatek liniowy i ryczałt. Sprawdź która forma opodatkowania jest dla Ciebie najlepsza.',
  keywords: [
    'kalkulator ZUS',
    'kalkulator PIT',
    'JDG',
    'jednoosobowa działalność gospodarcza',
    'skala podatkowa',
    'podatek liniowy',
    'ryczałt',
    'składka zdrowotna',
    'mały ZUS plus',
    '2025',
  ],
  openGraph: {
    title: 'Kalkulator ZUS i PIT dla JDG 2025',
    description:
      'Porównaj formy opodatkowania i znajdź najlepszą opcję dla swojej działalności',
    type: 'website',
    locale: 'pl_PL',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className="antialiased min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        {children}
      </body>
    </html>
  );
}
