# language: es
@limites @validación
Característica: Longitud máxima de los campos

  Como persona usuaria
  Quiero que ningún campo admita más de su longitud lógica
  Para que ningún texto sin límite rompa la interfaz ni la base de datos

  # §6.3: al pegar más texto del permitido se avisa del recorte, nunca en silencio.
  Esquema del escenario: Pegar más texto del permitido en <campo> guarda <máximo> y avisa
    Dado que el usuario está en la pantalla de registro
    Cuando pega 500 caracteres en el campo "<campo>"
    Entonces el campo "<campo>" queda con <máximo> caracteres
    Y avisa el recorte del texto pegado

    Ejemplos:
      | campo              | máximo |
      | Nombre             | 120    |
      | Correo electrónico | 180    |
      | Contraseña         | 128    |
