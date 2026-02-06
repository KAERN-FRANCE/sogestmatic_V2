import { NextRequest, NextResponse } from "next/server"

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const startTime = Date.now()

  const requestUrl = new URL(request.url)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || `${requestUrl.protocol}//${requestUrl.host}`

  console.log(`🔄 [CRON] Mise à jour quotidienne des réglementations - ${new Date().toISOString()}`)

  try {
    const res = await fetch(`${baseUrl}/api/indicators/regulations?force=true`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    const data = await res.json()
    const duration = Date.now() - startTime

    console.log(`✅ [CRON] Réglementations mises à jour (${duration}ms)`)

    return NextResponse.json({
      ok: res.ok && data.ok,
      timestamp: new Date().toISOString(),
      duration,
      count: data.data?.length || 0,
    })
  } catch (error: any) {
    console.error(`❌ [CRON] Erreur réglementations:`, error?.message)
    return NextResponse.json({
      ok: false,
      error: error?.message,
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
