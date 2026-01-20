import { NextResponse } from 'next/server'

// Cette API renvoie la configuration Firebase au client
// Cela contourne le problème des NEXT_PUBLIC_ qui doivent être présentes au build time
export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''

  // Log pour debug (masqué partiellement)
  console.log('[Config API] Firebase config:', {
    useFirebase: process.env.NEXT_PUBLIC_USE_FIREBASE,
    apiKeyPrefix: apiKey.substring(0, 10) + '...',
    apiKeyLength: apiKey.length,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })

  const config = {
    useFirebase: process.env.NEXT_PUBLIC_USE_FIREBASE === 'true',
    firebase: {
      apiKey: apiKey,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    }
  }

  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'no-cache', // Désactiver le cache pour debug
    }
  })
}
