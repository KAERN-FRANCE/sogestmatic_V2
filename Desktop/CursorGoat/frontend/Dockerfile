# Dockerfile Frontend React/TypeScript
# Sogestmatic - Mission Stage

# Stage 1: Build
FROM node:18-alpine AS builder

# Métadonnées
LABEL maintainer="Sogestmatic <contact@sogestmatic.fr>"
LABEL description="Frontend Interface Web Tachygraphique"
LABEL version="1.0.0"

# Variables d'environnement
ENV NODE_ENV=production
ENV GENERATE_SOURCEMAP=false

# Répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances
RUN npm ci --only=production --silent

# Copie du code source
COPY src/ ./src/
COPY public/ ./public/
COPY tsconfig.json ./
COPY craco.config.js ./

# Arguments de build
ARG REACT_APP_API_URL=http://localhost:8000
ARG REACT_APP_VERSION=1.0.0
ARG REACT_APP_ENV=production

# Variables d'environnement pour le build
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_VERSION=$REACT_APP_VERSION
ENV REACT_APP_ENV=$REACT_APP_ENV

# Build de l'application
RUN npm run build

# Stage 2: Production avec Nginx
FROM nginx:alpine AS production

# Installation de curl pour healthcheck
RUN apk add --no-cache curl

# Copie de la configuration Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copie des fichiers buildés
COPY --from=builder /app/build /usr/share/nginx/html

# Copie du script de démarrage
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Permissions
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# Utilisateur non-root
USER nginx

# Port d'exposition
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Commande de démarrage
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"] 