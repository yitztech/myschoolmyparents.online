# MySchoolMyParents Online

> Producción: https://myschoolmyparents.online

Fotos de lecturas escolares convertidas en libros bilingües, con revisión de OCR y
voz en el idioma que se aprende. Monorepo con la **web** (React + NestJS, dockerizada)
y la **app móvil** (Flutter, Android e iOS).

## Monorepo

```
apps/
  backend/    NestJS + Fastify: auth local JWT, OCR (Tesseract), health
  frontend/   React 19 + Vite + Tailwind v4 + shadcn + Dexie (IndexedDB)
  mobile/     Expo SDK 57 + React Native + TypeScript (módulo nativo de OCR en modules/msm-ocr)
infra/nginx/  Proxy: dev (vite + api) y prod (estáticos + api)
e2e/          Pruebas end-to-end (Playwright), paquete npm aparte
.github/workflows/
  ci.yml             web (build + lint) y móvil (tipos + pruebas), según lo que cambie
  mobile.yml         OTA (EAS Update) o build de tienda cuando cambia apps/mobile en main
  mobile-release.yml APK en GitHub Releases al subir un tag vX.Y.Z (nombres oficiales)
scripts/             versión móvil, impacto OTA/tienda y publicación de APK
docs/                REGLAS-DEL-PROYECTO, ARQUITECTURA-MOVIL, ADR, y flutter-legacy/ (archivo histórico)
```

Comandos desde la raíz: `npm run up` (web con Docker), `npm run build`, `npm run lint`,
`npm run mobile` (Expo), `npm run mobile:typecheck`, `npm run mobile:test`, `npm run mobile:version`.
Cada app mantiene su propio `package-lock.json` (sin workspaces),
porque las imágenes Docker se construyen por aplicación.

Todo va en su última versión estable. Excepciones, por estar atadas a otra
pieza (se usa la última compatible):

- **TypeScript 6** en el backend (Nest CLI 12 necesita la API del compilador,
  que TypeScript 7 no trae hasta la 7.1) y en la app (el SDK 57 de Expo pide
  `~6.0.3`). El frontend usa TypeScript 7.
- **`@types/node` 24**: va con el runtime, Node 24 LTS.
- **App móvil**: las versiones que fija el SDK de Expo (`npx expo install --check`),
  con `@types/react` 19.2 y `@babel/core` 7 a juego.

La app y la web comparten el contrato HTTP del backend (`/api/auth`, `/api/ocr`,
`/api/v1/sync`); un cambio de contrato va en un solo commit que toque ambos lados.

---

# Web

Réplica web de la app MyParentMyChildren (Flutter) con **React + shadcn + Docker Compose**.

- Interfaz en español; contenido y voz en el idioma que se aprende (nunca voz ES para texto EN).
- 100% local en frontend: **IndexedDB** (Dexie) con las 5 entidades + blobs de imagen.
- **OCR** vía backend `POST /api/ocr` (Tesseract `eng+spa`) — contrato `recognize → { rawText, paragraphs }`.
- **Voz** con Web Speech API: máquina `idle→preparing→speaking↔paused→completed`, offsets UTF-16, resaltado por palabra solo con `boundary` fiable + fallback a inicio de frase, `lastParagraph/lastOffset` por libro, sin autoplay.
- **Cámara**: `<input type=file capture>` + múltiple; recorte centrado 65–100% y rotación ±90° con canvas.
- Cola OCR de 1 en 1, persistente (`processing→queued` al reabrir), 3 reintentos con backoff, aprobación transaccional por página.

## Estructura

```
.
  docker-compose.yml          # DEV, base: db + backend + nginx (sin envs)
  docker-compose.override.yml # DEV (auto): vite dev + nest watch, puertos :6060/:5173/:3001/:5432
  docker-compose.prod.yml     # PROD en Coolify: autónomo, solo imágenes de GHCR, sin puertos
  .env.example                # plantilla de DEV → copiar a .env.dev (ningún .env se versiona)
  .github/workflows/deploy.yml # publica backend y nginx en GHCR → webhook de Coolify → /version.json
  apps/frontend/            # React 19 + Vite + Tailwind v4 + shadcn (vendored) + Dexie (+ Dockerfile multi-stage dev/prod)
    src/lib/                # types, db, ocr, queue, speech, images, auth, password, auth-context
    src/components/         # Library, BookDetail, Reader, ReviewCards, PagesList, CaptureDialog, VoiceSettings, auth/*, ui/*
  infra/nginx/              # dev: / -> vite:5173, /api/ -> backend:3001 · prod: estáticos + /api/
  apps/backend/             # NestJS + TypeScript + Fastify (auth local JWT + OCR + health)
    src/auth/               # registro, login, recover/reset, guard JWT
    src/users/              # entidad User (PostgreSQL)
    src/ocr/                # Tesseract eng+spa; registra cada petición en ocr_requests
    src/health/             # GET /api/health { ok, db, uptime, version }
    src/migrations/         # esquema inicial (users, ocr_requests)
```

## Backend (NestJS + Fastify)

- **Auth solo local:** `POST /api/auth/register` y `/login` → `{ user, token }`
  (JWT 7d); `POST /api/auth/password/recover|reset` (código de 6 dígitos,
  15 min, enviado por correo); `GET /api/auth/me` con `Authorization: Bearer`.
  Sin OAuth: `GET /api/auth/google` responde **410 Gone** y el frontend
  oculta el botón de Google salvo que se configure `VITE_GOOGLE_CLIENT_ID`.
- **OCR con sesión:** `POST /api/ocr` exige `Authorization: Bearer`. Es la
  operación más cara del backend, así que su coste queda ligado a una cuenta.
- **Seguridad:** helmet (cabeceras), CORS restringido (`CORS_ORIGIN`), rate-limit
  global 200 req/min por IP real (ver *Cadena de proxies*) y 20 req/min en las
  rutas de cuenta, anti-fuerza-bruta en login (10 fallos/10 min por correo + IP
  y 50 por correo → 429), validación estricta de DTOs (misma
  política de contraseña que el frontend), bcrypt (12 rondas), JWT firmado
  (`JWT_SECRET`) con `tokenVersion` —cambiar la contraseña caduca las sesiones
  abiertas—, respuestas genéricas para no enumerar usuarios ni temporizar.
- **Recuperación acotada:** código con `crypto.randomInt` (no `Math.random`),
  10 intentos fallidos por cuenta y hora sumando todos los códigos (contados
  con un UPDATE atómico, así que las peticiones simultáneas no se saltan el
  tope) y un solo correo por cuenta y minuto (si no, el endpoint sería un
  cañón de correo saliente firmado con nuestro dominio, y eso quema la
  reputación de envío).
- **OCR acotado:** imágenes de hasta 10 000 px por lado y 40 MP (se mira la
  cabecera antes de decodificar), 2 en paralelo con cola de 8 y una por cuenta.
- **Observabilidad:** logs JSON con `nestjs-pino` (request-id, método, URL,
  estado, latencia; secretos redactados; pretty en desarrollo). Eventos:
  altas, logins ok/fallidos, resets, OCR. `GET /api/health` incluye estado de la BD.
- **BD:** PostgreSQL vía TypeORM; esquema por migraciones (`migrationsRun`).
  Conexión por `DATABASE_URL` o, si no viene, por `DB_HOST`/`DB_PORT`/`DB_USER`/
  `DB_PASSWORD`/`DB_NAME` (así la usa producción: la contraseña generada puede
  llevar caracteres que romperían una URL escrita a mano).

## Cuentas: login, registro y recuperación

Interfaces en español con navegación `login ⇄ registro | login ⇄ recuperación → login`:

- **Login:** correo + contraseña (mostrar/ocultar), “Continuar con Google”, enlaces a registro y recuperación.
- **Registro:** nombre + correo + contraseña + confirmación. La contraseña exige
  mayúsculas, minúsculas, un número y un símbolo (mín. 8), con checklist en vivo
  y aviso si la confirmación no coincide. Incluye “Registrarse con Google”.
- **Recuperación:** paso 1 correo → paso 2 código de 6 dígitos + nueva contraseña
  (con confirmación) → “Ir a iniciar sesión”.

El backend de cuentas es el de este repo, servido en el mismo origen a
través de nginx:

```bash
# .env.dev en local; en producción, Variable del repositorio (build-time: requiere reconstruir)
VITE_AUTH_API_URL=/api
```

Contrato REST: `POST /auth/register`, `POST /auth/login`,
`POST /auth/password/recover`, `POST /auth/password/reset` y `GET /auth/me`
(ver `src/lib/auth.ts`).

Si `VITE_AUTH_API_URL` está **vacío** se usa un **mock local** (localStorage,
en `src/lib/auth-mock.ts`) para trabajar en el frontend sin backend ni base de
datos. Ese mock no es seguro —el "hash" es reversible y el código de
recuperación se devuelve al cliente— así que tiene dos cierres:

1. **El build de producción falla** si la variable viene vacía
   (`vite.config.ts`). Sin ese cierre, una configuración incompleta publicaba un
   sitio donde la autenticación nunca llegaba al backend, sin ningún error
   visible.
2. El mock se carga con `import()` dinámico bajo `import.meta.env.DEV`, así
   que **no entra en el bundle publicado** (comprobable: `grep -r msm_users
   frontend/dist/` no debe encontrar nada).

Para usarlo, pon `VITE_AUTH_API_URL=` en un `frontend/.env.local` y arranca
con `npm run dev`. En el compose de dev la app habla con el backend real, y
el código de recuperación sale por los logs del backend
(`docker compose logs -f backend`), no por correo.

## Entornos: dev local vs producción

|                  | DEV local | PROD (Coolify) |
|---|---|---|
| Arranque | `docker compose --env-file .env.dev up --build` | lo hace Coolify al recibir el webhook de `deploy.yml` |
| Ficheros | `docker-compose.yml` + `docker-compose.override.yml` (automático) | solo `docker-compose.prod.yml` (autónomo) |
| Imágenes | se construyen en local | las construye GitHub Actions y las publica en GHCR; el servidor no compila |
| Frontend | `vite dev` con HMR (`frontend:5173`) | estáticos Vite horneados en nginx (sin Node en prod) |
| Backend | `nest start --watch`, logs legibles | `node dist/main.js`, logs JSON |
| Puertos | `:6060` (nginx), `:5173` (vite), `:3001` (api), `:5432` (db), solo en loopback | ninguno: Traefik → `nginx:80` |
| PostgreSQL | `postgres:18-alpine`, volumen `pgdata18` | `postgres:18-alpine`, volumen `pgdata` |
| Variables | `.env.dev`, copiado de `.env.example` (ignorado por git) | las inyecta Coolify; ningún `.env` |
| CORS | localhost + dominio OrbStack | `SITE_URL` |

Ningún `.env` se versiona, salvo las plantillas `*.example`. El repo es
público: los valores de `.env.example` son de juguete y no se usan nunca fuera
de desarrollo. Ojo: `VITE_*` son **build-time**: cambiarlos exige reconstruir
la imagen.

## Despliegue en producción (Coolify)

Producción corre en un VPS de la plataforma de yitztech gestionado por
Coolify, con el mismo esquema que `yitztech/plantilla-cliente`:

1. **Publicar** (`.github/workflows/deploy.yml`, en cada push a `main` salvo
   cambios solo en `apps/mobile/**`, `docs/**` o `*.md`): construye
   `ghcr.io/yitztech/myschoolmyparents.online-backend` y `-nginx` con las
   etiquetas `main` y el SHA del commit. Las `VITE_*` van como build-args
   desde las *Variables* del repositorio (`VITE_AUTH_API_URL`, por defecto
   `/api`; `VITE_GOOGLE_CLIENT_ID`).
2. **Desplegar**: el job `desplegar` (entorno `production`, solo desde
   `main`) hace `POST` al webhook de Coolify, que descarga las imágenes y
   arranca `docker-compose.prod.yml`.
3. **Comprobar**: espera hasta que `SITE_URL/version.json` devuelva
   `{"revision":"<SHA del commit>"}`.

El compose de producción no lleva `build:`, `ports:` ni `container_name:`,
y todos los servicios tienen `mem_limit`. Solo `nginx` recibe tráfico (de
Traefik, que pone el dominio, el certificado y la redirección a HTTPS).

### Variables de la plataforma

Las pone Coolify; no van en el repo. Si hace falta otra, se pide a la
plataforma.

| Variable | Uso |
|---|---|
| `IMAGE_PREFIX`, `IMAGE_TAG` | imágenes de GHCR (`IMAGE_TAG` por defecto `main`) |
| `SITE_URL` | `CORS_ORIGIN` y `APP_PUBLIC_URL` del backend |
| `POSTGRES_PASSWORD`, `JWT_SECRET` | generados por la plataforma |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` | correo transaccional (465, TLS implícito) |
| `MAIL_FROM` | se mapea a `SMTP_FROM` |
| `TRUSTED_PROXY_CIDR` | subred de Traefik: nginx solo acepta `X-Forwarded-For` desde ahí |

Comprobación antes de pedir un despliegue, sin ningún `.env`:

```bash
IMAGE_PREFIX=ghcr.io/yitztech/myschoolmyparents.online SITE_URL=https://myschoolmyparents.online \
POSTGRES_PASSWORD=x JWT_SECRET=x SMTP_HOST=x SMTP_USER=x SMTP_PASSWORD=x MAIL_FROM=x \
TRUSTED_PROXY_CIDR=10.0.0.0/24 docker compose -f docker-compose.prod.yml config
```

### Cadena de proxies y la IP real

`X-Forwarded-For` lo puede escribir el cliente, así que hay que decidir de
quién fiarse. Hay dos saltos:

1. **nginx** solo acepta el `X-Forwarded-For` que llega desde
   `TRUSTED_PROXY_CIDR` (`set_real_ip_from`, la subred de Traefik), resuelve
   la IP real y **sobrescribe** la cabecera hacia el backend con esa IP: lo
   que el cliente haya inyectado no pasa.
2. **El backend** confía en los rangos de `TRUST_PROXY` (por defecto
   `loopback,linklocal,uniquelocal`, donde vive nginx) y toma la siguiente
   dirección: la del cliente.

Dos formas que **no** sirven en el backend, por si alguien las reintroduce:

- `trustProxy: true` toma el primer valor del XFF venga de donde venga, así
  que cualquiera falsea su IP y se salta el rate limit.
- `trustProxy: <número de saltos>` es lo que fastify **rechaza desde 5.12.1**
  (`unsupported trust argument`): ignoraba la dirección del par y era
  falseable igual (GHSA-3m5p-2c4r-xxw2). Por eso `package.json` fuerza
  `overrides.fastify` — el adapter de NestJS arrastraba un fastify anterior.

Si `TRUSTED_PROXY_CIDR` no coincide con la subred real de Traefik, todo el
mundo tendrá la IP de Traefik y el rate limit contará a todos como un
cliente. Comprobación tras desplegar: pedir con
`curl -H 'X-Forwarded-For: 1.2.3.4' https://.../api/...` y verificar en los
logs de pino que la IP registrada es la real, no `1.2.3.4` ni la de Traefik.

### Correo transaccional

La recuperación de contraseña envía el código por SMTP al servidor de correo
de la plataforma (`SMTP_HOST`, puerto 465 con TLS implícito). Con STARTTLS
(587, `SMTP_SECURE=false`) se usa `requireTLS`: aborta si el servidor no lo
ofrece, en vez de mandar las credenciales en claro.

**Solo transaccional.** Las campañas van por Listmonk, con otra identidad de
envío. Meter los códigos de recuperación por Listmonk sería un error:
necesita a cada destinatario dado de alta como *suscriptor* (mezcla la base de
personas y sus consentimientos), comparte reputación con los boletines, y
añade un salto extra en la ruta más crítica de la app.

### Forma de trabajo

- `main` solo cambia por PR con la aprobación de la plataforma; un push nuevo
  al PR anula la aprobación. Sin force push ni borrado de `main`.
- Cada persona entra con su propio usuario de GitHub; nada de cuentas
  compartidas.
- La plataforma se encarga de la app en Coolify, los secretos, el correo, el
  DNS, Listmonk, la analítica y las copias de PostgreSQL.

## Endurecimiento (dev y prod)

- **Sin root**: backend y frontend corren como usuario `node` (uid 1000);
  workers nginx como `nginx`. Capabilities recortadas (`cap_drop: ALL` +
  mínimas por servicio) y `no-new-privileges` en todos los contenedores.
- **Redes**: `public` (nginx/frontend/backend) y `db-net` **interna**
  (solo backend↔PostgreSQL). Nginx no resuelve ni alcanza la base de datos.
- **Prod con filesystem de solo lectura** (backend y nginx, con `tmpfs`
  en `/tmp` y cachés nginx). El OCR cachea el `.traineddata` en el tmp del
  sistema, no en `/app`.
- **Dev solo en loopback** (`127.0.0.1:6060/:5173/:3001/:5432`, nada a la LAN),
  código montado de solo lectura (`:ro`) y nginx tolerante a reinicios del
  `vite dev` (resolver Docker + upstreams por variable).
- **Límites en prod** (`mem_limit` en todos los servicios): backend 1G/2 CPU,
  db 768M/1 CPU, nginx 128M/0,5 CPU. Logs rotados (`10m × 3`) en ambos
  entornos. Imágenes pineadas (`node:24.21-alpine`, `nginx:1.31-alpine`,
  `postgres:18-alpine`) y
  `.dockerignore` por contexto (nada de `node_modules`, `dist` ni `.env`
  dentro de las imágenes).
- Nginx prod: `server_tokens off`, **HSTS**, **CSP** + `nosniff`/`SAMEORIGIN`/
  `Referrer-Policy`/`Permissions-Policy`/`COOP` (en `nginx/security-headers.conf`,
  incluido en cada `location` porque nginx solo hereda `add_header` si el
  bloque hijo no define ninguna), gzip y caché larga solo en `/assets/`
  (`index.html` nunca cacheado). `/api/health` devuelve 404 desde fuera: el
  healthcheck del contenedor va directo al backend.
- `POST /api/ocr` exige JWT. El token vive en `localStorage`, así que la CSP
  es la defensa principal contra un XSS que quiera robarlo.

- **Modelos de Tesseract horneados** en la imagen (`backend/Dockerfile`) y
  sembrados en el cache al arrancar (`OcrService.onModuleInit`). Sin esto, el
  primer OCR tras cada reinicio los bajaba de un CDN externo, porque el cache
  vive en un tmpfs. La variante es `4.0.0_best_int`, la misma que usa
  tesseract.js v7 por defecto: la `4.0.0` a secas añade el motor Legacy, que
  esta app no usa, y pesa seis veces más. Si la descarga falla en el build, la
  imagen se construye igual y se cae al comportamiento anterior.

## Uso

```bash
# DEV (hot-reload): entrada única http://localhost:6060
cp .env.example .env.dev    # la primera vez (.env.dev no se versiona)
docker compose --env-file .env.dev up --build
# PostgreSQL directo: localhost:5432 (msm / myschoolmyparents)
# API directa:        http://localhost:3001/api/health
```

**Al añadir una dependencia de npm**, en dev hace falta además
`--renew-anon-volumes`:

```bash
docker compose --env-file .env.dev up --build --renew-anon-volumes
```

El compose monta `/app/node_modules` como volumen anónimo para que el
bind-mount del código no tape los módulos de la imagen. Ese volumen
**sobrevive a los rebuilds**, así que sin renovarlo el contenedor sigue
usando los `node_modules` viejos y el paquete nuevo "no existe" aunque la
imagen sí lo traiga. No uses `down -v` para esto: borraría también `pgdata18`
con tus datos locales.

Variables de `.env.dev`: `POSTGRES_PASSWORD`, `JWT_SECRET`,
`JWT_EXPIRES_IN`, `CORS_ORIGIN`, `LOG_LEVEL`, `TRUST_PROXY`, `APP_PUBLIC_URL`,
`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`,
`SMTP_FROM`, `VITE_AUTH_API_URL`, `VITE_GOOGLE_CLIENT_ID`. La plantilla
comentada está en `.env.example`; las de producción, en *Variables de la
plataforma*.

Desarrollo sin Docker:

```bash
cd frontend && npm install && npm run dev      # :5173 (proxy /api → backend:3001)
cd backend && npm install && npm run start:dev # :3001 (necesita DATABASE_URL de PostgreSQL)
```

## Tests end-to-end (Playwright)

Suite `@playwright/test` en `e2e/`. **Es un paquete npm independiente a
propósito**: tiene su propio `package.json` y su `package-lock.json`, no toca
las dependencias de `backend/` ni de `frontend/`, y `.dockerignore` lo deja
fuera del contexto de build (el de producción es la raíz del repo), así que no
entra en ninguna imagen ni alarga los despliegues. La configuración tampoco
declara `webServer`: la suite no arranca ni para nada, solo apunta al stack
que ya esté levantado.

```bash
docker compose --env-file .env.dev up -d   # el stack debe estar arriba
cd e2e
npm install                                # solo la primera vez
npm run install-browsers                   # descarga Chromium
npm test
```

17 tests en tres bloques:

- **Flujo principal** (`tests/flujo.spec.ts`): crear un libro, subir la página
  de ejemplo, OCR en el backend, aprobar el borrador y verlo en el lector, sin
  errores de consola.
- **Interfaz** (`tests/auth.spec.ts`): registro, política de contraseña,
  cierre de sesión, login, credenciales incorrectas y el primer paso de la
  recuperación.
- **API** (`tests/api.spec.ts`, sin navegador): que el OCR exija sesión y
  rechace lo que no sea una imagen, que la recuperación responda igual exista
  o no la cuenta, y que el `ValidationPipe` rechace campos fuera del contrato.

Dentro de la interfaz, el bloque *Invariantes de seguridad* vigila los arreglos hechos antes
del despliegue: que el bundle no lleve el mock de localStorage, que la sesión
guarde un JWT del backend con su `tv` (tokenVersion) y no un token inventado,
que el botón de Google no se pinte, y que el código de recuperación no se
enseñe nunca en pantalla. Si alguien revierte `VITE_AUTH_API_URL=/api`, estos
fallan.

Otros comandos y variables: `npm run test:headed` para ver el navegador,
`npm run report` para el informe HTML, `E2E_BASE_URL` para apuntar a otro
entorno (por defecto `http://localhost:6060`).

Cada test que necesita cuenta crea una con correo único `e2e_…@example.com`.
Para limpiarlas de la base de datos de desarrollo:

```bash
docker compose --env-file .env.dev exec db \
  psql -U msm -d myschoolmyparents -c "DELETE FROM users WHERE email LIKE 'e2e_%@example.com';"
```

## Notas de paridad funcional

- Orden de páginas reservado **antes** del OCR (`orderKey`); subir/bajar renormaliza.
- Reprocesar conserva el texto anterior hasta aprobar el nuevo borrador.
- Página sin texto: recapturar / editar manual / excluir, sin bloquear el lote.
- Borrado en cascada cancela trabajos y detiene audio.
- Accesibilidad: targets ≥48px, regiones `status/alert`, foco lógico, texto lector 18–36pt, layout 1/2/3 cols, máx. 1100px.
