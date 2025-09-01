import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Shield, FileText, Users, Lock, AlertTriangle } from "lucide-react"

export default function PolitiquesPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Conditions et Politiques</h1>
              <p className="text-primary-foreground/80 mt-1">Sogestmatic - Expert en réglementation transport</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">

          {/* Avertissement spécifique relatif à l'Intelligence Artificielle */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                <div>
                  <CardTitle>Avertissement spécifique relatif à l'Intelligence Artificielle</CardTitle>
                  <CardDescription>Entrée en vigueur : 1er septembre 2025 | Site concerné : www.reglementation-transport.fr | Éditeur : Sogestmatic</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Article 1 – Nature du service</h3>
                <p className="text-muted-foreground">
                  Le service proposé par Sogestmatic repose sur un moteur d'intelligence artificielle générative, conçu
                  pour fournir des réponses relatives à la réglementation européenne et à la législation française du
                  transport routier.
                  Le service repose sur des algorithmes automatisés et des bases de données préexistantes, pouvant
                  évoluer dans le temps.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Article 2 – Absence de garantie d'exactitude</h3>
                <p className="text-muted-foreground">
                  Les réponses générées par l'IA ne sont ni garanties comme exactes, ni exhaustives, ni
                  systématiquement à jour.
                  Elles peuvent contenir des erreurs factuelles, des omissions, ou être obsolètes par rapport à l'évolution
                  législative ou réglementaire.
                </p>
              </div>

              <div>
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

              <div>
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

              <div>
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

              <div>
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

              <div>
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

              <div>
                <h3 className="font-semibold text-lg mb-2">Article 8 – Acceptation expresse</h3>
                <p className="text-muted-foreground">
                  En utilisant le Service IA, l'utilisateur reconnaît et accepte expressément les limitations énoncées dans
                  le présent document et s'engage à vérifier toute information auprès des sources officielles avant toute
                  décision opérationnelle ou juridique.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Article 9 – Garanties</h3>
                <p className="text-muted-foreground">
                  le Service IA sont fournis en l'état, sans garantie expresse ou implicite. Sogestmatic ne
                  peut être tenue responsable des dommages directs ou indirects liés à l'utilisation du service, y
                  compris pertes de données, pertes financières ou erreurs issues des contenus générés.
                  L'utilisateur reconnaît que les réponses de l'IA peuvent être erronées et qu'il en assume
                  l'entier responsabilité.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Article 10 – Données personnelles</h3>
                <p className="text-muted-foreground">
                  Les données personnelles sont collectées et traitées conformément à la Politique de
                  confidentialité publiée sur le site et au RGPD.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Article 11 – Force majeure</h3>
                <p className="text-muted-foreground">
                  Aucune partie ne pourra être tenue responsable en cas d'inexécution due à un cas de force
                  majeure reconnu par la jurisprudence française.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Article 12 – Durée, suspension et résiliation</h3>
                <p className="text-muted-foreground">
                  Les présentes CGU s'appliquent pendant toute la durée d'utilisation du site. Sogestmatic peut
                  suspendre ou résilier un compte en cas de violation des CGU.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Article 13 – Modifications</h3>
                <p className="text-muted-foreground">
                  Sogestmatic se réserve le droit de modifier les CGU à tout moment. Les modifications prendront
                  effet dès leur publication en ligne.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Article 14 – Loi applicable et juridiction compétente</h3>
                <p className="text-muted-foreground">
                  Les présentes CGU sont soumises au droit français. Tout litige relève de la compétence exclusive
                  du Tribunal d'Avignon.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Politique de Confidentialité */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-green-accent" />
                <div>
                  <CardTitle>Politique de Confidentialité</CardTitle>
                  <CardDescription>Entrée en vigueur : 1er septembre 2025 | Site concerné : www.reglementation-transport.fr | Éditeur : Sogestmatic</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Article 1 – Objet</h3>
                <p className="text-muted-foreground">
                  La présente Politique de Confidentialité a pour but d'informer les utilisateurs du site sur la
                  manière dont leurs données personnelles sont collectées, traitées et protégées conformément
                  au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Article 2 – Responsable du traitement</h3>
                <p className="text-muted-foreground">
                  Le responsable du traitement est la société Sogestmatic, éditrice du site www.reglementation-
                  transport.fr.
                </p>
                <p className="text-muted-foreground mt-2">
                  Contact : rgpd@sogestmatic.com
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Article 3 – Données collectées</h3>
                <p className="text-muted-foreground">
                  Sogestmatic peut collecter les données suivantes :
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>Informations d'identification : civilité, nom, prénom, adresse e-mail, identifiants et mot
                    de passe ;</li>
                  <li>Données de facturation et de paiement liées à la société utilisatrice ;</li>
                  <li>Données de connexion et d'utilisation du service (logs techniques, préférences,
                    interactions avec le moteur IA) ;</li>
                  <li>Contenus générés par l'utilisateur dans le cadre de l'utilisation du service.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Article 4 – Finalités du traitement</h3>
                <p className="text-muted-foreground">
                  Les données collectées sont utilisées pour :
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>la gestion des comptes et des abonnements ;</li>
                  <li>la fourniture et l'amélioration du service ;</li>
                  <li>la facturation et le suivi des paiements ;</li>
                  <li>la sécurité et la prévention des fraudes ;</li>
                  <li>l'élaboration de statistiques d'utilisation ;</li>
                  <li>le respect des obligations légales et réglementaires.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Article 5 – Bases légales</h3>
                <p className="text-muted-foreground">
                  Les traitements réalisés reposent sur :
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>l'exécution du contrat (gestion de l'abonnement et du compte utilisateur) ;</li>
                  <li>le consentement explicite de l'utilisateur pour certaines finalités ;</li>
                  <li>le respect d'obligations légales (facturation, conservation de données) ;</li>
                  <li>l'intérêt légitime de Sogestmatic (amélioration du service, sécurité).</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Article 6 – Conservation des données</h3>
                <p className="text-muted-foreground">
                  Les données personnelles sont conservées :
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>pendant toute la durée de l'abonnement ;</li>
                  <li>puis archivées pour la durée légale nécessaire (obligations fiscales, comptables, etc.) ;</li>
                  <li>supprimées ou anonymisées à l'expiration de ces délais.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Article 7 – Partage des données</h3>
                <p className="text-muted-foreground">
                  Les données peuvent être communiquées :
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>aux prestataires techniques (hébergement, maintenance, paiement) soumis à
                    confidentialité ;</li>
                  <li>aux autorités compétentes sur demande légale ou judiciaire ;</li>
                  <li>à aucun autre tiers sans le consentement explicite de l'utilisateur.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Article 8 – Transferts internationaux</h3>
                <p className="text-muted-foreground">
                  Sogestmatic s'engage à ne pas transférer de données hors Union Européenne sans mettre en
                  place les garanties prévues par le RGPD (clauses contractuelles types, décisions d'adéquation).
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Article 9 – Droits des utilisateurs</h3>
                <p className="text-muted-foreground">
                  Conformément au RGPD, l'utilisateur dispose des droits suivants :
                </p>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li>droit d'accès, de rectification, de mise à jour ;</li>
                  <li>droit à l'effacement (droit à l'oubli) ;</li>
                  <li>droit à la limitation et à l'opposition ;</li>
                  <li>droit à la portabilité des données ;</li>
                  <li>droit d'introduire une réclamation auprès de la CNIL.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Article 10 – Sécurité des données</h3>
                <p className="text-muted-foreground">
                  Sogestmatic met en œuvre toutes les mesures techniques et organisationnelles appropriées
                  pour assurer la sécurité et la confidentialité des données (chiffrement, contrôle d'accès,
                  sauvegardes).
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Article 11 – Notification de violation</h3>
                <p className="text-muted-foreground">
                  En cas de violation de données personnelles, Sogestmatic notifiera la CNIL dans un délai de 72
                  heures et, lorsque cela est nécessaire, informera directement les utilisateurs concernés.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Article 12 – Contact</h3>
                <p className="text-muted-foreground">
                  Toute question relative à la présente Politique de Confidentialité peut être adressée au délégué
                  à la protection des données (DPO) à l'adresse suivante : rgpd@sogestmatic.com.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Politique d'Utilisation Acceptable (PUA) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-green-accent" />
                <div>
                  <CardTitle>Politique d'Utilisation Acceptable (PUA)</CardTitle>
                  <CardDescription>Entrée en vigueur : 1er septembre 2025 | Site concerné : www.reglementation-transport.fr | Éditeur : Sogestmatic</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Article 1 – Objet</h3>
                <p className="text-muted-foreground">
                  La présente Politique d'Utilisation Acceptable (PUA) définit les règles que tout utilisateur doit
                  respecter lors de l'utilisation du site et des services proposés par Sogestmatic, notamment le
                  moteur d'intelligence artificielle spécialisé en réglementation du transport.
                </p>
              </div>

              <div>
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

              <div>
                <h3 className="font-semibold text-lg mb-2">Article 3 – Comportement de l'utilisateur</h3>
                <p className="text-muted-foreground">
                  L'utilisateur s'engage à un usage loyal, raisonnable et proportionné du service.
                  Tout comportement visant à saturer volontairement les systèmes, perturber leur
                  fonctionnement ou nuire à la réputation de Sogestmatic est interdit.
                </p>
              </div>

              <div>
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

              <div>
                <h3 className="font-semibold text-lg mb-2">Article 5 – Sécurité</h3>
                <p className="text-muted-foreground">
                  L'utilisateur s'engage à maintenir ses identifiants confidentiels et à signaler immédiatement
                  toute compromission de son compte.
                  Toute tentative de piratage, d'attaque par déni de service (DDoS), ou d'intrusion sera
                  poursuivie.
                </p>
              </div>

              <div>
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

              <div>
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

              <div>
                <h3 className="font-semibold text-lg mb-2">Article 8 – Modification</h3>
                <p className="text-muted-foreground">
                  La présente PUA pourra être modifiée à tout moment par Sogestmatic.
                  La version applicable est celle publiée en ligne à la date de l'utilisation.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-2">Article 9 – Loi applicable et juridiction compétente</h3>
                <p className="text-muted-foreground">
                  La présente PUA est régie par le droit français.
                  Tout litige relatif à son interprétation ou à son application relève de la compétence exclusive du
                  Tribunal d'Avignon.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Conditions et politiques */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-green-accent" />
                <div>
                  <CardTitle>Conditions et politiques</CardTitle>
                  <CardDescription>Documents juridiques</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Documents juridiques</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li><strong>Conditions d'utilisation</strong> : conditions régissant l'utilisation du site
                    www.reglementation-transport.fr et des autres services SOGESTMATIC.</li>
                  <li><strong>Politique de confidentialité</strong> : nos pratiques en lien avec les informations personnelles
                    dont nous disposons vous concernant ou que nous obtenons de vous.</li>
                  <li><strong>Politique d'utilisation acceptable</strong> du site www.reglementation-transport.fr</li>
                  <li><strong>Avertissement spécifique</strong> liée à l'utilisation du moteur IA du site
                    www.reglementation-transport.fr</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

