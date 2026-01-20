"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Fuel, Calendar } from "lucide-react"
import type { FuelPrice } from "@/lib/fuel-service"

interface FuelPriceCardProps {
  fuelData: FuelPrice
}

export function FuelPriceCard({ fuelData }: FuelPriceCardProps) {
  const formatPrice = (price: number) => `${price.toFixed(3)} €`
  const formatChange = (change: number) => {
    const sign = change >= 0 ? "+" : ""
    return `${sign}${(change * 100).toFixed(1)}%`
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-red-600"
    if (change < 0) return "text-green-600"
    return "text-muted-foreground"
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4" />
    if (change < 0) return <TrendingDown className="h-4 w-4" />
    return null
  }

  // Simple sparkline data (last 7 days)
  const sparklineData = fuelData.history.slice(-7)
  const minPrice = Math.min(...sparklineData.map((d) => d.price))
  const maxPrice = Math.max(...sparklineData.map((d) => d.price))
  const priceRange = maxPrice - minPrice || 0.001

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Fuel className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg capitalize">{fuelData.type}</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            Temps réel
          </Badge>
        </div>
        <CardDescription className="flex items-center space-x-1 text-xs">
          <Calendar className="h-3 w-3" />
          <span>Mis à jour {new Date(fuelData.lastUpdate).toLocaleDateString("fr-FR")}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Price */}
        <div>
          <div className="text-2xl font-bold text-primary">{formatPrice(fuelData.price)}</div>
          <div className="text-sm text-muted-foreground">Prix moyen national</div>
        </div>

        {/* Price Changes */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">7 jours</div>
            <div className={`flex items-center space-x-1 text-sm font-medium ${getChangeColor(fuelData.change7d)}`}>
              {getChangeIcon(fuelData.change7d)}
              <span>{formatChange(fuelData.change7d)}</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">30 jours</div>
            <div className={`flex items-center space-x-1 text-sm font-medium ${getChangeColor(fuelData.change30d)}`}>
              {getChangeIcon(fuelData.change30d)}
              <span>{formatChange(fuelData.change30d)}</span>
            </div>
          </div>
        </div>

        {/* Simple Sparkline */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Évolution 7 derniers jours</div>
          <div className="h-8 flex items-end space-x-1">
            {sparklineData.map((point, index) => {
              const height = priceRange > 0 ? ((point.price - minPrice) / priceRange) * 100 : 50
              return (
                <div
                  key={index}
                  className="flex-1 bg-primary/20 rounded-sm min-h-[2px] transition-all hover:bg-primary/40"
                  style={{ height: `${Math.max(height, 10)}%` }}
                  title={`${new Date(point.date).toLocaleDateString("fr-FR")}: ${formatPrice(point.price)}`}
                />
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
