"""
Article 13 - Dérogations au règlement UE 561/2006
Intégration dans la base Sogestmatic
"""

from datetime import datetime
from typing import Dict, List, Any

def get_article_13_derogations() -> List[Dict[str, Any]]:
    """
    Article 13 du règlement UE 561/2006 : dérogations aux règles de temps de conduite et de repos
    """
    
    base_info = {
        "code_source": "Règlement UE 561/2006",
        "article": "Article 13",
        "titre_general": "Dérogations aux règles de temps de conduite et de repos",
        "date_maj": datetime.now().strftime("%Y-%m-%d"),
        "gravite": "moyenne",
        "categorie": "derogations_reglementaires",
        "url_legifrance": "https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:02006R0561-20200820",
        "tags": ["dérogations", "exceptions", "règlement_561", "temps_conduite", "repos_conducteur"]
    }
    
    derogations = []
    
    # a) Véhicules appartenant à des pouvoirs publics
    derogations.append({
        "id": "ART13_a_vehicules_publics",
        "titre": "Dérogation véhicules des pouvoirs publics (Article 13a)",
        "description": "Véhicules appartenant à des pouvoirs publics ou loués sans conducteur par ceux-ci pour effectuer des transports par route qui ne concurrencent pas les entreprises de transport privées",
        "conditions": [
            "Appartenir à des pouvoirs publics",
            "Être loué sans conducteur par des pouvoirs publics", 
            "Ne pas concurrencer les entreprises de transport privées"
        ],
        "sanction": "Applicable uniquement si les conditions sont respectées",
        "application": "Transport public non commercial",
        **base_info
    })
    
    # b) Véhicules agricoles dans un rayon de 100km
    derogations.append({
        "id": "ART13_b_vehicules_agricoles",
        "titre": "Dérogation véhicules agricoles et assimilés - 100km (Article 13b)",
        "description": "Véhicules utilisés par des entreprises d'agriculture, d'horticulture, de sylviculture, d'élevage ou de pêche pour le transport de biens dans le cadre de leur activité professionnelle spécifique dans un rayon allant jusqu'à 100 km",
        "conditions": [
            "Entreprise d'agriculture, horticulture, sylviculture, élevage ou pêche",
            "Transport de biens dans le cadre de l'activité spécifique",
            "Rayon maximum de 100 km autour du lieu d'établissement"
        ],
        "rayon_km": 100,
        "secteurs": ["agriculture", "horticulture", "sylviculture", "élevage", "pêche"],
        "sanction": "Contrôler le respect du rayon de 100km et de l'activité",
        **base_info
    })
    
    # c) Tracteurs agricoles ou forestiers
    derogations.append({
        "id": "ART13_c_tracteurs_agricoles",
        "titre": "Dérogation tracteurs agricoles et forestiers - 100km (Article 13c)",
        "description": "Tracteurs agricoles ou forestiers utilisés pour des activités agricoles ou forestières, dans un rayon allant jusqu'à 100 km autour du lieu d'établissement de l'entreprise propriétaire, locataire ou en leasing",
        "conditions": [
            "Tracteurs agricoles ou forestiers uniquement",
            "Activités agricoles ou forestières exclusivement",
            "Rayon maximum de 100 km autour du lieu d'établissement",
            "Entreprise propriétaire, locataire ou en leasing"
        ],
        "rayon_km": 100,
        "types_vehicules": ["tracteur_agricole", "tracteur_forestier"],
        **base_info
    })
    
    # d) Véhicules ≤ 7,5T pour service postal universel
    derogations.append({
        "id": "ART13_d_service_postal",
        "titre": "Dérogation service postal universel ≤7,5T (Article 13d)",
        "description": "Véhicules ou combinaison de véhicules d'une masse maximale admissible n'excédant pas 7,5 tonnes utilisés par des prestataires du service universel pour livrer des envois dans le cadre du service universel",
        "conditions": [
            "Masse maximale admissible ≤ 7,5 tonnes",
            "Prestataires du service universel (directive 97/67/CE)",
            "Livraison d'envois dans le cadre du service universel",
            "Rayon de 100 kilomètres autour du lieu d'établissement",
            "La conduite ne doit pas constituer l'activité principale du conducteur"
        ],
        "ptac_max_tonnes": 7.5,
        "rayon_km": 100,
        "secteur": "service_postal",
        **base_info
    })
    
    # e) Véhicules sur îles ou régions isolées
    derogations.append({
        "id": "ART13_e_iles_regions_isolees", 
        "titre": "Dérogation îles et régions isolées ≤2300km² (Article 13e)",
        "description": "Véhicules circulant exclusivement sur des îles ou dans des régions isolées du reste du territoire national dont la superficie ne dépasse pas 2 300 kilomètres carrés et qui ne sont ni reliées au reste du territoire par un pont, gué ou tunnel, ni limitrophes d'un autre État membre",
        "conditions": [
            "Circulation exclusive sur îles ou régions isolées",
            "Superficie ≤ 2 300 kilomètres carrés", 
            "Pas de liaison terrestre (pont, gué, tunnel)",
            "Pas de frontière avec un autre État membre"
        ],
        "superficie_max_km2": 2300,
        "zone_geographique": "iles_regions_isolees",
        **base_info
    })
    
    # f) Véhicules écologiques ≤7,5T dans 100km
    derogations.append({
        "id": "ART13_f_vehicules_ecologiques",
        "titre": "Dérogation véhicules écologiques ≤7,5T - 100km (Article 13f)",
        "description": "Véhicules utilisés pour le transport de marchandises dans un rayon de 100 kilomètres, propulsés au gaz naturel, au gaz liquéfié ou à l'électricité, dont la masse maximale autorisée ne dépasse pas 7,5 tonnes",
        "conditions": [
            "Transport de marchandises uniquement",
            "Rayon maximum de 100 kilomètres autour du lieu d'établissement",
            "Propulsion : gaz naturel, gaz liquéfié ou électricité",
            "Masse maximale autorisée ≤ 7,5 tonnes (remorque comprise)"
        ],
        "ptac_max_tonnes": 7.5,
        "rayon_km": 100,
        "carburants": ["gaz_naturel", "gaz_liquefie", "electricite"],
        "environnement": "vehicule_propre",
        **base_info
    })
    
    # g) Véhicules d'auto-école
    derogations.append({
        "id": "ART13_g_auto_ecole",
        "titre": "Dérogation véhicules d'auto-école (Article 13g)",
        "description": "Véhicules utilisés pour des cours et des examens de conduite préparant à l'obtention du permis de conduire ou d'un certificat d'aptitude professionnelle, non utilisés pour le transport commercial",
        "conditions": [
            "Cours et examens de conduite uniquement",
            "Préparation permis de conduire ou certificat d'aptitude professionnelle",
            "Pas de transport de marchandises ou voyageurs à des fins commerciales"
        ],
        "usage": "formation_conduite",
        "exclusions": ["transport_commercial_marchandises", "transport_commercial_voyageurs"],
        **base_info
    })
    
    # h) Véhicules de services publics
    derogations.append({
        "id": "ART13_h_services_publics",
        "titre": "Dérogation véhicules de services publics (Article 13h)",
        "description": "Véhicules utilisés pour l'évacuation des eaux usées, protection contre inondations, services des eaux/gaz/électricité, entretien voirie, collecte déchets ménagers, télécommunications, détection postes radio/TV",
        "conditions": [
            "Activités de service public spécifiées dans l'article"
        ],
        "services_concernes": [
            "évacuation_eaux_usées",
            "protection_inondations", 
            "service_eaux_gaz_electricite",
            "entretien_surveillance_voirie",
            "collecte_elimination_dechets_menagers",
            "telegraphe_telephone",
            "radio_telediffusion",
            "detection_postes_emetteurs"
        ],
        **base_info
    })
    
    # i) Minibus 10-17 places non commercial
    derogations.append({
        "id": "ART13_i_minibus_non_commercial",
        "titre": "Dérogation minibus 10-17 places non commercial (Article 13i)",
        "description": "Véhicules comportant de 10 à 17 sièges destinés exclusivement au transport non commercial de voyageurs",
        "conditions": [
            "10 à 17 sièges exactement",
            "Transport exclusivement non commercial",
            "Transport de voyageurs uniquement"
        ],
        "nombre_places_min": 10,
        "nombre_places_max": 17,
        "usage": "transport_non_commercial",
        **base_info
    })
    
    # j) Véhicules cirque/fêtes foraines
    derogations.append({
        "id": "ART13_j_cirque_fetes_foraines",
        "titre": "Dérogation véhicules cirque et fêtes foraines (Article 13j)",
        "description": "Véhicules spécialisés transportant du matériel de cirque ou de fêtes foraines",
        "conditions": [
            "Véhicules spécialisés",
            "Transport de matériel de cirque ou fêtes foraines exclusivement"
        ],
        "secteur": "spectacle_forain",
        "materiel": ["cirque", "fetes_foraines"],
        **base_info
    })
    
    # k) Véhicules projet mobile enseignement
    derogations.append({
        "id": "ART13_k_projet_mobile_enseignement",
        "titre": "Dérogation véhicules projet mobile d'enseignement (Article 13k)",
        "description": "Véhicules de projet mobile spécialement équipés, destinés principalement à des fins d'enseignement lorsqu'ils sont à l'arrêt",
        "conditions": [
            "Véhicules spécialement équipés",
            "Fins d'enseignement principalement",
            "Utilisation à l'arrêt"
        ],
        "usage": "enseignement_mobile",
        "statut": "arret_principal",
        **base_info
    })
    
    # l) Véhicules collecte lait
    derogations.append({
        "id": "ART13_l_collecte_lait",
        "titre": "Dérogation véhicules collecte lait (Article 13l)",
        "description": "Véhicules utilisés pour la collecte du lait dans les fermes et/ou pour ramener aux fermes des bidons à lait ou des produits laitiers destinés à l'alimentation du bétail",
        "conditions": [
            "Collecte du lait dans les fermes",
            "Ou transport bidons à lait vers fermes",
            "Ou transport produits laitiers pour alimentation bétail"
        ],
        "secteur": "industrie_laitiere",
        "activites": ["collecte_lait", "transport_bidons", "transport_produits_laitiers_betail"],
        **base_info
    })
    
    # m) Véhicules transport de fonds
    derogations.append({
        "id": "ART13_m_transport_fonds",
        "titre": "Dérogation véhicules transport de fonds (Article 13m)",
        "description": "Véhicules spécialisés pour le transport d'argent et/ou d'objets de valeur",
        "conditions": [
            "Véhicules spécialisés",
            "Transport d'argent et/ou objets de valeur exclusivement"
        ],
        "secteur": "securite_transport_fonds",
        "marchandises": ["argent", "objets_valeur"],
        **base_info
    })
    
    # n) Véhicules déchets animaux
    derogations.append({
        "id": "ART13_n_dechets_animaux",
        "titre": "Dérogation véhicules déchets animaux (Article 13n)",
        "description": "Véhicules transportant des déchets d'animaux ou des carcasses non destinés à la consommation humaine",
        "conditions": [
            "Transport déchets d'animaux",
            "Ou transport carcasses",
            "Non destinés à la consommation humaine"
        ],
        "secteur": "gestion_dechets_animaux",
        "marchandises": ["dechets_animaux", "carcasses_non_alimentaires"],
        **base_info
    })
    
    # o) Véhicules plates-formes portuaires
    derogations.append({
        "id": "ART13_o_plateformes_portuaires",
        "titre": "Dérogation véhicules plates-formes portuaires (Article 13o)",
        "description": "Véhicules utilisés exclusivement sur route dans des installations de plates-formes telles que les ports, ports de transbordement intermodaux et terminaux ferroviaires",
        "conditions": [
            "Utilisation exclusive sur routes d'installations",
            "Plates-formes : ports, transbordement intermodal, terminaux ferroviaires"
        ],
        "zone_utilisation": "plateformes_specialisees",
        "installations": ["ports", "transbordement_intermodal", "terminaux_ferroviaires"],
        **base_info
    })
    
    # p) Transport animaux vivants local
    derogations.append({
        "id": "ART13_p_animaux_vivants_local",
        "titre": "Dérogation transport animaux vivants local - 100km (Article 13p)",
        "description": "Véhicules utilisés pour le transport d'animaux vivants des fermes aux marchés locaux et vice versa, ou des marchés aux abattoirs locaux dans un rayon d'au plus 100 kilomètres",
        "conditions": [
            "Transport d'animaux vivants uniquement",
            "Trajets : fermes ↔ marchés locaux",
            "Ou trajets : marchés ↔ abattoirs locaux", 
            "Rayon maximum de 100 kilomètres"
        ],
        "rayon_km": 100,
        "secteur": "transport_animaux_vivants",
        "trajets": ["fermes_marches", "marches_abattoirs"],
        **base_info
    })
    
    # q) Transport engins construction
    derogations.append({
        "id": "ART13_q_engins_construction",
        "titre": "Dérogation transport engins construction - 100km (Article 13q)",
        "description": "Véhicules ou combinaisons de véhicules transportant des engins de construction pour une entreprise de construction dans un rayon de 100 km par rapport au siège de l'entreprise, à condition que la conduite du véhicule ne constitue pas la principale activité du conducteur",
        "conditions": [
            "Transport d'engins de construction",
            "Pour une entreprise de construction",
            "Rayon de 100 km par rapport au siège",
            "La conduite ne doit pas être l'activité principale du conducteur"
        ],
        "rayon_km": 100,
        "secteur": "construction",
        "marchandises": ["engins_construction"],
        "condition_conducteur": "conduite_non_principale",
        **base_info
    })
    
    # r) Livraison béton prêt à l'emploi
    derogations.append({
        "id": "ART13_r_beton_pret_emploi",
        "titre": "Dérogation livraison béton prêt à l'emploi (Article 13r)",
        "description": "Véhicules utilisés pour la livraison de béton prêt à l'emploi",
        "conditions": [
            "Livraison de béton prêt à l'emploi exclusivement"
        ],
        "secteur": "btp_beton",
        "marchandises": ["beton_pret_emploi"],
        **base_info
    })
    
    # Ajouter les informations communes finales
    for derogation in derogations:
        derogation.update({
            "amende_min": None,
            "amende_max": None,
            "points_permis": None,
            "immobilisation": False,
            "suspension_permis": False,
            "texte_integral": f"Article 13 du règlement (UE) n° 561/2006 - Dérogations. {derogation['description']}",
            "mots_cles": ["article_13", "dérogations", "exemptions", "règlement_561_2006"] + derogation.get("tags", []),
            "professionnel_uniquement": True,
            "recidive": False,
            "note_application": "Ces dérogations permettent aux États membres d'exempter certains types de transport des règles de temps de conduite et de repos, sous conditions strictes."
        })
    
    return derogations

# Test du module
if __name__ == "__main__":
    derogations = get_article_13_derogations()
    print(f"✅ {len(derogations)} dérogations de l'Article 13 créées")
    
    for derog in derogations[:3]:  # Afficher les 3 premières
        print(f"📋 {derog['id']}: {derog['titre']}")
        print(f"   Conditions: {len(derog.get('conditions', []))} condition(s)")
        if derog.get('rayon_km'):
            print(f"   Rayon: {derog['rayon_km']} km")
        print() 