"use client"

import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"

interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

interface FirebaseInstance {
  app: FirebaseApp
  auth: Auth
  db: Firestore
}

// Singleton instances
let firebaseInstance: FirebaseInstance | null = null
let cachedConfig: { useFirebase: boolean; firebase: FirebaseConfig } | null = null
let initPromise: Promise<FirebaseInstance | null> | null = null

// Fetch config from API
async function fetchConfig(): Promise<{ useFirebase: boolean; firebase: FirebaseConfig }> {
  if (cachedConfig) return cachedConfig

  try {
    const res = await fetch('/api/config', { cache: 'no-store' })
    if (!res.ok) throw new Error('Config fetch failed')
    cachedConfig = await res.json()
    return cachedConfig!
  } catch (error) {
    console.error('[Firebase] Failed to fetch config:', error)
    return { useFirebase: false, firebase: {} as FirebaseConfig }
  }
}

// Get or initialize Firebase instance
export async function getFirebaseInstance(): Promise<FirebaseInstance | null> {
  // Return existing instance if available
  if (firebaseInstance) {
    return firebaseInstance
  }

  // If initialization is in progress, wait for it
  if (initPromise) {
    return initPromise
  }

  // Start initialization
  initPromise = (async () => {
    const config = await fetchConfig()

    if (!config.useFirebase || !config.firebase?.apiKey) {
      console.log('[Firebase] Disabled or no API key')
      return null
    }

    try {
      // Reuse existing app if available
      let app: FirebaseApp
      if (getApps().length > 0) {
        app = getApps()[0]!
      } else {
        app = initializeApp(config.firebase)
      }

      firebaseInstance = {
        app,
        auth: getAuth(app),
        db: getFirestore(app),
      }

      console.log('[Firebase] Initialized successfully')
      return firebaseInstance
    } catch (error) {
      console.error('[Firebase] Initialization error:', error)
      return null
    }
  })()

  return initPromise
}

// Check if Firebase is enabled
export async function isFirebaseEnabled(): Promise<boolean> {
  const config = await fetchConfig()
  return config.useFirebase && !!config.firebase?.apiKey
}

// Get cached config
export function getCachedConfig() {
  return cachedConfig
}
