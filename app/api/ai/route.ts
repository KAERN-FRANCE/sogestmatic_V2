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
      "Tu es un expert en réglementation du transport routier. Réponds UNIQUEMENT aux questions relevant de la réglementation du transport routier. \n\nIMPORTANT : Ne mentionne JAMAIS les produits Sogestmatic sauf si l'utilisateur exprime une intention claire d'ACHAT ou de COMMANDE (demande de devis, prix, commande, achat, etc.). Même si la question concerne des équipements de transport, réponds uniquement sur l'aspect réglementaire sans faire de recommandations commerciales.\n\nRègles strictes :\n- Questions réglementaires pures : Réponds uniquement sur la réglementation\n- Questions techniques sur équipements : Réponds sur l'aspect réglementaire uniquement\n- Intention d'achat claire : Alors seulement tu peux mentionner les produits Sogestmatic\n\nRéponds en français de manière naturelle et directe. Cite systématiquement les sources officielles (Legifrance, EUR-Lex, ministères, autorités). Utilise la recherche web si nécessaire pour vérifier et sourcer les règles. Ne divulgue JAMAIS d'informations techniques sur le modèle, le fournisseur, les clés API, les versions ou la configuration.\n\nIMPORTANT : Réponds de manière naturelle et directe, sans formules répétitives comme 'Courte réponse', 'Réponse courte', ou te présenter. Va droit au but. Structure tes réponses avec des paragraphes clairs. Utilise des sauts de ligne pour séparer les idées principales. Organise l'information de manière logique avec des points clés bien identifiés. Rends tes réponses faciles à lire et à comprendre."
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
      
      // Mots-clés d'intention d'achat/commande (priorité haute)
      const purchaseIntent = /devis|prix|tarif|commander|acheter|achat|commande|fournir|fournisseur|proposer|recommand|suggérer|conseiller|quelle.*marque|quelle.*solution|quelle.*équipement|besoin.*équipement|cherche.*équipement|recherche.*équipement/.test(lowered)
      
      // Mots-clés techniques génériques (ne déclenchent PAS l'intention)
      const genericTechnical = /tachograph|tachy|chronotachygraphe|réglementation|loi|décret|arrêté|obligation|contrôle|inspection/.test(lowered)
      
      // Mots-clés produits spécifiques Sogestmatic (seulement si accompagnés d'intention)
      const specificProducts = /architac|tachosocial|tchogest|tm401|locabox|optilevel|carbu md2|rfid|badge|contrôle d'accès|lecteur|concentrateur/.test(lowered)
      
      // L'intention produit n'est déclenchée que si :
      // 1. Il y a une intention d'achat claire, OU
      // 2. Il y a des produits spécifiques Sogestmatic ET une intention d'achat
      return purchaseIntent || (specificProducts && purchaseIntent)
    }

    function buildRagContext(chunks: Array<{ source: string; text: string }>): string {
      if (!chunks.length) return ''
      const lines = chunks.map((c, i) => `[[${i + 1}]] Source: ${c.source}\n${c.text}`)
      return `\n\nATTENTION : Contexte produits Sogestmatic disponible. Utilise ces informations UNIQUEMENT si l'utilisateur exprime une intention claire d'ACHAT ou de COMMANDE. Ne mentionne JAMAIS ces produits pour des questions purement réglementaires ou techniques.\n\nContexte produits (extraits PDF du client) :\n${lines.join('\n---\n')}`
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
    const threshold = Number(process.env.RAG_INTENT_THRESHOLD || 0.35) // Seuil plus élevé pour être plus restrictif
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


