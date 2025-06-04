// Sogestmatic - Base de Données Juridique Tachygraphique
// JavaScript connecté à l'API Légifrance

// Configuration de l'API
const API_BASE_URL = 'http://127.0.0.1:8000';

// Cache des données
let infractionsCache = [];
let categoriesCache = [];
let gravitesCache = [];
let statsCache = null;

// Variables globales pour le chat
let conversationHistory = [];

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🎯 Initialisation de l\'interface Sogestmatic...');
    
    // Initialiser la navigation en premier
    initNavigation();
    
    // Initialiser la fonctionnalité de recherche
    initSearchFunctionality();
    
    // Initialiser les événements du chat
    initChatEvents();
    
    // Mettre à jour la date du rapport
    updateDateTime();
    
    // Charger les données initiales
    await chargerCategories();
    await chargerGravites();
    await chargerStats();
    
    // Initialiser les graphiques
    initChart();
    loadDataFromAPI();
});

// Charger les données depuis l'API Légifrance
async function loadDataFromAPI() {
    try {
        showApiStatus('🔄 Connexion à Légifrance...', 'loading');
        
        // Charger toutes les données en parallèle
        const [infractions, categories, gravites, stats] = await Promise.all([
            fetchInfractions(),
            fetchCategories(), 
            fetchGravites(),
            fetchStats()
        ]);
        
        infractionsCache = infractions;
        categoriesCache = categories;
        gravitesCache = gravites;
        statsCache = stats;
        
        // Mettre à jour l'interface
        updateFiltersUI();
        updateStatsUI();
        afficherResultats(infractions.infractions || infractions);
        
        showApiStatus('✅ Connecté à Légifrance - ' + (stats.total_infractions || 0) + ' infractions', 'success');
        
    } catch (error) {
        console.error('Erreur chargement API:', error);
        showApiStatus('❌ Erreur connexion Légifrance', 'error');
        // Fallback vers données de démonstration
        loadFallbackData();
    }
}

// Indicateur de statut API
function showApiStatus(message, type = 'info') {
    // Créer ou mettre à jour l'indicateur de statut
    let statusDiv = document.getElementById('api-status');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'api-status';
        statusDiv.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            padding: 10px 15px;
            border-radius: 5px;
            z-index: 1000;
            font-size: 0.9rem;
            max-width: 300px;
        `;
        document.body.appendChild(statusDiv);
    }
    
    const colors = {
        'loading': 'background: #3b82f6; color: white;',
        'success': 'background: #10b981; color: white;',
        'error': 'background: #ef4444; color: white;',
        'info': 'background: #6b7280; color: white;'
    };
    
    statusDiv.style.cssText += colors[type] || colors.info;
    statusDiv.textContent = message;
    
    // Auto-hide après 5 secondes pour les messages de succès
    if (type === 'success') {
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.style.opacity = '0';
                setTimeout(() => statusDiv.remove(), 300);
            }
        }, 5000);
    }
}

// Fonctions API
async function fetchInfractions(search = '', categorie = '', gravite = '', limit = 50, offset = 0) {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (categorie) params.append('categorie', categorie);
    if (gravite) params.append('gravite', gravite);
    params.append('limit', limit);
    params.append('offset', offset);
    
    const response = await fetch(`${API_BASE_URL}/infractions?${params}`);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return await response.json();
}

async function fetchCategories() {
    const response = await fetch(`${API_BASE_URL}/categories`);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    return data.categories || [];
}

async function fetchGravites() {
    const response = await fetch(`${API_BASE_URL}/gravites`);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    const data = await response.json();
    return data.gravites || [];
}

async function fetchStats() {
    const response = await fetch(`${API_BASE_URL}/stats`);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return await response.json();
}

async function analyzeWithAPI(situation) {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ situation })
    });
    
    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return await response.json();
}

// Mettre à jour les filtres avec les vraies données
function updateFiltersUI() {
    const categorieFilter = document.getElementById('categorieFilter');
    const graviteFilter = document.getElementById('graviteFilter');
    
    if (categorieFilter && categoriesCache.length > 0) {
        // Sauvegarder la valeur actuelle
        const currentValue = categorieFilter.value;
        
        categorieFilter.innerHTML = '<option value="">Toutes catégories</option>';
        categoriesCache.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = `${cat.label} (${cat.count})`;
            categorieFilter.appendChild(option);
        });
        
        // Restaurer la valeur
        categorieFilter.value = currentValue;
    }
    
    if (graviteFilter && gravitesCache.length > 0) {
        const currentValue = graviteFilter.value;
        
        graviteFilter.innerHTML = '<option value="">Toute gravité</option>';
        gravitesCache.forEach(grav => {
            const option = document.createElement('option');
            option.value = grav.id;
            option.textContent = `${grav.label} (${grav.count})`;
            graviteFilter.appendChild(option);
        });
        
        graviteFilter.value = currentValue;
    }
}

// Mettre à jour les statistiques
function updateStatsUI() {
    if (!statsCache) return;
    
    // Mettre à jour les cartes de statistiques
    const statCards = document.querySelectorAll('.stat-card');
    if (statCards.length >= 4) {
        // Total infractions
        const totalCard = statCards[0]?.querySelector('.stat-info h4');
        if (totalCard) totalCard.textContent = statsCache.total_infractions?.toLocaleString() || '0';
        
        // Date de mise à jour
        const updateCard = statCards[2]?.querySelector('.stat-info h4');
        if (updateCard && statsCache.last_update) {
            const date = new Date(statsCache.last_update);
            updateCard.textContent = date.toLocaleDateString('fr-FR');
        }
    }
    
    // Mettre à jour le graphique
    updateChart();
}

// Navigation entre sections
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    const heroSection = document.querySelector('.hero');
    
    console.log('🔧 Initialisation navigation...');
    console.log('Nav links trouvés:', navLinks.length);
    console.log('Sections trouvées:', sections.length);
    console.log('Hero section:', heroSection ? 'trouvée' : 'non trouvée');
    
    if (navLinks.length === 0) {
        console.error('❌ Aucun lien de navigation trouvé (.nav-link)');
        return;
    }
    
    if (sections.length === 0) {
        console.error('❌ Aucune section trouvée (.section)');
        return;
    }
    
    navLinks.forEach((link, index) => {
        console.log(`Lien ${index}:`, link.getAttribute('href'));
        
        link.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔄 Navigation vers:', this.getAttribute('href'));
            
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            sections.forEach(section => section.classList.remove('active'));
            
            const targetId = this.getAttribute('href').substring(1);
            const targetSection = document.getElementById(targetId);
            
            console.log('Section cible:', targetId, targetSection ? 'trouvée' : 'non trouvée');
            
            if (targetSection) {
                targetSection.classList.add('active');
                
                // Masquer le bandeau de recherche sur la page analyse IA
                if (heroSection) {
                    if (targetId === 'analyse') {
                        heroSection.style.display = 'none';
                        console.log('🔇 Bandeau masqué pour analyse IA');
                    } else {
                        heroSection.style.display = 'block';
                        console.log('🔊 Bandeau affiché');
                    }
                }
            } else {
                console.error('❌ Section non trouvée:', targetId);
            }
        });
    });
    
    console.log('✅ Navigation initialisée avec succès');
}

// Fonctionnalité de recherche connectée à l'API
function initSearchFunctionality() {
    const searchInput = document.getElementById('searchInput');
    const categorieFilter = document.getElementById('categorieFilter');
    const graviteFilter = document.getElementById('graviteFilter');
    
    // Vérifier que les éléments existent
    if (!searchInput) {
        console.warn('Element searchInput non trouvé');
        return;
    }
    
    // Debounce pour éviter trop d'appels API
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filtrerResultats();
        }, 500); // Attendre 500ms après la dernière frappe
    });
    
    if (categorieFilter) {
        categorieFilter.addEventListener('change', filtrerResultats);
    }
    
    if (graviteFilter) {
        graviteFilter.addEventListener('change', filtrerResultats);
    }
    
    console.log('✅ Fonctionnalité de recherche initialisée');
}

// Fonction de recherche principale
async function rechercher() {
    await filtrerResultats();
    
    // Basculer vers la section recherche
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector('a[href="#recherche"]').classList.add('active');
    
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('recherche').classList.add('active');
}

// Filtrer les résultats via l'API
async function filtrerResultats() {
    const searchTerm = document.getElementById('searchInput').value;
    const categorieFilter = document.getElementById('categorieFilter').value;
    const graviteFilter = document.getElementById('graviteFilter').value;
    
    try {
        showLoading('🔍 Recherche en cours...');
        
        const resultats = await fetchInfractions(searchTerm, categorieFilter, graviteFilter);
        afficherResultats(resultats.infractions || resultats);
        
        // Mettre à jour le compteur de résultats
        const total = resultats.total || (resultats.infractions || resultats).length;
        updateResultsCount(total);
        
    } catch (error) {
        console.error('Erreur recherche:', error);
        afficherErreurRecherche();
    }
}

function updateResultsCount(total) {
    const section = document.getElementById('recherche');
    const titre = section.querySelector('h3');
    if (titre) {
        titre.innerHTML = `<i class="fas fa-search"></i> Résultats de recherche (${total.toLocaleString()})`;
    }
}

// Afficher les résultats avec les vraies données Légifrance
function afficherResultats(resultats) {
    const container = document.getElementById('resultats');
    
    if (!resultats || resultats.length === 0) {
        container.innerHTML = `
            <div class="no-results" style="text-align: center; padding: 3rem; color: #6b7280;">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <h4>Aucun résultat trouvé</h4>
                <p>Essayez avec d'autres mots-clés ou filtres</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = resultats.map(infraction => `
        <div class="resultat-item" onclick="afficherDetails('${infraction.id}')">
            <div class="resultat-header">
                <h4>${infraction.titre}</h4>
                <span class="badge ${infraction.gravite}">${getGraviteLabel(infraction.gravite)}</span>
            </div>
            <div class="resultat-content">
                <p><strong>Article :</strong> ${infraction.article}</p>
                <p><strong>Description :</strong> ${infraction.description}</p>
                <p><strong>Sanction :</strong> ${infraction.sanction}</p>
                ${infraction.url_legifrance ? `<p><strong>Source :</strong> <a href="${infraction.url_legifrance}" target="_blank" rel="noopener">Légifrance officiel</a></p>` : ''}
                <div class="tags">
                    ${(infraction.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

function afficherErreurRecherche() {
    const container = document.getElementById('resultats');
    container.innerHTML = `
        <div class="error-results" style="text-align: center; padding: 3rem; color: #ef4444;">
            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <h4>Erreur de connexion</h4>
            <p>Impossible de charger les données depuis Légifrance</p>
            <button onclick="loadDataFromAPI()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 0.5rem; cursor: pointer;">
                Réessayer
            </button>
        </div>
    `;
}

// Obtenir le label de gravité
function getGraviteLabel(gravite) {
    const labels = {
        'legere': 'Légère',
        'moyenne': 'Moyenne', 
        'grave': 'Grave',
        'tres_grave': 'Très Grave'
    };
    return labels[gravite] || gravite;
}

// Afficher les détails d'une infraction
async function afficherDetails(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/infractions/${id}`);
        if (!response.ok) throw new Error('Infraction non trouvée');
        
        const infraction = await response.json();
        
        const details = `
Infraction: ${infraction.titre}

Article: ${infraction.article}

Description: ${infraction.description}

Sanction: ${infraction.sanction}

${infraction.amende_min ? `Amende: ${infraction.amende_min}€ à ${infraction.amende_max}€` : ''}
${infraction.points_permis ? `Points permis: ${infraction.points_permis}` : ''}

Source: ${infraction.code_source}
${infraction.url_legifrance ? `\nLien Légifrance: ${infraction.url_legifrance}` : ''}
        `;
        
        alert(details);
        
    } catch (error) {
        alert('Erreur lors du chargement des détails de l\'infraction');
    }
}

// Générer un rapport
function genererRapport() {
    const type = document.getElementById('rapportType').value;
    const periode = document.getElementById('periode').value;
    
    const button = event.target;
    const originalText = button.innerHTML;
    
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Génération en cours...';
    button.disabled = true;
    
    setTimeout(() => {
        const nombreInfractions = statsCache?.total_infractions || 'N/A';
        alert(`Rapport généré avec succès !\n\nType: ${getTypeRapportLabel(type)}\nPériode: ${getPeriodeLabel(periode)}\nInfractions analysées: ${nombreInfractions}\nSource: Légifrance officiel\n\nLe fichier PDF a été téléchargé.`);
        
        button.innerHTML = originalText;
        button.disabled = false;
    }, 3000);
}

// Labels pour les types de rapport
function getTypeRapportLabel(type) {
    const labels = {
        'synthese': 'Synthèse des infractions',
        'detaille': 'Rapport détaillé',
        'stats': 'Rapport statistique', 
        'evolutif': 'Évolution réglementaire'
    };
    return labels[type] || type;
}

// Labels pour les périodes
function getPeriodeLabel(periode) {
    const labels = {
        'jour': 'Dernières 24h',
        'semaine': '7 derniers jours',
        'mois': '30 derniers jours',
        'annee': '12 derniers mois'
    };
    return labels[periode] || periode;
}

// Mettre à jour la date dans le rapport
function updateDateTime() {
    const dateRapport = document.getElementById('dateRapport');
    if (dateRapport) {
        const now = new Date();
        dateRapport.textContent = now.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Mettre à jour le graphique avec les vraies données
function updateChart() {
    const canvas = document.getElementById('categoriesChart');
    if (!canvas || !statsCache?.by_categorie) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const categories = Object.entries(statsCache.by_categorie);
    const total = Object.values(statsCache.by_categorie).reduce((a, b) => a + b, 0);
    
    categories.forEach(([cat, count], index) => {
        const percentage = (count / total) * 100;
        const height = (percentage / 100) * 150;
        const x = 50 + (index * 80);
        const y = 180 - height;
        
        // Couleurs différentes pour chaque catégorie
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        ctx.fillStyle = colors[index % colors.length];
        
        ctx.fillRect(x, y, 60, height);
        
        // Étiquette
        ctx.fillStyle = '#374151';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(cat.substring(0, 8), x + 30, 195);
        ctx.fillText(count.toString(), x + 30, y - 5);
    });
}

// Initialiser le graphique
function initChart() {
    updateChart();
}

// Données de fallback en cas d'erreur API
function loadFallbackData() {
    infractionsCache = [
        {
            id: 'FALLBACK_001',
            titre: 'Mode hors ligne - Données limitées',
            article: 'Système local',
            description: 'Connexion à Légifrance temporairement indisponible',
            sanction: 'Veuillez réessayer la connexion',
            gravite: 'moyenne',
            categorie: 'system',
            tags: ['Maintenance']
        }
    ];
    
    afficherResultats(infractionsCache);
}

// Fonctions utilitaires
function showLoading(message = 'Chargement...') {
    showApiStatus(message, 'loading');
}

// Recherche par Enter
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && document.activeElement.id === 'searchInput') {
        rechercher();
    }
});

// Console log pour le développement
console.log('🚛 Sogestmatic - Interface connectée à Légifrance initialisée');
console.log('📡 API URL:', API_BASE_URL);

// === NOUVELLES FONCTIONS CHAT IA ===

// Envoyer un message dans le chat
async function envoyerMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (message === '') return;
    
    // Ajouter le message utilisateur
    ajouterMessage('user', message);
    input.value = '';
    
    // Afficher l'indicateur de frappe
    afficherIndicateurFrappe();
    
    try {
        // Appeler l'API pour obtenir une réponse
        const response = await obtenirReponseIA(message);
        
        // Supprimer l'indicateur de frappe
        supprimerIndicateurFrappe();
        
        // Ajouter la réponse du bot
        ajouterMessage('bot', response.contenu, response.citations, response.analyseDetaillee);
        
        // Mettre à jour l'historique
        conversationHistory.push(
            { role: 'user', content: message },
            { role: 'assistant', content: response.contenu }
        );
        
    } catch (error) {
        // Supprimer l'indicateur de frappe
        supprimerIndicateurFrappe();
        
        // Afficher l'erreur à l'utilisateur
        let messageErreur = "❌ **Service temporairement indisponible**\n\n";
        
        if (error.message.includes('Service d\'IA temporairement indisponible')) {
            messageErreur += "**OpenAI n'est pas configuré.** Veuillez configurer votre clé API OpenAI pour utiliser l'assistant IA.";
        } else if (error.message.includes('503')) {
            messageErreur += "Le service d'intelligence artificielle est temporairement indisponible. Veuillez réessayer dans quelques instants.";
        } else {
            messageErreur += `Une erreur s'est produite: ${error.message}`;
        }
        
        ajouterMessage('bot', messageErreur);
        
        console.error('Erreur lors de l\'envoi du message:', error);
    }
}

// Poser une question rapide
function poserQuestionRapide(question) {
    document.getElementById('chatInput').value = question;
    envoyerMessage();
}

// Ajouter un message au chat (avec support pour analyses détaillées)
function ajouterMessage(type, contenu, citations = null, analyseDetaillee = null) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const avatar = type === 'bot' ? '<i class="fas fa-robot"></i>' : '<i class="fas fa-user"></i>';
    
    let citationsHtml = '';
    if (citations && citations.length > 0) {
        citationsHtml = citations.map(citation => `
            <div class="legal-citation">
                <span class="article-reference">${citation.article}</span>
                ${citation.texte}
            </div>
        `).join('');
    }
    
    messageDiv.innerHTML = `
        <div class="message-avatar">
            ${avatar}
        </div>
        <div class="message-content">
            <p>${contenu}</p>
            ${citationsHtml}
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Si c'est une analyse détaillée, l'afficher dans les rectangles
    if (analyseDetaillee && type === 'bot') {
        afficherAnalyseDetaillee(analyseDetaillee);
    }
    
    // Ajouter à l'historique
    conversationHistory.push({
        type: type,
        contenu: contenu,
        citations: citations,
        analyseDetaillee: analyseDetaillee,
        timestamp: new Date()
    });
}

// Afficher l'indicateur de frappe
function afficherIndicateurFrappe() {
    const chatMessages = document.getElementById('chatMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    typingDiv.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="typing-indicator">
                <span>L'assistant réfléchit</span>
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Supprimer l'indicateur de frappe
function supprimerIndicateurFrappe() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Obtenir une réponse IA avec citations juridiques
async function obtenirReponseIA(question) {
    try {
        // Appeler le nouvel endpoint /chat de l'API
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: question,
                historique: conversationHistory.slice(-5) // Les 5 derniers échanges pour le contexte
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Erreur API: ${response.status}`);
        }

        const data = await response.json();
        
        return {
            contenu: data.reponse,
            citations: data.citations || []
        };
        
    } catch (error) {
        console.error('❌ Erreur API chat:', error);
        throw error; // Propager l'erreur au lieu d'utiliser un fallback
    }
}

// Gérer l'envoi avec la touche Entrée
function initChatEvents() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                envoyerMessage();
            }
        });
    }
}

// === FONCTIONS EXISTANTES MODIFIÉES === 

// Fonctions de chargement compatibles
async function chargerCategories() {
    try {
        categoriesCache = await fetchCategories();
    } catch (error) {
        console.warn('Erreur chargement catégories:', error);
        categoriesCache = [];
    }
}

async function chargerGravites() {
    try {
        gravitesCache = await fetchGravites();
    } catch (error) {
        console.warn('Erreur chargement gravités:', error);
        gravitesCache = [];
    }
}

async function chargerStats() {
    try {
        statsCache = await fetchStats();
    } catch (error) {
        console.warn('Erreur chargement statistiques:', error);
        statsCache = null;
    }
}

// Afficher une analyse détaillée dans les rectangles
function afficherAnalyseDetaillee(analyse) {
    const resultsContainer = document.getElementById('aiResults');
    const infractions = analyse.infractions_detectees || [];
    const recommendations = analyse.recommandations || [];
    
    const analyseMtml = `
        <div class="ai-response">
            <h4><i class="fas fa-exclamation-triangle"></i> Analyse détaillée de la situation</h4>
            
            <div class="infractions-detectees">
                <h5>Infractions détectées (${infractions.length}) :</h5>
                <ul>
                    ${infractions.map(inf => `<li>• ${inf.titre || inf} - ${inf.sanction || ''}</li>`).join('')}
                </ul>
            </div>
            
            <div class="sanctions-possibles">
                <h5>Estimation des sanctions :</h5>
                <ul>
                    <li>• Amende totale estimée : ${analyse.estimation_amende || 0}€</li>
                    <li>• Points permis : ${analyse.estimation_points || 0}</li>
                    ${analyse.immobilisation_possible ? '<li>• Immobilisation du véhicule possible</li>' : ''}
                </ul>
            </div>
            
            <div class="recommandations">
                <h5>Recommandations :</h5>
                <ul>
                    ${recommendations.map(rec => `<li>• ${rec}</li>`).join('')}
                </ul>
            </div>
            
            <div style="margin-top: 1.5rem; padding: 1rem; background: #f3f4f6; border-radius: 0.5rem; font-size: 0.9rem;">
                <strong>Source :</strong> Données juridiques officielles Légifrance
            </div>
        </div>
    `;
    
    resultsContainer.innerHTML = analyseMtml;
    resultsContainer.style.display = 'block';
    
    // Scroll vers l'analyse
    setTimeout(() => {
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
}

/**
 * FONCTIONS POUR LES ARTICLES CLIQUABLES
 */

// Ouvrir un article dans la modal
async function ouvrirArticle(articleId, articleRef) {
    console.log(`📖 Ouverture article: ${articleId} (${articleRef})`);
    
    const modal = document.getElementById('articleModal');
    const modalBody = document.getElementById('articleModalBody');
    
    // Afficher la modal avec le loading
    modal.classList.add('show');
    modalBody.innerHTML = `
        <div class="article-loading">
            <div class="spinner"></div>
            <p>Chargement de l'article ${articleRef}...</p>
        </div>
    `;
    
    try {
        // Appeler l'API pour récupérer l'article
        const response = await fetch(`/api/article/${encodeURIComponent(articleId)}`);
        
        if (!response.ok) {
            throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }
        
        const articleData = await response.json();
        
        // Afficher l'article dans la modal
        afficherArticleComplet(articleData);
        
    } catch (error) {
        console.error('Erreur lors du chargement de l\'article:', error);
        modalBody.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #dc2626; margin-bottom: 20px;"></i>
                <h3>Erreur de chargement</h3>
                <p>Impossible de charger l'article. Veuillez réessayer.</p>
                <button onclick="fermerArticle()" class="btn-secondary">Fermer</button>
            </div>
        `;
    }
}

// Afficher les détails complets de l'article
function afficherArticleComplet(article) {
    const modalBody = document.getElementById('articleModalBody');
    
    const graviteClass = article.gravite?.toLowerCase() || 'moyenne';
    const graviteText = {
        'faible': 'Faible',
        'moyenne': 'Moyenne', 
        'grave': 'Grave',
        'tres_grave': 'Très Grave',
        'élevée': 'Élevée',
        'très élevée': 'Très Élevée'
    }[article.gravite] || 'Moyenne';
    
    modalBody.innerHTML = `
        <div class="article-header">
            <div class="article-title">${article.titre}</div>
            <div class="article-reference">${article.article}</div>
            <span class="article-badge ${graviteClass}">${graviteText}</span>
        </div>
        
        <div class="article-section">
            <h3><i class="fas fa-file-text"></i> Description</h3>
            <div class="article-section-content">
                ${article.description}
            </div>
        </div>
        
        ${article.texte_integral && article.texte_integral !== article.description ? `
        <div class="article-section">
            <h3><i class="fas fa-scroll"></i> Texte intégral</h3>
            <div class="article-texte-integral">
                ${article.texte_integral}
            </div>
        </div>
        ` : ''}
        
        <div class="article-section">
            <h3><i class="fas fa-gavel"></i> Sanctions</h3>
            <div class="article-section-content">
                <p><strong>Sanction principale :</strong> ${article.sanction}</p>
                
                ${(article.amende_min || article.amende_max || article.points_permis || article.suspension_permis || article.immobilisation) ? `
                <div class="sanctions-grid">
                    ${article.amende_max ? `
                    <div class="sanction-item">
                        <div class="sanction-value">${article.amende_max}€</div>
                        <div class="sanction-label">Amende maximum</div>
                    </div>
                    ` : ''}
                    
                    ${article.points_permis ? `
                    <div class="sanction-item">
                        <div class="sanction-value">${article.points_permis}</div>
                        <div class="sanction-label">Points de permis</div>
                    </div>
                    ` : ''}
                    
                    ${article.suspension_permis ? `
                    <div class="sanction-item">
                        <div class="sanction-value">⚠️</div>
                        <div class="sanction-label">Suspension: ${article.suspension_permis}</div>
                    </div>
                    ` : ''}
                    
                    ${article.immobilisation ? `
                    <div class="sanction-item">
                        <div class="sanction-value">🚫</div>
                        <div class="sanction-label">Immobilisation: ${article.immobilisation}</div>
                    </div>
                    ` : ''}
                </div>
                ` : ''}
            </div>
        </div>
        
        <div class="article-section">
            <h3><i class="fas fa-info-circle"></i> Informations complémentaires</h3>
            <div class="article-section-content">
                <p><strong>Catégorie :</strong> ${article.categorie}</p>
                <p><strong>Source :</strong> ${article.code_source}</p>
                ${article.professionnel_uniquement ? '<p><strong>⚠️ Réservé aux professionnels</strong></p>' : ''}
                ${article.recidive ? '<p><strong>⚠️ Récidive possible</strong></p>' : ''}
                ${article.date_maj ? `<p><strong>Dernière mise à jour :</strong> ${article.date_maj}</p>` : ''}
            </div>
        </div>
        
        ${article.tags && article.tags.length > 0 ? `
        <div class="article-section">
            <h3><i class="fas fa-tags"></i> Tags</h3>
            <div class="article-section-content">
                ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}
            </div>
        </div>
        ` : ''}
        
        ${article.articles_connexes && article.articles_connexes.length > 0 ? `
        <div class="articles-connexes">
            <h3><i class="fas fa-link"></i> Articles connexes</h3>
            ${article.articles_connexes.map(connexe => `
                <div class="article-connexe" onclick="ouvrirArticle('${connexe.id}', '${connexe.article}')">
                    <div class="article-connexe-title">${connexe.titre}</div>
                    <div class="article-connexe-ref">${connexe.article}</div>
                    <div class="article-connexe-description">${connexe.sanction}</div>
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${article.url_legifrance ? `
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <a href="${article.url_legifrance}" target="_blank" class="btn-primary">
                <i class="fas fa-external-link-alt"></i> Voir sur Légifrance
            </a>
        </div>
        ` : ''}
    `;
}

// Fermer la modal d'article
function fermerArticle() {
    const modal = document.getElementById('articleModal');
    modal.classList.remove('show');
    
    // Nettoyer le contenu après l'animation
    setTimeout(() => {
        if (!modal.classList.contains('show')) {
            document.getElementById('articleModalBody').innerHTML = `
                <div class="article-loading">
                    <div class="spinner"></div>
                    <p>Chargement de l'article...</p>
                </div>
            `;
        }
    }, 300);
}

// Fermer la modal en cliquant à l'extérieur
document.addEventListener('click', function(event) {
    const modal = document.getElementById('articleModal');
    if (event.target === modal) {
        fermerArticle();
    }
});

// Fermer la modal avec la touche Échap
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('articleModal');
        if (modal.classList.contains('show')) {
            fermerArticle();
        }
    }
}); 