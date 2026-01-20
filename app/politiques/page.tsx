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

          {/* Conditions et politiques */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-green-accent" />
                <div>
                  <CardTitle className="text-2xl lg:text-3xl font-bold">Conditions et politiques</CardTitle>
                  <CardDescription>Documents juridiques</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Documents juridiques</h3>
                <ul className="list-disc pl-6 text-muted-foreground space-y-1">
                  <li><Link href="/politiques/cgu" className="font-bold text-primary hover:text-primary/80 hover:underline cursor-pointer">Conditions d'utilisation</Link> : conditions régissant l'utilisation du site
                    www.reglementation-transport.fr et des autres services SOGESTMATIC.</li>
                  <li><Link href="/politiques/confidentialite" className="font-bold text-primary hover:text-primary/80 hover:underline cursor-pointer">Politique de confidentialité</Link> : nos pratiques en lien avec les informations personnelles
                    dont nous disposons vous concernant ou que nous obtenons de vous.</li>
                  <li><Link href="/politiques/pua" className="font-bold text-primary hover:text-primary/80 hover:underline cursor-pointer">Politique d'utilisation acceptable</Link> du site www.reglementation-transport.fr</li>
                  <li><Link href="/politiques/avertissement-ia" className="font-bold text-primary hover:text-primary/80 hover:underline cursor-pointer">Avertissement spécifique</Link> liée à l'utilisation du moteur IA du site
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

