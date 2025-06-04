"""
API FastAPI pour servir les données juridiques Légifrance
Backend pour l'interface Sogestmatic
"""

from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Dict, Any, Optional
import asyncio
import uvicorn
from datetime import datetime
import json
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import logging

# Configuration du logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

from legifrance_client import LegifranceClient, get_infractions_legifrance
from legifrance_enhanced import recherche_exhaustive_legifrance, LegifranceAdvanced

import httpx
import requests

# Charger les variables d'environnement
load_dotenv()

# Cache global pour éviter les appels répétés à l'API
CACHE_INFRACTIONS = []
CACHE_LAST_UPDATE = None
CACHE_DURATION_HOURS = 6

# Configuration OpenAI simplifiée
client = None
openai_api_key = os.getenv("OPENAI_API_KEY")

if openai_api_key and openai_api_key.startswith("sk-"):
    try:
        # Import OpenAI seulement quand nécessaire pour éviter les conflits
        from openai import OpenAI
        client = OpenAI(api_key=openai_api_key)
        print("🤖 OpenAI configuré avec succès avec gpt-4o-mini")
    except ImportError:
        print("⚠️ Module OpenAI non installé")
        client = None
    except Exception as e:
        print(f"⚠️ Erreur configuration OpenAI: {e}")
        client = None
else:
    print("⚠️ Clé OpenAI manquante ou invalide")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gestionnaire de cycle de vie de l'application"""
    # Démarrage : charger les données Légifrance
    print("🚀 Démarrage de l'API Sogestmatic...")
    print("📡 Connexion à l'API Légifrance...")
    
    try:
        # Utiliser le nouveau client exhaustif
        infractions_data = await recherche_exhaustive_legifrance()
        global CACHE_INFRACTIONS, CACHE_LAST_UPDATE
        CACHE_INFRACTIONS = infractions_data
        CACHE_LAST_UPDATE = datetime.now()
        print(f"✅ Cache mis à jour avec {len(CACHE_INFRACTIONS)} infractions")
        print(f"✅ {len(CACHE_INFRACTIONS)} infractions chargées depuis Légifrance")
    except Exception as e:
        print(f"❌ Erreur lors du chargement: {e}")
        # Fallback vers l'ancien système
        CACHE_INFRACTIONS = await get_infractions_legifrance()
        CACHE_LAST_UPDATE = datetime.now()
        print(f"🔄 Fallback: {len(CACHE_INFRACTIONS)} infractions chargées")
    
    yield
    
    # Arrêt de l'application
    print("🛑 Arrêt de l'API Sogestmatic")

# Configuration FastAPI
app = FastAPI(
    title="Sogestmatic API",
    description="API pour la base de données juridique tachygraphique connectée à Légifrance",
    version="2.0.0",
    lifespan=lifespan
)

# Configuration CORS pour permettre l'accès depuis le frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifier les domaines autorisés
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def refresh_infractions_cache():
    """Actualiser le cache des infractions depuis Légifrance"""
    global CACHE_INFRACTIONS, CACHE_LAST_UPDATE
    
    try:
        print("📡 Connexion à l'API Légifrance...")
        infractions = await get_infractions_legifrance()
        CACHE_INFRACTIONS = infractions
        CACHE_LAST_UPDATE = datetime.now()
        print(f"✅ Cache mis à jour avec {len(infractions)} infractions")
    except Exception as e:
        print(f"❌ Erreur lors du chargement Légifrance: {e}")
        # En cas d'erreur, garder les données existantes ou utiliser des données de fallback
        if not CACHE_INFRACTIONS:
            CACHE_INFRACTIONS = await get_fallback_data()

async def get_fallback_data() -> List[Dict[str, Any]]:
    """Données de secours en cas d'erreur avec l'API Légifrance"""
    return [
        {
            "id": "FALLBACK_001",
            "titre": "Données temporairement indisponibles",
            "article": "API Légifrance",
            "description": "Les données juridiques sont temporairement indisponibles. Veuillez réessayer plus tard.",
            "sanction": "Contactez l'assistance technique",
            "amende_min": None,
            "amende_max": None,
            "points_permis": None,
            "gravite": "moyenne",
            "categorie": "general",
            "code_source": "Système",
            "url_legifrance": "",
            "date_maj": datetime.now().isoformat(),
            "tags": ["Maintenance", "Système"]
        }
    ]

def should_refresh_cache() -> bool:
    """Vérifier si le cache doit être actualisé"""
    if not CACHE_LAST_UPDATE:
        return True
    
    hours_since_update = (datetime.now() - CACHE_LAST_UPDATE).total_seconds() / 3600
    return hours_since_update >= CACHE_DURATION_HOURS

@app.get("/")
async def root():
    """Point d'entrée de l'API"""
    return {
        "message": "API Sogestmatic - Base de données juridique tachygraphique",
        "version": "2.0.0",
        "source": "Légifrance officiel",
        "last_update": CACHE_LAST_UPDATE.isoformat() if CACHE_LAST_UPDATE else None,
        "infractions_count": len(CACHE_INFRACTIONS)
    }

@app.get("/infractions")
async def get_infractions(
    search: Optional[str] = Query(None, description="Terme de recherche"),
    categorie: Optional[str] = Query(None, description="Catégorie d'infraction"),
    gravite: Optional[str] = Query(None, description="Niveau de gravité"),
    limit: int = Query(50, description="Nombre maximum de résultats"),
    offset: int = Query(0, description="Décalage pour la pagination")
):
    """
    Récupérer les infractions avec filtres optionnels
    """
    # Actualiser le cache si nécessaire
    if should_refresh_cache():
        asyncio.create_task(refresh_infractions_cache())
    
    infractions = CACHE_INFRACTIONS.copy()
    
    # Appliquer les filtres
    if search:
        search_lower = search.lower()
        infractions = [
            inf for inf in infractions 
            if (search_lower in inf.get('titre', '').lower() or
                search_lower in inf.get('description', '').lower() or
                any(search_lower in tag.lower() for tag in inf.get('tags', [])))
        ]
    
    if categorie:
        infractions = [inf for inf in infractions if inf.get('categorie') == categorie]
    
    if gravite:
        infractions = [inf for inf in infractions if inf.get('gravite') == gravite]
    
    # Pagination
    total = len(infractions)
    infractions_page = infractions[offset:offset + limit]
    
    return {
        "infractions": infractions_page,
        "total": total,
        "limit": limit,
        "offset": offset,
        "has_more": offset + limit < total
    }

@app.get("/infractions/{infraction_id}")
async def get_infraction_detail(infraction_id: str):
    """Récupérer les détails d'une infraction spécifique"""
    infraction = next((inf for inf in CACHE_INFRACTIONS if inf['id'] == infraction_id), None)
    
    if not infraction:
        raise HTTPException(status_code=404, detail="Infraction non trouvée")
    
    return infraction

@app.get("/categories")
async def get_categories():
    """Récupérer la liste des catégories disponibles"""
    categories = {}
    
    for infraction in CACHE_INFRACTIONS:
        cat = infraction.get('categorie', 'general')
        if cat not in categories:
            categories[cat] = 0
        categories[cat] += 1
    
    return {
        "categories": [
            {"id": cat, "label": cat.replace('_', ' ').title(), "count": count}
            for cat, count in categories.items()
        ]
    }

@app.get("/gravites")
async def get_gravites():
    """Récupérer la liste des niveaux de gravité"""
    gravites = {}
    
    for infraction in CACHE_INFRACTIONS:
        grav = infraction.get('gravite', 'moyenne')
        if grav not in gravites:
            gravites[grav] = 0
        gravites[grav] += 1
    
    labels = {
        'legere': 'Légère',
        'moyenne': 'Moyenne',
        'grave': 'Grave',
        'tres_grave': 'Très Grave'
    }
    
    return {
        "gravites": [
            {"id": grav, "label": labels.get(grav, grav), "count": count}
            for grav, count in gravites.items()
        ]
    }

@app.get("/stats")
async def get_statistics():
    """Récupérer les statistiques générales"""
    total_infractions = len(CACHE_INFRACTIONS)
    
    # Compter par gravité
    gravites = {}
    for inf in CACHE_INFRACTIONS:
        grav = inf.get('gravite', 'moyenne')
        gravites[grav] = gravites.get(grav, 0) + 1
    
    # Compter par catégorie
    categories = {}
    for inf in CACHE_INFRACTIONS:
        cat = inf.get('categorie', 'general')
        categories[cat] = categories.get(cat, 0) + 1
    
    # Compter par source
    sources = {}
    for inf in CACHE_INFRACTIONS:
        source = inf.get('code_source', 'Inconnu')
        sources[source] = sources.get(source, 0) + 1
    
    return {
        "total_infractions": total_infractions,
        "by_gravite": gravites,
        "by_categorie": categories,
        "by_source": sources,
        "last_update": CACHE_LAST_UPDATE.isoformat() if CACHE_LAST_UPDATE else None
    }

@app.post("/analyze")
async def analyze_situation(data: Dict[str, Any]):
    """
    Analyser une situation avec IA
    """
    situation = data.get('situation', '')
    
    if not situation:
        raise HTTPException(status_code=400, detail="Situation requise")
    
    # Simulation d'analyse IA (en production, intégrer OpenAI)
    await asyncio.sleep(1)  # Simuler traitement
    
    # Détection basique de mots-clés
    situation_lower = situation.lower()
    infractions_detectees = []
    
    for infraction in CACHE_INFRACTIONS:
        titre_lower = infraction.get('titre', '').lower()
        tags_lower = [tag.lower() for tag in infraction.get('tags', [])]
        
        # Logique de détection simple
        if any(mot in situation_lower for mot in ['temps', 'conduite', '11h', '10h', 'heures']):
            if 'temps' in titre_lower and 'conduite' in titre_lower:
                infractions_detectees.append(infraction)
        
        if any(mot in situation_lower for mot in ['pause', 'repos', 'arrêt']):
            if any(tag in ['repos', 'pause'] for tag in tags_lower):
                infractions_detectees.append(infraction)
        
        if any(mot in situation_lower for mot in ['carte', 'tachygraphe', 'appareil']):
            if 'tachygraphe' in tags_lower or 'equipement' in tags_lower:
                infractions_detectees.append(infraction)
    
    # Supprimer les doublons
    infractions_uniques = []
    ids_vus = set()
    for inf in infractions_detectees:
        if inf['id'] not in ids_vus:
            infractions_uniques.append(inf)
            ids_vus.add(inf['id'])
    
    # Calculer les sanctions totales
    amende_totale = 0
    points_totaux = 0
    
    for inf in infractions_uniques:
        if inf.get('amende_max'):
            amende_totale += inf['amende_max']
        if inf.get('points_permis'):
            points_totaux += inf['points_permis']
    
    return {
        "situation_analysee": situation,
        "infractions_detectees": infractions_uniques,
        "nombre_infractions": len(infractions_uniques),
        "estimation_amende": amende_totale,
        "estimation_points": points_totaux,
        "recommandations": [
            "Vérifier les données du tachygraphe",
            "Consulter un avocat spécialisé",
            "Former le conducteur",
            "Mettre en place des procédures de contrôle"
        ]
    }

@app.post("/refresh")
async def refresh_data(background_tasks: BackgroundTasks):
    """Forcer la mise à jour des données Légifrance"""
    background_tasks.add_task(refresh_infractions_cache)
    return {
        "message": "Mise à jour des données lancée en arrière-plan",
        "current_count": len(CACHE_INFRACTIONS)
    }

@app.get("/health")
async def health_check():
    """Vérification de santé de l'API"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "infractions_loaded": len(CACHE_INFRACTIONS) > 0,
        "cache_age_hours": (datetime.now() - CACHE_LAST_UPDATE).total_seconds() / 3600 if CACHE_LAST_UPDATE else None
    }

@app.get("/search/exhaustive")
async def recherche_exhaustive_manuelle():
    """
    Déclencher une recherche exhaustive manuelle dans Légifrance
    """
    try:
        global CACHE_INFRACTIONS, CACHE_LAST_UPDATE
        
        print("🔍 Déclenchement recherche exhaustive manuelle...")
        
        # Recherche exhaustive
        infractions_data = await recherche_exhaustive_legifrance()
        
        # Mise à jour du cache
        CACHE_INFRACTIONS = infractions_data
        CACHE_LAST_UPDATE = datetime.now()
        
        # Statistiques par catégorie
        stats_categories = {}
        for infraction in infractions_data:
            cat = infraction.get('categorie', 'non_classée')
            stats_categories[cat] = stats_categories.get(cat, 0) + 1
        
        return {
            "status": "success",
            "message": "Recherche exhaustive terminée",
            "total_infractions": len(infractions_data),
            "timestamp": CACHE_LAST_UPDATE.isoformat(),
            "categories": stats_categories,
            "nouvelles_infractions": len([i for i in infractions_data if i.get('date_maj') == datetime.now().strftime("%Y-%m-%d")])
        }
        
    except Exception as e:
        logger.error(f"Erreur recherche exhaustive: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la recherche: {str(e)}")

@app.get("/analytics/database")
async def analytics_database():
    """
    Analyse détaillée de la base de données d'infractions
    """
    if not CACHE_INFRACTIONS:
        raise HTTPException(status_code=404, detail="Aucune donnée disponible")
    
    # Analyses avancées
    total = len(CACHE_INFRACTIONS)
    
    # Répartition par gravité
    gravites = {}
    for infraction in CACHE_INFRACTIONS:
        grav = infraction.get('gravite', 'non_définie')
        gravites[grav] = gravites.get(grav, 0) + 1
    
    # Répartition par catégorie
    categories = {}
    for infraction in CACHE_INFRACTIONS:
        cat = infraction.get('categorie', 'non_classée')
        categories[cat] = categories.get(cat, 0) + 1
    
    # Répartition par code source
    codes_sources = {}
    for infraction in CACHE_INFRACTIONS:
        code = infraction.get('code_source', 'non_spécifié')
        codes_sources[code] = codes_sources.get(code, 0) + 1
    
    # Sanctions les plus fréquentes
    amendes = [i.get('amende_max', 0) for i in CACHE_INFRACTIONS if i.get('amende_max')]
    points = [i.get('points_permis', 0) for i in CACHE_INFRACTIONS if i.get('points_permis')]
    
    # Tags les plus populaires
    all_tags = []
    for infraction in CACHE_INFRACTIONS:
        if infraction.get('tags'):
            all_tags.extend(infraction['tags'])
    
    tags_count = {}
    for tag in all_tags:
        tags_count[tag] = tags_count.get(tag, 0) + 1
    
    top_tags = sorted(tags_count.items(), key=lambda x: x[1], reverse=True)[:10]
    
    return {
        "total_infractions": total,
        "derniere_maj": CACHE_LAST_UPDATE.isoformat() if CACHE_LAST_UPDATE else None,
        "repartition_gravite": gravites,
        "repartition_categories": categories,
        "repartition_codes_sources": codes_sources,
        "statistiques_amendes": {
            "count": len(amendes),
            "moyenne": sum(amendes) / len(amendes) if amendes else 0,
            "max": max(amendes) if amendes else 0,
            "min": min(amendes) if amendes else 0
        },
        "statistiques_points": {
            "count": len(points),
            "moyenne": sum(points) / len(points) if points else 0,
            "max": max(points) if points else 0
        },
        "top_tags": dict(top_tags),
        "infractions_avec_immobilisation": len([i for i in CACHE_INFRACTIONS if i.get('immobilisation')]),
        "infractions_avec_suspension": len([i for i in CACHE_INFRACTIONS if i.get('suspension_permis')]),
        "couverture_secteurs": {
            "tachygraphe": len([i for i in CACHE_INFRACTIONS if any('tachygraphe' in tag.lower() for tag in i.get('tags', []))]),
            "vitesse": len([i for i in CACHE_INFRACTIONS if any('vitesse' in tag.lower() for tag in i.get('tags', []))]),
            "surcharge": len([i for i in CACHE_INFRACTIONS if any('surcharge' in tag.lower() for tag in i.get('tags', []))]),
            "formation": len([i for i in CACHE_INFRACTIONS if any('formation' in tag.lower() for tag in i.get('tags', []))]),
            "documents": len([i for i in CACHE_INFRACTIONS if any('document' in tag.lower() for tag in i.get('tags', []))])
        }
    }

def analyser_contexte_exceptions(question: str) -> Dict[str, Any]:
    """
    Analyse une question pour identifier les éléments qui nécessitent 
    des précisions sur les exceptions et cas particuliers (Article 13 notamment)
    """
    question_lower = question.lower()
    
    contexte = {
        "types_vehicules": [],
        "usages": [],
        "secteurs_activite": [],
        "zones": [],
        "dates_mentions": [],
        "circonstances": [],
        "besoin_precisions": [],
        "exceptions_probables": [],
        "derogations_article13": []
    }
    
    # Détection de types de véhicules
    if any(mot in question_lower for mot in ["poids lourd", "pl", "camion", "ptac"]):
        contexte["types_vehicules"].append("poids_lourd")
        contexte["besoin_precisions"].append("PTAC exact du véhicule ?")
        contexte["exceptions_probables"].append("Règles différentes selon PTAC (3.5T, 7.5T, 19T, 44T)")
    
    if any(mot in question_lower for mot in ["vul", "fourgon", "utilitaire"]):
        contexte["types_vehicules"].append("vul")
        contexte["besoin_precisions"].append("PTAC inférieur ou supérieur à 3.5T ?")
        if "7,5" in question_lower or "7.5" in question_lower:
            contexte["derogations_article13"].append("Article 13d,f - Véhicules ≤7,5T postal/écologique")
    
    if any(mot in question_lower for mot in ["remorque", "semi", "tracteur"]):
        contexte["types_vehicules"].append("ensemble_routier")
        contexte["exceptions_probables"].append("Règles spécifiques aux ensembles routiers")
    
    if any(mot in question_lower for mot in ["bus", "autocar", "transport en commun", "passagers"]):
        contexte["types_vehicules"].append("transport_voyageurs")
        if any(mot in question_lower for mot in ["10", "17", "places", "sièges", "non commercial"]):
            contexte["derogations_article13"].append("Article 13i - Minibus 10-17 places non commercial")
    
    # Détection d'usage et secteurs d'activité
    if any(mot in question_lower for mot in ["professionnel", "entreprise", "transporteur", "commercial"]):
        contexte["usages"].append("professionnel")
        contexte["exceptions_probables"].append("Règles professionnelles plus strictes")
    
    if any(mot in question_lower for mot in ["particulier", "personnel", "privé", "non commercial"]):
        contexte["usages"].append("particulier")
        contexte["exceptions_probables"].append("Certaines règles ne s'appliquent qu'aux professionnels")
        contexte["derogations_article13"].append("Article 13i - Transport non commercial possible")
    
    # Détection secteurs spécifiques Article 13
    if any(mot in question_lower for mot in ["agricole", "agriculture", "fermier", "exploitation", "tracteur agricole"]):
        contexte["secteurs_activite"].append("agriculture")
        contexte["derogations_article13"].append("Article 13b,c - Dérogations secteur agricole (100km)")
        contexte["besoin_precisions"].append("Distance habituelle par rapport au siège d'exploitation ?")
    
    if any(mot in question_lower for mot in ["forestier", "sylviculture", "bois", "forêt"]):
        contexte["secteurs_activite"].append("forestier")
        contexte["derogations_article13"].append("Article 13b,c - Dérogations secteur forestier (100km)")
    
    if any(mot in question_lower for mot in ["postal", "poste", "colis", "courrier", "livraison"]):
        contexte["secteurs_activite"].append("postal")
        contexte["derogations_article13"].append("Article 13d - Service postal universel ≤7,5T (100km)")
        contexte["besoin_precisions"].append("Prestataire du service universel postal ?")
    
    if any(mot in question_lower for mot in ["construction", "btp", "chantier", "engins", "béton"]):
        contexte["secteurs_activite"].append("construction")
        if "béton" in question_lower and "prêt" in question_lower:
            contexte["derogations_article13"].append("Article 13r - Livraison béton prêt à l'emploi")
        else:
            contexte["derogations_article13"].append("Article 13q - Transport engins construction (100km)")
            contexte["besoin_precisions"].append("La conduite constitue-t-elle l'activité principale ?")
    
    if any(mot in question_lower for mot in ["élevage", "bétail", "animaux vivants", "ferme", "lait"]):
        contexte["secteurs_activite"].append("elevage")
        if "lait" in question_lower:
            contexte["derogations_article13"].append("Article 13l - Collecte de lait")
        else:
            contexte["derogations_article13"].append("Article 13b,p - Transport animaux/élevage")
    
    if any(mot in question_lower for mot in ["public", "collectivité", "mairie", "département", "région"]):
        contexte["secteurs_activite"].append("public")
        contexte["derogations_article13"].append("Article 13a - Véhicules des pouvoirs publics")
        contexte["besoin_precisions"].append("Concurrent aux entreprises privées ?")
    
    if any(mot in question_lower for mot in ["auto-école", "cours conduite", "examen permis", "formation"]):
        contexte["secteurs_activite"].append("formation")
        contexte["derogations_article13"].append("Article 13g - Véhicules d'auto-école")
    
    if any(mot in question_lower for mot in ["cirque", "fête foraine", "spectacle", "itinérant"]):
        contexte["secteurs_activite"].append("spectacle")
        contexte["derogations_article13"].append("Article 13j - Véhicules cirque/fêtes foraines")
    
    if any(mot in question_lower for mot in ["transport de fonds", "argent", "valeurs", "convoyage"]):
        contexte["secteurs_activite"].append("transport_fonds")
        contexte["derogations_article13"].append("Article 13m - Transport de fonds")
    
    # Détection de zones géographiques spéciales
    if any(mot in question_lower for mot in ["île", "corse", "outre-mer", "isolée"]):
        contexte["zones"].append("ile_region_isolee")
        contexte["derogations_article13"].append("Article 13e - Îles et régions isolées (≤2300km²)")
        contexte["besoin_precisions"].append("Superficie et isolation de la zone ?")
    
    if any(mot in question_lower for mot in ["port", "terminal", "quai", "plateforme"]):
        contexte["zones"].append("plateforme_portuaire")
        contexte["derogations_article13"].append("Article 13o - Plates-formes portuaires")
    
    # Détection carburants écologiques
    if any(mot in question_lower for mot in ["électrique", "gaz naturel", "gnv", "biométhane"]):
        contexte["zones"].append("vehicule_propre")
        contexte["derogations_article13"].append("Article 13f - Véhicules écologiques ≤7,5T (100km)")
    
    # Détection de mentions de distance/rayon
    if any(mot in question_lower for mot in ["100 km", "cent kilomètres", "rayon", "local"]):
        contexte["besoin_precisions"].append("Distance exacte par rapport au siège ?")
        contexte["exceptions_probables"].append("Dérogations dans un rayon de 100km")
    
    # Détection de services publics
    if any(mot in question_lower for mot in ["eaux usées", "déchets", "voirie", "électricité", "gaz", "télécom"]):
        contexte["secteurs_activite"].append("service_public")
        contexte["derogations_article13"].append("Article 13h - Services publics")
    
    # Détection de déchets animaux
    if any(mot in question_lower for mot in ["déchets animaux", "carcasse", "équarrissage"]):
        contexte["secteurs_activite"].append("dechets_animaux")
        contexte["derogations_article13"].append("Article 13n - Déchets animaux")
    
    # Détection enseignement mobile
    if any(mot in question_lower for mot in ["enseignement", "mobile", "éducation", "formation itinérante"]):
        contexte["secteurs_activite"].append("enseignement_mobile")
        contexte["derogations_article13"].append("Article 13k - Projets mobiles d'enseignement")
    
    # Suggestions générales si contexte insuffisant
    if not contexte["types_vehicules"] and not contexte["usages"]:
        contexte["besoin_precisions"].extend([
            "Type de véhicule et PTAC ?",
            "Usage professionnel ou particulier ?"
        ])
    
    # Si des dérogations Article 13 sont détectées
    if contexte["derogations_article13"]:
        contexte["besoin_precisions"].append("Secteur d'activité et conditions spécifiques ?")
        contexte["exceptions_probables"].append("Dérogations Article 13 UE 561/2006 possibles")
    
    return contexte

def generer_questions_clarifiantes(analyse_contexte: Dict[str, Any], question_originale: str) -> List[str]:
    """
    Génère des questions clarifiantes basées sur l'analyse du contexte
    """
    questions = []
    
    # Questions sur les dérogations Article 13 détectées
    if analyse_contexte.get("derogations_article13"):
        questions.append("🔍 **Vérification des exceptions possibles :**")
        for derogation in analyse_contexte["derogations_article13"][:3]:  # Limiter à 3
            questions.append(f"• {derogation}")
    
    # Questions spécifiques selon le contexte
    if analyse_contexte.get("besoin_precisions"):
        questions.append("❓ **Précisions nécessaires :**")
        for precision in analyse_contexte["besoin_precisions"][:4]:  # Limiter à 4
            questions.append(f"• {precision}")
    
    return questions

@app.post("/chat")
async def chat_juridique(data: Dict[str, Any]):
    """
    Chat IA juridique avec ChatGPT utilisant la base Légifrance et recherches web
    """
    try:
        question = data.get('question', '').strip()
        historique = data.get('historique', [])
        
        if not question:
            raise HTTPException(status_code=400, detail="Question requise")
        
        print(f"📝 Question reçue: {question}")
        print(f"📊 Nombre d'infractions en cache: {len(CACHE_INFRACTIONS)}")
        
        # Analyser le contexte pour détecter les besoins d'exceptions
        analyse_contexte = analyser_contexte_exceptions(question)
        print(f"🔍 Analyse contextuelle: {len(analyse_contexte['exceptions_probables'])} exceptions potentielles détectées")
        print(f"🚨 Dérogations Article 13 : {len(analyse_contexte.get('derogations_article13', []))}")
        if analyse_contexte.get('derogations_article13'):
            print("   Dérogations détectées :")
            for derog in analyse_contexte['derogations_article13']:
                print(f"     • {derog}")
        print(f"📋 Précisions nécessaires : {len(analyse_contexte.get('besoin_precisions', []))}")
        
        # Vérifier la configuration OpenAI
        openai_client = None
        openai_error_message = None
        
        try:
            from openai import OpenAI
            openai_api_key = os.getenv("OPENAI_API_KEY")
            if openai_api_key and openai_api_key.startswith("sk-") and openai_api_key != "sk-votre-clé-openai-ici":
                openai_client = OpenAI(api_key=openai_api_key)
                print("🤖 Client OpenAI créé avec succès")
            else:
                openai_error_message = "Clé OpenAI manquante ou invalide"
                print(f"⚠️ {openai_error_message}")
        except Exception as init_error:
            openai_error_message = str(init_error)
            print(f"⚠️ Erreur initialisation OpenAI: {init_error}")
            openai_client = None
        
        # Analyser la question et chercher des infractions pertinentes
        question_lower = question.lower()
        mots_cles = question_lower.split()
        
        # Recherche d'infractions pertinentes dans notre base
        infractions_pertinentes = []
        scores = []
        
        for infraction in CACHE_INFRACTIONS:
            score = 0
            # Scoring basé sur titre, description et tags
            titre = infraction.get('titre', '').lower()
            description = infraction.get('description', '').lower()
            tags = [tag.lower() for tag in infraction.get('tags', [])]
            
            for mot in mots_cles:
                if mot in titre:
                    score += 3
                if mot in description:
                    score += 2
                if any(mot in tag for tag in tags):
                    score += 1
            
            if score > 0:
                infractions_pertinentes.append(infraction)
                scores.append(score)
        
        # Trier par pertinence et prendre les top 3
        if infractions_pertinentes:
            infractions_triees = sorted(zip(infractions_pertinentes, scores), 
                                      key=lambda x: x[1], reverse=True)
            infractions_pertinentes = [inf[0] for inf in infractions_triees[:3]]
        
        # Préparer le contexte avec les infractions trouvées
        contexte_juridique = ""
        citations = []
        
        if infractions_pertinentes:
            contexte_juridique = "Voici les infractions pertinentes trouvées dans la base Légifrance :\n\n"
            for i, infraction in enumerate(infractions_pertinentes, 1):
                titre = infraction.get('titre', 'Sans titre')
                article = infraction.get('article', 'Article non spécifié')
                description = infraction.get('description', 'Pas de description')
                sanction = infraction.get('sanction', 'Sanction non spécifiée')
                amende_max = infraction.get('amende_max', 0)
                points = infraction.get('points_permis', 0)
                
                contexte_juridique += f"{i}. {titre}\n"
                contexte_juridique += f"   Article: {article}\n"
                contexte_juridique += f"   Description: {description}\n"
                contexte_juridique += f"   Sanction: {sanction}\n"
                if amende_max:
                    contexte_juridique += f"   Amende max: {amende_max}€\n"
                if points:
                    contexte_juridique += f"   Points de permis: {points}\n"
                contexte_juridique += "\n"
                
                citations.append({
                    "article": article,
                    "texte": description,
                    "titre": titre,
                    "sanction": sanction
                })

        # Si OpenAI est disponible, l'utiliser
        if openai_client:
            try:
                # Construire le prompt pour ChatGPT avec amélioration des performances
                messages = [
                    {
                        "role": "system",
                        "content": """Vous êtes Maître SOGEST-IA, conseil juridique senior spécialisé en droit du transport routier français et européen, avec 15 ans d'expérience en cabinet.

🎩 VOTRE PERSONNALITÉ PROFESSIONNELLE :
- **Ton respectueux** : Vouvoiement systématique, formules de politesse juridiques
- **Expertise reconnue** : Citations précises, références jurisprudentielles
- **Pédagogie claire** : Explications accessibles sans jargon excessif
- **Prudence déontologique** : Nuances, conditions d'application, réserves appropriées
- **Conseil pratique** : Recommandations opérationnelles et préventives

🔍 SYSTÈME DE DÉTECTION D'EXCEPTIONS :
- **Article 13 UE 561/2006** : Dérogations aux règles temps de conduite/repos
- **Secteurs spécialisés** : Agriculture, postal, construction, services publics
- **Conditions spécifiques** : PTAC, rayons 100km, activité principale/secondaire
- **Questions clarifiantes** : Poser des questions précises quand des exceptions sont possibles

🚨 RÈGLE OBLIGATOIRE : 
SI DES DÉROGATIONS ARTICLE 13 SONT POSSIBLES (mentionnées dans le message utilisateur), 
VOUS DEVEZ IMPÉRATIVEMENT POSER DES QUESTIONS CLARIFIANTES AVANT DE DONNER UNE RÉPONSE DÉFINITIVE.

📋 STRUCTURE DE CONSEIL JURIDIQUE OBLIGATOIRE :

**PRÉAMBULE** (1-2 phrases)
"Suite à votre consultation concernant [situation], je vous apporte les éléments juridiques suivants :"

**1. ANALYSE JURIDIQUE** 
Exposition du cadre légal applicable avec articles précis et conditions d'application.

**2. DÉTECTION D'EXCEPTIONS** (OBLIGATOIRE SI DÉROGATIONS POSSIBLES)
🚨 INSTRUCTION ABSOLUE : Si le message utilisateur mentionne des "DÉROGATIONS ARTICLE 13 UE 561/2006 POSSIBLES", 
vous DEVEZ OBLIGATOIREMENT :
- Identifier les exceptions applicables 
- Poser 2-4 questions clarifiantes précises
- Suspendre votre réponse définitive en attendant les précisions

FORMULE OBLIGATOIRE : "Cependant, votre situation pourrait bénéficier d'exemptions selon l'Article 13 du règlement UE 561/2006. Afin d'affiner mon conseil juridique, pourriez-vous préciser :"
Puis listez 2-4 questions spécifiques.

**3. RÉPONSE DIRECTE**
Réponse claire et directe à la question posée, avec nuances si nécessaire.
SI DES QUESTIONS ONT ÉTÉ POSÉES À L'ÉTAPE 2, cette réponse doit être PROVISOIRE et conditionnée aux réponses.

**4. FONDEMENTS LÉGAUX**
Citations d'articles avec références complètes (Code des transports, règlements UE, etc.).

**5. MISE EN GARDE / RÉSERVES**
Précisions sur les conditions, exceptions, évolutions réglementaires potentielles.

**6. RECOMMANDATIONS PRATIQUES**
Actions concrètes à mettre en œuvre, contacts utiles, démarches préventives.

**FORMULE DE CLÔTURE**
"Je reste à votre disposition pour tout complément d'information sur cette question."

🎯 STYLE RÉDACTIONNEL :
- **Vouvoiement exclusif** : "vous devez", "votre situation", "je vous conseille"
- **Formules juridiques** : "en l'état actuel de la réglementation", "sous réserve de", "il convient de préciser"
- **Questions clarifiantes** : "Pourriez-vous préciser...", "Afin d'affiner mon conseil..."
- **Prudence déontologique** : "dans l'hypothèse où", "selon les circonstances"

🚨 RÈGLES DÉONTOLOGIQUES ABSOLUES :
1. **DÉTECTION OBLIGATOIRE** : Si "DÉROGATIONS ARTICLE 13" apparaît dans le message utilisateur, posez des questions
2. **QUESTIONS PRÉCISES** : Secteur exact, PTAC, distance, usage commercial/non commercial
3. **RÉPONSE CONDITIONNELLE** : Si questions posées, donnez une réponse provisoire en attendant les précisions
4. **CONDITIONS STRICTES** : Mentionnez que les exemptions ont des conditions strictes d'application

🔍 DÉROGATIONS ARTICLE 13 À SURVEILLER :
a) Véhicules pouvoirs publics
b) Agriculture/élevage/pêche (100km)
c) Tracteurs agricoles/forestiers (100km)
d) Service postal ≤7,5T (100km)
e) Îles/régions isolées (≤2300km²)
f) Véhicules écologiques ≤7,5T (100km)
g) Auto-écoles
h) Services publics (déchets, voirie, etc.)
i) Minibus 10-17 places non commercial
j) Cirque/fêtes foraines
k) Enseignement mobile
l) Collecte lait
m) Transport de fonds
n) Déchets animaux
o) Plates-formes portuaires
p) Transport animaux vivants local (100km)
q) Engins construction (100km)
r) Béton prêt à l'emploi

EXEMPLE ABSOLU À SUIVRE quand des dérogations sont possibles :

"Suite à votre consultation concernant [situation], je vous apporte les éléments juridiques suivants :

**Analyse juridique :** [Cadre légal général]

**Détection d'exceptions :** Cependant, votre situation pourrait bénéficier d'exemptions selon l'Article 13 du règlement UE 561/2006. Afin d'affiner mon conseil juridique, pourriez-vous préciser :
• [Question 1 spécifique]
• [Question 2 spécifique]  
• [Question 3 spécifique]
• [Question 4 spécifique]

**Réponse provisoire :** Sous réserve de ces précisions, [réponse conditionnelle].

[...suite normale]

Je reste à votre disposition pour tout complément d'information sur cette question."

⚠️ INSTRUCTIONS SPÉCIALES ABSOLUES :
- Si le message contient "🚨 DÉROGATIONS ARTICLE 13 UE 561/2006 POSSIBLES", posez OBLIGATOIREMENT des questions
- Si le message contient "INSTRUCTION SPÉCIALE : Des exemptions pourraient s'appliquer", posez OBLIGATOIREMENT des questions
- Utilisez EXACTEMENT la formule "Cependant, votre situation pourrait bénéficier d'exemptions selon l'Article 13"
- Les questions doivent être spécifiques au contexte détecté"""
                    }
                ]
                
                # Ajouter l'historique avec limite intelligente
                if historique:
                    # Garder seulement les messages pertinents et récents
                    historique_filtre = []
                    for msg in historique[-8:]:  # 8 derniers messages max
                        if len(msg.get("content", "")) < 2000:  # Éviter les messages trop longs
                            historique_filtre.append({
                                "role": msg.get("role", "user"),
                                "content": msg.get("content", "")
                            })
                    messages.extend(historique_filtre)
                
                # Construire le message utilisateur enrichi
                user_message = f"**QUESTION JURIDIQUE :** {question}\n\n"
                
                # Contexte Légifrance enrichi
                if contexte_juridique:
                    user_message += f"**📚 BASE LÉGIFRANCE SOGESTMATIC :**\n{contexte_juridique}\n"
                else:
                    user_message += "**ℹ️ BASE LÉGIFRANCE :** Aucune infraction spécifique trouvée pour ces mots-clés. Utilise ton expertise générale.\n\n"
                
                # 🔍 NOUVEAU : Dérogations Article 13 détectées
                if analyse_contexte.get("derogations_article13"):
                    user_message += "**🚨 DÉROGATIONS ARTICLE 13 UE 561/2006 POSSIBLES :**\n"
                    for derogation in analyse_contexte["derogations_article13"]:
                        user_message += f"• {derogation}\n"
                    user_message += "\n⚠️ **INSTRUCTION SPÉCIALE :** Des exemptions pourraient s'appliquer ! Tu DOIS poser des questions clarifiantes pour préciser les conditions d'application.\n\n"
                
                # Analyse contextuelle intelligente
                if analyse_contexte["exceptions_probables"]:
                    user_message += "**⚠️ EXCEPTIONS PROBABLES DÉTECTÉES :**\n"
                    for exception in analyse_contexte["exceptions_probables"]:
                        user_message += f"• {exception}\n"
                    user_message += "\n"
                
                # Questions clarifiantes suggérées
                if analyse_contexte["besoin_precisions"]:
                    user_message += "**❓ QUESTIONS CLARIFIANTES SUGGÉRÉES :**\n"
                    user_message += "Pour donner un conseil juridique précis, tu DOIS demander :\n"
                    for precision in analyse_contexte["besoin_precisions"][:5]:  # Limiter à 5
                        user_message += f"• {precision}\n"
                    user_message += "\n"
                
                # Secteurs d'activité détectés
                if analyse_contexte.get("secteurs_activite"):
                    user_message += "**🏭 SECTEURS D'ACTIVITÉ DÉTECTÉS :**\n"
                    for secteur in analyse_contexte["secteurs_activite"]:
                        user_message += f"• {secteur}\n"
                    user_message += "\n"
                
                # Instructions de contexte spécialisées
                if any(mot in question.lower() for mot in ["poids lourd", "pl", "camion", "ptac"]):
                    user_message += "**🚛 CONTEXTE POIDS LOURD :** Attention aux variations selon PTAC, usage, zones, ancienneté du véhicule.\n"
                
                if any(mot in question.lower() for mot in ["tachygraphe", "temps", "conduite", "repos"]):
                    user_message += "**⏱️ CONTEXTE TACHYGRAPHE :** Vérifier règles UE vs nationales, type de transport, exemptions Article 13 possibles.\n"
                
                if any(mot in question.lower() for mot in ["formation", "fimo", "fco", "permis"]):
                    user_message += "**🎓 CONTEXTE FORMATION :** Distinguer obligations selon activité, ancienneté, type de transport.\n"
                
                if any(mot in question.lower() for mot in ["vitesse", "limitation", "excès"]):
                    user_message += "**🚦 CONTEXTE VITESSE :** Prendre en compte type véhicule, zone, conditions météo, tolérances.\n"
                
                user_message += """
**📋 RÉPONSE ATTENDUE :**
- EXPLICATIVE : Phrases complètes avec contexte juridique
- CITATIONS PRÉCISES : Articles de loi exacts avec références
- QUESTIONS CLARIFIANTES : Si dérogations Article 13 possibles, tu DOIS poser 2-3 questions précises
- PÉDAGOGIQUE : Expliquer pourquoi ces règles existent  
- STRUCTURÉE : 6 sections avec explications détaillées (dont section dérogations)
- ACCESSIBLE : Langage simple mais complet

🚨 IMPORTANT DÉROGATIONS : 
Si des exemptions Article 13 sont possibles, tu dois OBLIGATOIREMENT poser des questions clarifiantes avant de donner ta réponse finale. Exemple : "Afin d'affiner mon conseil, pourriez-vous préciser votre secteur d'activité et le PTAC de votre véhicule ?"

IMPORTANT : Expliquez le contexte, citez les articles précis, posez des questions si nécessaire, et donnez des phrases complètes qui font comprendre la logique juridique."""
                
                messages.append({
                    "role": "user", 
                    "content": user_message
                })
                
                print(f"🤖 Envoi de la requête à OpenAI (GPT-4o mini optimisé)...")
                
                # Appel à ChatGPT avec paramètres optimisés pour la concision
                response = openai_client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages,
                    max_tokens=1200,    # Augmenté pour permettre des explications détaillées
                    temperature=0.1,   # Très peu de créativité, précision maximale
                    top_p=0.9,        # Retour à une valeur plus standard pour plus de variété
                    presence_penalty=0.1,  # Réduit pour permettre plus de détails
                    frequency_penalty=0.2  # Réduit pour permettre les répétitions nécessaires dans les explications
                )
                
                reponse_brute = response.choices[0].message.content
                
                # Transformer les articles en liens cliquables
                reponse_avec_liens = generer_liens_articles(reponse_brute, infractions_pertinentes)
                
                logger.info(f"✅ Réponse générée avec liens: {len(infractions_pertinentes)} infractions trouvées")
                
                return {
                    "reponse": reponse_avec_liens,
                    "citations": citations,
                    "source": "ChatGPT GPT-4o mini + Base Légifrance",
                    "infractions_trouvees": len(infractions_pertinentes),
                    "debug_info": {
                        "openai_disponible": True,
                        "infractions_dans_cache": len(CACHE_INFRACTIONS),
                        "infractions_pertinentes": len(infractions_pertinentes),
                        "mode": "chatgpt_avec_legifrance",
                        "modele": "gpt-4o-mini"
                    }
                }
                
            except Exception as openai_error:
                print(f"❌ Erreur OpenAI: {openai_error}")
                openai_error_message = str(openai_error)
                # Continuer vers le fallback local
        
        # Mode fallback local si OpenAI n'est pas disponible
        print("🔄 Utilisation du mode fallback (local uniquement)...")
        
        # Générer une réponse basée uniquement sur la base Légifrance
        if infractions_pertinentes:
            fallback_response = f"**💡 {len(infractions_pertinentes)} infraction(s) trouvée(s) pour votre question**\n\n"
            
            for i, inf in enumerate(infractions_pertinentes[:2], 1):  # Limite à 2 infractions max
                fallback_response += f"**{i}. {inf.get('titre', 'Sans titre')}**\n"
                fallback_response += f"📋 Art. {inf.get('article', 'N/S')} | "
                
                amende_max = inf.get('amende_max', 0)
                points = inf.get('points_permis', 0)
                if amende_max:
                    fallback_response += f"💰 Max {amende_max}€ | "
                if points:
                    fallback_response += f"🔴 {points} pts | "
                
                fallback_response += f"⚖️ {inf.get('sanction', 'Sanction N/S')}\n\n"
            
            fallback_response += "**💡 Actions :**\n"
            fallback_response += "• Consultez Légifrance.gouv.fr pour détails\n"
            fallback_response += "• Contactez un avocat transport si nécessaire\n"
            
        else:
            fallback_response = f"**❌ Aucune infraction trouvée** pour \"{question}\"\n\n"
            fallback_response += "**💡 Suggestions :**\n"
            fallback_response += "• Reformulez avec des mots-clés précis\n"
            fallback_response += "• Essayez : 'tachygraphe', 'vitesse', 'surcharge', 'formation'\n"
            fallback_response += "• Consultez les catégories d'infractions disponibles\n"
        
        if openai_error_message:
            fallback_response += f"\n⚠️ **Chat IA indisponible** : {openai_error_message[:50]}..."
        
        return {
            "reponse": fallback_response,
            "citations": citations,
            "source": "Base locale Légifrance uniquement",
            "infractions_trouvees": len(infractions_pertinentes),
            "debug_info": {
                "openai_disponible": False,
                "openai_error": openai_error_message,
                "infractions_dans_cache": len(CACHE_INFRACTIONS),
                "infractions_pertinentes": len(infractions_pertinentes),
                "mode": "fallback_local_uniquement"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erreur dans chat_juridique: {e}")
        import traceback
        traceback.print_exc()
        
        # Retourner un message d'erreur utilisateur-friendly au lieu d'une erreur 503
        return {
            "reponse": f"**❌ Erreur technique temporaire**\n\nUne erreur s'est produite lors du traitement de votre question.\n\n**Détails de l'erreur :** {str(e)}\n\n**Solutions temporaires :**\n• Reformulez votre question\n• Utilisez la recherche manuelle d'infractions\n• Réessayez dans quelques instants\n\n**Pour une assistance technique :** Contactez l'administrateur système.",
            "citations": [],
            "source": "Système en erreur",
            "infractions_trouvees": 0,
            "debug_info": {
                "openai_disponible": False,
                "erreur_systeme": str(e),
                "mode": "erreur_technique"
            }
        }

@app.get("/article/{article_id}")
async def get_article_details(article_id: str):
    """
    Récupère les détails complets d'un article juridique
    """
    try:
        # Chercher l'article dans la base de données des infractions
        article_trouve = None
        
        for infraction in CACHE_INFRACTIONS:
            if infraction.get("id") == article_id or infraction.get("article", "").replace(" ", "_").replace(".", "_") == article_id:
                article_trouve = infraction
                break
        
        if not article_trouve:
            # Chercher par référence d'article
            for infraction in CACHE_INFRACTIONS:
                article_ref = infraction.get("article", "").lower()
                if article_id.lower() in article_ref or article_ref.replace(" ", "_").replace(".", "_") == article_id:
                    article_trouve = infraction
                    break
        
        if not article_trouve:
            raise HTTPException(status_code=404, detail="Article non trouvé")
        
        # Enrichir les détails de l'article
        article_details = {
            "id": article_trouve.get("id"),
            "titre": article_trouve.get("titre"),
            "article": article_trouve.get("article"),
            "description": article_trouve.get("description", ""),
            "texte_integral": article_trouve.get("texte_integral", article_trouve.get("description", "")),
            "sanction": article_trouve.get("sanction", ""),
            "amende_min": article_trouve.get("amende_min"),
            "amende_max": article_trouve.get("amende_max"),
            "points_permis": article_trouve.get("points_permis"),
            "suspension_permis": article_trouve.get("suspension_permis"),
            "immobilisation": article_trouve.get("immobilisation"),
            "confiscation": article_trouve.get("confiscation"),
            "gravite": article_trouve.get("gravite", "moyenne"),
            "categorie": article_trouve.get("categorie", ""),
            "sous_categorie": article_trouve.get("sous_categorie", ""),
            "code_source": article_trouve.get("code_source", ""),
            "url_legifrance": article_trouve.get("url_legifrance", ""),
            "date_maj": article_trouve.get("date_maj", ""),
            "tags": article_trouve.get("tags", []),
            "mots_cles": article_trouve.get("mots_cles", []),
            "professionnel_uniquement": article_trouve.get("professionnel_uniquement", False),
            "recidive": article_trouve.get("recidive", False)
        }
        
        # Trouver des articles connexes
        articles_connexes = []
        if article_trouve.get("categorie"):
            for infraction in CACHE_INFRACTIONS[:10]:  # Limiter à 10 résultats
                if (infraction.get("categorie") == article_trouve.get("categorie") and 
                    infraction.get("id") != article_trouve.get("id")):
                    articles_connexes.append({
                        "id": infraction.get("id"),
                        "titre": infraction.get("titre"),
                        "article": infraction.get("article"),
                        "gravite": infraction.get("gravite"),
                        "sanction": infraction.get("sanction", "")[:100] + "..." if infraction.get("sanction", "") else ""
                    })
        
        article_details["articles_connexes"] = articles_connexes[:5]  # Top 5
        
        logger.info(f"📖 Article récupéré: {article_id}")
        return article_details
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erreur récupération article {article_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur serveur: {str(e)}")

def generer_liens_articles(reponse_text: str, infractions_trouvees: List[Dict]) -> str:
    """
    Transforme les références d'articles en liens cliquables
    """
    import re
    
    # Patterns pour détecter les articles
    patterns_articles = [
        r'(Article\s+[\w\.-]+(?:\s+du\s+[\w\s]+)?)',
        r'(Art\.\s*[\w\.-]+(?:\s+du\s+[\w\s]+)?)',
        r'(R\.\s*[\d\.-]+(?:\s+du\s+[\w\s]+)?)',
        r'(L\.\s*[\d\.-]+(?:\s+du\s+[\w\s]+)?)',
        r'(article\s+[\w\.-]+(?:\s+du\s+[\w\s]+)?)'
    ]
    
    reponse_avec_liens = reponse_text
    
    # Créer un mapping des articles vers leurs IDs
    article_mapping = {}
    for infraction in infractions_trouvees:
        article_ref = infraction.get("article", "")
        if article_ref:
            # Nettoyer la référence pour créer un ID
            article_id = article_ref.replace(" ", "_").replace(".", "_").replace("°", "")
            article_mapping[article_ref] = {
                "id": infraction.get("id"),
                "article_id": article_id,
                "titre": infraction.get("titre")
            }
    
    # Remplacer les articles par des liens
    for pattern in patterns_articles:
        matches = re.finditer(pattern, reponse_avec_liens, re.IGNORECASE)
        for match in matches:
            article_text = match.group(1)
            
            # Chercher dans le mapping
            article_info = None
            for ref, info in article_mapping.items():
                if article_text.lower() in ref.lower() or ref.lower() in article_text.lower():
                    article_info = info
                    break
            
            if article_info:
                # Créer le lien cliquable
                article_link = f'<a href="#" onclick="ouvrirArticle(\'{article_info["id"]}\', \'{article_info["article_id"]}\')" class="article-link" title="Cliquer pour voir l\'article complet">{article_text}</a>'
                reponse_avec_liens = reponse_avec_liens.replace(article_text, article_link)
    
    return reponse_avec_liens

if __name__ == "__main__":
    print("🚛 Démarrage de l'API Sogestmatic...")
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info"
    ) 