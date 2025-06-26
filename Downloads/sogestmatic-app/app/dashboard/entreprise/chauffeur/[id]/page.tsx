"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Download, AlertTriangle, Calendar, MapPin, Loader2 } from "lucide-react"
import Link from "next/link"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useChauffeurDetails } from "@/lib/hooks/useChauffeurDetails"
import { genererRapportPDF, formaterInfractionsRapport } from "@/lib/pdfGenerator"
import { toast } from "sonner"
import { use } from "react"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import type { DateRange } from "react-day-picker"

export default function ChauffeurDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { chauffeur, loading, error } = useChauffeurDetails(id)
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  // Filtrer les infractions selon la période sélectionnée
  const infractionsFiltrees = chauffeur?.infractions?.filter(infraction => {
    if (!dateRange?.from || !dateRange?.to) {
      return true // Afficher toutes les infractions si pas de filtre
    }
    
    const dateInfraction = infraction.dateDetection instanceof Date ? 
      infraction.dateDetection : 
      new Date(infraction.dateDetection)
    
    return dateInfraction >= dateRange.from && dateInfraction <= dateRange.to
  }) || []

  const handleGenerateReport = async () => {
    if (!chauffeur) {
      toast.error('Données du chauffeur non disponibles')
      return
    }

    try {
      toast.info('Génération du rapport en cours...')
      
      // Utiliser les infractions filtrées pour le rapport
      const infractions = infractionsFiltrees.map((inf, index) => ({
        id: inf.id,
        type: inf.type,
        date: inf.dateDetection.toLocaleDateString('fr-FR'),
        dateDetection: inf.dateDetection,
        fichier: inf.fichierSource,
        fichierSource: inf.fichierSource,
        gravite: inf.gravite,
        valeur: '-',
        lieu: '-',
        peineEncorue: 'À déterminer'
      }))

      // Titre du rapport selon le filtre
      let periodeText = ''
      if (dateRange?.from && dateRange?.to) {
        periodeText = `Du ${dateRange.from.toLocaleDateString('fr-FR')} au ${dateRange.to.toLocaleDateString('fr-FR')}`
      } else {
        periodeText = `Période: ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
      }

      // Générer le PDF
      await genererRapportPDF({
        titre: `Rapport Personnel - ${chauffeur.nomComplet}`,
        entreprise: chauffeur.email,
        periode: periodeText,
        infractions,
        typeRapport: 'chauffeur'
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
        <span className="ml-2 text-gray-600">Chargement des données du chauffeur...</span>
      </div>
    )
  }

  if (error || !chauffeur) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
        <p className="text-gray-600">{error || 'Chauffeur non trouvé'}</p>
        <Link href="/dashboard/entreprise/chauffeurs">
          <Button className="mt-4" variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/entreprise/chauffeurs">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{chauffeur.nomComplet}</h1>
            <p className="text-gray-600">Chauffeur - ID: {id}</p>
          </div>
        </div>
        <Button 
          className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700"
          onClick={handleGenerateReport}
        >
          <Download className="h-4 w-4 mr-2" />
          Télécharger rapport PDF
        </Button>
      </div>

      {/* Filtre par période */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrer les infractions par période</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <DateRangePicker
                date={dateRange}
                onDateChange={setDateRange}
                className="max-w-md"
                showPresets={true}
              />
            </div>
            {dateRange?.from && dateRange?.to && (
              <div className="text-sm text-gray-600">
                📅 {infractionsFiltrees.length} infraction(s) sur la période sélectionnée
              </div>
            )}
            {dateRange && (
              <Button 
                variant="outline" 
                onClick={() => setDateRange(undefined)}
                size="sm"
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Infractions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {dateRange?.from && dateRange?.to ? infractionsFiltrees.length : chauffeur.totalInfractions}
            </div>
            <p className="text-xs text-gray-600">
              {dateRange?.from && dateRange?.to ? 'Sur la période' : 'Au total'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Dernière Infraction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {chauffeur.derniereInfraction ? chauffeur.derniereInfraction.toLocaleDateString('fr-FR') : 'Aucune'}
            </div>
            <p className="text-xs text-gray-600">
              {chauffeur.derniereInfraction ? 
                `Il y a ${Math.floor((Date.now() - chauffeur.derniereInfraction.getTime()) / (1000 * 60 * 60 * 24))} jours` : 
                'Pas d\'infraction'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fichiers Analysés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{chauffeur.totalFichiers}</div>
            <p className="text-xs text-gray-600">Fichiers traités</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Moyenne par Fichier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {chauffeur.totalFichiers > 0 ? 
                Math.round((chauffeur.totalInfractions / chauffeur.totalFichiers) * 10) / 10 : 
                0
              }
            </div>
            <p className="text-xs text-gray-600">Infractions par fichier</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution des infractions (12 dernières semaines)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chauffeur.infractionsParSemaine}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="semaine" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="infractions" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Informations du chauffeur */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du chauffeur</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Email</p>
              <p className="text-gray-900">{chauffeur.email}</p>
            </div>
            {chauffeur.telephone && (
              <div>
                <p className="text-sm font-medium text-gray-700">Téléphone</p>
                <p className="text-gray-900">{chauffeur.telephone}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-700">Date de création du compte</p>
              <p className="text-gray-900">{chauffeur.dateCreation.toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Statut</p>
              <div className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${chauffeur.totalInfractions === 0 ? 'bg-green-500' : chauffeur.totalInfractions < 5 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                <span className={`text-sm font-medium ${chauffeur.totalInfractions === 0 ? 'text-green-700' : chauffeur.totalInfractions < 5 ? 'text-yellow-700' : 'text-red-700'}`}>
                  {chauffeur.totalInfractions === 0 ? 'Excellent' : chauffeur.totalInfractions < 5 ? 'Bon' : 'À surveiller'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Infractions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
            Liste des infractions ({chauffeur.infractions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chauffeur.infractions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type d'infraction</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                    <TableHead className="hidden md:table-cell">Fichier source</TableHead>
                    <TableHead>Gravité</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {chauffeur.infractions.map((infraction) => (
                    <TableRow key={infraction.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                          {infraction.type}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                          {infraction.dateDetection.toLocaleDateString('fr-FR')}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                          <span className="truncate max-w-[150px]">{infraction.fichierSource}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            infraction.gravite === "Grave"
                              ? "border-red-200 text-red-700 bg-red-50"
                              : infraction.gravite === "Majeure"
                                ? "border-orange-200 text-orange-700 bg-orange-50"
                                : "border-yellow-200 text-yellow-700 bg-yellow-50"
                          }
                        >
                          {infraction.gravite}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Aucune infraction enregistrée</p>
              <p className="text-sm">Ce chauffeur n'a pas d'infractions dans ses fichiers.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
