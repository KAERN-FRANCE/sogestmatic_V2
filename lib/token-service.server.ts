import { initializeApp, getApps } from "firebase/app"
import { getFirestore, doc, getDoc, setDoc, increment, collection, query, where, getDocs, writeBatch } from "firebase/firestore"

// Limites de tokens par mois selon le rôle
const TOKEN_LIMITS = {
  gratuit: 1_000_000,    // 1 million de tokens
  premium: 4_000_000,    // 4 millions de tokens
  admin: Infinity        // Illimité
} as const

export interface TokenUsage {
  userId: string
  currentMonth: string // Format: "YYYY-MM"
  tokensUsed: number
  lastReset: string
}

export class TokenServiceServer {
  private static instance: TokenServiceServer

  static getInstance(): TokenServiceServer {
    if (!TokenServiceServer.instance) {
      TokenServiceServer.instance = new TokenServiceServer()
    }
    return TokenServiceServer.instance
  }

  private getFirebaseApp() {
    if (!getApps().length) {
      // Utiliser la config publique Firebase
      return initializeApp({
        apiKey: process.env.FIREBASE_API_KEY,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        projectId: process.env.FIREBASE_PROJECT_ID,
      })
    }
    return getApps()[0]
  }

  /**
   * Obtient l'utilisation de tokens pour un utilisateur
   */
  async getUserTokenUsage(userId: string): Promise<TokenUsage> {
    try {
      const app = this.getFirebaseApp()
      const db = getFirestore(app)
      const currentMonth = new Date().toISOString().slice(0, 7) // "YYYY-MM"
      
      const tokenDoc = doc(db, "token_usage", `${userId}_${currentMonth}`)
      const tokenSnap = await getDoc(tokenDoc)
      
      if (tokenSnap.exists()) {
        return tokenSnap.data() as TokenUsage
      }
      
      // Créer un nouveau document pour le mois en cours
      const newUsage: TokenUsage = {
        userId,
        currentMonth,
        tokensUsed: 0,
        lastReset: new Date().toISOString()
      }
      
      await setDoc(tokenDoc, newUsage)
      return newUsage
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisation des tokens:", error)
      return {
        userId,
        currentMonth: new Date().toISOString().slice(0, 7),
        tokensUsed: 0,
        lastReset: new Date().toISOString()
      }
    }
  }

  /**
   * Vérifie si un utilisateur peut utiliser des tokens
   */
  async canUseTokens(userId: string, userRole: "gratuit" | "premium" | "admin", tokensToUse: number): Promise<{
    canUse: boolean
    currentUsage: number
    limit: number
    remaining: number
    error?: string
  }> {
    try {
      // Les admins ont un accès illimité
      if (userRole === "admin") {
        return {
          canUse: true,
          currentUsage: 0,
          limit: Infinity,
          remaining: Infinity
        }
      }

      const usage = await this.getUserTokenUsage(userId)
      const limit = TOKEN_LIMITS[userRole]
      const remaining = limit - usage.tokensUsed

      if (remaining < tokensToUse) {
        return {
          canUse: false,
          currentUsage: usage.tokensUsed,
          limit,
          remaining,
          error: `Limite de tokens dépassée. Vous avez utilisé ${usage.tokensUsed.toLocaleString()} tokens sur ${limit.toLocaleString()} ce mois-ci.`
        }
      }

      return {
        canUse: true,
        currentUsage: usage.tokensUsed,
        limit,
        remaining: remaining - tokensToUse
      }
    } catch (error) {
      console.error("Erreur lors de la vérification des tokens:", error)
      return {
        canUse: false,
        currentUsage: 0,
        limit: TOKEN_LIMITS[userRole],
        remaining: 0,
        error: "Erreur lors de la vérification des limites de tokens"
      }
    }
  }

  /**
   * Consomme des tokens pour un utilisateur
   */
  async consumeTokens(userId: string, tokensToConsume: number): Promise<void> {
    try {
      const app = this.getFirebaseApp()
      const db = getFirestore(app)
      const currentMonth = new Date().toISOString().slice(0, 7)
      
      const tokenDoc = doc(db, "token_usage", `${userId}_${currentMonth}`)
      
      await setDoc(tokenDoc, {
        userId,
        currentMonth,
        tokensUsed: increment(tokensToConsume),
        lastReset: new Date().toISOString()
      }, { merge: true })
    } catch (error) {
      console.error("Erreur lors de la consommation des tokens:", error)
    }
  }

  /**
   * Obtient les statistiques de tokens pour un utilisateur
   */
  async getTokenStats(userId: string, userRole: "gratuit" | "premium" | "admin"): Promise<{
    currentUsage: number
    limit: number
    remaining: number
    percentageUsed: number
    resetDate: string
  }> {
    try {
      const usage = await this.getUserTokenUsage(userId)
      const limit = TOKEN_LIMITS[userRole]
      const remaining = Math.max(0, limit - usage.tokensUsed)
      const percentageUsed = limit === Infinity ? 0 : (usage.tokensUsed / limit) * 100

      // Calculer la date de réinitialisation (début du mois prochain)
      const resetDate = new Date()
      resetDate.setMonth(resetDate.getMonth() + 1)
      resetDate.setDate(1)
      resetDate.setHours(0, 0, 0, 0)

      return {
        currentUsage: usage.tokensUsed,
        limit,
        remaining,
        percentageUsed,
        resetDate: resetDate.toISOString()
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques de tokens:", error)
      return {
        currentUsage: 0,
        limit: TOKEN_LIMITS[userRole],
        remaining: TOKEN_LIMITS[userRole],
        percentageUsed: 0,
        resetDate: new Date().toISOString()
      }
    }
  }

  /**
   * Réinitialise les tokens pour un nouveau mois
   */
  async resetMonthlyTokens(): Promise<void> {
    try {
      const app = this.getFirebaseApp()
      const db = getFirestore(app)
      const lastMonth = new Date()
      lastMonth.setMonth(lastMonth.getMonth() - 1)
      const lastMonthStr = lastMonth.toISOString().slice(0, 7)
      
      // Supprimer les anciens documents d'utilisation
      const usageRef = collection(db, "token_usage")
      const q = query(usageRef, where("currentMonth", "==", lastMonthStr))
      const querySnapshot = await getDocs(q)
      
      const batch = writeBatch(db)
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref)
      })
      
      await batch.commit()
    } catch (error) {
      console.error("Erreur lors de la réinitialisation des tokens:", error)
    }
  }
}

export const tokenServiceServer = TokenServiceServer.getInstance()
