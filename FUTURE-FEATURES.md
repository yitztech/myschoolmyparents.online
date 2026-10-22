# Oportunidad de Negocio y Futuras Funcionalidades (`FUTURE-FEATURES.md`)

> Análisis estratégico de producto, monetización y hoja de ruta evolutiva para **MySchoolMyParents Online** (`myschoolmyparents.online`).

---

## 1. El dolor real que resuelve (y por qué no compite con Duolingo)

Como se define en [`docs/flutter-legacy/PROMPT.md`](docs/flutter-legacy/PROMPT.md), el producto ataca una frustración cotidiana y emocional: **padres que hablan el idioma $Y$ (ej. español) cuyos hijos estudian en colegios bilingües y llevan a casa libros físicos, guías o fotocopias en el idioma $X$ (ej. inglés)**.

- **El problema:** El niño aún está aprendiendo a leer y el padre no domina la pronunciación o el vocabulario del libro escolar. El padre se siente incapaz de ayudar en la tarea o termina pagando clases particulares solo para acompañar la lectura.
- **La diferencia clave:** Las apps de idiomas tradicionales usan contenido genérico prefabricado. **MySchoolMyParents convierte el libro físico real que el colegio pidió leer para mañana en un libro interactivo bilingüe** en segundos:
  1. Captura de foto o importación de PDF.
  2. Extracción de texto (OCR) y revisión/edición por página.
  3. Lectura guiada por libro completo, párrafo o palabra individual con resaltado tipo karaoke.
  4. Ficha didáctica con definición y traducción contextual.

---

## 2. Ventaja competitiva en la arquitectura actual: *Unit Economics* casi cero

La arquitectura actual permite ofrecer un **plan gratuito real sin quemar capital en servidores**:

- **Procesamiento en el borde (*Local-First*):**
  - **App móvil (`apps/mobile/`):** El OCR corre gratis en el dispositivo mediante `modules/msm-ocr` (ML Kit en Android y Apple Vision + PDFKit en iOS), los libros viven en SQLite local (`expo-sqlite`), la voz usa el motor nativo (`expo-speech`) y el diccionario/traductor resuelve primero en memoria local con lematización antes de consultar servicios en línea.
  - **Web (`apps/frontend/` + `apps/backend/`):** Los libros e imágenes se almacenan localmente en el navegador con IndexedDB (`Dexie`), la voz usa Web Speech API en el cliente y el OCR corre en el propio contenedor del backend con Tesseract pre-horneado (`apps/backend/src/ocr/ocr.service.ts`), sin pagar por página a APIs externas de visión.
- **Resultado financiero:** Un usuario gratuito cuesta prácticamente **$0 USD/mes** en infraestructura, lo que permite escalar la adquisición orgánica y mantener un margen bruto **>85%** en las conversiones a planes de pago.

---

## 3. Cinco vías de negocio y nuevas funcionalidades (*Future Features*)

### A. Motor Viral: «Compartir libro con el grupo de WhatsApp del salón» (Adquisición coste $0)
En cada salón de clases hay entre 20 y 35 familias leyendo **exactamente el mismo libro o guía fotocopiada** esa semana.

- **Base existente:** Exportación e importación de paquetes de libros en `apps/mobile/src/services/bookExportImport.ts`.
- **Funcionalidad futura:**
  - Permitir que un padre o profesor que ya fotografió, revisó y aprobó las páginas de una lectura genere un **enlace compartible** (`https://myschoolmyparents.online/compartir/<token>`) o código QR.
  - Al abrir el enlace desde el grupo de WhatsApp de padres del salón, las demás familias importan el libro ya revisado en un toque.
  - **Impacto:** 1 solo usuario hace el esfuerzo de escaneo y atrae orgánicamente a 20–30 familias del mismo colegio y segmento socioeconómico.

### B. Suscripción B2C Familiar (*Freemium* → *Plus* a $4.99–$7.99 USD/mes)
El plan gratuito permite capturar y leer localmente en un dispositivo. El pase a **Familiar / Plus** se apoya en tres funciones de alto valor percibido:

1. **Sincronización en la nube (Web ↔ Móvil ↔ Tablet):**
   - El padre toma las fotos con su móvil y el niño lee desde la tablet o el ordenador en casa.
   - *Estado técnico:* El cliente y el motor de sincronización ya están diseñados en `apps/mobile/src/sync/engine.ts` y `apps/mobile/src/sync/models.ts` (`/api/v1/sync/{push,pull}`).
2. **Voces Neurales / IA Ultra-Naturales:**
   - Las voces nativas del sistema operativo pueden sonar robóticas en ciertos dispositivos.
   - Ofrecer voces infantiles o de cuentacuentos nativos de alta naturalidad (generadas bajo demanda y cacheadas por hash de párrafo en el backend) es el principal gatillo de conversión para padres preocupados por la fonética (*phonics*).
3. **Mochila de Vocabulario (SRS) y Comprensión Lectora:**
   - Cada vez que el niño o el padre toca una palabra difícil y abre la ficha didáctica (`apps/mobile/src/services/dictionaryService.ts`), se identifica qué vocabulario real de su escuela necesita reforzar.
   - Guardar automáticamente esas palabras en una **Mochila de Vocabulario** con tarjetas de repaso (*flashcards* con audio y la frase original del libro) y pequeñas preguntas de comprensión al terminar el libro crea un hábito de uso diario.

### C. B2B2C con Colegios Bilingües (Licencia Escolar / «Colegio Conectado»)
En Latinoamérica y España los colegios privados y concertados bilingües compiten por demostrar nivel de inglés, pero sufren cuando las familias no pueden reforzar la lectura en casa.

- **Funcionalidad futura:**
  - Panel ligero para docentes donde el profesor sube el PDF o las fotos de la lectura semanal una sola vez (aprovechando `apps/mobile/src/services/pdfImport.ts`) y la asigna al grupo.
  - Los padres reciben el libro listo para escuchar y practicar en casa con sus hijos.
  - El docente visualiza métricas agregadas y sencillas: qué alumnos abrieron la lectura, cuánto tiempo escucharon/leyeron y qué palabras consultaron más en el salón (para repasarlas al día siguiente en clase).
- **Modelo comercial:** Licencia anual B2B2C ($1–$2 USD por alumno/mes incluido en la cuota escolar) o canal de distribución para convertir familias a cuentas Plus.

### D. Mercado Bidireccional en EE. UU. (Familias Hispanas ESL/ELL + *Dual Immersion*)
El modelo de datos distingue explícitamente `homeLocale` y `learningLocale` (`apps/frontend/src/lib/types.ts`), y el traductor opera en ambas direcciones (`apps/mobile/src/services/translationService.ts`). Esto habilita dos mercados de alto valor en Norteamérica:

1. **Familias hispanas en EE. UU. (ESL / ELL):**
   - Más de 5 millones de estudiantes *English Language Learners* en escuelas públicas tienen padres hispanohablantes.
   - Los distritos escolares disponen de fondos federales (**Title I y Title III — Family Engagement & Language Instruction**) destinados a herramientas que permitan a los padres involucrarse en la lectura en casa sin que el idioma sea una barrera.
2. **Familias angloparlantes en programas *Dual-Language Immersion*:**
   - Padres que hablan inglés en casa (`homeLocale: en-US`) pero inscriben a sus hijos en escuelas de inmersión en español (`learningLocale: es-MX` / `es-ES`) y necesitan apoyo para pronunciar y comprender los libros en español que sus hijos llevan a casa.

### E. Vertical de Accesibilidad (Dislexia, TDAH y Dificultades de Lectura)
El lector ya incorpora decisiones clave de accesibilidad: tipografía clara (`Nunito`), tamaño de fuente ajustable de 18 a 36 pt (`Book.fontSize`), control fino de velocidad (`speechRate` desde lectura lenta) y resaltado sincronizado palabra por palabra.

- **Funcionalidad futura:**
  - Modo específico para **lectura asistida / dislexia**: espaciado entre letras y líneas configurable, fondos de alto confort visual (sepia/crema suave), regla de lectura para no perder el renglón y lectura multisensorial.
  - Es un segmento donde padres y gabinetes psicopedagógicos tienen altísima disposición a pagar por convertir cualquier libro de texto físico en material accesible.

---

## 4. Hoja de ruta técnica sugerida (Prioridades de implementación)

1. **Fase 1 — Cierre de base y paridad Web/Móvil (Corto plazo):**
   - [ ] Implementar `/api/v1/sync/{push,pull}` y `/api/v1/user/data` en `apps/backend/src/` siguiendo el contrato ya definido en `apps/mobile/src/sync/models.ts`.
   - [ ] Portar el servicio de diccionario y traducción contextual (`dictionaryService.ts` y `translationService.ts`) al lector web (`apps/frontend/src/components/Reader.tsx`) para que al pulsar una palabra en la web también se muestre su significado y traducción bilingüe.
   - [ ] Completar los datos definitivos en `apps/frontend/src/legal/site.ts` y publicar en Google Play y App Store (complementando la descarga directa en `/descargas`).

2. **Fase 2 — Viralidad y Retención (Medio plazo):**
   - [ ] **Enlaces de libros compartibles:** Endpoint y vista web/app para compartir un libro ya procesado mediante enlace o código con otros padres del mismo curso.
   - [ ] **Mochila de Vocabulario (*Flashcards*):** Persistir las palabras consultadas por libro en SQLite/IndexedDB y añadir un modo de repaso rápido con voz.
   - [ ] **Práctica de pronunciación:** Usar reconocimiento de voz en el dispositivo para que el niño lea en voz alta una palabra o frase y reciba retroalimentación visual amigable.

3. **Fase 3 — Monetización Plus y Colegios (Largo plazo):**
   - [ ] Integración de suscripciones (Stripe en Web / RevenueCat en iOS y Android).
   - [ ] **Voces Neurales en la nube** con caché por párrafo en el backend para usuarios Plus.
   - [ ] **Modo Aula / Colegio:** Creación de códigos de clase para que un profesor publique la lectura de la semana y consulte el progreso de lectura del grupo.
