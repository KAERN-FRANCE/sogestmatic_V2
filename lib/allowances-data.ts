export interface Allowance {
  id: string
  category: string
  type: string
  amount: string
  conditions: string
  source: string
  lastUpdate: string
  region?: string
}

export const allowancesData: Allowance[] = [
  // Indemnités repas
  {
    id: "meal-standard",
    category: "Repas",
    type: "Indemnité repas standard",
    amount: "19.40 €",
    conditions: "Repas pris hors domicile, justificatifs requis",
    source: "Arrêté du 20/12/2023",
    lastUpdate: "2024-01-01",
  },
  {
    id: "meal-reduced",
    category: "Repas",
    type: "Indemnité repas réduite",
    amount: "9.70 €",
    conditions: "Repas fourni par l'employeur ou subventionné",
    source: "Arrêté du 20/12/2023",
    lastUpdate: "2024-01-01",
  },

  // Indemnités découcher
  {
    id: "overnight-standard",
    category: "Découcher",
    type: "Indemnité découcher France",
    amount: "65.00 €",
    conditions: "Nuitée hors domicile en France métropolitaine",
    source: "Convention collective transport",
    lastUpdate: "2024-01-01",
  },
  {
    id: "overnight-europe",
    category: "Découcher",
    type: "Indemnité découcher Europe",
    amount: "75.00 €",
    conditions: "Nuitée dans un pays de l'Union Européenne",
    source: "Convention collective transport",
    lastUpdate: "2024-01-01",
  },
  {
    id: "overnight-international",
    category: "Découcher",
    type: "Indemnité découcher international",
    amount: "85.00 €",
    conditions: "Nuitée hors Union Européenne",
    source: "Convention collective transport",
    lastUpdate: "2024-01-01",
  },

  // Grand déplacement
  {
    id: "long-distance-daily",
    category: "Grand déplacement",
    type: "Indemnité journalière grand déplacement",
    amount: "45.00 €",
    conditions: "Déplacement > 50 km du domicile, durée > 12h",
    source: "Code du travail Art. L3261-3",
    lastUpdate: "2024-01-01",
  },
  {
    id: "long-distance-weekly",
    category: "Grand déplacement",
    type: "Forfait hebdomadaire grand déplacement",
    amount: "280.00 €",
    conditions: "Déplacement d'une semaine complète",
    source: "Convention collective transport",
    lastUpdate: "2024-01-01",
  },

  // Indemnités kilométriques
  {
    id: "mileage-car",
    category: "Kilométrique",
    type: "Indemnité kilométrique véhicule personnel",
    amount: "0.518 €/km",
    conditions: "Véhicule de 4 CV, barème fiscal 2024",
    source: "Barème fiscal 2024",
    lastUpdate: "2024-01-01",
  },
  {
    id: "mileage-motorcycle",
    category: "Kilométrique",
    type: "Indemnité kilométrique moto",
    amount: "0.395 €/km",
    conditions: "Motocyclette > 125 cm³",
    source: "Barème fiscal 2024",
    lastUpdate: "2024-01-01",
  },

  // Indemnités spéciales transport
  {
    id: "loading-unloading",
    category: "Transport spécialisé",
    type: "Prime chargement/déchargement",
    amount: "15.00 €",
    conditions: "Par opération de chargement manuel",
    source: "Convention collective transport",
    lastUpdate: "2024-01-01",
  },
  {
    id: "dangerous-goods",
    category: "Transport spécialisé",
    type: "Prime matières dangereuses",
    amount: "25.00 €/jour",
    conditions: "Transport ADR, certificat requis",
    source: "Convention collective transport",
    lastUpdate: "2024-01-01",
  },
  {
    id: "exceptional-transport",
    category: "Transport spécialisé",
    type: "Prime transport exceptionnel",
    amount: "35.00 €/jour",
    conditions: "Convoi exceptionnel, autorisation préfectorale",
    source: "Convention collective transport",
    lastUpdate: "2024-01-01",
  },

  // Indemnités régionales
  {
    id: "paris-supplement",
    category: "Régional",
    type: "Supplément Île-de-France",
    amount: "+20%",
    conditions: "Majoration pour déplacements en Île-de-France",
    source: "Accord régional IdF",
    lastUpdate: "2024-01-01",
    region: "Île-de-France",
  },
  {
    id: "mountain-supplement",
    category: "Régional",
    type: "Prime zone de montagne",
    amount: "+15%",
    conditions: "Déplacements en zone de montagne (hiver)",
    source: "Convention collective transport",
    lastUpdate: "2024-01-01",
    region: "Zones de montagne",
  },
]
