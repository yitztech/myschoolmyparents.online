# language: es
@movil @pendiente
Característica: Paridad de la app móvil (Android e iOS)

  Como familia que usa la app en el teléfono
  Quiero que la app haga lo mismo que la web
  Para poder cambiar de dispositivo sin aprender otra cosa

  # Los pasos se implementan con la interfaz `ui` común (§38 de la plataforma):
  # Playwright en el WebView de Android (Capacitor) y Appium (XCUITest/UiAutomator2)
  # en nativo e iOS. Mientras no existan, los escenarios llevan @pendiente.
  # Los que ya están probados en la web no se repiten aquí: solo la pieza de
  # plataforma móvil propia.

  @android
  Escenario: Registro y biblioteca dentro de la app de Android
    Cuando abro la app de Android
    Y navego a la pantalla de registro dentro de la app
    Y registro una cuenta nueva
    Y creo un libro con el título "Mascotas"
    Entonces el libro "Mascotas" aparece en la biblioteca de la app

  @android
  Escenario: OCR con la cámara del dispositivo
    Cuando abro la app de Android
    Y concede el permiso de cámara
    Y toma una foto de la página de ejemplo
    Y manda la foto a OCR
    Entonces el borrador muestra el texto "The cat is small"
    Y la app no muestra ningún error

  @ios
  Escenario: Lector con voz en el idioma del texto
    Cuando abro la app de iOS
    Y entra a la lectura "Mi libro de mascotas"
    Y pulsa Escuchar
    Entonces la voz habla en inglés
    Y el texto se resalta palabra a palabra

  @ios
  Escenario: La sesión sobrevive al cerrar y abrir la app
    Cuando abro la app de iOS
    Y registro una cuenta nueva
    Y cierra la app por completo
    Y vuelve a abrirla
    Entonces no pide de nuevo el correo y la contraseña
    Y sigue dentro de la app

  @android @ios
  Escenario: Enlaces legales desde «Acerca de»
    Cuando abro la app de Android
    Y entra a «Acerca de»
    Y pulsa el enlace de la política de privacidad
    Entonces se abre https://myschoolmyparents.online/legal/privacidad
