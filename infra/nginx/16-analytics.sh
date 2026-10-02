#!/bin/sh
# Analítica con Umami (adaptado de gateway/16-analytics.sh de yitztech/plantilla-cliente).
#
# Si hay UMAMI_SCRIPT_URL y UMAMI_WEBSITE_ID, nginx inserta el script en el
# HTML de la SPA y la CSP admite el origen de Umami. Sin valores no se carga
# nada de terceros y la CSP no lo menciona.
#   UMAMI_SCRIPT_URL   p. ej. https://stats.yunitztech.com/script.js
#   UMAMI_WEBSITE_ID   UUID de la web en Umami
#
# El contenedor es de solo lectura: todo se escribe en /etc/nginx/conf.d, que
# es un tmpfs. Corre antes que 20-envsubst-on-templates.sh (orden alfabético).
#   analytics.conf  -> `map` con el origen para la CSP (contexto http)
#   analytics.inc   -> sub_filter que inserta el script (lo incluye la location
#                      de index.html; .inc para que no se cargue a nivel http)
set -eu

dir=/etc/nginx/conf.d
origin=""
: > "$dir/analytics.inc"

if [ -n "${UMAMI_SCRIPT_URL:-}" ] && [ -n "${UMAMI_WEBSITE_ID:-}" ]; then
  # Los valores acaban dentro de la configuración de nginx y del HTML: se
  # validan para que ni una comilla ni un ; puedan colarse.
  if ! printf '%s' "$UMAMI_SCRIPT_URL" | grep -Eq '^https://[A-Za-z0-9.-]+(:[0-9]+)?/[A-Za-z0-9._/-]*$'; then
    echo "16-analytics.sh: UMAMI_SCRIPT_URL debe ser una URL https:// sin parámetros" >&2
    exit 1
  fi
  if ! printf '%s' "$UMAMI_WEBSITE_ID" | grep -Eq '^[0-9a-fA-F-]{36}$'; then
    echo "16-analytics.sh: UMAMI_WEBSITE_ID debe ser un UUID" >&2
    exit 1
  fi
  origin=$(printf '%s' "$UMAMI_SCRIPT_URL" | sed -E 's#^(https://[^/]+).*#\1#')
  # data-domains: solo cuenta visitas en producción (no en local ni en
  # previsualizaciones). data-exclude-search: nunca envía la query string, así
  # que tokens o datos personales en la URL no llegan a la analítica. Las rutas
  # de la SPA las sigue Umami solo, escuchando el historial.
  cat > "$dir/analytics.inc" <<CONF
# Generado por 16-analytics.sh: script de Umami antes de </head>
sub_filter_once on;
sub_filter '</head>' '<script defer src="${UMAMI_SCRIPT_URL}" data-website-id="${UMAMI_WEBSITE_ID}" data-domains="myschoolmyparents.online" data-exclude-search="true"></script></head>';
CONF
  echo "16-analytics.sh: Umami activado ($origin)"
else
  echo "16-analytics.sh: sin UMAMI_SCRIPT_URL/UMAMI_WEBSITE_ID, sin analítica"
fi

# Origen extra para script-src (carga el script) y connect-src (envía las
# visitas) de la CSP; vacío sin Umami. Ver security-headers.conf.
printf 'map $host $analytics_src { default "%s"; }\n' "${origin:+ $origin}" > "$dir/analytics.conf"
