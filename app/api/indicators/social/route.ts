import { NextResponse } from "next/server"
import { getAdminDb } from "@/lib/firebase-admin"

// Cache quotidien
let cached: { data: any; at: number } | null = null
const ONE_DAY = 24 * 60 * 60 * 1000

const fallbackData = () => {
  const today = new Date().toISOString().slice(0, 10)
  return [
    { id: 'smic', name: 'SMIC horaire', value: '11.65', unit: '€/h', lastUpdate: today, source: 'Légifrance', change: 0 },
    { id: 'transport-hourly', name: 'Taux horaire transport', value: '13.85', unit: '€/h', lastUpdate: today, source: 'Convention collective', change: 0 },
    { id: 'social-charges', name: 'Charges sociales patronales', value: '42.5', unit: '%', lastUpdate: today, source: 'URSSAF' },
    { id: 'csg-crds', name: 'CSG-CRDS', value: '9.7', unit: '%', lastUpdate: today, source: 'Service public' },
  ]
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const force = url.searchParams.get('force') === '1' || url.searchParams.get('force') === 'true'

    if (!force && cached && Date.now() - cached.at < ONE_DAY) {
      return NextResponse.json({ ok: true, data: cached.data, cached: true })
    }

    // Try Firestore cache first
    try {
      if (!force) {
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
      }
    } catch {}

    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
    if (!apiKey) {
      const data = fallbackData()
      cached = { data, at: Date.now() }
      return NextResponse.json({ ok: true, data, fallback: true })
    }

    const prompt = `Tu es un expert paie/URSSAF. Fais une recherche web et renvoie STRICTEMENT un JSON avec un tableau "items" listant les indicateurs sociaux clés en France pour le transport routier (SMIC horaire, taux horaire conventionnel transport, charges sociales patronales moyennes, CSG-CRDS). Format par élément:\n{\n  "id": string,\n  "name": string,\n  "value": string,\n  "unit": string,\n  "lastUpdate": string (ISO),\n  "source": string (URL),\n  "change": number (optionnel)\n}\nRègles: valeurs au format FR, sources officielles (Légifrance/URSSAF/Service-public/CCN). Aucune sortie hors JSON.`

    const resp = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-5-mini',
        input: prompt,
        tools: [{ type: 'web_search_preview' }],
        tool_choice: 'auto',
      }),
    })

    if (!resp.ok) {
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

    // Persist in Firestore
    try {
      const db = getAdminDb()
      const docRef = db.collection('indicators').doc('social')
      await docRef.set({ items, updatedAt: new Date().toISOString() }, { merge: true })
    } catch {}

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


