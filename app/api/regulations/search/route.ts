import { NextRequest, NextResponse } from "next/server"

type RegItem = {
  title: string
  url: string
  summary: string
  impact: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { query?: string; perPage?: number }
    const openaiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
    if (!openaiKey) return NextResponse.json({ error: "Clé API manquante" }, { status: 500 })

    const limit = Math.min(Math.max(body.perPage || 6, 1), 12)
    const q = body.query?.slice(0, 500) ||
      "Quelles sont les prochaines réglementations transport en France et en Union européenne ?"

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-5",
        input: q,
        tools: [{ type: "web_search_preview" }],
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: "OpenAI error", details: err }, { status: 500 })
    }

    const data = await res.json()

    let outText: string | undefined = data.output_text
    if (!outText && Array.isArray(data.output)) {
      try {
        const chunks = data.output
          .flatMap((o: any) => o?.content ?? [])
          .filter((c: any) => c?.type === "output_text" && typeof c.text === "string")
          .map((c: any) => c.text)
        if (chunks.length) outText = chunks.join("\n")
      } catch {}
    }

    let items: RegItem[] = []
    try {
      const parsed = JSON.parse(outText || "{}") as { items?: RegItem[] }
      if (Array.isArray(parsed.items)) items = parsed.items
    } catch {}

    // Fallback: if no items, attempt a conversion pass to strict JSON
    if (!items.length) {
      const convertRes = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: "gpt-5",
          input: `Convertis le texte suivant en JSON strict {items:[{title,url,summary,impact}]}, sans commentaire, uniquement JSON.\n\nTexte:\n${outText || ""}`,
          max_output_tokens: 1200,
        }),
      })
      if (convertRes.ok) {
        const convData = await convertRes.json()
        let convText: string | undefined = convData.output_text
        if (!convText && Array.isArray(convData.output)) {
          try {
            const chunks = convData.output
              .flatMap((o: any) => o?.content ?? [])
              .filter((c: any) => c?.type === "output_text" && typeof c.text === "string")
              .map((c: any) => c.text)
            if (chunks.length) convText = chunks.join("\n")
          } catch {}
        }
        try {
          const parsed2 = JSON.parse(convText || "{}") as { items?: RegItem[] }
          if (Array.isArray(parsed2.items)) items = parsed2.items
        } catch {}
      }
    }

    // Last-resort heuristic: extract URLs and craft minimal items
    if (!items.length && outText) {
      const urls = Array.from(new Set((outText.match(/https?:\/\/[^\s)]+/g) || []).slice(0, limit)))
      if (urls.length) {
        items = urls.map((u) => ({
          title: "Réglementation à vérifier",
          url: u,
          summary: "Source détectée via la recherche web (détails à confirmer).",
          impact: "À analyser selon le périmètre (tachygraphe, temps de conduite, cabotage, émissions, etc.)",
        }))
      }
    }

    const safe = items.slice(0, limit).map((it) => ({
      title: String(it?.title || "Réglementation à venir"),
      url: String(it?.url || ""),
      summary: String(it?.summary || ""),
      impact: String(it?.impact || ""),
    }))

    return NextResponse.json({ ok: true, text: outText || "", items: safe })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erreur serveur" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"


