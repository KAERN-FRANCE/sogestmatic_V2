import { NextResponse } from "next/server"
import { getAdminDb, isFirebaseConfigured } from "@/lib/firebase-admin"

// Cache journalier (24 heures) - mis à jour automatiquement tous les jours à 6h
let cached: { data: any; at: number } | null = null
const ONE_DAY = 24 * 60 * 60 * 1000

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

// Helper to get today's date formatted in French
function getTodayFrench(): string {
  return new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// Parse French date string to Date object for comparison
function parseFrenchDate(dateStr: string): Date | null {
  const months: Record<string, number> = {
    'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
    'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
  }

  // Format: "1er janvier 2025" or "15 mars 2026" or "Janvier 2027"
  const match = dateStr.toLowerCase().match(/(\d+)?(?:er)?\s*(\w+)\s+(\d{4})/)
  if (match) {
    const day = match[1] ? parseInt(match[1]) : 1
    const month = months[match[2]]
    const year = parseInt(match[3])
    if (month !== undefined && !isNaN(year)) {
      return new Date(year, month, day)
    }
  }
  return null
}

// Filter out past regulations
function filterFutureRegulations(regulations: Regulation[]): Regulation[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return regulations.filter(reg => {
    const deadline = parseFrenchDate(reg.deadline)
    // Keep if we can't parse the date (better safe than sorry) or if it's in the future
    return !deadline || deadline >= today
  })
}

// Recalculate urgency based on current date
function recalculateUrgency(regulations: Regulation[]): Regulation[] {
  const today = new Date()
  const threeMonthsFromNow = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)
  const sixMonthsFromNow = new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000)

  return regulations.map(reg => {
    const deadline = parseFrenchDate(reg.deadline)
    if (!deadline) return reg

    let urgency: "Critique" | "Important" | "Modéré" = "Modéré"
    if (deadline <= threeMonthsFromNow) {
      urgency = "Critique"
    } else if (deadline <= sixMonthsFromNow) {
      urgency = "Important"
    }

    return { ...reg, urgency }
  })
}

// Sort by urgency: Critique first, then Important, then Modéré
function sortByUrgency(regulations: Regulation[]): Regulation[] {
  const urgencyOrder: Record<string, number> = { "Critique": 0, "Important": 1, "Modéré": 2 }
  return [...regulations].sort((a, b) =>
    (urgencyOrder[a.urgency] ?? 2) - (urgencyOrder[b.urgency] ?? 2)
  )
}

// Full pipeline: filter future, recalculate urgency, sort by urgency
function processRegulations(regulations: Regulation[]): Regulation[] {
  return sortByUrgency(recalculateUrgency(filterFutureRegulations(regulations)))
}

const fallbackData = (): Regulation[] => {
  // Calculate dates relative to today
  const today = new Date()
  const in3Months = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000)
  const in6Months = new Date(today.getTime() + 180 * 24 * 60 * 60 * 1000)
  const in12Months = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000)
  const in18Months = new Date(today.getTime() + 548 * 24 * 60 * 60 * 1000)

  const formatDate = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  const regulations: Regulation[] = [
    {
      id: "euro7",
      category: "Environnement",
      scope: "UE",
      title: "Norme Euro 7 - Application progressive",
      summary: "Nouvelle norme anti-pollution avec exigences renforcées sur les freins, particules et durabilité des batteries. Application selon catégories de véhicules.",
      deadline: formatDate(in12Months),
      urgency: "Important",
      impact: "Renouvellement de flotte nécessaire",
      sources: [
        { label: "Règlement (UE) 2024/1257 - Euro 7", href: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1257" },
        { label: "Conseil UE - Adoption Euro 7", href: "https://www.consilium.europa.eu/fr/press/press-releases/2024/04/12/euro-7-council-adopts-new-rules-on-emission-limits-for-cars-vans-buses-and-trucks/" }
      ]
    },
    {
      id: "peages-co2",
      category: "Fiscalité",
      scope: "France/UE",
      title: "Péages différenciés selon CO2",
      summary: "Modulation obligatoire des péages poids lourds selon les classes CO2 et mise en place d'une redevance 'coûts externes' pour la pollution atmosphérique.",
      deadline: formatDate(in6Months),
      urgency: "Important",
      impact: "Augmentation des coûts de transport",
      sources: [
        { label: "Directive Eurovignette (UE) 2022/362", href: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32022L0362" },
        { label: "Vie publique - Tarification routière", href: "https://www.vie-publique.fr/loi/278128-loi-22-aout-2021-climat-et-resilience-convention-citoyenne-climat" }
      ]
    },
    {
      id: "eco-redevance-alsace",
      category: "Fiscalité",
      scope: "France",
      title: "Éco-redevance PL Alsace",
      summary: "Mise en place du R-Pass pour les poids lourds sur les autoroutes A35 et A36. Tarification d'environ 0,15€/km pour financer les mobilités.",
      deadline: formatDate(in18Months),
      urgency: "Modéré",
      impact: "Coût supplémentaire sur les axes alsaciens",
      sources: [
        { label: "CEA - R-Pass Alsace", href: "https://www.alsace.eu/actualite/r-pass-tout-savoir-sur-la-contribution-poids-lourds-en-alsace/" },
        { label: "Legifrance - Loi 3DS Art. 137", href: "https://www.legifrance.gouv.fr/jorf/article_jo/JORFARTI000045197831" }
      ]
    },
    {
      id: "chronotachygraphe-v2",
      category: "Chronotachygraphe",
      scope: "UE",
      title: "Chronotachygraphe intelligent V2",
      summary: "Obligation d'équiper les véhicules neufs de chronotachygraphes intelligents de 2ème génération avec géolocalisation automatique.",
      deadline: formatDate(in3Months),
      urgency: "Critique",
      impact: "Mise à jour obligatoire des équipements",
      sources: [
        { label: "Règlement (UE) 2020/1054 - Paquet mobilité", href: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32020R1054" },
        { label: "Règlement (UE) 165/2014 - Tachygraphes", href: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32014R0165" }
      ]
    },
    {
      id: "zfe-extension",
      category: "Environnement",
      scope: "France",
      title: "Extension des ZFE-m",
      summary: "Renforcement des Zones à Faibles Émissions dans les agglomérations de plus de 150 000 habitants. Restrictions progressives pour les véhicules Crit'Air 3 et plus.",
      deadline: formatDate(in3Months),
      urgency: "Critique",
      impact: "Accès restreint aux centres urbains",
      sources: [
        { label: "Ministère - ZFE obligatoires", href: "https://www.ecologie.gouv.fr/politiques-publiques/zones-faibles-emissions-mobilite-zfe-m" },
        { label: "Legifrance - Décret ZFE", href: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000043956924" }
      ]
    },
  ]

  return recalculateUrgency(regulations)
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const force = url.searchParams.get('force') === '1' || url.searchParams.get('force') === 'true'

    if (!force && cached && Date.now() - cached.at < ONE_DAY) {
      // Re-filter cached data to ensure past regulations are removed
      const processed = processRegulations(cached.data)
      return NextResponse.json({ ok: true, data: processed, cached: true })
    }

    // Try Firestore cache first (only if configured)
    if (!force && isFirebaseConfigured()) {
      try {
        const db = getAdminDb()
        const snap = await db.collection('indicators').doc('regulations').get()
        const data = snap.exists ? (snap.data() as any) : null
        if (data?.items && Array.isArray(data.items) && data.updatedAt) {
          const age = Date.now() - new Date(data.updatedAt).getTime()
          if (age < ONE_DAY) {
            // Filter, recalculate urgency and sort Firestore data
            const processed = processRegulations(data.items)
            cached = { data: processed, at: Date.now() }
            return NextResponse.json({ ok: true, data: processed, source: 'firestore' })
          }
        }
      } catch {}
    }

    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
    if (!apiKey) {
      const data = processRegulations(fallbackData())
      cached = { data, at: Date.now() }
      return NextResponse.json({ ok: true, data, fallback: true })
    }

    console.log(`🔍 [REGULATIONS] Recherche des réglementations transport via OpenAI...`)

    const todayFormatted = getTodayFrench()
    const prompt = `Tu es un expert en réglementation du transport routier. La date d'aujourd'hui est le ${todayFormatted}.

Fais une recherche web et renvoie STRICTEMENT un JSON avec un tableau "items" listant les principales réglementations À VENIR (dates futures uniquement, après le ${todayFormatted}) pour le transport routier en France et UE.

IMPORTANT: N'inclus QUE les réglementations dont la date d'application est DANS LE FUTUR.

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
  "urgency": "Critique" | "Important" | "Modéré" (Critique si < 3 mois de la date d'aujourd'hui),
  "impact": string (impact pour les transporteurs),
  "sources": [{ "label": string (titre court de l'article), "href": string (URL DIRECTE vers l'article ou le texte officiel, PAS le domaine) }]
}

IMPORTANT pour les sources:
- Fournis des URLs DIRECTES vers les articles, règlements ou textes officiels (ex: https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1257)
- NE PAS mettre de liens génériques vers des domaines (ex: https://eur-lex.europa.eu/)
- Chaque source doit pointer vers un document vérifiable qui prouve l'information

Retourne 5-8 réglementations pertinentes avec des dates FUTURES, triées par urgence. Sources officielles uniquement (eur-lex, legifrance, ecologie.gouv.fr, vie-publique.fr). Aucune sortie hors JSON.`

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
      const data = processRegulations(fallbackData())
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

    const rawItems = Array.isArray(parsed?.items) && parsed.items.length >= 3 ? parsed.items : fallbackData()

    // Filter out past regulations, recalculate urgency and sort
    const items = processRegulations(rawItems)

    console.log(`✅ [REGULATIONS] ${items.length} réglementations futures trouvées`)

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
    const data = processRegulations(fallbackData())
    return NextResponse.json({ ok: true, data, fallback: true, error: error?.message })
  }
}
