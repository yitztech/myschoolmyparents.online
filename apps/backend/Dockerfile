# Backend NestJS — MySchoolMyParents.
# Multi-stage por entorno (ver docker-compose*.yml):
#   dev:  `nest start --watch` (hot-reload; el src se monta por volumen).
#   prod: compila TypeScript y arranca solo con dependencias prod.
# El runtime corre como usuario `node` (no root).
FROM node:24.21-alpine AS base
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci && npm cache clean --force && chown -R node:node /app
# Modelos de Tesseract horneados en la imagen. Sin esto, el primer OCR tras
# cada reinicio los baja de un CDN externo: en prod el cache vive en un
# tmpfs, así que se pierde en cada arranque. Si la descarga falla, la imagen
# se construye igual y tesseract.js cae a su descarga en runtime.
#
# La variante es la misma que usa tesseract.js v5 por defecto
# (ver node_modules/tesseract.js/src/worker-script/index.js): `4.0.0_best_int`,
# solo LSTM. La variante `4.0.0` a secas incluye además el motor Legacy, que
# esta app no usa, y pesa seis veces más (41 MB frente a 8 MB en la imagen).
ARG TESSDATA_VARIANT=4.0.0_best_int
RUN mkdir -p /app/tessdata \
 && for L in eng spa; do \
      wget -qO- "https://cdn.jsdelivr.net/npm/@tesseract.js-data/$L/${TESSDATA_VARIANT}/$L.traineddata.gz" | gunzip > "/app/tessdata/$L.traineddata" \
      || { echo "aviso: no se pudo hornear $L.traineddata; se descargara en runtime"; rm -f "/app/tessdata/$L.traineddata"; }; \
    done \
 && chown -R node:node /app/tessdata
COPY --chown=node:node . ./

FROM base AS dev
USER node
ENV NODE_ENV=development
EXPOSE 3001
CMD ["npm", "run", "start:dev"]

FROM base AS build
RUN npm run build

FROM node:24.21-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force && chown -R node:node /app
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=base --chown=node:node /app/tessdata ./tessdata
USER node
EXPOSE 3001
CMD ["node", "dist/main.js"]
