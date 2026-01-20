import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, FileText } from "lucide-react"

export default function CGUPage() {
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
              <FileText className="w-6 h-6 text-green-accent" />
              <div>
                <CardTitle className="text-2xl lg:text-3xl font-bold">Conditions Générales d'Utilisation (CGU)</CardTitle>
                <CardDescription>Entrée en vigueur : 1er septembre 2025 | Site concerné : www.reglementation-transport.fr | Éditeur : Sogestmatic</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 1 – Objet</h3>
              <p className="text-muted-foreground">
                Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation du site
                internet www.reglementation-transport.fr édité par Sogestmatic et des services liés. Le site
                propose une partie en libre accès et une partie payante donnant accès à un moteur
                d'intelligence artificielle spécialisé dans la réglementation européenne et la législation française
                du transport routier.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 2 – Définitions</h3>
              <p className="text-muted-foreground">
                <strong>Utilisateur :</strong> toute personne accédant au site.<br/>
                <strong>Abonné :</strong> tout utilisateur disposant d'un compte payant.<br/>
                <strong>Contenus générés :</strong> informations produites par le moteur d'IA.<br/>
                <strong>Compte :</strong> espace personnel associé à un utilisateur.<br/>
                <strong>Site :</strong> www.reglementation-transport.fr
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 3 – Acceptation et opposabilité</h3>
              <p className="text-muted-foreground">
                Les CGU s'appliquent dès le premier accès. L'utilisation du site implique l'acceptation pleine et
                entière des CGU. Les CGU peuvent être modifiées par Sogestmatic. La version applicable est
                celle en ligne à la date d'utilisation.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 4 – Accès au site</h3>
              <p className="text-muted-foreground">
                Le site est en principe accessible 24h/24, 7j/7. Toutefois, Sogestmatic ne garantit pas une
                disponibilité ininterrompue et peut procéder à des interruptions de maintenance ou rencontrer
                des cas de force majeure.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 5 – Création de compte et abonnement</h3>
              <p className="text-muted-foreground">
                La création d'un compte est obligatoire pour accéder à la partie réservée. L'utilisateur doit
                fournir des informations exactes et à jour. Les identifiants sont strictement personnels. L'accès
                au moteur IA est conditionné à un abonnement payant. L'utilisateur peut résilier son
                abonnement à tout moment selon les modalités prévues. Sogestmatic peut résilier un compte
                en cas de non-respect des CGU.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 6 – Utilisation du Service IA</h3>
              <p className="text-muted-foreground">
                Le Service IA est un moteur génératif automatisé. Les contenus générés peuvent être inexacts,
                incomplets, obsolètes ou inadaptés. Ils sont fournis à titre informatif uniquement. Ils ne
                constituent ni une consultation juridique, ni une certification de conformité. L'utilisateur doit
                vérifier les informations auprès des sources officielles (Legifrance, EUR-Lex, JOUE, etc.).
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 7 – Obligations de l'utilisateur</h3>
              <p className="text-muted-foreground">
                L'utilisateur s'engage à ne pas utiliser le site à des fins frauduleuses, illégales, ou contraires à la
                réglementation. Il s'interdit tout scraping, reverse engineering, saturation du service,
                reproduction ou revente des contenus générés sans accord de Sogestmatic.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 8 – Propriété intellectuelle</h3>
              <p className="text-muted-foreground">
                Tous les éléments du site et le moteur IA sont protégés par le Code de la propriété intellectuelle.
                L'utilisateur bénéficie d'un droit d'usage personnel et non exclusif. Toute reproduction non
                autorisée est interdite.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 9 – Responsabilités et garanties</h3>
              <p className="text-muted-foreground">
                Le site et le Service IA sont fournis en l'état, sans garantie expresse ou implicite. Sogestmatic ne
                peut être tenue responsable des dommages directs ou indirects liés à l'utilisation du service, y
                compris pertes de données, pertes financières ou erreurs issues des contenus générés.
                L'utilisateur reconnaît que les réponses de l'IA peuvent être erronées et qu'il en assume
                l'entier responsabilité.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 10 – Données personnelles</h3>
              <p className="text-muted-foreground">
                Les données personnelles sont collectées et traitées conformément à la Politique de
                confidentialité publiée sur le site et au RGPD.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 11 – Force majeure</h3>
              <p className="text-muted-foreground">
                Aucune partie ne pourra être tenue responsable en cas d'inexécution due à un cas de force
                majeure reconnu par la jurisprudence française.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 12 – Durée, suspension et résiliation</h3>
              <p className="text-muted-foreground">
                Les présentes CGU s'appliquent pendant toute la durée d'utilisation du site. Sogestmatic peut
                suspendre ou résilier un compte en cas de violation des CGU.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 13 – Modifications</h3>
              <p className="text-muted-foreground">
                Sogestmatic se réserve le droit de modifier les CGU à tout moment. Les modifications prendront
                effet dès leur publication en ligne.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 14 – Loi applicable et juridiction compétente</h3>
              <p className="text-muted-foreground">
                Les présentes CGU sont soumises au droit français. Tout litige relève de la compétence exclusive
                du Tribunal d'Avignon.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
