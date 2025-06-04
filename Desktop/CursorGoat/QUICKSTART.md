# 🚀 Guide de Démarrage Rapide
## Sogestmatic - Base de Données Juridique Tachygraphique

> **Déployez en 5 minutes votre assistant juridique intelligent !**

---

## ⚡ Démarrage Ultra-Rapide

### Option 1: Script Interactif (Recommandé)
```bash
# Clone du projet
git clone <repo-url>
cd CursorGoat

# Lancement du gestionnaire interactif
./manage.sh
```

### Option 2: Déploiement Automatique
```bash
# Déploiement direct
./deploy.sh

# OU via le gestionnaire
./manage.sh deploy
```

---

## 📋 Prérequis (Vérification Automatique)

- ✅ **Docker** 20.10+ installé
- ✅ **Docker Compose** v2.0+ installé  
- ✅ **16GB RAM** recommandés (8GB minimum)
- ✅ **20GB d'espace disque** libre
- ⚠️ **Clé OpenAI** (optionnelle pour l'IA)

### Installation Docker (si nécessaire)

**macOS:**
```bash
brew install docker docker-compose
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install docker.io docker-compose
sudo usermod -aG docker $USER
```

**Windows:**
Télécharger Docker Desktop depuis [docker.com](https://docker.com)

---

## 🔧 Configuration Initiale

### 1. Variables d'environnement
```bash
# Le script créera automatiquement le fichier .env
# Editez-le pour personnaliser:
nano .env
```

**Variables importantes:**
```env
# Base de données (générées automatiquement)
POSTGRES_PASSWORD=SecurePassword2024!

# OpenAI (optionnel - pour l'assistant IA)
OPENAI_API_KEY=sk-your-key-here

# Monitoring (par défaut)
GRAFANA_PASSWORD=admin123
```

### 2. Lancement du déploiement
```bash
# Interface interactive complète
./manage.sh

# OU déploiement direct
./deploy.sh
```

---

## 📊 Vérification du Déploiement

### Services automatiquement vérifiés:
- ✅ **PostgreSQL** - Base de données principale
- ✅ **Redis** - Cache et sessions
- ✅ **API FastAPI** - Backend intelligent
- ✅ **Frontend React** - Interface moderne
- ✅ **Elasticsearch** - Recherche avancée
- ✅ **ChromaDB** - Base vectorielle IA
- ✅ **Worker** - Collecteur automatique
- ✅ **Grafana** - Monitoring

### Accès aux services:
```
🌐 Interface Web:      http://localhost:3000
🔧 API Documentation:  http://localhost:8000/docs
📈 Monitoring:         http://localhost:3001 (admin/admin123)
```

---

## 🎯 Première Utilisation

### 1. Interface Web (localhost:3000)
- **Recherche d'infractions** par mots-clés
- **Analyse IA** de situations complexes
- **Génération de rapports** automatisés
- **Tableau de bord** en temps réel

### 2. API REST (localhost:8000/docs)
```bash
# Test rapide de l'API
curl "http://localhost:8000/health"
curl "http://localhost:8000/infractions/search?q=temps%20de%20conduite"
```

### 3. Assistant IA (si OpenAI configuré)
```bash
# Analyse de situation via API
curl -X POST "http://localhost:8000/analyse/situation" \
  -H "Content-Type: application/json" \
  -d '{"description_situation": "Conducteur 11h sans pause"}'
```

---

## 🛠️ Commandes Essentielles

### Gestion des services
```bash
# Status des services
docker-compose ps

# Logs en temps réel
docker-compose logs -f

# Redémarrage
docker-compose restart

# Arrêt complet
docker-compose down
```

### Scripts utiles
```bash
# Gestionnaire principal (interactif)
./manage.sh

# Vérification santé
./monitoring/health-check.sh

# Sauvegarde complète
./scripts/backup.sh

# Monitoring continu
./monitoring/health-check.sh monitor
```

---

## 🔍 Résolution de Problèmes

### Problèmes courants et solutions:

#### ❌ Port déjà utilisé
```bash
# Trouver le processus
lsof -i :3000  # ou 8000, 5432, etc.

# Libérer le port
kill -9 <PID>

# Ou modifier dans docker-compose.yml
```

#### ❌ Erreur de mémoire
```bash
# Augmenter la mémoire Docker (Docker Desktop)
# Settings > Resources > Memory > 8GB+

# Ou réduire les services
docker-compose up -d postgres redis api frontend
```

#### ❌ Base de données non initialisée
```bash
# Réinitialisation complète
docker-compose down -v
./deploy.sh
```

#### ❌ Clé OpenAI invalide
```bash
# L'IA sera désactivée, le reste fonctionne
# Editez .env avec une clé valide puis:
docker-compose restart api worker
```

### Commandes de diagnostic:
```bash
# Diagnostic complet
./monitoring/health-check.sh health

# Performance
./monitoring/health-check.sh performance

# Logs d'erreurs
docker-compose logs | grep ERROR

# Espace disque
df -h .
docker system df
```

---

## 📈 Monitoring et Métriques

### Grafana Dashboard (localhost:3001)
- **Connexion:** admin / admin123
- **Métriques temps réel:** CPU, RAM, API
- **Alertes automatiques** configurées

### Surveillance système:
```bash
# Monitoring continu (Ctrl+C pour arrêter)
./monitoring/health-check.sh monitor

# Stats ponctuelles
./monitoring/health-check.sh stats
```

---

## 💾 Sauvegarde et Restauration

### Sauvegarde automatique:
```bash
# Sauvegarde complète
./scripts/backup.sh

# Sauvegarde programmée (cron)
# Ajouter à crontab: 0 2 * * * /path/to/backup.sh auto
```

### Restauration:
```bash
# Lister les sauvegardes
./scripts/backup.sh list

# Restaurer PostgreSQL
./scripts/backup.sh restore-postgres backups/postgres/fichier.sql.gz

# Via interface
./manage.sh  # > Option 9 > Option 4
```

---

## 🔄 Mises à Jour

### Mise à jour du système:
```bash
# Récupération des changements
git pull origin main

# Reconstruction et redéploiement
./deploy.sh

# OU via le gestionnaire
./manage.sh  # > Option 1
```

### Mise à jour des données juridiques:
```bash
# Collecte manuelle
docker-compose exec worker python -m workers.data_collector

# La collecte automatique se fait toutes les heures
```

---

## 🎯 Cas d'Usage Typiques

### 1. Recherche d'infraction
1. Ouvrir http://localhost:3000
2. Saisir "temps de conduite dépassement"
3. Filtrer par gravité/catégorie
4. Consulter les détails et sanctions

### 2. Analyse de situation
1. Onglet "Analyse IA"
2. Décrire la situation problématique
3. Obtenir infractions + recommandations + procédures

### 3. Génération de rapport
1. API: `POST /rapports/generer`
2. Ou via interface dans l'onglet "Rapports"
3. Export PDF automatique

### 4. Surveillance flotte
1. Télécharger fichiers .ddd/.tgd
2. API: `POST /analyse/fichiers`
3. Détection automatique des infractions

---

## 📞 Support et Aide

### Documentation complète:
- 📚 **README.md** - Documentation technique
- 🔧 **API Docs** - http://localhost:8000/docs
- 📊 **Grafana** - Monitoring et métriques

### Commandes d'aide:
```bash
# Aide gestionnaire
./manage.sh help

# Informations d'accès
./manage.sh info

# Status détaillé
./monitoring/health-check.sh
```

### Logs utiles:
```bash
# Logs API
docker-compose logs api

# Logs collecteur
docker-compose logs worker

# Logs base de données
docker-compose logs postgres

# Tous les logs
docker-compose logs
```

---

## ✨ Fonctionnalités Avancées

### Assistant IA (avec OpenAI):
- **Analyse juridique** contextuelle
- **Conseil personnalisé** par situation
- **Recherche sémantique** intelligente
- **Base de connaissances** vectorielle

### Collecte automatique:
- **Légifrance** (API officielle)
- **EUR-Lex** (réglementation UE)
- **Jurisprudence** (Cour de cassation)
- **Sources professionnelles** (FNTR, OTRE)

### Monitoring professionnel:
- **Métriques temps réel** 
- **Alertes automatiques**
- **Tableaux de bord** personnalisés
- **Historique de performance**

---

## 🎉 Félicitations !

Votre système est maintenant opérationnel ! 

**Prochaines étapes:**
1. ✅ Configurer la clé OpenAI (si nécessaire)
2. ✅ Tester les fonctionnalités principales
3. ✅ Planifier les sauvegardes automatiques
4. ✅ Former les utilisateurs finaux

**Pour une utilisation en production:**
- Modifier les mots de passe par défaut
- Configurer HTTPS avec un reverse proxy
- Mettre en place la surveillance automatique
- Planifier les mises à jour régulières

---

> 💡 **Astuce:** Utilisez `./manage.sh` pour une interface complète ou consultez le README.md pour les détails techniques avancés.

*Développé avec ❤️ pour Sogestmatic* 