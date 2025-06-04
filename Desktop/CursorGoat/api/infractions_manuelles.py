"""
Base de données manuelle d'infractions critiques du transport routier
Infractions spécifiques ajoutées manuellement pour combler les lacunes
"""

from datetime import datetime
from typing import List, Dict, Any

def get_infractions_manuelles() -> List[Dict[str, Any]]:
    """
    Infractions critiques ajoutées manuellement
    Basées sur la jurisprudence et les cas fréquents en transport
    """
    
    infractions_manuelles = [
        {
            "id": "MANUEL_001",
            "titre": "Défaut de tachygraphe numérique pour véhicule >3.5T",
            "article": "R. 3315-4 du Code des transports",
            "description": "Véhicule de transport de marchandises de plus de 3,5 tonnes non équipé d'un tachygraphe numérique conforme au règlement CE 561/2006",
            "sanction": "Amende de 4ème classe - Immobilisation du véhicule possible",
            "amende_min": 90,
            "amende_max": 750,
            "points_permis": None,
            "immobilisation": "Possible jusqu'à régularisation",
            "gravite": "grave",
            "categorie": "tachygraphe",
            "sous_categorie": "equipement_obligatoire",
            "code_source": "Code des transports",
            "url_legifrance": "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006294563",
            "date_maj": datetime.now().strftime("%Y-%m-%d"),
            "tags": ["tachygraphe", "numérique", "obligatoire", "poids lourd", "équipement"],
            "professionnel_uniquement": True
        },
        {
            "id": "MANUEL_002", 
            "titre": "Conduite en dépassement de la durée continue de 4h30",
            "article": "Article 7 du Règlement CE 561/2006",
            "description": "Dépassement de la durée de conduite continue maximale de 4 heures 30 minutes sans pause de 45 minutes minimum",
            "sanction": "Amende de 4ème classe - Consignation possible",
            "amende_min": 135,
            "amende_max": 750,
            "points_permis": 1,
            "immobilisation": "Repos obligatoire du conducteur",
            "gravite": "grave",
            "categorie": "temps_conduite",
            "sous_categorie": "duree_continue",
            "code_source": "Règlement UE",
            "url_legifrance": "",
            "date_maj": datetime.now().strftime("%Y-%m-%d"),
            "tags": ["temps conduite", "4h30", "pause", "repos", "réglementation européenne"],
            "professionnel_uniquement": True
        },
        {
            "id": "MANUEL_003",
            "titre": "Transport sans FIMO/FCO valide",
            "article": "R. 3314-3 du Code des transports",
            "description": "Conduite d'un véhicule de transport de marchandises ou de voyageurs sans formation FIMO ou FCO à jour",
            "sanction": "Amende de 4ème classe - Immobilisation possible",
            "amende_min": 135,
            "amende_max": 750,
            "points_permis": None,
            "immobilisation": "Possible si conducteur non qualifié",
            "gravite": "grave",
            "categorie": "formation",
            "sous_categorie": "qualification_professionnelle",
            "code_source": "Code des transports",
            "url_legifrance": "https://www.legifrance.gouv.fr/codes/article_lc/LEGIARTI000006294563",
            "date_maj": datetime.now().strftime("%Y-%m-%d"),
            "tags": ["FIMO", "FCO", "formation", "qualification", "conducteur professionnel"],
            "professionnel_uniquement": True
        },
        {
            "id": "MANUEL_004",
            "titre": "Surcharge supérieure à 5% du PTAC",
            "article": "R. 312-4 du Code de la route",
            "description": "Véhicule en surcharge de plus de 5% de son poids total autorisé en charge (PTAC)",
            "sanction": "Amende de 4ème classe - Déchargement obligatoire - Immobilisation",
            "amende_min": 135,
            "amende_max": 750,
            "points_permis": None,
            "immobilisation": "Obligatoire jusqu'à régularisation du poids",
            "gravite": "grave",
            "categorie": "surcharge",
            "sous_categorie": "depassement_ptac",
            "code_source": "Code de la route",
            "url_legifrance": "",
            "date_maj": datetime.now().strftime("%Y-%m-%d"),
            "tags": ["surcharge", "PTAC", "poids", "déchargement", "pesage"],
            "professionnel_uniquement": False
        },
        {
            "id": "MANUEL_005",
            "titre": "Conduite sans respect du repos hebdomadaire de 45h",
            "article": "Article 8 du Règlement CE 561/2006",
            "description": "Non-respect du repos hebdomadaire normal de 45 heures consécutives ou réduit de 24 heures",
            "sanction": "Amende de 5ème classe - Repos obligatoire immédiat",
            "amende_min": 750,
            "amende_max": 1500,
            "points_permis": 2,
            "immobilisation": "Repos immédiat du conducteur obligatoire",
            "gravite": "tres_grave",
            "categorie": "temps_repos",
            "sous_categorie": "repos_hebdomadaire",
            "code_source": "Règlement UE",
            "url_legifrance": "",
            "date_maj": datetime.now().strftime("%Y-%m-%d"),
            "tags": ["repos hebdomadaire", "45 heures", "réglementation sociale", "fatigue"],
            "professionnel_uniquement": True
        },
        {
            "id": "MANUEL_006",
            "titre": "Usage de téléphone tenu en main par conducteur PL",
            "article": "R. 412-6-1 du Code de la route",
            "description": "Utilisation d'un téléphone tenu en main par le conducteur d'un poids lourd",
            "sanction": "Amende forfaitaire de 135€ + retrait de 3 points + suspension possible",
            "amende_min": 135,
            "amende_max": 135,
            "points_permis": 3,
            "suspension_permis": "Possible 1 à 6 mois",
            "gravite": "grave",
            "categorie": "infractions_routieres",
            "sous_categorie": "telephone_volant",
            "code_source": "Code de la route",
            "url_legifrance": "",
            "date_maj": datetime.now().strftime("%Y-%m-%d"),
            "tags": ["téléphone", "distraction", "poids lourd", "sécurité routière"],
            "professionnel_uniquement": False
        },
        {
            "id": "MANUEL_007",
            "titre": "Transport sans vignette Crit'Air en ZFE",
            "article": "R. 411-19-1 du Code de l'environnement",
            "description": "Circulation d'un véhicule de transport sans vignette Crit'Air obligatoire en Zone à Faibles Émissions",
            "sanction": "Amende forfaitaire de 68€ pour VUL, 135€ pour PL",
            "amende_min": 68,
            "amende_max": 135,
            "points_permis": None,
            "immobilisation": "Possible en cas de récidive",
            "gravite": "moyenne",
            "categorie": "environnement",
            "sous_categorie": "zfe_critair",
            "code_source": "Code de l'environnement",
            "url_legifrance": "",
            "date_maj": datetime.now().strftime("%Y-%m-%d"),
            "tags": ["Crit'Air", "ZFE", "pollution", "environnement", "vignette"],
            "professionnel_uniquement": False
        },
        {
            "id": "MANUEL_008",
            "titre": "Arrimage insuffisant ou défaillant",
            "article": "R. 312-19 du Code de la route",
            "description": "Chargement mal arrimé, sangles insuffisantes ou défaillantes présentant un danger",
            "sanction": "Amende de 4ème classe - Immobilisation jusqu'à remise en conformité",
            "amende_min": 135,
            "amende_max": 750,
            "points_permis": None,
            "immobilisation": "Obligatoire jusqu'à sécurisation du chargement",
            "gravite": "grave",
            "categorie": "securite",
            "sous_categorie": "arrimage_chargement",
            "code_source": "Code de la route",
            "url_legifrance": "",
            "date_maj": datetime.now().strftime("%Y-%m-%d"),
            "tags": ["arrimage", "chargement", "sangles", "sécurité", "transport"],
            "professionnel_uniquement": False
        },
        {
            "id": "MANUEL_009",
            "titre": "Excès de vitesse > 50 km/h poids lourd",
            "article": "R. 413-14-1 du Code de la route", 
            "description": "Grand excès de vitesse supérieur à 50 km/h avec un poids lourd",
            "sanction": "Amende de 5ème classe - 6 points - Suspension obligatoire - Immobilisation",
            "amende_min": 1500,
            "amende_max": 3000,
            "points_permis": 6,
            "suspension_permis": "3 ans maximum (1 an minimum)",
            "immobilisation": "Obligatoire sur décision préfectorale",
            "gravite": "tres_grave",
            "categorie": "vitesse_pl",
            "sous_categorie": "grand_exces",
            "code_source": "Code de la route", 
            "url_legifrance": "",
            "date_maj": datetime.now().strftime("%Y-%m-%d"),
            "tags": ["grand excès", "vitesse", "poids lourd", "suspension", "sécurité"],
            "professionnel_uniquement": False
        },
        {
            "id": "MANUEL_010",
            "titre": "Transport de matières dangereuses sans formation ADR",
            "article": "R. 1252-1 du Code des transports",
            "description": "Transport de matières dangereuses par conducteur non titulaire du certificat ADR",
            "sanction": "Amende de 5ème classe - Immobilisation obligatoire",
            "amende_min": 1500,
            "amende_max": 3000,
            "points_permis": None,
            "immobilisation": "Obligatoire jusqu'à régularisation",
            "gravite": "tres_grave",
            "categorie": "matieres_dangereuses",
            "sous_categorie": "formation_adr",
            "code_source": "Code des transports",
            "url_legifrance": "",
            "date_maj": datetime.now().strftime("%Y-%m-%d"),
            "tags": ["ADR", "matières dangereuses", "formation", "certificat", "sécurité"],
            "professionnel_uniquement": True
        }
    ]
    
    return infractions_manuelles

def get_infractions_par_montant() -> List[Dict[str, Any]]:
    """
    Infractions classées par montant d'amende pour référence rapide
    """
    
    infractions_courantes = [
        {
            "id": "MONTANT_001",
            "titre": "Stationnement gênant poids lourd",
            "amende": 35,
            "description": "Stationnement d'un poids lourd gênant la circulation ou dangereux",
            "categorie": "stationnement"
        },
        {
            "id": "MONTANT_002", 
            "titre": "Défaut port ceinture conducteur PL",
            "amende": 135,
            "description": "Non port de la ceinture de sécurité par le conducteur poids lourd",
            "categorie": "securite"
        },
        {
            "id": "MONTANT_003",
            "titre": "Excès vitesse 10-20 km/h PL",
            "amende": 135,
            "description": "Excès de vitesse entre 10 et 20 km/h avec un poids lourd",
            "categorie": "vitesse"
        },
        {
            "id": "MONTANT_004",
            "titre": "Transport sans licence",
            "amende": 750,
            "description": "Transport public de marchandises sans licence ou autorisation",
            "categorie": "documents"
        },
        {
            "id": "MONTANT_005",
            "titre": "Conduite sous alcool PL (> 0.8 g/l)",
            "amende": 4500,
            "description": "Conduite en état alcoolique avec un poids lourd, taux supérieur à 0,8 g/l",
            "categorie": "alcool"
        }
    ]
    
    return infractions_courantes 