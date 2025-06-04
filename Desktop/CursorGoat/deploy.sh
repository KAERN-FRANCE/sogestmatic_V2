#!/bin/bash
# Script de Déploiement Automatisé
# Sogestmatic - Base de Données Juridique Tachygraphique

set -e

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="tachygraphe-juridique"
COMPOSE_FILE="docker-compose.yml"
ENV_FILE=".env"

# Fonctions utilitaires
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_header() {
    echo -e "${PURPLE}🚀 $1${NC}"
}

# Vérification des prérequis
check_prerequisites() {
    log_header "Vérification des prérequis..."
    
    # Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        exit 1
    fi
    log_success "Docker: $(docker --version)"
    
    # Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        exit 1
    fi
    log_success "Docker Compose: $(docker-compose --version)"
    
    # Espace disque
    AVAILABLE_SPACE=$(df . | tail -1 | awk '{print $4}')
    if [ "$AVAILABLE_SPACE" -lt 10485760 ]; then  # 10GB en KB
        log_warning "Espace disque faible: $(($AVAILABLE_SPACE / 1024 / 1024))GB disponibles"
    fi
    
    log_success "Prérequis validés"
}

# Création du fichier .env si inexistant
setup_environment() {
    log_header "Configuration de l'environnement..."
    
    if [ ! -f "$ENV_FILE" ]; then
        log_info "Création du fichier .env..."
        cat > "$ENV_FILE" << EOF
# Variables d'environnement - Sogestmatic Tachygraphique
POSTGRES_PASSWORD=SecurePassword2024!
OPENAI_API_KEY=sk-your-openai-api-key-here
GRAFANA_PASSWORD=Admin123Secure!
ENV=production
DEBUG=false
EOF
        log_warning "Fichier .env créé avec des valeurs par défaut"
        log_warning "IMPORTANT: Modifiez les clés API avant le déploiement !"
    else
        log_success "Fichier .env trouvé"
    fi
    
    # Vérification des variables critiques
    if grep -q "your-openai-api-key-here" "$ENV_FILE"; then
        log_warning "Clé OpenAI non configurée dans $ENV_FILE"
    fi
}

# Nettoyage des conteneurs existants
cleanup_containers() {
    log_header "Nettoyage des conteneurs existants..."
    
    # Arrêt des conteneurs
    if docker-compose -f "$COMPOSE_FILE" ps -q | grep -q .; then
        log_info "Arrêt des conteneurs..."
        docker-compose -f "$COMPOSE_FILE" down --remove-orphans
    fi
    
    # Nettoyage des images dangereuses
    if docker images -f "dangling=true" -q | grep -q .; then
        log_info "Suppression des images dangereuses..."
        docker image prune -f
    fi
    
    log_success "Nettoyage terminé"
}

# Build des images
build_images() {
    log_header "Construction des images Docker..."
    
    # Build en parallèle pour optimiser le temps
    log_info "Build de l'API..."
    docker-compose -f "$COMPOSE_FILE" build api &
    API_PID=$!
    
    log_info "Build du worker..."
    docker-compose -f "$COMPOSE_FILE" build worker &
    WORKER_PID=$!
    
    log_info "Build du frontend..."
    docker-compose -f "$COMPOSE_FILE" build frontend &
    FRONTEND_PID=$!
    
    # Attendre tous les builds
    wait $API_PID && log_success "API build terminé"
    wait $WORKER_PID && log_success "Worker build terminé"
    wait $FRONTEND_PID && log_success "Frontend build terminé"
    
    log_success "Toutes les images sont construites"
}

# Démarrage des services
start_services() {
    log_header "Démarrage des services..."
    
    # Démarrage par étapes pour gérer les dépendances
    log_info "Démarrage de la base de données..."
    docker-compose -f "$COMPOSE_FILE" up -d postgres redis
    
    # Attendre que PostgreSQL soit prêt
    log_info "Attente de PostgreSQL..."
    timeout=60
    while ! docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U sogestmatic -d tachygraphe_db; do
        sleep 2
        timeout=$((timeout - 2))
        if [ $timeout -le 0 ]; then
            log_error "Timeout: PostgreSQL non disponible"
            exit 1
        fi
    done
    log_success "PostgreSQL prêt"
    
    log_info "Démarrage d'Elasticsearch et ChromaDB..."
    docker-compose -f "$COMPOSE_FILE" up -d elasticsearch chromadb
    
    # Attendre Elasticsearch
    log_info "Attente d'Elasticsearch..."
    timeout=90
    while ! curl -s http://localhost:9200/_cluster/health | grep -q "yellow\|green"; do
        sleep 3
        timeout=$((timeout - 3))
        if [ $timeout -le 0 ]; then
            log_error "Timeout: Elasticsearch non disponible"
            exit 1
        fi
    done
    log_success "Elasticsearch prêt"
    
    log_info "Démarrage de l'API..."
    docker-compose -f "$COMPOSE_FILE" up -d api
    
    # Attendre l'API
    log_info "Attente de l'API..."
    timeout=60
    while ! curl -s http://localhost:8000/health | grep -q "OK"; do
        sleep 2
        timeout=$((timeout - 2))
        if [ $timeout -le 0 ]; then
            log_error "Timeout: API non disponible"
            exit 1
        fi
    done
    log_success "API prête"
    
    log_info "Démarrage des services restants..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log_success "Tous les services sont démarrés"
}

# Vérification de l'état des services
health_check() {
    log_header "Vérification de l'état des services..."
    
    services=("postgres:5432" "redis:6379" "elasticsearch:9200" "api:8000" "frontend:3000" "grafana:3000" "chromadb:8000")
    
    for service in "${services[@]}"; do
        service_name=$(echo $service | cut -d: -f1)
        port=$(echo $service | cut -d: -f2)
        
        if docker-compose -f "$COMPOSE_FILE" ps | grep -q "$service_name.*Up"; then
            if curl -s "http://localhost:$port" &> /dev/null || \
               nc -z localhost "$port" &> /dev/null; then
                log_success "$service_name: Opérationnel"
            else
                log_warning "$service_name: Démarré mais non accessible"
            fi
        else
            log_error "$service_name: Non démarré"
        fi
    done
}

# Initialisation des données
initialize_data() {
    log_header "Initialisation des données..."
    
    # Attendre que l'API soit complètement prête
    sleep 10
    
    # Vérifier la base de données
    log_info "Vérification de la structure de la base de données..."
    if docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U sogestmatic -d tachygraphe_db -c "\dt" | grep -q "infractions"; then
        log_success "Tables créées avec succès"
    else
        log_warning "Tables non trouvées, initialisation en cours..."
    fi
    
    # Lancer le worker de collecte initiale
    log_info "Démarrage de la collecte initiale de données..."
    docker-compose -f "$COMPOSE_FILE" exec -T worker python -c "
import asyncio
from workers.data_collector import DataCollector
async def main():
    async with DataCollector() as collector:
        await collector.run_collection_cycle()
        print('Collecte initiale terminée')
asyncio.run(main())
" &
    
    log_success "Initialisation des données lancée en arrière-plan"
}

# Affichage des informations de connexion
show_access_info() {
    log_header "🎉 Déploiement terminé avec succès !"
    
    echo ""
    echo "📊 Services disponibles :"
    echo "   🌐 Interface Web:      http://localhost:3000"
    echo "   🔧 API Documentation:  http://localhost:8000/docs"
    echo "   📈 Grafana Monitoring: http://localhost:3001 (admin/admin123)"
    echo "   🗄️  PostgreSQL:        localhost:5432"
    echo "   ⚡ Redis:              localhost:6379"
    echo "   🔍 Elasticsearch:      http://localhost:9200"
    echo "   🧠 ChromaDB:           http://localhost:8001"
    echo ""
    echo "🛠️  Commandes utiles :"
    echo "   Logs en temps réel:    docker-compose logs -f"
    echo "   Arrêter les services:  docker-compose down"
    echo "   Redémarrer:           docker-compose restart"
    echo "   Status des services:   docker-compose ps"
    echo ""
    echo "⚠️  Notes importantes :"
    echo "   - Configurez votre clé OpenAI dans le fichier .env"
    echo "   - Les données sont sauvegardées dans des volumes Docker"
    echo "   - Premier démarrage: attendre 2-3 minutes pour l'indexation"
    echo ""
    log_success "Système prêt pour utilisation !"
}

# Gestion des erreurs
cleanup_on_error() {
    log_error "Erreur détectée pendant le déploiement"
    log_info "Nettoyage en cours..."
    docker-compose -f "$COMPOSE_FILE" down --remove-orphans
    exit 1
}

# Fonction principale
main() {
    trap cleanup_on_error ERR
    
    log_header "🚛 Déploiement Sogestmatic - Base de Données Juridique Tachygraphique"
    echo ""
    
    check_prerequisites
    setup_environment
    cleanup_containers
    build_images
    start_services
    health_check
    initialize_data
    show_access_info
}

# Gestion des arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "stop")
        log_info "Arrêt des services..."
        docker-compose -f "$COMPOSE_FILE" down
        log_success "Services arrêtés"
        ;;
    "restart")
        log_info "Redémarrage des services..."
        docker-compose -f "$COMPOSE_FILE" restart
        log_success "Services redémarrés"
        ;;
    "logs")
        docker-compose -f "$COMPOSE_FILE" logs -f "${2:-}"
        ;;
    "status")
        docker-compose -f "$COMPOSE_FILE" ps
        ;;
    "clean")
        log_info "Nettoyage complet..."
        docker-compose -f "$COMPOSE_FILE" down -v --remove-orphans
        docker system prune -af
        log_success "Nettoyage terminé"
        ;;
    *)
        echo "Usage: $0 {deploy|stop|restart|logs|status|clean}"
        echo ""
        echo "  deploy  : Déploiement complet (défaut)"
        echo "  stop    : Arrêt des services"
        echo "  restart : Redémarrage des services"
        echo "  logs    : Affichage des logs"
        echo "  status  : État des services"
        echo "  clean   : Nettoyage complet"
        exit 1
        ;;
esac 