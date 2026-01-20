import { NextResponse } from 'next/server'

// Cette API renvoie la configuration Firebase au client
// Cela contourne le problème des NEXT_PUBLIC_ qui doivent être présentes au build time
export async function GET() {
  const config = {
    useFirebase: process.env.NEXT_PUBLIC_USE_FIREBASE === 'true',
    firebase: {
      apiKey: (process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '').trim(),
      authDomain: (process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '').trim(),
      projectId: (process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '').trim(),
      storageBucket: (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '').trim(),
      messagingSenderId: (process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
      appId: (process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '').trim(),
    }
  }

  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  })
}
