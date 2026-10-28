# language: es
@plataforma @solo-lectura
Característica: Superficie pública y superficie de la API sin cuenta

  Como visitante del sitio o integración externa
  Quiero que las páginas públicas y el contrato de la API respondan de forma estable
  Para que los enlaces externos, las tiendas y las apps funcionen igual en cualquier momento

  Escenario: Las páginas legales y de descargas responden sin iniciar sesión
    Dado que el usuario no ha iniciado sesión
    Cuando abre la página "/legal/privacidad"
    Entonces ve la página pública "Política de privacidad"
    Cuando abre la página "/legal/terminos"
    Entonces ve la página pública "Términos y condiciones de uso"
    Cuando abre la página "/legal/cookies"
    Entonces ve la página pública "Cookies y almacenamiento local"
    Cuando abre la página "/descargas"
    Entonces ve la página pública "Descarga"

  Escenario: El OCR exige sesión
    Cuando consulta la API "POST /api/ocr" sin sesión
    Entonces el código HTTP es 401

  Escenario: La API no da datos personales sin identificador
    Cuando consulta la API "GET /api/auth/me" sin sesión
    Entonces el código HTTP es 401

  Escenario: Una ruta inexistente de la API responde 404 y no 500
    Cuando consulta la API "GET /api/auth/ruta-inexistente" sin sesión
    Entonces el código HTTP es 404
