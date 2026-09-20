# Frontend — MySchoolMyParents web.
# Compila el build de producción (Vite) y lo sirve con `vite preview`.
# NO expone nginx aquí: el proxy va en el servicio `nginx`.
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . ./
# Backend de autenticación en internet (puede ir vacío = mock local).
ARG VITE_AUTH_API_URL=""
ARG VITE_GOOGLE_CLIENT_ID=""
ENV VITE_AUTH_API_URL=$VITE_AUTH_API_URL
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build
EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "--port", "4173"]
