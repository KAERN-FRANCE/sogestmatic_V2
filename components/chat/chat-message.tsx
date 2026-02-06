"use client"

import { cn } from "@/lib/utils"
import { User, Scale, Copy, Check } from "lucide-react"
import { useState, useEffect, useRef } from "react"

interface ChatMessageProps {
  who: "user" | "bot"
  html: string
  text: string
  isStreaming?: boolean
  skipAnimation?: boolean
}

export function ChatMessage({ who, html, text, isStreaming = false, skipAnimation = false }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)
  const [displayedHtml, setDisplayedHtml] = useState(skipAnimation ? html : "")
  const [isTyping, setIsTyping] = useState(false)
  const animationRef = useRef<NodeJS.Timeout | null>(null)
  const targetHtmlRef = useRef("")
  const isUser = who === "user"

  // Fonction pour trouver une position de coupe sûre (pas au milieu d'une balise HTML)
  const findSafeCutPosition = (htmlStr: string, targetIndex: number): number => {
    if (targetIndex >= htmlStr.length) return htmlStr.length

    // Chercher si on est au milieu d'une balise
    let inTag = false
    let lastTagStart = -1

    for (let i = 0; i <= targetIndex && i < htmlStr.length; i++) {
      if (htmlStr[i] === '<') {
        inTag = true
        lastTagStart = i
      } else if (htmlStr[i] === '>') {
        inTag = false
      }
    }

    // Si on est au milieu d'une balise, avancer jusqu'à la fin de la balise
    if (inTag && lastTagStart !== -1) {
      const tagEnd = htmlStr.indexOf('>', targetIndex)
      if (tagEnd !== -1) {
        return tagEnd + 1
      }
    }

    return targetIndex
  }

  // Effet typewriter pour l'assistant - seulement quand le streaming est terminé
  useEffect(() => {
    // Pour l'utilisateur, afficher directement
    if (isUser) {
      setDisplayedHtml(html)
      return
    }

    // Si on doit sauter l'animation (message déjà existant), afficher directement
    if (skipAnimation) {
      setDisplayedHtml(html)
      return
    }

    // Pendant le streaming, afficher directement le texte au fur et à mesure
    if (isStreaming) {
      setDisplayedHtml(html)
      targetHtmlRef.current = html
      return
    }

    // Quand le streaming se termine, lancer l'effet typewriter
    if (!isStreaming && html && html !== displayedHtml) {
      // Si on a déjà tout affiché, pas besoin d'animer
      if (displayedHtml === html) return

      // Nettoyer l'animation précédente
      if (animationRef.current) {
        clearInterval(animationRef.current)
      }

      const startFrom = displayedHtml.length
      targetHtmlRef.current = html
      setIsTyping(true)

      let currentIndex = startFrom

      animationRef.current = setInterval(() => {
        if (currentIndex < targetHtmlRef.current.length) {
          // Avancer de 3 à 8 caractères à la fois pour plus de fluidité
          const baseChars = Math.floor(Math.random() * 6) + 3
          let targetPos = Math.min(currentIndex + baseChars, targetHtmlRef.current.length)

          // S'assurer qu'on ne coupe pas au milieu d'une balise HTML
          targetPos = findSafeCutPosition(targetHtmlRef.current, targetPos)

          currentIndex = targetPos
          setDisplayedHtml(targetHtmlRef.current.slice(0, currentIndex))
        } else {
          if (animationRef.current) {
            clearInterval(animationRef.current)
            animationRef.current = null
          }
          setDisplayedHtml(targetHtmlRef.current)
          setIsTyping(false)
        }
      }, 12) // 12ms entre chaque groupe de caractères pour plus de fluidité
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current)
      }
    }
  }, [html, isStreaming, isUser, skipAnimation])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Erreur copie:", err)
    }
  }

  return (
    <div
      className={cn(
        "group w-full border-b border-border/50",
        isUser ? "bg-background" : "bg-green-50/50 dark:bg-green-950/20"
      )}
    >
      <div className="max-w-3xl mx-auto flex gap-4 p-4 md:p-6">
        {/* Avatar */}
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
            isUser
              ? "bg-slate-600 text-white"
              : "bg-green-accent text-white"
          )}
        >
          {isUser ? (
            <User className="w-5 h-5" />
          ) : (
            <Scale className="w-4 h-4" />
          )}
        </div>

        {/* Contenu du message */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Label */}
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-sm font-semibold",
              isUser ? "text-foreground" : "text-green-700 dark:text-green-400"
            )}>
              {isUser ? "Vous" : "Assistant Réglementaire"}
            </span>
            {(isStreaming || isTyping) && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                En cours...
              </span>
            )}
          </div>

          {/* Message */}
          <div
            className={cn(
              "prose prose-slate dark:prose-invert max-w-none",
              // Paragraphes avec bon espacement
              "prose-p:leading-7 prose-p:my-3 prose-p:text-[15px]",
              // Listes bien espacées et indentées
              "prose-ul:my-4 prose-ul:pl-6 prose-ul:space-y-2",
              "prose-ol:my-4 prose-ol:pl-6 prose-ol:space-y-2",
              "prose-li:my-1 prose-li:leading-7 prose-li:text-[15px]",
              "prose-li:marker:text-green-600 dark:prose-li:marker:text-green-400",
              // Liens stylés
              "prose-a:text-green-600 prose-a:font-medium prose-a:underline prose-a:underline-offset-2",
              "hover:prose-a:text-green-700 dark:prose-a:text-green-400",
              // Texte en gras
              "prose-strong:text-foreground prose-strong:font-semibold",
              // Code inline
              "prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-normal",
              // Titres si présents
              "prose-h1:text-xl prose-h1:font-bold prose-h1:mt-6 prose-h1:mb-3",
              "prose-h2:text-lg prose-h2:font-semibold prose-h2:mt-5 prose-h2:mb-2",
              "prose-h3:text-base prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-2",
              // Blockquotes / citations
              "prose-blockquote:border-l-4 prose-blockquote:border-green-500 prose-blockquote:bg-green-50/50 dark:prose-blockquote:bg-green-950/20",
              "prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:my-4 prose-blockquote:rounded-r",
              "prose-blockquote:not-italic prose-blockquote:text-[15px]",
              // Couleurs du texte
              "[&_p]:text-foreground [&_li]:text-foreground",
              // Espacement premier/dernier élément
              "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
              (isStreaming || isTyping) && !displayedHtml && "min-h-[24px]"
            )}
          >
            {displayedHtml ? (
              <div
                dangerouslySetInnerHTML={{ __html: displayedHtml }}
                className="chat-message-content [&>p:first-child]:mt-0 [&>p:last-child]:mb-0 [&>ul:first-child]:mt-0 [&>ol:first-child]:mt-0"
              />
            ) : (isStreaming || isTyping) ? (
              <div className="flex items-center gap-1.5 py-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            ) : null}

            {/* Curseur de frappe */}
            {(isStreaming || isTyping) && displayedHtml && (
              <span className="inline-block w-0.5 h-5 bg-green-500 animate-pulse ml-0.5 align-text-bottom rounded-full" />
            )}
          </div>

          {/* Actions (visible au hover) */}
          {!isUser && text && !isStreaming && !isTyping && (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pt-2">
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                title="Copier la réponse"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-green-500">Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
