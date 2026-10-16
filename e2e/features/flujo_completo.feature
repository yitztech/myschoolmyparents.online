# language: es
Característica: Flujo integral de punta a punta del sistema

  Como padre o madre de familia
  Quiero realizar el recorrido completo: registro, creación de libro, revisión y cancelación
  Para verificar que todas las piezas del sistema funcionen integradas

  Escenario: Flujo completo de punta a punta
    Dado que el usuario inicia en la pantalla principal
    Cuando completa el registro con una nueva cuenta
    Y crea un libro titulado "El Principito"
    Y añade páginas y revisa el borrador
    Y regresa a la biblioteca
    Y navega a eliminar su cuenta para cancelarla
    Entonces el sistema completa el ciclo y cierra la sesión
