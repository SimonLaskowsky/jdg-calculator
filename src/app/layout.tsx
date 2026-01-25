import type { Metadata } from 'next';
import './globals.css';

const siteUrl = 'https://jdg-kalkulator.pl'; // Update with your actual domain

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Kalkulator ZUS i PIT 2025 | JDG, Sp. z o.o., B2B vs Etat',
    template: '%s | Kalkulator ZUS i PIT 2025',
  },
  description:
    'Bezpłatny kalkulator ZUS i PIT na 2025 rok. Porównaj JDG (skala, liniowy, ryczałt) ze sp. z o.o. Sprawdź B2B vs etat. Oblicz ile zarobisz na rękę i która forma opodatkowania jest najlepsza.',
  keywords: [
    'kalkulator ZUS 2025',
    'kalkulator PIT 2025',
    'kalkulator B2B',
    'B2B vs etat',
    'B2B czy umowa o pracę',
    'JDG kalkulator',
    'jednoosobowa działalność gospodarcza',
    'skala podatkowa czy ryczałt',
    'podatek liniowy',
    'ryczałt dla programisty',
    'ryczałt 12%',
    'składka zdrowotna 2025',
    'mały ZUS plus 2025',
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
  authors: [{ name: 'JDG Kalkulator' }],
  creator: 'JDG Kalkulator',
  publisher: 'JDG Kalkulator',
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
    siteName: 'Kalkulator ZUS i PIT 2025',
    title: 'Kalkulator ZUS i PIT 2025 | JDG, Sp. z o.o., B2B vs Etat',
    description:
      'Porównaj formy opodatkowania JDG, sp. z o.o. i B2B vs etat. Sprawdź ile zarobisz na rękę w 2025 roku.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kalkulator ZUS i PIT 2025',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kalkulator ZUS i PIT 2025 | JDG, Sp. z o.o., B2B vs Etat',
    description:
      'Porównaj formy opodatkowania i sprawdź ile zarobisz na rękę w 2025 roku.',
    images: ['/og-image.png'],
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
      name: 'Kalkulator ZUS i PIT 2025',
      description:
        'Bezpłatny kalkulator do porównania form opodatkowania JDG, sp. z o.o. oraz B2B vs etat.',
      url: siteUrl,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Any',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'PLN',
      },
      featureList: [
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
      name: 'JDG Kalkulator',
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'Kalkulator ZUS i PIT 2025',
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
    <html lang="pl">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#0f0f1a" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
