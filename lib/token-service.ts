"use client"

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

export class TokenService {
  private static instance: TokenService

  static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService()
    }
    return TokenService.instance
  }

  /**
   * Obtient l'utilisation de tokens pour un utilisateur
   */
  async getUserTokenUsage(userId: string): Promise<TokenUsage> {
    try {
      // Appel à l'API pour obtenir l'utilisation
      const response = await fetch(`/api/tokens/usage?userId=${userId}`)
      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de l\'utilisation des tokens')
      }
      return await response.json()
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
      // Appel à l'API pour consommer des tokens
      const response = await fetch('/api/tokens/consume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          tokensToConsume
        }),
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de la consommation des tokens')
      }
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
      // Appel à l'API pour réinitialiser les tokens
      const response = await fetch('/api/tokens/reset', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Erreur lors de la réinitialisation des tokens')
      }
    } catch (error) {
      console.error("Erreur lors de la réinitialisation des tokens:", error)
    }
  }
}

export const tokenService = TokenService.getInstance()
