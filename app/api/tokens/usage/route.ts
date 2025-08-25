import { NextRequest, NextResponse } from 'next/server'
import { tokenServiceServer } from '@/lib/token-service.server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 })
    }

    const usage = await tokenServiceServer.getUserTokenUsage(userId)
    return NextResponse.json(usage)
  } catch (error) {
    console.error('Token usage API error:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de l\'utilisation des tokens' },
      { status: 500 }
    )
  }
}
