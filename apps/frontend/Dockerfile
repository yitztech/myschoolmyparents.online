# Frontend — MySchoolMyParents web.
# Multi-stage por entorno (ver docker-compose*.yml):
#   dev:  `vite dev` con HMR (lo proxea nginx.dev.conf desde :6060;
#         directo en :5173). El código se monta por volumen en el compose.
#         Corre como usuario `node` (no root).
#   prod: build estático. En prod real lo construye nginx/Dockerfile.prod;
#         este stage sirve para inspeccionar el build (`docker build --target prod`).
FROM node:24.20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force && chown -R node:node /app
COPY --chown=node:node . ./

FROM base AS dev
USER node
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "--port", "5173"]

FROM base AS prod
# Backend de autenticación en internet (puede ir vacío = mock local).
ARG VITE_AUTH_API_URL=""
ARG VITE_GOOGLE_CLIENT_ID=""
ENV VITE_AUTH_API_URL=$VITE_AUTH_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build
