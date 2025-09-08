"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, AlertTriangle, Clock, Truck, Car, Euro, Shield, Users } from "lucide-react"

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

const REGULATIONS: Regulation[] = [
  {
    id: "euro7",
    category: "Environnement",
    scope: "UE",
    title: "Norme Euro 7 - Application progressive",
    summary: "Nouvelle norme anti-pollution avec exigences renforcées sur les freins, particules et durabilité des batteries. Application selon catégories de véhicules entre 2026 et 2029.",
    deadline: "29 novembre 2026",
    urgency: "Important",
    impact: "Renouvellement de flotte nécessaire",
    sources: [
      { label: "eur-lex.europa.eu", href: "https://eur-lex.europa.eu/" },
      { label: "consilium.europa.eu", href: "https://www.consilium.europa.eu/" }
    ]
  },
  {
    id: "peages-co2",
    category: "Fiscalité",
    scope: "France/UE",
    title: "Péages différenciés selon CO2",
    summary: "Modulation obligatoire des péages poids lourds selon les classes CO2 et mise en place d'une redevance 'coûts externes' pour la pollution atmosphérique.",
    deadline: "25 mars 2026",
    urgency: "Important",
    impact: "Augmentation des coûts de transport",
    sources: [
      { label: "vie-publique.fr", href: "https://www.vie-publique.fr/" },
      { label: "transport.ec.europa.eu", href: "https://transport.ec.europa.eu/" }
    ]
  },
  {
    id: "eco-redevance-alsace",
    category: "Fiscalité",
    scope: "France",
    title: "Éco-redevance PL Alsace",
    summary: "Mise en place du R-Pass pour les poids lourds sur les autoroutes A35 et A36. Tarification d'environ 0,15€/km pour financer les mobilités.",
    deadline: "Janvier 2027",
    urgency: "Modéré",
    impact: "Coût supplémentaire sur les axes alsaciens",
    sources: [
      { label: "alsace.eu", href: "https://www.alsace.eu/" },
      { label: "francebleu.fr", href: "https://www.francebleu.fr/" }
    ]
  },
]

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

export default function ProchainesReglementationsPage() {
  const categories = [...new Set(REGULATIONS.map(r => r.category))]
  const criticalRegulations = REGULATIONS.filter(r => r.urgency === "Critique")
  const upcomingDeadlines = REGULATIONS.filter(r => {
    const deadline = new Date(r.deadline)
    const now = new Date()
    const diffTime = deadline.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 90 && diffDays > 0
  })

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

          {/* Échéances à venir */}
          {upcomingDeadlines.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-800">
                  <Calendar className="h-5 w-5 mr-2" />
                  Échéances dans les 3 mois
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {upcomingDeadlines.map((reg) => (
                    <div key={reg.id} className="p-3 bg-white rounded-lg border border-orange-200">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-orange-900 text-sm">{reg.title}</h4>
                        <Badge className={getScopeColor(reg.scope)} variant="outline">{reg.scope}</Badge>
                      </div>
                      <p className="text-xs text-orange-700 font-medium">{reg.deadline}</p>
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
                  {REGULATIONS.filter(r => r.category === category).map((regulation) => (
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
                  Cette veille réglementaire est mise à jour régulièrement. 
                  Pour des informations détaillées, consultez les sources officielles ou contactez nos experts.
                </p>
                <p className="mt-2">
                  Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}


