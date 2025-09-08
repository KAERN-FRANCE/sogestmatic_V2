import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Shield } from "lucide-react"

export default function PUAPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/politiques">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour aux politiques
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-green-accent" />
              <div>
                <CardTitle className="text-2xl lg:text-3xl font-bold">Politique d'Utilisation Acceptable (PUA)</CardTitle>
                <CardDescription>Entrée en vigueur : 1er septembre 2025 | Site concerné : www.reglementation-transport.fr | Éditeur : Sogestmatic</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 1 – Objet</h3>
              <p className="text-muted-foreground">
                La présente Politique d'Utilisation Acceptable (PUA) définit les règles que tout utilisateur doit
                respecter lors de l'utilisation du site et des services proposés par Sogestmatic, notamment le
                moteur d'intelligence artificielle spécialisé en réglementation du transport.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 2 – Utilisations interdites</h3>
              <p className="text-muted-foreground">
                Il est strictement interdit d'utiliser le site et ses services :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>pour toute activité illégale, frauduleuse ou contraire à la réglementation ;</li>
                <li>pour générer ou diffuser du contenu portant atteinte à l'ordre public, aux bonnes
                  mœurs, ou aux droits de tiers ;</li>
                <li>pour extraire massivement les données ou mettre en œuvre du scraping ou du data
                  mining ;</li>
                <li>pour tenter d'accéder aux systèmes ou données d'autres utilisateurs ;</li>
                <li>pour contourner les limitations techniques, procéder à de l'ingénierie inversée ou
                  attaquer la sécurité du site ;</li>
                <li>pour entraîner un modèle concurrent d'intelligence artificielle à partir des contenus
                  générés par le Service IA.</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 3 – Comportement de l'utilisateur</h3>
              <p className="text-muted-foreground">
                L'utilisateur s'engage à un usage loyal, raisonnable et proportionné du service.
                Tout comportement visant à saturer volontairement les systèmes, perturber leur
                fonctionnement ou nuire à la réputation de Sogestmatic est interdit.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 4 – Contenus générés</h3>
              <p className="text-muted-foreground">
                Les contenus générés par l'IA ne doivent pas être utilisés :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>pour diffuser des informations fausses ou trompeuses volontairement ;</li>
                <li>pour constituer des preuves juridiques officielles ;</li>
                <li>pour être redistribués à titre onéreux sans autorisation écrite de Sogestmatic.</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 5 – Sécurité</h3>
              <p className="text-muted-foreground">
                L'utilisateur s'engage à maintenir ses identifiants confidentiels et à signaler immédiatement
                toute compromission de son compte.
                Toute tentative de piratage, d'attaque par déni de service (DDoS), ou d'intrusion sera
                poursuivie.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 6 – Respect des droits</h3>
              <p className="text-muted-foreground">
                L'utilisateur s'engage à respecter :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>les droits de propriété intellectuelle de Sogestmatic ;</li>
                <li>la confidentialité des données d'autrui ;</li>
                <li>les réglementations françaises et européennes applicables au transport routier et à
                  l'usage des systèmes numériques.</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 7 – Sanctions</h3>
              <p className="text-muted-foreground">
                En cas de violation de la présente PUA, Sogestmatic se réserve le droit de :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>suspendre ou supprimer l'accès de l'utilisateur ;</li>
                <li>résilier immédiatement l'abonnement sans remboursement ;</li>
                <li>engager toute action légale nécessaire devant les juridictions compétentes.</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 8 – Modification</h3>
              <p className="text-muted-foreground">
                La présente PUA pourra être modifiée à tout moment par Sogestmatic.
                La version applicable est celle publiée en ligne à la date de l'utilisation.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 9 – Loi applicable et juridiction compétente</h3>
              <p className="text-muted-foreground">
                La présente PUA est régie par le droit français.
                Tout litige relatif à son interprétation ou à son application relève de la compétence exclusive du
                Tribunal d'Avignon.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
