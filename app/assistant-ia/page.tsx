"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/hooks/use-auth"
import { ConversationSidebar } from "@/components/chat/conversation-sidebar"
import { MessageBubble } from "@/components/chat/message-bubble"
import { ChatInput } from "@/components/chat/chat-input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ChatService, type Conversation, type Message, type ChatTone } from "@/lib/chat-service"
import { Bot, MessageSquare, Loader2, Menu, X, AlertTriangle, Info } from "lucide-react"

export default function AssistantIAPage() {
  const { user, isLoading: authLoading } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [tone, setTone] = useState<ChatTone>("neutre")
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [useWebSearch, setUseWebSearch] = useState(true)
  const [tokenLimitError, setTokenLimitError] = useState<{
    currentUsage: number
    limit: number
    remaining: number
  } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatService = ChatService.getInstance()

  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  useEffect(() => {
    scrollToBottom()
  }, [currentConversation?.messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadConversations = () => {
    if (!user) return
    const userConversations = chatService.getConversations(user.id)
    setConversations(userConversations)

    if (userConversations.length > 0 && !currentConversation) {
      setCurrentConversation(userConversations[0])
      setTone(userConversations[0].tone)
    }
  }

  const handleNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: "Nouvelle conversation",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tone: tone,
    }

    setCurrentConversation(newConversation)
    if (user) {
      chatService.saveConversation(user.id, newConversation)
      loadConversations()
    }
  }

  const handleSelectConversation = (conversationId: string) => {
    const conversation = conversations.find((c) => c.id === conversationId)
    if (conversation) {
      setCurrentConversation(conversation)
      setTone(conversation.tone)
    }
  }

  const handleDeleteConversation = (conversationId: string) => {
    if (!user) return

    chatService.deleteConversation(user.id, conversationId)
    loadConversations()

    if (currentConversation?.id === conversationId) {
      const remaining = conversations.filter((c) => c.id !== conversationId)
      setCurrentConversation(remaining.length > 0 ? remaining[0] : null)
    }
  }

  const handleDuplicateConversation = (conversationId: string) => {
    if (!user) return

    const duplicated = chatService.duplicateConversation(user.id, conversationId)
    if (duplicated) {
      loadConversations()
      setCurrentConversation(duplicated)
    }
  }

  const handleSendMessage = async (messageContent: string, selectedTone: ChatTone) => {
    if (!user || !currentConversation) return

    setIsLoading(true)
    setTokenLimitError(null)

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
      timestamp: new Date().toISOString(),
    }

    const updatedConversation = {
      ...currentConversation,
      messages: [...currentConversation.messages, userMessage],
      updatedAt: new Date().toISOString(),
      tone: selectedTone,
    }

    // Update title if it's the first message
    if (currentConversation.messages.length === 0) {
      updatedConversation.title = chatService.generateConversationTitle(messageContent)
    }

    setCurrentConversation(updatedConversation)
    chatService.saveConversation(user.id, updatedConversation)

    // Get AI response
    const result = await chatService.sendMessage(
      messageContent,
      currentConversation.id,
      selectedTone,
      useWebSearch,
      user.id,
      user.role,
    )

    if (result.success && result.response) {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.response,
        timestamp: new Date().toISOString(),
      }

      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, assistantMessage],
        updatedAt: new Date().toISOString(),
      }

      setCurrentConversation(finalConversation)
      chatService.saveConversation(user.id, finalConversation)
      loadConversations()
    } else {
      // Handle error
      let errorContent = `Désolé, une erreur s'est produite : ${result.error}. Veuillez réessayer.`
      
      // Gestion spécifique des erreurs de limite de tokens
      if (result.tokenLimit) {
        setTokenLimitError(result.tokenLimit)
        errorContent = `Limite de tokens dépassée. Vous avez utilisé ${result.tokenLimit.currentUsage.toLocaleString()} tokens sur ${result.tokenLimit.limit.toLocaleString()} ce mois-ci.`
        
        if (user.role === "gratuit") {
          errorContent += " Passez à un abonnement Premium pour plus de tokens."
        }
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorContent,
        timestamp: new Date().toISOString(),
      }

      const errorConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, errorMessage],
        updatedAt: new Date().toISOString(),
      }

      setCurrentConversation(errorConversation)
      chatService.saveConversation(user.id, errorConversation)
    }

    setIsLoading(false)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <div className="text-center space-y-4 max-w-md">
          <Bot className="h-16 w-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Assistant IA Sogestmatic</h1>
          <p className="text-muted-foreground">
            Connectez-vous pour accéder à l'assistant IA spécialisé en réglementation transport routier.
          </p>
          <Button asChild>
            <a href="/compte">Se connecter</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-background/80 backdrop-blur-sm"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40 w-80 bg-background border-r transition-transform duration-200 ease-in-out`}
      >
        <ConversationSidebar
          conversations={conversations}
          currentConversationId={currentConversation?.id}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          onDeleteConversation={handleDeleteConversation}
          onDuplicateConversation={handleDuplicateConversation}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold">Assistant IA</h1>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {user.role === "admin" ? "Admin" : user.role === "premium" ? "Premium" : "Gratuit"}
                </Badge>
                {useWebSearch && (
                  <Badge variant="secondary" className="text-xs">
                    Recherche Web
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Token Limit Alert */}
        {tokenLimitError && (
          <Alert className="mx-4 mt-4 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="flex items-center justify-between">
                <span>
                  Limite de tokens atteinte : {tokenLimitError.currentUsage.toLocaleString()} / {tokenLimitError.limit.toLocaleString()}
                </span>
                {user.role === "gratuit" && (
                  <Button size="sm" variant="outline" asChild>
                    <a href="/compte">Passer Premium</a>
                  </Button>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Chat Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="max-w-4xl mx-auto space-y-4">
            {currentConversation?.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>L'assistant réfléchit...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Chat Input */}
        <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-4xl mx-auto p-4">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              tone={tone}
              onToneChange={setTone}
              useWebSearch={useWebSearch}
              onWebSearchChange={setUseWebSearch}
              disabled={tokenLimitError !== null}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
