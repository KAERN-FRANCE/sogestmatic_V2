"use client"

import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth"
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore"

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

// Cache de la configuration Firebase (chargée depuis l'API)
let cachedConfig: {
  useFirebase: boolean
  firebase: {
    apiKey: string
    authDomain: string
    projectId: string
    storageBucket: string
    messagingSenderId: string
    appId: string
  }
} | null = null

let configPromise: Promise<typeof cachedConfig> | null = null

// Charger la configuration depuis l'API (contourne le problème NEXT_PUBLIC_ au build time)
async function loadConfig() {
  if (cachedConfig) return cachedConfig
  if (configPromise) return configPromise

  configPromise = fetch('/api/config')
    .then(res => res.json())
    .then(config => {
      cachedConfig = config
      console.info("[Auth] Configuration chargée depuis API:", {
        useFirebase: config.useFirebase,
        hasApiKey: !!config.firebase?.apiKey,
        projectId: config.firebase?.projectId,
      })
      return config
    })
    .catch(err => {
      console.error("[Auth] Erreur chargement config:", err)
      return null
    })

  return configPromise
}

// Fallback mock users (used when Firebase is not configured)
const MOCK_USERS = [
  {
    id: "1",
    name: "Admin User",
    email: "admin@sogestmatic.com",
    password: "admin123",
    role: "admin" as const,
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Test User",
    email: "user@test.com",
    password: "user123",
    role: "gratuit" as const,
    createdAt: new Date().toISOString(),
  },
]

let firebaseApp: FirebaseApp | null = null

function getFirebaseApp(config: NonNullable<typeof cachedConfig>['firebase']) {
  if (firebaseApp) return firebaseApp

  if (!config.apiKey || !config.projectId) {
    console.error("[Auth] Configuration Firebase manquante:", {
      hasApiKey: !!config.apiKey,
      hasProjectId: !!config.projectId,
      hasAuthDomain: !!config.authDomain,
    })
    throw new Error("Configuration Firebase incomplète")
  }

  if (!getApps().length) {
    console.info("[Auth] Initialisation Firebase avec projectId:", config.projectId)
    firebaseApp = initializeApp(config)
  } else {
    firebaseApp = getApps()[0]!
  }

  return firebaseApp
}

// Remove all undefined values recursively so Firestore accepts the payload
function sanitizeForFirestore<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeForFirestore(v)) as unknown as T
  }
  if (value && typeof value === "object") {
    const cleaned: any = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue
      cleaned[k] = sanitizeForFirestore(v as any)
    }
    return cleaned
  }
  return value
}

export class AuthService {
  private static instance: AuthService
  private listeners: ((state: AuthState) => void)[] = []
  private state: AuthState = { user: null, isLoading: true }
  private configLoaded = false

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
    try {
      const config = await loadConfig()
      this.configLoaded = true

      if (config?.useFirebase && config.firebase?.apiKey) {
        console.info("[Auth] Firebase activé", { projectId: config.firebase.projectId })
        const app = getFirebaseApp(config.firebase)
        const auth = getAuth(app)
        onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser) {
            const user = await this.ensureUserProfile(fbUser)
            this.state = { user, isLoading: false }
          } else {
            this.state = { user: null, isLoading: false }
          }
          this.notify()
        })
      } else {
        console.info("[Auth] Mode mock (Firebase désactivé)")
        this.loadUserFromStorage()
      }
    } catch (err) {
      console.error("[Auth] Erreur initialisation:", err)
      this.loadUserFromStorage()
    }
  }

  private async isFirebaseEnabled(): Promise<boolean> {
    if (!this.configLoaded) {
      await loadConfig()
      this.configLoaded = true
    }
    return !!(cachedConfig?.useFirebase && cachedConfig.firebase?.apiKey)
  }

  private getApp() {
    if (!cachedConfig?.firebase) {
      throw new Error("Configuration Firebase non chargée")
    }
    return getFirebaseApp(cachedConfig.firebase)
  }

  subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state))
  }

  private loadUserFromStorage() {
    try {
      const userData = localStorage.getItem("sogestmatic_user")
      if (userData) {
        const user = JSON.parse(userData)
        this.state = { user, isLoading: false }
      } else {
        // Pas d'utilisateur connecté
        this.state = { user: null, isLoading: false }
      }
    } catch {
      this.state = { user: null, isLoading: false }
    }
    this.notify()
  }

  private async ensureUserProfile(fbUser: FirebaseUser): Promise<User> {
    const app = this.getApp()
    const db = getFirestore(app)
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

  async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    this.state = { ...this.state, isLoading: true }
    this.notify()

    if (await this.isFirebaseEnabled()) {
      try {
        const app = this.getApp()
        const auth = getAuth(app)
        const cred = await signInWithEmailAndPassword(auth, email, password)
        const user = await this.ensureUserProfile(cred.user)
        this.state = { user, isLoading: false }
        this.notify()
        return { success: true }
      } catch (e: any) {
        console.error("[Auth] login Firebase error", e)
        this.state = { user: null, isLoading: false }
        this.notify()
        return { success: false, error: e?.message || "Échec de la connexion" }
      }
    }

    // Mock fallback
    await new Promise((resolve) => setTimeout(resolve, 500))
    const mockUser = MOCK_USERS.find((u) => u.email === email && u.password === password)
    if (mockUser) {
      const user: User = {
        id: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        createdAt: mockUser.createdAt,
      }
      localStorage.setItem("sogestmatic_user", JSON.stringify(user))
      this.state = { user, isLoading: false }
      this.notify()
      return { success: true }
    }
    this.state = { user: null, isLoading: false }
    this.notify()
    return { success: false, error: "Email ou mot de passe incorrect" }
  }

  async register(
    name: string,
    email: string,
    password: string,
    extras?: UserProfileExtras,
  ): Promise<{ success: boolean; error?: string }> {
    this.state = { ...this.state, isLoading: true }
    this.notify()

    if (await this.isFirebaseEnabled()) {
      try {
        const app = this.getApp()
        const auth = getAuth(app)
        const db = getFirestore(app)
        console.info("[Auth] register via Firebase", { projectId: cachedConfig?.firebase?.projectId })
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: name })
        }
        const user: User = {
          id: cred.user.uid,
          name,
          email: cred.user.email || email,
          role: "gratuit",
          createdAt: new Date().toISOString(),
        }
        const payload = sanitizeForFirestore({ ...user, ...extras })
        await setDoc(doc(db, "users", cred.user.uid), payload)
        this.state = { user, isLoading: false }
        this.notify()
        return { success: true }
      } catch (e: any) {
        console.error("[Auth] register Firebase error", e)
        this.state = { user: null, isLoading: false }
        this.notify()
        return { success: false, error: e?.message || "Échec de l'inscription" }
      }
    }

    // Mock fallback
    await new Promise((resolve) => setTimeout(resolve, 500))
    const existingUser = MOCK_USERS.find((u) => u.email === email)
    if (existingUser) {
      this.state = { user: null, isLoading: false }
      this.notify()
      return { success: false, error: "Un compte avec cet email existe déjà" }
    }
    const newUser: User = {
      id: Date.now().toString(),
      name,
      email,
      role: "gratuit",
      createdAt: new Date().toISOString(),
    }
    MOCK_USERS.push({ ...newUser, password, ...extras } as any)
    localStorage.setItem("sogestmatic_user", JSON.stringify(newUser))
    this.state = { user: newUser, isLoading: false }
    this.notify()
    return { success: true }
  }

  async logout() {
    if (await this.isFirebaseEnabled()) {
      try {
        const app = this.getApp()
        const auth = getAuth(app)
        await signOut(auth)
      } catch {
        // ignore
      }
    }
    localStorage.removeItem("sogestmatic_user")
    this.state = { user: null, isLoading: false }
    this.notify()
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    if (await this.isFirebaseEnabled()) {
      try {
        const app = this.getApp()
        const auth = getAuth(app)
        await sendPasswordResetEmail(auth, email)
        return { success: true }
      } catch (e: any) {
        return { success: false, error: e?.message || "Impossible d'envoyer l'email de réinitialisation" }
      }
    }
    // Mock fallback
    await new Promise((resolve) => setTimeout(resolve, 300))
    const user = MOCK_USERS.find((u) => u.email === email)
    if (user) return { success: true }
    return { success: false, error: "Aucun compte trouvé avec cet email" }
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
