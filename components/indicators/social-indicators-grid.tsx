"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, DollarSign, Percent } from "lucide-react"
import type { SocialIndicator } from "@/lib/fuel-service"
import { useEffect, useState } from "react"

interface SocialIndicatorsGridProps {
  indicators?: SocialIndicator[]
}

export function SocialIndicatorsGrid({ indicators: initial }: SocialIndicatorsGridProps) {
  const [indicators, setIndicators] = useState<SocialIndicator[]>(() => {
    if (initial && initial.length) return initial
    if (typeof window !== 'undefined') {
      try { const c = localStorage.getItem('sogestmatic_social_indicators'); if (c) return JSON.parse(c) } catch {}
    }
    return []
  })

  useEffect(() => {
    if (initial && initial.length) return
    ;(async () => {
      try {
        const res = await fetch('/api/indicators/social')
        const json = await res.json()
        if (json?.ok && Array.isArray(json.data)) {
          setIndicators(json.data as SocialIndicator[])
          try { localStorage.setItem('sogestmatic_social_indicators', JSON.stringify(json.data)) } catch {}
        }
      } catch {}
    })()
  }, [initial])
  const extractNumbers = (text: string): number[] => {
    const nums: number[] = []
    const re = /(\d{1,3}(?:[\.,]\d{1,3})?)/g
    let m
    while ((m = re.exec(text)) !== null) {
      const val = parseFloat(m[1].replace(',', '.'))
      if (!Number.isNaN(val)) nums.push(val)
    }
    return nums
  }

  const normalizeValue = (indicator: SocialIndicator): string => {
    const combined = `${indicator.value || ''} ${indicator.unit || ''}`
      .replace(/\(.*?\)/g, ' ') // retire parenthèses explicatives
      .replace(/\s+/g, ' ')
      .trim()

    const numbers = extractNumbers(combined)

    const formatEuroPerHour = (n: number) => `${n.toFixed(2).replace('.', ',')} €/h`
    const formatPercent = (n: number) => `${n.toFixed(2).replace('.', ',')} %`

    if (indicator.id === 'smic' || indicator.id === 'transport-hourly') {
      const n = numbers.length ? numbers[0] : parseFloat((indicator.value || '').toString().replace(',', '.'))
      if (!Number.isNaN(n)) return formatEuroPerHour(n)
    }

    if (indicator.id === 'social-charges' || indicator.id === 'csg-crds' || /%/.test(combined) || indicator.unit === '%') {
      // privilégie la dernière valeur (souvent le taux consolidé)
      const n = numbers.length ? numbers[numbers.length - 1] : NaN
      if (!Number.isNaN(n)) return formatPercent(n)
    }

    // fallback: renvoie la première valeur avec unité de départ si détectable
    if (numbers.length) {
      if (/€|euros?/i.test(combined)) return formatEuroPerHour(numbers[0])
      return formatPercent(numbers[0])
    }
    return combined
  }

  const shortName = (indicator: SocialIndicator): string => {
    switch (indicator.id) {
      case 'smic':
        return 'SMIC horaire'
      case 'transport-hourly':
        return 'Taux horaire conventionnel'
      case 'social-charges':
        return 'Charges patronales moyennes'
      case 'csg-crds':
        return 'CSG / CRDS'
      default:
        return indicator.name.length > 48 ? indicator.name.slice(0, 45) + '…' : indicator.name
    }
  }

  const sourceDomain = (src: string | undefined): string => {
    if (!src) return ''
    try {
      const u = new URL(src)
      return u.hostname.replace('www.', '')
    } catch {
      return src
    }
  }
  const getIcon = (id: string) => {
    switch (id) {
      case "smic":
      case "transport-hourly":
        return <DollarSign className="h-5 w-5 text-primary" />
      case "social-charges":
      case "csg-crds":
        return <Percent className="h-5 w-5 text-primary" />
      default:
        return <Users className="h-5 w-5 text-primary" />
    }
  }

  const formatChange = (change?: number) => {
    if (!change) return null
    const sign = change >= 0 ? "+" : ""
    return `${sign}${change.toFixed(2)} ${change >= 0 ? "€" : "€"}`
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {indicators.map((indicator) => (
        <Card key={indicator.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getIcon(indicator.id)}
                <CardTitle className="text-sm font-medium">{shortName(indicator)}</CardTitle>
              </div>
              {indicator.change && (
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {formatChange(indicator.change)}
                </Badge>
              )}
            </div>
            {/* MAJ retirée */}
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <div className="text-2xl font-bold text-primary">{normalizeValue(indicator)}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
