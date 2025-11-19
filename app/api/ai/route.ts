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
      "Tu es un expert en réglementation du transport routier. Réponds UNIQUEMENT aux questions relevant de la réglementation du transport routier. \n\nIMPORTANT : Ne mentionne JAMAIS les produits Sogestmatic sauf si l'utilisateur exprime une intention claire d'ACHAT ou de COMMANDE (demande de devis, prix, commande, achat, etc.). Même si la question concerne des équipements de transport, réponds uniquement sur l'aspect réglementaire sans faire de recommandations commerciales.\n\nRègles strictes :\n- Questions réglementaires pures : Réponds uniquement sur la réglementation\n- Questions techniques sur équipements : Réponds sur l'aspect réglementaire uniquement\n- Intention d'achat claire : Alors seulement tu peux mentionner les produits Sogestmatic\n\nRéponds en français de manière naturelle et directe. Cite systématiquement les sources officielles (Legifrance, EUR-Lex, ministères, autorités). Utilise la recherche web si nécessaire pour vérifier et sourcer les règles. Ne divulgue JAMAIS d'informations techniques sur le modèle, le fournisseur, les clés API, les versions ou la configuration.\n\nIMPORTANT : Réponds de manière naturelle et directe, sans formules répétitives comme 'Courte réponse', 'Réponse courte', ou te présenter. Va droit au but.\n\n## FORMATAGE MARKDOWN OBLIGATOIRE ##\nTu DOIS structurer TOUTES tes réponses avec du Markdown pour une présentation claire et professionnelle :\n\n✓ Utilise des **titres** (## Titre principal, ### Sous-titre) pour organiser les sections\n✓ Utilise des **listes à puces** (- item) ou **listes numérotées** (1. item) pour énumérer les points\n✓ Mets en **gras** (**texte**) les informations importantes\n✓ Utilise l'*italique* (*texte*) pour les nuances ou définitions\n✓ Utilise des `blocs de code` (`texte`) pour les références légales, articles, ou termes techniques\n✓ Crée des tableaux avec | pour comparer des informations\n✓ Utilise des > citations pour les extraits officiels\n✓ Sépare les sections avec des sauts de ligne pour la lisibilité\n\nExemple de bonne structure :\n## Réponse à votre question\n\nVoici les **points essentiels** :\n\n- **Premier point** : explication détaillée\n- **Deuxième point** : explication détaillée\n\n### Références légales\n\nSelon l'article `L3421-2` du Code des transports...\n\nRends tes réponses faciles à lire, visuellement structurées et agréables à consulter."
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
      const model = process.env.MODEL || 'gpt-4.1-mini'
      console.log(`🤖 [AI] Utilisation du modèle: ${model}`)
      console.log(`🔍 [AI] Recherche web activée: ${useWebSearch}`)
      console.log(`📊 [AI] RAG context length: ${ragContext.length}`)
      
      const resp = await client.responses.create({
        model: model,
        input: conversationContext,
        instructions: system + ragContext,
        tools: useWebSearch ? [{ type: 'web_search' } as any] : [],
        tool_choice: useWebSearch ? 'auto' : 'none',
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
        console.error('❌ [AI] Réponse vide de l\'IA')
        return NextResponse.json({ error: 'Réponse vide de l\'IA' }, { status: 500 })
      }
      
      console.log(`✅ [AI] Réponse générée avec succès (${text.length} caractères)`)
      return NextResponse.json({ 
        success: true, 
        response: text, 
        mode: 'responses',
        model: model,
        webSearch: useWebSearch,
        ragUsed: ragContext.length > 0
      })
    } catch (err: any) {
      console.error('❌ [AI] Erreur Responses API:', err?.message || String(err))
      
      // Fallback: essayer sans recherche web si l'erreur vient de web_search
      if (useWebSearch && err?.message?.includes('web_search')) {
        console.log('🔄 [AI] Tentative de fallback sans recherche web...')
        try {
          const fallbackResp = await client.responses.create({
            model: model,
            input: conversationContext,
            instructions: system + ragContext,
            tools: [],
            tool_choice: 'none',
          })
          
          let fallbackText: string = (fallbackResp as any).output_text || ''
          if (!fallbackText) {
            const output = (fallbackResp as any).output || []
            const parts = Array.isArray(output)
              ? output.flatMap((o: any) => Array.isArray(o.content) ? o.content : [])
              : []
            fallbackText = parts
              .map((p: any) => p?.text?.value || p?.text || (typeof p === 'string' ? p : ''))
              .join('')
          }
          
          fallbackText = (fallbackText || '').trim()
          if (fallbackText) {
            console.log(`✅ [AI] Fallback réussi (${fallbackText.length} caractères)`)
            return NextResponse.json({ 
              success: true, 
              response: fallbackText, 
              mode: 'responses-fallback',
              model: model,
              webSearch: false,
              ragUsed: ragContext.length > 0
            })
          }
        } catch (fallbackErr: any) {
          console.error('❌ [AI] Fallback échoué:', fallbackErr?.message || String(fallbackErr))
        }
      }
      
      return NextResponse.json({ 
        error: 'Erreur Responses API', 
        details: err?.message || String(err),
        model: model,
        webSearch: useWebSearch
      }, { status: 500 })
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


