# 🚛 GUIDE FINE-TUNING SOGESTMATIC

Guide complet pour optimiser et fine-tuner ChatGPT pour l'expertise transport routier

## 🎯 **OBJECTIF**

Transformer ChatGPT en expert juridique spécialisé transport routier avec :
- **Précision juridique** maximale (références Légifrance exactes)
- **Gestion complète des exceptions** et cas particuliers
- **Réponses structurées** et pratiques
- **Performance** et rapidité optimales

---

## 📋 **ÉTAPES COMPLÈTES**

### **1. OPTIMISATION IMMÉDIATE (SANS FINE-TUNING)**

```bash
# L'API a déjà été optimisée avec :
# - Prompts améliorés (SOGEST-IA persona)
# - Analyse contextuelle intelligente
# - Structure de réponse en 6 parties
# - Gestion des exceptions renforcée

# Test immédiat des améliorations :
cd api
python3 test_performance.py
# Choisir "1. Test modèle actuel"
# Nom: "GPT-4o-mini-optimisé"
```

### **2. GÉNÉRATION DU DATASET DE FINE-TUNING**

```bash
cd api

# Générer 300 exemples de qualité
python3 fine_tuning_generator.py

# Fichier créé : sogestmatic_finetune_dataset.jsonl
# Format OpenAI avec système/user/assistant
```

**Contenu du dataset généré :**
- **300 exemples** question-réponse de haute qualité
- **4 types de questions** : sanctions, cas pratiques, prévention, réglementation
- **Contexte varié** : PTAC, zones, professionnel/particulier, dates
- **Réponses expertes** avec structure complète et exceptions

### **3. VALIDATION ET FINE-TUNING**

```bash
# Lancer le processus complet automatisé
python3 openai_finetuner.py

# Choisir "1. Processus complet"
# Le script va :
# 1. Générer le dataset
# 2. Le valider
# 3. L'uploader vers OpenAI
# 4. Lancer le fine-tuning
# 5. Suivre la progression
```

**Paramètres de fine-tuning :**
- **Modèle de base** : `gpt-4o-mini-2024-07-18`
- **Époques** : 3 (optimal pour éviter overfitting)
- **Coût estimé** : ~$15-25 pour 300 exemples
- **Durée** : 10-30 minutes selon charge OpenAI

### **4. INTÉGRATION DU MODÈLE FINE-TUNÉ**

Une fois le fine-tuning terminé, modifiez `api/main.py` :

```python
# Ligne ~24, remplacez :
client = OpenAI(api_key=openai_api_key)

# Par :
client = OpenAI(api_key=openai_api_key)
FINETUNED_MODEL = "ft:gpt-4o-mini-2024-07-18:votre-org:sogestmatic-v1:ID_MODELE"

# Ligne ~658, remplacez :
model="gpt-4o-mini",

# Par :
model=FINETUNED_MODEL if 'FINETUNED_MODEL' in globals() else "gpt-4o-mini",
```

### **5. TESTS ET ÉVALUATION**

```bash
# Test du modèle fine-tuné
python3 test_performance.py
# Choisir "1. Test modèle actuel"
# Nom: "GPT-4o-mini-finetuned"

# Comparaison avant/après
python3 test_performance.py
# Choisir "2. Comparer deux modèles"
# Fichier 1: test_performance_gpt-4o-mini-optimisé_*.json
# Fichier 2: test_performance_gpt-4o-mini-finetuned_*.json
```

---

## 📊 **CRITÈRES D'ÉVALUATION**

### **Métriques automatiques :**
1. **Précision juridique** (25%) : Références légales exactes
2. **Complétude** (20%) : Réponse complète avec toutes les sections
3. **Gestion exceptions** (20%) : Mention cas particuliers
4. **Structure** (15%) : Organisation claire et lisible
5. **Conseils pratiques** (10%) : Utilité des recommandations
6. **Clarté** (10%) : Compréhensibilité et longueur appropriée

### **Score cible :**
- **Avant optimisation** : ~0.400-0.600
- **Après optimisation prompts** : ~0.650-0.750
- **Après fine-tuning** : ~0.800-0.900

---

## ⚙️ **PARAMÈTRES AVANCÉS**

### **Configuration fine-tuning :**

```python
# Dans openai_finetuner.py, modifiez selon vos besoins :

hyperparameters={
    "n_epochs": 3,              # 1-50 (3 = optimal)
    "batch_size": "auto",       # ou 1, 2, 4, 8, 16
    "learning_rate_multiplier": "auto"  # ou 0.1, 0.2, 0.5, 1.0, 2.0
}

# Pour domaine très spécialisé :
"n_epochs": 5
"learning_rate_multiplier": 0.5

# Pour éviter overfitting :
"n_epochs": 2
"learning_rate_multiplier": 1.0
```

### **Amélioration du dataset :**

```python
# Dans fine_tuning_generator.py, augmentez la qualité :

nb_exemples = 500  # Plus d'exemples (coût plus élevé)

# Ajoutez des templates spécialisés :
"jurisprudence": [
    "Y a-t-il des décisions de justice récentes sur {titre_infraction} ?",
    "Comment les tribunaux appliquent-ils {titre_infraction} ?",
]

"procedure": [
    "Quelle procédure en cas de {titre_infraction} ?",
    "Comment contester une verbalisation pour {titre_infraction} ?",
]
```

---

## 🚀 **DÉPLOIEMENT ET MISE À JOUR**

### **1. Mise en production :**

```bash
# Redémarrer l'API avec le nouveau modèle
cd api
python3 main.py

# Vérifier le fonctionnement
curl -X POST http://127.0.0.1:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "Test modèle fine-tuné : sanctions tachygraphe défaillant ?"}'
```

### **2. Monitoring et amélioration continue :**

```bash
# Tests réguliers
python3 test_performance.py  # Chaque semaine

# Collecte de nouvelles données
# Ajoutez les questions fréquentes des utilisateurs au dataset

# Re-fine-tuning périodique (tous les 3-6 mois)
# Avec nouvelles jurisprudences et évolutions réglementaires
```

---

## 💰 **COÛTS ET OPTIMISATION**

### **Coûts OpenAI :**
- **Fine-tuning** : ~$0.008/1K tokens d'entraînement
- **Inférence** : 3x le prix du modèle de base
- **300 exemples** ≈ 150K tokens ≈ $1.20 entraînement
- **Usage mensuel** : Selon volume de requêtes

### **Optimisation des coûts :**
1. **Cache intelligent** : Éviter requêtes répétitives
2. **Fallback local** : Questions simples sans IA
3. **Batch processing** : Grouper les requêtes
4. **Monitoring usage** : Alertes sur dépassement

---

## 🛠️ **DÉPANNAGE**

### **Erreurs courantes :**

**1. Fine-tuning échoué :**
```bash
# Vérifier le dataset
python3 openai_finetuner.py
# Choisir "2. Valider dataset existant"

# Erreurs fréquentes :
# - Messages trop longs (>4000 chars)
# - Format JSON incorrect
# - Pas assez d'exemples (<10)
```

**2. Modèle non disponible :**
```python
# Vérifier l'ID du modèle fine-tuné
from openai import OpenAI
client = OpenAI()
models = client.models.list()
for model in models.data:
    if 'sogestmatic' in model.id:
        print(model.id)
```

**3. Performance dégradée :**
```bash
# Revenir au modèle de base temporairement
# Dans main.py :
model="gpt-4o-mini",  # Au lieu du modèle fine-tuné

# Analyse des logs pour identifier le problème
```

---

## 📈 **RÉSULTATS ATTENDUS**

### **Amélioration des performances :**
- **+30-50%** précision juridique
- **+40-60%** gestion des exceptions
- **+20-30%** structure des réponses
- **Temps de réponse** similaire ou légèrement plus lent

### **Bénéfices utilisateur :**
- Réponses plus précises et complètes
- Meilleure prise en compte des cas particuliers
- Conseils pratiques plus pertinents
- Confiance accrue dans les réponses

---

## 🔄 **MAINTENANCE ET ÉVOLUTION**

### **Cycle de mise à jour (recommandé) :**
1. **Mensuel** : Tests de performance
2. **Trimestriel** : Analyse des nouvelles questions utilisateurs
3. **Semestriel** : Mise à jour dataset avec nouvelles réglementations
4. **Annuel** : Re-fine-tuning complet avec dataset enrichi

### **Veille réglementaire :**
- Abonnement alertes Légifrance
- Suivi modifications Code des transports
- Intégration nouvelles directives UE
- Mise à jour sanctions et barèmes

---

## 📞 **SUPPORT**

En cas de problème :
1. Vérifier les logs API (`python3 main.py`)
2. Tester avec `test_performance.py`
3. Consulter la documentation OpenAI fine-tuning
4. Contacter le support technique si nécessaire

**🎯 Objectif final :** Assistant juridique de niveau expert capable de rivaliser avec un consultant spécialisé transport routier. 