"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, History, FileText, Calendar } from "lucide-react"
import { GPTService, type RegulationSummary } from "@/lib/gpt-service"
import { SummaryDisplay } from "./summary-display"

interface SummariesHistoryProps {
  onSelectSummary: (summary: RegulationSummary) => void
  refreshTrigger?: number
}

export function SummariesHistory({ onSelectSummary, refreshTrigger }: SummariesHistoryProps) {
  const [summaries, setSummaries] = useState<RegulationSummary[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const gptService = GPTService.getInstance()

  useEffect(() => {
    loadSummaries()
  }, [refreshTrigger])

  const loadSummaries = () => {
    const stored = gptService.getSummariesFromStorage()
    setSummaries(stored)
  }

  const handleDelete = (id: string) => {
    gptService.deleteSummary(id)
    loadSummaries()
    if (selectedId === id) {
      setSelectedId(null)
    }
  }

  const filteredSummaries = summaries.filter(
    (summary) =>
      summary.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      summary.summary.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (summaries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Historique des synthèses</CardTitle>
          </div>
          <CardDescription>Aucune synthèse générée pour le moment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Les synthèses générées apparaîtront ici</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="h-5 w-5 text-primary" />
              <CardTitle>Historique des synthèses</CardTitle>
            </div>
            <Badge variant="secondary">
              {summaries.length} synthèse{summaries.length > 1 ? "s" : ""}
            </Badge>
          </div>
          <CardDescription>Consultez et gérez les synthèses précédentes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher dans les synthèses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Summaries List */}
            <div className="space-y-3">
              {filteredSummaries.map((summary) => (
                <div
                  key={summary.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedId === summary.id ? "border-primary bg-primary/5" : "border-border"
                  }`}
                  onClick={() => {
                    setSelectedId(summary.id)
                    onSelectSummary(summary)
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1 line-clamp-2">{summary.title}</h4>
                      <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(summary.generatedAt)}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          GPT-5
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(summary.id)
                      }}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {filteredSummaries.length === 0 && searchTerm && (
              <div className="text-center py-4 text-muted-foreground">
                <p>Aucune synthèse trouvée pour "{searchTerm}"</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Summary Display */}
      {selectedId && (
        <div className="space-y-4">
          {(() => {
            const selectedSummary = summaries.find((s) => s.id === selectedId)
            return selectedSummary ? (
              <SummaryDisplay summary={selectedSummary} onDelete={handleDelete} showDeleteButton={true} />
            ) : null
          })()}
        </div>
      )}
    </div>
  )
}
