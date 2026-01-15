import type { Metadata } from 'next'
import { HospitalCalculator } from '@/components/HospitalCalculator'

export const metadata: Metadata = {
  title: 'Should I Buy Hospital Cover Now? | Australian Private Health Insurance Calculator',
  description: 'Free calculator to help Australians decide when to buy private hospital insurance. Compare MLS (Medicare Levy Surcharge), LHC (Lifetime Health Cover) loading costs, and find the optimal time to purchase health insurance.',
  keywords: [
    'hospital insurance calculator',
    'private health insurance Australia',
    'Medicare Levy Surcharge calculator',
    'MLS calculator',
    'Lifetime Health Cover loading',
    'LHC loading calculator',
    'when to buy health insurance',
    'private hospital cover',
    'Australian health insurance',
    'health insurance cost calculator',
  ],
  authors: [{ name: 'Easy Life Tools' }],
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
    title: 'Should I Buy Hospital Cover Now?',
    description: 'Free calculator to determine if delaying private hospital insurance makes financial sense. Calculate MLS costs, LHC loading, and compare scenarios.',
    type: 'website',
    locale: 'en_AU',
    siteName: 'Easy Life Tools',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Should I Buy Hospital Cover Now?',
    description: 'Free calculator to determine if delaying private hospital insurance makes financial sense for Australians.',
  },
  alternates: {
    canonical: '/',
  },
  other: {
    'google-site-verification': '', // Add verification code when available
  },
}

// Structured data for SEO (JSON-LD)
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Australian Hospital Insurance Calculator',
  description: 'Calculate whether you should buy private hospital insurance now or delay your purchase based on Medicare Levy Surcharge (MLS) and Lifetime Health Cover (LHC) loading costs.',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'AUD',
  },
  featureList: [
    'Medicare Levy Surcharge (MLS) calculation',
    'Lifetime Health Cover (LHC) loading calculation',
    'Multi-year cost comparison',
    'Personalized recommendations',
    'Support for singles and families',
    'Immigrant-specific calculations',
  ],
  inLanguage: ['en', 'zh'],
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HospitalCalculator />
    </>
  )
}
