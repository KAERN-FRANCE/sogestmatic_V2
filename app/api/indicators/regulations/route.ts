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
  // Données statiques vérifiées avec des URLs qui fonctionnent
  // Ces données sont utilisées si l'IA ne peut pas faire de recherche web
  const regulations: Regulation[] = [
    {
      id: "chronotachygraphe-v2",
      category: "Chronotachygraphe",
      scope: "UE",
      title: "Chronotachygraphe intelligent V2 obligatoire",
      summary: "Les véhicules neufs > 3,5t doivent être équipés du tachygraphe intelligent de 2ème génération. Les véhicules existants doivent être mis à jour d'ici 2025 pour les transports internationaux.",
      deadline: "31 décembre 2025",
      urgency: "Important",
      impact: "Mise à jour ou remplacement des chronotachygraphes obligatoire",
      sources: [
        { label: "Règlement (UE) 2020/1054 - Paquet mobilité I", href: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32020R1054" }
      ]
    },
    {
      id: "euro7-pl",
      category: "Environnement",
      scope: "UE",
      title: "Norme Euro 7 pour poids lourds",
      summary: "Nouvelles limites d'émissions pour les véhicules lourds neufs. Exigences renforcées sur les émissions de freins et la durabilité des systèmes antipollution.",
      deadline: "1er juillet 2027",
      urgency: "Modéré",
      impact: "Renouvellement progressif de la flotte PL",
      sources: [
        { label: "Règlement (UE) 2024/1257 - Euro 7", href: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32024R1257" }
      ]
    },
    {
      id: "zfe-crit-air-3",
      category: "Environnement",
      scope: "France",
      title: "ZFE-m : Restriction Crit'Air 3 et plus",
      summary: "Les agglomérations de plus de 150 000 habitants doivent restreindre l'accès aux véhicules Crit'Air 3, 4 et 5. Calendrier variable selon les métropoles.",
      deadline: "1er janvier 2025",
      urgency: "Critique",
      impact: "Accès restreint aux centres urbains pour PL anciens",
      sources: [
        { label: "Ministère - Zones à faibles émissions", href: "https://www.ecologie.gouv.fr/politiques-publiques/zones-faibles-emissions-mobilite-zfe-m" }
      ]
    },
    {
      id: "eurovignette-co2",
      category: "Fiscalité",
      scope: "France/UE",
      title: "Eurovignette : modulation CO2 des péages",
      summary: "Modulation obligatoire des péages PL selon les classes d'émissions CO2. Les véhicules les plus polluants paieront plus cher sur les autoroutes.",
      deadline: "25 mars 2027",
      urgency: "Modéré",
      impact: "Hausse des coûts pour véhicules polluants",
      sources: [
        { label: "Directive (UE) 2022/362 - Eurovignette", href: "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32022L0362" }
      ]
    },
    {
      id: "r-pass-alsace",
      category: "Fiscalité",
      scope: "France",
      title: "R-Pass : taxe PL en Alsace",
      summary: "Mise en place d'une contribution kilométrique pour les poids lourds > 3,5t sur les autoroutes A35 et A36 en Alsace. Environ 0,15€/km.",
      deadline: "1er janvier 2027",
      urgency: "Modéré",
      impact: "Surcoût pour les trajets via l'Alsace",
      sources: [
        { label: "Collectivité européenne d'Alsace - R-Pass", href: "https://www.alsace.eu/dossiers/r-pass/" }
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
    const currentYear = new Date().getFullYear()
    const prompt = `═══════════════════════════════════════════════════════════════
📅 DATE DU JOUR : ${todayFormatted} (ANNÉE ${currentYear})
═══════════════════════════════════════════════════════════════

Tu es un expert en réglementation du transport routier français et européen.

MISSION : Rechercher via web_search les réglementations transport À VENIR et retourner un JSON.

⚠️ RÈGLES ABSOLUES :
1. UNIQUEMENT des réglementations avec des dates FUTURES (après ${todayFormatted})
2. UNIQUEMENT des URLs que tu as RÉELLEMENT visitées via ta recherche web
3. NE JAMAIS inventer d'URL - si tu n'as pas trouvé de source fiable, NE PAS inclure la réglementation
4. Préférer les sources officielles : eur-lex.europa.eu, legifrance.gouv.fr, ecologie.gouv.fr

THÈMES À RECHERCHER :
- Chronotachygraphe intelligent V2 (paquet mobilité)
- ZFE-m (Zones à Faibles Émissions)
- Norme Euro 7
- Péages et taxes transport (Eurovignette, R-Pass)
- Temps de conduite et repos

FORMAT JSON STRICT (retourne UNIQUEMENT ce JSON, rien d'autre) :
{
  "items": [
    {
      "id": "slug-unique",
      "category": "Chronotachygraphe" | "Environnement" | "Social" | "Sécurité" | "Fiscalité",
      "scope": "UE" | "France" | "France/UE",
      "title": "Titre court",
      "summary": "Résumé factuel 2-3 phrases",
      "deadline": "Date au format '1er janvier ${currentYear + 1}' ou 'Janvier ${currentYear + 1}'",
      "urgency": "Critique" (< 3 mois) | "Important" (3-6 mois) | "Modéré" (> 6 mois),
      "impact": "Impact concret pour transporteurs",
      "sources": [{ "label": "Titre du document", "href": "URL EXACTE trouvée via recherche" }]
    }
  ]
}

⚠️ RAPPEL : Nous sommes en ${currentYear}. Ne cite QUE des sources que tu as visitées. Maximum 6 réglementations.`

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
