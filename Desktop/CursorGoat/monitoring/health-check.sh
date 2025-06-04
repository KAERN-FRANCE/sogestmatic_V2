#!/bin/bash
# Script de Monitoring et Health Check
# Sogestmatic - Base de Données Juridique Tachygraphique

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
COMPOSE_FILE="docker-compose.yml"
ALERT_EMAIL="admin@sogestmatic.fr"
SLACK_WEBHOOK=""

# Logs
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Test de connectivité
test_endpoint() {
    local url=$1
    local name=$2
    local timeout=${3:-10}
    
    if curl -s --max-time $timeout "$url" > /dev/null 2>&1; then
        log_success "$name: Accessible"
        return 0
    else
        log_error "$name: Non accessible ($url)"
        return 1
    fi
}

# Test de base de données
test_database() {
    log_info "Test PostgreSQL..."
    if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U sogestmatic -d tachygraphe_db; then
        log_success "PostgreSQL: Opérationnel"
        
        # Test de requête
        local count=$(docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U sogestmatic -d tachygraphe_db -t -c "SELECT COUNT(*) FROM infractions;" 2>/dev/null | tr -d ' ')
        if [[ "$count" =~ ^[0-9]+$ ]]; then
            log_success "PostgreSQL: $count infractions en base"
        else
            log_warning "PostgreSQL: Erreur lecture données"
        fi
        return 0
    else
        log_error "PostgreSQL: Non disponible"
        return 1
    fi
}

# Test de Redis
test_redis() {
    log_info "Test Redis..."
    if docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping | grep -q "PONG"; then
        log_success "Redis: Opérationnel"
        
        # Statistiques
        local keys=$(docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli dbsize | tr -d '\r')
        log_info "Redis: $keys clés en cache"
        return 0
    else
        log_error "Redis: Non disponible"
        return 1
    fi
}

# Test de l'API
test_api() {
    log_info "Test API FastAPI..."
    
    # Health endpoint
    if test_endpoint "http://localhost:8000/health" "API Health"; then
        # Test de recherche
        local response=$(curl -s "http://localhost:8000/infractions/search?q=test&limit=1")
        if echo "$response" | grep -q '\['; then
            log_success "API: Recherche fonctionnelle"
        else
            log_warning "API: Recherche non fonctionnelle"
        fi
        
        # Statistiques
        local stats=$(curl -s "http://localhost:8000/statistiques/dashboard" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f\"Infractions: {sum(data.get('infractions_par_categorie', {}).values())})\")
except:
    print('Erreur parsing')
" 2>/dev/null)
        log_info "API: $stats"
        return 0
    else
        return 1
    fi
}

# Test du frontend
test_frontend() {
    log_info "Test Frontend React..."
    if test_endpoint "http://localhost:3000" "Frontend" 5; then
        # Test du proxy API
        if test_endpoint "http://localhost:3000/api/health" "Frontend Proxy"; then
            log_success "Frontend: Proxy API fonctionnel"
        else
            log_warning "Frontend: Proxy API non fonctionnel"
        fi
        return 0
    else
        return 1
    fi
}

# Test Elasticsearch
test_elasticsearch() {
    log_info "Test Elasticsearch..."
    if test_endpoint "http://localhost:9200" "Elasticsearch"; then
        local health=$(curl -s "http://localhost:9200/_cluster/health" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(f\"{data['status']} - {data['number_of_nodes']} nodes\")
" 2>/dev/null)
        log_info "Elasticsearch: $health"
        return 0
    else
        return 1
    fi
}

# Test ChromaDB
test_chromadb() {
    log_info "Test ChromaDB..."
    if test_endpoint "http://localhost:8001" "ChromaDB"; then
        local collections=$(curl -s "http://localhost:8001/api/v1/collections" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f\"{len(data)} collections\")
except:
    print('0 collections')
" 2>/dev/null)
        log_info "ChromaDB: $collections"
        return 0
    else
        return 1
    fi
}

# Test Grafana
test_grafana() {
    log_info "Test Grafana..."
    if test_endpoint "http://localhost:3001" "Grafana"; then
        return 0
    else
        return 1
    fi
}

# Statistiques système
system_stats() {
    echo ""
    log_info "=== Statistiques Système ==="
    
    # CPU et mémoire
    echo "💻 Ressources système:"
    echo "   CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4"%"}') utilisé"
    echo "   RAM: $(free -h | awk 'NR==2{printf "%.1f%%", $3*100/$2}')"
    echo "   Disque: $(df -h . | awk 'NR==2{print $5}')"
    
    # Docker
    echo ""
    echo "🐳 Conteneurs Docker:"
    docker-compose -f "$COMPOSE_FILE" ps --format "table {{.Name}}\t{{.State}}\t{{.Ports}}"
    
    # Volumes
    echo ""
    echo "💾 Volumes Docker:"
    docker volume ls --filter name=cursorgoat | tail -n +2 | while read driver name; do
        size=$(docker system df -v | grep "$name" | awk '{print $3}' || echo "N/A")
        echo "   $name: $size"
    done
}

# Performance détaillée
performance_check() {
    echo ""
    log_info "=== Test de Performance ==="
    
    # Test de charge API
    log_info "Test de charge API (10 requêtes)..."
    local total_time=0
    local success_count=0
    
    for i in {1..10}; do
        local start_time=$(date +%s.%N)
        if curl -s "http://localhost:8000/health" > /dev/null; then
            local end_time=$(date +%s.%N)
            local duration=$(echo "$end_time - $start_time" | bc)
            total_time=$(echo "$total_time + $duration" | bc)
            success_count=$((success_count + 1))
        fi
    done
    
    if [ $success_count -gt 0 ]; then
        local avg_time=$(echo "scale=3; $total_time / $success_count" | bc)
        log_info "API: ${success_count}/10 succès, temps moyen: ${avg_time}s"
    else
        log_error "API: Aucune requête réussie"
    fi
    
    # Test de base de données
    log_info "Test performance base de données..."
    local db_time=$(docker-compose -f "$COMPOSE_FILE" exec -T postgres sh -c "
        time psql -U sogestmatic -d tachygraphe_db -c 'SELECT COUNT(*) FROM infractions;' > /dev/null
    " 2>&1 | grep real | awk '{print $2}')
    log_info "PostgreSQL: Requête COUNT en $db_time"
}

# Alertes
send_alert() {
    local message=$1
    local severity=${2:-"warning"}
    
    echo ""
    log_warning "🚨 ALERTE: $message"
    
    # Email (si configuré)
    if [ -n "$ALERT_EMAIL" ] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "[Sogestmatic] Alerte Système - $severity" "$ALERT_EMAIL"
    fi
    
    # Slack (si configuré)
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 Sogestmatic Alert: $message\"}" \
            "$SLACK_WEBHOOK" > /dev/null 2>&1
    fi
}

# Health check complet
full_health_check() {
    echo "🏥 Health Check Complet - $(date)"
    echo "=========================================="
    
    local errors=0
    
    # Tests des services
    test_database || errors=$((errors + 1))
    test_redis || errors=$((errors + 1))
    test_api || errors=$((errors + 1))
    test_frontend || errors=$((errors + 1))
    test_elasticsearch || errors=$((errors + 1))
    test_chromadb || errors=$((errors + 1))
    test_grafana || errors=$((errors + 1))
    
    # Statistiques
    system_stats
    
    # Résumé
    echo ""
    if [ $errors -eq 0 ]; then
        log_success "🎉 Tous les services sont opérationnels"
    else
        log_error "⚠️  $errors service(s) en échec"
        send_alert "$errors service(s) en échec détecté(s)" "critical"
    fi
    
    return $errors
}

# Monitoring continu
continuous_monitoring() {
    log_info "🔄 Démarrage du monitoring continu (Ctrl+C pour arrêter)..."
    
    while true; do
        clear
        full_health_check
        
        echo ""
        log_info "⏱️  Prochaine vérification dans 60 secondes..."
        sleep 60
    done
}

# Auto-healing
auto_heal() {
    log_info "🔧 Tentative de réparation automatique..."
    
    # Redémarrage des services en échec
    local failed_services=$(docker-compose -f "$COMPOSE_FILE" ps --filter "status=exited" --format "{{.Name}}")
    
    if [ -n "$failed_services" ]; then
        log_info "Redémarrage des services en échec: $failed_services"
        echo "$failed_services" | xargs -I {} docker-compose -f "$COMPOSE_FILE" restart {}
        
        # Attendre et re-tester
        sleep 30
        if full_health_check; then
            log_success "🎯 Réparation automatique réussie"
            send_alert "Services redémarrés avec succès" "info"
        else
            log_error "❌ Réparation automatique échouée"
            send_alert "Échec de la réparation automatique - intervention manuelle requise" "critical"
        fi
    else
        log_info "Aucun service en échec détecté"
    fi
}

# Menu principal
case "${1:-health}" in
    "health")
        full_health_check
        ;;
    "monitor")
        continuous_monitoring
        ;;
    "performance")
        performance_check
        ;;
    "heal")
        auto_heal
        ;;
    "stats")
        system_stats
        ;;
    *)
        echo "Usage: $0 {health|monitor|performance|heal|stats}"
        echo ""
        echo "  health      : Vérification complète (défaut)"
        echo "  monitor     : Monitoring continu"
        echo "  performance : Test de performance"
        echo "  heal        : Réparation automatique"
        echo "  stats       : Statistiques système"
        exit 1
        ;;
esac 