# language: es
Característica: Registro de usuarios y validaciones de campos

  Como padre o educador
  Quiero registrar una cuenta con mis datos
  Para gestionar los libros y citas de lectura escolar de mi familia

  Escenario: Registro exitoso con datos válidos
    Dado que el usuario está en la pantalla de inicio
    Cuando navega a la pantalla de registro
    Y completa el nombre con "María José García"
    Y completa un correo electrónico nuevo válido
    Y completa la contraseña con "ContrasenaSegura2026!"
    Y confirma la contraseña con "ContrasenaSegura2026!"
    Y envía el formulario de registro
    Entonces debe ingresar exitosamente a "Mi biblioteca"

  Escenario: Fracaso al registrar con nombre menor a 2 caracteres
    Dado que el usuario está en la pantalla de inicio
    Cuando navega a la pantalla de registro
    Y completa el nombre con "M"
    Y completa un correo electrónico nuevo válido
    Y completa la contraseña con "ContrasenaSegura2026!"
    Y confirma la contraseña con "ContrasenaSegura2026!"
    Y envía el formulario de registro
    Entonces debe ver una alerta de validación en pantalla

  Escenario: Fracaso al registrar con nombre mayor a 120 caracteres
    Dado que el usuario está en la pantalla de inicio
    Cuando navega a la pantalla de registro
    Y completa el nombre con 121 caracteres
    Y completa un correo electrónico nuevo válido
    Y completa la contraseña con "ContrasenaSegura2026!"
    Y confirma la contraseña con "ContrasenaSegura2026!"
    Y envía el formulario de registro
    Entonces debe ver una alerta de validación en pantalla

  Escenario: Fracaso al registrar con nombre con números o caracteres inválidos
    Dado que el usuario está en la pantalla de inicio
    Cuando navega a la pantalla de registro
    Y completa el nombre con "Maria123"
    Y completa un correo electrónico nuevo válido
    Y completa la contraseña con "ContrasenaSegura2026!"
    Y confirma la contraseña con "ContrasenaSegura2026!"
    Y envía el formulario de registro
    Entonces debe ver una alerta de validación en pantalla

  Escenario: Fracaso al registrar con correo electrónico inválido
    Dado que el usuario está en la pantalla de inicio
    Cuando navega a la pantalla de registro
    Y completa el nombre con "Carlos Ruiz"
    Y completa el correo con "correo-no-valido"
    Y completa la contraseña con "ContrasenaSegura2026!"
    Y confirma la contraseña con "ContrasenaSegura2026!"
    Y envía el formulario de registro
    Entonces debe ver una alerta de validación en pantalla

  Escenario: Fracaso al registrar con contraseña débil
    Dado que el usuario está en la pantalla de inicio
    Cuando navega a la pantalla de registro
    Y completa el nombre con "Carlos Ruiz"
    Y completa un correo electrónico nuevo válido
    Y completa la contraseña con "corta"
    Y confirma la contraseña con "corta"
    Y envía el formulario de registro
    Entonces debe ver una alerta de validación en pantalla

  Escenario: Fracaso al registrar cuando las contraseñas no coinciden
    Dado que el usuario está en la pantalla de inicio
    Cuando navega a la pantalla de registro
    Y completa el nombre con "Carlos Ruiz"
    Y completa un correo electrónico nuevo válido
    Y completa la contraseña con "ContrasenaSegura2026!"
    Y confirma la contraseña con "OtraContrasenaDiferente1!"
    Y envía el formulario de registro
    Entonces debe ver una alerta de validación en pantalla
