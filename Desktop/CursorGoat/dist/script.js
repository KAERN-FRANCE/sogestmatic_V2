/**
 * ===== SOGESTMATIC PRODUCTION v2.1 =====
 * JavaScript application complète - Assistant juridique IA transport routier
 * Connexion API Python + Fonctionnalités complètes
 */

// ===== CONFIGURATION =====
const CONFIG = {
    VERSION: '2.1.0-production',
    API_BASE_URL: detectAPIUrl(),
    PAGINATION_SIZE: 20,
    DEBOUNCE_DELAY: 300,
    ANIMATION_DURATION: 300,
    MAX_RETRIES: 3,
    SEARCH_MIN_LENGTH: 2
};

// Détection automatique de l'URL API
function detectAPIUrl() {
    const hostname = window.location.hostname;
    
    // Variable d'environnement pour forcer une URL API spécifique
    if (window.SOGESTMATIC_API_URL) {
        console.log('🔧 API URL forcée:', window.SOGESTMATIC_API_URL);
        return window.SOGESTMATIC_API_URL;
    }
    
    console.log('🌐 Hostname détecté:', hostname);
    
    // Environnement local
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        console.log('🏠 Mode local détecté');
        return 'http://localhost:8000';
    }
    
    // Environnement Netlify avec functions
    if (hostname.includes('netlify.app')) {
        const apiUrl = '/.netlify/functions/api';
        console.log('🚀 Mode Netlify détecté, API URL:', apiUrl);
        return apiUrl;
    }
    
    // Production avec API backend
    console.log('🏭 Mode production détecté');
    return '/api';
}

// ===== ÉTAT GLOBAL =====
const AppState = {
    // Données
    infractions: [],
    categories: [],
    gravites: [],
    stats: {},
    
    // Interface
    currentTab: 'recherche',
    currentPage: 1,
    searchQuery: '',
    filters: {
        categorie: '',
        gravite: '',
        source: ''
    },
    
    // API
    isLoading: false,
    apiConnected: false,
    lastUpdateTime: null
};

// ===== API CLIENT =====
class SogestmaticAPI {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.retryCount = 0;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        try {
            console.log(`🌐 API Request: ${endpoint}`);
            const response = await fetch(url, defaultOptions);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            this.retryCount = 0; // Reset sur succès
            return data;
        } catch (error) {
            console.error(`❌ API Error (${endpoint}):`, error);
            
            if (this.retryCount < CONFIG.MAX_RETRIES) {
                this.retryCount++;
                console.log(`🔄 Retry ${this.retryCount}/${CONFIG.MAX_RETRIES}`);
                await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
                return this.request(endpoint, options);
            }
            
            throw error;
        }
    }

    // Endpoints API
    async getInfractions(params = {}) {
        const searchParams = new URLSearchParams(params);
        return this.request(`/infractions?${searchParams}`);
    }

    async getCategories() {
        return this.request('/categories');
    }

    async getGravites() {
        return this.request('/gravites');
    }

    async getStats() {
        return this.request('/stats');
    }

    async sendChatMessage(message) {
        return this.request('/chat', {
            method: 'POST',
            body: JSON.stringify({ message })
        });
    }

    async getArticle(articleId) {
        return this.request(`/articles/${articleId}`);
    }

    async testConnection() {
        console.log('🔍 Test de connexion API...', this.baseUrl);
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-cache' // Éviter le cache
            });
            
            console.log('📡 Réponse API:', response.status, response.statusText);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('✅ API Health Check réussi:', data);
            return true;
        } catch (error) {
            console.error('❌ Test de connexion échoué:', error);
            return false;
        }
    }
}

// ===== UTILITAIRES =====
const Utils = {
    // Debounce pour la recherche
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Format de date
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Animation de compteur
    animateCounter(element, start, end, duration) {
        const startTime = performance.now();
        const update = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const current = Math.floor(start + (end - start) * progress);
            
            element.textContent = current.toLocaleString('fr-FR');
            
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        };
        requestAnimationFrame(update);
    },

    // Affichage des notifications
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove après 5 secondes
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    },

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    },

    // Gestion des erreurs
    handleError(error, context = '') {
        console.error(`💥 Erreur ${context}:`, error);
        
        let message = 'Une erreur est survenue.';
        if (error.message.includes('Failed to fetch')) {
            message = 'Impossible de se connecter à l\'API. Vérifiez votre connexion.';
        } else if (error.message.includes('404')) {
            message = 'Ressource non trouvée.';
        } else if (error.message.includes('500')) {
            message = 'Erreur serveur. Veuillez réessayer plus tard.';
        }
        
        this.showNotification(message, 'error');
    }
};

// ===== GESTIONNAIRE D'INTERFACE =====
class UIManager {
    constructor() {
        this.loadingElements = new Set();
    }

    // Gestion des onglets
    initializeTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const navLinks = document.querySelectorAll('.nav-link');
        
        // Boutons d'onglets
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                this.switchTab(tabId);
            });
        });
        
        // Liens de navigation
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = link.dataset.tab;
                if (tabId) {
                    this.switchTab(tabId);
                }
            });
        });
    }

    switchTab(tabId) {
        // Mettre à jour l'état
        AppState.currentTab = tabId;
        
        // Mettre à jour les boutons
        document.querySelectorAll('.tab-btn, .nav-link').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            }
        });
        
        // Mettre à jour le contenu
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            if (content.id === tabId) {
                content.classList.add('active');
                this.onTabActivated(tabId);
            }
        });
    }

    onTabActivated(tabId) {
        switch (tabId) {
            case 'recherche':
                searchManager.refreshResults();
                break;
            case 'chat':
                chatManager.focusInput();
                break;
            case 'stats':
                statsManager.updateCharts();
                break;
        }
    }

    // Gestion du loading
    showLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.add('loading');
            this.loadingElements.add(elementId);
        }
    }

    hideLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('loading');
            this.loadingElements.delete(elementId);
        }
    }

    // Mise à jour de l'indicateur de statut
    updateStatus(status, message) {
        const indicator = document.getElementById('statusIndicator');
        if (!indicator) return;
        
        const dot = indicator.querySelector('.status-dot');
        const text = indicator.querySelector('.status-text');
        
        // Supprimer les classes précédentes
        dot.className = 'status-dot';
        dot.classList.add(status);
        
        text.textContent = message;
        
        // Mettre à jour l'état global
        AppState.apiConnected = (status === 'online');
    }

    // Animation d'apparition des éléments
    animateElementsIn(selector) {
        const elements = document.querySelectorAll(selector);
        elements.forEach((element, index) => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                element.style.transition = 'all 0.5s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }
}

// ===== GESTIONNAIRE DE RECHERCHE =====
class SearchManager {
    constructor() {
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.clearBtn = document.getElementById('clearSearch');
        this.resultsContainer = document.getElementById('searchResults');
        
        this.debouncedSearch = Utils.debounce(this.performSearch.bind(this), CONFIG.DEBOUNCE_DELAY);
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Recherche
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => this.performSearch());
        }
        
        if (this.searchInput) {
            this.searchInput.addEventListener('input', (e) => {
                const value = e.target.value;
                AppState.searchQuery = value;
                
                // Afficher/masquer le bouton clear
                if (this.clearBtn) {
                    this.clearBtn.style.display = value ? 'flex' : 'none';
                }
                
                // Recherche automatique
                if (value.length >= CONFIG.SEARCH_MIN_LENGTH || value.length === 0) {
                    this.debouncedSearch();
                }
            });
            
            this.searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.performSearch();
                }
            });
        }
        
        // Bouton clear
        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => {
                this.searchInput.value = '';
                AppState.searchQuery = '';
                this.clearBtn.style.display = 'none';
                this.performSearch();
            });
        }
        
        // Filtres
        ['categorieFilter', 'graviteFilter', 'sourceFilter'].forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', (e) => {
                    const filterType = filterId.replace('Filter', '');
                    AppState.filters[filterType] = e.target.value;
                    AppState.currentPage = 1;
                    this.performSearch();
                });
            }
        });
        
        // Recherches rapides
        document.querySelectorAll('.quick-search-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const searchTerm = btn.dataset.search;
                this.searchInput.value = searchTerm;
                AppState.searchQuery = searchTerm;
                this.performSearch();
            });
        });
        
        // Bouton reset filtres
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearAllFilters());
        }
    }

    async performSearch() {
        try {
            ui.showLoading('searchResults');
            
            const searchStartTime = performance.now();
            
            const params = {
                search: AppState.searchQuery,
                limit: CONFIG.PAGINATION_SIZE,
                offset: (AppState.currentPage - 1) * CONFIG.PAGINATION_SIZE,
                ...AppState.filters
            };
            
            // Supprimer les paramètres vides
            Object.keys(params).forEach(key => {
                if (!params[key]) delete params[key];
            });
            
            const response = await api.getInfractions(params);
            const searchTime = performance.now() - searchStartTime;
            
            AppState.infractions = response.infractions || response;
            this.displayResults(AppState.infractions, response.total || AppState.infractions.length, searchTime);
            
        } catch (error) {
            Utils.handleError(error, 'recherche');
            this.displayError();
        } finally {
            ui.hideLoading('searchResults');
        }
    }

    displayResults(infractions, total, searchTime) {
        if (!this.resultsContainer) return;
        
        // Mettre à jour les informations de résultats
        this.updateResultsInfo(total, searchTime);
        
        if (infractions.length === 0) {
            this.displayNoResults();
            return;
        }
        
        // Générer les cartes d'infractions
        const cardsHTML = infractions.map(infraction => this.createInfractionCard(infraction)).join('');
        this.resultsContainer.innerHTML = cardsHTML;
        
        // Animation d'apparition
        ui.animateElementsIn('.infraction-card');
        
        // Mettre à jour la pagination
        this.updatePagination(total);
    }

    createInfractionCard(infraction) {
        const graviteClass = `gravite-${infraction.gravite}`;
        const graviteLabels = {
            'legere': 'Légère',
            'moyenne': 'Moyenne', 
            'grave': 'Grave',
            'tres_grave': 'Très Grave'
        };
        
        const sanctions = [];
        if (infraction.amende_max > 0) {
            sanctions.push(`💰 ${infraction.amende_min}-${infraction.amende_max}€`);
        }
        if (infraction.points_permis > 0) {
            sanctions.push(`🔴 ${infraction.points_permis} pts`);
        }
        if (infraction.immobilisation) {
            sanctions.push(`🚫 Immobilisation`);
        }
        
        return `
            <div class="infraction-card animate-fade-in" data-id="${infraction.id}">
                <div class="infraction-header">
                    <h3 class="infraction-title">${infraction.titre}</h3>
                    <div class="infraction-gravite ${graviteClass}">
                        <i class="fas fa-exclamation-triangle"></i>
                        ${graviteLabels[infraction.gravite] || infraction.gravite}
                    </div>
                </div>
                
                <div class="infraction-meta">
                    <span class="infraction-article">
                        <i class="fas fa-gavel"></i>
                        <a href="#" onclick="openArticleModal('${infraction.id}')" class="article-link">
                            ${infraction.article}
                        </a>
                    </span>
                    <span class="infraction-source">
                        <i class="fas fa-book"></i>
                        ${infraction.code_source || 'N/A'}
                    </span>
                </div>
                
                <div class="infraction-description">
                    ${infraction.description}
                </div>
                
                <div class="infraction-sanction">
                    <strong>Sanction :</strong> ${infraction.sanction}
                </div>
                
                ${sanctions.length > 0 ? `
                    <div class="infraction-sanctions">
                        ${sanctions.join(' • ')}
                    </div>
                ` : ''}
                
                <div class="infraction-tags">
                    ${(infraction.tags || []).map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                
                ${infraction.categorie === 'derogations_article13' ? `
                    <div class="derogation-notice">
                        <i class="fas fa-info-circle"></i>
                        <strong>Dérogation Article 13</strong> - Conditions spécifiques d'application
                    </div>
                ` : ''}
            </div>
        `;
    }

    updateResultsInfo(total, searchTime) {
        const resultsCount = document.getElementById('resultsCount');
        const resultsTime = document.getElementById('resultsTime');
        const resultsTitle = document.getElementById('resultsTitle');
        
        if (resultsCount) {
            const text = total === 1 ? 'résultat' : 'résultats';
            resultsCount.textContent = `${total.toLocaleString('fr-FR')} ${text}`;
        }
        
        if (resultsTime) {
            resultsTime.textContent = `en ${(searchTime / 1000).toFixed(2)}s`;
        }
        
        if (resultsTitle) {
            resultsTitle.textContent = AppState.searchQuery 
                ? `Résultats pour "${AppState.searchQuery}"`
                : 'Toutes les infractions';
        }
    }

    displayNoResults() {
        this.resultsContainer.innerHTML = `
            <div class="no-results animate-fade-in">
                <i class="fas fa-search"></i>
                <h3>Aucun résultat trouvé</h3>
                <p>Essayez avec d'autres mots-clés ou modifiez vos filtres.</p>
                <button class="btn btn-primary" onclick="searchManager.clearAllFilters()">
                    <i class="fas fa-refresh"></i>
                    Réinitialiser les filtres
                </button>
            </div>
        `;
    }

    displayError() {
        this.resultsContainer.innerHTML = `
            <div class="error-results animate-fade-in">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Erreur de chargement</h3>
                <p>Impossible de charger les résultats. Vérifiez votre connexion.</p>
                <button class="btn btn-primary" onclick="searchManager.performSearch()">
                    <i class="fas fa-refresh"></i>
                    Réessayer
                </button>
            </div>
        `;
    }

    updatePagination(total) {
        const totalPages = Math.ceil(total / CONFIG.PAGINATION_SIZE);
        const paginationContainer = document.getElementById('pagination');
        const paginationInfo = document.getElementById('paginationInfo');
        
        if (!paginationContainer) return;
        
        if (totalPages <= 1) {
            paginationContainer.innerHTML = '';
            if (paginationInfo) paginationInfo.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Bouton précédent
        if (AppState.currentPage > 1) {
            paginationHTML += `
                <button class="page-btn" onclick="searchManager.changePage(${AppState.currentPage - 1})">
                    <i class="fas fa-chevron-left"></i> Précédent
                </button>
            `;
        }
        
        // Numéros de page
        const startPage = Math.max(1, AppState.currentPage - 2);
        const endPage = Math.min(totalPages, AppState.currentPage + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === AppState.currentPage ? 'active' : '';
            paginationHTML += `
                <button class="page-btn ${activeClass}" onclick="searchManager.changePage(${i})">
                    ${i}
                </button>
            `;
        }
        
        // Bouton suivant
        if (AppState.currentPage < totalPages) {
            paginationHTML += `
                <button class="page-btn" onclick="searchManager.changePage(${AppState.currentPage + 1})">
                    Suivant <i class="fas fa-chevron-right"></i>
                </button>
            `;
        }
        
        paginationContainer.innerHTML = paginationHTML;
        
        // Info pagination
        if (paginationInfo) {
            const start = (AppState.currentPage - 1) * CONFIG.PAGINATION_SIZE + 1;
            const end = Math.min(AppState.currentPage * CONFIG.PAGINATION_SIZE, total);
            paginationInfo.innerHTML = `Affichage ${start}-${end} sur ${total.toLocaleString('fr-FR')}`;
        }
    }

    changePage(page) {
        AppState.currentPage = page;
        this.performSearch();
        
        // Scroll vers le haut des résultats
        const resultsSection = document.querySelector('.results-section');
        if (resultsSection) {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    clearAllFilters() {
        // Reset des inputs
        if (this.searchInput) {
            this.searchInput.value = '';
        }
        
        ['categorieFilter', 'graviteFilter', 'sourceFilter'].forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) filter.value = '';
        });
        
        // Reset de l'état
        AppState.searchQuery = '';
        AppState.filters = { categorie: '', gravite: '', source: '' };
        AppState.currentPage = 1;
        
        // Masquer le bouton clear
        if (this.clearBtn) {
            this.clearBtn.style.display = 'none';
        }
        
        // Nouvelle recherche
        this.performSearch();
    }

    async refreshResults() {
        await this.performSearch();
    }
}

// ===== GESTIONNAIRE DE CHAT =====
class ChatManager {
    constructor() {
        this.chatInput = document.getElementById('chatInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.messagesContainer = document.getElementById('chatMessages');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        if (this.sendBtn) {
            this.sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
        
        // Questions rapides
        document.querySelectorAll('.quick-question').forEach(btn => {
            btn.addEventListener('click', () => {
                const question = btn.dataset.question;
                this.chatInput.value = question;
                this.sendMessage();
            });
        });
    }

    async sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message) return;
        
        // Ajouter le message utilisateur
        this.addMessage(message, 'user');
        
        // Vider l'input
        this.chatInput.value = '';
        
        // Afficher l'indicateur de frappe
        this.showTypingIndicator();
        
        try {
            // Envoyer à l'API
            const response = await api.sendChatMessage(message);
            
            // Supprimer l'indicateur de frappe
            this.hideTypingIndicator();
            
            // Ajouter la réponse
            this.addMessage(response.response, 'bot', response.detecte_exceptions);
            
        } catch (error) {
            this.hideTypingIndicator();
            Utils.handleError(error, 'chat');
            
            // Message d'erreur de fallback
            this.addMessage(
                'Désolé, je rencontre un problème technique. Veuillez réessayer dans quelques instants.',
                'bot'
            );
        }
    }

    addMessage(content, sender, hasExceptions = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message animate-fade-in`;
        
        const avatar = sender === 'user' ? '👤' : '⚖️';
        const time = new Date().toLocaleTimeString('fr-FR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-header">
                    <strong>${sender === 'user' ? 'Vous' : 'Maître SOGEST-IA'}</strong>
                    <span class="message-time">${time}</span>
                </div>
                <div class="message-text">${this.formatMessage(content, hasExceptions)}</div>
            </div>
        `;
        
        this.messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();
    }

    formatMessage(content, hasExceptions) {
        let formatted = content.replace(/\n/g, '<br>');
        
        // Mise en forme des éléments spéciaux
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        if (hasExceptions) {
            formatted += `
                <div class="exception-notice">
                    <i class="fas fa-lightbulb"></i>
                    <strong>Détection d'exceptions :</strong> Cette réponse contient des questions clarifiantes pour des conseils juridiques précis.
                </div>
            `;
        }
        
        return formatted;
    }

    showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message bot-message typing-indicator';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="message-avatar">⚖️</div>
            <div class="message-content">
                <div class="typing-animation">
                    <span></span>
                    <span></span>
                    <span></span>
                    <span class="typing-text">Maître SOGEST-IA réfléchit...</span>
                </div>
            </div>
        `;
        
        this.messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    focusInput() {
        if (this.chatInput) {
            this.chatInput.focus();
        }
    }
}

// ===== GESTIONNAIRE DE STATISTIQUES =====
class StatsManager {
    constructor() {
        this.charts = {};
    }

    async updateStats() {
        try {
            const stats = await api.getStats();
            AppState.stats = stats;
            
            this.updateCounters(stats);
            this.updateLastUpdate();
            
        } catch (error) {
            Utils.handleError(error, 'statistiques');
        }
    }

    updateCounters(stats) {
        // Compteurs animés
        const counters = [
            { id: 'totalInfractionsCount', value: stats.total_infractions || 459 },
            { id: 'chatInteractions', value: stats.chat_interactions || 2847 },
            { id: 'searchQueries', value: stats.search_queries || 8142 }
        ];
        
        counters.forEach(counter => {
            const element = document.getElementById(counter.id);
            if (element) {
                Utils.animateCounter(element, 0, counter.value, 2000);
            }
        });
        
        // Mise à jour des compteurs dans les autres sections
        const infractions = stats.total_infractions || 459;
        ['heroInfractionCount', 'totalInfractions', 'rechercheCount'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = infractions;
        });
    }

    updateLastUpdate() {
        const lastUpdateElement = document.getElementById('lastUpdate');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = Utils.formatDate(new Date());
        }
    }

    updateCharts() {
        // Mettre à jour les graphiques (à implémenter avec Chart.js si nécessaire)
        console.log('📊 Mise à jour des graphiques');
    }
}

// ===== GESTIONNAIRE DE MODAL =====
function openArticleModal(infractionId) {
    // Cette fonction sera appelée lors du clic sur un article
    console.log(`📖 Ouverture article: ${infractionId}`);
    
    const modal = document.getElementById('articleModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    
    if (!modal || !title || !body) return;
    
    // Rechercher l'infraction
    const infraction = AppState.infractions.find(inf => inf.id === infractionId);
    
    if (infraction) {
        title.textContent = infraction.titre;
        body.innerHTML = generateArticleContent(infraction);
    } else {
        title.textContent = 'Article non trouvé';
        body.innerHTML = '<p>Impossible de charger les détails de cet article.</p>';
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function generateArticleContent(infraction) {
    const sanctions = [];
    if (infraction.amende_max > 0) {
        sanctions.push(`Amende : ${infraction.amende_min} à ${infraction.amende_max}€`);
    }
    if (infraction.points_permis > 0) {
        sanctions.push(`Points de permis : ${infraction.points_permis}`);
    }
    if (infraction.immobilisation) {
        sanctions.push(`Immobilisation du véhicule possible`);
    }
    
    return `
        <div class="article-details">
            <div class="article-header">
                <div class="article-ref">
                    <i class="fas fa-gavel"></i>
                    <strong>${infraction.article}</strong>
                </div>
                <div class="article-source">
                    <i class="fas fa-book"></i>
                    ${infraction.code_source || 'N/A'}
                </div>
            </div>
            
            <div class="article-section">
                <h4>📋 Description</h4>
                <p>${infraction.description}</p>
            </div>
            
            <div class="article-section">
                <h4>⚖️ Sanctions</h4>
                <p>${infraction.sanction}</p>
                ${sanctions.length > 0 ? `
                    <ul class="sanctions-list">
                        ${sanctions.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>
            
            ${infraction.tags && infraction.tags.length > 0 ? `
                <div class="article-section">
                    <h4>🏷️ Tags</h4>
                    <div class="tags-list">
                        ${infraction.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="article-actions">
                <a href="https://legifrance.gouv.fr" target="_blank" class="btn btn-primary">
                    <i class="fas fa-external-link-alt"></i>
                    Voir sur Légifrance
                </a>
                <button class="btn btn-secondary" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                    Fermer
                </button>
            </div>
        </div>
    `;
}

function closeModal() {
    const modal = document.getElementById('articleModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// ===== GESTIONNAIRES D'ÉVÉNEMENTS GLOBAUX =====
function initializeGlobalEventListeners() {
    // Fermeture de modal par clic extérieur
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('articleModal');
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Raccourcis clavier
    document.addEventListener('keydown', (e) => {
        // Échap pour fermer la modal
        if (e.key === 'Escape') {
            closeModal();
        }
        
        // Ctrl+K pour focus sur la recherche
        if (e.ctrlKey && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
                ui.switchTab('recherche');
            }
        }
    });
}

// ===== INITIALISATION =====
let api, ui, searchManager, chatManager, statsManager;

async function initializeApp() {
    console.log('🚛 Initialisation Sogestmatic v' + CONFIG.VERSION);
    console.log('🌐 URL détectée:', window.location.href);
    console.log('🏠 Hostname:', window.location.hostname);
    
    try {
        // Initialiser les composants
        api = new SogestmaticAPI(CONFIG.API_BASE_URL);
        console.log('🔗 API Base URL configurée:', CONFIG.API_BASE_URL);
        
        ui = new UIManager();
        searchManager = new SearchManager();
        chatManager = new ChatManager();
        statsManager = new StatsManager();
        
        // Initialiser l'interface
        ui.initializeTabs();
        initializeGlobalEventListeners();
        
        // Tester la connexion API avec retry
        ui.updateStatus('loading', 'Test connexion API...');
        console.log('🔄 Début du test de connexion...');
        
        let isConnected = false;
        for (let i = 0; i < 3; i++) {
            console.log(`🔄 Tentative ${i + 1}/3 de connexion API...`);
            isConnected = await api.testConnection();
            if (isConnected) break;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1s entre les tentatives
        }
        
        if (isConnected) {
            console.log('✅ API connectée avec succès !');
            ui.updateStatus('online', 'API connectée');
            
            // Charger les données initiales
            await Promise.all([
                loadInitialData(),
                searchManager.refreshResults(),
                statsManager.updateStats()
            ]);
            
            Utils.showNotification('🚛 Sogestmatic prêt !', 'success');
            
        } else {
            console.warn('⚠️ API non disponible - Mode offline');
            ui.updateStatus('error', 'API non disponible');
            Utils.showNotification('⚠️ Mode hors ligne - Fonctionnalités limitées', 'warning');
        }
        
    } catch (error) {
        console.error('💥 Erreur d\'initialisation:', error);
        ui.updateStatus('error', 'Erreur d\'initialisation');
        Utils.handleError(error, 'initialisation');
    } finally {
        // Marquer l'application comme chargée
        document.body.classList.add('loaded');
        console.log('🎉 Application chargée !');
    }
}

async function loadInitialData() {
    try {
        // Charger les catégories et gravités pour les filtres
        const [categories, gravites] = await Promise.all([
            api.getCategories(),
            api.getGravites()
        ]);
        
        AppState.categories = categories;
        AppState.gravites = gravites;
        
        // Remplir les sélecteurs
        populateFilterSelects(categories, gravites);
        
    } catch (error) {
        console.error('❌ Erreur chargement données initiales:', error);
    }
}

function populateFilterSelects(categories, gravites) {
    // Catégories
    const categorieSelect = document.getElementById('categorieFilter');
    if (categorieSelect && categories) {
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id || cat.label;
            option.textContent = `${cat.label} (${cat.count || 0})`;
            categorieSelect.appendChild(option);
        });
    }
    
    // Gravités
    const graviteSelect = document.getElementById('graviteFilter');
    if (graviteSelect && gravites) {
        gravites.forEach(grav => {
            const option = document.createElement('option');
            option.value = grav.id || grav.label;
            option.textContent = `${grav.label} (${grav.count || 0})`;
            graviteSelect.appendChild(option);
        });
    }
}

// ===== FONCTIONS GLOBALES EXPOSÉES =====
window.openArticleModal = openArticleModal;
window.closeModal = closeModal;
window.searchManager = null; // Sera défini après initialisation
window.chatManager = null;
window.statsManager = null;

// ===== DÉMARRAGE DE L'APPLICATION =====
document.addEventListener('DOMContentLoaded', initializeApp);

// Export pour usage externe
window.Sogestmatic = {
    CONFIG,
    AppState,
    Utils,
    version: CONFIG.VERSION
};

console.log('🚛 Sogestmatic Production Script chargé v' + CONFIG.VERSION); 