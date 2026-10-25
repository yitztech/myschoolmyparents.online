# Backend NestJS — MySchoolMyParents.
# Multi-stage por entorno (ver docker-compose*.yml):
#   dev:  `nest start --watch` (hot-reload; el src se monta por volumen).
#   prod: compila TypeScript y arranca solo con dependencias prod optimizadas.
# El runtime corre como usuario `node` (no root).
FROM node:24.21-alpine AS base
WORKDIR /app
COPY --chown=node:node package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund && npm cache clean --force
# Modelos de Tesseract horneados en la imagen (eng + spa).
ARG TESSDATA_VARIANT=4.0.0_best_int
RUN mkdir -p /app/tessdata \
 && for L in eng spa; do \
      wget -qO- "https://cdn.jsdelivr.net/npm/@tesseract.js-data/$L/${TESSDATA_VARIANT}/$L.traineddata.gz" | gunzip > "/app/tessdata/$L.traineddata" \
      || { echo "aviso: no se pudo hornear $L.traineddata; se descargara en runtime"; rm -f "/app/tessdata/$L.traineddata"; }; \
    done \
 && chown -R node:node /app/tessdata
COPY --chown=node:node . ./

FROM base AS dev
# nest start --watch escribe tsconfig.build.tsbuildinfo en /app (lo crea WORKDIR como root)
RUN chown node:node /app
USER node
ENV NODE_ENV=development
EXPOSE 3001
CMD ["npm", "run", "start:dev"]

FROM base AS build
RUN npm run build

FROM node:24.21-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --chown=node:node package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force \
 && find node_modules -name "*.d.ts" -delete \
 && find node_modules -name "*.map" -delete
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=base --chown=node:node /app/tessdata ./tessdata
USER node
EXPOSE 3001
CMD ["node", "dist/main.js"]
