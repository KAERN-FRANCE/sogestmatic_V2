"use client"

export interface FuelPrice {
  type: "diesel" | "essence"
  price: number
  change7d: number
  change30d: number
  lastUpdate: string
  history: { date: string; price: number }[]
}

export interface SocialIndicator {
  id: string
  name: string
  value: string
  unit: string
  lastUpdate: string
  source: string
  change?: number
}

export class FuelService {
  private static instance: FuelService

  static getInstance(): FuelService {
    if (!FuelService.instance) {
      FuelService.instance = new FuelService()
    }
    return FuelService.instance
  }

  async fetchFuelPrices(): Promise<{ success: boolean; data?: FuelPrice[]; error?: string }> {
    try {
      const res = await fetch('/api/indicators/fuel', { method: 'GET' })
      if (!res.ok) throw new Error('http')
      const json = await res.json()
      const data = (json.data || []).map((x: any) => ({
        type: x.type,
        price: x.price,
        change7d: x.change7d,
        change30d: x.change30d,
        lastUpdate: x.lastUpdate,
        history: x.history && x.history.length ? x.history : this.generatePriceHistory(x.price, 30),
      })) as FuelPrice[]
      return { success: true, data }
    } catch (error) {
      return { success: false, error: "Erreur lors de la récupération des prix carburant" }
    }
  }

  private generatePriceHistory(currentPrice: number, days: number): { date: string; price: number }[] {
    const history = []
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)

      // Generate realistic price variation
      const variation = (Math.random() - 0.5) * 0.1
      const price = Math.max(0.8, currentPrice + variation * (i / days))

      history.push({
        date: date.toISOString(),
        price: Math.round(price * 1000) / 1000,
      })
    }
    return history
  }

  getSocialIndicators(): SocialIndicator[] {
    // Note: kept for SSR safety; client replaces via fetch below
    return [
      { id: 'smic', name: 'SMIC horaire', value: '11.65', unit: '€/h', lastUpdate: new Date().toISOString(), source: 'Légifrance' },
      { id: 'transport-hourly', name: 'Taux horaire transport', value: '13.85', unit: '€/h', lastUpdate: new Date().toISOString(), source: 'Convention collective' },
      { id: 'social-charges', name: 'Charges sociales patronales', value: '42.5', unit: '%', lastUpdate: new Date().toISOString(), source: 'URSSAF' },
      { id: 'csg-crds', name: 'CSG-CRDS', value: '9.7', unit: '%', lastUpdate: new Date().toISOString(), source: 'Service public' },
    ]
  }

  async fetchSocialIndicators(): Promise<{ success: boolean; data?: SocialIndicator[] }> {
    try {
      const res = await fetch('/api/indicators/social', { method: 'GET' })
      if (!res.ok) throw new Error('http')
      const json = await res.json()
      return { success: true, data: json.data as SocialIndicator[] }
    } catch {
      return { success: true, data: this.getSocialIndicators() }
    }
  }
}
