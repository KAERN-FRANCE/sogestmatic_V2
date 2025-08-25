"use client"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: string
  updatedAt: string
  tone: "neutre" | "pédagogique" | "synthétique"
}

export type ChatTone = "neutre" | "pédagogique" | "synthétique"

export interface ChatResponse {
  success: boolean
  response?: string
  error?: string
  tokenLimit?: {
    currentUsage: number
    limit: number
    remaining: number
  }
}

export class ChatService {
  private static instance: ChatService

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService()
    }
    return ChatService.instance
  }

  async sendMessage(
    message: string,
    conversationId: string,
    tone: ChatTone = "neutre",
    web?: boolean,
    userId?: string,
    userRole?: "gratuit" | "premium" | "admin",
  ): Promise<ChatResponse> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          tone,
          web: Boolean(web),
          userId,
          userRole,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Gestion spécifique des erreurs de limite de tokens
        if (response.status === 429 && data.tokenLimit) {
          return {
            success: false,
            error: data.error || 'Limite de tokens dépassée',
            tokenLimit: data.tokenLimit
          }
        }
        
        return {
          success: false,
          error: data.error || 'Erreur lors de la communication avec l\'IA'
        }
      }

      try {
        if (typeof window !== 'undefined' && userId) {
          const { initializeApp, getApps } = await import('firebase/app')
          const { getFirestore, doc, setDoc, increment, collection, addDoc } = await import('firebase/firestore')
          if (!getApps().length) {
            initializeApp({
              apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
              authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
              projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            })
          }
          const db = getFirestore()
          const approxTokens = Math.ceil(((message || '').length + (data.response || '').length) / 4)
          await setDoc(doc(db, 'user_stats', userId), {
            totalQuestions: increment(1),
            totalTokens: increment(approxTokens),
            lastQuestionAt: new Date().toISOString(),
          }, { merge: true })
          await addDoc(collection(db, 'user_usage_logs'), {
            userId,
            conversationId,
            tone,
            message,
            responsePreview: String(data.response || '').slice(0, 500),
            approxTokens,
            createdAt: new Date().toISOString(),
          })
        }
      } catch {}
      
      return { success: true, response: data.response }
    } catch (error) {
      return { success: false, error: "Erreur lors de la communication avec l'IA" }
    }
  }

  // Conversation management
  getConversations(userId: string): Conversation[] {
    try {
      const stored = localStorage.getItem(`sogestmatic_conversations_${userId}`)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  saveConversation(userId: string, conversation: Conversation): void {
    const conversations = this.getConversations(userId)
    const existingIndex = conversations.findIndex((c) => c.id === conversation.id)

    if (existingIndex >= 0) {
      conversations[existingIndex] = conversation
    } else {
      conversations.unshift(conversation)
    }

    // Keep only last 50 conversations
    const trimmed = conversations.slice(0, 50)
    localStorage.setItem(`sogestmatic_conversations_${userId}`, JSON.stringify(trimmed))
  }

  deleteConversation(userId: string, conversationId: string): void {
    const conversations = this.getConversations(userId)
    const filtered = conversations.filter((c) => c.id !== conversationId)
    localStorage.setItem(`sogestmatic_conversations_${userId}`, JSON.stringify(filtered))
  }

  duplicateConversation(userId: string, conversationId: string): Conversation | null {
    const conversations = this.getConversations(userId)
    const original = conversations.find((c) => c.id === conversationId)

    if (!original) return null

    const duplicate: Conversation = {
      ...original,
      id: Date.now().toString(),
      title: `${original.title} (copie)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    this.saveConversation(userId, duplicate)
    return duplicate
  }

  generateConversationTitle(firstMessage: string): string {
    // Fallback: use first few words
    const words = firstMessage.split(" ").slice(0, 4).join(" ")
    return words.length > 30 ? words.substring(0, 30) + "..." : words
  }
}
