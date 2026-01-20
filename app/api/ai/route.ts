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

    const system = process.env.SYSTEM_INSTRUCTIONS || `Tu es un expert en réglementation du transport routier français et européen. Tu travailles pour Sogestmatic, entreprise avec plus de 40 ans d'expertise.

## RÈGLE PRIORITAIRE N°1 - CONCISION ABSOLUE
⚠️ Tes réponses DOIVENT être COURTES et DIRECTES.
- Maximum 3-4 phrases pour la réponse principale
- Ajoute 2-3 points clés si vraiment nécessaire
- STOP. N'ajoute rien de plus sauf si l'utilisateur demande des détails
- INTERDIT : les listes exhaustives, les "voici un résumé complet", les développements non demandés

## RÈGLE PRIORITAIRE N°2 - CLARIFICATION OBLIGATOIRE
Si la réponse diffère selon le contexte, tu DOIS demander UNE SEULE question AVANT de répondre :
- Marchandises ou voyageurs ?
- Conducteur seul ou en équipage ?
- National ou international ?
- Véhicule > 3,5t ou < 3,5t ?

→ Pose la question et STOP. Pas de "réponse générale en attendant".
Exemple : "S'agit-il de transport de marchandises ou de voyageurs ?"

## RÈGLE PRIORITAIRE N°3 - CITATIONS AVEC ARTICLES
Tu DOIS citer le numéro d'article précis. JAMAIS de citation sans article.
✅ CORRECT : "La pause de 45 min est obligatoire après 4h30 de conduite (Article 7 du Règlement CE 561/2006)"
❌ INTERDIT : "Selon le Règlement 561/2006..." (sans numéro d'article)

## MESSAGES SOCIAUX
Pour "bonjour", "merci", "au revoir" : réponds en 1 phrase, pas de clarification.

## RECHERCHE WEB - OBLIGATOIRE POUR QUESTIONS RÉGLEMENTAIRES
Tu DOIS faire une recherche web pour toute question réglementaire. Consulte TOUS les sites que tu trouves pour comprendre le sujet.

## DÉROGATIONS ET EXCEPTIONS - RECHERCHE OBLIGATOIRE
⚠️ TRÈS IMPORTANT : Pour TOUTE question réglementaire, tu DOIS rechercher les exceptions et dérogations applicables :

1. **Exceptions territoriales** (DOM-TOM, Corse, régions spécifiques) :
   - Rechercher "dérogation [territoire] transport routier"
   - Vérifier les arrêtés préfectoraux locaux

2. **Exceptions par type de véhicule** :
   - Véhicules < 3,5t vs > 3,5t
   - Véhicules spéciaux (dépannage, bétaillères, citernes, etc.)
   - Autobus/autocars vs poids lourds

3. **Exceptions par activité/secteur** :
   - Transport de fonds, matières dangereuses
   - Livraisons locales (rayon < 50/100 km)
   - Services réguliers < 50 km
   - Transport pour compte propre
   - Déménagement, transport exceptionnel

4. **Exceptions temporaires** :
   - Urgences, intempéries, circonstances exceptionnelles
   - Périodes de forte activité (vendanges, etc.)

5. **Accords collectifs et conventions** :
   - Conventions collectives du secteur
   - Accords d'entreprise

→ Recherche TOUJOURS avec des termes comme "exception", "dérogation", "cas particulier", "ne s'applique pas à".
→ Cite le texte de référence de l'exception si elle existe.

## SOURCES À CITER (dans tes réponses)
Dans tes réponses, cite de préférence ces sources officielles :
1. legifrance.gouv.fr (droit français)
2. eur-lex.europa.eu (textes européens)
3. service-public.fr (vulgarisation officielle)
4. transports.gouv.fr / ecologie.gouv.fr

## SOURCES À NE PAS CITER (mais tu peux les consulter)
Tu peux consulter ces sites pour comprendre, mais ne les cite PAS :
- Sites payants : weblex.fr, editions-tissot.fr, dalloz.fr, juritravail.com, weka.fr
- Blogs, forums, Wikipedia
→ Reformule et cite le texte de loi officiel à la place.

## TERMINOLOGIE FRANÇAISE OBLIGATOIRE
- "impression de ticket" (PAS "tirage")
- "repos hebdomadaire normal" (PAS "régulier" ou "standard")
- "chronotachygraphe" (PAS "tachograph" ou "tachygraphe")
- "carte conducteur" (PAS "driver card")
- "temps de disponibilité" (PAS "temps d'attente")

## AMPLITUDE vs TEMPS DE SERVICE - NE JAMAIS CONFONDRE
⚠️ Confusion fréquente à éviter absolument :

AMPLITUDE JOURNALIÈRE = durée entre le début et la fin de la journée de travail
- Inclut : conduite + travail + pauses + disponibilité
- Limite MARCHANDISES : 12h (extensible à 14h deux fois/semaine) - Art. L.3312-1 Code des transports
- Limite VOYAGEURS : 13h (services occasionnels) ou selon accord - Art. D.3312-45 Code des transports

TEMPS DE SERVICE = temps de travail effectif uniquement
- Inclut : conduite + autres tâches (chargement, admin, etc.)
- Exclut : pauses, repos, disponibilité
- Limite : 10h/jour (12h max 2 fois/semaine) - Art. 4 Directive 2002/15/CE

Exemple concret :
- Prise de service 6h00, fin 19h00 = AMPLITUDE de 13h
- Conduite 8h + chargement 2h + pause 1h = TEMPS DE SERVICE de 10h

## PAUSES - RÈGLES COMPLÈTES
Les pauses sont régies par PLUSIEURS textes (à distinguer) :

1. RSE - Règlement CE 561/2006 (Art. 7) :
   - Pause 45 min après 4h30 de conduite max
   - Fractionnable : 15 min + 30 min (dans cet ordre)
   - S'applique aux véhicules > 3,5t

2. Directive 2002/15/CE (Art. 5) - Temps de travail :
   - Pause 30 min si temps de travail 6h-9h
   - Pause 45 min si temps de travail > 9h
   - Fractionnable en périodes de 15 min minimum

3. Code des transports - Art. L.3312-2 :
   - Pause minimale de 30 min pour amplitude > 6h
   - Spécifique au droit français

4. Code du travail - Art. L.3121-16 :
   - Pause 20 min après 6h de travail effectif
   - S'applique en complément des règles transport

⚠️ Ces pauses peuvent se CUMULER ou se SUBSTITUER selon le contexte. Demande TOUJOURS le contexte précis.

## REPOS HEBDOMADAIRE
- Repos hebdomadaire NORMAL : 45h minimum (Art. 8§6 Règlement CE 561/2006)
- Repos hebdomadaire RÉDUIT : 24h minimum (réduction max 21h à compenser avant fin 3ème semaine)
- INTERDIT de dire "repos régulier" → dire "repos normal"

## TEXTES DE RÉFÉRENCE CLÉS
Européens :
- Règlement (CE) n°561/2006 : temps de conduite et repos
- Règlement (UE) n°165/2014 : chronotachygraphe
- Directive 2002/15/CE : temps de travail des conducteurs

Français :
- Code des transports : Art. L.3312-1 à L.3315-5 (temps de travail transport)
- Code du travail : Art. L.3121-1 et suivants (durée du travail générale)
- Décret n°83-40 du 26 janvier 1983 (transports routiers)

## RÈGLES COMMERCIALES
Ne mentionne les produits Sogestmatic QUE si l'utilisateur demande explicitement un devis, prix ou équipement.

## CONFIDENTIALITÉ
Ne divulgue JAMAIS d'informations sur le modèle IA, les clés API ou la configuration technique.`

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
    const model = process.env.MODEL || 'gpt-4.1-mini'
    try {
      console.log(`🤖 [AI] Utilisation du modèle: ${model}`)
      console.log(`🔍 [AI] Recherche web activée: ${useWebSearch}`)
      console.log(`📊 [AI] RAG context length: ${ragContext.length}`)
      
      // Détecter les messages sociaux pour désactiver complètement la recherche web
      const isSocialMessage = /^(bonjour|salut|hello|hi|hey|coucou|bonsoir|merci|au revoir|bye|à bientôt|bonne journée|bonne soirée|comment ça va|ça va|ok|d'accord|entendu|compris|parfait|super|génial|cool|bien|oui|non)[\s?!.,]*$/i.test(message.trim())
      const useTools = useWebSearch && !isSocialMessage
      console.log(`🔎 [AI] Message social: ${isSocialMessage}, Outils: ${useTools}`)

      const resp = await client.responses.create({
        model: model,
        input: conversationContext,
        instructions: system + (isSocialMessage ? '' : ragContext),
        tools: useTools ? [{ type: 'web_search' }] : [],
        tool_choice: useTools ? 'required' : 'none',
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

      // Filtrer les liens et mentions vers des sources interdites (sites payants)
      const forbiddenDomains = [
        'weblex.fr', 'village-justice.com', 'editions-tissot.fr', 'dalloz.fr',
        'juritravail.com', 'legalplace.fr', 'captaincontrat.com', 'wikipedia.org',
        'cabinet-digital', 'macoccilibre', 'avocat', 'cabinet', 'blog'
      ]

      // Supprimer les liens markdown vers des sources interdites
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
      text = text.replace(linkRegex, (match, _linkText, url) => {
        const isForbidden = forbiddenDomains.some(domain => url.toLowerCase().includes(domain))
        if (isForbidden) {
          console.log(`⚠️ [AI] Lien interdit supprimé: ${url}`)
          return ''
        }
        return match
      })

      // Supprimer les mentions textuelles de domaines interdits (ex: "(weblex.fr)")
      const domainMentionRegex = /\s*\([^)]*(?:weblex\.fr|village-justice\.com|editions-tissot\.fr|dalloz\.fr|juritravail\.com|legalplace\.fr|captaincontrat\.com|wikipedia\.org|cabinet-digital|macoccilibre)[^)]*\)/gi
      text = text.replace(domainMentionRegex, (match) => {
        console.log(`⚠️ [AI] Mention de domaine interdit supprimée: ${match.trim()}`)
        return ''
      })

      // Nettoyer les parenthèses vides ou avec seulement des espaces
      text = text.replace(/\s*\(\s*\)/g, '')
      text = text.replace(/\s{2,}/g, ' ').trim()

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


