import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Lock } from "lucide-react"

export default function ConfidentialitePage() {
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
              <Lock className="w-6 h-6 text-green-accent" />
              <div>
                <CardTitle className="text-2xl lg:text-3xl font-bold">Politique de Confidentialité</CardTitle>
                <CardDescription>Entrée en vigueur : 1er septembre 2025 | Site concerné : www.reglementation-transport.fr | Éditeur : Sogestmatic</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 1 – Objet</h3>
              <p className="text-muted-foreground">
                La présente Politique de Confidentialité a pour but d'informer les utilisateurs du site sur la
                manière dont leurs données personnelles sont collectées, traitées et protégées conformément
                au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 2 – Responsable du traitement</h3>
              <p className="text-muted-foreground">
                Le responsable du traitement est la société Sogestmatic, éditrice du site www.reglementation-
                transport.fr.
              </p>
              <p className="text-muted-foreground mt-2">
                Contact : rgpd@sogestmatic.com
              </p>
            </div>

            <div className="mb-6">
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

            <div className="mb-6">
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

            <div className="mb-6">
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

            <div className="mb-6">
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

            <div className="mb-6">
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

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 8 – Transferts internationaux</h3>
              <p className="text-muted-foreground">
                Sogestmatic s'engage à ne pas transférer de données hors Union Européenne sans mettre en
                place les garanties prévues par le RGPD (clauses contractuelles types, décisions d'adéquation).
              </p>
            </div>

            <div className="mb-6">
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

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 10 – Sécurité des données</h3>
              <p className="text-muted-foreground">
                Sogestmatic met en œuvre toutes les mesures techniques et organisationnelles appropriées
                pour assurer la sécurité et la confidentialité des données (chiffrement, contrôle d'accès,
                sauvegardes).
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 11 – Notification de violation</h3>
              <p className="text-muted-foreground">
                En cas de violation de données personnelles, Sogestmatic notifiera la CNIL dans un délai de 72
                heures et, lorsque cela est nécessaire, informera directement les utilisateurs concernés.
              </p>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-lg mb-2">Article 12 – Contact</h3>
              <p className="text-muted-foreground">
                Toute question relative à la présente Politique de Confidentialité peut être adressée au délégué
                à la protection des données (DPO) à l'adresse suivante : rgpd@sogestmatic.com.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
