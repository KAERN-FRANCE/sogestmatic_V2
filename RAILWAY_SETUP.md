# 🚀 Configuration Railway pour Sogestmatic

## Variables d'environnement requises sur Railway

### 1. Configuration OpenAI (OBLIGATOIRE)
```
OPENAI_API_KEY=sk-proj-votre_cle_openai_ici
MODEL=gpt-5-mini
```

### 2. Configuration Firebase (OBLIGATOIRE)
```
NEXT_PUBLIC_USE_FIREBASE=true
NEXT_PUBLIC_FIREBASE_API_KEY=votre_cle_firebase_api
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre_projet.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre_projet_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre_projet.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=votre_app_id
```

### 3. Configuration Tavily (pour la recherche web - OPTIONNEL)
```
TAVILY_API_KEY=tvly-dev-votre_cle_tavily
```

### 4. Configuration RAG (OPTIONNEL)
```
RAG_K=5
RAG_INTENT_THRESHOLD=0.35
EMBEDDING_MODEL=text-embedding-3-small
```

## 🔧 Comment configurer sur Railway

1. **Aller sur votre projet Railway**
2. **Cliquer sur "Variables"** dans le menu de gauche
3. **Ajouter chaque variable** une par une avec les valeurs correctes
4. **Redéployer** l'application

## 🐛 Diagnostic

Pour vérifier que tout fonctionne, visitez :
```
https://votre-app.railway.app/api/debug
```

Cette page vous montrera :
- ✅ Quelles variables sont configurées
- ❌ Quelles variables manquent
- 🤖 Quel modèle est utilisé
- 🔍 Si la recherche web est disponible

## 📋 Checklist de déploiement

- [ ] `OPENAI_API_KEY` configurée
- [ ] `MODEL=gpt-5-mini` configuré
- [ ] Variables Firebase configurées
- [ ] `TAVILY_API_KEY` configurée (pour recherche web)
- [ ] Application redéployée
- [ ] Test via `/api/debug`

## 🚨 Problèmes courants

### L'IA n'utilise pas GPT-5
- Vérifier que `MODEL=gpt-5-mini` est bien configuré
- Redéployer après modification des variables

### La recherche web ne fonctionne pas
- Vérifier que `TAVILY_API_KEY` est configurée
- Vérifier que `useWebSearch=true` est envoyé dans les requêtes

### Erreurs d'authentification
- Vérifier que `OPENAI_API_KEY` est correcte
- Vérifier que la clé a les bonnes permissions

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez `/api/debug` pour le diagnostic
2. Consultez les logs Railway
3. Vérifiez que toutes les variables sont correctement configurées
