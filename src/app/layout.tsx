import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Analytics } from '@/components/Analytics';
import { CookieBanner } from '@/components/CookieBanner';

const inter = Inter({
  variable: '--font-geist-sans',
  subsets: ['latin', 'latin-ext'],
});

const siteUrl = 'https://ilezostanie.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Ile Zostanie? | Kalkulator ZUS i PIT 2026',
    template: '%s | Ile Zostanie?',
  },
  description:
    'Sprawdź ile zostanie Ci na rękę po ZUS i podatkach. Darmowy kalkulator 2026 - porównaj JDG, sp. z o.o. i B2B vs etat.',
  keywords: [
    'ile zostanie na rękę',
    'ile zostanie po podatkach',
    'kalkulator ZUS 2026',
    'kalkulator PIT 2026',
    'kalkulator B2B',
    'B2B vs etat',
    'B2B czy umowa o pracę',
    'JDG kalkulator',
    'jednoosobowa działalność gospodarcza',
    'skala podatkowa czy ryczałt',
    'podatek liniowy',
    'ryczałt dla programisty',
    'ryczałt 12%',
    'składka zdrowotna 2026',
    'mały ZUS plus 2026',
    'ulga na start',
    'IP Box kalkulator',
    'sp. z o.o. kalkulator',
    'spółka z o.o. vs JDG',
    'kiedy założyć spółkę',
    'ile zarobię na działalności',
    'kalkulator wynagrodzeń',
    'kalkulator dla freelancera',
    'kalkulator dla programisty',
  ],
  authors: [{ name: 'Ile Zostanie' }],
  creator: 'Ile Zostanie',
  publisher: 'Ile Zostanie',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pl_PL',
    url: siteUrl,
    siteName: 'Ile Zostanie?',
    title: 'Ile Zostanie? | Kalkulator ZUS i PIT 2026',
    description:
      'Sprawdź ile zostanie Ci na rękę po ZUS i podatkach. Porównaj JDG, sp. z o.o. i B2B vs etat.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ile Zostanie? | Kalkulator ZUS i PIT 2026',
    description:
      'Sprawdź ile zostanie Ci na rękę po ZUS i podatkach w 2026 roku.',
  },
  alternates: {
    canonical: siteUrl,
  },
  category: 'finance',
};

// JSON-LD Structured Data
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${siteUrl}/#webapp`,
      name: 'Ile Zostanie? - Kalkulator ZUS i PIT',
      description:
        'Sprawdź ile zostanie Ci na rękę po ZUS i podatkach. Porównaj JDG, sp. z o.o. oraz B2B vs etat.',
      url: siteUrl,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'PLN',
      },
      featureList: [
        'Oblicz ile zostanie na rękę',
        'Kalkulator JDG (skala, liniowy, ryczałt)',
        'Kalkulator sp. z o.o.',
        'Porównanie JDG vs sp. z o.o.',
        'Kalkulator B2B vs etat',
        'IP Box i ulga na start',
        'Obliczenia w czasie rzeczywistym',
      ],
    },
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'Ile Zostanie',
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'Ile Zostanie?',
      publisher: {
        '@id': `${siteUrl}/#organization`,
      },
      inLanguage: 'pl-PL',
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={`${inter.variable} bg-background`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Ustaw motyw przed renderem, by uniknąć mignięcia (flash) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="overflow-x-hidden font-sans antialiased" suppressHydrationWarning>
        <Analytics />
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
