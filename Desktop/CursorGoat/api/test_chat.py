#!/usr/bin/env python3

import asyncio
import json
import sys
import traceback

# Import main après avoir ajouté le chemin
import main

async def test_chat():
    """Test direct de la fonction chat"""
    try:
        print("🧪 Test de la fonction chat_juridique...")
        
        # Simuler les données de requête
        data = {
            'question': 'Test simple',
            'historique': []
        }
        
        print(f"📝 Données de test: {data}")
        
        # Appeler la fonction directement
        result = await main.chat_juridique(data)
        
        print("✅ Succès! Fonction chat_juridique fonctionne.")
        print(f"📄 Résultat: {json.dumps(result, indent=2, ensure_ascii=False)[:500]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur dans test_chat: {e}")
        print("🔍 Traceback complet:")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_chat())
    sys.exit(0 if success else 1) 