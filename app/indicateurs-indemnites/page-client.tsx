"use client"

import { useState, useEffect } from "react"
import { FuelPriceCard } from "@/components/indicators/fuel-price-card"
import { SocialIndicatorsGrid } from "@/components/indicators/social-indicators-grid"
import { AllowancesTable } from "@/components/indicators/allowances-table"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FuelService, type FuelPrice } from "@/lib/fuel-service"
import { Fuel, Users, FileText, Info, RefreshCw, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

function formatLastUpdate(dateString: string | undefined): string {
  if (!dateString) return "Non disponible"
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return "Il y a moins d'une heure"
    if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`
    if (diffDays === 1) return "Hier"
    if (diffDays < 7) return `Il y a ${diffDays} jours`
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return "Non disponible"
  }
}

export function IndicatorsPageClient() {
  const [fuelPrices, setFuelPrices] = useState<FuelPrice[]>([])
  const [isLoadingFuel, setIsLoadingFuel] = useState(true)
  const [fuelError, setFuelError] = useState<string | null>(null)
  const [lastFuelUpdate, setLastFuelUpdate] = useState<string | undefined>()
  const fuelService = FuelService.getInstance()

  useEffect(() => {
    loadFuelPrices()
  }, [])

  const loadFuelPrices = async () => {
    setIsLoadingFuel(true)
    setFuelError(null)

    const result = await fuelService.fetchFuelPrices()

    if (result.success && result.data) {
      setFuelPrices(result.data)
      // Récupérer la date de dernière mise à jour
      if (result.data[0]?.lastUpdate) {
        setLastFuelUpdate(result.data[0].lastUpdate)
      }
    } else {
      setFuelError(result.error || "Erreur de chargement")
    }

    setIsLoadingFuel(false)
  }

  const [socialIndicators, setSocialIndicators] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('sogestmatic_social_indicators')
        if (cached) return JSON.parse(cached)
      } catch {}
    }
    return fuelService.getSocialIndicators()
  })

  useEffect(() => {
    ;(async () => {
      const resp = await fuelService.fetchSocialIndicators()
      if (resp.success && resp.data) {
        setSocialIndicators(resp.data)
        try { localStorage.setItem('sogestmatic_social_indicators', JSON.stringify(resp.data)) } catch {}
      }
    })()
  }, [])

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* SEO Optimized Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
              Indicateurs & Indemnités Transport Routier
            </h1>
            <div className="max-w-4xl mx-auto text-lg text-muted-foreground leading-relaxed">
              <p>
                Suivez en temps réel les <strong>prix carburant</strong>, consultez les{" "}
                <strong>indicateurs sociaux</strong> (SMIC, taux horaires transport) et accédez à la{" "}
                <strong>grille officielle des indemnités</strong> pour assurer votre{" "}
                <strong>conformité réglementaire</strong>. Données actualisées pour la gestion des{" "}
                <strong>chronotachygraphes</strong> et le respect de la{" "}
                <strong>réglementation transport routier</strong>. Optimisez vos <strong>coûts transport</strong> grâce
                à nos outils professionnels de suivi des indicateurs économiques et sociaux du secteur.
              </p>
            </div>
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span>
                Les données sont mises à jour automatiquement chaque jour à 6h. Sources : données gouvernementales ouvertes,
                Légifrance, URSSAF, conventions collectives.
              </span>
              {lastFuelUpdate && (
                <Badge variant="outline" className="flex items-center gap-1 whitespace-nowrap">
                  <Clock className="h-3 w-3" />
                  Mise à jour : {formatLastUpdate(lastFuelUpdate)}
                </Badge>
              )}
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="fuel" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="fuel" className="flex items-center space-x-2">
                <Fuel className="h-4 w-4" />
                <span>Prix Carburant</span>
              </TabsTrigger>
              <TabsTrigger value="social" className="flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Indicateurs Sociaux</span>
              </TabsTrigger>
              <TabsTrigger value="allowances" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Grille Indemnités</span>
              </TabsTrigger>
            </TabsList>

            {/* Fuel Prices Tab */}
            <TabsContent value="fuel" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Prix Carburant en Temps Réel</h2>
                <Button variant="outline" size="sm" onClick={loadFuelPrices} disabled={isLoadingFuel}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingFuel ? "animate-spin" : ""}`} />
                  Actualiser
                </Button>
              </div>

              {isLoadingFuel ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2].map((i) => (
                    <Card key={i}>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <Skeleton className="h-6 w-24" />
                          <Skeleton className="h-8 w-32" />
                          <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-12 w-full" />
                            <Skeleton className="h-12 w-full" />
                          </div>
                          <Skeleton className="h-8 w-full" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : fuelError ? (
                <Alert variant="destructive">
                  <AlertDescription>{fuelError} - Données de démonstration affichées.</AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {fuelPrices.map((fuel) => (
                    <FuelPriceCard key={fuel.type} fuelData={fuel} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Social Indicators Tab */}
            <TabsContent value="social" className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">Indicateurs Sociaux</h2>
              <SocialIndicatorsGrid indicators={socialIndicators} />
            </TabsContent>

            {/* Allowances Tab */}
            <TabsContent value="allowances" className="space-y-6">
              <AllowancesTable />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
