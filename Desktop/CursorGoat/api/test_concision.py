#!/usr/bin/env python3
"""
Test des réponses explicatives et pédagogiques Sogestmatic
"""

import requests
import time

def tester_reponses_explicatives():
    """Test des réponses explicatives avec citations d'articles"""
    
    questions_test = [
        "Je conduis un bus avec tachygraphe à disque, moins de 30km/jour, dois-je le changer ?",
        "Quelle amende pour excès de vitesse poids lourd 15 km/h au dessus ?",
        "Formation FIMO obligatoire pour conducteur poids lourd ?",
        "Surcharge de 2 tonnes sur camion 19T, quelles sanctions ?"
    ]
    
    print("📚 TEST RÉPONSES EXPLICATIVES - SOGESTMATIC")
    print("="*50)
    
    for i, question in enumerate(questions_test, 1):
        print(f"\n[{i}] 📝 {question}")
        print("-" * 60)
        
        start_time = time.time()
        
        try:
            response = requests.post(
                "http://127.0.0.1:8000/chat",
                json={"question": question, "historique": []},
                timeout=20
            )
            
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                reponse = data.get("reponse", "")
                
                # Analyse qualitative
                nb_mots = len(reponse.split())
                citations_articles = reponse.count("article")
                contient_references = any(ref in reponse.lower() for ref in ["code des transports", "code de la route", "r.", "l."])
                
                print(f"🤖 RÉPONSE ({nb_mots} mots, {response_time:.1f}s):")
                print(reponse)
                print(f"\n📊 ANALYSE:")
                print(f"   • Mots: {nb_mots}")
                print(f"   • Citations d'articles: {citations_articles}")
                print(f"   • Références juridiques: {'✅ Oui' if contient_references else '❌ Non'}")
                
                # Évaluation qualité explicative
                if nb_mots >= 150 and citations_articles >= 1 and contient_references:
                    print(f"✅ EXPLICATIF ET PRÉCIS")
                elif nb_mots >= 100 and (citations_articles >= 1 or contient_references):
                    print(f"⚠️ PARTIELLEMENT EXPLICATIF")
                else:
                    print(f"❌ PAS ASSEZ EXPLICATIF")
                
            else:
                print(f"❌ Erreur HTTP {response.status_code}")
                
        except Exception as e:
            print(f"❌ Erreur: {e}")
    
    print(f"\n{'='*50}")
    print("✅ Test terminé - Vérifiez la qualité explicative des réponses")

if __name__ == "__main__":
    print("🚀 Test des réponses explicatives...")
    print("Vérifiez que l'API est démarrée sur http://127.0.0.1:8000")
    input("Appuyez sur Entrée pour continuer...")
    tester_reponses_explicatives() 