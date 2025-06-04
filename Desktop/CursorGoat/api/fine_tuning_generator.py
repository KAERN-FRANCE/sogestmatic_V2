#!/usr/bin/env python3
"""
Générateur de dataset pour le fine-tuning de ChatGPT
Création d'exemples question-réponse à partir de la base Légifrance
"""

import json
import asyncio
from typing import List, Dict, Any
import random
from datetime import datetime

# Import de votre système existant
from main import CACHE_INFRACTIONS, refresh_infractions_cache

class FineTuningDatasetGenerator:
    def __init__(self):
        self.templates_questions = {
            "sanctions": [
                "Quelles sont les sanctions pour {titre_infraction} ?",
                "Que risque-t-on en cas de {titre_infraction} ?",
                "Combien coûte une amende pour {titre_infraction} ?",
                "Points de permis retirés pour {titre_infraction} ?",
            ],
            "cas_pratiques": [
                "Je me suis fait contrôler pour {titre_infraction}, que va-t-il se passer ?",
                "Mon conducteur a commis une infraction de {titre_infraction}, quelles conséquences ?",
                "Contrôle routier : {titre_infraction} détectée, quelle procédure ?",
            ],
            "prevention": [
                "Comment éviter une infraction de {titre_infraction} ?",
                "Quelles précautions prendre pour éviter {titre_infraction} ?",
                "Formation pour prévenir {titre_infraction} ?",
            ],
            "reglementation": [
                "Quelle est la réglementation sur {titre_infraction} ?",
                "Article de loi pour {titre_infraction} ?",
                "Texte légal concernant {titre_infraction} ?",
            ]
        }
        
        self.exemples_contexte = {
            "poids_lourd": ["avec un poids lourd de 19 tonnes", "sur un camion PTAC 12T", "véhicule transport marchandises"],
            "professionnel": ["en tant que transporteur professionnel", "entreprise de transport", "chauffeur salarié"],
            "zone": ["sur autoroute", "en ville", "en zone ZFE", "périphérique parisien"],
            "temps": ["en 2025", "véhicule ancien", "nouvelle réglementation"]
        }

    def generer_question_naturelle(self, infraction: Dict[str, Any], template_type: str) -> str:
        """Génère une question naturelle à partir d'un template"""
        titre = infraction.get('titre', '').lower()
        templates = self.templates_questions.get(template_type, [])
        
        if not templates:
            return None
            
        template = random.choice(templates)
        question_base = template.format(titre_infraction=titre)
        
        # Ajouter du contexte aléatoire
        if random.random() < 0.6:  # 60% de chance d'ajouter du contexte
            contexte_type = random.choice(list(self.exemples_contexte.keys()))
            contexte = random.choice(self.exemples_contexte[contexte_type])
            question_base += f" {contexte}"
        
        return question_base

    def generer_reponse_experte(self, infraction: Dict[str, Any], question: str) -> str:
        """Génère une réponse d'expert structurée"""
        titre = infraction.get('titre', 'Infraction non spécifiée')
        article = infraction.get('article', 'Article non spécifié')
        description = infraction.get('description', 'Description non disponible')
        sanction = infraction.get('sanction', 'Sanction non spécifiée')
        amende_max = infraction.get('amende_max', 0)
        points = infraction.get('points_permis', 0)
        categorie = infraction.get('categorie', 'general')
        
        reponse = f"### {titre}\n\n"
        
        # Réponse directe
        reponse += f"**Réponse directe :** {description}\n\n"
        
        # Références légales
        reponse += f"**📋 Référence légale :** {article}\n\n"
        
        # Sanctions
        reponse += "**⚖️ Sanctions encourues :**\n"
        reponse += f"- {sanction}\n"
        if amende_max:
            reponse += f"- Amende maximale : {amende_max}€\n"
        if points:
            reponse += f"- Retrait de points : {points} points\n"
        
        # Immobilisation/suspension si applicable
        if infraction.get('immobilisation'):
            reponse += f"- Immobilisation : {infraction.get('immobilisation')}\n"
        if infraction.get('suspension_permis'):
            reponse += f"- Suspension permis : {infraction.get('suspension_permis')}\n"
        
        reponse += "\n"
        
        # Exceptions et cas particuliers selon la catégorie
        reponse += "### ⚠️ Exceptions et cas particuliers\n"
        
        if categorie == "tachygraphe":
            reponse += "- Véhicules antérieurs à 2006 : règles différentes pour tachygraphes analogiques\n"
            reponse += "- Transport < 100km : exemptions possibles selon le type de transport\n"
            reponse += "- Véhicules de secours : dérogations en situation d'urgence\n"
        elif categorie == "vitesse":
            reponse += "- Tolérances techniques : marge d'erreur selon type de radar\n"
            reponse += "- Conditions météo : réductions de vitesse obligatoires\n"
            reponse += "- Poids du véhicule : limitations selon PTAC\n"
        elif categorie == "surcharge":
            reponse += "- Tolérances de pesage : marges techniques autorisées\n"
            reponse += "- Type de marchandises : règles spéciales matières dangereuses\n"
            reponse += "- Répartition des charges : essieux/bogies\n"
        
        reponse += "\n### ❓ Questions pour affiner le conseil\n"
        reponse += "- Type de véhicule et PTAC ?\n"
        reponse += "- Usage professionnel ou particulier ?\n"
        reponse += "- Zone géographique et circonstances ?\n"
        
        reponse += "\n### 💡 Conseils pratiques\n"
        if categorie == "tachygraphe":
            reponse += "- Vérifier quotidiennement le bon fonctionnement\n"
            reponse += "- Former les conducteurs aux procédures\n"
            reponse += "- Maintenance préventive régulière\n"
        elif categorie == "formation":
            reponse += "- Planifier les formations FIMO/FCO à l'avance\n"
            reponse += "- Tenir un registre des formations\n"
            reponse += "- Vérifier les dates d'échéance\n"
        
        reponse += "\n**⚖️ Recommandation :** En cas de doute, consultez un avocat spécialisé en transport ou les services de la DREAL."
        
        return reponse

    async def generer_dataset_complet(self, nb_exemples: int = 200) -> List[Dict[str, Any]]:
        """Génère un dataset complet pour fine-tuning"""
        
        # Charger les infractions si nécessaire
        if not CACHE_INFRACTIONS:
            await refresh_infractions_cache()
        
        dataset = []
        
        print(f"🔍 Génération de {nb_exemples} exemples à partir de {len(CACHE_INFRACTIONS)} infractions...")
        
        for i in range(nb_exemples):
            # Sélectionner une infraction aléatoire
            infraction = random.choice(CACHE_INFRACTIONS)
            
            # Sélectionner un type de question aléatoire
            template_type = random.choice(list(self.templates_questions.keys()))
            
            # Générer question et réponse
            question = self.generer_question_naturelle(infraction, template_type)
            if not question:
                continue
                
            reponse = self.generer_reponse_experte(infraction, question)
            
            # Format OpenAI fine-tuning
            exemple = {
                "messages": [
                    {
                        "role": "system",
                        "content": """Tu es un expert juridique spécialisé dans le transport routier français. Tu connais parfaitement Légifrance et la réglementation des transports. Tu donnes des réponses précises, structurées et prends en compte les exceptions et cas particuliers. Tes réponses incluent toujours les références légales, sanctions exactes, exceptions possibles et conseils pratiques."""
                    },
                    {
                        "role": "user",
                        "content": question
                    },
                    {
                        "role": "assistant",
                        "content": reponse
                    }
                ]
            }
            
            dataset.append(exemple)
            
            if (i + 1) % 50 == 0:
                print(f"✅ {i + 1} exemples générés...")
        
        print(f"🎯 Dataset généré : {len(dataset)} exemples")
        return dataset

    def sauvegarder_dataset(self, dataset: List[Dict[str, Any]], filename: str = "sogestmatic_finetune_dataset.jsonl"):
        """Sauvegarde le dataset au format JSONL pour OpenAI"""
        
        with open(filename, 'w', encoding='utf-8') as f:
            for exemple in dataset:
                f.write(json.dumps(exemple, ensure_ascii=False) + '\n')
        
        print(f"💾 Dataset sauvegardé : {filename}")
        print(f"📊 Statistiques :")
        print(f"   - Nombre d'exemples : {len(dataset)}")
        print(f"   - Taille fichier : {len(open(filename, 'r').read()) / 1024:.1f} KB")

async def main():
    """Fonction principale pour générer le dataset"""
    generator = FineTuningDatasetGenerator()
    
    # Générer le dataset
    dataset = await generator.generer_dataset_complet(nb_exemples=300)
    
    # Sauvegarder
    generator.sauvegarder_dataset(dataset)
    
    print("🚀 Dataset prêt pour le fine-tuning OpenAI !")
    print("📝 Prochaines étapes :")
    print("   1. Vérifier la qualité des exemples")
    print("   2. Upload vers OpenAI avec l'API Files")
    print("   3. Lancer le fine-tuning")

if __name__ == "__main__":
    asyncio.run(main()) 