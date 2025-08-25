import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Vérifier les variables d'environnement
    const openaiApiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY
    const firebaseApiKey = process.env.FIREBASE_API_KEY
    const firebaseAuthDomain = process.env.FIREBASE_AUTH_DOMAIN
    const firebaseProjectId = process.env.FIREBASE_PROJECT_ID

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasOpenAIKey: !!openaiApiKey,
        hasFirebaseConfig: !!(firebaseApiKey && firebaseAuthDomain && firebaseProjectId),
        openaiKeyLength: openaiApiKey ? openaiApiKey.length : 0,
        firebaseApiKeyLength: firebaseApiKey ? firebaseApiKey.length : 0,
      },
      message: 'API de test fonctionnelle'
    })
  } catch (error) {
    console.error('Test API error:', error)
    return NextResponse.json(
      { 
        status: 'error',
        error: 'Erreur lors du test de l\'API',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
