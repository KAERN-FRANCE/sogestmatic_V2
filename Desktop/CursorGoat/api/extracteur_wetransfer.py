#!/usr/bin/env python3
"""
Extracteur de données Wetransfer pour Sogestmatic
Analyse les PDFs de réglementation et extrait les infractions spécifiques
"""

import os
import sys
import re
from datetime import datetime
from typing import List, Dict, Any, Optional
import logging

# Configuration logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from PyPDF2 import PdfReader
except ImportError:
    logger.error("PyPDF2 non installé. Installation: pip install PyPDF2")
    sys.exit(1)

class ExtracteurWetransfer:
    """Extracteur d'infractions depuis les documents PDF Wetransfer"""
    
    def __init__(self, chemin_wetransfer: str):
        self.chemin_wetransfer = chemin_wetransfer
        self.infractions_extraites = []
        
        # Patterns de reconnaissance d'infractions
        self.patterns_infractions = {
            'article': re.compile(r'(Article\s+\d+[^\n]*|Art\.\s*\d+[^\n]*)', re.IGNORECASE),
            'amende': re.compile(r'amende[^.]*?(\d+(?:\s*\d{3})*(?:[,\.]\d{2})?)\s*(?:€|euros?)', re.IGNORECASE),
            'points': re.compile(r'(\d+)\s*points?(?:\s*(?:de\s*)?permis)?', re.IGNORECASE),
            'suspension': re.compile(r'suspension[^.]*?(\d+\s*(?:mois|ans?))', re.IGNORECASE),
            'immobilisation': re.compile(r'immobilisation[^.]*?(?:véhicule|du\s*véhicule)', re.IGNORECASE),
            'sanction': re.compile(r'sanction[s]?\s*[:\-]?\s*([^.]{20,100})', re.IGNORECASE)
        }
        
        # Mots-clés prioritaires pour le transport
        self.mots_cles_transport = [
            'tachygraphe', 'temps de conduite', 'repos', 'FIMO', 'FCO',
            'poids lourd', 'PTAC', 'surcharge', 'vitesse', 'stationnement',
            'matières dangereuses', 'ADR', 'licence transport', 'cabotage',
            'formation conducteur', 'carte conducteur', 'appareil de contrôle',
            'amplitude', 'pause', 'repos journalier', 'repos hebdomadaire',
            'contrôle technique', 'vignette', 'ZFE', 'arrimage', 'chargement'
        ]

    def extraire_texte_pdf(self, chemin_pdf: str) -> str:
        """Extrait le texte d'un PDF"""
        try:
            reader = PdfReader(chemin_pdf)
            texte_complet = ""
            
            for page_num, page in enumerate(reader.pages, 1):
                try:
                    texte_page = page.extract_text()
                    if texte_page:
                        texte_complet += f"\n--- PAGE {page_num} ---\n{texte_page}"
                except Exception as e:
                    logger.warning(f"Erreur extraction page {page_num} de {chemin_pdf}: {e}")
                    continue
            
            return texte_complet
            
        except Exception as e:
            logger.error(f"Erreur lecture PDF {chemin_pdf}: {e}")
            return ""

    def analyser_documents_wetransfer(self) -> List[Dict[str, Any]]:
        """Analyse tous les documents PDF du dossier Wetransfer"""
        
        documents_prioritaires = [
            "Réglement 561-2006 Officiel.pdf",  # Temps de conduite et repos
            "Code du transport au 07-05-2025.pdf",  # Code des transports complet
            "UE 2022-694 du 2 mai 2022.pdf",  # Règlement tachygraphe récent
            "regl-165-2014.pdf",  # Tachygraphe numérique
            "UE 2024-1258 du 24 avril 2024.pdf",  # Dernières modifications
            "Code du travail au 07-05-2025.pdf"  # Temps de travail conducteurs
        ]
        
        logger.info(f"🔍 Analyse des documents Wetransfer depuis {self.chemin_wetransfer}")
        
        # Lister tous les PDFs disponibles
        pdfs_disponibles = []
        try:
            for fichier in os.listdir(self.chemin_wetransfer):
                if fichier.endswith('.pdf'):
                    pdfs_disponibles.append(fichier)
        except Exception as e:
            logger.error(f"Erreur accès dossier {self.chemin_wetransfer}: {e}")
            return []
        
        logger.info(f"📚 {len(pdfs_disponibles)} PDFs trouvés")
        
        # Traiter les documents prioritaires d'abord
        documents_a_traiter = []
        for doc_prioritaire in documents_prioritaires:
            # Recherche flexible des noms de fichiers
            for pdf_dispo in pdfs_disponibles:
                if any(mot in pdf_dispo for mot in doc_prioritaire.split()):
                    documents_a_traiter.append(pdf_dispo)
                    break
        
        # Ajouter les autres documents
        for pdf in pdfs_disponibles:
            if pdf not in documents_a_traiter:
                documents_a_traiter.append(pdf)
        
        # Analyser chaque document
        infractions_totales = []
        
        for nom_fichier in documents_a_traiter[:5]:  # Limiter à 5 docs pour le test
            chemin_complet = os.path.join(self.chemin_wetransfer, nom_fichier)
            logger.info(f"📖 Analyse: {nom_fichier}")
            
            texte = self.extraire_texte_pdf(chemin_complet)
            if texte:
                infractions_doc = self.extraire_infractions_du_texte(texte, nom_fichier)
                infractions_totales.extend(infractions_doc)
                logger.info(f"   ✅ {len(infractions_doc)} infractions extraites")
        
        logger.info(f"🎯 Total infractions extraites: {len(infractions_totales)}")
        return infractions_totales

    def extraire_infractions_du_texte(self, texte: str, source_doc: str) -> List[Dict[str, Any]]:
        """Extrait les infractions d'un texte de document"""
        
        infractions = []
        
        # Découper le texte en sections logiques
        sections = self.decouper_en_sections(texte)
        
        for i, section in enumerate(sections):
            # Vérifier si la section contient des mots-clés transport
            if self.contient_mots_cles_transport(section):
                infraction = self.analyser_section_infraction(section, source_doc, i)
                if infraction:
                    infractions.append(infraction)
        
        return infractions

    def decouper_en_sections(self, texte: str) -> List[str]:
        """Découpe le texte en sections logiques"""
        
        # Patterns de découpage
        patterns_section = [
            r'Article\s+\d+[^\n]*',
            r'Art\.\s*\d+[^\n]*',
            r'Section\s+\d+',
            r'Chapitre\s+\d+',
            r'\d+\.\s*[A-Z][^\n]*',
            r'[A-Z]{2,}[^\n]*:'
        ]
        
        sections = []
        position_actuelle = 0
        
        # Trouver toutes les positions de section
        positions_sections = []
        for pattern in patterns_section:
            for match in re.finditer(pattern, texte, re.IGNORECASE):
                positions_sections.append(match.start())
        
        # Trier les positions
        positions_sections = sorted(set(positions_sections))
        
        # Découper le texte
        for i, pos in enumerate(positions_sections):
            fin_section = positions_sections[i + 1] if i + 1 < len(positions_sections) else len(texte)
            section = texte[pos:fin_section].strip()
            if len(section) > 50:  # Sections assez longues
                sections.append(section)
        
        # Si pas de sections trouvées, découper par taille
        if not sections and len(texte) > 1000:
            taille_section = 2000
            for i in range(0, len(texte), taille_section):
                sections.append(texte[i:i+taille_section])
        
        return sections

    def contient_mots_cles_transport(self, texte: str) -> bool:
        """Vérifie si le texte contient des mots-clés transport"""
        texte_lower = texte.lower()
        return any(mot_cle.lower() in texte_lower for mot_cle in self.mots_cles_transport)

    def analyser_section_infraction(self, section: str, source_doc: str, section_num: int) -> Optional[Dict[str, Any]]:
        """Analyse une section et extrait les informations d'infraction"""
        
        # Extraire l'article
        match_article = self.patterns_infractions['article'].search(section)
        article = match_article.group(1).strip() if match_article else f"Section {section_num}"
        
        # Extraire l'amende
        match_amende = self.patterns_infractions['amende'].search(section)
        amende_max = None
        if match_amende:
            try:
                amende_str = match_amende.group(1).replace(' ', '').replace(',', '.')
                amende_max = float(amende_str)
            except:
                pass
        
        # Extraire les points
        match_points = self.patterns_infractions['points'].search(section)
        points = int(match_points.group(1)) if match_points else None
        
        # Extraire la suspension
        match_suspension = self.patterns_infractions['suspension'].search(section)
        suspension = match_suspension.group(1) if match_suspension else None
        
        # Vérifier immobilisation
        immobilisation = "Possible" if self.patterns_infractions['immobilisation'].search(section) else None
        
        # Générer le titre basé sur les mots-clés présents
        mots_cles_trouves = [mc for mc in self.mots_cles_transport if mc.lower() in section.lower()]
        
        if not mots_cles_trouves:
            return None
        
        # Créer le titre et la description
        mot_cle_principal = mots_cles_trouves[0]
        titre = f"Infraction relative à {mot_cle_principal}"
        
        # Extraire une description plus précise
        description = self.extraire_description(section, mot_cle_principal)
        
        # Déterminer la gravité
        gravite = self.determiner_gravite(amende_max, points, suspension, immobilisation)
        
        # Déterminer la catégorie
        categorie = self.determiner_categorie(mots_cles_trouves)
        
        # Créer l'infraction
        infraction = {
            "id": f"WETRANS_{hash(f'{source_doc}_{section_num}_{article}') % 1000000:06d}",
            "titre": titre,
            "article": article,
            "description": description,
            "sanction": self.generer_texte_sanction(amende_max, points, suspension, immobilisation),
            "amende_max": amende_max,
            "points_permis": points,
            "suspension_permis": suspension,
            "immobilisation": immobilisation,
            "gravite": gravite,
            "categorie": categorie,
            "sous_categorie": mot_cle_principal.replace(' ', '_').lower(),
            "code_source": source_doc,
            "url_legifrance": "",
            "date_maj": datetime.now().strftime("%Y-%m-%d"),
            "tags": mots_cles_trouves[:5],  # Limiter à 5 tags
            "mots_cles": mots_cles_trouves,
            "professionnel_uniquement": self.est_professionnel_uniquement(mots_cles_trouves),
            "texte_integral": section[:500] + "..." if len(section) > 500 else section
        }
        
        return infraction

    def extraire_description(self, section: str, mot_cle_principal: str) -> str:
        """Extrait une description claire de l'infraction"""
        
        # Chercher des phrases contenant le mot-clé
        phrases = re.split(r'[.!?]+', section)
        
        descriptions_candidates = []
        for phrase in phrases:
            if mot_cle_principal.lower() in phrase.lower() and len(phrase.strip()) > 20:
                descriptions_candidates.append(phrase.strip())
        
        if descriptions_candidates:
            # Prendre la phrase la plus courte et claire
            description = min(descriptions_candidates, key=len)
            return description[:200] + "..." if len(description) > 200 else description
        
        # Description par défaut
        return f"Infraction relative à la réglementation {mot_cle_principal}"

    def determiner_gravite(self, amende: Optional[float], points: Optional[int], 
                          suspension: Optional[str], immobilisation: Optional[str]) -> str:
        """Détermine la gravité de l'infraction"""
        
        score_gravite = 0
        
        if amende:
            if amende >= 1500:
                score_gravite += 3
            elif amende >= 750:
                score_gravite += 2
            elif amende >= 135:
                score_gravite += 1
        
        if points:
            if points >= 6:
                score_gravite += 3
            elif points >= 3:
                score_gravite += 2
            elif points >= 1:
                score_gravite += 1
        
        if suspension:
            score_gravite += 2
        
        if immobilisation:
            score_gravite += 1
        
        if score_gravite >= 5:
            return "tres_grave"
        elif score_gravite >= 3:
            return "grave"
        elif score_gravite >= 1:
            return "moyenne"
        else:
            return "faible"

    def determiner_categorie(self, mots_cles: List[str]) -> str:
        """Détermine la catégorie principale de l'infraction"""
        
        mapping_categories = {
            'tachygraphe': 'tachygraphe',
            'temps de conduite': 'temps_conduite',
            'repos': 'temps_repos',
            'FIMO': 'formation',
            'FCO': 'formation',
            'formation': 'formation',
            'poids lourd': 'vehicule_pl',
            'vitesse': 'vitesse_pl',
            'surcharge': 'surcharge',
            'PTAC': 'surcharge',
            'stationnement': 'stationnement',
            'ADR': 'matieres_dangereuses',
            'matières dangereuses': 'matieres_dangereuses',
            'licence': 'documents_transport',
            'cabotage': 'transport_international',
            'contrôle technique': 'controle_technique',
            'vignette': 'environnement',
            'ZFE': 'environnement',
            'arrimage': 'securite_chargement',
            'chargement': 'securite_chargement'
        }
        
        for mot_cle in mots_cles:
            for pattern, categorie in mapping_categories.items():
                if pattern.lower() in mot_cle.lower():
                    return categorie
        
        return 'reglementaire'

    def est_professionnel_uniquement(self, mots_cles: List[str]) -> bool:
        """Détermine si l'infraction concerne uniquement les professionnels"""
        
        termes_professionnels = [
            'FIMO', 'FCO', 'licence transport', 'cabotage', 'tachygraphe',
            'temps de conduite', 'formation conducteur', 'ADR', 'carte conducteur'
        ]
        
        return any(terme.lower() in ' '.join(mots_cles).lower() for terme in termes_professionnels)

    def generer_texte_sanction(self, amende: Optional[float], points: Optional[int],
                              suspension: Optional[str], immobilisation: Optional[str]) -> str:
        """Génère le texte descriptif des sanctions"""
        
        sanctions = []
        
        if amende:
            sanctions.append(f"Amende jusqu'à {amende:.0f}€")
        
        if points:
            sanctions.append(f"Retrait de {points} points")
        
        if suspension:
            sanctions.append(f"Suspension de permis: {suspension}")
        
        if immobilisation:
            sanctions.append("Immobilisation du véhicule possible")
        
        if not sanctions:
            sanctions.append("Sanctions selon la réglementation en vigueur")
        
        return " - ".join(sanctions)

# Fonction d'export pour intégration
def extraire_donnees_wetransfer(chemin_wetransfer: str) -> List[Dict[str, Any]]:
    """
    Point d'entrée principal pour l'extraction des données Wetransfer
    """
    extracteur = ExtracteurWetransfer(chemin_wetransfer)
    infractions = extracteur.analyser_documents_wetransfer()
    
    logger.info(f"🎯 Extraction terminée: {len(infractions)} nouvelles infractions")
    return infractions

if __name__ == "__main__":
    # Test local
    chemin_test = "/Users/noah/Downloads/wetransfer_fichiers-reglementation-hackathon_2025-05-07_1823 (1)"
    infractions = extraire_donnees_wetransfer(chemin_test)
    
    print(f"\n📊 RÉSUMÉ EXTRACTION WETRANSFER")
    print(f"Total infractions: {len(infractions)}")
    
    if infractions:
        print(f"\nExemples d'infractions extraites:")
        for i, infr in enumerate(infractions[:3], 1):
            print(f"\n{i}. {infr['titre']}")
            print(f"   Article: {infr['article']}")
            print(f"   Catégorie: {infr['categorie']}")
            print(f"   Gravité: {infr['gravite']}")
            if infr['amende_max']:
                print(f"   Amende max: {infr['amende_max']}€") 