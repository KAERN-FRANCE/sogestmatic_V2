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
  // Indemnités repas - Valeurs officielles 2026
  {
    id: "meal-standard",
    category: "Repas",
    type: "Indemnité de repas",
    amount: "16,36 €",
    conditions: "Repas pris hors des locaux de l'entreprise ou sur chantier",
    source: "https://www.urssaf.fr/accueil/employeur/beneficier-dexonerations/frais-professionnels/indemnites-de-petit-deplacement.html",
    lastUpdate: "2026-01-01",
  },
  {
    id: "meal-unique",
    category: "Repas",
    type: "Indemnité de repas unique",
    amount: "10,07 €",
    conditions: "Repas pris sur le lieu de travail habituel",
    source: "https://www.urssaf.fr/accueil/employeur/beneficier-dexonerations/frais-professionnels/indemnites-de-petit-deplacement.html",
    lastUpdate: "2026-01-01",
  },
  {
    id: "meal-night",
    category: "Repas",
    type: "Indemnité de repas unique \"nuit\"",
    amount: "9,81 €",
    conditions: "Repas pris lors d'un travail de nuit",
    source: "https://www.urssaf.fr/accueil/employeur/beneficier-dexonerations/frais-professionnels/indemnites-de-petit-deplacement.html",
    lastUpdate: "2026-01-01",
  },
  {
    id: "meal-special",
    category: "Repas",
    type: "Indemnité spéciale",
    amount: "4,42 €",
    conditions: "Complément pour conditions particulières de travail",
    source: "https://www.urssaf.fr/accueil/employeur/beneficier-dexonerations/frais-professionnels/indemnites-de-petit-deplacement.html",
    lastUpdate: "2026-01-01",
  },
  {
    id: "meal-snack",
    category: "Repas",
    type: "Indemnité de casse-croûte",
    amount: "8,87 €",
    conditions: "Collation prise en dehors des heures de repas",
    source: "https://www.urssaf.fr/accueil/employeur/beneficier-dexonerations/frais-professionnels/indemnites-de-petit-deplacement.html",
    lastUpdate: "2026-01-01",
  },

  // Grand déplacement - Valeurs officielles 2026
  {
    id: "long-distance-1meal",
    category: "Grand déplacement",
    type: "Grand déplacement (1 repas + 1 découcher)",
    amount: "52,31 €",
    conditions: "Déplacement avec 1 repas et 1 nuitée hors domicile",
    source: "https://www.urssaf.fr/accueil/employeur/beneficier-dexonerations/frais-professionnels/indemnites-de-grand-deplacement.html",
    lastUpdate: "2026-01-01",
  },
  {
    id: "long-distance-2meals",
    category: "Grand déplacement",
    type: "Grand déplacement (2 repas + 1 découcher)",
    amount: "68,67 €",
    conditions: "Déplacement avec 2 repas et 1 nuitée hors domicile",
    source: "https://www.urssaf.fr/accueil/employeur/beneficier-dexonerations/frais-professionnels/indemnites-de-grand-deplacement.html",
    lastUpdate: "2026-01-01",
  },

  // Indemnités découcher
  {
    id: "overnight-standard",
    category: "Découcher",
    type: "Indemnité découcher France",
    amount: "35,95 €",
    conditions: "Nuitée hors domicile en France métropolitaine (hors Paris)",
    source: "https://www.urssaf.fr/accueil/employeur/beneficier-dexonerations/frais-professionnels/indemnites-de-grand-deplacement.html",
    lastUpdate: "2026-01-01",
  },
  {
    id: "overnight-paris",
    category: "Découcher",
    type: "Indemnité découcher Paris/IdF",
    amount: "73,04 €",
    conditions: "Nuitée en Île-de-France (75, 92, 93, 94)",
    source: "https://www.urssaf.fr/accueil/employeur/beneficier-dexonerations/frais-professionnels/indemnites-de-grand-deplacement.html",
    lastUpdate: "2026-01-01",
  },

  // Indemnités kilométriques - Barème fiscal 2025 (applicable 2026)
  {
    id: "mileage-car-3cv",
    category: "Kilométrique",
    type: "Indemnité kilométrique 3 CV et moins",
    amount: "0,529 €/km",
    conditions: "Véhicule de 3 CV fiscaux ou moins, jusqu'à 5000 km",
    source: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051104771",
    lastUpdate: "2026-01-01",
  },
  {
    id: "mileage-car-4cv",
    category: "Kilométrique",
    type: "Indemnité kilométrique 4 CV",
    amount: "0,606 €/km",
    conditions: "Véhicule de 4 CV fiscaux, jusqu'à 5000 km",
    source: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051104771",
    lastUpdate: "2026-01-01",
  },
  {
    id: "mileage-car-5cv",
    category: "Kilométrique",
    type: "Indemnité kilométrique 5 CV",
    amount: "0,636 €/km",
    conditions: "Véhicule de 5 CV fiscaux, jusqu'à 5000 km",
    source: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051104771",
    lastUpdate: "2026-01-01",
  },
  {
    id: "mileage-car-6cv",
    category: "Kilométrique",
    type: "Indemnité kilométrique 6 CV",
    amount: "0,665 €/km",
    conditions: "Véhicule de 6 CV fiscaux, jusqu'à 5000 km",
    source: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051104771",
    lastUpdate: "2026-01-01",
  },
  {
    id: "mileage-car-7cv",
    category: "Kilométrique",
    type: "Indemnité kilométrique 7 CV et plus",
    amount: "0,697 €/km",
    conditions: "Véhicule de 7 CV fiscaux ou plus, jusqu'à 5000 km",
    source: "https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000051104771",
    lastUpdate: "2026-01-01",
  },

  // Indemnités spéciales transport
  {
    id: "dangerous-goods",
    category: "Transport spécialisé",
    type: "Prime matières dangereuses ADR",
    amount: "25,00 €/jour",
    conditions: "Transport ADR, certificat de formation requis",
    source: "Convention collective transport routier",
    lastUpdate: "2026-01-01",
  },
  {
    id: "exceptional-transport",
    category: "Transport spécialisé",
    type: "Prime transport exceptionnel",
    amount: "35,00 €/jour",
    conditions: "Convoi exceptionnel, autorisation préfectorale requise",
    source: "Convention collective transport routier",
    lastUpdate: "2026-01-01",
  },
  {
    id: "cold-chain",
    category: "Transport spécialisé",
    type: "Prime transport frigorifique",
    amount: "18,00 €/jour",
    conditions: "Transport sous température dirigée",
    source: "Convention collective transport routier",
    lastUpdate: "2026-01-01",
  },
]
