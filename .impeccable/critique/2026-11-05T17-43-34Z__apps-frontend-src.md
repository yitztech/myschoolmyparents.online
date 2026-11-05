---
target: web (apps/frontend/src)
total_score: 32
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 4
target_identity: "file:/Users/user/Projects/WORK/myschoolmyparents.online/apps/frontend/src"
timestamp: 2026-11-05T17-43-34Z
slug: apps-frontend-src
---
# Crítica de diseño v1 — Web (`apps/frontend/src`)

Method: dual-agent (A: ses_e534374ceffdywKFuWCs72qTJv · B: ses_e534374cdffe3Mr4BdDvEQJBk7)

## Design Health Score: 32/40 (Good)

| # | Heurística | P | Tema clave |
|---|---|---|---|
| 1 | Estado del sistema | 3 | Progreso por foto/cola ✓; OCR sin ETA ni preview incremental |
| 2 | Mundo real | 3 | «Se lee en en-US/es-MX» crudos y «91 letras» siendo caracteres (BookDetail.tsx:39-41; langLabel ya existe en Library.tsx:26) |
| 3 | Control y libertad | 3 | Confirmaciones ✓; ficha de palabra sin Escape/clic-fuera; pág. sin confirmar |
| 4 | Consistencia | 3 | Doble control del tamaño de letra (Reader.tsx:271-290); «Backup» literal vs «Sincronizar» |
| 5 | Prevención de errores | 3.5 | §6.3 en pegado, checklist de contraseña, aria-invalid; outlier: Eliminar página |
| 6 | Reconocimiento | 3.5 | Empty state enseña «Usar ejemplo»; ayuda de atajos a demanda (AccessibilityToolbar.tsx:127) |
| 7 | Flexibilidad | 3.5 | J/K/R/± y docs; Espacio robado a los botones; sin búsqueda |
| 8 | Estético/minimalista | 3.5 | Landing y lector limpios; BookDetail apila 6 bloques y duplica controles |
| 9 | Recuperar errores | 3 | OCR editable/reprocesable ✓; «error de red» en texto de máquina (Library.tsx:92-93) |
| 10 | Ayuda y docs | 3 | Atajos y SHA-256 en descargas; no explica Reprocesar vs Excluir |

## Veredicto de especificidad
No intercambiable (4/5): voz de producto en cada bloque («Mi biblioteca suena», «Nada entra al libro hasta que pulses Añadir al libro»), Fraunces+Karla, marcador, stickers, offsets. Fuga: botón default con sombra amarilla #FFC52E (ui/button.tsx) contra la tinta del sistema.

## Escan determinista
CLI sobre markup: exit 0, 0 hallazgos (sano genuino validado a probe plantada que disparo 2 reglas). En .tsx corre solo regex — reglas de estilos computados no podem (subestimación). Overlay con detect.js de 5 estados: login 6, registro 8, biblioteca 5, /descargas 8, /legal/terminos 10. Reales: low-contrast placeholders 2.8:1 (#9d99a7/#FFFEF9) y CTA #fff/#ff4d1c 3.3:1; line-length legales ~87–92; nested-cards en Términos. Falsos positives documentados (estética deliberada): hard-offset-shadow, cream-palette, bounce-easing, hero-eyebrow-chip. Convergencia: el detector cazó contrastes y line-length; A, i18n y teclado. Overlays corrieron en sesión headless Playwright (no visible para el humano); capturas/JSONs en <tmp>/opencode/b-web/.

## What's Working
1. La honestidad como textura (ReviewCards.tsx:41-49): borrador con foto, «Nada entra…», no evita flexo de confianza real.
2. Onboarding concreto y adulto (Library.tsx:233-269): «Empieza aquí», un CTA, «Usar ejemplo» para probar sin libro.
3. A11y infraestructural: skip-link, focus 3px con pausa HC, goals 44–48px, §6.3 en runtime.

## Prioridad
- P0: Modo Enfoque/HC oscuro deja el párrafo invisible (blanco sobre blanco); extends que el observer de `index.css:267-320` no incluyen Card ni el contenedor de `Reader.tsx:313` (bg-white plano). → /impeccable harden
- P1: Espacio no activa botones del lector (keydown Reader.tsx:135-144):mantar target.closest a la set de exclusión. → /impeccable harden
- P1: Ficha de palabra sin Escape/restore de foco (Reader.tsx:447-452): usar Radix Dialog o handlers. → /impeccable harden
- P1: Diccionario casual placeholder: la plantilla «SIGNIFICADO…» cuando no hay datos (dictionary.ts:162); estado honesto + CTA a glosario. → /impeccable clarify
- P1: Copy «Todo se queda en este aparato…» (Library.tsx:245-246) es contracima del botó Workvs. Sincronizar y de libros solo en IndexedDB. Alinear copy + estados de sync visibles. → /impeccable clarify

## Red flags personas
- Sam: Espacio muerto en botones; ficha atrapada; aria-label por palabra descriptivo x19 hace insoportable el SR (Reader.tsx:566); tarjeta role=button anida botón ⋮ (árbol a11y inválido).
- Alex: sin atajos de libro/búsqueda; biblioteca no sobrevive al dispositivo; sync de pull/push manual para gestión tras haber leído la promesa local.
- Casey (390px): 3 botones de mantenimiento ocupan dos filas antes del CTA primario «Crear libro».
- Jordan: hero de landing promete interacción que no existe (LandingPage.tsx:80-89, mock estático).

## Observaciones menores
- Deuda i18n (§9.1): literales fijos en español en validators.ts (catalogo entero), auth screens, Reader (~20 puntos), VoiceSettings (sección), ReviewCards, PagesList, BookDetail, CaptureDialog, Library, AccessibilityToolbar, LandingPage aria, Descargas, ui/badge statusLabel, speech.ts:94. Paridad 5 idiomas en crítico.
- Crop/rotación GLOBALS vs chips por-foto (CaptureDialog.tsx:118-120) — modelo mental roto (P2).
- Eliminar página sin confirmación (PagesList.tsx:123) (P2). CTA #fff/#ff4d1c 3.3:1 y placeholders 2.8:1 (P2).
- Menú ⋮ sin Escape/clic-fuera (P3); sombra amarilla botón default (P3); chip mock técnico.

## Preguntas provocadoras
1. Cuando lookupWord no sabe una palabra, ¿por qué la app finge saberla en vez de convertir el miss en glosario familiar?
2. ¿Cuál es el control de tamaño de letra de verdad — toolbar o barra sun? Uno sobra o uno miente.
3. ¿Qué le dices a la familia que leyó «todo se queda en este aparato» antes de perder su biblioteca?
