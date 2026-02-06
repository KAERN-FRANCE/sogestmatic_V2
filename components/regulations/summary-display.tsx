"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Calendar, FileText, TrendingUp, Trash2 } from "lucide-react"
import type { RegulationSummary } from "@/lib/gpt-service"

interface SummaryDisplayProps {
  summary: RegulationSummary
  onDelete?: (id: string) => void
  showDeleteButton?: boolean
}

export function SummaryDisplay({ summary, onDelete, showDeleteButton = false }: SummaryDisplayProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatContent = (content: string) => {
    // Convert markdown-like formatting to JSX
    return content.split("\n").map((line, index) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <h4 key={index} className="font-semibold text-foreground mt-4 mb-2">
            {line.slice(2, -2)}
          </h4>
        )
      }
      if (line.startsWith("• ")) {
        return (
          <li key={index} className="ml-4 text-muted-foreground">
            {line.slice(2)}
          </li>
        )
      }
      if (line.trim() === "") {
        return <br key={index} />
      }
      return (
        <p key={index} className="text-muted-foreground mb-2">
          {line}
        </p>
      )
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{summary.title}</CardTitle>
            <CardDescription className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Généré le {formatDate(summary.generatedAt)}</span>
              </div>
              <Badge variant="secondary">IA GPT-5</Badge>
            </CardDescription>
          </div>
          {showDeleteButton && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(summary.id)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Section */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <FileText className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Résumé</h3>
          </div>
          <div className="prose prose-sm max-w-none">{formatContent(summary.summary)}</div>
        </div>

        <Separator />

        {/* Impact Section */}
        <div>
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Impact pour les entreprises</h3>
          </div>
          <div className="prose prose-sm max-w-none">{formatContent(summary.impact)}</div>
        </div>
      </CardContent>
    </Card>
  )
}
