import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';

const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID;

const siteUrl = 'https://ilezostanie.com/';

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
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Ile Zostanie - Kalkulator ZUS i PIT 2026',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ile Zostanie? | Kalkulator ZUS i PIT 2026',
    description:
      'Sprawdź ile zostanie Ci na rękę po ZUS i podatkach w 2026 roku.',
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
    <html lang="pl">
      <head>
        <meta name="theme-color" content="#0f0f1a" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        {GA_TRACKING_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_TRACKING_ID}');
              `}
            </Script>
          </>
        )}
        {children}
      </body>
    </html>
  );
}
