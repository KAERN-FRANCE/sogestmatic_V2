# 🎤 Configuration OpenAI pour Transcription

## 📋 **Étapes de configuration :**

### **1. Obtenir une clé API OpenAI**
1. Allez sur [OpenAI Platform](https://platform.openai.com/)
2. Créez un compte ou connectez-vous
3. Allez dans "API Keys" 
4. Cliquez sur "Create new secret key"
5. Copiez votre clé API (commence par `sk-`)

### **2. Configurer la clé API dans l'application**
1. Ouvrez le fichier `src/config/api.js`
2. Remplacez `sk-your-openai-api-key-here` par votre vraie clé API :

```javascript
export const OPENAI_API_KEY = 'sk-votre-vraie-cle-api-ici';
```

### **3. Permissions requises**
L'application demandera automatiquement les permissions :
- **Microphone** : Pour l'enregistrement audio
- **Stockage** : Pour sauvegarder les fichiers temporaires

## 🚀 **Fonctionnalités intégrées :**

### **🎙️ Enregistrement audio réel**
- Enregistrement haute qualité avec `expo-av`
- Gestion des permissions microphone
- Sauvegarde temporaire des fichiers audio

### **🤖 Transcription OpenAI Whisper**
- Transcription automatique en français
- Support de l'audio haute qualité
- Gestion des erreurs de connexion

### **🧠 Analyse intelligente GPT-4**
- Extraction automatique des données clés :
  - Nom de l'entreprise
  - Secteur d'activité
  - Nombre d'employés
  - Localisation souhaitée
  - Engagements RSE
  - Contact et coordonnées
  - Investissement prévu

### **📊 Scoring automatique**
- Évaluation sur 3 critères (Économique, RSE, Territorial)
- Score global de 0 à 100
- Résumé automatique généré par l'IA

## 💰 **Coûts estimés OpenAI :**

### **Whisper (Transcription)**
- **$0.006 par minute** d'audio
- Exemple : 30 min d'entretien = ~$0.18

### **GPT-4 (Analyse)**
- **$0.03 par 1K tokens** (input)
- **$0.06 par 1K tokens** (output)
- Exemple : Analyse complète = ~$0.10-0.20

### **Total par entretien : ~$0.30-0.40**

## 🔧 **Test de l'intégration :**

1. **Démarrez l'application** : `npm start`
2. **Connectez-vous** avec Expo Go
3. **Testez l'enregistrement** :
   - Appuyez sur le bouton d'enregistrement
   - Parlez pendant 10-15 secondes
   - Arrêtez l'enregistrement
4. **Vérifiez la transcription** automatique
5. **Consultez les données extraites** par l'IA

## ⚠️ **Points importants :**

- **Connexion internet requise** pour l'API OpenAI
- **Clé API valide** nécessaire
- **Permissions microphone** sur l'appareil
- **Qualité audio** : Parlez clairement pour une meilleure transcription

## 🎯 **Flux complet :**

1. **Enregistrement** → Audio haute qualité
2. **Transcription** → Whisper API (français)
3. **Analyse** → GPT-4 extrait les données
4. **Scoring** → Évaluation automatique
5. **Résultat** → Interface utilisateur complète

L'application est maintenant entièrement fonctionnelle avec l'IA ! 🚀
