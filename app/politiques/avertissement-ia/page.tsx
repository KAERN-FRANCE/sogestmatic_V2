import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, AlertTriangle } from "lucide-react"

export default function AvertissementIAPage() {
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
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
              <div>
                <CardTitle className="text-2xl lg:text-3xl font-bold">Avertissement spécifique relatif à l'Intelligence Artificielle</CardTitle>
                <CardDescription>Entrée en vigueur : 1er septembre 2025 | Site concerné : www.reglementation-transport.fr | Éditeur : Sogestmatic</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 1 – Nature du service</h3>
              <p className="text-muted-foreground">
                Le service proposé par Sogestmatic repose sur un moteur d'intelligence artificielle générative, conçu
                pour fournir des réponses relatives à la réglementation européenne et à la législation française du
                transport routier.
                Le service repose sur des algorithmes automatisés et des bases de données préexistantes, pouvant
                évoluer dans le temps.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 2 – Absence de garantie d'exactitude</h3>
              <p className="text-muted-foreground">
                Les réponses générées par l'IA ne sont ni garanties comme exactes, ni exhaustives, ni
                systématiquement à jour.
                Elles peuvent contenir des erreurs factuelles, des omissions, ou être obsolètes par rapport à l'évolution
                législative ou réglementaire.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 3 – Caractère informatif des réponses</h3>
              <p className="text-muted-foreground">
                Les contenus générés sont fournis à titre purement informatif et ne constituent en aucun cas :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>une consultation juridique personnalisée ;</li>
                <li>une expertise certifiée ;</li>
                <li>une preuve officielle ou un document réglementaire opposable.</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 4 – Obligation de vérification par l'utilisateur</h3>
              <p className="text-muted-foreground">
                L'utilisateur doit systématiquement vérifier les informations auprès des sources officielles, telles
                que :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>Legifrance ;</li>
                <li>Journal Officiel de l'Union Européenne ;</li>
                <li>Arrêtés ministériels et circulaires applicables ;</li>
                <li>Conventions collectives en vigueur ;</li>
                <li>Etc...</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 5 – Responsabilité de l'utilisateur</h3>
              <p className="text-muted-foreground">
                L'utilisateur demeure seul responsable :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>de l'interprétation qu'il fait des contenus générés ;</li>
                <li>des décisions prises ou omises sur la base de ces contenus ;</li>
                <li>des conséquences directes ou indirectes de leur utilisation dans un cadre professionnel,
                  contractuel, administratif ou judiciaire.</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 6 – Exclusions spécifiques</h3>
              <p className="text-muted-foreground">
                Les contenus générés par le Service IA ne doivent pas être utilisés comme base unique pour :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>des contentieux juridiques ou fiscaux ;</li>
                <li>des contrôles routiers ou sociaux ;</li>
                <li>des procédures disciplinaires ou prud'homales ;</li>
                <li>des décisions engageant la responsabilité légale ou financière de l'utilisateur ou de tiers.</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 7 – Limitation de responsabilité</h3>
              <p className="text-muted-foreground">
                Sogestmatic décline toute responsabilité concernant :
              </p>
              <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                <li>l'exactitude, la fiabilité ou l'actualité des réponses générées ;</li>
                <li>tout dommage direct ou indirect, perte de données, perte financière ou commerciale lié à
                  l'usage du Service IA ;</li>
                <li>tout usage abusif, détourné ou non conforme aux présentes conditions par un utilisateur.</li>
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 8 – Acceptation expresse</h3>
              <p className="text-muted-foreground">
                En utilisant le Service IA, l'utilisateur reconnaît et accepte expressément les limitations énoncées dans
                le présent document et s'engage à vérifier toute information auprès des sources officielles avant toute
                décision opérationnelle ou juridique.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 9 – Garanties</h3>
              <p className="text-muted-foreground">
                le Service IA sont fournis en l'état, sans garantie expresse ou implicite. Sogestmatic ne
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
