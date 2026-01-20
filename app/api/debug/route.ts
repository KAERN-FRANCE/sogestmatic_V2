import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
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
        enabled: process.env.NEXT_PUBLIC_USE_FIREBASE === 'true' ? '✅ Activé' : '❌ Désactivé (' + process.env.NEXT_PUBLIC_USE_FIREBASE + ')',
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY
          ? '✅ ' + process.env.NEXT_PUBLIC_FIREBASE_API_KEY.substring(0, 8) + '... (len: ' + process.env.NEXT_PUBLIC_FIREBASE_API_KEY.length + ')'
          : '❌ Manquante',
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '❌ Manquant',
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '❌ Manquant',
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '❌ Manquant',
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '❌ Manquant',
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
          ? '✅ ' + process.env.NEXT_PUBLIC_FIREBASE_APP_ID.substring(0, 10) + '...'
          : '❌ Manquant',
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
