-- ============================================================================
-- DONNÉES D'EXEMPLE - INFRACTIONS TACHYGRAPHIQUES
-- Basées sur la réglementation française et européenne en vigueur
-- ============================================================================

-- Insertion des types d'infractions
INSERT INTO types_infractions (code, libelle, description) VALUES
('TEMPS', 'Temps de conduite et repos', 'Infractions relatives aux temps de conduite et périodes de repos obligatoires'),
('EQUIP', 'Équipement tachygraphe', 'Infractions relatives au matériel et équipements tachygraphiques'),
('USAGE', 'Usage et manipulation', 'Infractions relatives à l''utilisation et manipulation du tachygraphe'),
('ADMIN', 'Administrative', 'Infractions de nature administrative et documentaire'),
('FRAUD', 'Fraude et falsification', 'Infractions de fraude et falsification des données tachygraphiques');

-- Insertion des articles de loi de référence
INSERT INTO articles_loi (code_article, source_juridique, texte_integral, resume, date_entree_vigueur, statut) VALUES
('R3312-1', 'Code des transports', 'La durée de conduite journalière ne peut excéder neuf heures. Elle peut être portée à dix heures au plus deux fois par semaine.', 'Limitation durée conduite journalière à 9h (extensible 10h)', '2014-06-11', 'actif'),
('R3312-2', 'Code des transports', 'La durée de conduite hebdomadaire ne peut excéder cinquante-six heures.', 'Limitation durée conduite hebdomadaire à 56h', '2014-06-11', 'actif'),
('R3312-3', 'Code des transports', 'La durée de conduite bihebdomadaire ne peut excéder quatre-vingt-dix heures.', 'Limitation durée conduite bihebdomadaire à 90h', '2014-06-11', 'actif'),
('R3312-9', 'Code des transports', 'Le conducteur doit prendre une pause d''au moins quarante-cinq minutes après une période de conduite de quatre heures et demie.', 'Pause obligatoire 45min après 4h30 de conduite', '2014-06-11', 'actif'),
('R3312-58', 'Code des transports', 'Le tachygraphe doit être utilisé conformément aux dispositions du règlement (UE) n° 165/2014.', 'Obligation utilisation conforme du tachygraphe', '2015-05-02', 'actif'),
('Art. 8 Règl. 165/2014', 'Règlement UE 165/2014', 'Les conducteurs utilisent le tachygraphe conformément aux instructions du constructeur et aux dispositions du présent règlement.', 'Obligation utilisation conforme tachygraphe UE', '2015-05-02', 'actif'),
('L3312-2', 'Code des transports', 'Est puni de l''amende prévue pour les contraventions de la quatrième classe le fait de méconnaître les prescriptions relatives aux temps de conduite.', 'Amende 4e classe pour infractions temps conduite', '2014-06-11', 'actif');

-- Insertion des sanctions types
INSERT INTO sanctions (type_sanction, montant_min, montant_max, duree_min, duree_max, points_permis, description) VALUES
('amende', 90.00, 750.00, NULL, NULL, 3, 'Amende forfaitaire contraventions 4e classe'),
('amende', 135.00, 750.00, NULL, NULL, 6, 'Amende majorée contraventions 4e classe'),
('amende', 1500.00, 3750.00, NULL, NULL, 6, 'Amende contraventions 5e classe'),
('suspension', NULL, NULL, 1, 90, 0, 'Suspension du permis de conduire'),
('immobilisation', NULL, NULL, 1, 7, 0, 'Immobilisation du véhicule'),
('retrait', NULL, NULL, 30, 180, 0, 'Retrait temporaire carte conducteur'),
('emprisonnement', NULL, NULL, 1, 730, 0, 'Peine d''emprisonnement pour fraude'),
('amende_penale', 3750.00, 30000.00, NULL, NULL, 0, 'Amende pénale pour fraude caractérisée');

-- Insertion des types de véhicules
INSERT INTO types_vehicules (code, designation, poids_min_tonnes, poids_max_tonnes, soumis_tachygraphe, reglementation_specifique) VALUES
('PL_LEGER', 'Poids lourd léger', 3.50, 7.50, true, 'Soumis à la réglementation temps de conduite'),
('PL_LOURD', 'Poids lourd > 7,5t', 7.50, 40.00, true, 'Réglementation complète temps de conduite et repos'),
('TRANS_VOYA', 'Transport de voyageurs', 0.00, 40.00, true, 'Réglementation spécifique transport voyageurs'),
('ENSEMBLE', 'Ensemble articulé', 7.50, 44.00, true, 'Réglementation train routier'),
('URGENT', 'Véhicule prioritaire', 3.50, 40.00, false, 'Dérogations possibles selon urgence');

-- ============================================================================
-- INFRACTIONS PRINCIPALES
-- ============================================================================

-- INFRACTIONS TEMPS DE CONDUITE
INSERT INTO infractions (code_infraction, libelle, type_id, categorie, gravite, description_detaillee, elements_constitutifs, detectabilite_tachygraphe) VALUES

-- Dépassement temps conduite journalier
('TC-001', 'Dépassement durée conduite journalière', 1, 'majeure', 4, 
'Conduite effective dépassant 9 heures par jour (ou 10 heures dans la limite de 2 fois par semaine)', 
'{"duree_depassement": "variable", "tolerance": "15 minutes", "circonstances_aggravantes": ["récidive", "dépassement > 2h", "absence pause"]}', 
true),

-- Dépassement temps conduite hebdomadaire
('TC-002', 'Dépassement durée conduite hebdomadaire', 1, 'majeure', 5, 
'Conduite effective dépassant 56 heures sur une période de 7 jours consécutifs', 
'{"duree_depassement": "variable", "tolerance": "30 minutes", "periode_reference": "7 jours glissants"}', 
true),

-- Non-respect temps de repos journalier
('TR-001', 'Non-respect repos journalier minimum', 1, 'majeure', 4, 
'Repos journalier inférieur à 11 heures (ou 9 heures dans certaines conditions)', 
'{"duree_minimum": "11h ou 9h", "tolerance": "15 minutes", "conditions_reduction": "3 fois par semaine maximum"}', 
true),

-- Non-respect des pauses
('TP-001', 'Absence de pause réglementaire', 1, 'mineure', 2, 
'Conduite continue dépassant 4h30 sans pause de 45 minutes minimum', 
'{"duree_conduite_continue": "> 4h30", "pause_minimum": "45 minutes", "fractionnement_possible": "15+30 min"}', 
true),

-- INFRACTIONS ÉQUIPEMENT
('EQ-001', 'Tachygraphe défaillant ou absent', 2, 'majeure', 5, 
'Véhicule non équipé de tachygraphe ou équipé d''un appareil défaillant', 
'{"types_defaillance": ["absence", "non-fonctionnement", "descellement", "calibrage invalide"]}', 
true),

('EQ-002', 'Carte conducteur défaillante', 2, 'mineure', 2, 
'Utilisation d''une carte conducteur endommagée, expirée ou illisible', 
'{"types_defaillance": ["expiration", "dommage physique", "dysfonctionnement lecture"]}', 
true),

-- INFRACTIONS USAGE
('US-001', 'Non-insertion carte conducteur', 3, 'mineure', 3, 
'Conduite sans insertion de la carte conducteur dans le tachygraphe', 
'{"duree_infraction": "variable", "exceptions": ["carte défaillante", "urgence médicale"]}', 
true),

('US-002', 'Saisies manuelles incorrectes', 3, 'mineure', 2, 
'Saisies manuelles manquantes, erronées ou non conformes à la réalité', 
'{"types_erreur": ["omission", "inexactitude", "falsification", "retard saisie"]}', 
true),

('US-003', 'Non-respect procédures changement conducteur', 3, 'mineure', 2, 
'Procédure incorrecte lors du changement de conducteur (double équipage)', 
'{"procedures_obligatoires": ["insertion_carte", "saisie_activites", "verification_donnees"]}', 
true),

-- INFRACTIONS ADMINISTRATIVES
('AD-001', 'Documents tachygraphiques manquants', 4, 'administrative', 1, 
'Absence de présentation des documents tachygraphiques lors d''un contrôle', 
'{"documents_requis": ["disques", "impressions", "carte_conducteur", "attestations"]}', 
false),

('AD-002', 'Défaut contrôle périodique tachygraphe', 4, 'administrative', 2, 
'Tachygraphe non contrôlé dans les délais réglementaires (2 ans)', 
'{"frequence_controle": "24 mois", "tolerance": "1 mois", "exceptions": ["force_majeure"]}', 
true),

-- INFRACTIONS FRAUDE
('FR-001', 'Manipulation frauduleuse tachygraphe', 5, 'majeure', 5, 
'Modification, altération ou neutralisation du fonctionnement du tachygraphe', 
'{"types_fraude": ["aimant", "dispositif_electronique", "modification_cablage", "logiciel_pirate"]}', 
true),

('FR-002', 'Falsification données tachygraphiques', 5, 'majeure', 5, 
'Altération ou falsification des données enregistrées par le tachygraphe', 
'{"methodes": ["modification_fichiers", "carte_clonee", "simulation_activite"]}', 
true),

('FR-003', 'Usage de dispositif de fraude', 5, 'majeure', 5, 
'Utilisation de tout dispositif destiné à fausser le fonctionnement du tachygraphe', 
'{"dispositifs": ["emulateur", "simulateur", "aimant", "boitier_electronique"]}', 
true);

-- ============================================================================
-- LIAISONS INFRACTIONS <-> ARTICLES DE LOI
-- ============================================================================

INSERT INTO infractions_articles (infraction_id, article_id, type_relation) VALUES
-- Temps de conduite
(1, 1, 'constitutif'), -- TC-001 <-> R3312-1
(1, 7, 'sanctionnant'), -- TC-001 <-> L3312-2
(2, 2, 'constitutif'), -- TC-002 <-> R3312-2
(3, 4, 'constitutif'), -- TR-001 <-> R3312-9
-- Équipement
(5, 5, 'constitutif'), -- EQ-001 <-> R3312-58
(5, 6, 'constitutif'), -- EQ-001 <-> Art. 8 Règl. 165/2014
-- Usage
(7, 6, 'constitutif'), -- US-001 <-> Art. 8 Règl. 165/2014
(8, 6, 'constitutif'); -- US-002 <-> Art. 8 Règl. 165/2014

-- ============================================================================
-- LIAISONS INFRACTIONS <-> SANCTIONS
-- ============================================================================

INSERT INTO infractions_sanctions (infraction_id, sanction_id, est_cumulative, conditions_application) VALUES
-- Temps de conduite - sanctions graduées
(1, 1, false, 'Dépassement < 30 minutes'),
(1, 2, false, 'Dépassement 30min - 2h'),
(1, 3, false, 'Dépassement > 2h'),
(1, 4, true, 'Récidive ou dépassement > 4h'),

-- Dépassement hebdomadaire
(2, 3, false, 'Toujours contravention 5e classe'),
(2, 4, true, 'Dépassement significatif'),
(2, 5, true, 'Mise en danger'),

-- Non-respect repos
(3, 1, false, 'Réduction < 1h'),
(3, 2, false, 'Réduction 1h-3h'),
(3, 4, true, 'Réduction > 3h'),

-- Infractions équipement
(5, 3, false, 'Défaillance technique'),
(5, 5, true, 'Véhicule immobilisé'),
(5, 6, true, 'Retrait carte si fraude suspectée'),

-- Infractions fraude
(11, 7, false, 'Fraude caractérisée'),
(11, 8, false, 'Fraude grave'),
(12, 7, false, 'Falsification'),
(12, 8, false, 'Falsification aggravée'),
(13, 8, false, 'Usage dispositif de fraude');

-- ============================================================================
-- PROCÉDURES DE CONTRÔLE
-- ============================================================================

INSERT INTO procedures_controle (infraction_id, etape_numero, description_etape, documents_requis, outils_detection, niveau_preuve) VALUES
-- Procédure contrôle temps de conduite
(1, 1, 'Vérification insertion carte conducteur', '{"carte_conducteur"}', '{"tachygraphe", "terminal_controle"}', 'indice'),
(1, 2, 'Téléchargement données période contrôlée', '{"donnees_vehicule", "donnees_conducteur"}', '{"cable_telechargement", "logiciel_analyse"}', 'présomption'),
(1, 3, 'Analyse automatique dépassements', '{"rapport_analyse"}', '{"logiciel_specialise"}', 'preuve'),
(1, 4, 'Vérification cohérence avec documents papier', '{"feuilles_route", "bons_livraison"}', '{"analyse_manuelle"}', 'preuve'),

-- Procédure contrôle fraude
(11, 1, 'Inspection visuelle tachygraphe', '{}', '{"lampe_torche", "miroir_inspection"}', 'indice'),
(11, 2, 'Test fonctionnement normal', '{}', '{"banc_essai", "generateur_signaux"}', 'présomption'),
(11, 3, 'Analyse données anormales', '{"logs_systeme"}', '{"logiciel_forensique"}', 'preuve'),
(11, 4, 'Expertise technique approfondie', '{"rapport_expert"}', '{"laboratoire_agréé"}', 'preuve');

-- ============================================================================
-- JURISPRUDENCE EXEMPLE
-- ============================================================================

INSERT INTO jurisprudence (numero_arret, juridiction, date_decision, resume, mots_cles, principe_retenu) VALUES
('Cass. Crim. 12-85.123', 'Cour de cassation - Chambre criminelle', '2023-03-15', 
'Qualification de l''infraction de manipulation du tachygraphe - Éléments constitutifs', 
'{"tachygraphe", "manipulation", "fraude", "preuve"}', 
'La simple possession d''un dispositif de fraude sans preuve d''utilisation ne constitue pas l''infraction'),

('CAA Lyon 21LY02456', 'Cour administrative d''appel de Lyon', '2023-06-22',
'Gradation des sanctions selon la gravité du dépassement temps de conduite',
'{"temps_conduite", "sanction", "proportionnalité"}',
'La sanction doit être proportionnée à la gravité et à la durée du dépassement');

INSERT INTO infractions_jurisprudence (infraction_id, jurisprudence_id, pertinence, commentaire) VALUES
(11, 1, 5, 'Jurisprudence de référence pour les infractions de manipulation'),
(1, 2, 4, 'Principe de proportionnalité des sanctions');

-- ============================================================================
-- VEILLE RÉGLEMENTAIRE EXEMPLE
-- ============================================================================

INSERT INTO veille_reglementaire (date_publication, source, titre, resume, impact_infractions, statut, url_source) VALUES
('2023-09-15', 'Journal Officiel UE', 'Règlement délégué 2023/1873 modifiant le règlement 165/2014',
'Nouvelles spécifications techniques pour les tachygraphes intelligents de 2e génération',
'{5,6,7}', 'analysé', 'https://eur-lex.europa.eu/legal-content/FR/TXT/?uri=CELEX:32023R1873'),

('2023-10-01', 'Ministère des Transports', 'Circulaire relative aux contrôles routiers - Actualisation procédures',
'Mise à jour des procédures de contrôle et nouvelles modalités de sanctions',
'{1,2,3,11,12,13}', 'intégré', 'https://www.legifrance.gouv.fr/circulaire/id/45234'); 