import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

export const runtime = 'nodejs'

// Domaines officiels (sources de confiance - ne pas capturer)
const officialDomains = [
  'legifrance.gouv.fr',
  'eur-lex.europa.eu',
  'service-public.fr',
  'transports.gouv.fr',
  'ecologie.gouv.fr',
  'urssaf.fr',
  'gouv.fr',
  'europa.eu'
]

// Interface pour les sources (unifiée)
interface Source {
  id: string
  title: string
  url?: string
  type: 'url' | 'pdf' | 'detected'
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'error'
  detectedAt?: string
  context?: string
  category?: string
  fileName?: string
  fileData?: string
  submittedBy?: string
  submittedByEmail?: string
  submittedAt?: string
}

// Chemin des données (Railway Volume ou local)
const DATA_PATH = process.env.DATA_PATH || path.join(process.cwd(), 'data')

// Fonction pour sauvegarder une source détectée automatiquement
function saveDetectedSource(url: string, title: string, context: string) {
  try {
    // Créer le dossier si nécessaire
    if (!fs.existsSync(DATA_PATH)) {
      fs.mkdirSync(DATA_PATH, { recursive: true })
    }

    const filePath = path.join(DATA_PATH, 'sources.json')
    let data = { sources: [] as Source[] }

    if (fs.existsSync(filePath)) {
      data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    }

    // Vérifier si l'URL existe déjà
    const exists = data.sources.some(s => s.url === url)
    if (!exists) {
      data.sources.unshift({
        id: `src_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        url,
        type: 'detected',
        status: 'pending',
        detectedAt: new Date().toISOString(),
        context: context.substring(0, 200) // Limiter le contexte
      })

      // Garder seulement les 100 dernières sources
      data.sources = data.sources.slice(0, 100)

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
      console.log(`📝 [SOURCE] Nouvelle source détectée: ${url}`)
    }
  } catch (error) {
    console.error('❌ Erreur sauvegarde source:', error)
  }
}

// Fonction pour détecter les sources non-officielles dans le texte
function detectNonOfficialSources(text: string, originalMessage: string) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  let match

  while ((match = linkRegex.exec(text)) !== null) {
    const title = match[1]
    const url = match[2]

    // Vérifier si c'est une source officielle
    const isOfficial = officialDomains.some(domain => url.toLowerCase().includes(domain))

    if (!isOfficial && url.startsWith('http')) {
      saveDetectedSource(url, title, originalMessage)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, useWebSearch = true, history = '' } = await request.json()
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message requis' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Clé API OpenAI manquante' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
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

    // --- RAG facultatif ---
    function cosineSimilarity(a: number[], b: number[]): number {
      let dot = 0, na = 0, nb = 0
      for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i]
        na += a[i] * a[i]
        nb += b[i] * b[i]
      }
      return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8)
    }

    function isProductIntent(text: string): boolean {
      const lowered = text.toLowerCase()
      const purchaseIntent = /devis|prix|tarif|commander|acheter|achat|commande|fournir|fournisseur|proposer|recommand|suggérer|conseiller|quelle.*marque|quelle.*solution|quelle.*équipement|besoin.*équipement|cherche.*équipement|recherche.*équipement/.test(lowered)
      const specificProducts = /architac|tachosocial|tchogest|tm401|locabox|optilevel|carbu md2|rfid|badge|contrôle d'accès|lecteur|concentrateur/.test(lowered)
      return purchaseIntent || (specificProducts && purchaseIntent)
    }

    function buildRagContext(chunks: Array<{ source: string; text: string }>): string {
      if (!chunks.length) return ''
      const lines = chunks.map((c, i) => `[[${i + 1}]] Source: ${c.source}\n${c.text}`)
      return `\n\nContexte produits (extraits PDF du client) :\n${lines.join('\n---\n')}`
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
        const scored = (payload.index as Array<{ source: string; text: string; embedding: number[] }>)
          .map((row) => ({ source: row.source, text: row.text, score: cosineSimilarity(queryVec, row.embedding) }))
        scored.sort((a, b) => b.score - a.score)
        return scored.slice(0, k)
      } catch {
        return []
      }
    }

    let ragContext = ''
    const top = await searchIndex(message, Number(process.env.RAG_K || 5))
    const topScore = (top?.[0]?.score as number) ?? 0
    const threshold = Number(process.env.RAG_INTENT_THRESHOLD || 0.35)
    const shouldUseRag = isProductIntent(message) || topScore >= threshold
    if (shouldUseRag) {
      ragContext = buildRagContext(top)
    }

    const conversationContext = history ? `\n\nHistorique de la conversation:\n${history}\n\nNouvelle question: ${message}` : message
    const model = process.env.MODEL || 'gpt-4.1-mini'
    // Détecter les messages sociaux pour désactiver complètement la recherche web
    const isSocialMessage = /^(bonjour|salut|hello|hi|hey|coucou|bonsoir|merci|au revoir|bye|à bientôt|bonne journée|bonne soirée|comment ça va|ça va|ok|d'accord|entendu|compris|parfait|super|génial|cool|bien|oui|non)[\s?!.,]*$/i.test(message.trim())

    // Pour les messages sociaux: pas de recherche web du tout
    // Pour les questions réglementaires: recherche web forcée
    const useTools = useWebSearch && !isSocialMessage

    console.log(`🤖 [STREAM] Modèle: ${model}, Message social: ${isSocialMessage}, Outils: ${useTools}`)

    // Domaines interdits pour filtrage (sites payants uniquement)
    const forbiddenDomains = [
      'weblex.fr', 'village-justice.com', 'editions-tissot.fr', 'dalloz.fr',
      'juritravail.com', 'legalplace.fr', 'captaincontrat.com', 'wikipedia.org'
    ]

    // Créer le stream
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Envoyer un événement de début
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start', model })}\n\n`))

          const resp = await client.responses.create({
            model: model,
            input: conversationContext,
            instructions: system + (isSocialMessage ? '' : ragContext),
            tools: useTools ? [{ type: 'web_search' }] : [],
            tool_choice: useTools ? 'required' : 'none',
            stream: true,
          })

          let fullText = ''

          for await (const event of resp as any) {
            // Extraire le texte selon le type d'événement
            if (event.type === 'response.output_text.delta') {
              const delta = event.delta || ''
              if (delta) {
                fullText += delta
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'delta', text: delta })}\n\n`))
              }
            } else if (event.type === 'response.output_text.done') {
              // Texte complet reçu
              const text = event.text || fullText
              fullText = text
            } else if (event.type === 'response.completed' || event.type === 'response.done') {
              // Réponse terminée
              break
            }
          }

          // Filtrer les liens interdits du texte final
          let filteredText = fullText
          const linkRegex2 = /\[([^\]]+)\]\(([^)]+)\)/g
          filteredText = filteredText.replace(linkRegex2, (match, _linkText, url) => {
            const isForbidden = forbiddenDomains.some(domain => url.toLowerCase().includes(domain))
            if (isForbidden) {
              console.log(`⚠️ [STREAM] Lien interdit supprimé: ${url}`)
              return ''
            }
            return match
          })
          filteredText = filteredText.replace(/\s*\(\s*\)/g, '').replace(/\s{2,}/g, ' ').trim()

          // Détecter et sauvegarder les sources non-officielles
          detectNonOfficialSources(filteredText, message)

          // Envoyer l'événement de fin avec le texte complet filtré
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', text: filteredText })}\n\n`))
          console.log(`✅ [STREAM] Terminé: ${filteredText.length} chars`)

          controller.close()
        } catch (error: any) {
          console.error('❌ [STREAM] Erreur:', error?.message || String(error))
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: error?.message || 'Erreur streaming' })}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error: any) {
    console.error('❌ [STREAM] Erreur globale:', error)
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
