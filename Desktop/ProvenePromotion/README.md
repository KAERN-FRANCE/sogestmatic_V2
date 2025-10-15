# Provence AI Assistant

Une application mobile React Native + Expo pour les agents de développement économique de la région Provence-Alpes-Côte d'Azur.

## 🎯 Objectif

Permettre aux agents de développement d'enregistrer, transcrire et analyser leurs conversations avec les entreprises pour remplir automatiquement leur CRM et déclencher un scoring.

## 🎨 Design

Interface inspirée de l'identité visuelle Invest in Provence :
- Couleurs : Bleu #004B8D, Blanc, Rose doux #FFB6C1
- Design moderne et élégant avec des cartes arrondies
- Typographie minimaliste (Inter/SF Pro)
- Optimisé pour iPhone 15 Pro

## 📱 Écrans

### 1. Accueil / Dashboard
- Salutation personnalisée
- Cartes de statistiques (entretiens, projets scorés, moyenne)
- Bouton "Nouvel Entretien"
- Liste des derniers prospects avec statuts

### 2. Enregistrement
- Bouton d'enregistrement circulaire animé
- Visualisation de forme d'onde animée
- Timer et statut de transcription
- Instructions contextuelles

### 3. Transcription
- Affichage du texte transcrit
- Mise en évidence des données clés (Entreprise, Secteur, Emplois, RSE, Localisation)
- Bouton d'analyse de conversation

### 4. Révision & Édition
- Champs pré-remplis avec données extraites
- Sélection du sentiment (😀 / 😐 / 🤔)
- Bouton de validation et envoi au CRM

### 5. Résultat du Scoring
- Jauge circulaire colorée (0-100)
- Sous-sections : Économique, RSE, Territorial
- Résumé automatique
- Bouton de relance du scoring

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Démarrer l'application
npm start

# Lancer sur iOS
npm run ios

# Lancer sur Android
npm run android
```

## 🛠 Technologies

- **React Native** + **Expo**
- **React Navigation** (Bottom Tabs + Stack)
- **Expo Vector Icons**
- **StyleSheet** pour le styling
- **Animated API** pour les animations

## 📁 Structure du projet

```
src/
├── navigation/
│   └── AppNavigator.js
├── screens/
│   ├── HomeScreen.js
│   ├── RecordingScreen.js
│   ├── TranscriptionScreen.js
│   ├── ReviewScreen.js
│   ├── ScoringScreen.js
│   ├── HistoryScreen.js
│   └── SettingsScreen.js
└── theme/
    ├── colors.js
    ├── typography.js
    ├── spacing.js
    └── index.js
```

## 🎨 Thème et Couleurs

### Couleurs Provence
- **Primaire** : #004B8D (Bleu)
- **Accent** : #FFB6C1 (Rose doux)
- **Blanc** : #FFFFFF
- **Arrière-plan** : #F8F9FA

### Statuts des leads
- **Chaud** : Rouge (#EF4444)
- **À relancer** : Orange (#F59E0B)
- **Froid** : Gris (#6B7280)

## ✨ Fonctionnalités

- ✅ Navigation fluide entre écrans
- ✅ Animations et transitions
- ✅ Toggle multilingue (FR/EN)
- ✅ Interface responsive
- ✅ Données mockées réalistes
- ✅ Design system cohérent

## 📱 Compatibilité

- **Plateforme cible** : iPhone 15 Pro
- **Ratio d'écran** : Optimisé pour les dimensions iPhone 15 Pro
- **Navigation** : Bottom tabs + Stack navigation

## 🔄 Flux utilisateur

1. **Accueil** → Voir les statistiques et derniers prospects
2. **Enregistrement** → Démarrer un nouvel entretien
3. **Transcription** → Vérifier et corriger la transcription
4. **Révision** → Éditer les données extraites
5. **Scoring** → Consulter le résultat du scoring

---

*Développé avec ❤️ pour Invest in Provence*