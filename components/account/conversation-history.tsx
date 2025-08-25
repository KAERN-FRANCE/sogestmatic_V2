"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Search, Trash2, ExternalLink } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"

interface Conversation {
  id: string
  title: string
  lastMessage: string
  messageCount: number
  createdAt: string
  updatedAt: string
}

export function ConversationHistory() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (user) {
      // Load conversations from localStorage
      const stored = localStorage.getItem(`conversations_${user.id}`)
      if (stored) {
        setConversations(JSON.parse(stored))
      }
    }
  }, [user])

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const deleteConversation = (id: string) => {
    const updated = conversations.filter((conv) => conv.id !== id)
    setConversations(updated)
    if (user) {
      localStorage.setItem(`conversations_${user.id}`, JSON.stringify(updated))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="mr-2 h-5 w-5" />
          Historique des Conversations
        </CardTitle>
        <CardDescription>Retrouvez toutes vos conversations avec l'Assistant IA</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans vos conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {conversations.length === 0 ? (
                <div>
                  <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Aucune conversation trouvée</p>
                  <p className="text-sm">Commencez une conversation avec l'Assistant IA</p>
                </div>
              ) : (
                <p>Aucune conversation ne correspond à votre recherche</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium truncate">{conversation.title}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {conversation.messageCount} messages
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mb-2">{conversation.lastMessage}</p>
                    <p className="text-xs text-muted-foreground">
                      Dernière activité : {new Date(conversation.updatedAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteConversation(conversation.id)}
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
