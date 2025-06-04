#!/usr/bin/env python3
"""
Test simple de l'endpoint des articles
"""

import asyncio
import sys
import os

# Ajouter le répertoire parent au path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from legifrance_enhanced import recherche_exhaustive_legifrance

async def test_article_endpoint():
    """Test de base pour l'endpoint des articles"""
    
    print("🧪 Test de l'endpoint des articles")
    print("=" * 40)
    
    try:
        # Charger quelques infractions
        print("📚 Chargement des infractions...")
        infractions = await recherche_exhaustive_legifrance()
        print(f"✅ {len(infractions)} infractions chargées")
        
        if not infractions:
            print("❌ Aucune infraction chargée")
            return
        
        # Tester avec la première infraction
        premiere_infraction = infractions[0]
        article_id = premiere_infraction.get("id")
        
        print(f"\n🔍 Test avec l'infraction: {article_id}")
        print(f"Titre: {premiere_infraction.get('titre')}")
        print(f"Article: {premiere_infraction.get('article')}")
        
        # Simuler la logique de recherche de l'endpoint
        article_trouve = None
        
        for infraction in infractions:
            if infraction.get("id") == article_id:
                article_trouve = infraction
                break
        
        if article_trouve:
            print("✅ Article trouvé par ID")
            
            # Construire la réponse comme dans l'endpoint
            article_details = {
                "id": article_trouve.get("id"),
                "titre": article_trouve.get("titre"),
                "article": article_trouve.get("article"),
                "description": article_trouve.get("description", ""),
                "texte_integral": article_trouve.get("texte_integral", article_trouve.get("description", "")),
                "sanction": article_trouve.get("sanction", ""),
                "amende_min": article_trouve.get("amende_min"),
                "amende_max": article_trouve.get("amende_max"),
                "gravite": article_trouve.get("gravite", "moyenne"),
                "categorie": article_trouve.get("categorie", ""),
                "code_source": article_trouve.get("code_source", ""),
            }
            
            print("✅ Article détaillé construit avec succès")
            print(f"Détails: {len(str(article_details))} caractères")
            
        else:
            print("❌ Article non trouvé")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_article_endpoint()) 