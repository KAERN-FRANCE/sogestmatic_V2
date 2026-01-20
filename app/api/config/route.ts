import { NextResponse } from 'next/server'

// Cette API renvoie la configuration Firebase au client
// On utilise des variables SANS préfixe NEXT_PUBLIC_ car celles-ci ne sont pas disponibles
// au runtime côté serveur (seulement au build time)
export async function GET() {
  // Utiliser les variables serveur (FIREBASE_*) avec fallback sur NEXT_PUBLIC_* pour dev local
  const config = {
    useFirebase: (process.env.USE_FIREBASE || process.env.NEXT_PUBLIC_USE_FIREBASE) === 'true',
    firebase: {
      apiKey: (process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '').trim(),
      authDomain: (process.env.FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '').trim(),
      projectId: (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '').trim(),
      storageBucket: (process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '').trim(),
      messagingSenderId: (process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
      appId: (process.env.FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '').trim(),
    }
  }

  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  })
}
