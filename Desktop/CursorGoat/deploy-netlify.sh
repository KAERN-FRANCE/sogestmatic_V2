#!/bin/bash

# 🚀 SCRIPT DÉPLOIEMENT NETLIFY RAPIDE - SOGESTMATIC v2.1
# Usage: ./deploy-netlify.sh

set -e  # Arrêt si erreur

echo "🚛 DÉPLOIEMENT SOGESTMATIC v2.1 PRODUCTION"
echo "=========================================="

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}🔄 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifications préalables
print_step "Vérifications préalables..."

# 1. Vérifier que nous sommes dans le bon répertoire
if [ ! -d "dist" ]; then
    print_error "Dossier dist/ non trouvé. Êtes-vous dans le bon répertoire ?"
    exit 1
fi

# 2. Vérifier les fichiers essentiels
print_step "Vérification des fichiers essentiels..."

REQUIRED_FILES=(
    "dist/index.html"
    "dist/style.css" 
    "dist/script.js"
    "dist/manifest.json"
    "dist/sw.js"
    "dist/README.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Fichier manquant: $file"
        exit 1
    fi
done

print_success "Tous les fichiers requis sont présents"

# 3. Vérifier les tailles de fichiers
print_step "Vérification des tailles de fichiers..."

check_file_size() {
    local file=$1
    local max_size=$2
    local size=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    local size_kb=$((size / 1024))
    
    if [ $size_kb -gt $max_size ]; then
        print_warning "Fichier $file est volumineux: ${size_kb}KB (max recommandé: ${max_size}KB)"
    else
        echo "  📄 $file: ${size_kb}KB ✓"
    fi
}

check_file_size "dist/index.html" 50
check_file_size "dist/style.css" 100
check_file_size "dist/script.js" 200
check_file_size "dist/manifest.json" 10
check_file_size "dist/sw.js" 50

# 4. Calculer la taille totale
print_step "Calcul de la taille totale..."

if command -v du >/dev/null; then
    TOTAL_SIZE=$(du -sh dist/ | cut -f1)
    echo "  📊 Taille totale du projet: $TOTAL_SIZE"
else
    print_warning "Impossible de calculer la taille totale (du non disponible)"
fi

# 5. Validation du HTML/CSS/JS
print_step "Validation syntaxique..."

# Vérifier si les fichiers contiennent du contenu valide
if ! grep -q "<!DOCTYPE html>" dist/index.html; then
    print_error "index.html ne semble pas être un fichier HTML valide"
    exit 1
fi

if ! grep -q "body\|html\|\.css" dist/style.css; then
    print_error "style.css ne semble pas être un fichier CSS valide"  
    exit 1
fi

if ! grep -q "function\|const\|var\|=>" dist/script.js; then
    print_error "script.js ne semble pas être un fichier JavaScript valide"
    exit 1
fi

print_success "Validation syntaxique réussie"

# Choix de la méthode de déploiement
echo ""
echo "🚀 CHOISISSEZ VOTRE MÉTHODE DE DÉPLOIEMENT :"
echo ""
echo "1. 📦 Drag & Drop Netlify (Recommandé)"
echo "2. 🔧 Netlify CLI" 
echo "3. 📋 Instructions Git Deploy"
echo "4. ❌ Annuler"
echo ""

read -p "Votre choix (1-4): " choice

case $choice in
    1)
        print_step "Préparation pour Drag & Drop Netlify..."
        
        # Créer le zip
        ZIP_NAME="sogestmatic-production-$(date +%Y%m%d-%H%M%S).zip"
        
        print_step "Création de l'archive: $ZIP_NAME"
        
        cd dist/
        if command -v zip >/dev/null; then
            zip -r "../$ZIP_NAME" . -x "*.DS_Store" "*.git*"
            cd ..
            print_success "Archive créée: $ZIP_NAME"
        else
            print_error "Commande 'zip' non trouvée. Installez-la ou utilisez une autre méthode."
            exit 1
        fi
        
        echo ""
        echo "📦 ÉTAPES SUIVANTES :"
        echo "1. Aller sur: https://netlify.com/drop"
        echo "2. Glisser le fichier: $ZIP_NAME"
        echo "3. Attendre le déploiement (2-3 minutes)"
        echo "4. Votre site sera en ligne ! 🎉"
        echo ""
        
        if command -v open >/dev/null; then
            read -p "Ouvrir netlify.com/drop maintenant ? (y/n): " open_netlify
            if [[ $open_netlify =~ ^[Yy]$ ]]; then
                open "https://netlify.com/drop"
            fi
        fi
        ;;
        
    2)
        print_step "Déploiement via Netlify CLI..."
        
        # Vérifier si Netlify CLI est installé
        if ! command -v netlify >/dev/null; then
            print_warning "Netlify CLI n'est pas installé"
            read -p "Installer maintenant ? (y/n): " install_cli
            
            if [[ $install_cli =~ ^[Yy]$ ]]; then
                if command -v npm >/dev/null; then
                    print_step "Installation de Netlify CLI..."
                    npm install -g netlify-cli
                else
                    print_error "Node.js/npm requis pour installer Netlify CLI"
                    exit 1
                fi
            else
                print_error "Netlify CLI requis pour cette méthode"
                exit 1
            fi
        fi
        
        # Login si nécessaire
        print_step "Vérification de l'authentification..."
        if ! netlify status >/dev/null 2>&1; then
            print_step "Connexion à Netlify..."
            netlify login
        fi
        
        # Déploiement
        print_step "Déploiement en cours..."
        netlify deploy --prod --dir=dist/
        
        print_success "Déploiement terminé !"
        ;;
        
    3)
        print_step "Instructions Git Deploy..."
        
        echo ""
        echo "📋 ÉTAPES GIT DEPLOY :"
        echo ""
        echo "1. Pousser sur GitHub :"
        echo "   git add ."
        echo "   git commit -m 'Version production Sogestmatic v2.1'"
        echo "   git push origin main"
        echo ""
        echo "2. Sur Netlify.com :"
        echo "   - New site from Git"
        echo "   - Connecter votre repo GitHub"
        echo "   - Build command: (laisser vide)"
        echo "   - Publish directory: dist"
        echo "   - Deploy site"
        echo ""
        echo "3. Configuration (optionnel) :"
        echo "   - Custom domain"
        echo "   - Environment variables"
        echo "   - Form handling"
        echo ""
        ;;
        
    4)
        print_warning "Déploiement annulé"
        exit 0
        ;;
        
    *)
        print_error "Choix invalide"
        exit 1
        ;;
esac

# Conseils post-déploiement
echo ""
echo "🎯 CONSEILS POST-DÉPLOIEMENT :"
echo ""
echo "✅ Vérifications à faire :"
echo "  - Test des fonctionnalités principales"
echo "  - Vérification responsive (mobile/tablet)"  
echo "  - Test de la recherche d'infractions"
echo "  - Test du chat IA (si API connectée)"
echo "  - Vérification PWA (installation)"
echo ""
echo "⚙️  Configuration recommandée :"
echo "  - Custom domain (Settings → Domain)"
echo "  - HTTPS redirect (automatique)"
echo "  - Environment variables pour API"
echo "  - Analytics (Settings → Analytics)"
echo ""
echo "📊 Monitoring :"
echo "  - Netlify Analytics"
echo "  - Uptime monitoring"
echo "  - Performance monitoring"
echo ""

# Afficher les URLs utiles
echo "🔗 LIENS UTILES :"
echo "  - Netlify Dashboard: https://app.netlify.com"
echo "  - Documentation: https://docs.netlify.com"
echo "  - Status: https://netlify.statuspage.io"
echo ""

print_success "Script de déploiement terminé !"
echo "🚛 Bonne route avec Sogestmatic v2.1 ! 🚀" 