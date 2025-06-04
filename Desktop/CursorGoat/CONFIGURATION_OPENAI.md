# Configuration OpenAI pour Sogestmatic

## 🎯 Objectif

Pour utiliser pleinement les fonctionnalités de chat IA juridique, vous devez configurer votre clé API OpenAI.

## 📋 Étapes de configuration

### 1. Obtenir une clé API OpenAI

1. Rendez-vous sur [OpenAI Platform](https://platform.openai.com/api-keys)
2. Connectez-vous ou créez un compte
3. Cliquez sur "Create new secret key"
4. Copiez votre clé (format: `sk-...`)

### 2. Configurer la variable d'environnement

#### Option A: Fichier .env (recommandé)
Créez un fichier `.env` dans le dossier `api/` :

```bash
cd api
echo "OPENAI_API_KEY=sk-votre-clé-ici" > .env
```

#### Option B: Variable d'environnement système
```bash
export OPENAI_API_KEY=sk-votre-clé-ici
```

### 3. Redémarrer l'API

```bash
cd api
python3 main.py
```

## ✅ Vérification

Vous devriez voir ce message au démarrage :
```
🤖 OpenAI configuré avec succès
```

## 🧪 Test du chat

```bash
curl -X POST "http://127.0.0.1:8000/chat" \
  -H "Content-Type: application/json" \
  -d '{"question": "Quelles sont les obligations du tachygraphe numérique?"}'
```

## ⚠️ Fonctionnement actuel

**SANS OpenAI configuré :**
- ❌ Erreur 503 "Service d'IA temporairement indisponible"
- Le système ne fournit PAS de fallback local (comme demandé)

**AVEC OpenAI configuré :**
- ✅ ChatGPT utilise sa base de données Légifrance intégrée
- ✅ Complète avec les infractions trouvées dans notre base locale
- ✅ Si ChatGPT est indisponible, recherche web automatique

## 💰 Coûts OpenAI

- GPT-4 : ~$0.03/1K tokens (entrée) + ~$0.06/1K tokens (sortie)
- Une question = ~$0.01-0.05
- Budget recommandé : $10-20/mois pour usage normal

## 🔧 Dépannage

Si vous voyez encore l'erreur après configuration :
1. Vérifiez le format de la clé (`sk-...`)
2. Redémarrez complètement l'API
3. Vérifiez vos crédits OpenAI
4. Testez la clé avec l'API OpenAI directement 