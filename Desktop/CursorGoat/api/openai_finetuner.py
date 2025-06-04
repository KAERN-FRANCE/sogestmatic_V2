#!/usr/bin/env python3
"""
Script automatisé pour le fine-tuning de ChatGPT avec OpenAI
Spécialisé pour Sogestmatic - expertise transport routier
"""

import os
import json
import time
from openai import OpenAI
from dotenv import load_dotenv
from typing import Dict, Any, List

load_dotenv()

class SogestmaticFineTuner:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.base_model = "gpt-4o-mini-2024-07-18"  # Modèle de base
        
    def valider_dataset(self, filename: str = "sogestmatic_finetune_dataset.jsonl") -> bool:
        """Valide le format du dataset"""
        print("🔍 Validation du dataset...")
        
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            exemples_valides = 0
            erreurs = []
            
            for i, line in enumerate(lines):
                try:
                    data = json.loads(line.strip())
                    
                    # Vérifier la structure OpenAI
                    if "messages" not in data:
                        erreurs.append(f"Ligne {i+1}: 'messages' manquant")
                        continue
                    
                    messages = data["messages"]
                    if len(messages) != 3:
                        erreurs.append(f"Ligne {i+1}: doit contenir exactement 3 messages")
                        continue
                    
                    # Vérifier les rôles
                    roles = [msg.get("role") for msg in messages]
                    if roles != ["system", "user", "assistant"]:
                        erreurs.append(f"Ligne {i+1}: rôles incorrects {roles}")
                        continue
                    
                    # Vérifier la longueur du contenu
                    for j, msg in enumerate(messages):
                        content = msg.get("content", "")
                        if len(content) < 10:
                            erreurs.append(f"Ligne {i+1}, message {j+1}: contenu trop court")
                            continue
                        if len(content) > 4000:  # Limite OpenAI
                            erreurs.append(f"Ligne {i+1}, message {j+1}: contenu trop long ({len(content)} chars)")
                            continue
                    
                    exemples_valides += 1
                    
                except json.JSONDecodeError:
                    erreurs.append(f"Ligne {i+1}: JSON invalide")
            
            print(f"✅ Exemples valides : {exemples_valides}/{len(lines)}")
            
            if erreurs:
                print(f"❌ {len(erreurs)} erreurs détectées :")
                for erreur in erreurs[:10]:  # Limiter l'affichage
                    print(f"   - {erreur}")
                if len(erreurs) > 10:
                    print(f"   ... et {len(erreurs)-10} autres erreurs")
                return False
            
            if exemples_valides < 10:
                print("❌ Pas assez d'exemples valides (minimum 10)")
                return False
            
            print("✅ Dataset valide pour le fine-tuning")
            return True
            
        except Exception as e:
            print(f"❌ Erreur lors de la validation : {e}")
            return False

    def upload_dataset(self, filename: str = "sogestmatic_finetune_dataset.jsonl") -> str:
        """Upload le dataset vers OpenAI"""
        print("📤 Upload du dataset vers OpenAI...")
        
        try:
            with open(filename, 'rb') as f:
                response = self.client.files.create(
                    file=f,
                    purpose='fine-tune'
                )
            
            file_id = response.id
            print(f"✅ Dataset uploadé : {file_id}")
            print(f"📊 Taille : {response.bytes} bytes")
            
            return file_id
            
        except Exception as e:
            print(f"❌ Erreur upload : {e}")
            return None

    def lancer_finetuning(self, file_id: str, model_suffix: str = "sogestmatic-v1") -> str:
        """Lance le fine-tuning"""
        print("🚀 Lancement du fine-tuning...")
        
        try:
            response = self.client.fine_tuning.jobs.create(
                training_file=file_id,
                model=self.base_model,
                suffix=model_suffix,
                hyperparameters={
                    "n_epochs": 3,  # Nombre d'époques (1-50)
                    "batch_size": "auto",  # Taille de batch automatique
                    "learning_rate_multiplier": "auto"  # Taux d'apprentissage auto
                }
            )
            
            job_id = response.id
            print(f"✅ Fine-tuning lancé : {job_id}")
            print(f"🎯 Modèle de base : {self.base_model}")
            print(f"📛 Suffixe : {model_suffix}")
            
            return job_id
            
        except Exception as e:
            print(f"❌ Erreur fine-tuning : {e}")
            return None

    def suivre_progression(self, job_id: str):
        """Suit la progression du fine-tuning"""
        print(f"👀 Suivi de la progression : {job_id}")
        
        try:
            while True:
                job = self.client.fine_tuning.jobs.retrieve(job_id)
                status = job.status
                
                print(f"📊 Status : {status}")
                
                if status == "succeeded":
                    print(f"🎉 Fine-tuning terminé avec succès !")
                    print(f"🤖 Modèle créé : {job.fine_tuned_model}")
                    
                    # Sauvegarder les informations du modèle
                    model_info = {
                        "job_id": job_id,
                        "model_id": job.fine_tuned_model,
                        "base_model": self.base_model,
                        "creation_date": time.strftime("%Y-%m-%d %H:%M:%S"),
                        "training_file": job.training_file
                    }
                    
                    with open("sogestmatic_model_info.json", "w") as f:
                        json.dump(model_info, f, indent=2)
                    
                    print("💾 Informations sauvegardées dans sogestmatic_model_info.json")
                    break
                    
                elif status == "failed":
                    print(f"❌ Fine-tuning échoué : {job.error}")
                    break
                    
                elif status in ["cancelled", "cancelled_by_user"]:
                    print("⏹️ Fine-tuning annulé")
                    break
                    
                else:
                    print("⏳ En cours... Vérification dans 30 secondes")
                    time.sleep(30)
                    
        except Exception as e:
            print(f"❌ Erreur suivi : {e}")

    def tester_modele(self, model_id: str, questions_test: List[str] = None):
        """Teste le modèle fine-tuné"""
        if not questions_test:
            questions_test = [
                "Quelles sanctions pour excès de vitesse poids lourd ?",
                "Tachygraphe en panne, que faire ?",
                "Formation FIMO obligatoire quand ?",
                "Transport matières dangereuses Paris autorisé ?"
            ]
        
        print(f"🧪 Test du modèle : {model_id}")
        
        for i, question in enumerate(questions_test, 1):
            print(f"\n📝 Test {i}: {question}")
            
            try:
                response = self.client.chat.completions.create(
                    model=model_id,
                    messages=[
                        {
                            "role": "system",
                            "content": "Tu es un expert juridique en transport routier français."
                        },
                        {
                            "role": "user",
                            "content": question
                        }
                    ],
                    max_tokens=500,
                    temperature=0.1
                )
                
                reponse = response.choices[0].message.content
                print(f"🤖 Réponse: {reponse[:200]}...")
                
            except Exception as e:
                print(f"❌ Erreur test : {e}")

    def process_complet(self, nb_exemples: int = 300):
        """Process complet de fine-tuning"""
        print("🎯 DÉMARRAGE DU FINE-TUNING SOGESTMATIC")
        print("="*50)
        
        # 1. Générer le dataset
        print("\n1️⃣ GÉNÉRATION DU DATASET")
        os.system("python3 fine_tuning_generator.py")
        
        # 2. Valider
        print("\n2️⃣ VALIDATION")
        if not self.valider_dataset():
            print("❌ Dataset invalide, arrêt du processus")
            return
        
        # 3. Upload
        print("\n3️⃣ UPLOAD")
        file_id = self.upload_dataset()
        if not file_id:
            print("❌ Upload échoué, arrêt du processus")
            return
        
        # 4. Fine-tuning
        print("\n4️⃣ FINE-TUNING")
        job_id = self.lancer_finetuning(file_id)
        if not job_id:
            print("❌ Lancement échoué, arrêt du processus")
            return
        
        # 5. Suivi
        print("\n5️⃣ SUIVI")
        self.suivre_progression(job_id)
        
        print("\n🎉 PROCESSUS TERMINÉ")

def main():
    """Fonction principale"""
    finetuner = SogestmaticFineTuner()
    
    print("🚛 SOGESTMATIC FINE-TUNER")
    print("Optimisation de ChatGPT pour l'expertise transport routier")
    print()
    
    choix = input("Choisissez une action :\n1. Processus complet\n2. Valider dataset existant\n3. Tester modèle existant\n> ")
    
    if choix == "1":
        nb_exemples = input("Nombre d'exemples (défaut 300) : ") or "300"
        finetuner.process_complet(int(nb_exemples))
        
    elif choix == "2":
        filename = input("Nom du fichier (défaut sogestmatic_finetune_dataset.jsonl) : ") or "sogestmatic_finetune_dataset.jsonl"
        finetuner.valider_dataset(filename)
        
    elif choix == "3":
        model_id = input("ID du modèle à tester : ")
        if model_id:
            finetuner.tester_modele(model_id)
        else:
            print("❌ ID modèle requis")
    
    else:
        print("❌ Choix invalide")

if __name__ == "__main__":
    main() 