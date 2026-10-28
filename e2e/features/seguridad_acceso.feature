# language: es
@seguridad
Característica: Invariantes de seguridad de las cuentas

  Como persona usuaria
  Quiero que el acceso y la recuperación de contraseña respeten las reglas de seguridad acordadas
  Para que ni el token ni los códigos de recuperación queden expuestos

  Escenario: Las credenciales incorrectas no dejan entrar
    Dado que el usuario está en la pantalla de inicio
    Cuando completa el correo con "e2e_nadie@example.com"
    Y completa la contraseña con "ContrasenaIncorrecta1!"
    Y envía el formulario de inicio de sesión
    Entonces debe ver una alerta de credenciales incorrectas
    Y sigue en la pantalla de iniciar sesión

  Escenario: Una contraseña corta no crea la cuenta
    Dado que el usuario está en la pantalla de registro
    Y completa el nombre con "Familia Corta"
    Y completa un correo electrónico nuevo válido
    Y completa la contraseña con "corta"
    Y confirma la contraseña con "corta"
    Y envía el formulario de registro
    Entonces debe ver una alerta de validación en pantalla

  Escenario: La sesión guardada es un token del backend con tokenVersion
    Dado que el usuario tiene una sesión iniciada
    Entonces la sesión guardada es un token del backend con tokenVersion

  Escenario: Pedir el código de recuperación no revela si la cuenta existe
    Dado que el usuario está en la pantalla de inicio
    Cuando navega a la recuperación de contraseña
    Y completa el correo con "e2e_cuenta-inexistente@example.com"
    Y solicita el código de recuperación
    Entonces llega al paso del código sin revelar si la cuenta existe

  Escenario: Con una cuenta real el correo también llega al paso del código
    Dado que el usuario tiene una sesión iniciada con contraseña conocida
    Cuando cierra la sesión
    Y navega a la recuperación de contraseña
    Y completa el correo con el de la sesión
    Y solicita el código de recuperación
    Entonces llega al paso del código sin revelar si la cuenta existe

  Escenario: Sin Google configurado no se pinta el botón de Google
    Dado que el usuario está en la pantalla de inicio
    Entonces no existe el botón "Continuar con Google"
    Cuando navega a la pantalla de registro
    Entonces no existe el botón "Continuar con Google"
