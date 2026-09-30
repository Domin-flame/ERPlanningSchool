#!/bin/sh
set -e

# Injecte les variables d'environnement dans la config nginx (template).
# BACKEND_UPSTREAM doit être défini (défaut via Dockerfile ARG).
envsubst '${BACKEND_UPSTREAM}' < /etc/nginx/conf.d/default.conf.template \
  > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
