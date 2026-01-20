import { NextRequest, NextResponse } from "next/server"

// Protection par secret pour empêcher les appels non autorisés
const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  // Vérifier le secret (Vercel envoie automatiquement ce header pour les cron jobs)
  const authHeader = request.headers.get("authorization")
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const startTime = Date.now()
  const results: Record<string, { success: boolean; duration: number; error?: string }> = {}

  // Déterminer l'URL de base - utiliser l'URL de la requête en local
  const requestUrl = new URL(request.url)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null)
    || `${requestUrl.protocol}//${requestUrl.host}`

  console.log(`🔄 [CRON] Démarrage mise à jour des indicateurs - ${new Date().toISOString()}`)
  console.log(`🔗 [CRON] Base URL: ${baseUrl}`)

  // 1. Mise à jour des prix carburant
  try {
    const fuelStart = Date.now()
    const fuelRes = await fetch(`${baseUrl}/api/indicators/fuel?force=true`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    const fuelData = await fuelRes.json()
    results.fuel = {
      success: fuelRes.ok && fuelData.ok,
      duration: Date.now() - fuelStart,
    }
    console.log(`✅ [CRON] Prix carburant mis à jour (${results.fuel.duration}ms)`)
  } catch (error: any) {
    results.fuel = { success: false, duration: 0, error: error?.message }
    console.error(`❌ [CRON] Erreur prix carburant:`, error?.message)
  }

  // 2. Mise à jour des indicateurs sociaux
  try {
    const socialStart = Date.now()
    const socialRes = await fetch(`${baseUrl}/api/indicators/social?force=true`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    const socialData = await socialRes.json()
    results.social = {
      success: socialRes.ok && socialData.ok,
      duration: Date.now() - socialStart,
    }
    console.log(`✅ [CRON] Indicateurs sociaux mis à jour (${results.social.duration}ms)`)
  } catch (error: any) {
    results.social = { success: false, duration: 0, error: error?.message }
    console.error(`❌ [CRON] Erreur indicateurs sociaux:`, error?.message)
  }

  // 3. Mise à jour des indemnités
  try {
    const allowancesStart = Date.now()
    const allowancesRes = await fetch(`${baseUrl}/api/indicators/allowances?force=true`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    const allowancesData = await allowancesRes.json()
    results.allowances = {
      success: allowancesRes.ok && allowancesData.ok,
      duration: Date.now() - allowancesStart,
    }
    console.log(`✅ [CRON] Indemnités mises à jour (${results.allowances.duration}ms)`)
  } catch (error: any) {
    results.allowances = { success: false, duration: 0, error: error?.message }
    console.error(`❌ [CRON] Erreur indemnités:`, error?.message)
  }

  const totalDuration = Date.now() - startTime
  const allSuccess = Object.values(results).every((r) => r.success)

  console.log(`🏁 [CRON] Mise à jour terminée en ${totalDuration}ms - Succès: ${allSuccess}`)

  return NextResponse.json({
    ok: allSuccess,
    timestamp: new Date().toISOString(),
    totalDuration,
    results,
  })
}

// Permettre aussi POST pour plus de flexibilité
export async function POST(request: NextRequest) {
  return GET(request)
}
