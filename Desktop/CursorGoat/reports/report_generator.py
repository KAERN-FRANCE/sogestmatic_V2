"""
Générateur de Rapports Automatisés - Tachygraphes
Sogestmatic - Mission Stage

Système de génération de rapports personnalisés pour l'analyse
des données tachygraphiques et la conformité réglementaire.
"""

import asyncio
import asyncpg
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum
import json
import os
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import seaborn as sns
import pandas as pd
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.linecharts import HorizontalLineChart
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.widgets.markers import makeMarker
import io
import base64

# Configuration logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ReportType(Enum):
    COMPLIANCE_AUDIT = "audit_conformite"
    INFRACTION_ANALYSIS = "analyse_infractions"
    FLEET_OVERVIEW = "vue_ensemble_flotte"
    DRIVER_PERFORMANCE = "performance_conducteur"
    REGULATORY_UPDATE = "mise_jour_reglementaire"
    TREND_ANALYSIS = "analyse_tendances"

class ReportFormat(Enum):
    PDF = "pdf"
    HTML = "html"
    EXCEL = "xlsx"
    JSON = "json"

class ChartType(Enum):
    BAR_CHART = "bar"
    LINE_CHART = "line"
    PIE_CHART = "pie"
    SCATTER_PLOT = "scatter"
    HEATMAP = "heatmap"

@dataclass
class ReportConfig:
    """Configuration pour la génération de rapport"""
    report_type: ReportType
    output_format: ReportFormat
    date_range: Tuple[datetime, datetime]
    filters: Dict[str, Any] = field(default_factory=dict)
    include_charts: bool = True
    include_recommendations: bool = True
    language: str = "fr"
    company_info: Dict[str, str] = field(default_factory=dict)

@dataclass
class ChartConfig:
    """Configuration pour un graphique"""
    chart_type: ChartType
    title: str
    data_query: str
    x_axis: str
    y_axis: str
    color_scheme: str = "viridis"
    size: Tuple[int, int] = (10, 6)

@dataclass
class ReportSection:
    """Section d'un rapport"""
    title: str
    content: str
    charts: List[Dict[str, Any]] = field(default_factory=list)
    tables: List[Dict[str, Any]] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)

class DataAnalyzer:
    """Analyseur de données pour les rapports"""
    
    def __init__(self, db_url: str):
        self.db_url = db_url
    
    async def get_compliance_statistics(self, date_range: Tuple[datetime, datetime]) -> Dict[str, Any]:
        """Récupère les statistiques de conformité"""
        conn = await asyncpg.connect(self.db_url)
        
        try:
            start_date, end_date = date_range
            
            # Statistiques générales des infractions
            infraction_stats_query = """
            SELECT 
                categorie,
                COUNT(*) as count,
                AVG(gravite) as avg_severity,
                SUM(CASE WHEN detectabilite_tachygraphe THEN 1 ELSE 0 END) as detectable_count
            FROM infractions
            GROUP BY categorie
            ORDER BY count DESC
            """
            infraction_stats = await conn.fetch(infraction_stats_query)
            
            # Évolution temporelle (simulation avec données de veille)
            evolution_query = """
            SELECT 
                DATE_TRUNC('month', date_publication) as month,
                COUNT(*) as updates_count,
                COUNT(CASE WHEN statut = 'intégré' THEN 1 END) as integrated_count
            FROM veille_reglementaire
            WHERE date_publication BETWEEN $1 AND $2
            GROUP BY month
            ORDER BY month
            """
            evolution_data = await conn.fetch(evolution_query, start_date, end_date)
            
            # Top des articles les plus référencés
            top_articles_query = """
            SELECT 
                a.code_article,
                a.source_juridique,
                COUNT(ia.infraction_id) as reference_count
            FROM articles_loi a
            LEFT JOIN infractions_articles ia ON a.id = ia.article_id
            GROUP BY a.id, a.code_article, a.source_juridique
            ORDER BY reference_count DESC
            LIMIT 10
            """
            top_articles = await conn.fetch(top_articles_query)
            
            return {
                'infraction_stats': [dict(row) for row in infraction_stats],
                'evolution_data': [dict(row) for row in evolution_data],
                'top_articles': [dict(row) for row in top_articles],
                'date_range': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat()
                }
            }
            
        finally:
            await conn.close()
    
    async def get_jurisprudence_trends(self, date_range: Tuple[datetime, datetime]) -> Dict[str, Any]:
        """Analyse les tendances de la jurisprudence"""
        conn = await asyncpg.connect(self.db_url)
        
        try:
            start_date, end_date = date_range
            
            jurisprudence_query = """
            SELECT 
                EXTRACT(YEAR FROM date_decision) as year,
                juridiction,
                COUNT(*) as decision_count,
                ARRAY_AGG(DISTINCT unnest(mots_cles)) FILTER (WHERE mots_cles IS NOT NULL) as keywords
            FROM jurisprudence
            WHERE date_decision BETWEEN $1 AND $2
            GROUP BY year, juridiction
            ORDER BY year DESC, decision_count DESC
            """
            jurisprudence_data = await conn.fetch(jurisprudence_query, start_date, end_date)
            
            return {
                'jurisprudence_trends': [dict(row) for row in jurisprudence_data]
            }
            
        finally:
            await conn.close()

class ChartGenerator:
    """Générateur de graphiques pour les rapports"""
    
    def __init__(self):
        # Configuration du style matplotlib
        plt.style.use('seaborn-v0_8')
        sns.set_palette("viridis")
    
    def generate_compliance_overview_chart(self, data: Dict[str, Any]) -> str:
        """Génère un graphique de vue d'ensemble de la conformité"""
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('Vue d\'ensemble de la Conformité Tachygraphique', fontsize=16, fontweight='bold')
        
        # Graphique 1: Répartition des infractions par catégorie
        infraction_stats = data.get('infraction_stats', [])
        if infraction_stats:
            categories = [stat['categorie'] for stat in infraction_stats]
            counts = [stat['count'] for stat in infraction_stats]
            
            colors_map = {'majeure': '#d32f2f', 'mineure': '#f57c00', 'administrative': '#1976d2'}
            bar_colors = [colors_map.get(cat, '#757575') for cat in categories]
            
            bars = ax1.bar(categories, counts, color=bar_colors)
            ax1.set_title('Infractions par Catégorie')
            ax1.set_ylabel('Nombre d\'infractions')
            
            # Ajouter les valeurs sur les barres
            for bar, count in zip(bars, counts):
                ax1.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.1,
                        str(count), ha='center', va='bottom')
        
        # Graphique 2: Gravité moyenne par catégorie
        if infraction_stats:
            gravites = [stat['avg_severity'] for stat in infraction_stats]
            ax2.bar(categories, gravites, color='skyblue')
            ax2.set_title('Gravité Moyenne par Catégorie')
            ax2.set_ylabel('Gravité (1-5)')
            ax2.set_ylim(0, 5)
        
        # Graphique 3: Évolution des mises à jour réglementaires
        evolution_data = data.get('evolution_data', [])
        if evolution_data:
            months = [row['month'] for row in evolution_data]
            updates = [row['updates_count'] for row in evolution_data]
            integrated = [row['integrated_count'] for row in evolution_data]
            
            ax3.plot(months, updates, marker='o', label='Mises à jour', linewidth=2)
            ax3.plot(months, integrated, marker='s', label='Intégrées', linewidth=2)
            ax3.set_title('Évolution des Mises à Jour Réglementaires')
            ax3.set_ylabel('Nombre de mises à jour')
            ax3.legend()
            ax3.tick_params(axis='x', rotation=45)
        
        # Graphique 4: Top 5 des articles les plus référencés
        top_articles = data.get('top_articles', [])[:5]
        if top_articles:
            article_codes = [art['code_article'] for art in top_articles]
            ref_counts = [art['reference_count'] for art in top_articles]
            
            ax4.barh(article_codes, ref_counts, color='lightcoral')
            ax4.set_title('Top 5 Articles les Plus Référencés')
            ax4.set_xlabel('Nombre de références')
            
            # Ajouter les valeurs
            for i, count in enumerate(ref_counts):
                ax4.text(count + 0.1, i, str(count), va='center')
        
        plt.tight_layout()
        
        # Sauvegarder en base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
        buffer.seek(0)
        chart_data = base64.b64encode(buffer.getvalue()).decode()
        plt.close()
        
        return chart_data
    
    def generate_trend_analysis_chart(self, data: Dict[str, Any]) -> str:
        """Génère un graphique d'analyse des tendances"""
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(15, 6))
        fig.suptitle('Analyse des Tendances Juridiques', fontsize=16, fontweight='bold')
        
        # Graphique 1: Évolution des décisions par année
        jurisprudence_trends = data.get('jurisprudence_trends', [])
        if jurisprudence_trends:
            # Agrégation par année
            year_data = {}
            for trend in jurisprudence_trends:
                year = trend['year']
                count = trend['decision_count']
                year_data[year] = year_data.get(year, 0) + count
            
            years = sorted(year_data.keys())
            counts = [year_data[year] for year in years]
            
            ax1.plot(years, counts, marker='o', linewidth=3, markersize=8)
            ax1.set_title('Évolution des Décisions de Justice')
            ax1.set_xlabel('Année')
            ax1.set_ylabel('Nombre de décisions')
            ax1.grid(True, alpha=0.3)
        
        # Graphique 2: Répartition par juridiction
        if jurisprudence_trends:
            juridiction_data = {}
            for trend in jurisprudence_trends:
                juridiction = trend['juridiction']
                count = trend['decision_count']
                juridiction_data[juridiction] = juridiction_data.get(juridiction, 0) + count
            
            juridictions = list(juridiction_data.keys())
            counts = list(juridiction_data.values())
            
            ax2.pie(counts, labels=juridictions, autopct='%1.1f%%', startangle=90)
            ax2.set_title('Répartition par Juridiction')
        
        plt.tight_layout()
        
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
        buffer.seek(0)
        chart_data = base64.b64encode(buffer.getvalue()).decode()
        plt.close()
        
        return chart_data

class PDFReportGenerator:
    """Générateur de rapports PDF"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Configure les styles personnalisés"""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=24,
            spaceAfter=30,
            textColor=colors.HexColor('#1976d2')
        ))
        
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=12,
            textColor=colors.HexColor('#424242')
        ))
        
        self.styles.add(ParagraphStyle(
            name='Recommendation',
            parent=self.styles['Normal'],
            leftIndent=20,
            bulletIndent=15,
            spaceAfter=6,
            textColor=colors.HexColor('#2e7d32')
        ))
    
    def generate_compliance_report(self, config: ReportConfig, data: Dict[str, Any], 
                                 charts: Dict[str, str]) -> bytes:
        """Génère un rapport de conformité en PDF"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*inch)
        
        story = []
        
        # En-tête du rapport
        story.append(Paragraph("Rapport de Conformité Tachygraphique", self.styles['CustomTitle']))
        story.append(Paragraph(f"Période: {config.date_range[0].strftime('%d/%m/%Y')} - {config.date_range[1].strftime('%d/%m/%Y')}", self.styles['Normal']))
        story.append(Paragraph(f"Généré le: {datetime.now().strftime('%d/%m/%Y à %H:%M')}", self.styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Résumé exécutif
        story.append(Paragraph("Résumé Exécutif", self.styles['SectionHeader']))
        
        infraction_stats = data.get('infraction_stats', [])
        total_infractions = sum(stat['count'] for stat in infraction_stats)
        
        summary_text = f"""
        Ce rapport présente une analyse complète de la conformité réglementaire 
        pour la période spécifiée. Au total, {total_infractions} types d'infractions 
        ont été référencés dans notre base de données juridique.
        """
        story.append(Paragraph(summary_text, self.styles['Normal']))
        story.append(Spacer(1, 15))
        
        # Graphique de vue d'ensemble
        if 'compliance_overview' in charts:
            story.append(Paragraph("Vue d'ensemble de la Conformité", self.styles['SectionHeader']))
            
            # Conversion base64 en image pour ReportLab
            chart_data = base64.b64decode(charts['compliance_overview'])
            chart_buffer = io.BytesIO(chart_data)
            
            img = Image(chart_buffer, width=6*inch, height=4.8*inch)
            story.append(img)
            story.append(Spacer(1, 20))
        
        # Analyse détaillée des infractions
        story.append(Paragraph("Analyse Détaillée des Infractions", self.styles['SectionHeader']))
        
        if infraction_stats:
            # Tableau des statistiques
            table_data = [['Catégorie', 'Nombre', 'Gravité Moyenne', 'Détectables']]
            
            for stat in infraction_stats:
                table_data.append([
                    stat['categorie'].title(),
                    str(stat['count']),
                    f"{stat['avg_severity']:.1f}/5",
                    str(stat['detectable_count'])
                ])
            
            table = Table(table_data)
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1976d2')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(table)
            story.append(Spacer(1, 20))
        
        # Articles de référence
        story.append(Paragraph("Articles de Loi les Plus Référencés", self.styles['SectionHeader']))
        
        top_articles = data.get('top_articles', [])[:5]
        if top_articles:
            for i, article in enumerate(top_articles, 1):
                article_text = f"{i}. {article['code_article']} ({article['source_juridique']}) - {article['reference_count']} références"
                story.append(Paragraph(article_text, self.styles['Normal']))
            
            story.append(Spacer(1, 20))
        
        # Recommandations
        story.append(Paragraph("Recommandations", self.styles['SectionHeader']))
        
        recommendations = [
            "Mettre en place une veille réglementaire continue",
            "Former régulièrement les conducteurs aux nouvelles réglementations",
            "Effectuer des audits de conformité trimestriels",
            "Maintenir à jour les équipements tachygraphiques",
            "Documenter toutes les procédures de contrôle"
        ]
        
        for rec in recommendations:
            story.append(Paragraph(f"• {rec}", self.styles['Recommendation']))
        
        story.append(Spacer(1, 20))
        
        # Pied de page avec informations légales
        footer_text = """
        <i>Ce rapport a été généré automatiquement par le système d'analyse juridique 
        tachygraphique de Sogestmatic. Les informations contenues dans ce document 
        sont basées sur la réglementation en vigueur à la date de génération.</i>
        """
        story.append(Paragraph(footer_text, self.styles['Normal']))
        
        # Construction du PDF
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

class ReportManager:
    """Gestionnaire principal des rapports"""
    
    def __init__(self, db_url: str):
        self.db_url = db_url
        self.data_analyzer = DataAnalyzer(db_url)
        self.chart_generator = ChartGenerator()
        self.pdf_generator = PDFReportGenerator()
    
    async def generate_report(self, config: ReportConfig) -> bytes:
        """Génère un rapport selon la configuration"""
        logger.info(f"🎯 Génération rapport: {config.report_type.value} - Format: {config.output_format.value}")
        
        try:
            # Collecte des données
            data = await self._collect_report_data(config)
            
            # Génération des graphiques
            charts = {}
            if config.include_charts:
                charts = await self._generate_report_charts(config, data)
            
            # Génération selon le format
            if config.output_format == ReportFormat.PDF:
                return self.pdf_generator.generate_compliance_report(config, data, charts)
            elif config.output_format == ReportFormat.JSON:
                return json.dumps({
                    'config': {
                        'report_type': config.report_type.value,
                        'date_range': [d.isoformat() for d in config.date_range],
                        'generated_at': datetime.now().isoformat()
                    },
                    'data': data,
                    'charts': charts
                }, indent=2).encode('utf-8')
            else:
                raise NotImplementedError(f"Format {config.output_format.value} non implémenté")
            
        except Exception as e:
            logger.error(f"Erreur génération rapport: {e}")
            raise
    
    async def _collect_report_data(self, config: ReportConfig) -> Dict[str, Any]:
        """Collecte les données nécessaires pour le rapport"""
        
        if config.report_type == ReportType.COMPLIANCE_AUDIT:
            return await self.data_analyzer.get_compliance_statistics(config.date_range)
        elif config.report_type == ReportType.TREND_ANALYSIS:
            compliance_data = await self.data_analyzer.get_compliance_statistics(config.date_range)
            jurisprudence_data = await self.data_analyzer.get_jurisprudence_trends(config.date_range)
            return {**compliance_data, **jurisprudence_data}
        else:
            # Par défaut, récupérer les données de conformité
            return await self.data_analyzer.get_compliance_statistics(config.date_range)
    
    async def _generate_report_charts(self, config: ReportConfig, data: Dict[str, Any]) -> Dict[str, str]:
        """Génère les graphiques pour le rapport"""
        charts = {}
        
        if config.report_type in [ReportType.COMPLIANCE_AUDIT, ReportType.FLEET_OVERVIEW]:
            charts['compliance_overview'] = self.chart_generator.generate_compliance_overview_chart(data)
        
        if config.report_type == ReportType.TREND_ANALYSIS:
            charts['trend_analysis'] = self.chart_generator.generate_trend_analysis_chart(data)
        
        return charts
    
    async def schedule_regular_reports(self, configurations: List[ReportConfig]):
        """Planifie la génération régulière de rapports"""
        logger.info(f"📅 Planification de {len(configurations)} rapports réguliers")
        
        for config in configurations:
            try:
                # Génération du rapport
                report_data = await self.generate_report(config)
                
                # Sauvegarde
                await self._save_generated_report(config, report_data)
                
                logger.info(f"✅ Rapport {config.report_type.value} généré et sauvegardé")
                
            except Exception as e:
                logger.error(f"Erreur génération rapport planifié {config.report_type.value}: {e}")
    
    async def _save_generated_report(self, config: ReportConfig, report_data: bytes):
        """Sauvegarde un rapport généré"""
        
        # Création du répertoire de rapports
        reports_dir = Path("generated_reports")
        reports_dir.mkdir(exist_ok=True)
        
        # Nom de fichier avec timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{config.report_type.value}_{timestamp}.{config.output_format.value}"
        
        file_path = reports_dir / filename
        
        with open(file_path, 'wb') as f:
            f.write(report_data)
        
        # Enregistrement en base de données
        conn = await asyncpg.connect(self.db_url)
        
        try:
            await conn.execute("""
                INSERT INTO generated_reports 
                (report_type, file_path, file_size, generated_at, config_json)
                VALUES ($1, $2, $3, $4, $5)
            """,
            config.report_type.value,
            str(file_path),
            len(report_data),
            datetime.now(),
            json.dumps({
                'output_format': config.output_format.value,
                'date_range': [d.isoformat() for d in config.date_range],
                'filters': config.filters
            })
            )
        finally:
            await conn.close()

# Point d'entrée pour tests
async def main():
    """Test du générateur de rapports"""
    logger.info("🚀 Test du générateur de rapports")
    
    db_url = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/tachygraphe_db")
    
    try:
        report_manager = ReportManager(db_url)
        
        # Configuration de test
        config = ReportConfig(
            report_type=ReportType.COMPLIANCE_AUDIT,
            output_format=ReportFormat.PDF,
            date_range=(datetime.now() - timedelta(days=365), datetime.now()),
            include_charts=True,
            include_recommendations=True,
            company_info={
                'name': 'Sogestmatic',
                'address': 'France',
                'contact': 'contact@sogestmatic.fr'
            }
        )
        
        # Génération du rapport
        report_data = await report_manager.generate_report(config)
        
        # Sauvegarde pour test
        test_file = Path("test_rapport_conformite.pdf")
        with open(test_file, 'wb') as f:
            f.write(report_data)
        
        logger.info(f"✅ Rapport de test généré: {test_file} ({len(report_data)} bytes)")
        
        # Test de rapport JSON
        config_json = ReportConfig(
            report_type=ReportType.TREND_ANALYSIS,
            output_format=ReportFormat.JSON,
            date_range=(datetime.now() - timedelta(days=180), datetime.now())
        )
        
        json_report = await report_manager.generate_report(config_json)
        
        test_json_file = Path("test_rapport_tendances.json")
        with open(test_json_file, 'wb') as f:
            f.write(json_report)
        
        logger.info(f"✅ Rapport JSON généré: {test_json_file}")
        
    except Exception as e:
        logger.error(f"Erreur test génération rapports: {e}")

if __name__ == "__main__":
    asyncio.run(main()) 