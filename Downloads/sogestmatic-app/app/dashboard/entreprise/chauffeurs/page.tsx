"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Eye, Mail, Phone, User, AlertTriangle, UserCheck, UserX, Loader2 } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { createChauffeurAccount, getChauffeursForEntreprise, ChauffeurProfile } from "@/lib/auth"
import { useChauffeursWithInfractions } from "@/lib/hooks/useChauffeursWithInfractions"
import { toast } from "sonner"

import { DateRangePicker } from "@/components/ui/date-range-picker"
import type { DateRange } from "react-day-picker"

interface ChauffeurWithStats {
  uid: string
  nomComplet: string
  email: string
  telephone?: string
  dateCreation: Date
  totalInfractions: number
  totalFichiers: number
  derniereActivite?: Date
  statut: 'Actif' | 'Inactif'
}

export default function ChauffeursPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    nom: "",
    email: "",
    telephone: "",
    password: "",
  })
  const { userProfile } = useAuth()
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  
  // Utiliser le nouveau hook avec les statistiques d'infractions
  const { chauffeurs: chauffeursData, loading: chauffeursLoading, error: chauffeursError, refetch } = useChauffeursWithInfractions(userProfile?.uid || '')

  // Filtrer les chauffeurs selon la période sélectionnée
  const chauffeursFiltres = chauffeursData.filter(chauffeur => {
    if (!dateRange?.from || !dateRange?.to) {
      return true // Afficher tous les chauffeurs si pas de filtre
    }
    
    const dateCreation = chauffeur.dateCreation instanceof Date ? 
      chauffeur.dateCreation : 
      new Date(chauffeur.dateCreation)
    
    return dateCreation >= dateRange.from && dateCreation <= dateRange.to
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!userProfile || userProfile.role !== 'entreprise') {
      toast.error("Seules les entreprises peuvent ajouter des chauffeurs")
      return
    }

    setIsLoading(true)

    try {
      await createChauffeurAccount(
        formData.email,
        formData.password,
        formData.nom,
        userProfile.uid,
        formData.telephone || undefined
      )

      // Recharger la liste des chauffeurs
      refetch()

      toast.success("Chauffeur ajouté avec succès !")
      setIsDialogOpen(false)
      setFormData({ nom: "", email: "", telephone: "", password: "" })
    } catch (error: any) {
      console.error("Erreur lors de l'ajout du chauffeur:", error)
      
      let errorMessage = "Erreur lors de l'ajout du chauffeur"
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Cet email est déjà utilisé"
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Le mot de passe doit contenir au moins 6 caractères"
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Format d'email invalide"
      }
      
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }



  if (chauffeursLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Chargement des chauffeurs...</span>
      </div>
    )
  }

  if (chauffeursError) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Erreur de chargement</h3>
        <p className="text-gray-600">{chauffeursError}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des chauffeurs</h1>
          <p className="text-gray-600">Liste et statistiques de vos chauffeurs</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un chauffeur
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ajouter un nouveau chauffeur</DialogTitle>
              <DialogDescription>Remplissez les informations du nouveau chauffeur</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom complet</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Jean Dupont"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jean.dupont@transport.fr"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telephone">Téléphone (optionnel)</Label>
                <Input
                  id="telephone"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="06 12 34 56 78"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Mot de passe (min. 6 caractères)"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Ajout..." : "Ajouter"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtre par période */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrer les chauffeurs par date de création</CardTitle>
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
                📅 {chauffeursFiltres.length} chauffeur(s) créé(s) sur la période sélectionnée
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
            <CardTitle className="text-sm font-medium">Total Chauffeurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{chauffeursFiltres.length}</div>
            <p className="text-xs text-gray-600">
              {dateRange ? 'sur la période' : 'au total'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Chauffeurs Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{chauffeursFiltres.length}</div>
            <p className="text-xs text-gray-600">100% de la flotte</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ajoutés ce mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {chauffeursFiltres.filter(c => {
                const dateCreation = c.dateCreation instanceof Date ? c.dateCreation : new Date(c.dateCreation)
                const now = new Date()
                const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                return dateCreation >= thisMonth
              }).length}
            </div>
            <p className="text-xs text-gray-600">nouveaux chauffeurs</p>
          </CardContent>
        </Card>
      </div>

      {/* Chauffeurs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des chauffeurs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead className="hidden sm:table-cell">Contact</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-center">Infractions</TableHead>
                  <TableHead className="hidden md:table-cell">Dernier fichier</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chauffeursLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <span className="text-gray-500">Chargement des chauffeurs...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : chauffeursError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-red-500">
                      Erreur lors du chargement : {chauffeursError}
                    </TableCell>
                  </TableRow>
                ) : chauffeursFiltres.length > 0 ? chauffeursFiltres.map((chauffeur) => (
                  <TableRow key={chauffeur.uid}>
                    <TableCell className="font-medium">{chauffeur.nomComplet}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-3 w-3 mr-1" />
                          {chauffeur.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-3 w-3 mr-1" />
                          {chauffeur.telephone || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                                              <Badge
                          variant="default"
                          className={chauffeur.statut === 'Actif' 
                            ? "bg-green-100 text-green-800" 
                            : "bg-gray-100 text-gray-800"
                          }
                        >
                          {chauffeur.statut}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={chauffeur.totalInfractions === 0 
                          ? "border-green-200 text-green-700" 
                          : chauffeur.totalInfractions <= 5 
                            ? "border-orange-200 text-orange-700"
                            : "border-red-200 text-red-700"
                        }
                      >
                        {chauffeur.totalInfractions}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-gray-600">
                      {chauffeur.derniereActivite 
                        ? chauffeur.derniereActivite.toLocaleDateString('fr-FR')
                        : 'Jamais'
                      }
                    </TableCell>
                    <TableCell className="text-center">
                      <Link href={`/dashboard/entreprise/chauffeur/${chauffeur.uid}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Aucun chauffeur trouvé. Ajoutez votre premier chauffeur en cliquant sur le bouton "Ajouter un chauffeur".
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
