import { NextRequest, NextResponse } from 'next/server'
import { tokenServiceServer } from '@/lib/token-service.server'

export async function POST(request: NextRequest) {
  try {
    const { message, tone, web, userId, userRole } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 })
    }

    // Vérification des limites de tokens si l'utilisateur est connecté
    if (userId && userRole) {
      // Estimation du nombre de tokens (approximatif)
      const estimatedTokens = Math.ceil((message.length + 1000) / 4) // Estimation basée sur la longueur du message + réponse attendue
      
      const tokenCheck = await tokenServiceServer.canUseTokens(userId, userRole, estimatedTokens)
      
      if (!tokenCheck.canUse) {
        return NextResponse.json({ 
          error: tokenCheck.error || 'Limite de tokens dépassée',
          tokenLimit: {
            currentUsage: tokenCheck.currentUsage,
            limit: tokenCheck.limit,
            remaining: tokenCheck.remaining
          }
        }, { status: 429 })
      }
    }

    // Use server-side secret; fallback to legacy public var if needed
    const openaiApiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json({ error: 'Clé API OpenAI manquante' }, { status: 500 })
    }

    // Construire le prompt avec le ton si spécifié
    let systemPrompt = "Tu es un expert en réglementation transport routier. Réponds en français avec précision."
    if (tone) {
      systemPrompt += ` Réponds avec un ton ${tone}.`
    }
    if (web) {
      systemPrompt += "\n\nQuand tu t'appuies sur des informations du web, cite systématiquement tes sources à la fin sous un titre 'Sources' avec des liens markdown cliquables [Titre](URL) et insère des renvois [1], [2]... dans le texte. Inclue l'URL exacte."
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
        ...(web ? { tools: [{ type: 'web_search_preview' }], tool_choice: 'auto' } : {}),
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenAI API error details:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      })
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    // Extraire la réponse de l'API OpenAI
    let aiResponse = data.choices?.[0]?.message?.content
    if (!aiResponse) {
      aiResponse = "Désolé, je n'ai pas pu générer de réponse."
    }

    // Consommer les tokens après une réponse réussie
    if (userId && userRole) {
      const actualTokens = Math.ceil((message.length + aiResponse.length) / 4)
      await tokenServiceServer.consumeTokens(userId, actualTokens)
    }

    return NextResponse.json({ response: aiResponse })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la communication avec l\'IA' },
      { status: 500 }
    )
  }
}
