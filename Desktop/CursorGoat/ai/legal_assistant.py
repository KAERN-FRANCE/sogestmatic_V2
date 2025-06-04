"""
Assistant Juridique IA Avancé - Tachygraphes
Sogestmatic - Mission Stage

Assistant intelligent utilisant GPT-4/Claude pour l'analyse juridique
et le conseil en matière de réglementation tachygraphique.
"""

import openai
import asyncio
import asyncpg
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
import json
import os
from pathlib import Path
import re
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate, SystemMessagePromptTemplate, HumanMessagePromptTemplate
from langchain.schema import BaseOutputParser
from langchain.chains import LLMChain
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.memory import ConversationBufferWindowMemory

# Configuration logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AnalysisType(Enum):
    SITUATION_ANALYSIS = "analyse_situation"
    LEGAL_CONSULTATION = "consultation_juridique"
    COMPLIANCE_AUDIT = "audit_conformite"
    RISK_ASSESSMENT = "evaluation_risques"
    PROCEDURE_GUIDANCE = "guidance_procedure"

class ConfidenceLevel(Enum):
    VERY_HIGH = (0.9, 1.0, "Très élevé")
    HIGH = (0.7, 0.9, "Élevé")
    MEDIUM = (0.5, 0.7, "Moyen")
    LOW = (0.3, 0.5, "Faible")
    VERY_LOW = (0.0, 0.3, "Très faible")

@dataclass
class LegalContext:
    """Contexte juridique pour une analyse"""
    regulation_references: List[str] = field(default_factory=list)
    case_law: List[str] = field(default_factory=list)
    procedural_rules: List[str] = field(default_factory=list)
    sanctions_framework: Dict[str, Any] = field(default_factory=dict)
    exceptions_conditions: List[str] = field(default_factory=list)

@dataclass
class AIAnalysisResult:
    """Résultat d'analyse IA"""
    analysis_type: AnalysisType
    legal_assessment: str
    infractions_identified: List[Dict[str, Any]]
    recommendations: List[str]
    procedural_steps: List[str]
    risk_level: str
    confidence_score: float
    legal_context: LegalContext
    citations: List[str] = field(default_factory=list)
    alternative_interpretations: List[str] = field(default_factory=list)
    follow_up_questions: List[str] = field(default_factory=list)

class LegalKnowledgeBase:
    """Base de connaissances juridiques vectorisée"""
    
    def __init__(self, db_url: str):
        self.db_url = db_url
        self.embeddings = OpenAIEmbeddings()
        self.vector_store: Optional[FAISS] = None
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", ".", "!", "?", ",", " ", ""]
        )
    
    async def initialize(self):
        """Initialise la base de connaissances vectorielle"""
        logger.info("🧠 Initialisation de la base de connaissances juridiques...")
        
        # Chargement des textes juridiques depuis la base de données
        legal_texts = await self._load_legal_texts()
        
        # Découpage en chunks
        docs = []
        for text_data in legal_texts:
            chunks = self.text_splitter.split_text(text_data['content'])
            for chunk in chunks:
                docs.append({
                    'content': chunk,
                    'metadata': text_data['metadata'],
                    'source': text_data['source']
                })
        
        # Création des embeddings et stockage vectoriel
        texts = [doc['content'] for doc in docs]
        metadatas = [{'source': doc['source'], **doc['metadata']} for doc in docs]
        
        self.vector_store = FAISS.from_texts(
            texts,
            self.embeddings,
            metadatas=metadatas
        )
        
        logger.info(f"✅ Base de connaissances initialisée avec {len(texts)} documents")
    
    async def _load_legal_texts(self) -> List[Dict[str, Any]]:
        """Charge les textes juridiques depuis la base de données"""
        conn = await asyncpg.connect(self.db_url)
        
        try:
            # Chargement des articles de loi
            articles_query = """
            SELECT code_article, source_juridique, texte_integral, resume,
                   date_entree_vigueur, statut
            FROM articles_loi
            WHERE statut = 'actif'
            ORDER BY source_juridique, code_article
            """
            articles = await conn.fetch(articles_query)
            
            # Chargement des infractions
            infractions_query = """
            SELECT code_infraction, libelle, description_detaillee, categorie, gravite,
                   elements_constitutifs
            FROM infractions
            ORDER BY gravite DESC, code_infraction
            """
            infractions = await conn.fetch(infractions_query)
            
            # Chargement de la jurisprudence
            jurisprudence_query = """
            SELECT numero_arret, juridiction, date_decision, resume, texte_integral,
                   principe_retenu, mots_cles
            FROM jurisprudence
            ORDER BY date_decision DESC
            """
            jurisprudence = await conn.fetch(jurisprudence_query)
            
            legal_texts = []
            
            # Formatage des articles
            for article in articles:
                legal_texts.append({
                    'content': f"Article {article['code_article']} - {article['source_juridique']}\n\n{article['texte_integral']}\n\nRésumé: {article['resume']}",
                    'source': f"article_{article['code_article']}",
                    'metadata': {
                        'type': 'article_loi',
                        'code': article['code_article'],
                        'source_juridique': article['source_juridique'],
                        'date_entree_vigueur': str(article['date_entree_vigueur'])
                    }
                })
            
            # Formatage des infractions
            for infraction in infractions:
                legal_texts.append({
                    'content': f"Infraction {infraction['code_infraction']} - {infraction['libelle']}\n\n{infraction['description_detaillee']}\n\nCatégorie: {infraction['categorie']}\nGravité: {infraction['gravite']}/5",
                    'source': f"infraction_{infraction['code_infraction']}",
                    'metadata': {
                        'type': 'infraction',
                        'code': infraction['code_infraction'],
                        'categorie': infraction['categorie'],
                        'gravite': infraction['gravite']
                    }
                })
            
            # Formatage de la jurisprudence
            for decision in jurisprudence:
                content = f"Décision {decision['numero_arret']} - {decision['juridiction']}\n\nDate: {decision['date_decision']}\n\nRésumé: {decision['resume']}"
                if decision['texte_integral']:
                    content += f"\n\nTexte intégral: {decision['texte_integral']}"
                if decision['principe_retenu']:
                    content += f"\n\nPrincipe retenu: {decision['principe_retenu']}"
                
                legal_texts.append({
                    'content': content,
                    'source': f"jurisprudence_{decision['numero_arret']}",
                    'metadata': {
                        'type': 'jurisprudence',
                        'numero_arret': decision['numero_arret'],
                        'juridiction': decision['juridiction'],
                        'date_decision': str(decision['date_decision']),
                        'mots_cles': decision['mots_cles'] or []
                    }
                })
            
            return legal_texts
            
        finally:
            await conn.close()
    
    async def search_relevant_context(self, query: str, k: int = 10) -> List[Dict[str, Any]]:
        """Recherche du contexte juridique pertinent"""
        if not self.vector_store:
            await self.initialize()
        
        results = self.vector_store.similarity_search_with_score(query, k=k)
        
        relevant_docs = []
        for doc, score in results:
            relevant_docs.append({
                'content': doc.page_content,
                'metadata': doc.metadata,
                'relevance_score': 1 - score  # Convertir distance en score de pertinence
            })
        
        return relevant_docs

class TachygraphLegalAssistant:
    """Assistant juridique IA spécialisé dans les tachygraphes"""
    
    def __init__(self, openai_api_key: str, db_url: str):
        openai.api_key = openai_api_key
        self.db_url = db_url
        self.llm = ChatOpenAI(
            model_name="gpt-4-turbo-preview",
            temperature=0.1,  # Faible température pour plus de précision
            max_tokens=2000
        )
        self.knowledge_base = LegalKnowledgeBase(db_url)
        self.memory = ConversationBufferWindowMemory(
            k=5,  # Garde 5 derniers échanges en mémoire
            memory_key="chat_history",
            return_messages=True
        )
        
        # Prompts spécialisés
        self._setup_prompts()
    
    def _setup_prompts(self):
        """Configuration des prompts spécialisés"""
        
        # Prompt système pour l'analyse juridique
        self.system_prompt = """Tu es un expert juridique spécialisé dans la réglementation des tachygraphes et du transport routier. 
        
        Tes domaines d'expertise incluent :
        - Règlement (UE) n° 165/2014 sur les tachygraphes
        - Code des transports français (articles R3312-1 à R3312-83)
        - Jurisprudence en matière de temps de conduite et repos
        - Procédures de contrôle et sanctions

        Instructions importantes :
        1. Base tes réponses UNIQUEMENT sur la réglementation officielle fournie
        2. Cite toujours tes sources (articles, décisions de justice)
        3. Distingue clairement les faits, l'analyse juridique et les recommandations
        4. Indique le niveau de certitude de tes conclusions
        5. Mentionne les exceptions et circonstances particulières
        6. Reste neutre et objectif dans tes analyses

        Format de réponse :
        - Analyse juridique claire et structurée
        - Citations précises des textes applicables
        - Recommandations pratiques et procédurales
        - Évaluation des risques
        - Questions de suivi si nécessaire"""
        
        # Prompt pour l'analyse de situation
        self.situation_analysis_prompt = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template(self.system_prompt),
            HumanMessagePromptTemplate.from_template("""
            Analyse la situation suivante concernant la réglementation tachygraphique :

            SITUATION :
            {situation}

            CONTEXTE JURIDIQUE PERTINENT :
            {legal_context}

            Fournis une analyse complète incluant :
            1. Infractions potentielles identifiées
            2. Références juridiques applicables
            3. Gravité et sanctions encourues
            4. Circonstances atténuantes ou aggravantes
            5. Procédure recommandée
            6. Mesures préventives pour l'avenir

            Niveau de certitude requis : {confidence_level}
            """)
        ])
        
        # Prompt pour consultation juridique
        self.legal_consultation_prompt = ChatPromptTemplate.from_messages([
            SystemMessagePromptTemplate.from_template(self.system_prompt),
            HumanMessagePromptTemplate.from_template("""
            Question juridique : {question}

            Contexte légal pertinent : {legal_context}

            Réponds de manière structurée :
            1. Analyse de la question posée
            2. Textes et principes juridiques applicables
            3. Interprétation et application au cas présent
            4. Jurisprudence pertinente s'il y en a
            5. Recommandations pratiques
            6. Points d'attention particuliers
            """)
        ])
    
    async def analyze_situation(self, situation_description: str, 
                               analysis_type: AnalysisType = AnalysisType.SITUATION_ANALYSIS,
                               confidence_level: str = "élevé") -> AIAnalysisResult:
        """Analyse une situation avec l'IA juridique"""
        logger.info(f"🤖 Analyse IA de situation - Type: {analysis_type.value}")
        
        try:
            # Recherche du contexte juridique pertinent
            relevant_context = await self.knowledge_base.search_relevant_context(
                situation_description, k=8
            )
            
            # Formatage du contexte
            context_text = self._format_legal_context(relevant_context)
            
            # Création de la chaîne d'analyse
            analysis_chain = LLMChain(
                llm=self.llm,
                prompt=self.situation_analysis_prompt,
                memory=self.memory
            )
            
            # Exécution de l'analyse
            result = await analysis_chain.arun(
                situation=situation_description,
                legal_context=context_text,
                confidence_level=confidence_level
            )
            
            # Parsing et structuration du résultat
            structured_result = await self._parse_ai_response(
                result, analysis_type, relevant_context
            )
            
            # Sauvegarde de l'analyse
            await self._save_analysis_result(structured_result, situation_description)
            
            return structured_result
            
        except Exception as e:
            logger.error(f"Erreur analyse IA: {e}")
            raise
    
    async def legal_consultation(self, question: str) -> AIAnalysisResult:
        """Consultation juridique spécialisée"""
        logger.info("⚖️ Consultation juridique IA")
        
        try:
            # Recherche contexte pertinent
            relevant_context = await self.knowledge_base.search_relevant_context(question, k=6)
            context_text = self._format_legal_context(relevant_context)
            
            # Consultation
            consultation_chain = LLMChain(
                llm=self.llm,
                prompt=self.legal_consultation_prompt,
                memory=self.memory
            )
            
            result = await consultation_chain.arun(
                question=question,
                legal_context=context_text
            )
            
            structured_result = await self._parse_ai_response(
                result, AnalysisType.LEGAL_CONSULTATION, relevant_context
            )
            
            return structured_result
            
        except Exception as e:
            logger.error(f"Erreur consultation juridique: {e}")
            raise
    
    def _format_legal_context(self, relevant_docs: List[Dict[str, Any]]) -> str:
        """Formate le contexte juridique pour le prompt"""
        context_parts = []
        
        for doc in relevant_docs:
            metadata = doc['metadata']
            relevance = doc['relevance_score']
            
            if relevance > 0.7:  # Seulement les documents très pertinents
                context_part = f"[{metadata.get('type', 'document').upper()}] {doc['content'][:500]}..."
                if 'code' in metadata:
                    context_part = f"Code: {metadata['code']} - " + context_part
                context_parts.append(context_part)
        
        return "\n\n".join(context_parts)
    
    async def _parse_ai_response(self, ai_response: str, analysis_type: AnalysisType, 
                                context_docs: List[Dict[str, Any]]) -> AIAnalysisResult:
        """Parse et structure la réponse de l'IA"""
        
        # Extraction des infractions (patterns basiques)
        infractions_pattern = r"Infraction[s]?\s*:?\s*([^\n]+)"
        infractions_matches = re.findall(infractions_pattern, ai_response, re.IGNORECASE)
        
        infractions_identified = []
        for match in infractions_matches:
            infractions_identified.append({
                'description': match.strip(),
                'source': 'ai_analysis',
                'confidence': 0.8
            })
        
        # Extraction des recommandations
        recommendations_pattern = r"Recommandation[s]?\s*:?\s*([^\n]+)"
        recommendations_matches = re.findall(recommendations_pattern, ai_response, re.IGNORECASE)
        recommendations = [rec.strip() for rec in recommendations_matches]
        
        # Extraction des citations
        citations_pattern = r"(Article\s+[A-Z0-9-]+|Règlement\s+[A-Z0-9\/]+|Code\s+[a-zA-Z\s]+)"
        citations = list(set(re.findall(citations_pattern, ai_response, re.IGNORECASE)))
        
        # Évaluation de la confiance (basique)
        confidence_keywords = ['certain', 'sûr', 'clairement', 'évident']
        uncertainty_keywords = ['possible', 'probable', 'semble', 'apparemment']
        
        confidence_score = 0.7  # Score par défaut
        if any(keyword in ai_response.lower() for keyword in confidence_keywords):
            confidence_score = 0.9
        elif any(keyword in ai_response.lower() for keyword in uncertainty_keywords):
            confidence_score = 0.5
        
        # Évaluation du niveau de risque
        risk_level = "moyen"
        if any(word in ai_response.lower() for word in ['grave', 'sérieux', 'majeur']):
            risk_level = "élevé"
        elif any(word in ai_response.lower() for word in ['mineur', 'léger', 'faible']):
            risk_level = "faible"
        
        # Construction du contexte juridique
        legal_context = LegalContext(
            regulation_references=[doc['metadata'].get('code', '') for doc in context_docs if doc['metadata'].get('type') == 'article_loi'],
            case_law=[doc['metadata'].get('numero_arret', '') for doc in context_docs if doc['metadata'].get('type') == 'jurisprudence']
        )
        
        return AIAnalysisResult(
            analysis_type=analysis_type,
            legal_assessment=ai_response,
            infractions_identified=infractions_identified,
            recommendations=recommendations,
            procedural_steps=[],  # À implémenter avec parsing plus avancé
            risk_level=risk_level,
            confidence_score=confidence_score,
            legal_context=legal_context,
            citations=citations,
            alternative_interpretations=[],
            follow_up_questions=[]
        )
    
    async def _save_analysis_result(self, result: AIAnalysisResult, original_query: str):
        """Sauvegarde le résultat d'analyse en base"""
        try:
            conn = await asyncpg.connect(self.db_url)
            
            await conn.execute("""
                INSERT INTO ai_analyses 
                (analysis_type, original_query, ai_response, confidence_score, 
                 risk_level, infractions_count, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            """,
            result.analysis_type.value,
            original_query,
            result.legal_assessment,
            result.confidence_score,
            result.risk_level,
            len(result.infractions_identified),
            datetime.now()
            )
            
            await conn.close()
            logger.info("✅ Résultat d'analyse IA sauvegardé")
            
        except Exception as e:
            logger.error(f"Erreur sauvegarde analyse IA: {e}")

class ComplianceAuditor:
    """Auditeur de conformité automatisé"""
    
    def __init__(self, legal_assistant: TachygraphLegalAssistant):
        self.assistant = legal_assistant
    
    async def audit_fleet_compliance(self, fleet_data: Dict[str, Any]) -> Dict[str, Any]:
        """Audit de conformité d'une flotte"""
        logger.info("📋 Audit de conformité de flotte")
        
        audit_results = {
            'overall_score': 0.0,
            'vehicle_audits': [],
            'driver_audits': [],
            'systemic_issues': [],
            'recommendations': [],
            'priority_actions': []
        }
        
        # Audit par véhicule
        for vehicle in fleet_data.get('vehicles', []):
            vehicle_audit = await self._audit_vehicle_compliance(vehicle)
            audit_results['vehicle_audits'].append(vehicle_audit)
        
        # Audit par conducteur
        for driver in fleet_data.get('drivers', []):
            driver_audit = await self._audit_driver_compliance(driver)
            audit_results['driver_audits'].append(driver_audit)
        
        # Calcul du score global
        audit_results['overall_score'] = self._calculate_overall_score(audit_results)
        
        return audit_results
    
    async def _audit_vehicle_compliance(self, vehicle_data: Dict[str, Any]) -> Dict[str, Any]:
        """Audit de conformité d'un véhicule"""
        
        compliance_checks = [
            ('tachygraph_calibration', self._check_tachygraph_calibration),
            ('maintenance_records', self._check_maintenance_records),
            ('equipment_status', self._check_equipment_status)
        ]
        
        results = {'vehicle_id': vehicle_data.get('id'), 'checks': {}, 'score': 0.0}
        
        for check_name, check_function in compliance_checks:
            try:
                check_result = await check_function(vehicle_data)
                results['checks'][check_name] = check_result
            except Exception as e:
                logger.error(f"Erreur check {check_name}: {e}")
                results['checks'][check_name] = {'status': 'error', 'score': 0.0}
        
        # Calcul du score du véhicule
        scores = [check['score'] for check in results['checks'].values()]
        results['score'] = sum(scores) / len(scores) if scores else 0.0
        
        return results
    
    async def _audit_driver_compliance(self, driver_data: Dict[str, Any]) -> Dict[str, Any]:
        """Audit de conformité d'un conducteur"""
        
        # Analyse des données de conduite du conducteur
        situation_description = f"""
        Conducteur {driver_data.get('name', 'N/A')}:
        - Temps de conduite moyen: {driver_data.get('avg_driving_time', 0)} heures/jour
        - Temps de repos moyen: {driver_data.get('avg_rest_time', 0)} heures/jour
        - Infractions récentes: {len(driver_data.get('recent_infractions', []))}
        - Utilisation carte conducteur: {driver_data.get('card_usage_rate', 0)}%
        """
        
        analysis = await self.assistant.analyze_situation(
            situation_description,
            AnalysisType.COMPLIANCE_AUDIT
        )
        
        return {
            'driver_id': driver_data.get('id'),
            'compliance_analysis': analysis,
            'risk_level': analysis.risk_level,
            'score': analysis.confidence_score
        }
    
    async def _check_tachygraph_calibration(self, vehicle_data: Dict[str, Any]) -> Dict[str, Any]:
        """Vérification de l'étalonnage du tachygraphe"""
        last_calibration = vehicle_data.get('last_calibration_date')
        
        if not last_calibration:
            return {'status': 'non_compliant', 'score': 0.0, 'issue': 'Date étalonnage manquante'}
        
        # Vérification si l'étalonnage est dans les temps (2 ans max)
        from datetime import datetime, timedelta
        calibration_date = datetime.fromisoformat(last_calibration)
        max_date = datetime.now() - timedelta(days=730)  # 2 ans
        
        if calibration_date < max_date:
            return {'status': 'non_compliant', 'score': 0.0, 'issue': 'Étalonnage expiré'}
        
        return {'status': 'compliant', 'score': 1.0}
    
    async def _check_maintenance_records(self, vehicle_data: Dict[str, Any]) -> Dict[str, Any]:
        """Vérification des registres de maintenance"""
        maintenance_records = vehicle_data.get('maintenance_records', [])
        
        if not maintenance_records:
            return {'status': 'non_compliant', 'score': 0.0, 'issue': 'Aucun registre de maintenance'}
        
        # Vérification de la fréquence de maintenance
        recent_maintenance = [r for r in maintenance_records if r.get('date') and 
                            datetime.fromisoformat(r['date']) > datetime.now() - timedelta(days=90)]
        
        if not recent_maintenance:
            return {'status': 'warning', 'score': 0.5, 'issue': 'Maintenance pas récente'}
        
        return {'status': 'compliant', 'score': 1.0}
    
    async def _check_equipment_status(self, vehicle_data: Dict[str, Any]) -> Dict[str, Any]:
        """Vérification de l'état de l'équipement"""
        equipment_status = vehicle_data.get('equipment_status', {})
        
        critical_components = ['tachygraph', 'card_reader', 'display', 'printer']
        failed_components = [comp for comp in critical_components 
                           if equipment_status.get(comp) == 'failed']
        
        if failed_components:
            return {'status': 'non_compliant', 'score': 0.0, 
                   'issue': f'Composants défaillants: {", ".join(failed_components)}'}
        
        warning_components = [comp for comp in critical_components 
                            if equipment_status.get(comp) == 'warning']
        
        if warning_components:
            return {'status': 'warning', 'score': 0.7,
                   'issue': f'Composants en alerte: {", ".join(warning_components)}'}
        
        return {'status': 'compliant', 'score': 1.0}
    
    def _calculate_overall_score(self, audit_results: Dict[str, Any]) -> float:
        """Calcule le score global de conformité"""
        vehicle_scores = [v['score'] for v in audit_results['vehicle_audits']]
        driver_scores = [d['score'] for d in audit_results['driver_audits']]
        
        all_scores = vehicle_scores + driver_scores
        
        if not all_scores:
            return 0.0
        
        return sum(all_scores) / len(all_scores)

# Point d'entrée pour tests
async def main():
    """Test de l'assistant juridique IA"""
    logger.info("🚀 Test de l'assistant juridique IA")
    
    openai_api_key = os.getenv("OPENAI_API_KEY")
    db_url = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/tachygraphe_db")
    
    if not openai_api_key:
        logger.warning("Clé OpenAI manquante, test en mode simulation")
        return
    
    try:
        assistant = TachygraphLegalAssistant(openai_api_key, db_url)
        
        # Test d'analyse de situation
        situation_test = """
        Un conducteur de poids lourd a effectué une tournée de 3 jours avec les temps suivants :
        - Jour 1: 10h de conduite, 9h de repos
        - Jour 2: 11h de conduite, 8h de repos  
        - Jour 3: 9h30 de conduite, 11h de repos
        Il n'a pas pris de pause de 45 minutes le jour 2 et sa carte conducteur était défaillante le jour 1.
        """
        
        result = await assistant.analyze_situation(situation_test)
        
        print(f"\n📊 Résultat d'analyse:")
        print(f"   Confiance: {result.confidence_score:.1%}")
        print(f"   Niveau de risque: {result.risk_level}")
        print(f"   Infractions détectées: {len(result.infractions_identified)}")
        print(f"   Recommandations: {len(result.recommendations)}")
        
        for infraction in result.infractions_identified:
            print(f"     - {infraction['description']}")
        
        # Test d'audit de conformité
        auditor = ComplianceAuditor(assistant)
        
        fleet_data = {
            'vehicles': [
                {
                    'id': 'V001',
                    'last_calibration_date': '2023-01-15',
                    'maintenance_records': [{'date': '2023-11-01', 'type': 'routine'}],
                    'equipment_status': {'tachygraph': 'ok', 'card_reader': 'warning'}
                }
            ],
            'drivers': [
                {
                    'id': 'D001',
                    'name': 'Jean Dupont',
                    'avg_driving_time': 8.5,
                    'avg_rest_time': 10.5,
                    'recent_infractions': [],
                    'card_usage_rate': 95
                }
            ]
        }
        
        audit_result = await auditor.audit_fleet_compliance(fleet_data)
        print(f"\n📋 Audit de conformité:")
        print(f"   Score global: {audit_result['overall_score']:.1%}")
        
    except Exception as e:
        logger.error(f"Erreur test assistant IA: {e}")

if __name__ == "__main__":
    asyncio.run(main()) 