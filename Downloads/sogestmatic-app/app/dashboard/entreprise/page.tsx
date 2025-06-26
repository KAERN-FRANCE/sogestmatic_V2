"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Users, CheckCircle, TrendingUp, Download, Loader2 } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts"
import { useEntrepriseStats } from "@/lib/hooks/useEntrepriseStats"
import { genererRapportPDF, formaterInfractionsRapport } from "@/lib/pdfGenerator"
import { getFichiersEntreprise } from "@/lib/fileService"
import { useAuth } from "@/contexts/AuthContext"
import { toast } from "sonner"
import { debugInfractions, debugRapportData } from "@/lib/debugPDF"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import type { DateRange } from "react-day-picker"

export default function EntrepriseDashboard() {
  const { stats, loading, error } = useEntrepriseStats()
  const { userProfile } = useAuth()
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const handleGenerateReport = async () => {
    if (!userProfile || !stats) {
      toast.error('Données insuffisantes pour générer le rapport')
      return
    }

    try {
      toast.info('Génération du rapport en cours...')
      
      // Récupérer tous les fichiers de l'entreprise
      const fichiers = await getFichiersEntreprise(userProfile.uid)
      
      // 🔍 Débogage des données brutes
      debugInfractions(fichiers)
      
      // Formater les infractions pour le rapport
      const infractions = formaterInfractionsRapport(fichiers)
      
      // 🔍 Débogage des données formatées
      debugRapportData(infractions)
      
      // Période du rapport (dernier mois)
      let periode = ''
      if (dateRange?.from && dateRange?.to) {
        periode = `Du ${dateRange.from.toLocaleDateString('fr-FR')} au ${dateRange.to.toLocaleDateString('fr-FR')}`
      } else {
        const maintenant = new Date()
        periode = `Période: ${maintenant.toLocaleDateString('fr-FR', { 
          month: 'long', 
          year: 'numeric' 
        })}`
      }

      // Générer le PDF
      await genererRapportPDF({
        titre: 'Rapport Mensuel des Infractions',
        entreprise: userProfile.email || 'Entreprise',
        periode,
        infractions,
        typeRapport: 'entreprise'
      })

      toast.success('Rapport généré et téléchargé avec succès !')
      
    } catch (err) {
      console.error('Erreur lors de la génération du rapport:', err)
      toast.error('Erreur lors de la génération du rapport')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Chargement des statistiques...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    )
  }

  if (!stats) return null

  const getTendanceText = () => {
    switch (stats.tendance) {
      case 'amelioration':
        return { text: 'Amélioration', color: 'text-green-600', icon: 'text-green-500' }
      case 'degradation':
        return { text: 'Dégradation', color: 'text-red-600', icon: 'text-red-500' }
      default:
        return { text: 'Stable', color: 'text-blue-600', icon: 'text-blue-500' }
    }
  }

  const tendanceInfo = getTendanceText()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-600">Vue d'ensemble de votre flotte</p>
        </div>
        <Button 
          className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700"
          onClick={handleGenerateReport}
        >
          <Download className="h-4 w-4 mr-2" />
          Rapport mensuel
        </Button>
      </div>

      {/* Sélecteur de période */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrer par période</CardTitle>
          <CardDescription>
            Sélectionnez une période pour filtrer les données affichées dans les graphiques
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DateRangePicker
            date={dateRange}
            onDateChange={setDateRange}
            className="max-w-md"
            showPresets={true}
          />
          {dateRange?.from && dateRange?.to && (
            <p className="text-sm text-gray-600 mt-2">
              📅 Période sélectionnée : du {dateRange.from.toLocaleDateString('fr-FR')} 
              au {dateRange.to.toLocaleDateString('fr-FR')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Infractions</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInfractions}</div>
            <p className="text-xs text-gray-600">
              Total détecté dans les fichiers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chauffeurs</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChauffeurs}</div>
            <p className="text-xs text-gray-600">
              Chauffeurs enregistrés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux Conformité</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tauxConformite}%</div>
            <p className="text-xs text-gray-600">
              Basé sur l'intensité des infractions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendance</CardTitle>
            <TrendingUp className={`h-4 w-4 ${tendanceInfo.icon}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${tendanceInfo.color}`}>{tendanceInfo.text}</div>
            <p className="text-xs text-gray-600">
              {stats.tendance === 'amelioration' ? 'Moins' : stats.tendance === 'degradation' ? 'Plus' : 'Même nombre'} d'infractions ce mois
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Infractions par mois</CardTitle>
            <CardDescription>Évolution du nombre d'infractions sur 6 mois</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.infractionsParMois}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="infractions" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Types d'infractions</CardTitle>
            <CardDescription>Répartition des infractions par catégorie</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.typesInfractions.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.typesInfractions}
                    cx="40%"
                    cy="50%"
                    labelLine={false}
                    label={({ percent }) => `${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.typesInfractions.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                  <Legend 
                    verticalAlign="middle" 
                    align="right" 
                    layout="vertical"
                    iconType="circle"
                    wrapperStyle={{ 
                      paddingLeft: '20px', 
                      fontSize: '12px',
                      lineHeight: '18px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                  <p>Aucune infraction détectée</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution du taux de conformité</CardTitle>
          <CardDescription>Pourcentage de conformité réglementaire sur 6 mois</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.conformiteParMois}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis 
                allowDecimals={false}
                domain={[0, 100]}
                ticks={[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip formatter={(value) => [`${value}%`, 'Taux de conformité']} />
              <Line type="monotone" dataKey="taux" stroke="#10b981" strokeWidth={3} dot={{ fill: "#10b981" }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
