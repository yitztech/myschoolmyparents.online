import { A, Dato, H2, H3, LegalLayout, P, UL } from './LegalLayout';
import { APP_NAME, LEGAL } from '../../legal/site';

/**
 * Política de privacidad (BORRADOR). Cubre la web y las apps de Android e iOS.
 * Cada afirmación sobre datos debe corresponder al código: si cambia lo que
 * se guarda o a quién se envía, hay que cambiar esto también.
 */
export function Privacidad() {
  return (
    <LegalLayout slug="privacidad" title="Política de privacidad">
      <P>
        Esta política explica qué datos personales trata {APP_NAME} (la web <strong>myschoolmyparents.online</strong> y
        las apps para Android e iOS), para qué, durante cuánto tiempo y qué derechos tienes. Está escrita para que se
        entienda sin ser jurista: si algo no queda claro, escríbenos.
      </P>

      <H2>1. Responsable</H2>
      <UL>
        <li>Titular: <Dato value={LEGAL.titular} label="nombre o razón social" /></li>
        <li>Identificación fiscal: <Dato value={LEGAL.identificacionFiscal} label="NIF / RFC" /></li>
        <li>Domicilio: <Dato value={LEGAL.domicilio} label="domicilio" /></li>
        <li>Contacto de privacidad: <Dato value={LEGAL.correoPrivacidad} label="correo de privacidad" /></li>
      </UL>

      <H2>2. Lo esencial</H2>
      <UL>
        <li>Tus libros, fotos y textos <strong>se guardan solo en tu dispositivo</strong>; no los recibimos.</li>
        <li>Para tener cuenta pedimos <strong>nombre, correo y contraseña</strong> (o iniciar sesión con tu cuenta de Google). Las contraseñas se guardan cifradas (hash), nunca en claro.</li>
        <li>No vendemos datos, no mostramos publicidad y no usamos cookies de seguimiento.</li>
        <li>La analítica de la web es anónima y sin cookies.</li>
      </UL>

      <H2>3. Qué datos tratamos y para qué</H2>

      <H3>Cuenta</H3>
      <P>
        Nombre, correo electrónico y, si te registras con contraseña, su hash bcrypt. Si decides acceder con Google,
        recibimos de Google únicamente tu nombre, tu correo electrónico verificado y tu identificador de usuario (<code>sub</code>)
        para autenticarte. No accedemos a tu contraseña de Google, ni a tus contactos ni a ningún otro dato personal de Google.
        Sirven para crear la cuenta e iniciar sesión. La sesión dura 7 días como máximo y se cierra en todos los dispositivos si
        cambias la contraseña.
      </P>

      <H3>Recuperación de contraseña</H3>
      <P>
        Si la pides, te enviamos al correo un código de 6 dígitos. Guardamos solo su hash, caduca a los 15 minutos y se
        anula tras varios intentos fallidos.
      </P>

      <H3>Fotos de páginas (web)</H3>
      <P>
        En la web, las fotos que subes se envían a nuestro servidor solo para reconocer el texto (OCR). Se procesan en
        memoria y <strong>no se guardan</strong>. Del proceso registramos únicamente el idioma, el número de caracteres
        y de párrafos y la fecha, sin relacionarlo con tu cuenta.
      </P>

      <H3>Fotos de páginas (apps)</H3>
      <P>
        En las apps el texto se reconoce en el propio teléfono (ML Kit de Google integrado en la app de Android, Apple
        Vision en iOS). Las fotos y los PDF que importas <strong>no salen del dispositivo</strong>. La app pide permiso
        de cámara y de fotos solo para esto.
      </P>

      <H3>Libros, textos y ajustes</H3>
      <P>
        Se guardan solo en tu dispositivo: en la web, en el almacenamiento del navegador (IndexedDB); en las apps, en una
        base de datos local. Nosotros no los recibimos. La sincronización en la nube todavía no está disponible; si se
        activa, actualizaremos esta política antes.
      </P>

      <H3>Lectura en voz alta</H3>
      <P>
        Usa la síntesis de voz del navegador o del sistema operativo. Algunos navegadores usan voces en la nube de su
        fabricante (por ejemplo, Google en Chrome): en ese caso, el texto que se lee lo procesa ese fabricante según su
        propia política.
      </P>

      <H3>Traducciones y definiciones (apps)</H3>
      <P>
        Cuando pides traducir o definir una palabra o una frase y no está en el diccionario incluido en la app, se envía
        <strong> solo ese texto</strong> a alguno de estos servicios: Google Translate, MyMemory (Translated srl),
        Wikipedia (Wikimedia Foundation) o Free Dictionary API (dictionaryapi.dev). No se envía tu cuenta ni ningún otro
        dato; esos servicios ven la dirección IP desde la que llega la consulta.
      </P>

      <H3>Registros técnicos del servidor</H3>
      <P>
        Para la seguridad (límites contra abusos y contra el robo de contraseñas) y para diagnosticar errores,
        registramos la dirección IP, la fecha y hora, la ruta pedida y, en los eventos de cuenta (alta, inicio de sesión,
        recuperación), el correo. Se conservan <Dato value={LEGAL.plazoRegistros} label="plazo de los registros" />.
      </P>

      <H3>Analítica de la web</H3>
      <P>
        Medimos visitas y descargas de la app con Umami, alojado por nuestro proveedor. No usa cookies, no guarda tu IP
        ni crea perfiles, y nunca recibe la parte de la dirección tras el «?», donde podría haber datos personales. Solo
        cuenta visitas en myschoolmyparents.online.
      </P>

      <H3>Descarga de las apps</H3>
      <P>
        Los instaladores se alojan en GitHub (GitHub, Inc.), que registra la descarga según su propia política de
        privacidad.
      </P>

      <H2>4. Base legal</H2>
      <UL>
        <li>Cuenta, recuperación, OCR y funcionamiento del servicio: la ejecución del servicio que solicitas.</li>
        <li>Registros técnicos y analítica anónima: nuestro interés legítimo en mantener el servicio seguro y saber cómo se usa.</li>
        <li>Permisos del dispositivo (cámara, fotos): tu consentimiento, que puedes retirar en los ajustes del sistema.</li>
      </UL>

      <H2>5. Con quién compartimos datos</H2>
      <P>
        Con nadie para fines propios. Solo intervienen, por cuenta nuestra, el proveedor que aloja el servidor y el correo
        transaccional (<Dato value={LEGAL.alojamiento} label="proveedor de alojamiento y país" />) y, cuando los usas,
        los servicios de terceros citados en el apartado 3. Algunos de ellos pueden estar fuera de tu país; en ese caso
        se aplican las garantías que exige la ley.
      </P>

      <H2>6. Cuánto tiempo</H2>
      <UL>
        <li>Datos de la cuenta: mientras exista la cuenta. Al eliminarla, se borran del servidor de inmediato.</li>
        <li>Códigos de recuperación: 15 minutos.</li>
        <li>Registros técnicos: <Dato value={LEGAL.plazoRegistros} label="plazo de los registros" />.</li>
        <li>Libros y fotos en tu dispositivo: hasta que los borres, desinstales la app o borres los datos del navegador.</li>
      </UL>

      <H2>7. Niñas, niños y adolescentes</H2>
      <P>
        {APP_NAME} está pensada para que madres, padres y tutores lean con sus hijos. Las cuentas son solo para personas
        mayores de edad; los menores usan la app acompañados. No recogemos a sabiendas datos de menores. Las páginas
        escolares que fotografías pueden contener nombres u otros datos: en las apps no salen del teléfono y en la web se
        procesan sin guardarse.
      </P>

      <H2>8. Tus derechos</H2>
      <P>
        Puedes pedir acceso a tus datos, su rectificación, su supresión (o cancelación), oponerte a su tratamiento,
        limitarlo y solicitar su portabilidad. Si resides en México, son tus derechos ARCO. Escríbenos a{' '}
        <Dato value={LEGAL.correoPrivacidad} label="correo de privacidad" /> desde el correo de tu cuenta. Puedes eliminar
        la cuenta tú mismo en <A href="/legal/eliminar-cuenta">Eliminar tu cuenta</A>. Si no quedas conforme con nuestra
        respuesta, puedes reclamar ante la autoridad de protección de datos de tu país.
      </P>

      <H2>9. Seguridad</H2>
      <P>
        Todo el tráfico va cifrado (HTTPS). Las contraseñas se guardan con bcrypt, las sesiones caducan, hay límites
        contra los intentos repetidos y el servidor aplica cabeceras de seguridad. En las apps, la sesión se guarda en el
        llavero del sistema (Keychain o Keystore).
      </P>

      <H2>10. Cambios</H2>
      <P>
        Si cambiamos esta política te lo indicaremos en la web y en la app, con la nueva fecha arriba. Si el cambio afecta
        a qué datos tratamos o con quién los compartimos, lo avisaremos antes de aplicarlo.
      </P>
    </LegalLayout>
  );
}
