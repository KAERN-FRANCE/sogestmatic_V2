"""
Debug de la détection d'exceptions
"""

from main import analyser_contexte_exceptions

def test_detection():
    question = "Je livre des colis La Poste avec un fourgon électrique de 7,5 tonnes dans un rayon de 100km"
    
    print(f"Question: {question}")
    print("-" * 60)
    
    analyse = analyser_contexte_exceptions(question)
    
    print("Dérogations Article 13 détectées:")
    for derog in analyse.get('derogations_article13', []):
        print(f"  • {derog}")
    
    print(f"\nSecteurs: {analyse.get('secteurs_activite', [])}")
    print(f"Zones: {analyse.get('zones', [])}")
    print(f"Types véhicules: {analyse.get('types_vehicules', [])}")
    print(f"Usages: {analyse.get('usages', [])}")
    
    print(f"\nPrécisions nécessaires:")
    for precision in analyse.get('besoin_precisions', []):
        print(f"  • {precision}")
    
    print(f"\nExceptions probables:")
    for exception in analyse.get('exceptions_probables', []):
        print(f"  • {exception}")

if __name__ == "__main__":
    test_detection() 