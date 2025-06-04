#!/usr/bin/env python3
"""
Script de test et évaluation des performances du chatbot Sogestmatic
Compare les réponses avant/après optimisation et fine-tuning
"""

import asyncio
import json
import time
from typing import List, Dict, Any
import requests
from datetime import datetime

class PerformanceTester:
    def __init__(self, api_base_url: str = "http://127.0.0.1:8000"):
        self.api_url = api_base_url
        self.questions_test = [
            # Questions simples
            "Quelle amende pour excès de vitesse poids lourd ?",
            "Sanctions pour tachygraphe défaillant ?",
            "Formation FIMO obligatoire quand ?",
            
            # Questions complexes avec contexte
            "Mon poids lourd de 15 tonnes peut-il rouler à 90 km/h sur autoroute en 2025 ?",
            "Je transporte des marchandises dangereuses avec un camion de 12 tonnes dans Paris",
            "Conducteur dépassant 11h de conduite quotidienne, quelles conséquences ?",
            "Contrôle surcharge de 2 tonnes sur un ensemble routier, que va-t-il se passer ?",
            "Tachygraphe en panne pendant 3 jours, procédure à suivre ?",
            
            # Questions avec exceptions
            "Transport d'urgence avec dépassement temps de conduite autorisé ?",
            "Véhicule de 2018 sans FCO, sanctions ?",
            "Circulation ZFE Paris avec vieux camion, dérogations possibles ?",
            "Transport exceptionnel sans escorte, infractions ?",
            
            # Questions ambiguës nécessitant précisions
            "Mon camion a été immobilisé",
            "Problème avec le permis de conduire",
            "Infraction transport de marchandises",
            "Question sur les temps de repos"
        ]
        
        self.criteres_evaluation = {
            "precision_juridique": 0,      # Exactitude des références légales
            "completude_reponse": 0,       # Réponse complète vs partielle  
            "gestion_exceptions": 0,       # Mention des cas particuliers
            "structure_reponse": 0,        # Organisation claire
            "conseils_pratiques": 0,       # Utilité des recommandations
            "clarte_expression": 0         # Compréhensibilité
        }

    async def tester_question(self, question: str, model_info: str = "") -> Dict[str, Any]:
        """Teste une question et retourne métriques + réponse"""
        print(f"📝 Test: {question[:50]}...")
        
        start_time = time.time()
        
        try:
            # Appel API
            response = requests.post(
                f"{self.api_url}/chat",
                json={"question": question, "historique": []},
                timeout=30
            )
            
            response_time = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                reponse = data.get("reponse", "")
                
                # Évaluation automatique
                scores = self.evaluer_reponse(question, reponse)
                
                return {
                    "question": question,
                    "reponse": reponse,
                    "temps_reponse": response_time,
                    "scores": scores,
                    "longueur_reponse": len(reponse),
                    "infractions_trouvees": data.get("infractions_trouvees", 0),
                    "source": data.get("source", ""),
                    "model_info": model_info,
                    "timestamp": datetime.now().isoformat()
                }
            else:
                return {
                    "question": question,
                    "erreur": f"HTTP {response.status_code}",
                    "model_info": model_info,
                    "timestamp": datetime.now().isoformat()
                }
                
        except Exception as e:
            return {
                "question": question,
                "erreur": str(e),
                "model_info": model_info,
                "timestamp": datetime.now().isoformat()
            }

    def evaluer_reponse(self, question: str, reponse: str) -> Dict[str, float]:
        """Évalue automatiquement la qualité de la réponse"""
        scores = {}
        
        # 1. Précision juridique (recherche d'éléments clés)
        elements_juridiques = [
            "article", "Art.", "R.", "L.", "code", "décret", "arrêté",
            "légifrance", "réglementation", "directive", "CE "
        ]
        score_juridique = sum(1 for elem in elements_juridiques if elem.lower() in reponse.lower())
        scores["precision_juridique"] = min(score_juridique / 3.0, 1.0)  # Max 1.0
        
        # 2. Complétude (sections attendues)
        sections_attendues = [
            "sanction", "amende", "points", "article", "exception", "cas particulier",
            "dérogation", "conseil", "recommandation"
        ]
        score_completude = sum(1 for section in sections_attendues if section.lower() in reponse.lower())
        scores["completude_reponse"] = min(score_completude / 6.0, 1.0)
        
        # 3. Gestion des exceptions
        mots_exceptions = [
            "exception", "dérogation", "cas particulier", "selon", "dépend",
            "PTAC", "professionnel", "particulier", "zone", "ancienneté"
        ]
        score_exceptions = sum(1 for mot in mots_exceptions if mot.lower() in reponse.lower())
        scores["gestion_exceptions"] = min(score_exceptions / 4.0, 1.0)
        
        # 4. Structure (markdown et organisation)
        elements_structure = ["###", "**", "-", "•", "1.", "2."]
        score_structure = sum(1 for elem in elements_structure if elem in reponse)
        scores["structure_reponse"] = min(score_structure / 4.0, 1.0)
        
        # 5. Conseils pratiques
        mots_conseils = [
            "conseil", "recommandation", "éviter", "vérifier", "former",
            "procédure", "action", "prévention", "maintenance"
        ]
        score_conseils = sum(1 for mot in mots_conseils if mot.lower() in reponse.lower())
        scores["conseils_pratiques"] = min(score_conseils / 3.0, 1.0)
        
        # 6. Clarté (longueur appropriée, pas de répétitions)
        longueur = len(reponse)
        if 200 < longueur < 2000:  # Longueur appropriée
            score_clarte = 1.0
        elif longueur < 100:
            score_clarte = 0.3  # Trop court
        elif longueur > 3000:
            score_clarte = 0.7  # Trop long
        else:
            score_clarte = 0.8
        scores["clarte_expression"] = score_clarte
        
        return scores

    def calculer_score_global(self, scores: Dict[str, float]) -> float:
        """Calcule un score global pondéré"""
        poids = {
            "precision_juridique": 0.25,
            "completude_reponse": 0.20,
            "gestion_exceptions": 0.20,
            "structure_reponse": 0.15,
            "conseils_pratiques": 0.10,
            "clarte_expression": 0.10
        }
        
        return sum(scores[critere] * poids[critere] for critere in poids)

    async def test_complet(self, model_info: str = "Standard") -> Dict[str, Any]:
        """Lance un test complet sur toutes les questions"""
        print(f"\n🧪 DÉMARRAGE TEST COMPLET - {model_info}")
        print("="*60)
        
        resultats = []
        scores_globaux = []
        temps_total = time.time()
        
        for i, question in enumerate(self.questions_test, 1):
            print(f"\n[{i}/{len(self.questions_test)}] ", end="")
            
            resultat = await self.tester_question(question, model_info)
            
            if "scores" in resultat:
                score_global = self.calculer_score_global(resultat["scores"])
                resultat["score_global"] = score_global
                scores_globaux.append(score_global)
                
                print(f"✅ Score: {score_global:.2f} | Temps: {resultat['temps_reponse']:.1f}s")
            else:
                print(f"❌ Erreur: {resultat.get('erreur', 'Inconnue')}")
            
            resultats.append(resultat)
        
        temps_total = time.time() - temps_total
        
        # Statistiques finales
        if scores_globaux:
            score_moyen = sum(scores_globaux) / len(scores_globaux)
            score_min = min(scores_globaux)
            score_max = max(scores_globaux)
        else:
            score_moyen = score_min = score_max = 0
        
        temps_moyen = sum(r.get("temps_reponse", 0) for r in resultats if "temps_reponse" in r) / len(resultats)
        
        rapport_final = {
            "model_info": model_info,
            "timestamp": datetime.now().isoformat(),
            "resultats_detailles": resultats,
            "statistiques": {
                "nb_questions": len(self.questions_test),
                "nb_reussites": len([r for r in resultats if "scores" in r]),
                "score_moyen": score_moyen,
                "score_min": score_min,
                "score_max": score_max,
                "temps_moyen_reponse": temps_moyen,
                "temps_total": temps_total
            }
        }
        
        # Sauvegarde
        filename = f"test_performance_{model_info.lower().replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M')}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(rapport_final, f, indent=2, ensure_ascii=False)
        
        print(f"\n📊 RÉSULTATS FINAUX - {model_info}")
        print(f"Score moyen: {score_moyen:.3f}/1.000")
        print(f"Temps moyen: {temps_moyen:.1f}s")
        print(f"Réussites: {rapport_final['statistiques']['nb_reussites']}/{len(self.questions_test)}")
        print(f"💾 Rapport sauvegardé: {filename}")
        
        return rapport_final

    def comparer_modeles(self, fichier1: str, fichier2: str):
        """Compare les performances de deux modèles"""
        try:
            with open(fichier1, 'r', encoding='utf-8') as f:
                resultats1 = json.load(f)
            with open(fichier2, 'r', encoding='utf-8') as f:
                resultats2 = json.load(f)
            
            stats1 = resultats1["statistiques"]
            stats2 = resultats2["statistiques"]
            
            print(f"\n📊 COMPARAISON DES MODÈLES")
            print("="*50)
            print(f"Modèle 1: {resultats1['model_info']}")
            print(f"Modèle 2: {resultats2['model_info']}")
            print()
            
            # Comparaison des scores
            print("🎯 SCORES:")
            print(f"   Modèle 1: {stats1['score_moyen']:.3f}")
            print(f"   Modèle 2: {stats2['score_moyen']:.3f}")
            diff_score = stats2['score_moyen'] - stats1['score_moyen']
            print(f"   Amélioration: {diff_score:+.3f} ({diff_score/stats1['score_moyen']*100:+.1f}%)")
            
            # Comparaison des temps
            print("\n⏱️ TEMPS DE RÉPONSE:")
            print(f"   Modèle 1: {stats1['temps_moyen_reponse']:.1f}s")
            print(f"   Modèle 2: {stats2['temps_moyen_reponse']:.1f}s")
            diff_temps = stats2['temps_moyen_reponse'] - stats1['temps_moyen_reponse']
            print(f"   Différence: {diff_temps:+.1f}s")
            
            # Fiabilité
            print("\n🎯 FIABILITÉ:")
            print(f"   Modèle 1: {stats1['nb_reussites']}/{stats1['nb_questions']}")
            print(f"   Modèle 2: {stats2['nb_reussites']}/{stats2['nb_questions']}")
            
        except Exception as e:
            print(f"❌ Erreur comparaison: {e}")

async def main():
    """Fonction principale"""
    tester = PerformanceTester()
    
    print("🚛 SOGESTMATIC PERFORMANCE TESTER")
    print("Évaluation des performances du chatbot juridique")
    print()
    
    choix = input("Choisissez une action :\n1. Test modèle actuel\n2. Comparer deux modèles\n3. Test rapide (5 questions)\n> ")
    
    if choix == "1":
        model_name = input("Nom du modèle (ex: 'GPT-4o-mini-optimisé') : ") or "Standard"
        await tester.test_complet(model_name)
        
    elif choix == "2":
        fichier1 = input("Fichier résultats modèle 1 : ")
        fichier2 = input("Fichier résultats modèle 2 : ")
        tester.comparer_modeles(fichier1, fichier2)
        
    elif choix == "3":
        # Test rapide sur 5 premières questions
        tester.questions_test = tester.questions_test[:5]
        model_name = input("Nom du modèle : ") or "Test-rapide"
        await tester.test_complet(model_name)
    
    else:
        print("❌ Choix invalide")

if __name__ == "__main__":
    asyncio.run(main()) 