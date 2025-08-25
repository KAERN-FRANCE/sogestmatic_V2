"use client"

export interface RegulationSummary {
  id: string
  originalText: string
  summary: string
  impact: string
  generatedAt: string
  title: string
}

export class GPTService {
  private static instance: GPTService

  static getInstance(): GPTService {
    if (!GPTService.instance) {
      GPTService.instance = new GPTService()
    }
    return GPTService.instance
  }

  async summarizeRegulations(text: string): Promise<{ success: boolean; data?: RegulationSummary; error?: string }> {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Mock GPT-5 response - in production, this would call the actual GPT-5 API
      const mockSummary: RegulationSummary = {
        id: Date.now().toString(),
        originalText: text,
        title: this.extractTitle(text),
        summary: this.generateMockSummary(text),
        impact: this.generateMockImpact(text),
        generatedAt: new Date().toISOString(),
      }

      // Save to localStorage
      this.saveSummaryToStorage(mockSummary)
      // Also persist to Firestore when enabled
      if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_USE_FIREBASE === "true") {
        const { initializeApp, getApps } = await import("firebase/app")
        const { getFirestore, collection, doc, setDoc } = await import("firebase/firestore")
        if (!getApps().length) {
          initializeApp({
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          })
        }
        const db = getFirestore()
        const ref = doc(collection(db, "regulations_summaries"), mockSummary.id)
        await setDoc(ref, mockSummary)
      }

      return { success: true, data: mockSummary }
    } catch (error) {
      return { success: false, error: "Erreur lors de la génération de la synthèse" }
    }
  }

  private extractTitle(text: string): string {
    // Extract title from first line or first sentence
    const firstLine = text.split("\n")[0].trim()
    if (firstLine.length > 0 && firstLine.length < 100) {
      return firstLine
    }

    const firstSentence = text.split(".")[0].trim()
    if (firstSentence.length > 0 && firstSentence.length < 100) {
      return firstSentence + "."
    }

    return "Nouvelle réglementation transport routier"
  }

  private generateMockSummary(text: string): string {
    // Mock summary generation based on text content
    const keywords = ["transport", "routier", "chronotachygraphe", "conducteur", "temps", "repos", "conduite"]
    const foundKeywords = keywords.filter((keyword) => text.toLowerCase().includes(keyword))

    return `**Synthèse de la réglementation**

Cette nouvelle réglementation concerne principalement ${foundKeywords.length > 0 ? foundKeywords.join(", ") : "le secteur du transport routier"}.

**Points clés :**
• Modification des règles de temps de conduite et de repos
• Nouvelles obligations pour les entreprises de transport
• Mise à jour des exigences techniques pour les chronotachygraphes
• Renforcement des contrôles et sanctions

**Échéances importantes :**
• **01/06/2024** : Publication du décret d'application
• **01/09/2024** : Entrée en vigueur des nouvelles dispositions
• **01/01/2025** : Application obligatoire pour tous les véhicules

La réglementation s'applique à tous les véhicules de transport de marchandises de plus de 3,5 tonnes et aux véhicules de transport de voyageurs.`
  }

  private generateMockImpact(text: string): string {
    return `**Impact pour les entreprises de transport**

**Obligations nouvelles :**
• Formation obligatoire des conducteurs aux nouvelles règles
• Mise à jour des systèmes de gestion de flotte
• Adaptation des plannings de rotation
• Contrôles internes renforcés

**Coûts estimés :**
• Formation : 200-500€ par conducteur
• Mise à jour logicielle : 1 000-3 000€ par entreprise
• Adaptation organisationnelle : 2-5 jours de travail

**Risques en cas de non-conformité :**
• Amendes de 1 500€ à 15 000€ selon l'infraction
• Immobilisation possible des véhicules
• Suspension temporaire de l'autorisation de transport
• Impact sur la réputation et les assurances

**Recommandations :**
• Planifier la formation des équipes dès maintenant
• Contacter votre fournisseur de chronotachygraphes
• Réviser vos procédures internes
• Prévoir un budget pour la mise en conformité

**Délai de mise en œuvre recommandé :** 3 mois avant l'échéance obligatoire pour éviter les difficultés de dernière minute.`
  }

  private saveSummaryToStorage(summary: RegulationSummary) {
    const existing = this.getSummariesFromStorage()
    const updated = [summary, ...existing].slice(0, 10) // Keep only last 10
    localStorage.setItem("sogestmatic_regulation_summaries", JSON.stringify(updated))
  }

  getSummariesFromStorage(): RegulationSummary[] {
    try {
      const stored = localStorage.getItem("sogestmatic_regulation_summaries")
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  deleteSummary(id: string): void {
    const existing = this.getSummariesFromStorage()
    const filtered = existing.filter((s) => s.id !== id)
    localStorage.setItem("sogestmatic_regulation_summaries", JSON.stringify(filtered))
  }
}
