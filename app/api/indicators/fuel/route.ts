import { NextResponse } from "next/server"
import { getAdminDb, isFirebaseConfigured } from "@/lib/firebase-admin"

// Simple in-memory cache for 24h
let cached: { data: any; fetchedAt: number } | null = null
const ONE_DAY_MS = 24 * 60 * 60 * 1000

type FuelPrice = {
  type: "diesel" | "essence"
  price: number
  change7d: number
  change30d: number
  lastUpdate: string
  history: { date: string; price: number }[]
}

const fallbackData = (): FuelPrice[] => {
  const today = new Date().toISOString()
  return [
    { type: "diesel", price: 1.55, change7d: -0.01, change30d: 0.02, lastUpdate: today, history: [] },
    { type: "essence", price: 1.69, change7d: -0.008, change30d: 0.018, lastUpdate: today, history: [] },
  ]
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const force = url.searchParams.get('force') === '1' || url.searchParams.get('force') === 'true'

    if (!force && cached && Date.now() - cached.fetchedAt < ONE_DAY_MS) {
      return NextResponse.json({ ok: true, data: cached.data, cached: true })
    }

    // Try Firestore cache first (only if Firebase is configured)
    if (!force && isFirebaseConfigured()) {
      try {
        const db = getAdminDb()
        const snap = await db.collection('indicators').doc('fuel').get()
        const fsData = snap.exists ? (snap.data() as any) : null
        if (fsData?.items && Array.isArray(fsData.items) && fsData.updatedAt) {
          const age = Date.now() - new Date(fsData.updatedAt).getTime()
          if (age < ONE_DAY_MS) {
            cached = { data: fsData.items, fetchedAt: Date.now() }
            return NextResponse.json({ ok: true, data: fsData.items, source: 'firestore' })
          }
        }
      } catch {}
    }

    // Use OpenAI with web search to get current fuel prices
    const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
    if (!apiKey) {
      console.log('⚠️ [FUEL] Pas de clé API OpenAI, utilisation du fallback')
      return NextResponse.json({ ok: true, data: fallbackData(), fallback: true })
    }

    console.log(`🔍 [FUEL] Recherche des prix carburant via OpenAI...`)

    const todayDate = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    const prompt = `Date d'aujourd'hui: ${todayDate}. Recherche les prix moyens ACTUELS des carburants en France.

Renvoie UNIQUEMENT un JSON valide avec ce format exact:
{
  "diesel": { "price": 1.XX, "change7d": 0.0XX },
  "essence": { "price": 1.XX, "change7d": 0.0XX },
  "source": "URL DIRECTE vers la page avec les prix (pas un lien générique)",
  "date": "YYYY-MM-DD"
}

Règles:
- Prix en €/litre avec 2-3 décimales (ex: 1.629)
- change7d = variation sur 7 jours (positif si hausse, négatif si baisse)
- Source: URL DIRECTE vers la page officielle des prix (ex: https://www.prix-carburants.gouv.fr/rubrique/stat/)
- PAS de lien générique comme https://prix-carburants.gouv.fr/

Aucun texte hors JSON.`

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
      console.error(`❌ [FUEL] Erreur OpenAI: ${resp.status} - ${errorText}`)
      return NextResponse.json({ ok: true, data: fallbackData(), fallback: true })
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
      // Try to extract JSON from the response
      try {
        parsed = JSON.parse(jsonText)
      } catch {
        const jsonMatch = jsonText.match(/\{[\s\S]*"diesel"[\s\S]*"essence"[\s\S]*\}/)
        if (jsonMatch) {
          try { parsed = JSON.parse(jsonMatch[0]) } catch {}
        }
      }
    }

    const today = new Date().toISOString()
    let data: FuelPrice[]

    if (parsed?.diesel?.price && parsed?.essence?.price) {
      console.log(`✅ [FUEL] Prix trouvés - Diesel: ${parsed.diesel.price}€, Essence: ${parsed.essence.price}€`)
      data = [
        {
          type: "diesel",
          price: Math.round(parsed.diesel.price * 1000) / 1000,
          change7d: parsed.diesel.change7d || 0,
          change30d: 0,
          lastUpdate: today,
          history: [],
        },
        {
          type: "essence",
          price: Math.round(parsed.essence.price * 1000) / 1000,
          change7d: parsed.essence.change7d || 0,
          change30d: 0,
          lastUpdate: today,
          history: [],
        },
      ]
    } else {
      console.log('⚠️ [FUEL] Parsing échoué, utilisation du fallback')
      data = fallbackData()
    }

    // Persist to Firestore (only if configured)
    if (isFirebaseConfigured()) {
      try {
        const db = getAdminDb()
        const docRef = db.collection('indicators').doc('fuel')
        await docRef.set({ items: data, updatedAt: today }, { merge: true })
      } catch {}
    }

    cached = { data, fetchedAt: Date.now() }
    return NextResponse.json({ ok: true, data })

  } catch (error: any) {
    console.error(`❌ [FUEL] Erreur:`, error?.message || error)
    return NextResponse.json({ ok: true, data: fallbackData(), fallback: true, error: error?.message })
  }
}
