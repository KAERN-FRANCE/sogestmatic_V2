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

// Configuration Firebase - chargée depuis l'API au runtime
let firebaseConfig: {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
} | null = null

let useFirebase = false
let configLoaded = false
let firebaseApp: FirebaseApp | null = null

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

// Charger la configuration Firebase depuis l'API
async function loadFirebaseConfig(): Promise<boolean> {
  if (configLoaded) return useFirebase

  try {
    const response = await fetch('/api/config')
    if (!response.ok) {
      configLoaded = true
      return false
    }

    const config = await response.json()
    useFirebase = config.useFirebase === true

    if (useFirebase && config.firebase?.apiKey) {
      firebaseConfig = config.firebase
    }

    configLoaded = true
    return useFirebase && !!firebaseConfig?.apiKey
  } catch {
    configLoaded = true
    return false
  }
}

function getFirebaseApp(): FirebaseApp {
  if (firebaseApp) return firebaseApp

  if (!firebaseConfig?.apiKey || !firebaseConfig?.projectId) {
    throw new Error("Configuration Firebase incomplète")
  }

  if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig)
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
    const cleaned: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue
      cleaned[k] = sanitizeForFirestore(v)
    }
    return cleaned as T
  }
  return value
}

export class AuthService {
  private static instance: AuthService
  private listeners: ((state: AuthState) => void)[] = []
  private state: AuthState = { user: null, isLoading: true }
  private initialized = false

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
      const firebaseEnabled = await loadFirebaseConfig()

      if (firebaseEnabled && firebaseConfig) {
        const app = getFirebaseApp()
        const auth = getAuth(app)

        onAuthStateChanged(auth, async (fbUser) => {
          if (fbUser) {
            try {
              const user = await this.ensureUserProfile(fbUser)
              this.state = { user, isLoading: false }
            } catch {
              this.state = { user: null, isLoading: false }
            }
          } else {
            this.state = { user: null, isLoading: false }
          }
          this.notify()
        })
      } else {
        // Firebase désactivé - utiliser le mode mock
        this.loadUserFromStorage()
      }
    } catch {
      // Erreur lors de l'initialisation - utiliser le mode mock
      this.loadUserFromStorage()
    }
  }

  private async isFirebaseEnabled(): Promise<boolean> {
    await loadFirebaseConfig()
    return useFirebase && !!firebaseConfig?.apiKey
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
        this.state = { user: null, isLoading: false }
      }
    } catch {
      this.state = { user: null, isLoading: false }
    }
    this.notify()
  }

  private async ensureUserProfile(fbUser: FirebaseUser): Promise<User> {
    const app = getFirebaseApp()
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
        const app = getFirebaseApp()
        const auth = getAuth(app)
        const cred = await signInWithEmailAndPassword(auth, email, password)
        const user = await this.ensureUserProfile(cred.user)
        this.state = { user, isLoading: false }
        this.notify()
        return { success: true }
      } catch (e: unknown) {
        this.state = { user: null, isLoading: false }
        this.notify()
        const error = e as { code?: string; message?: string }
        // Translate Firebase error codes to French
        let errorMessage = "Échec de la connexion"
        switch (error?.code) {
          case "auth/invalid-email":
            errorMessage = "Adresse email invalide"
            break
          case "auth/user-disabled":
            errorMessage = "Ce compte a été désactivé"
            break
          case "auth/user-not-found":
            errorMessage = "Aucun compte trouvé avec cet email"
            break
          case "auth/wrong-password":
            errorMessage = "Mot de passe incorrect"
            break
          case "auth/invalid-credential":
            errorMessage = "Email ou mot de passe incorrect"
            break
          case "auth/too-many-requests":
            errorMessage = "Trop de tentatives. Veuillez réessayer plus tard"
            break
          case "auth/network-request-failed":
            errorMessage = "Erreur de connexion réseau"
            break
          default:
            errorMessage = error?.message || "Échec de la connexion"
        }
        return { success: false, error: errorMessage }
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
        const app = getFirebaseApp()
        const auth = getAuth(app)
        const db = getFirestore(app)
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
      } catch (e: unknown) {
        this.state = { user: null, isLoading: false }
        this.notify()
        const error = e as { code?: string; message?: string }
        // Translate Firebase error codes to French
        let errorMessage = "Échec de l'inscription"
        switch (error?.code) {
          case "auth/email-already-in-use":
            errorMessage = "Un compte avec cet email existe déjà"
            break
          case "auth/invalid-email":
            errorMessage = "Adresse email invalide"
            break
          case "auth/weak-password":
            errorMessage = "Le mot de passe doit contenir au moins 6 caractères"
            break
          case "auth/operation-not-allowed":
            errorMessage = "L'inscription est temporairement désactivée"
            break
          case "auth/network-request-failed":
            errorMessage = "Erreur de connexion réseau"
            break
          default:
            errorMessage = error?.message || "Échec de l'inscription"
        }
        return { success: false, error: errorMessage }
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
    MOCK_USERS.push({ ...newUser, password, ...extras } as typeof MOCK_USERS[0])
    localStorage.setItem("sogestmatic_user", JSON.stringify(newUser))
    this.state = { user: newUser, isLoading: false }
    this.notify()
    return { success: true }
  }

  async logout() {
    if (await this.isFirebaseEnabled()) {
      try {
        const app = getFirebaseApp()
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
        const app = getFirebaseApp()
        const auth = getAuth(app)
        await sendPasswordResetEmail(auth, email)
        return { success: true }
      } catch (e: unknown) {
        const error = e as { message?: string }
        return { success: false, error: error?.message || "Impossible d'envoyer l'email de réinitialisation" }
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
