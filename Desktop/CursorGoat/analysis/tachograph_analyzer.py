"""
Analyseur Avancé de Données Tachygraphiques
Sogestmatic - Mission Stage

Analyse les fichiers de données tachygraphiques (.ddd, .tgd, .esm) 
et détecte automatiquement les infractions potentielles.
"""

import struct
import logging
import asyncio
import asyncpg
from datetime import datetime, timedelta, time
from typing import List, Dict, Any, Optional, Tuple, NamedTuple
from dataclasses import dataclass, field
from enum import Enum
import json
import os
from pathlib import Path
import hashlib

# Configuration logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class InfractionType(Enum):
    TEMPS_CONDUITE_JOUR = "TC-001"
    TEMPS_CONDUITE_SEMAINE = "TC-002"
    REPOS_JOURNALIER = "TR-001"
    PAUSE_OBLIGATOIRE = "TP-001"
    CARTE_NON_INSEREE = "US-001"
    SAISIE_MANUELLE = "US-002"
    TACHYGRAPHE_DEFAILLANT = "EQ-001"

class ActivityType(Enum):
    CONDUITE = 0x00
    AUTRES_TRAVAUX = 0x01
    DISPONIBILITE = 0x02
    REPOS = 0x03
    INCONNU = 0xFF

@dataclass
class ActivityPeriod:
    """Période d'activité d'un conducteur"""
    start_time: datetime
    end_time: datetime
    activity_type: ActivityType
    duration_minutes: int
    manual_entry: bool = False
    location_start: Optional[str] = None
    location_end: Optional[str] = None

@dataclass
class DrivingSession:
    """Session de conduite continue"""
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    distance_km: float = 0.0
    average_speed: float = 0.0
    max_speed: float = 0.0
    activities: List[ActivityPeriod] = field(default_factory=list)

@dataclass
class DailyData:
    """Données journalières d'un conducteur"""
    date: datetime
    driving_time: int  # minutes
    working_time: int  # minutes
    rest_time: int  # minutes
    availability_time: int  # minutes
    sessions: List[DrivingSession] = field(default_factory=list)
    card_inserted: bool = True
    manual_entries: int = 0

@dataclass
class DetectedInfraction:
    """Infraction détectée"""
    type: InfractionType
    severity: int  # 1-5
    description: str
    date_time: datetime
    duration_excess: int = 0  # minutes de dépassement
    evidence: Dict[str, Any] = field(default_factory=dict)
    confidence: float = 1.0  # 0-1
    recommendations: List[str] = field(default_factory=list)

class TachographFileParser:
    """Parser pour fichiers tachygraphiques"""
    
    def __init__(self):
        self.file_signatures = {
            b'\x00\x00\x00\x10': 'DDD',  # Driver card data
            b'\x00\x00\x00\x20': 'TGD',  # Tachograph data
            b'\x00\x00\x00\x30': 'ESM'   # Events and faults
        }
    
    def identify_file_type(self, file_path: Path) -> str:
        """Identifie le type de fichier tachygraphique"""
        try:
            with open(file_path, 'rb') as f:
                header = f.read(4)
                return self.file_signatures.get(header, 'UNKNOWN')
        except Exception as e:
            logger.error(f"Erreur identification fichier {file_path}: {e}")
            return 'ERROR'
    
    async def parse_ddd_file(self, file_path: Path) -> Dict[str, Any]:
        """Parse un fichier DDD (données carte conducteur)"""
        logger.info(f"📁 Analyse fichier DDD: {file_path.name}")
        
        data = {
            'card_number': '',
            'driver_name': '',
            'issue_date': None,
            'expiry_date': None,
            'activities': [],
            'events': [],
            'faults': []
        }
        
        try:
            with open(file_path, 'rb') as f:
                # Header analysis
                header = f.read(16)
                
                # Card identification (simplified structure)
                f.seek(0x20)
                card_number_raw = f.read(16)
                data['card_number'] = card_number_raw.decode('ascii', errors='ignore').strip('\x00')
                
                # Driver name
                f.seek(0x40)
                driver_name_raw = f.read(72)
                data['driver_name'] = driver_name_raw.decode('utf-8', errors='ignore').strip('\x00')
                
                # Activities data
                f.seek(0x200)  # Activity data offset
                activities = await self._parse_activity_data(f)
                data['activities'] = activities
                
        except Exception as e:
            logger.error(f"Erreur parsing DDD {file_path}: {e}")
        
        return data
    
    async def parse_tgd_file(self, file_path: Path) -> Dict[str, Any]:
        """Parse un fichier TGD (données véhicule)"""
        logger.info(f"🚛 Analyse fichier TGD: {file_path.name}")
        
        data = {
            'vehicle_registration': '',
            'vin': '',
            'odometer_readings': [],
            'speed_data': [],
            'activities': []
        }
        
        try:
            with open(file_path, 'rb') as f:
                # Vehicle identification
                f.seek(0x30)
                vin_raw = f.read(17)
                data['vin'] = vin_raw.decode('ascii', errors='ignore').strip('\x00')
                
                # Registration
                f.seek(0x50)
                reg_raw = f.read(15)
                data['vehicle_registration'] = reg_raw.decode('ascii', errors='ignore').strip('\x00')
                
                # Speed and distance data
                f.seek(0x400)
                speed_data = await self._parse_speed_data(f)
                data['speed_data'] = speed_data
                
        except Exception as e:
            logger.error(f"Erreur parsing TGD {file_path}: {e}")
        
        return data
    
    async def _parse_activity_data(self, file_handle) -> List[ActivityPeriod]:
        """Parse les données d'activité depuis un fichier"""
        activities = []
        
        try:
            # Structure simplifiée des activités
            for i in range(100):  # Max 100 périodes
                data = file_handle.read(8)
                if len(data) < 8:
                    break
                
                timestamp, activity_code, duration = struct.unpack('>IHH', data)
                
                if timestamp == 0:
                    break
                
                start_time = datetime.fromtimestamp(timestamp)
                activity_type = ActivityType(activity_code) if activity_code in [0,1,2,3] else ActivityType.INCONNU
                
                activity = ActivityPeriod(
                    start_time=start_time,
                    end_time=start_time + timedelta(minutes=duration),
                    activity_type=activity_type,
                    duration_minutes=duration,
                    manual_entry=(activity_code & 0x8000) != 0
                )
                
                activities.append(activity)
                
        except Exception as e:
            logger.error(f"Erreur parsing activités: {e}")
        
        return activities
    
    async def _parse_speed_data(self, file_handle) -> List[Dict[str, Any]]:
        """Parse les données de vitesse et distance"""
        speed_data = []
        
        try:
            for i in range(50):  # Max 50 enregistrements
                data = file_handle.read(12)
                if len(data) < 12:
                    break
                
                timestamp, speed, distance, odometer = struct.unpack('>IHHI', data)
                
                if timestamp == 0:
                    break
                
                speed_data.append({
                    'timestamp': datetime.fromtimestamp(timestamp),
                    'speed_kmh': speed / 256.0,  # Facteur de conversion
                    'distance_km': distance / 10.0,
                    'odometer': odometer
                })
                
        except Exception as e:
            logger.error(f"Erreur parsing vitesse: {e}")
        
        return speed_data

class InfractionDetector:
    """Détecteur d'infractions basé sur l'analyse des données"""
    
    def __init__(self):
        # Règlements en vigueur
        self.max_daily_driving = 9 * 60  # 9 heures en minutes
        self.max_weekly_driving = 56 * 60  # 56 heures en minutes
        self.min_daily_rest = 11 * 60  # 11 heures en minutes
        self.max_continuous_driving = 4.5 * 60  # 4h30 en minutes
        self.min_break_duration = 45  # 45 minutes
        
    async def analyze_daily_data(self, daily_data: DailyData) -> List[DetectedInfraction]:
        """Analyse les données journalières et détecte les infractions"""
        infractions = []
        
        # Vérification temps de conduite journalier
        if daily_data.driving_time > self.max_daily_driving:
            excess = daily_data.driving_time - self.max_daily_driving
            infraction = DetectedInfraction(
                type=InfractionType.TEMPS_CONDUITE_JOUR,
                severity=4 if excess > 120 else 3,
                description=f"Dépassement temps conduite journalier: {excess} minutes",
                date_time=daily_data.date,
                duration_excess=excess,
                evidence={
                    'temps_conduite_reel': daily_data.driving_time,
                    'limite_reglementaire': self.max_daily_driving,
                    'depassement': excess
                },
                confidence=0.95,
                recommendations=[
                    "Vérifier la validité des données tachygraphe",
                    "Justifier les circonstances exceptionnelles",
                    "Planifier les repos de récupération"
                ]
            )
            infractions.append(infraction)
        
        # Vérification repos journalier
        if daily_data.rest_time < self.min_daily_rest:
            deficit = self.min_daily_rest - daily_data.rest_time
            infraction = DetectedInfraction(
                type=InfractionType.REPOS_JOURNALIER,
                severity=4,
                description=f"Repos journalier insuffisant: {deficit} minutes manquantes",
                date_time=daily_data.date,
                duration_excess=deficit,
                evidence={
                    'temps_repos_reel': daily_data.rest_time,
                    'minimum_reglementaire': self.min_daily_rest,
                    'deficit': deficit
                },
                confidence=0.90,
                recommendations=[
                    "Organiser un repos compensateur",
                    "Vérifier les conditions de réduction autorisée",
                    "Contrôler la programmation des tournées"
                ]
            )
            infractions.append(infraction)
        
        # Vérification pauses
        infractions.extend(await self._check_breaks(daily_data))
        
        # Vérification carte conducteur
        if not daily_data.card_inserted:
            infraction = DetectedInfraction(
                type=InfractionType.CARTE_NON_INSEREE,
                severity=3,
                description="Conduite sans carte conducteur insérée",
                date_time=daily_data.date,
                evidence={'duree_sans_carte': daily_data.driving_time},
                confidence=1.0,
                recommendations=[
                    "Vérifier le fonctionnement de la carte",
                    "Former le conducteur aux procédures",
                    "Contrôler l'état du lecteur"
                ]
            )
            infractions.append(infraction)
        
        # Vérification saisies manuelles excessives
        if daily_data.manual_entries > 5:
            infraction = DetectedInfraction(
                type=InfractionType.SAISIE_MANUELLE,
                severity=2,
                description=f"Nombre élevé de saisies manuelles: {daily_data.manual_entries}",
                date_time=daily_data.date,
                evidence={'nombre_saisies': daily_data.manual_entries},
                confidence=0.80,
                recommendations=[
                    "Vérifier la cohérence des saisies",
                    "Former sur l'utilisation du tachygraphe",
                    "Contrôler l'état de l'équipement"
                ]
            )
            infractions.append(infraction)
        
        return infractions
    
    async def _check_breaks(self, daily_data: DailyData) -> List[DetectedInfraction]:
        """Vérifie le respect des pauses obligatoires"""
        infractions = []
        
        for session in daily_data.sessions:
            if session.duration_minutes > self.max_continuous_driving:
                # Vérifier s'il y a eu une pause suffisante
                break_found = False
                
                for activity in session.activities:
                    if (activity.activity_type == ActivityType.REPOS and 
                        activity.duration_minutes >= self.min_break_duration):
                        break_found = True
                        break
                
                if not break_found:
                    excess = session.duration_minutes - self.max_continuous_driving
                    infraction = DetectedInfraction(
                        type=InfractionType.PAUSE_OBLIGATOIRE,
                        severity=2,
                        description=f"Conduite continue excessive: {excess} minutes sans pause",
                        date_time=session.start_time,
                        duration_excess=excess,
                        evidence={
                            'duree_conduite_continue': session.duration_minutes,
                            'limite_reglementaire': self.max_continuous_driving,
                            'pause_minimale_requise': self.min_break_duration
                        },
                        confidence=0.85,
                        recommendations=[
                            "Planifier des pauses réglementaires",
                            "Utiliser les aires de repos disponibles",
                            "Sensibiliser à la sécurité routière"
                        ]
                    )
                    infractions.append(infraction)
        
        return infractions
    
    async def analyze_weekly_data(self, weekly_data: List[DailyData]) -> List[DetectedInfraction]:
        """Analyse hebdomadaire des données"""
        infractions = []
        
        total_weekly_driving = sum(day.driving_time for day in weekly_data)
        
        if total_weekly_driving > self.max_weekly_driving:
            excess = total_weekly_driving - self.max_weekly_driving
            
            # Trouver le jour de dépassement
            cumulative = 0
            violation_day = weekly_data[0].date
            
            for day in weekly_data:
                cumulative += day.driving_time
                if cumulative > self.max_weekly_driving:
                    violation_day = day.date
                    break
            
            infraction = DetectedInfraction(
                type=InfractionType.TEMPS_CONDUITE_SEMAINE,
                severity=5,
                description=f"Dépassement temps conduite hebdomadaire: {excess} minutes",
                date_time=violation_day,
                duration_excess=excess,
                evidence={
                    'temps_conduite_hebdo': total_weekly_driving,
                    'limite_reglementaire': self.max_weekly_driving,
                    'detail_journalier': [day.driving_time for day in weekly_data]
                },
                confidence=0.98,
                recommendations=[
                    "Repos hebdomadaire obligatoire immédiat",
                    "Revoir la planification des tournées",
                    "Audit de conformité réglementaire"
                ]
            )
            infractions.append(infraction)
        
        return infractions

class TachographAnalyzer:
    """Analyseur principal des données tachygraphiques"""
    
    def __init__(self, db_url: str):
        self.db_url = db_url
        self.parser = TachographFileParser()
        self.detector = InfractionDetector()
    
    async def analyze_file(self, file_path: Path) -> Dict[str, Any]:
        """Analyse complète d'un fichier tachygraphique"""
        logger.info(f"🔍 Analyse du fichier: {file_path.name}")
        
        result = {
            'file_info': {
                'name': file_path.name,
                'size_bytes': file_path.stat().st_size,
                'type': self.parser.identify_file_type(file_path),
                'hash': self._calculate_file_hash(file_path),
                'analysis_time': datetime.now().isoformat()
            },
            'parsed_data': {},
            'daily_summaries': [],
            'infractions': [],
            'recommendations': [],
            'compliance_score': 0.0
        }
        
        try:
            # Parse selon le type de fichier
            file_type = result['file_info']['type']
            
            if file_type == 'DDD':
                parsed_data = await self.parser.parse_ddd_file(file_path)
                result['parsed_data'] = parsed_data
                
                # Conversion en données journalières
                daily_summaries = await self._convert_to_daily_data(parsed_data)
                result['daily_summaries'] = daily_summaries
                
                # Détection d'infractions
                all_infractions = []
                for daily_data in daily_summaries:
                    infractions = await self.detector.analyze_daily_data(daily_data)
                    all_infractions.extend(infractions)
                
                # Analyse hebdomadaire si suffisamment de données
                if len(daily_summaries) >= 7:
                    weekly_infractions = await self.detector.analyze_weekly_data(daily_summaries[-7:])
                    all_infractions.extend(weekly_infractions)
                
                result['infractions'] = [self._infraction_to_dict(inf) for inf in all_infractions]
                
            elif file_type == 'TGD':
                parsed_data = await self.parser.parse_tgd_file(file_path)
                result['parsed_data'] = parsed_data
                
            # Calcul du score de conformité
            result['compliance_score'] = self._calculate_compliance_score(result['infractions'])
            
            # Génération de recommandations globales
            result['recommendations'] = await self._generate_recommendations(result['infractions'])
            
            # Sauvegarde en base de données
            await self._save_analysis_result(result)
            
        except Exception as e:
            logger.error(f"Erreur analyse fichier {file_path}: {e}")
            result['error'] = str(e)
        
        return result
    
    async def _convert_to_daily_data(self, parsed_data: Dict[str, Any]) -> List[DailyData]:
        """Convertit les données parsées en format journalier"""
        daily_summaries = []
        
        # Grouper les activités par jour
        activities_by_day = {}
        
        for activity in parsed_data.get('activities', []):
            if isinstance(activity, ActivityPeriod):
                date_key = activity.start_time.date()
                if date_key not in activities_by_day:
                    activities_by_day[date_key] = []
                activities_by_day[date_key].append(activity)
        
        # Créer les résumés journaliers
        for date, activities in activities_by_day.items():
            driving_time = sum(
                act.duration_minutes for act in activities 
                if act.activity_type == ActivityType.CONDUITE
            )
            
            working_time = sum(
                act.duration_minutes for act in activities 
                if act.activity_type in [ActivityType.CONDUITE, ActivityType.AUTRES_TRAVAUX]
            )
            
            rest_time = sum(
                act.duration_minutes for act in activities 
                if act.activity_type == ActivityType.REPOS
            )
            
            availability_time = sum(
                act.duration_minutes for act in activities 
                if act.activity_type == ActivityType.DISPONIBILITE
            )
            
            manual_entries = sum(1 for act in activities if act.manual_entry)
            
            daily_data = DailyData(
                date=datetime.combine(date, time.min),
                driving_time=driving_time,
                working_time=working_time,
                rest_time=rest_time,
                availability_time=availability_time,
                manual_entries=manual_entries,
                card_inserted=True  # À déterminer depuis les données
            )
            
            daily_summaries.append(daily_data)
        
        return sorted(daily_summaries, key=lambda x: x.date)
    
    def _calculate_compliance_score(self, infractions: List[Dict[str, Any]]) -> float:
        """Calcule un score de conformité (0-100)"""
        if not infractions:
            return 100.0
        
        total_penalty = 0
        for infraction in infractions:
            severity = infraction.get('severity', 1)
            confidence = infraction.get('confidence', 1.0)
            penalty = severity * confidence * 5  # Max 25 points par infraction
            total_penalty += penalty
        
        # Score inversement proportionnel aux pénalités
        max_possible_penalty = len(infractions) * 25
        score = max(0, 100 - (total_penalty / max_possible_penalty * 100))
        
        return round(score, 1)
    
    async def _generate_recommendations(self, infractions: List[Dict[str, Any]]) -> List[str]:
        """Génère des recommandations basées sur les infractions détectées"""
        recommendations = set()  # Éviter les doublons
        
        infraction_counts = {}
        for infraction in infractions:
            infr_type = infraction.get('type')
            infraction_counts[infr_type] = infraction_counts.get(infr_type, 0) + 1
        
        # Recommandations spécifiques selon les types d'infractions
        if infraction_counts.get('TC-001', 0) > 0:
            recommendations.add("Mettre en place un système de planification des temps de conduite")
            recommendations.add("Former les conducteurs aux règles de temps de conduite")
        
        if infraction_counts.get('TR-001', 0) > 0:
            recommendations.add("Optimiser l'organisation des repos journaliers")
            recommendations.add("Sensibiliser à l'importance du repos pour la sécurité")
        
        if infraction_counts.get('US-001', 0) > 0:
            recommendations.add("Contrôler régulièrement l'état des cartes conducteur")
            recommendations.add("Vérifier le fonctionnement des lecteurs de carte")
        
        # Recommandations générales
        if len(infractions) > 5:
            recommendations.add("Audit complet de conformité réglementaire recommandé")
            recommendations.add("Formation approfondie à la réglementation sociale")
        
        recommendations.add("Mettre en place une veille réglementaire active")
        recommendations.add("Effectuer des contrôles internes réguliers")
        
        return list(recommendations)
    
    def _infraction_to_dict(self, infraction: DetectedInfraction) -> Dict[str, Any]:
        """Convertit une infraction en dictionnaire pour sérialisation"""
        return {
            'type': infraction.type.value,
            'severity': infraction.severity,
            'description': infraction.description,
            'date_time': infraction.date_time.isoformat(),
            'duration_excess': infraction.duration_excess,
            'evidence': infraction.evidence,
            'confidence': infraction.confidence,
            'recommendations': infraction.recommendations
        }
    
    def _calculate_file_hash(self, file_path: Path) -> str:
        """Calcule le hash SHA-256 du fichier"""
        hash_sha256 = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()
    
    async def _save_analysis_result(self, result: Dict[str, Any]):
        """Sauvegarde le résultat d'analyse en base de données"""
        try:
            conn = await asyncpg.connect(self.db_url)
            
            # Insertion dans une table d'analyse (à créer)
            await conn.execute("""
                INSERT INTO tachograph_analyses 
                (file_name, file_hash, analysis_data, compliance_score, infractions_count, created_at)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (file_hash) DO UPDATE SET
                    analysis_data = EXCLUDED.analysis_data,
                    compliance_score = EXCLUDED.compliance_score,
                    infractions_count = EXCLUDED.infractions_count,
                    updated_at = CURRENT_TIMESTAMP
            """,
            result['file_info']['name'],
            result['file_info']['hash'],
            json.dumps(result, default=str),
            result['compliance_score'],
            len(result['infractions']),
            datetime.now()
            )
            
            await conn.close()
            logger.info(f"✅ Résultat d'analyse sauvegardé: {result['file_info']['name']}")
            
        except Exception as e:
            logger.error(f"Erreur sauvegarde analyse: {e}")

# Fonction utilitaire pour analyser un répertoire complet
async def analyze_directory(directory_path: Path, db_url: str) -> List[Dict[str, Any]]:
    """Analyse tous les fichiers tachygraphiques d'un répertoire"""
    logger.info(f"📂 Analyse du répertoire: {directory_path}")
    
    analyzer = TachographAnalyzer(db_url)
    results = []
    
    # Extensions de fichiers tachygraphiques
    tachograph_extensions = {'.ddd', '.tgd', '.esm', '.c1b', '.v1b'}
    
    for file_path in directory_path.rglob('*'):
        if file_path.is_file() and file_path.suffix.lower() in tachograph_extensions:
            try:
                result = await analyzer.analyze_file(file_path)
                results.append(result)
                
                # Log résumé
                infractions_count = len(result['infractions'])
                compliance_score = result['compliance_score']
                logger.info(f"  📊 {file_path.name}: {infractions_count} infractions, score {compliance_score}%")
                
            except Exception as e:
                logger.error(f"Erreur analyse {file_path}: {e}")
    
    logger.info(f"✅ Analyse terminée: {len(results)} fichiers traités")
    return results

# Point d'entrée pour tests
async def main():
    """Test de l'analyseur"""
    logger.info("🚀 Test de l'analyseur tachygraphique")
    
    # Simulation avec des données de test
    test_dir = Path("/tmp/test_tachograph_files")
    db_url = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/tachygraphe_db")
    
    if test_dir.exists():
        results = await analyze_directory(test_dir, db_url)
        
        for result in results:
            print(f"\n📄 Fichier: {result['file_info']['name']}")
            print(f"   Type: {result['file_info']['type']}")
            print(f"   Score conformité: {result['compliance_score']}%")
            print(f"   Infractions: {len(result['infractions'])}")
            
            for infraction in result['infractions'][:3]:  # Top 3
                print(f"     - {infraction['description']} (Gravité: {infraction['severity']})")
    else:
        logger.info("Répertoire de test non trouvé, créez des fichiers de test dans /tmp/test_tachograph_files")

if __name__ == "__main__":
    asyncio.run(main()) 