#!/usr/bin/env python3
"""
Test et analyse de la base de données enrichie Sogestmatic
Vérifie la couverture et la qualité des nouvelles infractions
"""

import asyncio
import requests
import time
from collections import Counter

async def analyser_base_enrichie():
    """
    Analyse complète de la nouvelle base de données
    """
    print("📊 ANALYSE BASE DE DONNÉES ENRICHIE - SOGESTMATIC")
    print("=" * 60)
    
    try:
        # Test de l'API health pour vérifier le statut
        print("🔍 Vérification du statut de l'API...")
        health_response = requests.get("http://127.0.0.1:8000/health", timeout=10)
        
        if health_response.status_code == 200:
            health_data = health_response.json()
            print(f"✅ API active - Cache chargé: {health_data.get('infractions_loaded', False)}")
        else:
            print("❌ API non accessible")
            return
        
        # Analyser les statistiques générales
        print("\n📈 STATISTIQUES GÉNÉRALES")
        print("-" * 30)
        
        stats_response = requests.get("http://127.0.0.1:8000/stats", timeout=10)
        if stats_response.status_code == 200:
            stats = stats_response.json()
            total = stats.get("total_infractions", 0)
            print(f"📊 Total infractions: {total}")
            
            # Répartition par gravité
            gravites = stats.get("by_gravite", {})
            print(f"\n🎯 Répartition par gravité:")
            for gravite, count in gravites.items():
                percentage = (count / total * 100) if total > 0 else 0
                print(f"   • {gravite}: {count} ({percentage:.1f}%)")
            
            # Répartition par catégorie
            categories = stats.get("by_categorie", {})
            print(f"\n📂 Répartition par catégorie:")
            for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True):
                percentage = (count / total * 100) if total > 0 else 0
                print(f"   • {cat}: {count} ({percentage:.1f}%)")
                
        # Test de recherche par nouvelles catégories
        print(f"\n🔍 TEST DE COUVERTURE PAR NOUVELLES CATÉGORIES")
        print("-" * 45)
        
        nouvelles_categories = [
            "tachygraphe", "temps conduite", "vitesse", "surcharge",
            "formation", "documents", "stationnement", "environnement",
            "sécurité", "alcool", "permis", "assurance", "ADR"
        ]
        
        for categorie in nouvelles_categories:
            search_response = requests.get(
                f"http://127.0.0.1:8000/infractions", 
                params={"search": categorie, "limit": 100},
                timeout=10
            )
            
            if search_response.status_code == 200:
                data = search_response.json()
                count = data.get("total", 0)
                print(f"📋 {categorie}: {count} infractions trouvées")
            else:
                print(f"❌ {categorie}: Erreur de recherche")
            
            await asyncio.sleep(0.1)  # Pause pour éviter la surcharge
        
        # Test de qualité des réponses avec nouvelles infractions
        print(f"\n🧪 TEST QUALITÉ RÉPONSES (NOUVELLES INFRACTIONS)")
        print("-" * 50)
        
        questions_nouvelles = [
            "Transport sans certificat ADR matières dangereuses",
            "Véhicule sans vignette Crit'Air en ZFE Paris",
            "Arrimage défaillant chargement camion",
            "Conduite sans FCO valide poids lourd",
            "Stationnement poids lourd centre ville interdit",
            "Repos hebdomadaire non respecté 45 heures"
        ]
        
        for question in questions_nouvelles:
            print(f"\n📝 Question: {question[:50]}...")
            
            start_time = time.time()
            chat_response = requests.post(
                "http://127.0.0.1:8000/chat",
                json={"question": question, "historique": []},
                timeout=20
            )
            response_time = time.time() - start_time
            
            if chat_response.status_code == 200:
                data = chat_response.json()
                reponse = data.get("reponse", "")
                infractions_trouvees = data.get("infractions_trouvees", 0)
                
                # Analyse qualitative rapide
                nb_mots = len(reponse.split())
                articles_cites = reponse.count("article") + reponse.count("Article")
                
                print(f"   ✅ Réponse: {nb_mots} mots, {response_time:.1f}s")
                print(f"   📚 Infractions trouvées: {infractions_trouvees}")
                print(f"   📖 Articles cités: {articles_cites}")
                
                if infractions_trouvees >= 1 and articles_cites >= 1:
                    print(f"   🎯 QUALITÉ: EXCELLENTE")
                elif infractions_trouvees >= 1 or articles_cites >= 1:
                    print(f"   ⚠️ QUALITÉ: BONNE")
                else:
                    print(f"   ❌ QUALITÉ: À AMÉLIORER")
            else:
                print(f"   ❌ Erreur de réponse")
        
        # Analyse des améliorations apportées
        print(f"\n🚀 AMÉLIORATIONS APPORTÉES")
        print("-" * 30)
        
        infractions_response = requests.get("http://127.0.0.1:8000/infractions", params={"limit": 1000})
        if infractions_response.status_code == 200:
            infractions_data = infractions_response.json()
            infractions = infractions_data.get("infractions", [])
            
            # Analyser les nouvelles catégories
            categories_trouvees = set()
            infractions_avec_articles = 0
            infractions_avec_montants = 0
            infractions_manuelles = 0
            
            for infr in infractions:
                categories_trouvees.add(infr.get("categorie", ""))
                if infr.get("article") and infr.get("article") != "N/A":
                    infractions_avec_articles += 1
                if infr.get("amende_max", 0) > 0:
                    infractions_avec_montants += 1
                if infr.get("id", "").startswith("MANUEL_"):
                    infractions_manuelles += 1
            
            print(f"📂 Catégories couvertes: {len(categories_trouvees)}")
            print(f"📖 Infractions avec articles: {infractions_avec_articles}")
            print(f"💰 Infractions avec montants: {infractions_avec_montants}")
            print(f"✋ Infractions ajoutées manuellement: {infractions_manuelles}")
            
            print(f"\n📋 Nouvelles catégories détectées:")
            for cat in sorted(categories_trouvees):
                if cat:
                    print(f"   • {cat}")
        
        print(f"\n{'=' * 60}")
        print("✅ Analyse terminée - Base de données enrichie analysée")
        
    except Exception as e:
        print(f"❌ Erreur lors de l'analyse: {e}")

if __name__ == "__main__":
    print("🚀 Lancement de l'analyse de la base enrichie...")
    print("Vérifiez que l'API est démarrée sur http://127.0.0.1:8000")
    input("Appuyez sur Entrée pour continuer...")
    asyncio.run(analyser_base_enrichie()) 