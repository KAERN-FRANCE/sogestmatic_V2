import * as admin from 'firebase-admin'

let app: admin.app.App | null = null
let firebaseAvailable: boolean | null = null

export function isFirebaseConfigured(): boolean {
  if (firebaseAvailable !== null) return firebaseAvailable

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY

  firebaseAvailable = !!(projectId && clientEmail && privateKey)
  return firebaseAvailable
}

export function getAdminApp() {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase not configured')
  }

  if (app) return app
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

    app = admin.initializeApp({
      credential: admin.credential.cert({ projectId: projectId!, clientEmail: clientEmail!, privateKey }),
    })
  } else {
    app = admin.app()
  }
  return app!
}

export function getAdminDb() {
  return getAdminApp().firestore()
}


