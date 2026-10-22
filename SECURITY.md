# Política de Seguridad — MySchoolMyParents Online

## Compromiso con la Seguridad y Privacidad

MySchoolMyParents Online es una plataforma educativa diseñada para el aprendizaje familiar. La privacidad de las lecturas, tareas escolares y datos de niños y familias es nuestra prioridad absoluta.

### Invariantes de Seguridad y Privacidad

1. **Procesamiento de Imágenes y Datos Personales:**
   - En la aplicación móvil, el OCR y el sintetizador de voz operan en el dispositivo sin enviar imágenes a servidores externos.
   - En la web, el lienzo HTML5 elimina automáticamente metadatos EXIF y coordenadas GPS de las fotos antes de cualquier procesamiento.
   - El backend procesa las imágenes de OCR en memoria (`Buffer`) y no almacena fotos en disco en producción.
2. **Autenticación y Credenciales:**
   - Las contraseñas se almacenan mediante `bcrypt` con 12 rondas de hashing.
   - La recuperación de contraseña utiliza números pseudoaleatorios criptográficos (`crypto.randomInt`) con caducidad estricta y protección contra ataques de fuerza bruta (10 intentos/hora).
   - Los tokens JWT incorporan `tokenVersion` (`tv`), invalidando sesiones activas al cambiar contraseñas.
3. **Contenedores y Red:**
   - Todos los contenedores corren como usuarios sin privilegios (no-root).
   - En producción, el backend y el proxy nginx operan sobre un sistema de archivos de solo lectura (`read_only: true`) con capacidades Linux eliminadas (`cap_drop: ALL`).
   - La red de la base de datos es interna y aislada de nginx y del acceso exterior.

## Notificación de Vulnerabilidades

Si descubres una posible vulnerabilidad de seguridad en esta plataforma:

1. **No abras un issue público en GitHub.**
2. Envía un correo con los detalles técnicos a: `seguridad@myschoolmyparents.online` (o al buzón de seguridad indicado en la plataforma).
3. Incluye:
   - Pasos detallados para reproducir el problema.
   - Componentes o versiones afectadas.
   - Impacto estimado.

Responderemos a los reportes en un plazo máximo de 48 horas laborables.
