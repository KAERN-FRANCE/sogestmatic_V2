import { NextRequest, NextResponse } from 'next/server'
import { tokenServiceServer } from '@/lib/token-service.server'

export async function POST(request: NextRequest) {
  try {
    await tokenServiceServer.resetMonthlyTokens()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Token reset API error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la réinitialisation des tokens' },
      { status: 500 }
    )
  }
}
