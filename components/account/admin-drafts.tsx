"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FileText, Search, Edit, Trash2, Plus } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface Draft {
  id: string
  title: string
  content: string
  status: "draft" | "processing" | "completed"
  createdAt: string
  updatedAt: string
}

export function AdminDrafts() {
  const { user } = useAuth()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (user?.role === "admin") {
      // Load drafts from localStorage
      const stored = localStorage.getItem("admin_regulation_drafts")
      if (stored) {
        setDrafts(JSON.parse(stored))
      } else {
        // Mock data for demo
        const mockDrafts: Draft[] = [
          {
            id: "1",
            title: "Nouvelle réglementation temps de repos 2024",
            content: "Projet de réglementation européenne concernant l'extension des temps de repos obligatoires...",
            status: "draft",
            createdAt: "2024-01-15T10:00:00Z",
            updatedAt: "2024-01-20T14:30:00Z",
          },
          {
            id: "2",
            title: "Évolution chronotachygraphe intelligent",
            content: "Nouvelles fonctionnalités du chronotachygraphe de nouvelle génération...",
            status: "completed",
            createdAt: "2024-01-10T09:00:00Z",
            updatedAt: "2024-01-18T16:45:00Z",
          },
        ]
        setDrafts(mockDrafts)
        localStorage.setItem("admin_regulation_drafts", JSON.stringify(mockDrafts))
      }
    }
  }, [user])

  const filteredDrafts = drafts.filter(
    (draft) =>
      draft.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      draft.content.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const deleteDraft = (id: string) => {
    const updated = drafts.filter((draft) => draft.id !== id)
    setDrafts(updated)
    localStorage.setItem("admin_regulation_drafts", JSON.stringify(updated))
  }

  const getStatusColor = (status: Draft["status"]) => {
    switch (status) {
      case "draft":
        return "secondary"
      case "processing":
        return "default"
      case "completed":
        return "outline"
      default:
        return "secondary"
    }
  }

  const getStatusLabel = (status: Draft["status"]) => {
    switch (status) {
      case "draft":
        return "Brouillon"
      case "processing":
        return "En traitement"
      case "completed":
        return "Terminé"
      default:
        return "Brouillon"
    }
  }

  if (user?.role !== "admin") {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Brouillons Réglementations
            </CardTitle>
            <CardDescription>Gérez vos projets de synthèses réglementaires</CardDescription>
          </div>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nouveau brouillon
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans vos brouillons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredDrafts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {drafts.length === 0 ? (
                <div>
                  <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Aucun brouillon trouvé</p>
                  <p className="text-sm">Créez votre premier brouillon de réglementation</p>
                </div>
              ) : (
                <p>Aucun brouillon ne correspond à votre recherche</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDrafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium truncate">{draft.title}</h4>
                      <Badge variant={getStatusColor(draft.status)} className="text-xs">
                        {getStatusLabel(draft.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-2">{draft.content.substring(0, 100)}...</p>
                    <p className="text-xs text-muted-foreground">
                      Modifié le : {new Date(draft.updatedAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteDraft(draft.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
