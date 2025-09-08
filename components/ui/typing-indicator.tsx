"use client"

import { useEffect, useState } from "react"

interface TypingIndicatorProps {
  className?: string
}

export function TypingIndicator({ className = "" }: TypingIndicatorProps) {
  const [dots, setDots] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === "...") return ""
        return prev + "."
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-muted-foreground text-sm">L'IA réfléchit</span>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-green-accent rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-green-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-green-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
      <span className="text-muted-foreground font-mono min-w-[20px] text-sm">{dots}</span>
    </div>
  )
}

// Version alternative avec animation de vague
export function TypingIndicatorWave({ className = "" }: TypingIndicatorProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-muted-foreground text-sm">L'IA réfléchit</span>
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-green-accent rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-green-accent rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-green-accent rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  )
}

// Version avec spinner
export function TypingIndicatorSpinner({ className = "" }: TypingIndicatorProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-muted-foreground text-sm">L'IA réfléchit</span>
      <div className="w-4 h-4 border-2 border-green-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
}
