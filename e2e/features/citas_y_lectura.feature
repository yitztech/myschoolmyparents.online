# language: es
Característica: Gestión de citas escolares, libros y lectura bilingüe con voz

  Como estudiante o padre
  Quiero registrar citas y lecturas escolares
  Para escucharlas con voz en el idioma de aprendizaje y revisar su texto

  Escenario: Creación exitosa de una cita de lectura escolar
    Dado que el usuario tiene una sesión iniciada
    Cuando abre el diálogo para crear una nueva lectura
    Y escribe el título "Lectura de Ciencias Naturales"
    Y confirma la creación
    Entonces la nueva lectura debe aparecer en la biblioteca

  Escenario: Fracaso al crear cita o lectura escolar con título vacío
    Dado que el usuario tiene una sesión iniciada
    Cuando abre el diálogo para crear una nueva lectura
    Y escribe el título "   "
    Y confirma la creación
    Entonces el sistema debe asignar un título por defecto o advertir el error

  Escenario: Fracaso al crear cita escolar con título superior a 150 caracteres
    Dado que el usuario tiene una sesión iniciada
    Cuando abre el diálogo para crear una nueva lectura
    Y escribe un título de más de 150 caracteres
    Entonces el campo de título debe truncar o rechazar la entrada excedida

  Escenario: Reproducción de voz de los párrafos y citas
    Dado que el usuario está dentro de una lectura con contenido
    Cuando presiona el botón para escuchar la lectura
    Entonces el reproductor debe pasar al estado activo de lectura
