"use client"

import { initializeApp, getApps, deleteApp, type FirebaseApp } from "firebase/app"
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  type User as FirebaseUser,
  type Auth,
} from "firebase/auth"
import { getFirestore, doc, getDoc, setDoc, type Firestore } from "firebase/firestore"

export interface User {
  id: string
  name: string
  email: string
  role: "gratuit" | "premium" | "admin"
  createdAt: string
}

export interface BillingAddress {
  company: string
  country: string
  siret: string
  vat?: string
  address1: string
  address2?: string
  postalCode: string
  city: string
  phone: string
}

export interface UserProfileExtras {
  civility?: string
  firstName?: string
  lastName?: string
  consent?: boolean
  billing?: BillingAddress
}

export interface AuthState {
  user: User | null
  isLoading: boolean
}

interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

// Singleton instances
let firebaseApp: FirebaseApp | null = null
let firebaseAuth: Auth | null = null
let firebaseDb: Firestore | null = null
let cachedConfig: { useFirebase: boolean; firebase: FirebaseConfig } | null = null

// Fetch config from API
async function fetchConfig(): Promise<{ useFirebase: boolean; firebase: FirebaseConfig }> {
  if (cachedConfig) return cachedConfig

  try {
    const res = await fetch('/api/config', { cache: 'no-store' })
    if (!res.ok) throw new Error('Config fetch failed')
    cachedConfig = await res.json()
    return cachedConfig!
  } catch (error) {
    console.error('[Auth] Failed to fetch config:', error)
    return { useFirebase: false, firebase: {} as FirebaseConfig }
  }
}

// Initialize Firebase with fresh config
async function initFirebase(): Promise<{ app: FirebaseApp; auth: Auth; db: Firestore } | null> {
  if (firebaseApp && firebaseAuth && firebaseDb) {
    return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb }
  }

  const config = await fetchConfig()

  if (!config.useFirebase || !config.firebase?.apiKey) {
    console.log('[Auth] Firebase disabled or no API key')
    return null
  }

  try {
    // Clear any existing apps to ensure fresh initialization
    const existingApps = getApps()
    for (const app of existingApps) {
      await deleteApp(app)
    }

    // Initialize fresh
    firebaseApp = initializeApp(config.firebase)
    firebaseAuth = getAuth(firebaseApp)
    firebaseDb = getFirestore(firebaseApp)

    console.log('[Auth] Firebase initialized successfully')
    return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb }
  } catch (error) {
    console.error('[Auth] Firebase initialization error:', error)
    return null
  }
}

// Sanitize objects for Firestore (remove undefined values)
function sanitizeForFirestore<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeForFirestore(v)) as unknown as T
  }
  if (value && typeof value === "object") {
    const cleaned: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue
      cleaned[k] = sanitizeForFirestore(v)
    }
    return cleaned as T
  }
  return value
}

// Translate Firebase error codes to French
function translateFirebaseError(error: { code?: string; message?: string }, isLogin: boolean): string {
  const code = error?.code || ''

  if (isLogin) {
    switch (code) {
      case "auth/invalid-email": return "Adresse email invalide"
      case "auth/user-disabled": return "Ce compte a été désactivé"
      case "auth/user-not-found": return "Aucun compte trouvé avec cet email"
      case "auth/wrong-password": return "Mot de passe incorrect"
      case "auth/invalid-credential": return "Email ou mot de passe incorrect"
      case "auth/too-many-requests": return "Trop de tentatives. Veuillez réessayer plus tard"
      case "auth/network-request-failed": return "Erreur de connexion réseau"
      case "auth/invalid-api-key": return "Erreur de configuration. Contactez l'administrateur."
      default: return error?.message || "Échec de la connexion"
    }
  } else {
    switch (code) {
      case "auth/email-already-in-use": return "Un compte avec cet email existe déjà"
      case "auth/invalid-email": return "Adresse email invalide"
      case "auth/weak-password": return "Le mot de passe doit contenir au moins 6 caractères"
      case "auth/operation-not-allowed": return "L'inscription est temporairement désactivée"
      case "auth/network-request-failed": return "Erreur de connexion réseau"
      case "auth/invalid-api-key": return "Erreur de configuration. Contactez l'administrateur."
      default: return error?.message || "Échec de l'inscription"
    }
  }
}

export class AuthService {
  private static instance: AuthService
  private listeners: ((state: AuthState) => void)[] = []
  private state: AuthState = { user: null, isLoading: true }
  private initialized = false
  private unsubscribeAuth: (() => void) | null = null

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  constructor() {
    if (typeof window !== "undefined") {
      this.initializeAuth()
    }
  }

  private async initializeAuth() {
    if (this.initialized) return
    this.initialized = true

    try {
      const firebase = await initFirebase()

      if (firebase) {
        // Firebase mode
        this.unsubscribeAuth = onAuthStateChanged(firebase.auth, async (fbUser) => {
          if (fbUser) {
            try {
              const user = await this.loadUserProfile(fbUser, firebase.db)
              this.setState({ user, isLoading: false })
            } catch (error) {
              console.error('[Auth] Error loading user profile:', error)
              this.setState({ user: null, isLoading: false })
            }
          } else {
            this.setState({ user: null, isLoading: false })
          }
        })
      } else {
        // Mock mode - load from localStorage
        this.loadFromStorage()
      }
    } catch (error) {
      console.error('[Auth] Initialization error:', error)
      this.loadFromStorage()
    }
  }

  private async loadUserProfile(fbUser: FirebaseUser, db: Firestore): Promise<User> {
    const ref = doc(db, "users", fbUser.uid)
    const snap = await getDoc(ref)

    if (snap.exists()) {
      const data = snap.data() as Partial<User>
      return {
        id: fbUser.uid,
        name: data.name || fbUser.displayName || fbUser.email?.split("@")[0] || "Utilisateur",
        email: fbUser.email || "",
        role: (data.role as User["role"]) || "gratuit",
        createdAt: data.createdAt || new Date().toISOString(),
      }
    }

    // Create new user profile
    const user: User = {
      id: fbUser.uid,
      name: fbUser.displayName || fbUser.email?.split("@")[0] || "Utilisateur",
      email: fbUser.email || "",
      role: "gratuit",
      createdAt: new Date().toISOString(),
    }
    await setDoc(ref, user)
    return user
  }

  private loadFromStorage() {
    try {
      const userData = localStorage.getItem("sogestmatic_user")
      if (userData) {
        const user = JSON.parse(userData)
        this.setState({ user, isLoading: false })
      } else {
        this.setState({ user: null, isLoading: false })
      }
    } catch {
      this.setState({ user: null, isLoading: false })
    }
  }

  private setState(newState: AuthState) {
    this.state = newState
    this.notify()
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state))
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    this.setState({ ...this.state, isLoading: true })

    const firebase = await initFirebase()

    if (firebase) {
      try {
        const cred = await signInWithEmailAndPassword(firebase.auth, email, password)
        const user = await this.loadUserProfile(cred.user, firebase.db)
        this.setState({ user, isLoading: false })
        return { success: true }
      } catch (e: unknown) {
        this.setState({ user: null, isLoading: false })
        const error = e as { code?: string; message?: string }
        console.error('[Auth] Login error:', error.code, error.message)
        return { success: false, error: translateFirebaseError(error, true) }
      }
    }

    // Mock fallback
    await new Promise((r) => setTimeout(r, 300))

    const mockUsers = [
      { id: "1", name: "Admin User", email: "admin@sogestmatic.com", password: "admin123", role: "admin" as const },
      { id: "2", name: "Test User", email: "user@test.com", password: "user123", role: "gratuit" as const },
    ]

    const mockUser = mockUsers.find((u) => u.email === email && u.password === password)
    if (mockUser) {
      const user: User = {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem("sogestmatic_user", JSON.stringify(user))
      this.setState({ user, isLoading: false })
      return { success: true }
    }

    this.setState({ user: null, isLoading: false })
    return { success: false, error: "Email ou mot de passe incorrect" }
  }

  async register(
    name: string,
    email: string,
    password: string,
    extras?: UserProfileExtras
  ): Promise<{ success: boolean; error?: string }> {
    this.setState({ ...this.state, isLoading: true })

    const firebase = await initFirebase()

    if (firebase) {
      try {
        const cred = await createUserWithEmailAndPassword(firebase.auth, email, password)

        if (firebase.auth.currentUser) {
          await updateProfile(firebase.auth.currentUser, { displayName: name })
        }

        const user: User = {
          id: cred.user.uid,
          name,
          email: cred.user.email || email,
          role: "gratuit",
          createdAt: new Date().toISOString(),
        }

        const payload = sanitizeForFirestore({ ...user, ...extras })
        await setDoc(doc(firebase.db, "users", cred.user.uid), payload)

        this.setState({ user, isLoading: false })
        return { success: true }
      } catch (e: unknown) {
        this.setState({ user: null, isLoading: false })
        const error = e as { code?: string; message?: string }
        console.error('[Auth] Register error:', error.code, error.message)
        return { success: false, error: translateFirebaseError(error, false) }
      }
    }

    // Mock fallback
    await new Promise((r) => setTimeout(r, 300))

    const user: User = {
      id: Date.now().toString(),
      name,
      email,
      role: "gratuit",
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem("sogestmatic_user", JSON.stringify(user))
    this.setState({ user, isLoading: false })
    return { success: true }
  }

  async logout() {
    const firebase = await initFirebase()

    if (firebase) {
      try {
        await signOut(firebase.auth)
      } catch (error) {
        console.error('[Auth] Logout error:', error)
      }
    }

    localStorage.removeItem("sogestmatic_user")
    this.setState({ user: null, isLoading: false })
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    const firebase = await initFirebase()

    if (firebase) {
      try {
        await sendPasswordResetEmail(firebase.auth, email)
        return { success: true }
      } catch (e: unknown) {
        const error = e as { code?: string; message?: string }
        return { success: false, error: translateFirebaseError(error, true) }
      }
    }

    // Mock fallback
    return { success: true }
  }

  getState(): AuthState {
    return this.state
  }

  getCurrentUser(): User | null {
    return this.state.user
  }

  isAdmin(): boolean {
    return this.state.user?.role === "admin"
  }
}
