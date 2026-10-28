# Propuesta de diseño 2026-11 — «Del papel de la escuela a la voz de casa»

Estado: propuesta para revisión. No cambia código de producción; es la dirección
de referencia para las próximas iteraciones de web y apps. Basada en lo que ya
funciona del diseño actual (papel, tinta, gomísoles/«stickers», letras Fraunces
y Karla) y en los problemas concretos que hoy tiene la interfaz.

## 1. Diagnóstico (lo que mueve la propuesta)

| # | Observado hoy | Consecuencia |
|---|---|---|
| 1 | Dos «universos» visuales: la landing tiene identidad pizarra/papel fuerte, pero la biblioteca y el lector caen en listas de tarjetas genéricas (shadcn por defecto) | La sensación de cuaderno escolar se pierde justo en las pantallas donde el usuario vive |
| 2 | El estado vacío de la biblioteca es texto discreto; la carga solo un `role=status` olvidable | Parece «no funciona», sobre todo en el primer contacto tras registrar |
| 3 | El lector no deja claro dónde se lee: el foco visual de la párrafo en curso depende del resaltado de color únicamente | Con voz en marcha cuesta seguir la línea |
| 4 | Los botones principales cambian de color por pantalla (coral, sunny, leaf) sin una jerarquía constante | No es一眼 saber cuál es la acción principal |
| 5 | Las revistas/confirmaciones cambian de forma por pantalla (alert inline, sticker, region status) | Poco predecible para lector de pantalla y para quien mira |
| 6 | La web usa el switcher de idioma como menú escondido arriba a la derecha; apps móviles deciden idioma por el sistema | Paridad desígeda (§9.1 de la plataforma) |

## 2. Dirección: «Cuaderno vivo, con la voz a bordo»

La identidad ya existe y es buena: **papel (#FFFEF9), tinta (#262134), sol (#FFC52E), coral y hoja**,
borde grueso, sombra de sticker dura (6px 6px 0 ink) y tipografía Fraunces para
firmar la marca. La propuesta no la reemplaza: la APLICA de forma más sistemática.

### 2.1 Tokens del sistema (una sola fuente de verdad)

```css
:root {
  /* Superficies */
  --paper:        #FFFEF9; /* fondo                    */
  --paper-deep:   #FFF8EC; /* tarjetas y paneles       */
  --ink:          #262134; /* texto y bordes fuertes   */
  --ink-soft:     #6E6A7C; /* texto secundario (AA sobre papel) */

  /* Acentos: cada uno con SU papel único */
  --sun:          #FFC52E; /* PRIMARIO: crear, avanzar */
  --coral:        #FF7A59; /* FOCO DE CUENTA: entrar, danger */
  --coral-deep:   #C2452A; /* errores (AA sobre papel) */
  --leaf:         #3FA37C; /* ÉXITO y estados tranquilos (AA sobre papel) */
  --sky:          #7DBBE6; /* lenguas de aprendizaje (EN, DE…) */

  /* Lo que no cambia */
  --radius:       1rem;
  --border:       2px solid var(--ink);
  --shadow-sticker: 6px 6px 0 var(--ink);
  --shadow-sticker-sm: 3px 3px 0 var(--ink);
  --font-display: 'Fraunces', Georgia, serif;
  --font-body:    'Karla', system-ui, sans-serif;
  --space:        4px 8px 12px 16px 24px 32px 48px;
}
```

Reglas de acento (º una acción por pantalla la lleva el color):

- **Coral** = cuentas (entrar, crear cuenta, guardar cambios de perfil).
- **Sol** = contenido (crear libro, importar fotos, dar play).
- **Hoja** = confirmación y éxitos; nunca botón primario.
- Botón secundario: papel + borde tinta, siempre hover `bg-paper-deep`.

### 2.2 Biblioteca: la repisa

- Cada libro = **lomo de libro** (tarjeta vertical con título en Fraunces,
  franja superior del color del idioma de aprendizaje y esquina doblada).
  La marca del idioma sustituye al chip genérico «Se lee en EN».
- El libro en curso muestra una **cinta de progreso** (páginas aprobadas / total).
- El botón «Crear libro» vive en una **esquina de esquina doblada** (sticker sol),
  no en la barra superior: botón evaluable el punto de entrada de la app.
- Estado vacío = ilustración simple (lioteca SVG inline, no CDN) + la acción clara
  «Tájcae una foto», con el mismo sticker que la landing ya usa.

### 2.3 Lector: la línea por la que vas

- Barra fin competitors con: título, idioma de lectura, progreso de párrafo
  (p. ej. «3/9») y controles (48×48 mínimo).
- Párrafo en curso: fondo ** papel-deep + borde izquierdo sol de 4px**; la palabra
  activa usa subrayado coral de 3px (independiente del color de fondo, para el
  daltonismo y para se con texto solo).
- La parr properties controlan velocidad con un controlador visible y accesible
  (`@react-native-community/slider` ya está en la app: la web comparte el mismo
  diseño de control).
- Sin autoplay nunca (regula lo ya acordado); el botón de play cambia etiqueta
  («Escuchar tudo» / «Pausal») y mantiene el mismo tamaño para no mover el layout.

### 2.4 Formularios y mensajes: siempre exactamente IGUAL

1. **Petición:** limpiar.
2. **Petición a Bengals:** spinner dentro del botón + bot&#243;n disabled, sin cambiar el tama&#241;o.
3. **Error:** `role=alert` bajo el campo fuente al borde coral-deep, texto breve y acci&#243;n (&#171;Revisa la contrase&#241;a&#187;).
4. **&#201;xito:** sticker hoja con icono, siempre la misma forma.
5. **Recorte de pegado (&#167;6.3):** el aviso coral-deep de `AvisoRecorte` para tod`s los campos (`msg` de la plataforma) en la misma posici&#243;n (bajo el campo).

### 2.5 Movimiento

M&#225;ximo un movimiento por interacci&#243;n: el hover de sticker sube 2px,
el carrito del lomo se abre con 120 ms y fade. Cero bounces, cero parallax.
Todo respeta `prefers-reduced-motion` (ya es un requisito de la plataforma &#167;8).

### 2.6 M&#243;vil: paridad + 3 decisiones propias

- Los mismos tokens exportables a Expo (`tokens.mobile.ts`), tipograf&#237;as y colores idénticos.
- El switcher de idioma de la WEB desaparece de la primeriza: la web hereda el
  idioma de la ruta; la app usa el del sistema (ya lo hace) y es editable en
  &#171;Acerca de&#187;.
- El OCR en mano resotra deja el encuadre actiivo: rect&#225;ngulo de gu&#237;a + bot&#243;n
  de captura de 72px, barra de miniaturas ya capturadas para saber cu&#225;nto falta.
- La sincronizaci&#243;n con la nube se marca con un solo icono (nube) y su
  &#171;&#250;ltimo env&#237;o hace 4 minutos&#187;; sin detalles t&#233;cnicos en la primera vista.

## 3. Qué se cambia (roadmap corto)

| Fase | Cambio | Dónde | Riesgo |
|---|---|---|---|
| 1 (ya) | Aviso de recorte + maxLength en los campos de cuenta y t&#237;tulo | auth/*, Library | Sin riesgo |
| 2 | Tokens como CSS variables + botones con jerarqu&#237;a de acento | frontend/ui | Bajo: es estilos |
| 3 | Lomos de libro + estado vacío ilustrado + progreso del lote | Library.tsx | Medio |
| 4 | Lector: barra de progreso + subrayado de palabra | Reader.tsx | Medio (tuda a la voz) |
| 5 | P&#225;ginas legales y /descargas con el mismo lenguaje | legal/*, Descargas | Bajo |

## 4. Mockup

`docs/diseno/propuesta.html` es un mockup est&#225;tico e individuals (sin dependencias)
de las tres pantallas clave con la nueva dirección: biblioteca (desktop), lector
(m&#243;vil) y acceso. Se navega con las pesta&#241;as del fichero mismo.
