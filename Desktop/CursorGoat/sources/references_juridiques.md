# 📚 SOURCES JURIDIQUES & STRATÉGIES DE COLLECTE
## Base de Données Tachygraphique - Sogestmatic

---

## 🏛️ SOURCES OFFICIELLES PRIORITAIRES

### 1. RÉGLEMENTATION EUROPÉENNE

#### **Règlement (UE) n° 165/2014** 
- **URL**: https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32014R0165
- **Contenu**: Tachygraphes dans les transports routiers
- **Collecte**: API EUR-Lex, scraping automatisé
- **Fréquence**: Mensuelle (mises à jour règlements délégués)

#### **Règlement (CEE) n° 3821/85** (abrogé mais jurisprudence)
- **URL**: https://eur-lex.europa.eu/legal-content/FR/ALL/?uri=CELEX:31985R3821
- **Contenu**: Ancien règlement tachygraphes
- **Collecte**: Archive historique
- **Importance**: Jurisprudence transition

#### **Directive 2006/22/CE** - Contrôles routiers
- **URL**: https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32006L0022
- **Contenu**: Conditions et modalités contrôles
- **Collecte**: Transposition nationale à vérifier

### 2. DROIT FRANÇAIS

#### **Code des transports**
- **Source**: Légifrance - https://www.legifrance.gouv.fr/codes/texte_lc/LEGITEXT000023086525
- **Articles clés**:
  - Partie réglementaire: R3312-1 à R3312-83
  - Partie législative: L3312-1 à L3312-8
- **API**: API Légifrance (accès professionnel)
- **Scraping**: Structure HTML stable

#### **Code de la route** (sanctions)
- **Articles**: R413-14 à R413-17 (sanctions spécifiques)
- **Barème**: Annexe I (montants amendes)

#### **Circulaires ministérielles**
- **Source**: Circulaires.gouv.fr
- **Exemple**: Circulaire DSCR/RT/DTIR/2015/123 du 15 avril 2015
- **Collecte**: RSS feed + scraping

---

## 🏢 SOURCES PROFESSIONNELLES SPÉCIALISÉES

### 1. ORGANISATIONS PATRONALES

#### **FNTR** - Fédération Nationale des Transports Routiers
- **Site**: https://www.fntr.fr
- **Ressources**:
  - Guides juridiques
  - Formations en ligne
  - Bulletins réglementaires
- **Contact**: service.juridique@fntr.fr
- **Partenariat**: Convention possible

#### **OTRE** - Organisation des Transporteurs Routiers Européens
- **Site**: https://www.otre.org
- **Spécialité**: Transport international
- **Publications**: Veille européenne

#### **TLF** - Transport Logistique de France
- **Site**: https://www.e-tlf.com
- **Focus**: Formations et certifications
- **Base de données**: Jurisprudence interne

### 2. ORGANISMES DE CONTRÔLE

#### **DREAL** (par région)
- **Exemple**: DREAL Île-de-France
- **URL**: http://www.driea.ile-de-france.developpement-durable.gouv.fr
- **Données**: Statistiques contrôles, PV types
- **Collecte**: Demande accès données publiques

#### **DGITM** - Direction Générale des Infrastructures
- **Site**: https://www.ecologie.gouv.fr/direction-generale-des-infrastructures-des-transports-et-mer-dgitm
- **Ressources**: Guides techniques, circulaires

---

## 🎓 SOURCES ACADÉMIQUES

### 1. UNIVERSITÉS SPÉCIALISÉES

#### **Université de Versailles Saint-Quentin** - Institut de Droit des Transports
- **Contact**: Pr. Laurent Fedi
- **Spécialité**: Droit européen des transports
- **Publications**: Revue de droit des transports

#### **Université Aix-Marseille** - Centre de Droit Maritime et des Transports
- **Site**: https://cdmt.univ-amu.fr
- **Expertise**: Sanctions administratives
- **Base**: Thèses récentes

### 2. REVUES JURIDIQUES

#### **Revue de Droit des Transports**
- **Éditeur**: LexisNexis
- **Abonnement**: ~800€/an
- **Contenu**: Jurisprudence, doctrine
- **Archive**: Depuis 1988

#### **Dalloz Transport**
- **Accès**: Dalloz.fr (abonnement)
- **Actualité**: Hebdomadaire
- **Expertise**: Annotations d'arrêts

---

## ⚖️ SOURCES JURISPRUDENTIELLES

### 1. COURS SUPRÊMES

#### **Cour de cassation - Chambre criminelle**
- **Site**: https://www.courdecassation.fr
- **API**: Judilibre (accès gratuit)
- **Mots-clés**: "tachygraphe", "temps de conduite", "transport routier"
- **Collecte**: Automatisée quotidienne

#### **Conseil d'État**
- **Site**: https://www.conseil-etat.fr
- **Base**: Arianeweb
- **Focus**: Sanctions administratives

### 2. COURS D'APPEL SPÉCIALISÉES

#### **Cour d'appel de Paris** (Pôle transport)
- **Spécialisation**: Infractions routières lourdes
- **Décisions**: Publiées sur Légifrance

#### **Cour administrative d'appel de Lyon**
- **Expertise**: Recours DREAL
- **Décisions types**: Retrait cartes conducteur

---

## 🔧 SOURCES TECHNIQUES

### 1. CONSTRUCTEURS TACHYGRAPHES

#### **Continental VDO**
- **Site**: https://www.continental-automotive.com
- **Documentation**: Manuels techniques
- **Support**: Base de connaissance SAV
- **Contact**: Département juridique

#### **Stoneridge Electronics**
- **Site**: https://www.stoneridge.com
- **Ressources**: Guides conformité
- **Formation**: Centres agréés

### 2. ORGANISMES DE CERTIFICATION

#### **UTAC** - Centre d'homologation
- **Site**: https://www.utac.com
- **Données**: Certificats d'homologation
- **Historique**: Evolution réglementaire

#### **DEKRA**
- **Spécialité**: Contrôles périodiques
- **Statistiques**: Taux de non-conformité

---

## 🌐 STRATÉGIES DE COLLECTE AUTOMATISÉE

### 1. WEB SCRAPING

#### **Configuration Scrapy**
```python
# robots.txt respecté
# rate limiting: 1 req/sec
# user-agent: Academic Research Bot
# pause aléatoire: 1-3s
```

#### **Sites prioritaires**
- Légifrance: structure stable, API disponible
- EUR-Lex: API officielle UE
- FNTR: Newsletter parsable
- Jurisprudence: Judilibre API

### 2. API OFFICIELLES

#### **API Légifrance**
- **Endpoint**: https://api.legifrance.gouv.fr
- **Authentification**: OAuth 2.0
- **Quotas**: 1000 req/jour (gratuit)
- **Documentation**: https://developer.aife.economie.gouv.fr

#### **Judilibre** (Cour de cassation)
- **Endpoint**: https://www.courdecassation.fr/toutes-les-decisions
- **Format**: JSON
- **Mise à jour**: Quotidienne

### 3. VEILLE AUTOMATISÉE

#### **RSS Feeds**
- Légifrance: https://www.legifrance.gouv.fr/rss
- EUR-Lex: https://eur-lex.europa.eu/content/news/news.rss
- Ministère Transports: Feed actualités

#### **Alertes Google**
- Mots-clés: "tachygraphe" + "nouvelle réglementation"
- Fréquence: Quotidienne
- Sources: Sites officiels uniquement

---

## 📊 PLAN DE COLLECTE PAR PHASES

### **PHASE 1: FOUNDATIONS** (Semaines 1-4)
1. **Réglementation de base**
   - Téléchargement corpus UE complet
   - Extraction Code des transports
   - Structuration base articles

2. **Jurisprudence historique**
   - Requêtes Judilibre 5 dernières années
   - Classification par type d'infraction
   - Extraction principes juridiques

### **PHASE 2: ENRICHISSEMENT** (Semaines 5-8)
1. **Sources professionnelles**
   - Partenariats FNTR, OTRE
   - Collecte guides pratiques
   - Procédures internes

2. **Données techniques**
   - Documentation constructeurs
   - Spécifications techniques
   - Modes de défaillance

### **PHASE 3: ACTUALISATION** (Semaines 9-12)
1. **Veille continue**
   - Mise en place robots
   - Alertes réglementaires
   - Intégration automatique

2. **Validation qualité**
   - Vérification experts
   - Tests cohérence
   - Correction anomalies

---

## 🤝 PARTENARIATS INSTITUTIONNELS

### 1. UNIVERSITÉS
- **Convention recherche** avec Université de Versailles
- **Accès archives** spécialisées transport
- **Stage étudiant** droit des transports

### 2. CABINETS D'AVOCATS
- **Cabinet Fromont-Briens** (spécialiste transport)
- **Cabinet Counsel** (droit européen)
- **Échange expertise** contre données

### 3. ORGANISMES PUBLICS
- **Convention DREAL** pour statistiques
- **Partenariat Ministère** pour veille réglementaire
- **Accès privilégié** bases internes

---

## 📈 MÉTRIQUES DE QUALITÉ

### 1. COMPLÉTUDE
- **Objectif**: 99% infractions couvertes
- **Métrique**: % articles référencés vs corpus total
- **Validation**: Audit expert annuel

### 2. FRAÎCHEUR
- **Réglementation**: Délai < 24h
- **Jurisprudence**: Délai < 7 jours
- **Doctrine**: Délai < 30 jours

### 3. PRÉCISION
- **Références**: 100% vérifiées
- **Citations**: Liens actifs
- **Cohérence**: Tests automatisés

---

## 💰 COÛTS ACQUISITION DONNÉES

### 1. ABONNEMENTS ANNUELS
- **Dalloz Transports**: 800€
- **LexisNexis**: 1,200€
- **API Légifrance Pro**: 500€
- **Revues spécialisées**: 600€
- **Total**: 3,100€/an

### 2. PARTENARIATS
- **Universités**: Échange expertise
- **Organismes publics**: Convention gratuite
- **Cabinets**: Barter system

### 3. DÉVELOPPEMENT
- **Scrapers**: 5 jours dev
- **API intégrations**: 8 jours dev
- **Maintenance**: 2j/mois

---

*Ce document sera mis à jour régulièrement selon l'évolution du projet et la découverte de nouvelles sources.* 