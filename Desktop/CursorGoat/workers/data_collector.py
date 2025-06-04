"""
Worker de Collecte Automatisée de Données Juridiques
Sogestmatic - Mission Stage

Ce worker collecte automatiquement les données depuis les sources officielles :
- API Légifrance
- EUR-Lex
- Judilibre (Cour de cassation)
- Veille réglementaire automatisée
"""

import asyncio
import aiohttp
import asyncpg
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import xml.etree.ElementTree as ET
import json
import re
from bs4 import BeautifulSoup
import os
from dataclasses import dataclass
from enum import Enum

# Configuration logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SourceType(Enum):
    LEGIFRANCE = "legifrance"
    EUR_LEX = "eur_lex"
    JUDILIBRE = "judilibre"
    DREAL = "dreal"
    FNTR = "fntr"

@dataclass
class CollectedDocument:
    source: SourceType
    document_id: str
    title: str
    content: str
    url: str
    publication_date: datetime
    document_type: str
    metadata: Dict[str, Any]
    relevance_score: float = 0.0

class DataCollector:
    """Collecteur principal de données juridiques"""
    
    def __init__(self):
        self.db_url = os.getenv("DATABASE_URL")
        self.session: Optional[aiohttp.ClientSession] = None
        self.legifrance_token = os.getenv("LEGIFRANCE_API_TOKEN")
        
        # Mots-clés pour filtrer la pertinence
        self.keywords_tachygraphe = [
            "tachygraphe", "temps de conduite", "repos conducteur", 
            "transport routier", "chronotachygraphe", "carte conducteur",
            "règlement 165/2014", "R3312", "L3312", "contrôle routier"
        ]
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={
                "User-Agent": "Sogestmatic-TachygrapheBot/1.0 (Research Purpose)"
            }
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()

    async def get_db_connection(self):
        """Connexion à la base de données"""
        return await asyncpg.connect(self.db_url)

    def calculate_relevance(self, text: str, title: str = "") -> float:
        """Calcule un score de pertinence basé sur les mots-clés"""
        text_lower = (text + " " + title).lower()
        score = 0.0
        
        for keyword in self.keywords_tachygraphe:
            count = text_lower.count(keyword.lower())
            if keyword in ["tachygraphe", "chronotachygraphe"]:
                score += count * 3.0  # Mots-clés principaux
            elif keyword in ["règlement 165/2014", "R3312", "L3312"]:
                score += count * 2.0  # Références légales importantes
            else:
                score += count * 1.0  # Mots-clés secondaires
        
        # Normalisation (score max arbitraire de 20)
        return min(score / 20.0, 1.0)

    async def collect_legifrance_data(self) -> List[CollectedDocument]:
        """Collecte depuis l'API Légifrance"""
        logger.info("🇫🇷 Collecte Légifrance...")
        documents = []
        
        if not self.legifrance_token:
            logger.warning("Token Légifrance manquant, simulation avec données statiques")
            return await self._simulate_legifrance_data()
        
        try:
            # Recherche dans le Code des transports
            api_url = "https://api.legifrance.gouv.fr/dila/legifrance-beta/search"
            
            search_queries = [
                "tachygraphe transport routier",
                "temps de conduite R3312",
                "repos conducteur L3312",
                "contrôle tachygraphe"
            ]
            
            for query in search_queries:
                params = {
                    "query": query,
                    "type": ["CODE", "JURI"],
                    "fond": "ALL",
                    "champ": "ALL",
                    "sort": "PERTINENCE",
                    "pageSize": 20
                }
                
                headers = {
                    "Authorization": f"Bearer {self.legifrance_token}",
                    "Content-Type": "application/json"
                }
                
                async with self.session.post(api_url, json=params, headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        for result in data.get("results", []):
                            doc = CollectedDocument(
                                source=SourceType.LEGIFRANCE,
                                document_id=result.get("id", ""),
                                title=result.get("title", ""),
                                content=result.get("content", ""),
                                url=result.get("url", ""),
                                publication_date=self._parse_date(result.get("dateTexte")),
                                document_type=result.get("nature", ""),
                                metadata=result,
                                relevance_score=self.calculate_relevance(
                                    result.get("content", ""), 
                                    result.get("title", "")
                                )
                            )
                            
                            if doc.relevance_score > 0.1:  # Seuil de pertinence
                                documents.append(doc)
                    
                    await asyncio.sleep(1)  # Rate limiting
            
        except Exception as e:
            logger.error(f"Erreur collecte Légifrance: {e}")
        
        logger.info(f"✅ {len(documents)} documents Légifrance collectés")
        return documents

    async def _simulate_legifrance_data(self) -> List[CollectedDocument]:
        """Simulation de données Légifrance pour développement"""
        return [
            CollectedDocument(
                source=SourceType.LEGIFRANCE,
                document_id="LEGIARTI000029528756",
                title="Article R3312-1 du Code des transports",
                content="La durée de conduite journalière ne peut excéder neuf heures...",
                url="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000029528756",
                publication_date=datetime(2014, 6, 11),
                document_type="CODE",
                metadata={"source_officielle": True},
                relevance_score=0.95
            ),
            CollectedDocument(
                source=SourceType.LEGIFRANCE,
                document_id="LEGIARTI000029528800",
                title="Article R3312-58 du Code des transports",
                content="Le tachygraphe doit être utilisé conformément aux dispositions...",
                url="https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000029528800",
                publication_date=datetime(2015, 5, 2),
                document_type="CODE",
                metadata={"source_officielle": True},
                relevance_score=0.90
            )
        ]

    async def collect_eur_lex_data(self) -> List[CollectedDocument]:
        """Collecte depuis EUR-Lex (réglementation européenne)"""
        logger.info("🇪🇺 Collecte EUR-Lex...")
        documents = []
        
        try:
            # API EUR-Lex pour les tachygraphes
            api_url = "https://eur-lex.europa.eu/search.html"
            
            search_terms = [
                "tachograph regulation 165/2014",
                "driving time transport",
                "digital tachograph"
            ]
            
            for term in search_terms:
                params = {
                    "qid": "1640995200000",
                    "text": term,
                    "scope": "EURLEX",
                    "type": "advanced",
                    "lang": "en",
                    "SUBDOM_INIT": "LEGISLATION,CASE_LAW"
                }
                
                # Note: EUR-Lex n'a pas d'API REST officielle,
                # utilisation du scraping respectueux
                async with self.session.get(api_url, params=params) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'html.parser')
                        
                        # Extraction des résultats (structure simplifiée)
                        for result in soup.find_all('div', class_='SearchResult')[:5]:
                            title_elem = result.find('a', class_='title')
                            if title_elem:
                                doc = CollectedDocument(
                                    source=SourceType.EUR_LEX,
                                    document_id=self._extract_celex_number(title_elem.get('href', '')),
                                    title=title_elem.text.strip(),
                                    content=self._extract_summary(result),
                                    url=f"https://eur-lex.europa.eu{title_elem.get('href', '')}",
                                    publication_date=self._extract_date_from_result(result),
                                    document_type="REGULATION",
                                    metadata={"source": "EUR-Lex"},
                                    relevance_score=self.calculate_relevance(
                                        self._extract_summary(result),
                                        title_elem.text
                                    )
                                )
                                
                                if doc.relevance_score > 0.2:
                                    documents.append(doc)
                
                await asyncio.sleep(2)  # Respect du rate limiting
                
        except Exception as e:
            logger.error(f"Erreur collecte EUR-Lex: {e}")
        
        logger.info(f"✅ {len(documents)} documents EUR-Lex collectés")
        return documents

    async def collect_judilibre_data(self) -> List[CollectedDocument]:
        """Collecte jurisprudence depuis Judilibre"""
        logger.info("⚖️ Collecte Judilibre...")
        documents = []
        
        try:
            # API Judilibre de la Cour de cassation
            api_url = "https://jurinet-search.courdecassation.fr/search"
            
            search_params = {
                "query": "tachygraphe OR \"temps de conduite\" OR \"transport routier\"",
                "field": ["JURIDICTION", "DATE_DEC", "FORMATION", "NUMERO"],
                "operator": "and",
                "type": "ALL",
                "sort": "date",
                "order": "desc",
                "page": 0,
                "pageSize": 50
            }
            
            async with self.session.post(api_url, json=search_params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    for decision in data.get("results", []):
                        doc = CollectedDocument(
                            source=SourceType.JUDILIBRE,
                            document_id=decision.get("ID", ""),
                            title=f"{decision.get('JURIDICTION', '')} - {decision.get('NUMERO', '')}",
                            content=decision.get("TEXTE_ARRET", ""),
                            url=f"https://www.courdecassation.fr/decision/{decision.get('ID', '')}",
                            publication_date=self._parse_date(decision.get("DATE_DEC")),
                            document_type="ARRET",
                            metadata={
                                "juridiction": decision.get("JURIDICTION"),
                                "formation": decision.get("FORMATION"),
                                "numero": decision.get("NUMERO")
                            },
                            relevance_score=self.calculate_relevance(
                                decision.get("TEXTE_ARRET", ""),
                                decision.get("SOMMAIRE", "")
                            )
                        )
                        
                        if doc.relevance_score > 0.15:
                            documents.append(doc)
                            
        except Exception as e:
            logger.error(f"Erreur collecte Judilibre: {e}")
        
        logger.info(f"✅ {len(documents)} décisions Judilibre collectées")
        return documents

    async def collect_professional_sources(self) -> List[CollectedDocument]:
        """Collecte depuis sources professionnelles (FNTR, OTRE, etc.)"""
        logger.info("🏢 Collecte sources professionnelles...")
        documents = []
        
        sources = [
            {
                "name": "FNTR",
                "base_url": "https://www.fntr.fr",
                "rss_url": "https://www.fntr.fr/rss.xml",
                "search_paths": ["/reglementation", "/actualites"]
            },
            {
                "name": "OTRE", 
                "base_url": "https://www.otre.org",
                "search_paths": ["/veille-reglementaire", "/publications"]
            }
        ]
        
        for source in sources:
            try:
                # Collecte via RSS si disponible
                if "rss_url" in source:
                    docs = await self._collect_from_rss(source)
                    documents.extend(docs)
                
                # Scraping des pages spécialisées
                for path in source["search_paths"]:
                    url = source["base_url"] + path
                    docs = await self._scrape_professional_page(url, source["name"])
                    documents.extend(docs)
                    
                await asyncio.sleep(3)  # Politesse
                
            except Exception as e:
                logger.error(f"Erreur collecte {source['name']}: {e}")
        
        logger.info(f"✅ {len(documents)} documents professionnels collectés")
        return documents

    async def _collect_from_rss(self, source: Dict) -> List[CollectedDocument]:
        """Collecte depuis flux RSS"""
        documents = []
        
        try:
            async with self.session.get(source["rss_url"]) as response:
                if response.status == 200:
                    xml_content = await response.text()
                    root = ET.fromstring(xml_content)
                    
                    for item in root.findall(".//item")[:10]:  # Limiter à 10 items
                        title = item.find("title")
                        link = item.find("link")
                        description = item.find("description")
                        pub_date = item.find("pubDate")
                        
                        if title is not None and link is not None:
                            doc = CollectedDocument(
                                source=SourceType.FNTR,
                                document_id=link.text,
                                title=title.text,
                                content=description.text if description is not None else "",
                                url=link.text,
                                publication_date=self._parse_rss_date(pub_date.text if pub_date is not None else ""),
                                document_type="ARTICLE",
                                metadata={"source": source["name"]},
                                relevance_score=self.calculate_relevance(
                                    description.text if description is not None else "",
                                    title.text
                                )
                            )
                            
                            if doc.relevance_score > 0.1:
                                documents.append(doc)
                                
        except Exception as e:
            logger.error(f"Erreur RSS {source['name']}: {e}")
        
        return documents

    async def save_documents(self, documents: List[CollectedDocument]):
        """Sauvegarde les documents collectés en base"""
        if not documents:
            return
        
        conn = await self.get_db_connection()
        
        try:
            # Insertion en base avec gestion des doublons
            for doc in documents:
                await conn.execute("""
                    INSERT INTO veille_reglementaire 
                    (date_publication, source, titre, resume, url_source, statut)
                    VALUES ($1, $2, $3, $4, $5, 'en_cours')
                    ON CONFLICT (url_source) DO UPDATE SET
                        date_publication = EXCLUDED.date_publication,
                        resume = EXCLUDED.resume,
                        statut = 'mis_a_jour'
                """, 
                doc.publication_date,
                doc.source.value,
                doc.title,
                doc.content[:1000],  # Limiter la taille
                doc.url
                )
            
            logger.info(f"💾 {len(documents)} documents sauvegardés")
            
        except Exception as e:
            logger.error(f"Erreur sauvegarde: {e}")
        finally:
            await conn.close()

    async def run_collection_cycle(self):
        """Cycle complet de collecte"""
        logger.info("🚀 Début cycle de collecte...")
        
        all_documents = []
        
        # Collecte parallèle des différentes sources
        tasks = [
            self.collect_legifrance_data(),
            self.collect_eur_lex_data(),
            self.collect_judilibre_data(),
            self.collect_professional_sources()
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in results:
            if isinstance(result, list):
                all_documents.extend(result)
            elif isinstance(result, Exception):
                logger.error(f"Erreur lors de la collecte: {result}")
        
        # Tri par pertinence
        all_documents.sort(key=lambda x: x.relevance_score, reverse=True)
        
        # Filtrage des documents les plus pertinents
        relevant_documents = [doc for doc in all_documents if doc.relevance_score > 0.2]
        
        await self.save_documents(relevant_documents)
        
        logger.info(f"✅ Cycle terminé: {len(relevant_documents)} documents pertinents collectés")
        
        return relevant_documents

    # Méthodes utilitaires
    def _parse_date(self, date_str: Optional[str]) -> datetime:
        """Parse une date depuis différents formats"""
        if not date_str:
            return datetime.now()
        
        formats = [
            "%Y-%m-%d",
            "%d/%m/%Y", 
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%d %H:%M:%S"
        ]
        
        for fmt in formats:
            try:
                return datetime.strptime(date_str[:len(fmt)], fmt)
            except ValueError:
                continue
        
        return datetime.now()

    def _parse_rss_date(self, date_str: str) -> datetime:
        """Parse date format RSS"""
        try:
            from email.utils import parsedate_to_datetime
            return parsedate_to_datetime(date_str)
        except:
            return datetime.now()

    def _extract_celex_number(self, url: str) -> str:
        """Extrait le numéro CELEX depuis une URL EUR-Lex"""
        match = re.search(r'uri=CELEX:([0-9]+[A-Z]+[0-9]+)', url)
        return match.group(1) if match else url

    def _extract_summary(self, soup_element) -> str:
        """Extrait le résumé depuis un élément BeautifulSoup"""
        summary = soup_element.find('div', class_='summary')
        return summary.text.strip() if summary else ""

    def _extract_date_from_result(self, soup_element) -> datetime:
        """Extrait la date depuis un résultat de recherche"""
        date_elem = soup_element.find('span', class_='date')
        if date_elem:
            return self._parse_date(date_elem.text.strip())
        return datetime.now()

    async def _scrape_professional_page(self, url: str, source_name: str) -> List[CollectedDocument]:
        """Scrape une page professionnelle"""
        documents = []
        
        try:
            async with self.session.get(url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Extraction générique des articles/actualités
                    articles = soup.find_all(['article', 'div'], class_=re.compile(r'(article|news|post)'))
                    
                    for article in articles[:5]:  # Limiter
                        title_elem = article.find(['h1', 'h2', 'h3'])
                        link_elem = article.find('a')
                        content_elem = article.find(['p', 'div'], class_=re.compile(r'(content|summary|excerpt)'))
                        
                        if title_elem and link_elem:
                            doc = CollectedDocument(
                                source=SourceType.FNTR,
                                document_id=link_elem.get('href', ''),
                                title=title_elem.text.strip(),
                                content=content_elem.text.strip() if content_elem else "",
                                url=link_elem.get('href', ''),
                                publication_date=datetime.now(),
                                document_type="ARTICLE",
                                metadata={"source": source_name},
                                relevance_score=self.calculate_relevance(
                                    content_elem.text if content_elem else "",
                                    title_elem.text
                                )
                            )
                            
                            if doc.relevance_score > 0.1:
                                documents.append(doc)
                                
        except Exception as e:
            logger.error(f"Erreur scraping {url}: {e}")
        
        return documents


async def main():
    """Point d'entrée principal du worker"""
    logger.info("🤖 Démarrage du worker de collecte de données")
    
    async with DataCollector() as collector:
        # Cycle de collecte initial
        documents = await collector.run_collection_cycle()
        
        logger.info(f"📊 Résumé: {len(documents)} documents collectés au total")
        
        # Affichage des documents les plus pertinents
        top_documents = sorted(documents, key=lambda x: x.relevance_score, reverse=True)[:5]
        
        for i, doc in enumerate(top_documents, 1):
            logger.info(f"  {i}. {doc.title} (Score: {doc.relevance_score:.2f}) - {doc.source.value}")

if __name__ == "__main__":
    asyncio.run(main()) 