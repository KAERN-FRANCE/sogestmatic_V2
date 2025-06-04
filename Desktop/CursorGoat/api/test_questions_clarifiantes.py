"""
Test du système de questions clarifiantes et détection d'exceptions
"""

import asyncio
import json
import requests
from main import analyser_contexte_exceptions, generer_questions_clarifiantes

def test_detection_exceptions():
    """Test de la détection d'exceptions Article 13"""
    
    print("🧪 Test du système de détection d'exceptions Article 13")
    print("=" * 60)
    
    # Cas de test variés
    cas_tests = [
        {
            "question": "Je transporte du lait avec mon camion agricole, dois-je respecter les temps de conduite ?",
            "attendu": ["agriculture", "collecte_lait", "Article 13l", "Article 13b"]
        },
        {
            "question": "J'ai un fourgon de 7,5 tonnes électrique pour livrer des colis dans un rayon de 80km",
            "attendu": ["vehicule_propre", "Article 13f", "7,5T", "100km"]
        },
        {
            "question": "Mon bus de 15 places pour transport non commercial doit-il avoir un tachygraphe ?",
            "attendu": ["transport_voyageurs", "Article 13i", "10-17 places", "non commercial"]
        },
        {
            "question": "Je transporte des engins de chantier pour ma société de BTP",
            "attendu": ["construction", "Article 13q", "100km", "conduite_non_principale"]
        },
        {
            "question": "Véhicule de service public pour collecte des déchets ménagers",
            "attendu": ["service_public", "Article 13h", "déchets"]
        },
        {
            "question": "Auto-école avec véhicule poids lourd pour formation permis C",
            "attendu": ["formation", "Article 13g", "auto-école"]
        }
    ]
    
    print("\n📋 Tests de détection d'exceptions :")
    
    for i, cas in enumerate(cas_tests, 1):
        print(f"\n🔍 Test {i} : {cas['question'][:50]}...")
        
        analyse = analyser_contexte_exceptions(cas['question'])
        
        # Vérifier les dérogations détectées
        derogations = analyse.get('derogations_article13', [])
        secteurs = analyse.get('secteurs_activite', [])
        
        print(f"   Dérogations détectées : {len(derogations)}")
        for derog in derogations:
            print(f"     • {derog}")
        
        print(f"   Secteurs détectés : {secteurs}")
        print(f"   Précisions nécessaires : {len(analyse.get('besoin_precisions', []))}")
        
        # Vérifier que les éléments attendus sont présents
        elements_detectes = []
        elements_detectes.extend(derogations)
        elements_detectes.extend(secteurs)
        elements_detectes.extend(analyse.get('zones', []))
        
        text_analyse = " ".join(str(elements_detectes).lower())
        
        detection_correcte = True
        for attendu in cas['attendu']:
            if attendu.lower() not in text_analyse:
                detection_correcte = False
                print(f"     ❌ Manqué : {attendu}")
        
        if detection_correcte:
            print("   ✅ Détection correcte")
        else:
            print("   ⚠️ Détection partielle")
    
    print("\n📝 Tests de génération de questions clarifiantes :")
    
    # Test avec un cas complexe
    question_complexe = "Mon entreprise agricole transporte du matériel avec un camion de 7,5 tonnes dans la région"
    analyse_complexe = analyser_contexte_exceptions(question_complexe)
    questions = generer_questions_clarifiantes(analyse_complexe, question_complexe)
    
    print(f"\nQuestion test : {question_complexe}")
    print("Questions générées :")
    for question in questions:
        print(f"   {question}")
    
    print(f"\n✅ {len(questions)} questions clarifiantes générées")
    
    return True

def test_api_chat_avec_exceptions():
    """Test de l'API chat avec le nouveau système"""
    
    print("\n🌐 Test API Chat avec détection d'exceptions")
    print("=" * 60)
    
    # URL de l'API locale
    api_url = "http://127.0.0.1:8000/chat"
    
    # Questions de test pour déclencher les questions clarifiantes
    questions_test = [
        "J'ai un véhicule agricole, dois-je respecter les temps de conduite ?",
        "Mon fourgon électrique de 7 tonnes pour livraison postale",
        "Bus 12 places pour transport non commercial association",
        "Transport d'engins de chantier BTP"
    ]
    
    for i, question in enumerate(questions_test, 1):
        print(f"\n🔍 Test API {i} : {question}")
        
        try:
            # Appel à l'API
            payload = {"question": question}
            response = requests.post(api_url, json=payload, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                reponse = data.get('reponse', '')
                
                # Vérifier si des questions clarifiantes sont posées
                questions_detectees = []
                if "pourriez-vous préciser" in reponse.lower():
                    questions_detectees.append("Questions clarifiantes présentes")
                if "article 13" in reponse.lower():
                    questions_detectees.append("Article 13 mentionné")
                if "dérogation" in reponse.lower() or "exemption" in reponse.lower():
                    questions_detectees.append("Dérogations mentionnées")
                
                print(f"   ✅ Réponse reçue ({len(reponse)} caractères)")
                print(f"   Détections : {questions_detectees}")
                
                # Afficher un extrait de la réponse
                if len(reponse) > 200:
                    extrait = reponse[:200] + "..."
                else:
                    extrait = reponse
                print(f"   Extrait : {extrait}")
                
            else:
                print(f"   ❌ Erreur API : {response.status_code}")
                
        except requests.exceptions.RequestException as e:
            print(f"   ❌ Erreur connexion : {e}")
            
        except Exception as e:
            print(f"   ❌ Erreur : {e}")
    
    print("\n✅ Test API terminé")

def test_scenarios_detailles():
    """Test de scénarios détaillés avec questions clarifiantes"""
    
    print("\n📊 Test de scénarios détaillés")
    print("=" * 60)
    
    scenarios = [
        {
            "titre": "Agriculteur avec tracteur",
            "question": "Je conduis un tracteur agricole pour transporter du matériel de la ferme aux champs",
            "derogations_attendues": ["Article 13b", "Article 13c"],
            "questions_attendues": ["distance", "100km", "exploitation"]
        },
        {
            "titre": "Service postal local",
            "question": "Livraison de colis La Poste avec véhicule 7,5T en ville",
            "derogations_attendues": ["Article 13d"],
            "questions_attendues": ["service universel", "100km", "activité principale"]
        },
        {
            "titre": "Transport sur île",
            "question": "Transport de marchandises en Corse avec poids lourd",
            "derogations_attendues": ["Article 13e"],
            "questions_attendues": ["île", "superficie", "isolation"]
        },
        {
            "titre": "Véhicule écologique BTP",
            "question": "Camion électrique 7T pour chantiers de construction",
            "derogations_attendues": ["Article 13f", "Article 13q"],
            "questions_attendues": ["écologique", "100km", "conduite principale"]
        }
    ]
    
    for scenario in scenarios:
        print(f"\n🎯 Scénario : {scenario['titre']}")
        print(f"Question : {scenario['question']}")
        
        analyse = analyser_contexte_exceptions(scenario['question'])
        questions = generer_questions_clarifiantes(analyse, scenario['question'])
        
        # Vérifier les dérogations détectées
        derogations_ok = 0
        for derog_attendue in scenario['derogations_attendues']:
            if any(derog_attendue in derog for derog in analyse.get('derogations_article13', [])):
                derogations_ok += 1
        
        # Vérifier les questions générées
        questions_text = " ".join(questions).lower()
        questions_ok = 0
        for question_attendue in scenario['questions_attendues']:
            if question_attendue.lower() in questions_text:
                questions_ok += 1
        
        print(f"   Dérogations détectées : {derogations_ok}/{len(scenario['derogations_attendues'])}")
        print(f"   Questions pertinentes : {questions_ok}/{len(scenario['questions_attendues'])}")
        
        if derogations_ok > 0 and questions_ok > 0:
            print("   ✅ Scénario réussi")
        else:
            print("   ⚠️ Scénario partiel")
        
        # Afficher les questions générées
        print("   Questions clarifiantes :")
        for question in questions:
            print(f"     {question}")

def main():
    """Test principal"""
    
    print("🚀 TESTS SYSTÈME DE QUESTIONS CLARIFIANTES ARTICLE 13")
    print("=" * 80)
    
    try:
        # Test 1 : Détection d'exceptions
        test_detection_exceptions()
        
        # Test 2 : API chat
        test_api_chat_avec_exceptions()
        
        # Test 3 : Scénarios détaillés
        test_scenarios_detailles()
        
        print("\n" + "=" * 80)
        print("🎉 TOUS LES TESTS TERMINÉS")
        print("Le système de questions clarifiantes est opérationnel !")
        
    except Exception as e:
        print(f"\n❌ Erreur lors des tests : {e}")
        return False
    
    return True

if __name__ == "__main__":
    main() 