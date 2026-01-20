import { NextResponse } from "next/server"
import { getAdminDb, isFirebaseConfigured } from "@/lib/firebase-admin"

// Cache hebdomadaire (7 jours)
let cached: { data: any; at: number } | null = null
const ONE_WEEK = 7 * 24 * 60 * 60 * 1000

type Regulation = {
  id: string
  category: "Chronotachygraphe" | "Environnement" | "Social" | "Sécurité" | "Fiscalité"
  scope: "UE" | "France" | "France/UE"
  title: string
  summary: string
  deadline: string
  urgency: "Critique" | "Important" | "Modéré"
  impact: string
  sources: { label: string; href: string }[]
}

const fallbackData = (): Regulation[] => [
  {
    id: "euro7",
    category: "Environnement",
    scope: "UE",
    title: "Norme Euro 7 - Application progressive",
    summary: "Nouvelle norme anti-pollution avec exigences renforcées sur les freins, particules et durabilité des batteries. Application selon catégories de véhicules entre 2026 et 2029.",
    deadline: "29 novembre 2026",
    urgency: "Important",
    impact: "Renouvellement de flotte nécessaire",
    sources: [
      { label: "eur-lex.europa.eu", href: "https://eur-lex.europa.eu/" },
      { label: "consilium.europa.eu", href: "https://www.consilium.europa.eu/" }
    ]
  },
  {
    id: "peages-co2",
    category: "Fiscalité",
    scope: "France/UE",
    title: "Péages différenciés selon CO2",
    summary: "Modulation obligatoire des péages poids lourds selon les classes CO2 et mise en place d'une redevance 'coûts externes' pour la pollution atmosphérique.",
    deadline: "25 mars 2026",
    urgency: "Important",
    impact: "Augmentation des coûts de transport",
    sources: [
      { label: "vie-publique.fr", href: "https://www.vie-publique.fr/" },
      { label: "transport.ec.europa.eu", href: "https://transport.ec.europa.eu/" }
    ]
  },
  {
    id: "eco-redevance-alsace",
    category: "Fiscalité",
    scope: "France",
    title: "Éco-redevance PL Alsace",
    summary: "Mise en place du R-Pass pour les poids lourds sur les autoroutes A35 et A36. Tarification d'environ 0,15€/km pour financer les mobilités.",
    deadline: "Janvier 2027",
    urgency: "Modéré",
    impact: "Coût supplémentaire sur les axes alsaciens",
    sources: [
      { label: "alsace.eu", href: "https://www.alsace.eu/" },
      { label: "francebleu.fr", href: "https://www.francebleu.fr/" }
    ]
  },
  {
    id: "chronotachygraphe-v2",
    category: "Chronotachygraphe",
    scope: "UE",
    title: "Chronotachygraphe intelligent V2",
    summary: "Obligation d'équiper les véhicules neufs de chronotachygraphes intelligents de 2ème génération avec géolocalisation automatique.",
    deadline: "21 août 2025",
    urgency: "Critique",
    impact: "Mise à jour obligatoire des équipements",
    sources: [
      { label: "eur-lex.europa.eu", href: "https://eur-lex.europa.eu/" }
    ]
  },
  {
    id: "zfe-2025",
    category: "Environnement",
    scope: "France",
    title: "Extension des ZFE-m",
    summary: "Renforcement des Zones à Faibles Émissions dans les agglomérations de plus de 150 000 habitants. Restrictions progressives pour les véhicules Crit'Air 3 et plus.",
    deadline: "1er janvier 2025",
    urgency: "Critique",
    impact: "Accès restreint aux centres urbains",
    sources: [
      { label: "ecologie.gouv.fr", href: "https://www.ecologie.gouv.fr/" }
    ]
  },
]

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const force = url.searchParams.get('force') === '1' || url.searchParams.get('force') === 'true'

    if (!force && cached && Date.now() - cached.at < ONE_WEEK) {
      return NextResponse.json({ ok: true, data: cached.data, cached: true })
    }

    // Try Firestore cache first (only if configured)
    if (!force && isFirebaseConfigured()) {
      try {
        const db = getAdminDb()
        const snap = await db.collection('indicators').doc('regulations').get()
        const data = snap.exists ? (snap.data() as any) : null
        if (data?.items && Array.isArray(data.items) && data.updatedAt) {
          const age = Date.now() - new Date(data.updatedAt).getTime()
          if (age < ONE_WEEK) {
            cached = { data: data.items, at: Date.now() }
            return NextResponse.json({ ok: true, data: data.items, source: 'firestore' })
          }
        }
      } catch {}
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
    if (!apiKey) {
      const data = fallbackData()
      cached = { data, at: Date.now() }
      return NextResponse.json({ ok: true, data, fallback: true })
    }

    console.log(`🔍 [REGULATIONS] Recherche des réglementations transport via OpenAI...`)

    const prompt = `Tu es un expert en réglementation du transport routier. Fais une recherche web et renvoie STRICTEMENT un JSON avec un tableau "items" listant les principales réglementations à venir ou récentes pour le transport routier en France et UE.

Recherche les actualités réglementaires sur:
- Chronotachygraphes (nouvelles obligations, mises à jour)
- ZFE (Zones à Faibles Émissions)
- Normes Euro 7
- Péages et taxes transport
- Réglementation sociale (temps de conduite, repos)
- Sécurité routière PL

Format pour chaque élément:
{
  "id": string (slug unique),
  "category": "Chronotachygraphe" | "Environnement" | "Social" | "Sécurité" | "Fiscalité",
  "scope": "UE" | "France" | "France/UE",
  "title": string (titre court),
  "summary": string (résumé 2-3 phrases),
  "deadline": string (date d'application au format "1er janvier 2025" ou "Janvier 2025"),
  "urgency": "Critique" | "Important" | "Modéré" (Critique si < 3 mois),
  "impact": string (impact pour les transporteurs),
  "sources": [{ "label": string (domaine), "href": string (URL) }]
}

Retourne 5-8 réglementations pertinentes, triées par urgence. Sources officielles uniquement (eur-lex, legifrance, ecologie.gouv.fr, vie-publique.fr). Aucune sortie hors JSON.`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout

    const resp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.MODEL || 'gpt-4o-mini',
        input: prompt,
        tools: [{ type: 'web_search_preview' }],
        tool_choice: 'auto',
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!resp.ok) {
      const errorText = await resp.text().catch(() => 'unknown')
      console.error(`❌ [REGULATIONS] Erreur OpenAI: ${resp.status} - ${errorText}`)
      const data = fallbackData()
      cached = { data, at: Date.now() }
      return NextResponse.json({ ok: true, data, fallback: true })
    }

    const responseData = await resp.json()
    let jsonText: string | null = null

    if (typeof responseData.output_text === 'string') {
      jsonText = responseData.output_text
    }
    if (!jsonText && Array.isArray(responseData.output)) {
      const chunks = responseData.output
        .flatMap((o: any) => o?.content || [])
        .filter((c: any) => c?.type === 'output_text' && typeof c.text === 'string')
        .map((c: any) => c.text)
      if (chunks.length) jsonText = chunks.join('\n')
    }

    let parsed: any = null
    if (jsonText) {
      try {
        parsed = JSON.parse(jsonText)
      } catch {
        const m = jsonText.match(/```json[\s\S]*?```|\{[\s\S]*"items"[\s\S]*\}/)
        if (m) {
          const t = m[0].replace(/```json|```/g, '')
          try { parsed = JSON.parse(t) } catch {}
        }
      }
    }

    const items = Array.isArray(parsed?.items) && parsed.items.length >= 3 ? parsed.items : fallbackData()
    console.log(`✅ [REGULATIONS] ${items.length} réglementations trouvées`)

    // Persist in Firestore (only if configured)
    if (isFirebaseConfigured()) {
      try {
        const db = getAdminDb()
        const docRef = db.collection('indicators').doc('regulations')
        await docRef.set({ items, updatedAt: new Date().toISOString() }, { merge: true })
      } catch {}
    }

    cached = { data: items, at: Date.now() }
    return NextResponse.json({ ok: true, data: items, updatedAt: new Date().toISOString() })
  } catch (error: any) {
    console.error(`❌ [REGULATIONS] Erreur:`, error?.message || error)
    const data = fallbackData()
    return NextResponse.json({ ok: true, data, fallback: true, error: error?.message })
  }
}
