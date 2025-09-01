import { initializeApp } from "firebase/app"
import { getFirestore, doc, getDoc, setDoc, increment } from "firebase/firestore"

// Configuration Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialiser Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

export interface MessageUsage {
  userId: string
  date: string // Format YYYY-MM-DD
  count: number
  lastReset: string
}

export interface MessageLimits {
  gratuit: number
  premium: number
  admin: number
}

// Limites par type d'abonnement
export const MESSAGE_LIMITS: MessageLimits = {
  gratuit: 10,
  premium: 30,
  admin: -1 // -1 = illimité
}

export class MessageLimitService {
  private static instance: MessageLimitService

  static getInstance(): MessageLimitService {
    if (!MessageLimitService.instance) {
      MessageLimitService.instance = new MessageLimitService()
    }
    return MessageLimitService.instance
  }

  // Obtenir la limite pour un rôle donné
  getLimitForRole(role: "gratuit" | "premium" | "admin"): number {
    return MESSAGE_LIMITS[role]
  }

  // Obtenir la date d'aujourd'hui au format YYYY-MM-DD
  private getTodayString(): string {
    return new Date().toISOString().split('T')[0]
  }

  // Vérifier si c'est un nouveau jour (pour réinitialiser le compteur)
  private isNewDay(lastReset: string): boolean {
    const today = this.getTodayString()
    return lastReset !== today
  }

  // Obtenir l'utilisation des messages pour un utilisateur
  async getMessageUsage(userId: string): Promise<MessageUsage> {
    try {
      const today = this.getTodayString()
      const usageRef = doc(db, 'messageUsage', `${userId}_${today}`)
      const usageDoc = await getDoc(usageRef)

      if (usageDoc.exists()) {
        const data = usageDoc.data() as MessageUsage
        return data
      } else {
        // Créer un nouveau document d'utilisation
        const newUsage: MessageUsage = {
          userId,
          date: today,
          count: 0,
          lastReset: today
        }
        await setDoc(usageRef, newUsage)
        return newUsage
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisation:', error)
      // Retourner un usage par défaut en cas d'erreur
      return {
        userId,
        date: this.getTodayString(),
        count: 0,
        lastReset: this.getTodayString()
      }
    }
  }

  // Incrémenter le compteur de messages
  async incrementMessageCount(userId: string): Promise<void> {
    try {
      const today = this.getTodayString()
      const usageRef = doc(db, 'messageUsage', `${userId}_${today}`)
      
      await setDoc(usageRef, {
        userId,
        date: today,
        count: increment(1),
        lastReset: today
      }, { merge: true })
    } catch (error) {
      console.error('Erreur lors de l\'incrémentation du compteur:', error)
    }
  }

  // Vérifier si un utilisateur peut envoyer un message
  async canSendMessage(userId: string, userRole: "gratuit" | "premium" | "admin"): Promise<{
    canSend: boolean
    currentCount: number
    limit: number
    remaining: number
  }> {
    const limit = this.getLimitForRole(userRole)
    
    // Les admins ont un accès illimité
    if (limit === -1) {
      return {
        canSend: true,
        currentCount: 0,
        limit: -1,
        remaining: -1
      }
    }

    try {
      const usage = await this.getMessageUsage(userId)
      
      // Vérifier si c'est un nouveau jour
      if (this.isNewDay(usage.lastReset)) {
        // Réinitialiser le compteur pour un nouveau jour
        await setDoc(doc(db, 'messageUsage', `${userId}_${this.getTodayString()}`), {
          userId,
          date: this.getTodayString(),
          count: 0,
          lastReset: this.getTodayString()
        })
        return {
          canSend: true,
          currentCount: 0,
          limit,
          remaining: limit
        }
      }

      const remaining = limit - usage.count
      return {
        canSend: usage.count < limit,
        currentCount: usage.count,
        limit,
        remaining: Math.max(0, remaining)
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des limites:', error)
      // En cas d'erreur, permettre l'envoi
      return {
        canSend: true,
        currentCount: 0,
        limit,
        remaining: limit
      }
    }
  }

  // Obtenir le statut des limites pour l'affichage
  async getLimitStatus(userId: string, userRole: "gratuit" | "premium" | "admin"): Promise<{
    currentCount: number
    limit: number
    remaining: number
    isUnlimited: boolean
  }> {
    const limit = this.getLimitForRole(userRole)
    
    if (limit === -1) {
      return {
        currentCount: 0,
        limit: -1,
        remaining: -1,
        isUnlimited: true
      }
    }

    try {
      const usage = await this.getMessageUsage(userId)
      const remaining = Math.max(0, limit - usage.count)
      
      return {
        currentCount: usage.count,
        limit,
        remaining,
        isUnlimited: false
      }
    } catch (error) {
      console.error('Erreur lors de la récupération du statut:', error)
      return {
        currentCount: 0,
        limit,
        remaining: limit,
        isUnlimited: false
      }
    }
  }
}
