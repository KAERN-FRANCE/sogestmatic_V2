import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const debug = {
      environment: process.env.NODE_ENV,
      model: process.env.MODEL || 'gpt-4.1-mini (défaut)',
      openaiKey: process.env.OPENAI_API_KEY ? '✅ Configurée' : '❌ Manquante',
      tavilyKey: process.env.TAVILY_API_KEY ? '✅ Configurée' : '❌ Manquante',
      ragK: process.env.RAG_K || '5 (défaut)',
      ragThreshold: process.env.RAG_INTENT_THRESHOLD || '0.35 (défaut)',
      embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small (défaut)',
      systemInstructions: process.env.SYSTEM_INSTRUCTIONS ? '✅ Personnalisées' : '❌ Défaut',
      firebase: {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? '✅ Configurée' : '❌ Manquante',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '❌ Manquant',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '❌ Manquant'
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(debug, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Erreur de diagnostic', 
      details: error?.message || String(error) 
    }, { status: 500 })
  }
}
