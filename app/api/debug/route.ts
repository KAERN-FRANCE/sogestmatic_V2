import { NextRequest, NextResponse } from 'next/server'

export async function GET(_request: NextRequest) {
  try {
    // Utiliser les variables serveur (FIREBASE_*) avec fallback sur NEXT_PUBLIC_* pour dev local
    const useFirebase = process.env.USE_FIREBASE || process.env.NEXT_PUBLIC_USE_FIREBASE
    const firebaseApiKey = process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY
    const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const firebaseAuthDomain = process.env.FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
    const firebaseStorageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    const firebaseMessagingSenderId = process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
    const firebaseAppId = process.env.FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID

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
        enabled: useFirebase === 'true' ? '✅ Activé' : '❌ Désactivé',
        apiKey: firebaseApiKey ? '✅ Configurée' : '❌ Manquante',
        projectId: firebaseProjectId ? '✅ Configuré' : '❌ Manquant',
        authDomain: firebaseAuthDomain ? '✅ Configuré' : '❌ Manquant',
        storageBucket: firebaseStorageBucket ? '✅ Configuré' : '❌ Manquant',
        messagingSenderId: firebaseMessagingSenderId ? '✅ Configuré' : '❌ Manquant',
        appId: firebaseAppId ? '✅ Configuré' : '❌ Manquant',
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
