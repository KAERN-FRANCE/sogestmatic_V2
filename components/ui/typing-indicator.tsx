"use client"

interface TypingIndicatorProps {
  className?: string
}

export function TypingIndicator({ className = "" }: TypingIndicatorProps) {
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
