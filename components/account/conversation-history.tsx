"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { MessageSquare, Search, Trash2, ExternalLink, Loader2 } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore"
import { getFirebaseInstance } from "@/lib/firebase"

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
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadConversationsFromFirebase()
    }
  }, [user])

  const loadConversationsFromFirebase = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const firebase = await getFirebaseInstance()
      if (!firebase) {
        console.log('[Conversations] Firebase not available')
        setIsLoading(false)
        return
      }

      const conversationsRef = collection(firebase.db, 'conversations')
      const q = query(conversationsRef, where('userId', '==', user.id))
      const querySnapshot = await getDocs(q)

      const loadedConversations: Conversation[] = []
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data()
        const messages = data.messages || []
        const lastMessage = messages.length > 0 ? messages[messages.length - 1].text : "Aucun message"

        loadedConversations.push({
          id: docSnap.id,
          title: data.title || "Conversation sans titre",
          lastMessage: lastMessage,
          messageCount: messages.length,
          createdAt: data.timestamp?.toDate()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString()
        })
      })

      // Trier par date (plus récent en premier)
      loadedConversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      setConversations(loadedConversations)
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredConversations = conversations.filter(
    (conv) =>
      conv.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const deleteConversation = async (id: string) => {
    try {
      const firebase = await getFirebaseInstance()
      if (!firebase) return

      // Supprimer de Firebase
      const conversationRef = doc(firebase.db, 'conversations', id)
      await deleteDoc(conversationRef)

      // Mettre à jour l'état local
      const updated = conversations.filter((conv) => conv.id !== id)
      setConversations(updated)
    } catch (error) {
      console.error('Erreur lors de la suppression de la conversation:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" />
              Historique des Conversations
            </CardTitle>
            <CardDescription>Retrouvez toutes vos conversations avec l'Assistant IA</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadConversationsFromFirebase}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Actualiser"
            )}
          </Button>
        </div>
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

          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
              <p className="text-muted-foreground">Chargement des conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
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
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <a href={`/chatbot?conversation=${conversation.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </a>
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
