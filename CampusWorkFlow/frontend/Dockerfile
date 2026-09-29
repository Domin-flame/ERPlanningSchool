# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app

# Copier les dépendances puis installer (cache efficace)
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

# Passer VITE_API_URL comme ARG de build pour que Vite l'intègre dans le bundle
ARG VITE_API_URL=http://localhost:3000/api
ENV VITE_API_URL=${VITE_API_URL}

# Copier le code source et construire
COPY . .
RUN npm run build

# ---------- Production stage ----------
FROM nginx:1.27-alpine

# URL du gateway — injectée via envsubst au démarrage du conteneur
ARG BACKEND_UPSTREAM=http://gateway:3000
ENV BACKEND_UPSTREAM=${BACKEND_UPSTREAM}

# Template nginx + entrypoint pour injection d'env
COPY nginx.conf /etc/nginx/conf.d/default.conf.template
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
