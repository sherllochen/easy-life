import type { Metadata } from 'next'
import { HospitalCalculator } from '@/components/HospitalCalculator'

export const metadata: Metadata = {
  title: 'Should I Buy Hospital Cover Now?',
  description: 'Calculate the cost of delaying Australian private hospital insurance purchase',
}

export default function HomePage() {
  return <HospitalCalculator />
}
