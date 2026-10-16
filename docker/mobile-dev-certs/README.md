# Docker de Certificados de Desarrollo para Apps Móviles

Este contenedor Docker de solo desarrollo permite generar de manera aislada y reproducible:
1. **Keystore de desarrollo Android** (`release.keystore` y `signing.json`): necesario para compilar y firmar la app Android localmente sin necesidad de tener Java JDK 17 o `keytool` instalados en el sistema anfitrión.
2. **Certificados TLS/SSL de desarrollo** (`dev-mobile-server.crt` y `dev-mobile-server.key`): para que dispositivos físicos o emuladores (Android `10.0.2.2`, iOS Simulator `localhost`) puedan comunicarse por HTTPS seguro con el backend local sin errores de certificados.

## Uso

Desde la raíz del proyecto:
```bash
npm run mobile:dev-certs
```

O directamente con Docker Compose:
```bash
docker compose -f docker/mobile-dev-certs/docker-compose.yml up --build
```

Los artefactos generados se guardarán en `docker/mobile-dev-certs/certs/`.
