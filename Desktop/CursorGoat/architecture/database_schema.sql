-- ============================================================================
-- SCHÉMA BASE DE DONNÉES - INFRACTIONS TACHYGRAPHIQUES
-- Sogestmatic - Mission Stage
-- ============================================================================

-- Table des types d'infractions
CREATE TABLE types_infractions (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    libelle VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table principale des infractions
CREATE TABLE infractions (
    id SERIAL PRIMARY KEY,
    code_infraction VARCHAR(20) UNIQUE NOT NULL,
    libelle TEXT NOT NULL,
    type_id INTEGER REFERENCES types_infractions(id),
    categorie VARCHAR(20) CHECK (categorie IN ('majeure', 'mineure', 'administrative')),
    gravite INTEGER CHECK (gravite BETWEEN 1 AND 5),
    description_detaillee TEXT,
    elements_constitutifs JSONB,
    detectabilite_tachygraphe BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des articles de loi
CREATE TABLE articles_loi (
    id SERIAL PRIMARY KEY,
    code_article VARCHAR(50) UNIQUE NOT NULL,
    source_juridique VARCHAR(100) NOT NULL, -- Code de la route, Règlement UE, etc.
    texte_integral TEXT NOT NULL,
    resume TEXT,
    date_entree_vigueur DATE,
    date_abrogation DATE,
    statut VARCHAR(20) DEFAULT 'actif' CHECK (statut IN ('actif', 'abrogé', 'modifié')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison infractions <-> articles de loi
CREATE TABLE infractions_articles (
    infraction_id INTEGER REFERENCES infractions(id) ON DELETE CASCADE,
    article_id INTEGER REFERENCES articles_loi(id) ON DELETE CASCADE,
    type_relation VARCHAR(50) DEFAULT 'constitutif', -- constitutif, aggravant, atténuant
    PRIMARY KEY (infraction_id, article_id)
);

-- Table des sanctions
CREATE TABLE sanctions (
    id SERIAL PRIMARY KEY,
    type_sanction VARCHAR(50) NOT NULL, -- amende, suspension, retrait, prison
    montant_min DECIMAL(10,2),
    montant_max DECIMAL(10,2),
    duree_min INTEGER, -- en jours pour suspensions
    duree_max INTEGER,
    points_permis INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison infractions <-> sanctions
CREATE TABLE infractions_sanctions (
    infraction_id INTEGER REFERENCES infractions(id) ON DELETE CASCADE,
    sanction_id INTEGER REFERENCES sanctions(id) ON DELETE CASCADE,
    est_cumulative BOOLEAN DEFAULT false,
    conditions_application TEXT,
    PRIMARY KEY (infraction_id, sanction_id)
);

-- Table de jurisprudence
CREATE TABLE jurisprudence (
    id SERIAL PRIMARY KEY,
    numero_arret VARCHAR(100) UNIQUE,
    juridiction VARCHAR(200) NOT NULL,
    date_decision DATE NOT NULL,
    resume TEXT NOT NULL,
    texte_integral TEXT,
    mots_cles TEXT[],
    principe_retenu TEXT,
    url_source VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de liaison infractions <-> jurisprudence
CREATE TABLE infractions_jurisprudence (
    infraction_id INTEGER REFERENCES infractions(id) ON DELETE CASCADE,
    jurisprudence_id INTEGER REFERENCES jurisprudence(id) ON DELETE CASCADE,
    pertinence INTEGER CHECK (pertinence BETWEEN 1 AND 5),
    commentaire TEXT,
    PRIMARY KEY (infraction_id, jurisprudence_id)
);

-- Table des véhicules (types concernés)
CREATE TABLE types_vehicules (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    designation VARCHAR(100) NOT NULL,
    poids_min_tonnes DECIMAL(5,2),
    poids_max_tonnes DECIMAL(5,2),
    soumis_tachygraphe BOOLEAN DEFAULT true,
    reglementation_specifique TEXT
);

-- Table de liaison infractions <-> types de véhicules
CREATE TABLE infractions_vehicules (
    infraction_id INTEGER REFERENCES infractions(id) ON DELETE CASCADE,
    vehicule_id INTEGER REFERENCES types_vehicules(id) ON DELETE CASCADE,
    PRIMARY KEY (infraction_id, vehicule_id)
);

-- Table des procédures de contrôle
CREATE TABLE procedures_controle (
    id SERIAL PRIMARY KEY,
    infraction_id INTEGER REFERENCES infractions(id),
    etape_numero INTEGER NOT NULL,
    description_etape TEXT NOT NULL,
    documents_requis TEXT[],
    outils_detection TEXT[],
    niveau_preuve VARCHAR(50) CHECK (niveau_preuve IN ('indice', 'présomption', 'preuve')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des mises à jour réglementaires
CREATE TABLE veille_reglementaire (
    id SERIAL PRIMARY KEY,
    date_publication DATE NOT NULL,
    source VARCHAR(200) NOT NULL,
    titre TEXT NOT NULL,
    resume TEXT,
    impact_infractions INTEGER[], -- IDs des infractions impactées
    statut VARCHAR(50) DEFAULT 'en_cours' CHECK (statut IN ('en_cours', 'analysé', 'intégré')),
    url_source VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEX POUR OPTIMISATION DES PERFORMANCES
-- ============================================================================

-- Index sur les codes d'infractions
CREATE INDEX idx_infractions_code ON infractions(code_infraction);
CREATE INDEX idx_infractions_categorie ON infractions(categorie);
CREATE INDEX idx_infractions_gravite ON infractions(gravite);

-- Index sur les articles de loi
CREATE INDEX idx_articles_code ON articles_loi(code_article);
CREATE INDEX idx_articles_source ON articles_loi(source_juridique);
CREATE INDEX idx_articles_statut ON articles_loi(statut);

-- Index sur la jurisprudence
CREATE INDEX idx_jurisprudence_date ON jurisprudence(date_decision);
CREATE INDEX idx_jurisprudence_juridiction ON jurisprudence(juridiction);

-- Index composite pour recherches fréquentes
CREATE INDEX idx_infractions_type_categorie ON infractions(type_id, categorie);

-- Index GIN pour recherche textuelle
CREATE INDEX idx_infractions_texte ON infractions USING gin(to_tsvector('french', description_detaillee));
CREATE INDEX idx_articles_texte ON articles_loi USING gin(to_tsvector('french', texte_integral));

-- ============================================================================
-- VUES MÉTIER POUR FACILITER LES REQUÊTES
-- ============================================================================

-- Vue complète des infractions avec leurs sanctions
CREATE VIEW v_infractions_completes AS
SELECT 
    i.id,
    i.code_infraction,
    i.libelle,
    ti.libelle as type_infraction,
    i.categorie,
    i.gravite,
    i.description_detaillee,
    ARRAY_AGG(DISTINCT s.type_sanction) as types_sanctions,
    ARRAY_AGG(DISTINCT a.code_article) as articles_applicables
FROM infractions i
LEFT JOIN types_infractions ti ON i.type_id = ti.id
LEFT JOIN infractions_sanctions iss ON i.id = iss.infraction_id
LEFT JOIN sanctions s ON iss.sanction_id = s.id
LEFT JOIN infractions_articles ia ON i.id = ia.infraction_id
LEFT JOIN articles_loi a ON ia.article_id = a.id
GROUP BY i.id, i.code_infraction, i.libelle, ti.libelle, i.categorie, i.gravite, i.description_detaillee;

-- Vue des sanctions détaillées par infraction
CREATE VIEW v_sanctions_detaillees AS
SELECT 
    i.code_infraction,
    i.libelle as infraction,
    s.type_sanction,
    s.montant_min,
    s.montant_max,
    s.duree_min,
    s.duree_max,
    s.points_permis,
    iss.est_cumulative,
    iss.conditions_application
FROM infractions i
JOIN infractions_sanctions iss ON i.id = iss.infraction_id
JOIN sanctions s ON iss.sanction_id = s.id;

-- ============================================================================
-- FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction de recherche textuelle
CREATE OR REPLACE FUNCTION rechercher_infractions(terme_recherche TEXT)
RETURNS TABLE (
    id INTEGER,
    code_infraction VARCHAR(20),
    libelle TEXT,
    pertinence REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.code_infraction,
        i.libelle,
        ts_rank(to_tsvector('french', i.description_detaillee), plainto_tsquery('french', terme_recherche)) as pertinence
    FROM infractions i
    WHERE to_tsvector('french', i.description_detaillee) @@ plainto_tsquery('french', terme_recherche)
    ORDER BY pertinence DESC;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer la gravité totale d'une infraction
CREATE OR REPLACE FUNCTION calculer_gravite_totale(infraction_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    gravite_base INTEGER;
    points_total INTEGER;
    montant_max DECIMAL;
    gravite_calculee INTEGER;
BEGIN
    -- Récupérer la gravité de base
    SELECT gravite INTO gravite_base FROM infractions WHERE id = infraction_id;
    
    -- Calculer les points et montants
    SELECT 
        COALESCE(SUM(s.points_permis), 0),
        COALESCE(MAX(s.montant_max), 0)
    INTO points_total, montant_max
    FROM infractions_sanctions iss
    JOIN sanctions s ON iss.sanction_id = s.id
    WHERE iss.infraction_id = infraction_id;
    
    -- Calculer la gravité totale
    gravite_calculee := gravite_base + 
                       CASE 
                           WHEN points_total >= 6 THEN 2
                           WHEN points_total >= 3 THEN 1
                           ELSE 0
                       END +
                       CASE 
                           WHEN montant_max >= 3750 THEN 2
                           WHEN montant_max >= 750 THEN 1
                           ELSE 0
                       END;
    
    RETURN LEAST(gravite_calculee, 5);
END;
$$ LANGUAGE plpgsql; 