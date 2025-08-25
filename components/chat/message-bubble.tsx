"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { User, Bot, Copy, Check } from "lucide-react"
import { useState } from "react"
import type { Message } from "@/lib/chat-service"

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatContent = (content: string) => {
    // Convert markdown-like formatting to JSX
    return content.split("\n").map((line, index) => {
      if (line.startsWith("## ")) {
        return (
          <h3 key={index} className="text-lg font-semibold text-foreground mt-4 mb-2">
            {line.slice(3)}
          </h3>
        )
      }
      if (line.startsWith("**") && line.endsWith("**")) {
        return (
          <h4 key={index} className="font-semibold text-foreground mt-3 mb-2">
            {line.slice(2, -2)}
          </h4>
        )
      }
      if (line.startsWith("• ") || line.startsWith("- ")) {
        return (
          <li key={index} className="ml-4 text-muted-foreground mb-1">
            {line.slice(2)}
          </li>
        )
      }
      if (line.trim() === "") {
        return <br key={index} />
      }
      return (
        <p key={index} className="text-muted-foreground mb-2 leading-relaxed">
          {line}
        </p>
      )
    })
  }

  if (message.role === "user") {
    return (
      <div className="flex justify-end mb-6">
        <div className="max-w-[80%]">
          <Card className="bg-primary text-primary-foreground p-4">
            <div className="prose prose-sm max-w-none text-primary-foreground">
              <p className="mb-0 leading-relaxed">{message.content}</p>
            </div>
          </Card>
          <div className="flex items-center justify-end space-x-2 mt-2">
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span>Vous</span>
            </div>
            <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start mb-6">
      <div className="max-w-[80%]">
        <Card className="bg-muted/50 p-4">
          <div className="prose prose-sm max-w-none">{formatContent(message.content)}</div>
        </Card>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Bot className="h-3 w-3" />
              <span>Assistant IA</span>
            </div>
            <Badge variant="outline" className="text-xs">
              GPT-5
            </Badge>
            <span className="text-xs text-muted-foreground">{formatTime(message.timestamp)}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-6 px-2">
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
