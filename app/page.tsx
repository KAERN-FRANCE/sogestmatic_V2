"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Clock, Shield, FileText, Bot, Gauge, Server, KeyRound, Wrench, Send, AlertTriangle } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen relative">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary/95 to-green-accent text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6">
                Le moteur IA dédié à la réglementation transport
              </h1>
              <p className="text-xl lg:text-2xl text-primary-foreground/90 mb-8 leading-relaxed">
                Sogestmatic met à votre disposition plus de 40 ans d'expérience ainsi que toutes les bases de données transport à jour.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/chatbot">
                  <Button size="lg" className="bg-green-accent hover:bg-green-accent-dark text-white font-semibold">
                    Découvrir l'Assistant IA
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Mini Chat IA flottant - Décoratif */}
            <div className="relative">
              <Link href="/chatbot" className="block cursor-pointer hover:scale-105 transition-transform duration-300">
                <Card className="w-full max-w-lg mx-auto bg-white/95 backdrop-blur-sm border-2 border-gray-200 shadow-2xl hover:shadow-3xl hover:border-green-accent transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg text-gray-800">Assistant IA Sogestmatic</CardTitle>
                      <CardDescription className="text-sm text-green-600 font-medium">
                        En ligne
                      </CardDescription>
                    </div>
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Warning Banner */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-yellow-800">
                      Attention: cet assistant IA peut commettre des erreurs. Vérifiez les informations importantes.
                    </p>
                  </div>

                  {/* Conversation Example - Réaliste */}
                  <div className="space-y-3">
                    {/* User Message */}
                    <div className="bg-gray-100 rounded-lg p-3">
                      <p className="text-sm text-gray-800">
                        Quelle est la durée maximale de conduite journalière ?
                      </p>
                    </div>

                    {/* AI Response - Réaliste */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-800 mb-2">
                        📋 <strong>Durée maximale de conduite journalière :</strong>
                      </p>
                      <p className="text-sm text-gray-700 mb-2">
                        La durée maximale de conduite journalière est de <strong>9 heures</strong> par jour.
                      </p>
                      <p className="text-sm text-gray-700 mb-2">
                        Cette durée peut être portée à <strong>10 heures</strong> maximum 2 fois par semaine.
                      </p>
                      <p className="text-sm text-gray-700">
                        ⚠️ <strong>Important :</strong> Un temps de repos de 11 heures consécutives est obligatoire entre deux périodes de conduite.
                      </p>
                    </div>
                  </div>

                  {/* Chat Input - Décoratif */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Posez votre question sur la réglementation..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 cursor-not-allowed"
                      disabled
                    />
                    <Button 
                      size="sm" 
                      className="bg-gray-300 text-gray-500 px-3 cursor-not-allowed"
                      disabled
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
                </Card>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Bénéfices Section */}
      <section className="py-16 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-3">Bénéfices</h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Découvrez les avantages de notre moteur IA dédié à la réglementation transport
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Veille réglementaire */}
            <div className="text-center group">
              <div className="w-16 h-16 bg-green-accent-light rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-accent transition-colors duration-300">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Veille réglementaire</h3>
              <p className="text-sm text-muted-foreground">
                Surveillance continue des évolutions réglementaires pour rester toujours conforme
              </p>
            </div>

            {/* Réponses fiables */}
            <div className="text-center group">
              <div className="w-16 h-16 bg-green-accent-light rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-accent transition-colors duration-300">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Réponses fiables, sourcées et actualisées</h3>
              <p className="text-sm text-muted-foreground">
                Informations vérifiées et mises à jour en temps réel depuis nos bases de données
              </p>
            </div>

            {/* Gain de temps */}
            <div className="text-center group">
              <div className="w-16 h-16 bg-green-accent-light rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-accent transition-colors duration-300">
                <span className="text-2xl">⏱</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Gain de temps pour vos équipes RH & exploitation</h3>
              <p className="text-sm text-muted-foreground">
                Automatisation des recherches et réponses instantanées pour optimiser votre productivité
              </p>
            </div>

            {/* Expertise transport */}
            <div className="text-center group">
              <div className="w-16 h-16 bg-green-accent-light rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-accent transition-colors duration-300">
                <span className="text-2xl">🚛</span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Expertise transport éprouvée depuis plus de 40 ans</h3>
              <p className="text-sm text-muted-foreground">
                Plus de quatre décennies d'expérience dans le secteur du transport routier
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Présentation Société Section */}
      <section className="py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">À propos de Sogestmatic</h2>
            <div className="bg-gradient-to-r from-green-accent-light/20 to-primary/10 rounded-2xl p-8 border border-green-accent-light/30">
              <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
                Depuis plus de 40 ans, Sogestmatic accompagne les transporteurs dans la maîtrise de leurs 
                données chronotachygraphes et leur conformité réglementaire. Notre moteur IA est la continuité 
                naturelle de cet engagement : mettre la puissance de l'IA au service de la conformité transport et 
                du service client.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Trust Indicators */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-green-accent mb-2">43+</div>
              <div className="text-muted-foreground">années expertise</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-accent mb-2">1500+</div>
              <div className="text-muted-foreground">entreprises accompagnées</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
