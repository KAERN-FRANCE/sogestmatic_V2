"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, AlertTriangle, Clock, Truck, Euro, Shield, Users, RefreshCw, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

type Regulation = {
  id: string
  category: "Chronotachygraphe" | "Environnement" | "Social" | "Sécurité" | "Fiscalité"
  scope: "UE" | "France" | "France/UE"
  title: string
  summary: string
  deadline: string
  urgency: "Critique" | "Important" | "Modéré"
  impact: string
  sources: { label: string; href: string }[]
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Chronotachygraphe": return <Clock className="h-4 w-4" />
    case "Environnement": return <Shield className="h-4 w-4" />
    case "Social": return <Users className="h-4 w-4" />
    case "Sécurité": return <AlertTriangle className="h-4 w-4" />
    case "Fiscalité": return <Euro className="h-4 w-4" />
    default: return <Truck className="h-4 w-4" />
  }
}

const getUrgencyColor = (urgency: string) => {
  switch (urgency) {
    case "Critique": return "bg-red-100 text-red-800 border-red-200"
    case "Important": return "bg-orange-100 text-orange-800 border-orange-200"
    case "Modéré": return "bg-blue-100 text-blue-800 border-blue-200"
    default: return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

const getScopeColor = (scope: string) => {
  switch (scope) {
    case "UE": return "bg-blue-100 text-blue-800 border-blue-200"
    case "France": return "bg-green-100 text-green-800 border-green-200"
    case "France/UE": return "bg-purple-100 text-purple-800 border-purple-200"
    default: return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

function formatLastUpdate(dateString: string | undefined): string {
  if (!dateString) return "Non disponible"
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return "Non disponible"
  }
}

const REGULATIONS_CACHE_KEY = 'sogestmatic_regulations'
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

export default function ProchainesReglementationsPage() {
  const [regulations, setRegulations] = useState<Regulation[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(REGULATIONS_CACHE_KEY)
        if (cached) {
          const { data } = JSON.parse(cached)
          return data || []
        }
      } catch {}
    }
    return []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<string | undefined>()

  useEffect(() => {
    // Check if we have valid cached data
    let shouldFetch = true
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(REGULATIONS_CACHE_KEY)
        if (cached) {
          const { data, timestamp, updatedAt } = JSON.parse(cached)
          if (Date.now() - timestamp < CACHE_DURATION && data?.length > 0) {
            setRegulations(data)
            setLastUpdate(updatedAt)
            setIsLoading(false)
            shouldFetch = false
          }
        }
      } catch {}
    }
    if (shouldFetch) {
      loadRegulations()
    }
  }, [])

  const loadRegulations = async (forceRefresh = false) => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/indicators/regulations${forceRefresh ? '?force=true' : ''}`)
      if (res.ok) {
        const json = await res.json()
        if (json.data && Array.isArray(json.data)) {
          setRegulations(json.data)
          setLastUpdate(json.updatedAt || new Date().toISOString())

          // Save to localStorage
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(REGULATIONS_CACHE_KEY, JSON.stringify({
                data: json.data,
                timestamp: Date.now(),
                updatedAt: json.updatedAt || new Date().toISOString()
              }))
            } catch {}
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement réglementations:', error)
    }
    setIsLoading(false)
  }

  const categories = [...new Set(regulations.map(r => r.category))]
  const criticalRegulations = regulations.filter(r => r.urgency === "Critique")

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary/30 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <Skeleton className="h-10 w-64 mx-auto" />
              <Skeleton className="h-6 w-96 mx-auto" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground">Veille transport</h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Veille réglementaire transport routier - France et Union Européenne
            </p>
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span>
                Données mises à jour automatiquement chaque semaine. Sources : EUR-Lex, Légifrance, Ministère des Transports.
              </span>
              <div className="flex items-center gap-2">
                {lastUpdate && (
                  <Badge variant="outline" className="flex items-center gap-1 whitespace-nowrap">
                    <Clock className="h-3 w-3" />
                    {formatLastUpdate(lastUpdate)}
                  </Badge>
                )}
                <Button variant="outline" size="sm" onClick={() => loadRegulations(true)} disabled={isLoading}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </AlertDescription>
          </Alert>

          {/* Alertes critiques */}
          {criticalRegulations.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center text-red-800">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Échéances Critiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {criticalRegulations.map((reg) => (
                    <div key={reg.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                      <div className="flex-1">
                        <h4 className="font-medium text-red-900">{reg.title}</h4>
                        <p className="text-sm text-red-700">{reg.deadline}</p>
                      </div>
                      <Badge className={getScopeColor(reg.scope)}>{reg.scope}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Réglementations par catégorie */}
          <div className="space-y-8">
            {categories.map((category) => (
              <div key={category}>
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  {getCategoryIcon(category)}
                  <span className="ml-2">{category}</span>
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {regulations.filter(r => r.category === category).map((regulation) => (
                    <Card key={regulation.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between mb-2">
                          <CardTitle className="text-lg leading-tight pr-4">{regulation.title}</CardTitle>
                          <div className="flex flex-col gap-1">
                            <Badge className={getScopeColor(regulation.scope)} variant="outline">
                              {regulation.scope}
                            </Badge>
                            <Badge className={getUrgencyColor(regulation.urgency)} variant="outline">
                              {regulation.urgency}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-1" />
                          Échéance : {regulation.deadline}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-sm text-muted-foreground leading-relaxed">
                          {regulation.summary}
                        </div>
                        <div className="bg-secondary/50 p-3 rounded-lg">
                          <h5 className="font-medium text-sm mb-1">Impact :</h5>
                          <p className="text-sm text-muted-foreground">{regulation.impact}</p>
                        </div>
                        {regulation.sources?.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Sources :</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {regulation.sources.map((source, i) => (
                                <a
                                  key={i}
                                  href={source.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline break-all"
                                >
                                  {source.label}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Note de bas de page */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="text-center text-sm text-muted-foreground">
                <p>
                  Cette veille réglementaire est mise à jour automatiquement chaque semaine.
                  Pour des informations détaillées, consultez les sources officielles ou contactez nos experts.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
