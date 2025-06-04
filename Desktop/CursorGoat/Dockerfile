# Dockerfile pour l'API Base de Données Juridique Tachygraphique
# Sogestmatic - Mission Stage

FROM python:3.11-slim

# Métadonnées
LABEL maintainer="Sogestmatic <contact@sogestmatic.fr>"
LABEL description="API Juridique Tachygraphique"
LABEL version="1.0.0"

# Variables d'environnement
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV PIP_NO_CACHE_DIR=1
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

# Installation des dépendances système
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    libpq-dev \
    libffi-dev \
    libssl-dev \
    pkg-config \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Création du répertoire de travail
WORKDIR /app

# Copie des fichiers de dépendances
COPY requirements.txt .

# Installation des dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code source
COPY api/ ./api/
COPY workers/ ./workers/
COPY analysis/ ./analysis/
COPY ai/ ./ai/
COPY reports/ ./reports/
COPY architecture/ ./architecture/
COPY data/ ./data/

# Création des répertoires nécessaires
RUN mkdir -p logs generated_reports temp_files

# Permissions
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# Port d'exposition
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Commande par défaut
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"] 