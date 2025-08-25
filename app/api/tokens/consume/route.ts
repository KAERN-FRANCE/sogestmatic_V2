import { NextRequest, NextResponse } from 'next/server'
import { tokenServiceServer } from '@/lib/token-service.server'

export async function POST(request: NextRequest) {
  try {
    const { userId, tokensToConsume } = await request.json()

    if (!userId || !tokensToConsume) {
      return NextResponse.json({ error: 'userId et tokensToConsume requis' }, { status: 400 })
    }

    await tokenServiceServer.consumeTokens(userId, tokensToConsume)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Token consume API error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la consommation des tokens' },
      { status: 500 }
    )
  }
}
