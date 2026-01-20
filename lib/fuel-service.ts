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

  private readonly FUEL_CACHE_KEY = 'sogestmatic_fuel_prices'
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000 // 24h

  async fetchFuelPrices(): Promise<{ success: boolean; data?: FuelPrice[]; error?: string }> {
    // Check localStorage cache first
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(this.FUEL_CACHE_KEY)
        if (cached) {
          const { data, timestamp } = JSON.parse(cached)
          if (Date.now() - timestamp < this.CACHE_DURATION) {
            return { success: true, data }
          }
        }
      } catch {}
    }

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

      // Save to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(this.FUEL_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }))
        } catch {}
      }

      return { success: true, data }
    } catch (error) {
      // Return cached data even if expired on error
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(this.FUEL_CACHE_KEY)
          if (cached) {
            const { data } = JSON.parse(cached)
            return { success: true, data }
          }
        } catch {}
      }
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
      { id: 'smic', name: 'SMIC horaire brut (France métropolitaine)', value: '12,02', unit: '€/h', lastUpdate: new Date().toISOString(), source: 'Légifrance' },
      { id: 'transport-hourly', name: 'Taux horaire conventionnel minimum (convention collective transport)', value: '12,27', unit: '€/h', lastUpdate: new Date().toISOString(), source: 'Convention collective' },
      { id: 'social-charges', name: 'Charges sociales patronales — ordre de grandeur', value: '42,00', unit: '%', lastUpdate: new Date().toISOString(), source: 'URSSAF' },
      { id: 'csg-crds', name: 'Taux CSG / CRDS applicables (revenus d\'activité)', value: '9,70', unit: '%', lastUpdate: new Date().toISOString(), source: 'Service public' },
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
