# language: es
Característica: Cancelaciones del sistema y eliminación de cuentas

  Como usuario de MySchoolMyParents
  Quiero poder cancelar acciones y eliminar mi cuenta definitivamente
  Para tener control total de mi información y privacidad

  Escenario: Cancelación exitosa de cuenta con contraseña correcta
    Dado que el usuario tiene una sesión iniciada con contraseña conocida
    Cuando navega a la página de eliminación de cuenta
    Y escribe su contraseña correcta para confirmar la cancelación
    Y confirma la eliminación definitiva
    Entonces la cuenta debe ser eliminada y el usuario redirigido al estado de cuenta eliminada

  Escenario: Fracaso al cancelar cuenta con contraseña incorrecta
    Dado que el usuario tiene una sesión iniciada con contraseña conocida
    Cuando navega a la página de eliminación de cuenta
    Y escribe una contraseña incorrecta para confirmar la cancelación
    Y confirma la eliminación definitiva
    Entonces el sistema debe mostrar una alerta de error y conservar la cuenta activa

  Escenario: Cancelación del diálogo de creación de lectura
    Dado que el usuario tiene una sesión iniciada
    Cuando abre el diálogo para crear una nueva lectura
    Y escribe el título "Lectura que no se guardará"
    Y presiona el botón Cancelar del diálogo
    Entonces el diálogo debe cerrarse sin añadir el libro
