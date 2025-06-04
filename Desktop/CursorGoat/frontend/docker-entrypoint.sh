#!/bin/sh
# Script d'entrée pour Frontend React
# Sogestmatic - Mission Stage

set -e

echo "🚀 Démarrage de l'interface frontend..."

# Configuration dynamique des variables d'environnement
if [ ! -z "$REACT_APP_API_URL" ]; then
    echo "⚙️ Configuration API URL: $REACT_APP_API_URL"
    
    # Remplacement des variables dans les fichiers JS buildés
    find /usr/share/nginx/html/static/js -name "*.js" -exec sed -i "s|http://localhost:8000|$REACT_APP_API_URL|g" {} \;
fi

# Configuration de l'environnement
if [ ! -z "$REACT_APP_ENV" ]; then
    echo "🏷️ Environnement: $REACT_APP_ENV"
fi

# Vérification des permissions
echo "🔐 Vérification des permissions..."
if [ "$(id -u)" = "0" ]; then
    echo "⚠️ Attention: Démarrage en tant que root"
    chown -R nginx:nginx /usr/share/nginx/html
    chown -R nginx:nginx /var/cache/nginx
    chown -R nginx:nginx /var/log/nginx
fi

# Test de la configuration Nginx
echo "🔧 Validation de la configuration Nginx..."
nginx -t

# Affichage des informations de démarrage
echo "✅ Configuration terminée"
echo "🌐 Interface accessible sur le port 3000"
echo "📡 API backend: ${REACT_APP_API_URL:-http://localhost:8000}"
echo "🎯 Version: ${REACT_APP_VERSION:-1.0.0}"

# Démarrage du serveur
echo "🎬 Démarrage de Nginx..."
exec "$@" 