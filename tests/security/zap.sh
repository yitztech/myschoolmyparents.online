#!/usr/bin/env bash
# ZAP pasivo (baseline) contra las imágenes de producción (AUDITORIA SEG-08 de la plataforma).
# Construye backend y nginx como los publica deploy.yml, los levanta con docker-compose.prod.yml
# y valores de prueba, y analiza nginx desde su propia red (no publica puertos).
# Falla con cualquier aviso nuevo; las excepciones, con su motivo, en tests/security/zap-reglas.tsv.
#   tests/security/zap.sh        (en local o en el CI; el informe queda en zap/zap.html)
set -euo pipefail
cd "$(dirname "$0")/../.."

export COMPOSE_PROJECT_NAME="zap-${GITHUB_RUN_ID:-local}"
export IMAGE_PREFIX=local/msmp IMAGE_TAG=zap
# Credenciales aleatorias en cada ejecución: ninguna queda escrita en el repositorio
export POSTGRES_PASSWORD="$(openssl rand -hex 16)" JWT_SECRET="$(openssl rand -hex 32)"
export SITE_URL=http://localhost TRUSTED_PROXY_CIDR=127.0.0.1/32
export SMTP_HOST=localhost SMTP_USER=zap SMTP_PASSWORD="$(openssl rand -hex 16)" MAIL_FROM=zap@example.test
compose=(docker compose -f docker-compose.prod.yml)

cleanup() { "${compose[@]}" down -v --remove-orphans >/dev/null 2>&1 || true; }
trap cleanup EXIT

release_sha="${GITHUB_SHA:-$(git rev-parse HEAD)}"
docker build -q --target prod -t "$IMAGE_PREFIX-backend:$IMAGE_TAG" apps/backend >/dev/null
docker build -q -f infra/nginx/Dockerfile.prod --build-arg "RELEASE_SHA=$release_sha" --build-arg VITE_AUTH_API_URL=/api \
  -t "$IMAGE_PREFIX-nginx:$IMAGE_TAG" . >/dev/null
"${compose[@]}" up -d --wait --wait-timeout 180 || { "${compose[@]}" logs --no-color | tail -n 100; exit 1; }

rm -rf zap && mkdir -p zap && cp tests/security/zap-reglas.tsv zap/ && chmod -R 777 zap
docker run --rm --network "container:$("${compose[@]}" ps -q nginx)" -v "$PWD/zap:/zap/wrk:rw" \
  ghcr.io/zaproxy/zaproxy:2.17.0 zap-baseline.py -t http://127.0.0.1 -c zap-reglas.tsv -r zap.html
