# MySchoolMyParents Online — Versión Web

> Producción: https://myschoolmyparents.online

Réplica web de la app MyParentMyChildren (Flutter) con **React + shadcn + Docker Compose**.

- Interfaz en español; contenido y voz en el idioma que se aprende (nunca voz ES para texto EN).
- 100% local en frontend: **IndexedDB** (Dexie) con las 5 entidades + blobs de imagen.
- **OCR** vía backend `POST /api/ocr` (Tesseract `eng+spa`) — contrato `recognize → { rawText, paragraphs }`.
- **Voz** con Web Speech API: máquina `idle→preparing→speaking↔paused→completed`, offsets UTF-16, resaltado por palabra solo con `boundary` fiable + fallback a inicio de frase, `lastParagraph/lastOffset` por libro, sin autoplay.
- **Cámara**: `<input type=file capture>` + múltiple; recorte centrado 65–100% y rotación ±90° con canvas.
- Cola OCR de 1 en 1, persistente (`processing→queued` al reabrir), 3 reintentos con backoff, aprobación transaccional por página.

## Estructura

```
web/
  docker-compose.yml        # compose `my-school-my-parents`: db + backend + frontend + nginx (:6060)
  frontend/                 # React 19 + Vite + Tailwind v4 + shadcn (vendored) + Dexie (+ Dockerfile: build + vite preview :4173)
    src/lib/                # types, db, ocr, queue, speech, images, auth, password, auth-context
    src/components/         # Library, BookDetail, Reader, ReviewCards, PagesList, CaptureDialog, VoiceSettings, auth/*, ui/*
  nginx/                    # puerta de entrada: / -> frontend:4173, /api/ -> backend:3001
  backend/                  # NestJS + TypeScript + Fastify (auth local JWT + OCR + health)
    src/auth/               # registro, login, recover/reset, guard JWT
    src/users/              # entidad User (PostgreSQL)
    src/ocr/                # Tesseract eng+spa; registra cada petición en ocr_requests
    src/health/             # GET /api/health { ok, db, uptime, version }
    src/migrations/         # esquema inicial (users, ocr_requests)
```

## Backend (NestJS + Fastify)

- **Auth solo local:** `POST /api/auth/register` y `/login` → `{ user, token }`
  (JWT 7d); `POST /api/auth/password/recover|reset` (código de 6 dígitos,
  15 min); `GET /api/auth/me` con `Authorization: Bearer`. Sin OAuth:
  `GET /api/auth/google` responde 501.
- **Seguridad:** helmet (cabeceras), CORS restringido (`CORS_ORIGIN`), rate-limit
  global 200 req/min + anti-fuerza-bruta en login (10 fallos/10 min → 429),
  validación estricta de DTOs (misma política de contraseña que el frontend),
  bcrypt (12 rondas), JWT firmado (`JWT_SECRET`), respuestas genéricas para no
  enumerar usuarios ni temporizar.
- **Observabilidad:** logs JSON con `nestjs-pino` (request-id, método, URL,
  estado, latencia; secretos redactados; pretty en desarrollo). Eventos:
  altas, logins ok/fallidos, resets, OCR. `GET /api/health` incluye estado de la BD.
- **BD:** PostgreSQL vía TypeORM; esquema por migraciones (`migrationsRun`).

```bash
# imprescindibles en producción
JWT_SECRET=$(openssl rand -base64 32) POSTGRES_PASSWORD=... docker compose up --build
```

## Cuentas: login, registro y recuperación

Interfaces en español con navegación `login ⇄ registro | login ⇄ recuperación → login`:

- **Login:** correo + contraseña (mostrar/ocultar), “Continuar con Google”, enlaces a registro y recuperación.
- **Registro:** nombre + correo + contraseña + confirmación. La contraseña exige
  mayúsculas, minúsculas, un número y un símbolo (mín. 8), con checklist en vivo
  y aviso si la confirmación no coincide. Incluye “Registrarse con Google”.
- **Recuperación:** paso 1 correo → paso 2 código de 6 dígitos + nueva contraseña
  (con confirmación) → “Ir a iniciar sesión”.

El backend de cuentas vive **en internet** y se configura con:

```bash
# frontend/.env (ver .env.example)
VITE_AUTH_API_URL=https://api.tudominio.com
```

Contrato REST esperado: `POST /auth/register`, `POST /auth/login`,
`GET /auth/google` (OAuth2 con redirección), `POST /auth/password/recover`
y `POST /auth/password/reset` (ver `src/lib/auth.ts`).

Si `VITE_AUTH_API_URL` está vacío, se usa un **mock local** (localStorage) para
probar las pantallas y movimientos sin backend. Con Docker:

```bash
VITE_AUTH_API_URL=https://api.tudominio.com docker compose up --build
```

## Uso

```bash
docker compose up --build
# entrada única:  http://localhost:6060  (nginx -> frontend + /api/ -> backend)
# PostgreSQL:     solo interno (db:5432, base myschoolmyparents, volumen pgdata)
```

Variables opcionales: `POSTGRES_PASSWORD`, `VITE_AUTH_API_URL`, `VITE_GOOGLE_CLIENT_ID`.

Desarrollo sin Docker:

```bash
cd frontend && npm install && npm run dev      # :5173 (proxy /api → backend:3001)
cd backend && npm install && npm run start:dev # :3001 (necesita DATABASE_URL de PostgreSQL)
```

## Notas de paridad funcional

- Orden de páginas reservado **antes** del OCR (`orderKey`); subir/bajar renormaliza.
- Reprocesar conserva el texto anterior hasta aprobar el nuevo borrador.
- Página sin texto: recapturar / editar manual / excluir, sin bloquear el lote.
- Borrado en cascada cancela trabajos y detiene audio.
- Accesibilidad: targets ≥48px, regiones `status/alert`, foco lógico, texto lector 18–36pt, layout 1/2/3 cols, máx. 1100px.
