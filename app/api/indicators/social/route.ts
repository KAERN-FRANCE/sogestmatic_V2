import { NextResponse } from "next/server"
import { getAdminDb, isFirebaseConfigured } from "@/lib/firebase-admin"

// Cache quotidien
let cached: { data: any; at: number } | null = null
const ONE_DAY = 24 * 60 * 60 * 1000

const fallbackData = () => {
  const today = new Date().toISOString().slice(0, 10)
  return [
    { id: 'smic', name: 'SMIC horaire brut (France métropolitaine)', value: '12,02', unit: '€/h', lastUpdate: today, source: 'Légifrance', change: 0 },
    { id: 'transport-hourly', name: 'Taux horaire conventionnel minimum (convention collective transport)', value: '12,27', unit: '€/h', lastUpdate: today, source: 'Convention collective', change: 0 },
    { id: 'social-charges', name: 'Charges sociales patronales — ordre de grandeur', value: '42,00', unit: '%', lastUpdate: today, source: 'URSSAF' },
    { id: 'csg-crds', name: 'Taux CSG / CRDS applicables (revenus d\'activité)', value: '9,70', unit: '%', lastUpdate: today, source: 'Service public' },
  ]
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const force = url.searchParams.get('force') === '1' || url.searchParams.get('force') === 'true'

    if (!force && cached && Date.now() - cached.at < ONE_DAY) {
      return NextResponse.json({ ok: true, data: cached.data, cached: true })
    }

    // Try Firestore cache first (only if configured)
    if (!force && isFirebaseConfigured()) {
      try {
        const db = getAdminDb()
        const snap = await db.collection('indicators').doc('social').get()
        const data = snap.exists ? (snap.data() as any) : null
        if (data?.items && Array.isArray(data.items) && data.updatedAt) {
          const age = Date.now() - new Date(data.updatedAt).getTime()
          if (age < ONE_DAY) {
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

    const todayDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    const prompt = `Tu es un expert paie/URSSAF. Date d'aujourd'hui: ${todayDate}.

Fais une recherche web et renvoie STRICTEMENT un JSON avec un tableau "items" listant les 4 indicateurs sociaux clés ACTUELS en France:

1. SMIC horaire brut (France métropolitaine) - valeur officielle en vigueur
2. Taux horaire conventionnel minimum transport routier (CCN Transport)
3. Charges sociales patronales moyennes (ordre de grandeur)
4. Taux CSG + CRDS combinés sur revenus d'activité (9,2% CSG + 0,5% CRDS = 9,7% total)

Format par élément:
{
  "id": string (smic, transport-hourly, social-charges, csg-crds),
  "name": string (nom complet descriptif),
  "value": string (format FR avec virgule décimale, ex: "12,02"),
  "unit": string (€/h ou %),
  "lastUpdate": string (date ISO),
  "source": string (URL DIRECTE vers le texte officiel - PAS de lien générique),
  "change": number (optionnel, variation par rapport à la période précédente)
}

IMPORTANT pour les sources:
- Fournis des URLs DIRECTES vers les textes officiels
- Exemples: https://www.legifrance.gouv.fr/jorf/id/..., https://www.urssaf.fr/portail/home/taux-et-baremes/...
- NE PAS mettre de liens génériques (https://urssaf.fr/, https://service-public.fr/)

Aucune sortie hors JSON.`

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
      console.error(`❌ [SOCIAL] Erreur OpenAI: ${resp.status} - ${errorText}`)
      const data = fallbackData()
      cached = { data, at: Date.now() }
      return NextResponse.json({ ok: true, data, fallback: true })
    }

    const data = await resp.json()
    let jsonText: string | null = null
    if (typeof data.output_text === 'string') jsonText = data.output_text
    if (!jsonText && Array.isArray(data.output)) {
      try {
        const chunks = data.output.flatMap((o: any) => o?.content || [])
          .filter((c: any) => c?.type === 'output_text' && typeof c.text === 'string')
          .map((c: any) => c.text)
        if (chunks.length) jsonText = chunks.join('\n')
      } catch {}
    }

    let parsed: any = null
    if (jsonText) {
      try { parsed = JSON.parse(jsonText) } catch {
        const m = jsonText.match(/```json[\s\S]*?```|\{[\s\S]*\}/)
        if (m) {
          const t = m[0].replace(/```json|```/g, '')
          try { parsed = JSON.parse(t) } catch {}
        }
      }
    }
    const items = Array.isArray(parsed?.items) && parsed.items.length ? parsed.items : fallbackData()

    // Enrichissement SMIC via Tavily si disponible
    const tavilyKey = process.env.TAVILY_API_KEY || process.env.NEXT_PUBLIC_TAVILY_API_KEY
    if (tavilyKey) {
      try {
        const smicInfo = await fetchSmicFromWeb(tavilyKey)
        if (smicInfo) {
          const withSmic = items.map((it: any) => it.id === 'smic' ? smicInfo : it)
          cached = { data: withSmic, at: Date.now() }
          return NextResponse.json({ ok: true, data: withSmic })
        }
      } catch {}
    }

    // Persist in Firestore (only if configured)
    if (isFirebaseConfigured()) {
      try {
        const db = getAdminDb()
        const docRef = db.collection('indicators').doc('social')
        await docRef.set({ items, updatedAt: new Date().toISOString() }, { merge: true })
      } catch {}
    }

    cached = { data: items, at: Date.now() }
    return NextResponse.json({ ok: true, data: items })
  } catch (e) {
    const data = fallbackData()
    return NextResponse.json({ ok: true, data, fallback: true })
  }
}

async function fetchSmicFromWeb(tavilyKey: string): Promise<any | null> {
  // Recherche ciblée Service-Public / Légifrance
  const q = 'site:service-public.fr Montant du Smic horaire' 
  const resp = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: tavilyKey, query: q, max_results: 5 })
  })
  if (!resp.ok) return null
  const data = await resp.json().catch(() => null)
  const results: any[] = data?.results || []
  const best = results.find(r => /service-public\.fr|legifrance\.gouv\.fr/i.test(r.url)) || results[0]
  if (!best?.url) return null
  const page = await fetch(best.url)
  if (!page.ok) return null
  const html = await page.text()
  // Capture un nombre décimal FR suivi de €/h ou € par heure
  const m = html.match(/(\d{1,2}[\.,]\d{2})\s*€\s*(?:\/\s*h|par\s*heure|\bh\b)/i)
  if (!m) return null
  const val = m[1].replace(',', '.')
  const formatted = Number(val).toFixed(2).replace('.', ',')
  const today = new Date().toISOString()
  return { id: 'smic', name: 'SMIC horaire', value: formatted, unit: '€/h', lastUpdate: today, source: best.url, change: 0 }
}


