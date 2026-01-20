import { NextResponse } from 'next/server'

// Cette API renvoie la configuration Firebase au client
// Cela contourne le problème des NEXT_PUBLIC_ qui doivent être présentes au build time
export async function GET() {
  const config = {
    useFirebase: process.env.NEXT_PUBLIC_USE_FIREBASE === 'true',
    firebase: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    }
  }

  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'public, max-age=3600', // Cache 1h
    }
  })
}
