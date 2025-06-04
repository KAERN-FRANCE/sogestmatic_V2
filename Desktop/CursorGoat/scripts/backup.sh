#!/bin/bash
# Script de Sauvegarde et Restauration
# Sogestmatic - Base de Données Juridique Tachygraphique

set -e

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
COMPOSE_FILE="docker-compose.yml"
RETENTION_DAYS=30

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Création du répertoire de sauvegarde
ensure_backup_dir() {
    mkdir -p "$BACKUP_DIR"/{postgres,volumes,configs}
    log_success "Répertoire de sauvegarde: $BACKUP_DIR"
}

# Sauvegarde PostgreSQL
backup_postgres() {
    log_info "🗄️  Sauvegarde PostgreSQL..."
    
    local backup_file="$BACKUP_DIR/postgres/postgres_${DATE}.sql"
    
    # Dump de la base de données
    docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump \
        -U sogestmatic \
        -d tachygraphe_db \
        --no-owner \
        --no-privileges \
        --clean \
        --if-exists > "$backup_file"
    
    # Compression
    gzip "$backup_file"
    local compressed_file="${backup_file}.gz"
    
    local size=$(du -h "$compressed_file" | cut -f1)
    log_success "PostgreSQL sauvegardé: $compressed_file ($size)"
    
    # Validation
    if gunzip -t "$compressed_file" 2>/dev/null; then
        log_success "Archive PostgreSQL validée"
    else
        log_error "Archive PostgreSQL corrompue"
        return 1
    fi
}

# Sauvegarde des volumes Docker
backup_volumes() {
    log_info "💾 Sauvegarde des volumes Docker..."
    
    local volume_backup_dir="$BACKUP_DIR/volumes/$DATE"
    mkdir -p "$volume_backup_dir"
    
    # Liste des volumes à sauvegarder
    local volumes=(
        "cursorgoat_postgres_data"
        "cursorgoat_redis_data"
        "cursorgoat_es_data"
        "cursorgoat_grafana_data"
        "cursorgoat_chroma_data"
    )
    
    for volume in "${volumes[@]}"; do
        if docker volume inspect "$volume" &>/dev/null; then
            log_info "Sauvegarde du volume: $volume"
            
            # Création d'une archive tar du volume
            docker run --rm \
                -v "$volume":/source:ro \
                -v "$(pwd)/$volume_backup_dir":/backup \
                alpine:latest \
                tar czf "/backup/${volume}.tar.gz" -C /source .
            
            local size=$(du -h "$volume_backup_dir/${volume}.tar.gz" | cut -f1)
            log_success "Volume $volume: $size"
        else
            log_warning "Volume $volume introuvable"
        fi
    done
}

# Sauvegarde des configurations
backup_configs() {
    log_info "⚙️  Sauvegarde des configurations..."
    
    local config_backup_dir="$BACKUP_DIR/configs/$DATE"
    mkdir -p "$config_backup_dir"
    
    # Fichiers de configuration
    local configs=(
        "docker-compose.yml"
        ".env"
        "nginx.conf"
        "architecture/database_schema.sql"
        "data/infractions_sample.sql"
    )
    
    for config in "${configs[@]}"; do
        if [ -f "$config" ]; then
            cp "$config" "$config_backup_dir/"
            log_success "Config sauvegardée: $config"
        else
            log_warning "Config introuvable: $config"
        fi
    done
    
    # Archive de la configuration complète
    tar czf "$config_backup_dir/../configs_${DATE}.tar.gz" -C "$config_backup_dir" .
    rm -rf "$config_backup_dir"
    
    local size=$(du -h "$config_backup_dir/../configs_${DATE}.tar.gz" | cut -f1)
    log_success "Configurations archivées: $size"
}

# Sauvegarde des logs
backup_logs() {
    log_info "📝 Sauvegarde des logs..."
    
    local logs_backup_dir="$BACKUP_DIR/logs"
    mkdir -p "$logs_backup_dir"
    
    # Collecte des logs de chaque service
    local services=("api" "worker" "frontend" "postgres" "redis")
    
    for service in "${services[@]}"; do
        if docker-compose -f "$COMPOSE_FILE" ps | grep -q "$service"; then
            log_info "Collecte logs: $service"
            docker-compose -f "$COMPOSE_FILE" logs "$service" > "$logs_backup_dir/${service}_${DATE}.log" 2>&1
        fi
    done
    
    # Archive des logs
    tar czf "$logs_backup_dir/logs_${DATE}.tar.gz" -C "$logs_backup_dir" --exclude="*.tar.gz" .
    
    # Nettoyage des logs individuels
    find "$logs_backup_dir" -name "*.log" -delete
    
    local size=$(du -h "$logs_backup_dir/logs_${DATE}.tar.gz" | cut -f1)
    log_success "Logs archivés: $size"
}

# Sauvegarde complète
full_backup() {
    log_info "🎯 Démarrage de la sauvegarde complète..."
    echo "$(date): Début de sauvegarde" >> "$BACKUP_DIR/backup.log"
    
    ensure_backup_dir
    
    # Vérification que les services sont en marche
    if ! docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log_error "Aucun service en marche, sauvegarde annulée"
        exit 1
    fi
    
    local start_time=$(date +%s)
    
    # Sauvegardes
    backup_postgres
    backup_volumes
    backup_configs
    backup_logs
    
    # Métadonnées de sauvegarde
    local metadata_file="$BACKUP_DIR/metadata_${DATE}.json"
    cat > "$metadata_file" << EOF
{
    "backup_date": "$(date -Iseconds)",
    "backup_type": "full",
    "version": "1.0.0",
    "services_status": $(docker-compose -f "$COMPOSE_FILE" ps --format json),
    "system_info": {
        "hostname": "$(hostname)",
        "os": "$(uname -a)",
        "disk_usage": "$(df -h . | tail -1)",
        "memory": "$(free -h | grep Mem)"
    }
}
EOF
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    # Calcul de la taille totale
    local total_size=$(du -sh "$BACKUP_DIR" | cut -f1)
    
    echo "$(date): Sauvegarde terminée - Durée: ${duration}s - Taille: $total_size" >> "$BACKUP_DIR/backup.log"
    
    log_success "🎉 Sauvegarde complète terminée en ${duration}s"
    log_info "📊 Taille totale: $total_size"
    
    # Nettoyage des anciennes sauvegardes
    cleanup_old_backups
}

# Nettoyage des anciennes sauvegardes
cleanup_old_backups() {
    log_info "🧹 Nettoyage des sauvegardes anciennes (>${RETENTION_DAYS} jours)..."
    
    local deleted_count=0
    
    # Nettoyage par type de sauvegarde
    for subdir in postgres volumes configs logs; do
        if [ -d "$BACKUP_DIR/$subdir" ]; then
            find "$BACKUP_DIR/$subdir" -name "*" -type f -mtime +$RETENTION_DAYS -delete
            local count=$(find "$BACKUP_DIR/$subdir" -name "*" -type f -mtime +$RETENTION_DAYS | wc -l)
            deleted_count=$((deleted_count + count))
        fi
    done
    
    # Nettoyage des métadonnées
    find "$BACKUP_DIR" -name "metadata_*.json" -mtime +$RETENTION_DAYS -delete
    
    if [ $deleted_count -gt 0 ]; then
        log_success "🗑️  $deleted_count anciens fichiers supprimés"
    else
        log_info "Aucun fichier ancien à supprimer"
    fi
}

# Restauration PostgreSQL
restore_postgres() {
    local backup_file=$1
    
    if [ ! -f "$backup_file" ]; then
        log_error "Fichier de sauvegarde introuvable: $backup_file"
        return 1
    fi
    
    log_warning "⚠️  Restauration PostgreSQL - DESTRUCTIVE !"
    read -p "Confirmer la restauration ? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log_info "Restauration annulée"
        return 0
    fi
    
    log_info "🔄 Restauration de PostgreSQL..."
    
    # Décompression si nécessaire
    local sql_file="$backup_file"
    if [[ "$backup_file" == *.gz ]]; then
        sql_file="${backup_file%.gz}"
        gunzip -c "$backup_file" > "$sql_file"
    fi
    
    # Arrêt des services dépendants
    docker-compose -f "$COMPOSE_FILE" stop api worker
    
    # Restauration
    docker-compose -f "$COMPOSE_FILE" exec -T postgres psql \
        -U sogestmatic \
        -d tachygraphe_db < "$sql_file"
    
    # Redémarrage des services
    docker-compose -f "$COMPOSE_FILE" start api worker
    
    # Nettoyage du fichier temporaire
    if [[ "$backup_file" == *.gz ]]; then
        rm -f "$sql_file"
    fi
    
    log_success "✅ Restauration PostgreSQL terminée"
}

# Restauration des volumes
restore_volumes() {
    local volume_backup_dir=$1
    
    if [ ! -d "$volume_backup_dir" ]; then
        log_error "Répertoire de sauvegarde introuvable: $volume_backup_dir"
        return 1
    fi
    
    log_warning "⚠️  Restauration des volumes - DESTRUCTIVE !"
    read -p "Confirmer la restauration ? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        log_info "Restauration annulée"
        return 0
    fi
    
    log_info "🔄 Restauration des volumes..."
    
    # Arrêt de tous les services
    docker-compose -f "$COMPOSE_FILE" down
    
    # Restauration de chaque volume
    for archive in "$volume_backup_dir"/*.tar.gz; do
        if [ -f "$archive" ]; then
            local volume_name=$(basename "$archive" .tar.gz)
            log_info "Restauration du volume: $volume_name"
            
            # Suppression et recréation du volume
            docker volume rm "$volume_name" 2>/dev/null || true
            docker volume create "$volume_name"
            
            # Restauration des données
            docker run --rm \
                -v "$volume_name":/target \
                -v "$(dirname "$archive")":/backup \
                alpine:latest \
                tar xzf "/backup/$(basename "$archive")" -C /target
                
            log_success "Volume $volume_name restauré"
        fi
    done
    
    # Redémarrage des services
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log_success "✅ Restauration des volumes terminée"
}

# Liste des sauvegardes disponibles
list_backups() {
    log_info "📋 Sauvegardes disponibles:"
    echo ""
    
    if [ ! -d "$BACKUP_DIR" ]; then
        log_warning "Aucune sauvegarde trouvée"
        return
    fi
    
    # PostgreSQL
    echo "🗄️  PostgreSQL:"
    find "$BACKUP_DIR/postgres" -name "*.sql.gz" 2>/dev/null | sort -r | head -5 | while read backup; do
        local date=$(basename "$backup" | cut -d'_' -f2-3 | cut -d'.' -f1)
        local size=$(du -h "$backup" | cut -f1)
        echo "   $(echo $date | sed 's/_/ /g'): $size"
    done
    
    # Volumes
    echo ""
    echo "💾 Volumes:"
    find "$BACKUP_DIR/volumes" -maxdepth 1 -type d -name "*_*" 2>/dev/null | sort -r | head -5 | while read backup_dir; do
        local date=$(basename "$backup_dir")
        local size=$(du -sh "$backup_dir" | cut -f1)
        echo "   $(echo $date | sed 's/_/ /g'): $size"
    done
    
    # Statistiques
    echo ""
    local total_size=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
    local backup_count=$(find "$BACKUP_DIR" -name "metadata_*.json" 2>/dev/null | wc -l)
    echo "📊 Total: $backup_count sauvegardes, $total_size"
}

# Sauvegarde automatique (cron)
auto_backup() {
    log_info "🤖 Sauvegarde automatique..."
    
    # Log vers fichier pour cron
    exec > >(tee -a "$BACKUP_DIR/auto_backup.log")
    exec 2>&1
    
    echo "=== $(date) ==="
    
    # Vérification de l'espace disque
    local available_space=$(df . | tail -1 | awk '{print $4}')
    if [ "$available_space" -lt 5242880 ]; then  # 5GB en KB
        log_error "Espace disque insuffisant pour la sauvegarde"
        exit 1
    fi
    
    # Sauvegarde si les services sont actifs
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        full_backup
    else
        log_warning "Services non actifs, sauvegarde ignorée"
    fi
}

# Menu principal
case "${1:-backup}" in
    "backup"|"full")
        full_backup
        ;;
    "auto")
        auto_backup
        ;;
    "restore-postgres")
        if [ -z "$2" ]; then
            echo "Usage: $0 restore-postgres <backup_file.sql.gz>"
            exit 1
        fi
        restore_postgres "$2"
        ;;
    "restore-volumes")
        if [ -z "$2" ]; then
            echo "Usage: $0 restore-volumes <volume_backup_dir>"
            exit 1
        fi
        restore_volumes "$2"
        ;;
    "list")
        list_backups
        ;;
    "cleanup")
        cleanup_old_backups
        ;;
    *)
        echo "Usage: $0 {backup|auto|restore-postgres|restore-volumes|list|cleanup}"
        echo ""
        echo "  backup               : Sauvegarde complète (défaut)"
        echo "  auto                 : Sauvegarde automatique (pour cron)"
        echo "  restore-postgres     : Restaurer PostgreSQL"
        echo "  restore-volumes      : Restaurer les volumes"
        echo "  list                 : Lister les sauvegardes"
        echo "  cleanup              : Nettoyer les anciennes sauvegardes"
        echo ""
        echo "Exemples:"
        echo "  $0 backup"
        echo "  $0 restore-postgres backups/postgres/postgres_20241201_140000.sql.gz"
        echo "  $0 restore-volumes backups/volumes/20241201_140000"
        exit 1
        ;;
esac 