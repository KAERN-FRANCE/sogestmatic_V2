"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Plus, MessageSquare, Trash2, Send, Lock, AlertCircle, Search, Share2, Copy, X } from "lucide-react"
import { TypingIndicator } from "@/components/ui/typing-indicator"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { initializeApp } from "firebase/app"
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from "firebase/firestore"
import { MessageLimitService } from "@/lib/message-limits"

// Configuration Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialiser Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

type Message = { who: "user" | "bot"; html: string; text: string }
type Conversation = { id: string; title: string; messages: Message[]; timestamp: Date }

function escapeHtml(str: string) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function renderMessageHTML(text: string) {
  let out = escapeHtml(text)
  
  // Convertir les sauts de ligne en paragraphes
  out = out.replace(/\n\n+/g, '</p><p>')
  out = out.replace(/\n/g, '<br>')
  out = `<p>${out}</p>`
  
  // Convertir les listes à puces
  out = out.replace(/<p>(\s*[-•*]\s+)/g, '<p><ul><li>')
  out = out.replace(/(\n\s*[-•*]\s+)/g, '</li><li>')
  out = out.replace(/(<br>\s*[-•*]\s+)/g, '</li><li>')
  
  // Fermer les listes
  out = out.replace(/(<\/li>)(<p>)/g, '$1</ul>$2')
  
  // Convertir les liens markdown
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, label, url) => {
    return '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">' + label + '</a>'
  })
  
  // Auto-link des URLs brutes
  out = out.replace(/(^|[^"'>])(https?:\/\/[^\s<)]+)(?![^<]*>)/g, (_m, p1, url) => {
    return p1 + '<a href="' + url + '" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:underline">' + url + '</a>'
  })
  
  return out
}

// Fonction pour générer un titre intelligent avec l'API ChatGPT
const generateSmartTitle = async (messages: Message[]): Promise<string> => {
  try {
    // Prendre les 3 premiers messages pour générer le titre
    const recentMessages = messages.slice(0, 3)
    const conversationText = recentMessages.map(m => `${m.who === 'user' ? 'Utilisateur' : 'Assistant'}: ${m.text}`).join('\n')
    
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Génère un titre court et descriptif (maximum 50 caractères) pour cette conversation. Réponds uniquement avec le titre, sans guillemets ni ponctuation supplémentaire.\n\nConversation:\n${conversationText}`,
        useWebSearch: false
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      const title = String(data.response || data.text || '').trim()
      
      // Nettoyer le titre
      const cleanTitle = title
        .replace(/^["']|["']$/g, '') // Enlever les guillemets
        .replace(/^Titre:?\s*/i, '') // Enlever "Titre:" au début
        .replace(/^Conversation:?\s*/i, '') // Enlever "Conversation:" au début
        .slice(0, 50) // Limiter à 50 caractères
      
      return cleanTitle || "Nouvelle conversation"
    }
  } catch (error) {
    console.error('Erreur lors de la génération du titre:', error)
  }
  
  return "Nouvelle conversation"
}

export default function ChatbotPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState("Vérification…")
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [generatingTitle, setGeneratingTitle] = useState<string | null>(null)
  const [messageLimitStatus, setMessageLimitStatus] = useState<{
    currentCount: number
    limit: number
    remaining: number
    isUnlimited: boolean
  } | null>(null)
  const [limitError, setLimitError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareUrl, setShareUrl] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  const currentConversation = conversations.find(c => c.id === currentConversationId)
  const messageLimitService = MessageLimitService.getInstance()

  // Filtrer les conversations selon la recherche
  const filteredConversations = conversations.filter(conversation => 
    conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.messages.some(msg => 
      msg.text.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  // Rediriger si pas connecté
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/compte')
    }
  }, [user, isLoading, router])

  // Auto-scroll vers le bas quand l'IA commence à réfléchir
  useEffect(() => {
    if (busy && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [busy])

  // Fonction pour générer un lien de partage
  const generateShareLink = (conversationId: string) => {
    const baseUrl = window.location.origin
    const shareUrl = `${baseUrl}/chatbot?share=${conversationId}`
    setShareUrl(shareUrl)
    setShowShareModal(true)
  }

  // Fonction pour copier le lien de partage
  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      // Optionnel: afficher une notification de succès
    } catch (err) {
      console.error('Erreur lors de la copie:', err)
    }
  }

  // Charger les conversations depuis Firebase
  useEffect(() => {
    if (!user) return

    const loadConversations = async () => {
      setLoadingConversations(true)
      try {
        const conversationsRef = collection(db, 'conversations')
        const q = query(conversationsRef, where('userId', '==', user.id))
        const querySnapshot = await getDocs(q)
        
        const loadedConversations: Conversation[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          loadedConversations.push({
            id: doc.id,
            title: data.title,
            messages: data.messages || [],
            timestamp: data.timestamp?.toDate() || new Date()
          })
        })
        
        // Trier par date (plus récent en premier)
        loadedConversations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        setConversations(loadedConversations)
        
        // Sélectionner la première conversation si disponible
        if (loadedConversations.length > 0 && !currentConversationId) {
          setCurrentConversationId(loadedConversations[0].id)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des conversations:', error)
        setStatus('Erreur de chargement')
      } finally {
        setLoadingConversations(false)
      }
    }

    loadConversations()
  }, [user, currentConversationId])

  // Charger le statut des limites de messages
  useEffect(() => {
    if (!user) return

    const loadMessageLimitStatus = async () => {
      try {
        const status = await messageLimitService.getLimitStatus(user.id, user.role)
        setMessageLimitStatus(status)
      } catch (error) {
        console.error('Erreur lors du chargement du statut des limites:', error)
      }
    }

    loadMessageLimitStatus()
  }, [user])

  useEffect(() => {
    if (!user) return // Ne pas vérifier l'API si pas connecté
    
    ;(async () => {
      try {
        const ok = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'ping', useWebSearch: false }) })
        setStatus(ok.ok ? 'Connecté' : 'Serveur indisponible')
      } catch {
        setStatus('Serveur indisponible')
      }
    })()
  }, [user])

  // Sauvegarder une conversation dans Firebase
  const saveConversation = async (conversation: Conversation) => {
    if (!user) return

    try {
      const conversationRef = doc(db, 'conversations', conversation.id)
      await setDoc(conversationRef, {
        userId: user.id,
        title: conversation.title,
        messages: conversation.messages,
        timestamp: conversation.timestamp,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    }
  }

  // Mettre à jour une conversation dans Firebase
  const updateConversation = async (conversationId: string, updates: Partial<Conversation>) => {
    if (!user) return

    try {
      const conversationRef = doc(db, 'conversations', conversationId)
      await updateDoc(conversationRef, {
        ...updates,
        updatedAt: new Date()
      })
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    }
  }

  // Supprimer une conversation de Firebase
  const deleteConversationFromFirebase = async (conversationId: string) => {
    if (!user) return

    try {
      const conversationRef = doc(db, 'conversations', conversationId)
      await deleteDoc(conversationRef)
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  const createNewConversation = async () => {
    const newId = Date.now().toString()
    const newConversation: Conversation = {
      id: newId,
      title: "Nouvelle conversation",
      messages: [],
      timestamp: new Date()
    }
    
    setConversations(prev => [newConversation, ...prev])
    setCurrentConversationId(newId)
    setInput("")
    
    // Sauvegarder dans Firebase
    await saveConversation(newConversation)
  }

  const deleteConversation = async (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id))
    if (currentConversationId === id) {
      setCurrentConversationId(conversations[0]?.id || null)
    }
    
    // Supprimer de Firebase
    await deleteConversationFromFirebase(id)
  }

  const send = async () => {
    const text = input.trim()
    if (!text || busy || !currentConversationId || !user) return

    // Vérifier les limites de messages
    const canSend = await messageLimitService.canSendMessage(user.id, user.role)
    
    if (!canSend.canSend) {
      setLimitError(`Limite quotidienne atteinte ! Vous avez utilisé ${canSend.currentCount}/${canSend.limit} messages aujourd'hui. Revenez demain pour continuer à utiliser le chatbot.`)
      return
    }

    setLimitError(null)
    const userMessage: Message = { who: 'user', html: renderMessageHTML(text), text: text }
    
    // Trouver la conversation actuelle AVANT de la modifier
    const currentConversation = conversations.find(c => c.id === currentConversationId)
    if (!currentConversation) return
    
    // Créer la conversation mise à jour avec le message utilisateur
    const conversationWithUserMessage = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage]
    }
    
    // Mettre à jour l'état local
    setConversations(prev => prev.map(c => 
      c.id === currentConversationId 
        ? conversationWithUserMessage
        : c
    ))
    
    setInput("")
    setBusy(true)
    
    try {
      // Préparer l'historique des messages pour l'IA (incluant le message utilisateur)
      const messageHistory = conversationWithUserMessage.messages.map(m => `${m.who === 'user' ? 'Utilisateur' : 'Assistant'}: ${m.text}`).join('\n') || ''
      
      const res = await fetch('/api/ai', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          message: text, 
          useWebSearch: true,
          history: messageHistory // Envoyer l'historique
        }) 
      })
      
      if (!res.ok) {
        const errText = await res.text()
        const errorMessage: Message = { 
          who: 'bot', 
          html: renderMessageHTML('Erreur ' + res.status + ' /api/ai: ' + (errText || 'réponse vide')),
          text: 'Erreur ' + res.status + ' /api/ai: ' + (errText || 'réponse vide')
        }
        
        const updatedConversation = {
          ...conversationWithUserMessage,
          messages: [...conversationWithUserMessage.messages, errorMessage]
        }
        
        setConversations(prev => prev.map(c => 
          c.id === currentConversationId 
            ? updatedConversation
            : c
        ))
        
        // Sauvegarder dans Firebase
        await updateConversation(currentConversationId, { messages: updatedConversation.messages })
      } else {
        const data = await res.json()
        const reply = String(data.response || data.text || '[Réponse vide]')
        const botMessage: Message = { who: 'bot', html: renderMessageHTML(reply), text: reply }
        
        const updatedConversation = {
          ...conversationWithUserMessage,
          messages: [...conversationWithUserMessage.messages, botMessage]
        }
        
        setConversations(prev => prev.map(c => 
          c.id === currentConversationId 
            ? updatedConversation
            : c
        ))
        
        // Sauvegarder dans Firebase
        await updateConversation(currentConversationId, { 
          messages: updatedConversation.messages
        })
        
        // Incrémenter le compteur de messages
        await messageLimitService.incrementMessageCount(user.id)
        
        // Mettre à jour le statut des limites
        const newStatus = await messageLimitService.getLimitStatus(user.id, user.role)
        setMessageLimitStatus(newStatus)
        
        // Générer un titre intelligent si c'est le premier message de la conversation
        if (conversationWithUserMessage.messages.length === 1) { // Changé de 0 à 1 car on a maintenant le message utilisateur
          setGeneratingTitle(currentConversationId)
          
          try {
            const smartTitle = await generateSmartTitle([userMessage, botMessage])
            
            // Mettre à jour le titre localement et dans Firebase
            const conversationWithTitle = {
              ...updatedConversation,
              title: smartTitle
            }
            
            setConversations(prev => prev.map(c => 
              c.id === currentConversationId 
                ? conversationWithTitle
                : c
            ))
            
            await updateConversation(currentConversationId, { title: smartTitle })
          } catch (error) {
            console.error('Erreur lors de la génération du titre:', error)
          } finally {
            setGeneratingTitle(null)
          }
        }
      }
    } catch {
      const errorMessage: Message = { 
        who: 'bot', 
        html: renderMessageHTML('Erreur serveur'),
        text: 'Erreur serveur'
      }
      
      const updatedConversation = {
        ...conversationWithUserMessage,
        messages: [...conversationWithUserMessage.messages, errorMessage]
      }
      
      setConversations(prev => prev.map(c => 
        c.id === currentConversationId 
          ? updatedConversation
          : c
      ))
      
      // Sauvegarder dans Firebase
      await updateConversation(currentConversationId, { messages: updatedConversation.messages })
    } finally {
      setBusy(false)
    }
  }

  // Écran de chargement
  if (isLoading || loadingConversations) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            {isLoading ? 'Chargement...' : 'Chargement des conversations...'}
          </p>
        </div>
      </div>
    )
  }

  // Écran d'authentification
  if (!user) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-semibold text-foreground">
            Accès restreint
          </h2>
          <p className="text-muted-foreground max-w-md">
            Vous devez être connecté pour accéder au chatbot IA.
          </p>
          <Button 
            onClick={() => router.push('/compte')} 
            className="bg-green-accent hover:bg-green-accent-dark text-white"
          >
            Se connecter
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-background">
      {/* Sidebar - Historique des conversations */}
      <div className="w-80 bg-secondary/30 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border space-y-3">
          <Button 
            onClick={createNewConversation} 
            className="w-full bg-green-accent hover:bg-green-accent-dark text-white h-9"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle conversation
          </Button>
          
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher une conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-sm"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
        
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {filteredConversations.length === 0 && searchQuery ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune conversation trouvée</p>
                <p className="text-xs">Essayez avec d'autres mots-clés</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                  currentConversationId === conversation.id 
                    ? 'bg-primary/10 border border-primary/30' 
                    : 'hover:bg-secondary/50'
                }`}
                onClick={() => setCurrentConversationId(conversation.id)}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <MessageSquare className="w-4 h-4 mr-2 text-muted-foreground flex-shrink-0" />
                  <div className="truncate text-sm">
                    {generatingTitle === conversation.id ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-3 w-3 border-b border-green-accent mr-2"></div>
                        Génération du titre...
                      </div>
                    ) : (
                      conversation.title
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      generateShareLink(conversation.id)
                    }}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-green-accent hover:bg-green-accent/10"
                    title="Partager cette conversation"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteConversation(conversation.id)
                    }}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Supprimer cette conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        <div className="p-2 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            {status}
          </div>
          {/* Affichage du statut des limites */}
          {messageLimitStatus && (
            <div className="mt-2 text-xs text-center">
              {messageLimitStatus.isUnlimited ? (
                <span className="text-green-600">Messages illimités</span>
              ) : (
                <span className={`${messageLimitStatus.remaining <= 3 ? 'text-red-600' : 'text-muted-foreground'}`}>
                  {messageLimitStatus.currentCount}/{messageLimitStatus.limit} messages
                </span>
              )}
            </div>
          )}
          {/* Lien vers les politiques */}
          <div className="mt-2 text-center">
            <a href="/politiques" target="_blank" className="text-xs text-muted-foreground hover:text-primary">
              Politiques
            </a>
          </div>
        </div>
      </div>

      {/* Zone principale de chat */}
      <div className="flex-1 flex flex-col min-h-0">
        {currentConversation ? (
          <>
            {/* Zone des messages - hauteur fixe avec scroll */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea ref={scrollAreaRef} className="h-full p-4">
                <div className="max-w-4xl mx-auto space-y-4">
                  {currentConversation.messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.who === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 break-words ${
                          message.who === 'user'
                            ? 'bg-green-accent text-white'
                            : 'bg-secondary text-foreground border border-border'
                        }`}
                        dangerouslySetInnerHTML={{ __html: message.html }}
                      />
                    </div>
                  ))}
                  
                  {/* Animation de chargement quand l'IA réfléchit */}
                  {busy && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-lg px-3 py-2 bg-secondary text-foreground border border-border">
                        <TypingIndicator />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Zone de saisie - hauteur fixe */}
            <div className="border-t border-border p-4 flex-shrink-0">
              <div className="max-w-4xl mx-auto">
                {/* Message d'erreur de limite */}
                {limitError && (
                  <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-700">{limitError}</span>
                  </div>
                )}
                
                <div className="flex items-end gap-3">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { 
                      if (e.key === 'Enter' && !e.shiftKey) { 
                        e.preventDefault(); 
                        send() 
                      } 
                    }}
                    placeholder="Posez votre question…"
                    rows={2}
                    className="flex-1 resize-none"
                    disabled={!!(messageLimitStatus && !messageLimitStatus.isUnlimited && messageLimitStatus.remaining <= 0)}
                  />
                  <Button 
                    onClick={send} 
                    disabled={busy || !input.trim() || !!(messageLimitStatus && !messageLimitStatus.isUnlimited && messageLimitStatus.remaining <= 0)} 
                    className="bg-green-accent hover:bg-green-accent-dark text-white h-10 w-10 p-0"
                  >
                    {busy ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>

              </div>
            </div>
          </>
        ) : (
          /* Écran d'accueil quand aucune conversation n'est sélectionnée */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-accent/10 rounded-full flex items-center justify-center mx-auto">
                <MessageSquare className="w-8 h-8 text-green-accent" />
              </div>
              <h2 className="text-2xl font-semibold text-foreground">
                Expert Réglementation Transport
              </h2>
              <p className="text-muted-foreground max-w-md">
                Posez vos questions sur la réglementation transport et obtenez des réponses précises avec sources.
              </p>
              <Button 
                onClick={createNewConversation} 
                className="bg-green-accent hover:bg-green-accent-dark text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Commencer une conversation
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de partage */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Partager la conversation</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShareModal(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Copiez ce lien pour partager cette conversation avec d'autres personnes.
            </p>
            
            <div className="flex items-center space-x-2 mb-4">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1 text-sm"
              />
              <Button
                onClick={copyShareLink}
                size="sm"
                className="bg-green-accent hover:bg-green-accent-dark text-white"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowShareModal(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


