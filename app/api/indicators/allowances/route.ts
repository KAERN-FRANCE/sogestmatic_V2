import { NextResponse } from "next/server"
import { allowancesData } from "@/lib/allowances-data"
import { getAdminDb } from "@/lib/firebase-admin"

// Cache quotidien (mémoire) pour limiter les appels
let cached: { data: any; at: number } | null = null
const ONE_DAY = 24 * 60 * 60 * 1000

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
        const snap = await db.collection('indicators').doc('allowances').get()
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
    if (!apiKey) throw new Error('OPENAI_API_KEY manquante')

    const prompt = `Tu es un assistant expert en réglementation sociale du transport routier en France. Recherche sur le web (sources officielles et fiables) les indemnités et barèmes en vigueur et renvoie un JSON STRICT avec un tableau "items". Attends-toi à ces catégories principales: Repas, Découcher, Grand déplacement, Kilométrique, Transport spécialisé, Régional. Pour chaque entrée:
{
  "id": string (slug court),
  "category": string (ex: "Repas"),
  "type": string (intitulé lisible),
  "amount": string (montant avec unité, ex: "19,40 €" ou "0,518 €/km"),
  "conditions": string (résumé clair),
  "source": string (URL cliquable de la source principale),
  "lastUpdate": string (date ISO),
  "region": string (optionnel)
}
Contraintes: écris les montants au format français, garde 2 décimales quand pertinent, pas de texte hors JSON. Si certaines données ne sont pas publiques, laisse la valeur inchangée mais mets une source.`

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
      const txt = await resp.text().catch(() => '')
      console.error('Allowances OpenAI error', resp.status, txt)
      throw new Error('openai')
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
        // try to extract JSON between code fences if present
        const m = jsonText.match(/```json[\s\S]*?```|\{[\s\S]*\}/)
        if (m) {
          const t = m[0].replace(/```json|```/g, '')
          try { parsed = JSON.parse(t) } catch {}
        }
      }
    }
    const items = Array.isArray(parsed?.items) && parsed.items.length ? parsed.items : allowancesData

    // Persist to Firestore
    try {
      const db = getAdminDb()
      const docRef = db.collection('indicators').doc('allowances')
      await docRef.set({ items, updatedAt: new Date().toISOString() }, { merge: true })
    } catch {}

    cached = { data: items, at: Date.now() }
    return NextResponse.json({ ok: true, data: items })
  } catch (e) {
    // Fallback sur nos données internes
    return NextResponse.json({ ok: true, data: allowancesData, fallback: true })
  }
}


