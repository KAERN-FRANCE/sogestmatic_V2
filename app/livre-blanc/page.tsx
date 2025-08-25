import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, FileText, Clock, Users, Shield, Truck, Database, Archive, BarChart3, Settings } from "lucide-react"

export const metadata: Metadata = {
  title: "Livre Blanc - Gestion du Chronotachygraphe | Sogestmatic",
  description:
    "Découvrez notre livre blanc sur la gestion du chronotachygraphe. 40 ans d'expertise en collecte et traitement des données chronotachygraphe et carte conducteur.",
  keywords:
    "livre blanc chronotachygraphe, gestion chronotachygraphe, réglementation sociale européenne, collecte données tachygraphe, carte conducteur, annexe 1C",
}

export default function LivreBlancPage() {
  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary mb-4">Livre Blanc Gestion du Chronotachygraphe</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            40 ans d'expérience dans la collecte et le traitement des données du chronotachygraphe. 
            Expertise Sogestmatic pour optimiser la gestion de votre flotte et des données sociales.
          </p>
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-bold mb-4">Préface</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Nous souhaitons à travers ce livre blanc partager avec vous 40 ans d'expérience dans la collecte et le traitement des données du chronotachygraphe.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Notre expertise est mise à votre service pour (re)découvrir les bonnes pratiques, utiliser des outils fiables et pérennes, voire profiter des investissements règlementaires pour optimiser la gestion de votre flotte de véhicules et des données sociales de vos personnels.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Après vous avoir rappelé les bases de la dernière règlementation en vigueur, nous vous présentons les outils de collecte, les solutions d'archivage et de traitement des données issues du chronotachygraphe et de la carte conducteur. Tout ceci bien sûr dans le respect strict de la Règlementation Sociale Européenne.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Content Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Réglementation Sociale Européenne</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                L'annexe 1C, règlement EU 165/2014, chronotachygraphe intelligent et nouvelles cartes conducteurs.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Database className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Collecte des Données</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Outils manuels et automatiques, cartes entreprise, délais obligatoires et solutions libre-service.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Archive className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Archivage des Données</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Solutions locales et SAAS, sécurité des données, sauvegardes et préparation des contrôles.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Analyse des Données</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Traitement des heures, infractions, données sociales et préparation de la paie.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Outils Spécialisés</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Architac RSE, Tachogest, TACHOPREMIUM, TACHOSOCIAL et plateforme Tg2S.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Expertise Sogestmatic</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                40 ans d'expérience, solutions pérennes et accompagnement personnalisé pour votre structure.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Key Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl">Fonctionnalités Majeures du Chronotachygraphe Intelligent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium">Cryptage renforcé</h4>
                  <p className="text-sm text-muted-foreground">Sécurisation des données avec cryptage avancé</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium">Positionnement satellitaire</h4>
                  <p className="text-sm text-muted-foreground">Relevé de la position du véhicule en temps réel</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium">Communication à distance</h4>
                  <p className="text-sm text-muted-foreground">Contrôle par les autorités sans arrêt du véhicule</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-medium">Fonction RGPD</h4>
                  <p className="text-sm text-muted-foreground">Gestion des données personnelles par le conducteur</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Access Section */}
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl mb-2">Accédez au Livre Blanc Complet</CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Découvrez l'intégralité de notre expertise en gestion du chronotachygraphe
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <div className="flex justify-center space-x-8 text-sm">
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Guide complet
                </div>
                <div className="flex items-center">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Accès direct
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  40 ans d'expérience
                </div>
              </div>
              <Button 
                size="lg" 
                variant="secondary" 
                className="bg-white text-primary hover:bg-white/90"
                asChild
              >
                <a href="https://chrono.sogestmatic.com/livre-blanc-gestion-chronotachygraphe" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-5 w-5" />
                  Consulter le Livre Blanc
                </a>
              </Button>
              <p className="text-sm text-primary-foreground/70">Accès gratuit • Expertise Sogestmatic • Solutions pratiques</p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center mb-8">Ressources Complémentaires</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Indicateurs & Indemnités</CardTitle>
                <CardDescription>
                  Consultez nos indicateurs en temps réel et grilles d'indemnités officielles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full bg-transparent">
                  Voir les Indicateurs
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assistant IA Spécialisé</CardTitle>
                <CardDescription>
                  Posez vos questions spécifiques à notre assistant IA expert en réglementation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full bg-transparent">
                  Accéder à l'Assistant
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
