import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { message, useWebSearch = true, history = '' } = await request.json()
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message requis' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API OpenAI manquante' }, { status: 500 })
    }

    const client = new OpenAI({ apiKey })

    const system = process.env.SYSTEM_INSTRUCTIONS || (
      "Tu es un expert en réglementation du transport routier. Réponds uniquement aux questions relevant de la réglementation du transport ET, lorsqu'une question concerne les PRODUITS de l'entreprise du client, utilise exclusivement le contexte RAG fourni (extraits PDF) pour informer et RECOMMANDER les produits du client. Ne recommande jamais des produits concurrents. Hors de ce périmètre (transport réglementaire ou produits du client), refuse poliment et propose de reformuler vers un sujet éligible. Réponds en français de manière naturelle et directe. Cite systématiquement les sources officielles (Legifrance, EUR-Lex, ministères, autorités) pour la partie réglementaire et cite le nom du PDF/source pour les informations produits. Utilise la recherche web si nécessaire pour vérifier et sourcer les règles. Ne divulgue JAMAIS d'informations techniques sur le modèle, le fournisseur, les clés API, les versions ou la configuration. Si on te demande ces détails, réponds brièvement que ces informations ne sont pas communiquées et recentre la discussion sur la question métier.\n\nIMPORTANT : Réponds de manière naturelle et directe, sans formules répétitives comme 'Courte réponse', 'Réponse courte', ou te présenter. Va droit au but. Structure tes réponses avec des paragraphes clairs. Utilise des sauts de ligne pour séparer les idées principales. Organise l'information de manière logique avec des points clés bien identifiés. Rends tes réponses faciles à lire et à comprendre."
    )

    // --- RAG facultatif (lecture data/index.json si présent) ---
    function cosineSimilarity(a: number[], b: number[]): number {
      let dot = 0
      let na = 0
      let nb = 0
      for (let i = 0; i < a.length; i += 1) {
        dot += a[i] * b[i]
        na += a[i] * a[i]
        nb += b[i] * b[i]
      }
      return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8)
    }

    function isProductIntent(text: string): boolean {
      const lowered = text.toLowerCase()
      return /produit|gamme|référence|prix|tarif|devis|fournir|fournisseur|caractéristique|spécification|capacité|compatibilit|brochure|catalogue|manuel|documentation|notice|modèle|version|accessoire|option|rfid|badge|contrôle d'accès|lecteur|concentrateur|carburant|tachograph|tachy|architac|tachosocial|tchogest|tm401|locabox|optilevel|carbu md2/.test(lowered)
    }

    function buildRagContext(chunks: Array<{ source: string; text: string }>): string {
      if (!chunks.length) return ''
      const lines = chunks.map((c, i) => `[[${i + 1}]] Source: ${c.source}\n${c.text}`)
      return `\n\nContexte produits (extraits PDF du client) — recommander exclusivement les produits du client quand pertinent, éviter les concurrents :\n${lines.join('\n---\n')}`
    }

    async function searchIndex(query: string, k = 5): Promise<Array<{ source: string; text: string; score: number }>> {
      try {
        const indexPath = path.join(process.cwd(), 'data', 'index.json')
        if (!fs.existsSync(indexPath)) return []
        const payload = JSON.parse(fs.readFileSync(indexPath, 'utf8'))
        const embeddingRes = await client.embeddings.create({
          model: payload.model || process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
          input: query,
        })
        const queryVec = embeddingRes.data[0].embedding as unknown as number[]
        const scored = (payload.index as Array<{ source: string; text: string; embedding: number[] }>).
          map((row) => ({ source: row.source, text: row.text, score: cosineSimilarity(queryVec, row.embedding) }))
        scored.sort((a, b) => b.score - a.score)
        return scored.slice(0, k)
      } catch {
        return []
      }
    }

    let ragContext = ''
    const top = await searchIndex(message, Number(process.env.RAG_K || 5))
    const topScore = (top?.[0]?.score as number) ?? 0
    const threshold = Number(process.env.RAG_INTENT_THRESHOLD || 0.22)
    const shouldUseRag = isProductIntent(message) || topScore >= threshold
    if (shouldUseRag) {
      ragContext = buildRagContext(top)
    }

    // Construire le contexte avec l'historique des messages
    const conversationContext = history ? `\n\nHistorique de la conversation:\n${history}\n\nNouvelle question: ${message}` : message

    // Appel unique: Responses API + web_search (identique à chatbot123)
    try {
      const resp = await client.responses.create({
        model: process.env.MODEL || 'gpt-4.1-mini',
        input: conversationContext,
        instructions: system + ragContext,
        tools: [{ type: 'web_search' } as any],
        tool_choice: 'auto',
      })

      // Extraction robuste du texte de sortie
      let text: string = (resp as any).output_text || ''
      if (!text) {
        const output = (resp as any).output || []
        const parts = Array.isArray(output)
          ? output.flatMap((o: any) => Array.isArray(o.content) ? o.content : [])
          : []
        text = parts
          .map((p: any) => p?.text?.value || p?.text || (typeof p === 'string' ? p : ''))
          .join('')
      }

      text = (text || '').trim()
      if (!text) {
        return NextResponse.json({ error: 'Réponse vide de l\'IA' }, { status: 500 })
      }
      return NextResponse.json({ success: true, response: text, mode: 'responses' })
    } catch (err: any) {
      return NextResponse.json({ error: 'Erreur Responses API', details: err?.message || String(err) }, { status: 500 })
    }
  } catch (error: any) {
    if (error?.status === 429) {
      return NextResponse.json({ error: 'Limite de taux dépassée' }, { status: 429 })
    }
    if (error?.status === 401) {
      return NextResponse.json({ error: 'Clé API OpenAI invalide' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 })
  }
}


