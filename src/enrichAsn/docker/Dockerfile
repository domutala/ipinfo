# Étape 1 : Build de l'application
FROM oven/bun:1 AS builder

# Installer Python et les outils de build nécessaires
# RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier les fichiers nécessaires
COPY . .

# Installer les dépendances
RUN bun install

# Démarrer Nuxt
CMD ["bun", "run", "src/enrichAsn/enrich.ts"]
