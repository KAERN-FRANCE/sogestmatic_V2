#!/usr/bin/env python3
"""Test simple de la configuration OpenAI"""

import os
from dotenv import load_dotenv
from openai import OpenAI

# Charger les variables d'environnement
load_dotenv()

def test_openai():
    """Test simple de l'API OpenAI"""
    
    openai_api_key = os.getenv("OPENAI_API_KEY")
    print(f"🔑 Clé API trouvée: {openai_api_key[:10]}..." if openai_api_key else "❌ Aucune clé API")
    
    if not openai_api_key:
        print("❌ Clé OpenAI manquante")
        return False
    
    try:
        # Créer le client OpenAI
        client = OpenAI(api_key=openai_api_key)
        print("✅ Client OpenAI créé avec succès")
        
        # Test simple
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Tu es un expert juridique spécialisé dans le transport routier français."},
                {"role": "user", "content": "Puis-je utiliser un tachygraphe à disque en 2025 ?"}
            ],
            max_tokens=500,
            temperature=0.1
        )
        
        print("✅ Réponse OpenAI reçue:")
        print(response.choices[0].message.content)
        return True
        
    except Exception as e:
        print(f"❌ Erreur OpenAI: {e}")
        return False

if __name__ == "__main__":
    test_openai() 