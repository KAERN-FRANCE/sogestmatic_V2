"use client"

import { Bot, User } from "lucide-react"

export default function ChatDemo() {
  const messages = [
    {
      role: "user",
      content: "Pouvez-vous me donner un aperçu clair et actionnable des obligations 2024 liées aux chronotachygraphes (fréquence des contrôles, données à enregistrer, principales échéances) et me dire ce que je dois vérifier en priorité dans mon entreprise ?",
    },
    {
      role: "assistant",
      content:
        "Voici comment je peux vous aider concrètement :\n\n• Contrôle express de conformité (tachy, pauses, dépassements) avec signalement des écarts.\n• Plan d’action prêt à l’emploi pour l’échéance de juillet 2024, assignable par service.\n• Estimation du risque d’amende et du gain attendu après correction.\n• Rapport PDF d’audit généré automatiquement.\n\nSouhaitez‑vous que je : (1) scanne vos 30 derniers jours, (2) crée votre plan d’action, (3) configure des alertes hebdomadaires ?",
    },
  ]

  return (
    <div className="bg-white rounded-xl max-w-lg w-full px-0 mx-auto my-0 mb-[9px]">
      {/* Chat Header */}
      <div className="bg-primary text-white px-3 py-2 rounded-t-lg flex items-center gap-2">
        <div className="w-6 h-6 bg-green-accent rounded-full flex items-center justify-center">
          <Bot className="h-4 w-4" />
        </div>
        <div>
          <div className="font-semibold text-sm">Assistant IA Sogestmatic</div>
          <div className="text-[10px] text-primary-foreground/80">GPT-5 • En ligne</div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 text-amber-700 text-[11px] px-3 py-0.5 border-t border-b border-amber-200">
        Attention : cet assistant IA peut commettre des erreurs. Vérifiez les informations importantes.
      </div>

      {/* Chat Messages (compact sans scroll interne) */}
      <div className="p-3 space-y-2.5 min-h-[300px]">
        {messages.map((message, index) => (
          <div key={index} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            {message.role === "assistant" && (
              <div className="w-6 h-6 bg-green-accent-light rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="h-3 w-3 text-green-accent-dark" />
              </div>
            )}
            <div className={`max-w-md px-3 py-2 rounded-lg text-sm ${message.role === "user" ? "bg-primary text-white" : "bg-gray-100 text-gray-900"}`}>
              <div className="whitespace-pre-line leading-tight">{message.content}</div>
            </div>
            {message.role === "user" && (
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-3 w-3 text-white" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chat Input (disabled for demo) */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
            Posez votre question sur la réglementation...
          </div>
          <div className="w-9 h-9 bg-gray-300 rounded-lg flex items-center justify-center">
            <Bot className="h-4 w-4 text-gray-600" />
          </div>
        </div>
      </div>
    </div>
  )
}
