import { NextResponse } from "next/server"
import { allowancesData } from "@/lib/allowances-data"

// Les indemnités sont mises à jour manuellement avec les valeurs officielles 2026
// Pas besoin de fetch IA - on utilise directement les données statiques vérifiées

export async function GET() {
  return NextResponse.json({ ok: true, data: allowancesData })
}
