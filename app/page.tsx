import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Clock, Shield, FileText, Bot, Gauge, Server, KeyRound, Wrench } from "lucide-react"
import ChatDemo from "@/components/chat-demo"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary/95 to-green-accent text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
                Expert en réglementation transport 
              </h1>
              <p className="text-xl lg:text-2xl text-primary-foreground/90 mb-8 leading-relaxed">
                Solutions complètes pour la conformité réglementaire et la gestion des chronotachygraphes
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-green-accent hover:bg-green-accent-dark text-white" asChild>
                  <Link href="/assistant-ia">
                    Découvrir l'Assistant IA
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                {/* Prochaines Réglementations (supprimé) */}
              </div>
            </div>
            <div className="relative lg:scale-100 lg:translate-x-1 lg:-translate-y-[45px]">
              <ChatDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Services Cards Section */}
      <section className="py-12 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">Nos Solutions</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Une offre dédiée au transport, du terrain au logiciel : carburant, temps routiers, contrôle d’accès et maintenance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
            {/* Gestion de carburant */}
            <Card className="group hover:shadow-lg hover:border-green-accent transition-all duration-300 cursor-pointer border-l-4 border-l-green-accent">
              <CardHeader>
                <div className="w-9 h-9 bg-green-accent-light rounded-lg flex items-center justify-center mb-3">
                  <Gauge className="h-5 w-5 text-green-accent-dark" />
                </div>
                <CardTitle className="text-lg">Gestion de carburant</CardTitle>
                <CardDescription>Matériels, logiciels et services</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-4 space-y-1.5 text-sm text-muted-foreground">
                  <li>Conception, fabrication, commercialisation et maintenance de matériels.</li>
                  <li>Jauges électroniques et AVR (reconnaissance automatique de véhicules).</li>
                  <li>Badges magnétiques et traçabilité des pleins.</li>
                  <li>Logiciels de gestion de jauges et de distribution.</li>
                  <li>Remontée automatique du point kilométrique.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Traitement des temps routiers */}
            <Card className="group hover:shadow-lg hover:border-green-accent transition-all duration-300 cursor-pointer border-l-4 border-l-green-accent">
              <CardHeader>
                <div className="w-9 h-9 bg-green-accent-light rounded-lg flex items-center justify-center mb-3">
                  <Clock className="h-5 w-5 text-green-accent-dark" />
                </div>
                <CardTitle className="text-lg">Temps routiers & tachy</CardTitle>
                <CardDescription>Matériels, archivage légal, pré‑paie</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-4 space-y-1.5 text-sm text-muted-foreground">
                  <li>Matériels de traitement des temps routiers et maintenance.</li>
                  <li>Formations en législation transports.</li>
                  <li>Serveurs d’archivage légal et collecte Internet véhicules/chauffeurs.</li>
                  <li>Traitements à façon (infractions, lecture disques, chaîne complète).</li>
                  <li>Logiciels du légal à la pré‑paie: réglementation et données sociales.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Contrôle d'accès */}
            <Card className="group hover:shadow-lg hover:border-green-accent transition-all duration-300 cursor-pointer border-l-4 border-l-green-accent">
              <CardHeader>
                <div className="w-9 h-9 bg-green-accent-light rounded-lg flex items-center justify-center mb-3">
                  <KeyRound className="h-5 w-5 text-green-accent-dark" />
                </div>
                <CardTitle className="text-lg">Contrôle d’accès</CardTitle>
                <CardDescription>Sécurisation des sites et traçabilité</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc pl-4 space-y-1.5 text-sm text-muted-foreground">
                  <li>Conception/fabrication et maintenance de matériels de contrôle.</li>
                  <li>Logiciel de gestion des autorisations et journalisation entrées/sorties.</li>
                </ul>
              </CardContent>
            </Card>

            {/* Maintenance bancs à rouleaux */}
            <Card className="group hover:shadow-lg hover:border-green-accent transition-all duration-300 cursor-pointer border-l-4 border-l-green-accent">
              <CardHeader>
                <div className="w-9 h-9 bg-green-accent-light rounded-lg flex items-center justify-center mb-3">
                  <Wrench className="h-5 w-5 text-green-accent-dark" />
                </div>
                <CardTitle className="text-lg">Maintenance bancs à rouleaux</CardTitle>
                <CardDescription>Expertise terrain</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  Spécialistes reconnus (anciens KIENZLE) pour l’entretien et le dépannage de vos bancs à rouleaux.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Banner Section */}
      <section className="bg-gradient-to-r from-primary to-green-accent text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-foreground/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bot className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">Découvrez notre Assistant IA</h2>
            <p className="text-xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto">
              Posez vos questions sur la réglementation transport, obtenez des réponses précises et personnalisées grâce
              à notre intelligence artificielle spécialisée.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/assistant-ia">
                Accéder à l'IA
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-green-accent mb-2">15+</div>
              <div className="text-muted-foreground">Années d'expertise</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-accent mb-2">100+</div>
              <div className="text-muted-foreground">Entreprises accompagnées</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-accent mb-2">24/7</div>
              <div className="text-muted-foreground">Support disponible</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
