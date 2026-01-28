"use client"

import { useEffect, useRef, useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Plus, MessageSquare, Trash2, Send, Lock, AlertCircle, Search, Share2, Copy, X, Edit2, ChevronLeft, ChevronRight, Mic, MicOff } from "lucide-react"
import { ChatMessage } from "@/components/chat/chat-message"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { MessageLimitService } from "@/lib/message-limits"
import { getFirebaseInstance } from "@/lib/firebase"
import { collection, query, where, getDocs, doc, setDoc, updateDoc, deleteDoc } from "firebase/firestore"

// Fonctions de stockage local pour le mode développement
const localStorageKey = "sogestmatic_conversations"

function getLocalConversations(): any[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(localStorageKey)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveLocalConversations(conversations: any[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(localStorageKey, JSON.stringify(conversations))
}

type Message = { who: "user" | "bot"; html: string; text: string }
type Conversation = { id: string; title: string; messages: Message[]; timestamp: Date }

function escapeHtml(str: string) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

// Extraire le nom de domaine d'une URL
function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname
    return hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function renderMessageHTML(text: string) {
  let out = escapeHtml(text)

  // Convertir les sauts de ligne multiples en paragraphes avec espacement
  // D'abord, diviser le texte en blocs séparés par des doubles sauts de ligne
  const blocks = out.split(/\n\n+/)

  // Traiter chaque bloc
  const processedBlocks = blocks.map(block => {
    let processedBlock = block.trim()

    // Convertir les sauts de ligne simples en <br> dans chaque bloc
    processedBlock = processedBlock.replace(/\n/g, '<br>')

    // Détecter et convertir les listes à puces
    const lines = processedBlock.split('<br>')
    const hasListItems = lines.some(line => /^\s*[-•*]\s+/.test(line))

    if (hasListItems) {
      // C'est une liste
      const listItems = lines
        .map(line => {
          const match = line.match(/^\s*[-•*]\s+(.+)/)
          if (match) {
            return `<li>${match[1]}</li>`
          }
          return line
        })
        .filter(line => line.startsWith('<li>'))
        .join('')

      return `<ul class="list-disc list-inside my-3 space-y-1">${listItems}</ul>`
    }

    // Sinon, c'est un paragraphe normal
    return `<p class="mb-4 leading-relaxed">${processedBlock}</p>`
  })

  out = processedBlocks.join('')

  // Convertir les liens markdown avec icône externe et domaine visible
  out = out.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, label, url) => {
    const domain = extractDomain(url)
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline font-medium" title="Ouvre dans un nouvel onglet - ${domain}">${label}<svg class="inline-block w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></a>`
  })

  // Auto-link des URLs brutes avec icône externe
  out = out.replace(/(^|[^"'>])(https?:\/\/[^\s<)]+)(?![^<]*>)/g, (_m, p1, url) => {
    const domain = extractDomain(url)
    return `${p1}<a href="${url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline break-all" title="Ouvre dans un nouvel onglet">${domain}<svg class="inline-block w-3 h-3 ml-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></a>`
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
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [sidebarWidth, setSidebarWidth] = useState(600) // Largeur par défaut encore plus grande
  const [isResizing, setIsResizing] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true)
  const [isListening, setIsListening] = useState(false)
  const [speechSupported, setSpeechSupported] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const currentConversation = conversations.find(c => c.id === currentConversationId)
  const messageLimitService = MessageLimitService.getInstance()

  // Filtrer les conversations selon la recherche
  const filteredConversations = conversations.filter(conversation => 
    conversation.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conversation.messages.some(msg => 
      msg.text.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  // Charger les préférences de la sidebar depuis localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem('chatbot-sidebar-width')
    const savedCollapsed = localStorage.getItem('chatbot-sidebar-collapsed')
    
    if (savedWidth) {
      setSidebarWidth(parseInt(savedWidth))
    }
    // Sidebar fermée par défaut, sauf si l'utilisateur a explicitement choisi de l'ouvrir
    if (savedCollapsed === 'false') {
      setIsSidebarCollapsed(false)
    }
    // Si pas de préférence sauvegardée, garder la valeur par défaut (fermée)
  }, [])

  // Sauvegarder les préférences de la sidebar
  useEffect(() => {
    localStorage.setItem('chatbot-sidebar-width', sidebarWidth.toString())
    localStorage.setItem('chatbot-sidebar-collapsed', isSidebarCollapsed.toString())
  }, [sidebarWidth, isSidebarCollapsed])

  // Rediriger si pas connecté
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/compte')
    }
  }, [user, isLoading, router])

  // Vérifier le support de la reconnaissance vocale
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      setSpeechSupported(true)
    }
  }, [])

  // Auto-scroll pendant le streaming (instantané)
  useEffect(() => {
    if (busy && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        // Scroll immédiat pendant le streaming pour suivre le texte en temps réel
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [busy, currentConversation?.messages])

  // Auto-scroll smooth quand un nouveau message arrive (pas pendant le streaming)
  useEffect(() => {
    if (!busy && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        // Utiliser smooth scroll uniquement quand ce n'est pas en streaming
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        })
      }
    }
  }, [currentConversation?.messages?.length, busy])

  // Scroll vers le bas quand on change de conversation
  useEffect(() => {
    if (currentConversation && currentConversation.messages.length > 0 && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        // Utiliser requestAnimationFrame pour attendre que le DOM soit mis à jour
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            scrollContainer.scrollTo({
              top: scrollContainer.scrollHeight,
              behavior: 'auto' // Scroll instantané pour éviter l'effet de "voyage"
            })
          })
        })
      }
    }
  }, [currentConversationId, currentConversation?.messages.length])

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

  // Fonction pour commencer le renommage
  const startEditingTitle = (conversationId: string, currentTitle: string) => {
    setEditingTitle(conversationId)
    setNewTitle(currentTitle)
  }

  // Fonction pour sauvegarder le nouveau titre
  const saveTitle = async (conversationId: string) => {
    if (!newTitle.trim()) return
    
    try {
      // Mettre à jour localement
      setConversations(prev => prev.map(c => 
        c.id === conversationId 
          ? { ...c, title: newTitle.trim() }
          : c
      ))
      
      // Mettre à jour dans Firebase
      await updateConversation(conversationId, { title: newTitle.trim() })
      
      setEditingTitle(null)
      setNewTitle("")
    } catch (error) {
      console.error('Erreur lors de la mise à jour du titre:', error)
    }
  }

  // Fonction pour annuler le renommage
  const cancelEditing = () => {
    setEditingTitle(null)
    setNewTitle("")
  }

  // Fonction pour démarrer la reconnaissance vocale
  const startVoiceInput = () => {
    if (!speechSupported) return

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'fr-FR'

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      setIsListening(false)
    }

    recognition.onerror = (event: any) => {
      console.error('Erreur de reconnaissance vocale:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
  }

  // Fonction pour arrêter la reconnaissance vocale
  const stopVoiceInput = () => {
    setIsListening(false)
  }

  // Fonction pour basculer la sidebar
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  // Fonctions de redimensionnement
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return
    
    const newWidth = e.clientX
    const minWidth = 350
    const maxWidth = 800
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setSidebarWidth(newWidth)
    }
  }

  const handleMouseUp = () => {
    setIsResizing(false)
  }

  // Ajouter les event listeners pour le redimensionnement
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  // Charger les conversations (Firebase ou localStorage)
  useEffect(() => {
    if (!user) return

    const loadConversations = async () => {
      setLoadingConversations(true)
      try {
        let loadedConversations: Conversation[] = []

        const firebase = await getFirebaseInstance()

        if (firebase) {
          // Mode Firebase
          const conversationsRef = collection(firebase.db, 'conversations')
          const q = query(conversationsRef, where('userId', '==', user.id))
          const querySnapshot = await getDocs(q)

          querySnapshot.forEach((docSnap: any) => {
            const data = docSnap.data()
            loadedConversations.push({
              id: docSnap.id,
              title: data.title,
              messages: data.messages || [],
              timestamp: data.timestamp?.toDate() || new Date()
            })
          })
          console.log('[Chatbot] Conversations chargées depuis Firebase:', loadedConversations.length)
        } else {
          // Mode localStorage (développement)
          const localData = getLocalConversations()
          loadedConversations = localData
            .filter((c: any) => c.userId === user.id)
            .map((c: any) => ({
              id: c.id,
              title: c.title,
              messages: c.messages || [],
              timestamp: new Date(c.timestamp)
            }))
          console.log('[Chatbot] Conversations chargées depuis localStorage:', loadedConversations.length)
        }

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

  // Sauvegarder une conversation (Firebase ou localStorage)
  const saveConversation = async (conversation: Conversation) => {
    if (!user) return

    try {
      const firebase = await getFirebaseInstance()

      if (firebase) {
        const conversationRef = doc(firebase.db, 'conversations', conversation.id)
        await setDoc(conversationRef, {
          userId: user.id,
          title: conversation.title,
          messages: conversation.messages,
          timestamp: conversation.timestamp,
          updatedAt: new Date()
        })
        console.log('[Chatbot] Conversation sauvegardée dans Firebase:', conversation.id)
      } else {
        // Mode localStorage
        const allConversations = getLocalConversations()
        const newConv = {
          id: conversation.id,
          userId: user.id,
          title: conversation.title,
          messages: conversation.messages,
          timestamp: conversation.timestamp.toISOString(),
          updatedAt: new Date().toISOString()
        }
        allConversations.push(newConv)
        saveLocalConversations(allConversations)
        console.log('[Chatbot] Conversation sauvegardée dans localStorage:', conversation.id)
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    }
  }

  // Mettre à jour une conversation (Firebase ou localStorage)
  const updateConversation = async (conversationId: string, updates: Partial<Conversation>) => {
    if (!user) return

    try {
      const firebase = await getFirebaseInstance()

      if (firebase) {
        const conversationRef = doc(firebase.db, 'conversations', conversationId)
        await updateDoc(conversationRef, {
          ...updates,
          updatedAt: new Date()
        })
        console.log('[Chatbot] Conversation mise à jour dans Firebase:', conversationId)
      } else {
        // Mode localStorage
        const allConversations = getLocalConversations()
        const index = allConversations.findIndex((c: any) => c.id === conversationId)
        if (index !== -1) {
          allConversations[index] = {
            ...allConversations[index],
            ...updates,
            timestamp: updates.timestamp ? updates.timestamp : allConversations[index].timestamp,
            updatedAt: new Date().toISOString()
          }
          saveLocalConversations(allConversations)
          console.log('[Chatbot] Conversation mise à jour dans localStorage:', conversationId)
        }
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    }
  }

  // Supprimer une conversation (Firebase ou localStorage)
  const deleteConversationFromFirebase = async (conversationId: string) => {
    if (!user) return

    try {
      const firebase = await getFirebaseInstance()

      if (firebase) {
        const conversationRef = doc(firebase.db, 'conversations', conversationId)
        await deleteDoc(conversationRef)
        console.log('[Chatbot] Conversation supprimée de Firebase:', conversationId)
      } else {
        // Mode localStorage
        const allConversations = getLocalConversations()
        const filtered = allConversations.filter((c: any) => c.id !== conversationId)
        saveLocalConversations(filtered)
        console.log('[Chatbot] Conversation supprimée de localStorage:', conversationId)
      }
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
    const currentConv = conversations.find(c => c.id === currentConversationId)
    if (!currentConv) return

    // Créer la conversation mise à jour avec le message utilisateur
    const conversationWithUserMessage = {
      ...currentConv,
      messages: [...currentConv.messages, userMessage]
    }

    // Ajouter immédiatement un message bot vide pour le streaming
    const streamingBotMessage: Message = { who: 'bot', html: '', text: '' }
    const conversationWithBotPlaceholder = {
      ...conversationWithUserMessage,
      messages: [...conversationWithUserMessage.messages, streamingBotMessage]
    }

    // Mettre à jour l'état local avec le placeholder
    setConversations(prev => prev.map(c =>
      c.id === currentConversationId
        ? conversationWithBotPlaceholder
        : c
    ))

    setInput("")
    setBusy(true)

    try {
      const messageHistory = conversationWithUserMessage.messages.map(m => `${m.who === 'user' ? 'Utilisateur' : 'Assistant'}: ${m.text}`).join('\n') || ''

      console.log('⏱️ [STREAM] Démarrage streaming...')
      const startTime = performance.now()

      const res = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          useWebSearch: true,
          history: messageHistory
        })
      })

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('Pas de reader')

      const decoder = new TextDecoder()
      let accumulatedText = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'delta' && data.text) {
                accumulatedText += data.text
                // Mettre à jour le message en temps réel
                const updatedBotMessage: Message = {
                  who: 'bot',
                  html: renderMessageHTML(accumulatedText),
                  text: accumulatedText
                }
                setConversations(prev => prev.map(c => {
                  if (c.id !== currentConversationId) return c
                  const msgs = [...c.messages]
                  msgs[msgs.length - 1] = updatedBotMessage
                  return { ...c, messages: msgs }
                }))
              } else if (data.type === 'done') {
                // Ne pas écraser le texte accumulé - utiliser ce qui a été streamé
                console.log(`⏱️ [STREAM] Terminé en ${((performance.now() - startTime) / 1000).toFixed(1)}s`)
              } else if (data.type === 'error') {
                throw new Error(data.error)
              }
            } catch (e) {
              // Ignorer les erreurs de parsing JSON
            }
          }
        }
      }

      // Message final
      const finalBotMessage: Message = {
        who: 'bot',
        html: renderMessageHTML(accumulatedText || '[Réponse vide]'),
        text: accumulatedText || '[Réponse vide]'
      }

      setConversations(prev => prev.map(c => {
        if (c.id !== currentConversationId) return c
        const msgs = [...c.messages]
        msgs[msgs.length - 1] = finalBotMessage
        return { ...c, messages: msgs }
      }))

      // Sauvegarder
      const finalMessages = [...conversationWithUserMessage.messages, finalBotMessage]
      updateConversation(currentConversationId, { messages: finalMessages })

      // Incrémenter le compteur
      await messageLimitService.incrementMessageCount(user.id)
      const newStatus = await messageLimitService.getLimitStatus(user.id, user.role)
      setMessageLimitStatus(newStatus)

      // Générer titre si premier message
      if (conversationWithUserMessage.messages.length === 1) {
        setGeneratingTitle(currentConversationId)
        try {
          const smartTitle = await generateSmartTitle([userMessage, finalBotMessage])
          setConversations(prev => prev.map(c =>
            c.id === currentConversationId ? { ...c, title: smartTitle } : c
          ))
          await updateConversation(currentConversationId, { title: smartTitle })
        } catch (error) {
          console.error('Erreur génération titre:', error)
        } finally {
          setGeneratingTitle(null)
        }
      }

    } catch (err: any) {
      console.error('❌ [STREAM] Erreur:', err)
      const errorMessage: Message = {
        who: 'bot',
        html: renderMessageHTML('Erreur: ' + (err?.message || 'Erreur serveur')),
        text: 'Erreur: ' + (err?.message || 'Erreur serveur')
      }

      setConversations(prev => prev.map(c => {
        if (c.id !== currentConversationId) return c
        const msgs = [...c.messages]
        msgs[msgs.length - 1] = errorMessage
        return { ...c, messages: msgs }
      }))
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
      <div 
        ref={sidebarRef}
        className={`bg-secondary/30 border-r border-border flex flex-col relative transition-all duration-300 ${
          isSidebarCollapsed ? 'w-12' : ''
        }`}
        style={{ width: isSidebarCollapsed ? '48px' : `${sidebarWidth}px` }}
      >
        <div className="p-3 border-b border-border space-y-3">
          {!isSidebarCollapsed ? (
            <>
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
            </>
          ) : (
            <Button 
              onClick={createNewConversation} 
              className="w-full bg-green-accent hover:bg-green-accent-dark text-white h-9 p-0"
              title="Nouvelle conversation"
            >
              <Plus className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-1">
            {!isSidebarCollapsed && filteredConversations.length === 0 && searchQuery ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Aucune conversation trouvée</p>
                <p className="text-xs">Essayez avec d'autres mots-clés</p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  currentConversationId === conversation.id 
                    ? 'bg-primary/10 border border-primary/30' 
                    : 'hover:bg-secondary/50'
                }`}
                onClick={() => setCurrentConversationId(conversation.id)}
                title={isSidebarCollapsed ? conversation.title : undefined}
              >
                {isSidebarCollapsed ? (
                  <div className="flex items-center justify-center w-full">
                    <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center flex-1 min-w-0 mr-2">
                      <MessageSquare className="w-4 h-4 mr-2 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0" style={{ maxWidth: `${sidebarWidth - 180}px` }}>
                        {editingTitle === conversation.id ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              value={newTitle}
                              onChange={(e) => setNewTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  saveTitle(conversation.id)
                                } else if (e.key === 'Escape') {
                                  cancelEditing()
                                }
                              }}
                              className="h-6 text-xs"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                saveTitle(conversation.id)
                              }}
                              className="h-6 w-6 p-0"
                            >
                              ✓
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation()
                                cancelEditing()
                              }}
                              className="h-6 w-6 p-0"
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <div className="truncate text-sm" title={conversation.title}>
                            {generatingTitle === conversation.id ? (
                              <div className="flex items-center">
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-green-accent mr-2"></div>
                                Génération du titre...
                              </div>
                            ) : (
                              conversation.title
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {editingTitle !== conversation.id && (
                      <div className="flex items-center space-x-1 ml-2 flex-shrink-0 pr-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            startEditingTitle(conversation.id, conversation.title)
                          }}
                          className="h-6 w-6 p-1 bg-blue-100 border border-blue-300 rounded hover:bg-blue-200 flex items-center justify-center flex-shrink-0"
                          title="Renommer cette conversation"
                        >
                          <Edit2 className="w-3 h-3 text-blue-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            generateShareLink(conversation.id)
                          }}
                          className="h-6 w-6 p-1 bg-green-100 border border-green-300 rounded hover:bg-green-200 flex items-center justify-center flex-shrink-0"
                          title="Partager cette conversation"
                        >
                          <Share2 className="w-3 h-3 text-green-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteConversation(conversation.id)
                          }}
                          className="h-6 w-6 p-1 bg-red-100 border border-red-300 rounded hover:bg-red-200 flex items-center justify-center flex-shrink-0"
                          title="Supprimer cette conversation"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
              ))
            )}
          </div>
        </ScrollArea>
        
        <div className="border-t border-border flex-shrink-0">
          <div className="px-4 py-3">
            {!isSidebarCollapsed ? (
              <>
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
              </>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" title={status}></div>
                {messageLimitStatus && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" title={`${messageLimitStatus.currentCount}/${messageLimitStatus.limit} messages`}></div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Bouton de basculement */}
        <div className="absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
          <Button
            onClick={toggleSidebar}
            size="sm"
            variant="outline"
            className="h-6 w-6 p-0 bg-background border-2 shadow-lg hover:bg-secondary"
            title={isSidebarCollapsed ? "Ouvrir la sidebar" : "Fermer la sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronLeft className="w-3 h-3" />
            )}
          </Button>
        </div>
        
        {/* Poignée de redimensionnement (seulement quand la sidebar est ouverte) */}
        {!isSidebarCollapsed && (
          <div
            className="absolute top-0 right-0 w-1 h-full bg-transparent hover:bg-primary/20 cursor-col-resize transition-colors"
            onMouseDown={handleMouseDown}
            title="Redimensionner la sidebar"
          />
        )}
      </div>

      {/* Zone principale de chat */}
      <div className="flex-1 flex flex-col min-h-0">
        {currentConversation ? (
          <>
            {/* Zone des messages - style ChatGPT */}
            <div className="flex-1 overflow-hidden bg-background">
              <ScrollArea ref={scrollAreaRef} className="h-full">
                <div className="pb-4">
                  {currentConversation.messages.map((message, index) => {
                    const isLastMessage = index === currentConversation.messages.length - 1
                    const isStreamingMessage = busy && isLastMessage && message.who === 'bot'
                    // Les messages existants (pas le dernier ou pas en cours de streaming) n'ont pas d'animation
                    const skipAnimation = !isStreamingMessage && message.who === 'bot'

                    return (
                      <ChatMessage
                        key={index}
                        who={message.who}
                        html={message.html}
                        text={message.text}
                        isStreaming={isStreamingMessage}
                        skipAnimation={skipAnimation}
                      />
                    )
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Zone de saisie - style ChatGPT */}
            <div className="border-t border-border bg-background p-4 flex-shrink-0">
              <div className="max-w-3xl mx-auto">
                {/* Message d'erreur de limite */}
                {limitError && (
                  <div className="mb-3 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm text-red-700 dark:text-red-400">{limitError}</span>
                  </div>
                )}

                {/* Indicateur de dictée vocale */}
                {isListening && (
                  <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-blue-700 dark:text-blue-400">Écoute en cours... Parlez maintenant</span>
                  </div>
                )}

                {/* Zone de saisie style ChatGPT */}
                <div className="relative flex items-end gap-2 bg-secondary/50 border border-border rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-green-accent/50 focus-within:border-green-accent transition-all">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        send()
                      }
                    }}
                    placeholder="Posez votre question sur la réglementation transport..."
                    rows={1}
                    className="flex-1 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[44px] max-h-[200px] py-3 px-2 text-base placeholder:text-muted-foreground/60"
                    disabled={!!(messageLimitStatus && !messageLimitStatus.isUnlimited && messageLimitStatus.remaining <= 0)}
                    style={{ height: 'auto', overflow: 'hidden' }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement
                      target.style.height = 'auto'
                      target.style.height = Math.min(target.scrollHeight, 200) + 'px'
                    }}
                  />

                  <div className="flex items-center gap-1 pb-1.5">
                    {/* Bouton de dictée vocale */}
                    {speechSupported && (
                      <button
                        onClick={isListening ? stopVoiceInput : startVoiceInput}
                        className={`p-2 rounded-lg transition-colors ${
                          isListening
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                        }`}
                        title={isListening ? "Arrêter la dictée" : "Dictée vocale"}
                      >
                        {isListening ? (
                          <MicOff className="w-5 h-5" />
                        ) : (
                          <Mic className="w-5 h-5" />
                        )}
                      </button>
                    )}

                    {/* Bouton d'envoi */}
                    <button
                      onClick={send}
                      disabled={busy || !input.trim() || !!(messageLimitStatus && !messageLimitStatus.isUnlimited && messageLimitStatus.remaining <= 0)}
                      className={`p-2 rounded-lg transition-all ${
                        busy || !input.trim()
                          ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                          : 'bg-green-accent text-white hover:bg-green-accent-dark shadow-sm'
                      }`}
                      title="Envoyer le message"
                    >
                      {busy ? (
                        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Info sous la zone de saisie */}
                <p className="text-xs text-muted-foreground text-center mt-2">
                  L'Assistant Réglementaire peut faire des erreurs. Vérifiez toujours les informations auprès des sources officielles.
                </p>
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


