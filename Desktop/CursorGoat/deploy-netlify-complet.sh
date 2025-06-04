#!/bin/bash

# 🚀 SCRIPT DÉPLOIEMENT NETLIFY COMPLET - SOGESTMATIC
# Usage: ./deploy-netlify-complet.sh

set -e  # Arrêt si erreur

echo "🚛 DÉPLOIEMENT NETLIFY SOGESTMATIC v2.0"
echo "========================================"

# Vérifications préalables
echo "🔍 Vérifications préalables..."

# 1. Vérifier que nous sommes dans le bon répertoire
if [ ! -f "netlify.toml" ]; then
    echo "❌ Erreur: netlify.toml non trouvé. Êtes-vous dans le bon répertoire?"
    exit 1
fi

# 2. Vérifier le dossier dist
if [ ! -d "dist" ]; then
    echo "❌ Erreur: Dossier dist/ non trouvé"
    exit 1
fi

# 3. Vérifier les fichiers essentiels
echo "📋 Vérification des fichiers essentiels..."

REQUIRED_FILES=(
    "dist/index.html"
    "dist/style.css" 
    "dist/script.js"
    "dist/manifest.json"
    "netlify.toml"
    "package.json"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Fichier manquant: $file"
        exit 1
    else
        echo "✅ $file"
    fi
done

# 4. Vérifier la taille du CSS (doit être corrigé)
CSS_SIZE=$(wc -c < "dist/style.css")
if [ $CSS_SIZE -lt 20000 ]; then
    echo "⚠️  Attention: style.css semble trop petit ($CSS_SIZE bytes)"
    echo "   Les couleurs sont-elles corrigées?"
    read -p "Continuer quand même? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ style.css OK ($CSS_SIZE bytes)"
fi

# 5. Créer le dossier netlify/functions si nécessaire
echo "📁 Création structure Netlify..."
mkdir -p netlify/functions

# 6. Vérifier si Netlify CLI est installé
if ! command -v netlify &> /dev/null; then
    echo "📦 Installation Netlify CLI..."
    npm install -g netlify-cli
fi

# 7. Vérification de l'authentification
echo "🔐 Vérification authentification Netlify..."
if ! netlify status &> /dev/null; then
    echo "🔑 Connexion à Netlify requise..."
    netlify login
fi

# 8. Installation des dépendances Node.js
if [ -f "package.json" ]; then
    echo "📦 Installation des dépendances..."
    npm install --silent
fi

# 9. Préparation du déploiement
echo "🏗️  Préparation du déploiement..."

# Créer un fichier de build info
cat > dist/build-info.json << EOF
{
    "version": "2.0.0-netlify-hybrid",
    "build_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "commit": "$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')",
    "mode": "production",
    "features": [
        "recherche_infractions",
        "chat_ia_demo", 
        "statistiques",
        "pwa",
        "responsive"
    ]
}
EOF

# 10. Test local rapide (optionnel)
echo "🧪 Voulez-vous faire un test local rapide?"
read -p "Tester localement avant déploiement? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌐 Démarrage serveur local..."
    cd dist
    python3 -m http.server 8888 > /dev/null 2>&1 &
    SERVER_PID=$!
    cd ..
    
    echo "✅ Serveur démarré: http://localhost:8888"
    echo "   Testez rapidement puis appuyez sur Entrée pour continuer..."
    read -r
    
    # Arrêter le serveur
    kill $SERVER_PID 2>/dev/null || true
    echo "🛑 Serveur arrêté"
fi

# 11. Déploiement
echo "🚀 DÉPLOIEMENT EN COURS..."
echo "========================"

# Déploiement de preview d'abord
echo "📋 Déploiement preview..."
PREVIEW_URL=$(netlify deploy --dir=. --json | jq -r '.deploy_url')

if [ $? -eq 0 ] && [ "$PREVIEW_URL" != "null" ]; then
    echo "✅ Preview déployé: $PREVIEW_URL"
    echo "🔍 Voulez-vous tester la preview avant le déploiement production?"
    read -p "Ouvrir la preview? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$PREVIEW_URL" 2>/dev/null || echo "Ouvrez: $PREVIEW_URL"
        echo "Testez la preview puis appuyez sur Entrée pour déployer en production..."
        read -r
    fi
    
    # Déploiement production
    echo "🌐 DÉPLOIEMENT PRODUCTION..."
    PROD_URL=$(netlify deploy --prod --dir=. --json | jq -r '.url')
    
    if [ $? -eq 0 ] && [ "$PROD_URL" != "null" ]; then
        echo ""
        echo "🎉 DÉPLOIEMENT RÉUSSI!"
        echo "====================="
        echo "🌐 URL Production: $PROD_URL"
        echo "📋 Preview: $PREVIEW_URL"
        echo ""
        echo "✅ Fonctionnalités disponibles:"
        echo "   • 🔍 Recherche d'infractions (477 items)"
        echo "   • 🤖 Chat IA juridique"
        echo "   • 📊 Statistiques transport"
        echo "   • 📱 PWA installable"
        echo "   • 🎨 Interface responsive"
        echo ""
        echo "🧪 Tests recommandés:"
        echo "   1. Rechercher 'tachygraphe'"
        echo "   2. Tester le chat IA"
        echo "   3. Vérifier sur mobile"
        echo "   4. Installer comme PWA"
        echo ""
        
        # Ouvrir automatiquement
        read -p "Ouvrir le site? (Y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            open "$PROD_URL" 2>/dev/null || echo "Ouvrez: $PROD_URL"
        fi
        
        # Sauvegarde des URLs
        echo "# 🚀 DÉPLOIEMENT $(date)" >> deployments.log
        echo "Production: $PROD_URL" >> deployments.log
        echo "Preview: $PREVIEW_URL" >> deployments.log
        echo "" >> deployments.log
        
    else
        echo "❌ Erreur lors du déploiement production"
        exit 1
    fi
else
    echo "❌ Erreur lors du déploiement preview"
    exit 1
fi

echo "🏁 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!"
echo ""
echo "📚 Documentation complète: DEPLOIEMENT_NETLIFY_COMPLET.md"
echo "🔧 Logs de déploiement: deployments.log" 