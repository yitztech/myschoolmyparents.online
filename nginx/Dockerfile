# Nginx — puerta de entrada única del compose `my-school-my-parents`.
# Enruta /       -> frontend:4173 (build Vite servido con `vite preview`)
# Enruta /api/   -> backend:3001  (OCR + health)
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
