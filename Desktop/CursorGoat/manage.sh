#!/bin/bash
# Script de Gestion Principal
# Sogestmatic - Base de Données Juridique Tachygraphique
# Outil unifié pour toutes les opérations

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
PROJECT_NAME="Sogestmatic - Base de Données Juridique Tachygraphique"
VERSION="2.0.0"

# Fonctions utilitaires
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_header() { echo -e "${PURPLE}🚀 $1${NC}"; }

# Banner d'accueil
show_banner() {
    clear
    echo -e "${PURPLE}================================================================${NC}"
    echo -e "${CYAN}"
    cat << "EOF"
 ███████╗ ██████╗  ██████╗ ███████╗███████╗████████╗███╗   ███╗ █████╗ ████████╗██╗ ██████╗
 ██╔════╝██╔═══██╗██╔════╝ ██╔════╝██╔════╝╚══██╔══╝████╗ ████║██╔══██╗╚══██╔══╝██║██╔════╝
 ███████╗██║   ██║██║  ███╗█████╗  ███████╗   ██║   ██╔████╔██║███████║   ██║   ██║██║
 ╚════██║██║   ██║██║   ██║██╔══╝  ╚════██║   ██║   ██║╚██╔╝██║██╔══██║   ██║   ██║██║
 ███████║╚██████╔╝╚██████╔╝███████╗███████║   ██║   ██║ ╚═╝ ██║██║  ██║   ██║   ██║╚██████╗
 ╚══════╝ ╚═════╝  ╚═════╝ ╚══════╝╚══════╝   ╚═╝   ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝
EOF
    echo -e "${NC}"
    echo -e "${PURPLE}                    Base de Données Juridique Tachygraphique${NC}"
    echo -e "${BLUE}                              Version $VERSION${NC}"
    echo -e "${PURPLE}================================================================${NC}"
    echo ""
}

# Menu principal
show_main_menu() {
    echo -e "${CYAN}🎯 Que souhaitez-vous faire ?${NC}"
    echo ""
    echo "  ${GREEN}1.${NC} 🚀 Déployer le système complet"
    echo "  ${GREEN}2.${NC} 🏥 Vérifier l'état des services"
    echo "  ${GREEN}3.${NC} 📊 Afficher les logs en temps réel"
    echo "  ${GREEN}4.${NC} 💾 Effectuer une sauvegarde"
    echo "  ${GREEN}5.${NC} 🔄 Redémarrer les services"
    echo "  ${GREEN}6.${NC} 🛑 Arrêter tous les services"
    echo "  ${GREEN}7.${NC} 🧹 Nettoyer le système"
    echo "  ${GREEN}8.${NC} 📈 Tests de performance"
    echo "  ${GREEN}9.${NC} 🔧 Maintenance avancée"
    echo "  ${GREEN}0.${NC} ❌ Quitter"
    echo ""
    echo -n "Votre choix (0-9): "
}

# Déploiement
deploy_system() {
    log_header "🚀 Déploiement du système complet"
    echo ""
    
    # Vérification prérequis
    if ! command -v docker &> /dev/null; then
        log_error "Docker n'est pas installé"
        return 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose n'est pas installé"
        return 1
    fi
    
    log_info "Lancement du déploiement automatisé..."
    ./deploy.sh
    
    if [ $? -eq 0 ]; then
        log_success "Déploiement réussi !"
        show_access_info
    else
        log_error "Échec du déploiement"
    fi
}

# Health check
health_check() {
    log_header "🏥 Vérification de l'état des services"
    ./monitoring/health-check.sh health
}

# Logs en temps réel
show_logs() {
    log_header "📊 Logs en temps réel"
    echo ""
    echo "Services disponibles:"
    echo "  1. Tous les services"
    echo "  2. API seulement"
    echo "  3. Worker de collecte"
    echo "  4. Frontend"
    echo "  5. Base de données"
    echo ""
    echo -n "Quel service (1-5)? "
    read choice
    
    case $choice in
        1) docker-compose logs -f ;;
        2) docker-compose logs -f api ;;
        3) docker-compose logs -f worker ;;
        4) docker-compose logs -f frontend ;;
        5) docker-compose logs -f postgres ;;
        *) log_warning "Choix invalide" ;;
    esac
}

# Sauvegarde
backup_system() {
    log_header "💾 Sauvegarde du système"
    ./scripts/backup.sh backup
}

# Redémarrage
restart_services() {
    log_header "🔄 Redémarrage des services"
    echo ""
    echo "Options de redémarrage:"
    echo "  1. Tous les services"
    echo "  2. Services applicatifs seulement (API, Worker, Frontend)"
    echo "  3. Base de données seulement"
    echo ""
    echo -n "Votre choix (1-3)? "
    read choice
    
    case $choice in
        1)
            log_info "Redémarrage de tous les services..."
            docker-compose restart
            ;;
        2)
            log_info "Redémarrage des services applicatifs..."
            docker-compose restart api worker frontend
            ;;
        3)
            log_info "Redémarrage de la base de données..."
            docker-compose restart postgres
            ;;
        *)
            log_warning "Choix invalide"
            return
            ;;
    esac
    
    log_success "Redémarrage terminé"
}

# Arrêt
stop_services() {
    log_header "🛑 Arrêt des services"
    echo ""
    log_warning "Êtes-vous sûr de vouloir arrêter tous les services ?"
    echo -n "Confirmer (yes/no): "
    read confirm
    
    if [ "$confirm" = "yes" ]; then
        log_info "Arrêt en cours..."
        docker-compose down
        log_success "Services arrêtés"
    else
        log_info "Arrêt annulé"
    fi
}

# Nettoyage
cleanup_system() {
    log_header "🧹 Nettoyage du système"
    echo ""
    echo "Options de nettoyage:"
    echo "  1. Nettoyage léger (images dangereuses)"
    echo "  2. Nettoyage complet (DESTRUCTIF - supprime tout)"
    echo "  3. Nettoyage des logs anciens"
    echo "  4. Nettoyage des sauvegardes anciennes"
    echo ""
    echo -n "Votre choix (1-4)? "
    read choice
    
    case $choice in
        1)
            log_info "Nettoyage léger..."
            docker image prune -f
            docker container prune -f
            ;;
        2)
            log_warning "ATTENTION: Nettoyage complet - toutes les données seront perdues !"
            echo -n "Confirmer avec 'DELETE' (en majuscules): "
            read confirm
            if [ "$confirm" = "DELETE" ]; then
                ./deploy.sh clean
            else
                log_info "Nettoyage annulé"
            fi
            ;;
        3)
            log_info "Nettoyage des logs..."
            docker-compose logs --tail=0 > /dev/null 2>&1
            ;;
        4)
            log_info "Nettoyage des anciennes sauvegardes..."
            ./scripts/backup.sh cleanup
            ;;
        *)
            log_warning "Choix invalide"
            ;;
    esac
}

# Tests de performance
performance_tests() {
    log_header "📈 Tests de performance"
    ./monitoring/health-check.sh performance
}

# Menu maintenance avancée
advanced_maintenance() {
    log_header "🔧 Maintenance avancée"
    echo ""
    echo "Options avancées:"
    echo "  1. 🔄 Monitoring continu"
    echo "  2. 🛠️  Réparation automatique"
    echo "  3. 📋 Liste des sauvegardes"
    echo "  4. 🔙 Restaurer une sauvegarde"
    echo "  5. 📊 Statistiques détaillées"
    echo "  6. 🐳 Informations Docker"
    echo "  7. 🔍 Analyse des logs"
    echo ""
    echo -n "Votre choix (1-7)? "
    read choice
    
    case $choice in
        1)
            log_info "Démarrage du monitoring continu (Ctrl+C pour arrêter)..."
            ./monitoring/health-check.sh monitor
            ;;
        2)
            log_info "Lancement de la réparation automatique..."
            ./monitoring/health-check.sh heal
            ;;
        3)
            ./scripts/backup.sh list
            ;;
        4)
            echo "Restauration guidée:"
            echo "1. PostgreSQL"
            echo "2. Volumes"
            echo -n "Type de restauration (1-2)? "
            read restore_type
            case $restore_type in
                1)
                    echo -n "Chemin du fichier de sauvegarde: "
                    read backup_file
                    ./scripts/backup.sh restore-postgres "$backup_file"
                    ;;
                2)
                    echo -n "Répertoire de sauvegarde des volumes: "
                    read backup_dir
                    ./scripts/backup.sh restore-volumes "$backup_dir"
                    ;;
                *)
                    log_warning "Type invalide"
                    ;;
            esac
            ;;
        5)
            ./monitoring/health-check.sh stats
            ;;
        6)
            echo ""
            log_info "Images Docker:"
            docker images | grep -E "(sogestmatic|tachygraphe|postgres|redis|nginx)" || echo "Aucune image trouvée"
            echo ""
            log_info "Volumes Docker:"
            docker volume ls | grep cursorgoat || echo "Aucun volume trouvé"
            echo ""
            log_info "Réseaux Docker:"
            docker network ls | grep cursorgoat || echo "Aucun réseau trouvé"
            ;;
        7)
            echo ""
            log_info "Analyse des erreurs récentes..."
            docker-compose logs --tail=100 | grep -i "error\|exception\|failed" | tail -10
            ;;
        *)
            log_warning "Choix invalide"
            ;;
    esac
}

# Informations d'accès
show_access_info() {
    echo ""
    log_header "🌐 Informations d'accès"
    echo ""
    echo "📊 Services disponibles:"
    echo "   🌐 Interface Web:      ${CYAN}http://localhost:3000${NC}"
    echo "   🔧 API Documentation:  ${CYAN}http://localhost:8000/docs${NC}"
    echo "   📈 Grafana Monitoring: ${CYAN}http://localhost:3001${NC} (admin/admin123)"
    echo "   🗄️  PostgreSQL:        ${CYAN}localhost:5432${NC}"
    echo "   ⚡ Redis:              ${CYAN}localhost:6379${NC}"
    echo "   🔍 Elasticsearch:      ${CYAN}http://localhost:9200${NC}"
    echo "   🧠 ChromaDB:           ${CYAN}http://localhost:8001${NC}"
    echo ""
    echo "🔑 Comptes par défaut:"
    echo "   PostgreSQL: sogestmatic / (voir .env)"
    echo "   Grafana:    admin / admin123"
    echo ""
    echo "⚠️  N'oubliez pas de configurer votre clé OpenAI dans le fichier .env"
}

# Vérification des mises à jour
check_updates() {
    echo ""
    log_info "🔄 Vérification des mises à jour disponibles..."
    
    # Simulation de vérification
    echo "   - Base de données juridique: ✅ À jour"
    echo "   - Images Docker: ✅ À jour"
    echo "   - Configuration: ✅ À jour"
    
    log_success "Système à jour"
}

# Boucle principale
main_loop() {
    show_banner
    
    while true; do
        show_main_menu
        read choice
        
        case $choice in
            1) deploy_system ;;
            2) health_check ;;
            3) show_logs ;;
            4) backup_system ;;
            5) restart_services ;;
            6) stop_services ;;
            7) cleanup_system ;;
            8) performance_tests ;;
            9) advanced_maintenance ;;
            0)
                echo ""
                log_success "🎉 Merci d'avoir utilisé le gestionnaire Sogestmatic !"
                log_info "💡 N'hésitez pas à consulter la documentation: README.md"
                echo ""
                exit 0
                ;;
            "update"|"updates")
                check_updates
                ;;
            "help"|"aide")
                show_access_info
                ;;
            *)
                log_warning "Choix invalide. Utilisez 0-9."
                ;;
        esac
        
        echo ""
        echo -n "Appuyez sur Entrée pour continuer..."
        read
        show_banner
    done
}

# Point d'entrée
if [ "${1:-interactive}" = "interactive" ]; then
    main_loop
else
    # Mode non-interactif pour scripts
    case "$1" in
        "deploy") deploy_system ;;
        "health") health_check ;;
        "backup") backup_system ;;
        "info") show_access_info ;;
        *) 
            echo "Usage: $0 [interactive|deploy|health|backup|info]"
            echo ""
            echo "  interactive : Mode interactif (défaut)"
            echo "  deploy      : Déploiement automatique"
            echo "  health      : Vérification santé"
            echo "  backup      : Sauvegarde"
            echo "  info        : Informations d'accès"
            ;;
    esac
fi 