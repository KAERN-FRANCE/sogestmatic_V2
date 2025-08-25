import * as admin from 'firebase-admin'

let app: admin.app.App | null = null

export function getAdminApp() {
  if (app) return app
  if (!admin.apps.length) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

    if (projectId && clientEmail && privateKey) {
      app = admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      })
    } else {
      // fallback to application default credentials if available
      app = admin.initializeApp()
    }
  } else {
    app = admin.app()
  }
  return app!
}

export function getAdminDb() {
  return getAdminApp().firestore()
}


