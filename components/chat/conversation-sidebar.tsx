"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MessageSquare, MoreVertical, Copy, Trash2, Plus } from "lucide-react"
import type { Conversation } from "@/lib/chat-service"

interface ConversationSidebarProps {
  conversations: Conversation[]
  currentConversationId: string | null
  onSelectConversation: (conversationId: string) => void
  onNewConversation: () => void
  onDeleteConversation: (conversationId: string) => void
  onDuplicateConversation: (conversationId: string) => void
}

export function ConversationSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onDuplicateConversation,
}: ConversationSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return "Aujourd'hui"
    if (diffDays === 2) return "Hier"
    if (diffDays <= 7) return `Il y a ${diffDays - 1} jours`
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })
  }

  const getToneColor = (tone: string) => {
    switch (tone) {
      case "pédagogique":
        return "bg-blue-100 text-blue-800"
      case "synthétique":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="w-80 bg-background border-r border-border flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-2 border-b border-border">
        <Button onClick={onNewConversation} className="w-full mb-2 h-7 text-xs">
          <Plus className="h-3 w-3 mr-1" />
          Nouvelle conversation
        </Button>

        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-7 h-7 text-xs"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-1">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <MessageSquare className="h-6 w-6 mx-auto mb-1 opacity-50" />
              <p className="text-xs">
                {searchTerm ? `Aucune conversation trouvée pour "${searchTerm}"` : "Aucune conversation"}
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                    currentConversationId === conversation.id ? "bg-primary/10 border border-primary/20" : ""
                  }`}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-medium truncate mb-0.5">{conversation.title}</h4>
                      <div className="flex items-center space-x-1 mb-0.5">
                        <Badge variant="outline" className={`text-xs ${getToneColor(conversation.tone)}`}>
                          {conversation.tone}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{formatDate(conversation.updatedAt)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {conversation.messages.length} message{conversation.messages.length > 1 ? "s" : ""}
                      </p>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-4 w-4 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onDuplicateConversation(conversation.id)}>
                          <Copy className="h-3 w-3 mr-2" />
                          Dupliquer
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteConversation(conversation.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
