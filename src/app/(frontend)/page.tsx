import type { Metadata } from 'next'
import { HospitalCalculator } from '@/components/HospitalCalculator'

export const metadata: Metadata = {
  title: 'Hospital Insurance Calculator',
  description: 'Calculate the cost of delaying Australian private hospital insurance purchase',
}

export default function HomePage() {
  return <HospitalCalculator />
}
