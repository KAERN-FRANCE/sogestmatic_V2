import Link from "next/link"
import { Mail, Phone, MapPin } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-secondary border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href="mailto:info@sogestmatic.com"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  info@sogestmatic.com
                </a>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href="tel:0490220509" className="text-muted-foreground hover:text-primary transition-colors">
                  04.90.22.05.09
                </a>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                <div className="text-muted-foreground">
                  <div>526 Route de la Gare</div>
                  <div>84470 CHÂTEAUNEUF-DE-GADAGNE</div>
                </div>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Sogestmatic</h3>
            <p className="text-muted-foreground mb-4">Expert en réglementation transport routier</p>
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Solutions chronotachygraphe</div>
              <div className="text-sm text-muted-foreground">Conformité réglementaire</div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Liens utiles</h3>
            <div className="space-y-2">
              <Link href="/" className="block text-muted-foreground hover:text-primary transition-colors text-sm">
                Accueil
              </Link>
              {/* Prochaines Réglementations (supprimé) */}
              <Link
                href="/indicateurs-indemnites"
                className="block text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                Indicateurs & Indemnités
              </Link>
              <Link
                href="/assistant-ia"
                className="block text-muted-foreground hover:text-primary transition-colors text-sm"
              >
                Assistant IA
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Sogestmatic. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  )
}
