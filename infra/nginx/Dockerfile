# Nginx — puerta de entrada del compose `my-school-my-parents`.
# La conf se elige por entorno con el arg NGINX_CONF:
#   dev:  nginx.dev.conf  (proxy / -> vite dev :5173, /api/ -> backend:3001)
#   prod: ver Dockerfile.prod (estáticos horneados + nginx.prod.conf)
# Nota: el master corre como root (estándar para atar el puerto 80);
# los workers bajan al usuario `nginx`. Capabilities recortadas en el compose.
FROM nginx:1.31-alpine
ARG NGINX_CONF=nginx.dev.conf
COPY ${NGINX_CONF} /etc/nginx/conf.d/default.conf
EXPOSE 80
