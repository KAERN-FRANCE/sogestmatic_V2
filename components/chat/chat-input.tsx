"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Send, Loader2, Settings, Globe } from "lucide-react"
import type { ChatTone } from "@/lib/chat-service"

interface ChatInputProps {
  onSendMessage: (message: string, tone: ChatTone) => void
  isLoading: boolean
  tone: ChatTone
  onToneChange: (tone: ChatTone) => void
  useWebSearch?: boolean
  onWebSearchChange?: (useWeb: boolean) => void
  disabled?: boolean
}

export function ChatInput({ 
  onSendMessage, 
  isLoading, 
  tone, 
  onToneChange, 
  useWebSearch = true, 
  onWebSearchChange,
  disabled = false 
}: ChatInputProps) {
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim() && !isLoading && !disabled) {
      onSendMessage(message.trim(), tone)
      setMessage("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const getToneDescription = (tone: ChatTone) => {
    switch (tone) {
      case "pédagogique":
        return "Explications détaillées et structurées"
      case "synthétique":
        return "Réponses courtes et points clés"
      default:
        return "Réponses équilibrées et professionnelles"
    }
  }

  const getToneColor = (tone: ChatTone) => {
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
    <div className="border-t border-border bg-background p-2">
      {/* Settings Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-4">
          {/* Tone Selector */}
          <div className="flex items-center space-x-1">
            <Settings className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Ton :</span>
            <Badge variant="outline" className={`text-xs ${getToneColor(tone)}`}>
              {tone}
            </Badge>
          </div>
          
          {/* Web Search Toggle */}
          {onWebSearchChange && (
            <div className="flex items-center space-x-2">
              <Globe className="h-3 w-3 text-muted-foreground" />
              <Label htmlFor="web-search" className="text-xs text-muted-foreground">
                Recherche Web
              </Label>
              <Switch
                id="web-search"
                checked={useWebSearch}
                onCheckedChange={onWebSearchChange}
                disabled={disabled}
              />
            </div>
          )}
        </div>

        {/* Tone Select Dropdown */}
        <Select value={tone} onValueChange={onToneChange} disabled={disabled}>
          <SelectTrigger className="w-[100px] h-6 text-xs">
            <SelectValue>
              <span className="capitalize">{tone}</span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="neutre">
              <div>
                <div className="font-medium text-sm">Neutre</div>
                <div className="text-xs text-muted-foreground">Équilibré et professionnel</div>
              </div>
            </SelectItem>
            <SelectItem value="pédagogique">
              <div>
                <div className="font-medium text-sm">Pédagogique</div>
                <div className="text-xs text-muted-foreground">Détaillé et structuré</div>
              </div>
            </SelectItem>
            <SelectItem value="synthétique">
              <div>
                <div className="font-medium text-sm">Synthétique</div>
                <div className="text-xs text-muted-foreground">Court et efficace</div>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-1">
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Posez votre question sur la réglementation transport routier..."
            className="min-h-[40px] max-h-[100px] resize-none pr-10 text-sm"
            disabled={isLoading || disabled}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!message.trim() || isLoading || disabled}
            className="absolute bottom-1 right-1 h-6 w-6 p-0"
          >
            {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          </Button>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{getToneDescription(tone)}</span>
          <span>Shift + Entrée pour nouvelle ligne</span>
        </div>
      </form>
    </div>
  )
}
