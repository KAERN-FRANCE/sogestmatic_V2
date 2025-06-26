"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, FileText, Download, Calendar, User, CalendarIcon, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/AuthContext"
import { getChauffeursForEntreprise, ChauffeurProfile } from "@/lib/auth"
import { 
  traiterFichierUploade, 
  getFichiersEntreprise, 
  FichierUploade,
  formatFileSize,
  supprimerFichier 
} from "@/lib/fileService"
import { detecterPlagesDates } from '@/lib/excelAnalyzer'
import { toast } from "sonner"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import type { DateRange } from "react-day-picker"

export default function FichiersPage() {
  const { userProfile } = useAuth()
  const [selectedChauffeur, setSelectedChauffeur] = useState("")
  const [dragActive, setDragActive] = useState(false)
  const [chauffeurs, setChauffeurs] = useState<ChauffeurProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [fichiers, setFichiers] = useState<FichierUploade[]>([])
  const [uploading, setUploading] = useState(false)
  const [dateDebut, setDateDebut] = useState("")
  const [dateFin, setDateFin] = useState("")
  const [detectionAuto, setDetectionAuto] = useState(false)
  const [datesDetectees, setDatesDetectees] = useState<{ dateMin: Date; dateMax: Date } | null>(null)
  const [filterDateRange, setFilterDateRange] = useState<DateRange | undefined>()

  // Filtrer les fichiers selon la période sélectionnée
  const fichiersFiltres = fichiers.filter(fichier => {
    if (!filterDateRange?.from || !filterDateRange?.to) {
      return true // Afficher tous les fichiers si pas de filtre
    }
    
    let dateUpload: Date
    if (fichier.dateUpload instanceof Date) {
      dateUpload = fichier.dateUpload
    } else if (typeof fichier.dateUpload === 'object' && fichier.dateUpload && 'toDate' in fichier.dateUpload) {
      dateUpload = (fichier.dateUpload as any).toDate()
    } else {
      dateUpload = new Date(fichier.dateUpload)
    }
    
    return dateUpload >= filterDateRange.from && dateUpload <= filterDateRange.to
  })

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile || userProfile.role !== 'entreprise') {
        setLoading(false)
        return
      }

      try {
        // Récupérer les chauffeurs
        const entrepriseChauffeurs = await getChauffeursForEntreprise(userProfile.uid)
        setChauffeurs(entrepriseChauffeurs)
        
        // Essayer de récupérer les fichiers (peut échouer si les règles ne sont pas configurées)
        try {
          const entrepriseFichiers = await getFichiersEntreprise(userProfile.uid)
          setFichiers(entrepriseFichiers)
        } catch (fileError) {
          console.warn('Les règles Firestore ne sont pas encore configurées pour les fichiers:', fileError)
          // Initialiser avec un tableau vide - les fichiers uploadés apparaîtront quand même
          setFichiers([])
          toast.info('Configuration Firebase en cours. Les fichiers uploadés s\'afficheront automatiquement.')
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error)
        toast.error('Erreur lors de la récupération des données')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [userProfile])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files))
    }
  }

  const handleFiles = async (files: File[]) => {
    if (!selectedChauffeur || !userProfile) {
      toast.error('Veuillez sélectionner un chauffeur')
      return
    }

    let dateDebutObj: Date | undefined
    let dateFinObj: Date | undefined

    // Si détection automatique est activée, essayer de détecter les dates des fichiers Excel
    if (detectionAuto) {
      const fichiersExcel = files.filter(file => 
        file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')
      )
      
      if (fichiersExcel.length > 0) {
        try {
          const plageDetectee = await detecterPlagesDates(fichiersExcel[0])
          if (plageDetectee) {
            dateDebutObj = plageDetectee.dateMin
            dateFinObj = plageDetectee.dateMax
            setDatesDetectees(plageDetectee)
            toast.success(`Dates détectées automatiquement : du ${plageDetectee.dateMin.toLocaleDateString('fr-FR')} au ${plageDetectee.dateMax.toLocaleDateString('fr-FR')}`)
          } else {
            toast.warning('Impossible de détecter automatiquement les dates. Veuillez les saisir manuellement.')
            setDetectionAuto(false)
            return
          }
        } catch (error) {
          toast.error('Erreur lors de la détection automatique des dates')
          setDetectionAuto(false)
          return
        }
      } else {
        toast.warning('La détection automatique ne fonctionne qu\'avec les fichiers Excel (.xlsx, .xls)')
        return
      }
    } else {
      // Mode manuel
      if (!dateDebut || !dateFin) {
        toast.error('Veuillez sélectionner les dates de début et fin d\'analyse')
        return
      }

      dateDebutObj = new Date(dateDebut)
      dateFinObj = new Date(dateFin)
      
      if (dateFinObj < dateDebutObj) {
        toast.error('La date de fin doit être postérieure à la date de début')
        return
      }
    }

    const chauffeurSelectionne = chauffeurs.find(c => c.uid === selectedChauffeur)
    if (!chauffeurSelectionne) {
      toast.error('Chauffeur introuvable')
      return
    }

    setUploading(true)
    
    try {
      for (const file of files) {
        // Vérifier la taille du fichier (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`Le fichier ${file.name} est trop volumineux (max 10MB)`)
          continue
        }

        // Vérifier le type de fichier
        const allowedTypes = ['.ddd', '.xlsx', '.xls', '.csv']
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
        if (!allowedTypes.includes(fileExtension)) {
          toast.error(`Type de fichier non supporté: ${file.name}`)
          continue
        }

        toast.info(`Upload de ${file.name} en cours...`)

        // Traiter le fichier
        const fichierTraite = await traiterFichierUploade(
          file,
          chauffeurSelectionne.uid,
          chauffeurSelectionne.nomComplet,
          userProfile.uid,
          dateDebutObj,
          dateFinObj
        )

        // Ajouter le fichier à la liste
        setFichiers(prev => [fichierTraite, ...prev])

        // Message de succès selon le résultat
        if (fichierTraite.statut === 'Traité') {
          toast.success(`${file.name} traité avec succès. ${fichierTraite.nbInfractions} infractions détectées.`)
        } else if (fichierTraite.statut === 'Erreur') {
          toast.error(`Erreur lors du traitement de ${file.name}`)
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error)
      toast.error('Erreur lors de l\'upload des fichiers')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = async (fichier: FichierUploade) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le fichier "${fichier.nom}" ?`)) {
      return
    }

    try {
      await supprimerFichier(fichier)
      
      // Retirer le fichier de la liste locale
      setFichiers(prev => prev.filter(f => f.id !== fichier.id))
      
      toast.success(`Fichier "${fichier.nom}" supprimé avec succès`)
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Erreur lors de la suppression du fichier')
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des fichiers</h1>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestion des fichiers</h1>
        <p className="text-gray-600">Upload et gestion des fichiers tachygraphiques</p>
      </div>

      {/* Filtre par période */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrer les fichiers par période</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex-1">
              <DateRangePicker
                date={filterDateRange}
                onDateChange={setFilterDateRange}
                className="max-w-md"
                showPresets={true}
              />
            </div>
            {filterDateRange?.from && filterDateRange?.to && (
              <div className="text-sm text-gray-600">
                📅 {fichiersFiltres.length} fichier(s) sur la période sélectionnée
              </div>
            )}
            {filterDateRange && (
              <Button 
                variant="outline" 
                onClick={() => setFilterDateRange(undefined)}
                size="sm"
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chauffeur Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Sélection du chauffeur
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedChauffeur} onValueChange={setSelectedChauffeur}>
              <SelectTrigger>
                <SelectValue placeholder={chauffeurs.length > 0 ? "Choisir un chauffeur" : "Aucun chauffeur disponible"} />
              </SelectTrigger>
              <SelectContent>
                {chauffeurs.map((chauffeur) => (
                  <SelectItem key={chauffeur.uid} value={chauffeur.uid}>
                    {chauffeur.nomComplet}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {chauffeurs.length === 0 && (
              <p className="text-sm text-gray-500 mt-2">
                Aucun chauffeur enregistré. Ajoutez des chauffeurs dans la section "Chauffeurs".
              </p>
            )}
          </CardContent>
        </Card>

        {/* Period Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarIcon className="h-5 w-5 mr-2" />
              Période d'analyse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Option de détection automatique */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="detectionAuto"
                checked={detectionAuto}
                onChange={(e) => {
                  setDetectionAuto(e.target.checked)
                  if (e.target.checked) {
                    setDateDebut("")
                    setDateFin("")
                    setDatesDetectees(null)
                  }
                }}
                className="rounded border-gray-300"
              />
              <Label htmlFor="detectionAuto" className="text-sm font-medium">
                Détection automatique des dates (fichiers Excel uniquement)
              </Label>
            </div>

            {/* Affichage des dates détectées ou sélection manuelle */}
            {detectionAuto ? (
              <div>
                {datesDetectees ? (
                  <div className="text-sm text-green-700 bg-green-50 p-3 rounded border border-green-200">
                    <CalendarIcon className="h-4 w-4 inline mr-1" />
                    <strong>Dates détectées automatiquement :</strong><br />
                    Du {datesDetectees.dateMin.toLocaleDateString('fr-FR')} au {datesDetectees.dateMax.toLocaleDateString('fr-FR')}
                  </div>
                ) : (
                  <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded border border-blue-200">
                    <CalendarIcon className="h-4 w-4 inline mr-1" />
                    Les dates seront détectées automatiquement lors de l'upload du fichier Excel
                  </div>
                )}
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="dateDebut">Date de début</Label>
                  <Input
                    id="dateDebut"
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="dateFin">Date de fin</Label>
                  <Input
                    id="dateFin"
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    className="mt-1"
                  />
                </div>
                {dateDebut && dateFin && (
                  <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                    <CalendarIcon className="h-4 w-4 inline mr-1" />
                    Analyse des données du {new Date(dateDebut).toLocaleDateString('fr-FR')} au {new Date(dateFin).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2" />
              Upload de fichiers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"
              } ${!selectedChauffeur || chauffeurs.length === 0 || uploading || (!detectionAuto && (!dateDebut || !dateFin)) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className={`h-8 w-8 mx-auto mb-4 ${uploading ? "animate-bounce text-blue-500" : "text-gray-400"}`} />
              {uploading ? (
                <p className="text-sm text-blue-600 mb-2">Upload en cours...</p>
              ) : (
                <p className="text-sm text-gray-600 mb-2">Glissez-déposez vos fichiers ici ou</p>
              )}
              <input
                type="file"
                multiple
                accept=".ddd,.xlsx,.xls,.csv"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
                disabled={!selectedChauffeur || chauffeurs.length === 0 || uploading || (!detectionAuto && (!dateDebut || !dateFin))}
              />
              <label htmlFor="file-upload">
                <Button 
                  variant="outline" 
                  className="cursor-pointer" 
                  disabled={!selectedChauffeur || chauffeurs.length === 0 || uploading || (!detectionAuto && (!dateDebut || !dateFin))} 
                  asChild
                >
                  <span>{uploading ? "Upload en cours..." : "Parcourir les fichiers"}</span>
                </Button>
              </label>
              <p className="text-xs text-gray-500 mt-2">Formats acceptés: .ddd, .xlsx, .xls, .csv (max 10MB)</p>
              {!detectionAuto && (!dateDebut || !dateFin) && (
                <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded">
                  💡 Sélectionnez une période d'analyse ou activez la détection automatique pour activer l'upload
                </p>
              )}
              {detectionAuto && (
                <p className="text-xs text-blue-600 mt-2 bg-blue-50 p-2 rounded">
                  🔍 Mode détection automatique activé - les dates seront extraites du fichier Excel
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fichiers ce mois</p>
                <p className="text-2xl font-bold">{fichiers.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Traités</p>
                <p className="text-2xl font-bold text-green-600">
                  {fichiers.filter(f => f.statut === 'Traité').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">✓</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En cours</p>
                <p className="text-2xl font-bold text-orange-600">
                  {fichiers.filter(f => f.statut === 'En cours').length}
                </p>
              </div>
              <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-bold">⏳</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Infractions</p>
                <p className="text-2xl font-bold text-red-600">
                  {fichiers.reduce((total, f) => total + f.nbInfractions, 0)}
                </p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold">⚠</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fichiers récents</CardTitle>
        </CardHeader>
        <CardContent>
          {fichiers.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-2">Aucun fichier pour le moment</p>
              <p className="text-sm text-gray-500">
                Uploadez votre premier fichier pour commencer l'analyse
              </p>
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom du fichier</TableHead>
                  <TableHead className="hidden sm:table-cell">Chauffeur</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Taille</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                  <TableHead className="hidden xl:table-cell">Période d'analyse</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fichiersFiltres.map((fichier) => (
                  <TableRow key={fichier.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="truncate max-w-[200px]">{fichier.nom}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{fichier.chauffeurNom}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          fichier.type === "DDD" ? "border-blue-200 text-blue-700" : "border-green-200 text-green-700"
                        }
                      >
                        {fichier.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-gray-600">{fichier.tailleFormatee}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-3 w-3 mr-1" />
                        {fichier.dateUpload.toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      {fichier.dateDebut && fichier.dateFin ? (
                        <div className="text-sm text-gray-600">
                          <div>{fichier.dateDebut.toLocaleDateString('fr-FR')}</div>
                          <div className="text-xs text-gray-400">au {fichier.dateFin.toLocaleDateString('fr-FR')}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">Non spécifiée</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          fichier.statut === "Traité"
                            ? "border-green-200 text-green-700 bg-green-50"
                            : fichier.statut === "En cours"
                              ? "border-orange-200 text-orange-700 bg-orange-50"
                              : "border-red-200 text-red-700 bg-red-50"
                        }
                      >
                        {fichier.statut}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm" title="Télécharger">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteFile(fichier)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
