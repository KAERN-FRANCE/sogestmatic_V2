import type { Metadata } from "next"
import { IndicatorsPageClient } from "./page-client"

export const metadata: Metadata = {
  title: "Indicateurs & Indemnités Transport Routier | Sogestmatic",
  description:
    "Consultez les prix carburant en temps réel, indicateurs sociaux (SMIC, taux horaires) et grille officielle des indemnités transport routier. Données actualisées pour la réglementation et conformité chronotachygraphe.",
  keywords:
    "transport routier, réglementation, indemnités, coûts transport, chronotachygraphe, prix carburant, SMIC, taux horaires, charges sociales, indemnités repas, découcher, grand déplacement",
  openGraph: {
    title: "Indicateurs & Indemnités Transport Routier | Sogestmatic",
    description:
      "Prix carburant temps réel, indicateurs sociaux et grille officielle des indemnités pour le transport routier",
    type: "website",
  },
}

export default function IndicateursIndemnites() {
  return <IndicatorsPageClient />
}
