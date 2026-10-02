import { A, Dato, H2, LegalLayout, P, UL } from './LegalLayout';
import { APP_NAME, LEGAL } from '../../legal/site';

/** Términos y condiciones de uso (BORRADOR) de la web y las apps. */
export function Terminos() {
  return (
    <LegalLayout slug="terminos" title="Términos y condiciones de uso">
      <H2>1. Quién ofrece el servicio</H2>
      <P>
        {APP_NAME} lo ofrece <Dato value={LEGAL.titular} label="nombre o razón social" /> (
        <Dato value={LEGAL.identificacionFiscal} label="NIF / RFC" />), con domicilio en{' '}
        <Dato value={LEGAL.domicilio} label="domicilio" /> y correo de contacto{' '}
        <Dato value={LEGAL.correoContacto} label="correo de contacto" />. Al crear una cuenta o usar la web o las apps
        aceptas estos términos. Si no estás de acuerdo, no uses el servicio.
      </P>

      <H2>2. El servicio</H2>
      <P>
        {APP_NAME} convierte fotos de páginas impresas (por ejemplo, lecturas escolares) en texto que se puede revisar y
        escuchar en voz alta, con ayudas de traducción, para practicar la lectura en familia. Hoy es gratuito. Está en
        desarrollo activo: puede cambiar, tener errores o dejar de estar disponible temporalmente.
      </P>

      <H2>3. Tu cuenta</H2>
      <UL>
        <li>Para crear una cuenta tienes que ser mayor de edad. Los menores usan el servicio con una persona adulta responsable.</li>
        <li>Los datos que nos das deben ser verdaderos, y tienes que cuidar tu contraseña. Avísanos si crees que alguien entró en tu cuenta.</li>
        <li>En las apps puedes usar el modo invitado sin cuenta: todo queda en el teléfono.</li>
        <li>Puedes eliminar tu cuenta cuando quieras desde <A href="/legal/eliminar-cuenta">Eliminar tu cuenta</A>.</li>
      </UL>

      <H2>4. Uso aceptable</H2>
      <P>Úsalo para fines personales, familiares y educativos. No está permitido:</P>
      <UL>
        <li>intentar acceder a cuentas o datos ajenos, o saltarse las medidas de seguridad o los límites de uso;</li>
        <li>usar el servicio de forma automatizada o masiva, o de una manera que perjudique su funcionamiento;</li>
        <li>subir contenido ilegal o que vulnere derechos de terceros.</li>
      </UL>
      <P>Podemos suspender una cuenta que incumpla estas normas, avisándote cuando sea posible.</P>

      <H2>5. Tu contenido</H2>
      <P>
        Las fotos y los textos son tuyos, y eres responsable de tener derecho a usarlos. Pensamos en materiales escolares
        para uso privado en casa. No adquirimos ningún derecho sobre ellos: en la web se procesan para reconocer el texto
        y no se guardan; en las apps no salen de tu dispositivo (ver la <A href="/legal/privacidad">Política de privacidad</A>).
      </P>

      <H2>6. Exactitud</H2>
      <P>
        El reconocimiento de texto, las traducciones, las definiciones y la voz son automáticos y pueden equivocarse.
        Revisa el texto antes de añadirlo al libro. El servicio ayuda a practicar la lectura; no sustituye a la escuela
        ni al criterio de madres, padres y docentes.
      </P>

      <H2>7. Apps instaladas fuera de las tiendas</H2>
      <P>
        Mientras las apps no estén en Google Play y App Store, ofrecemos instaladores para usuarios avanzados en{' '}
        <A href="/descargas">Descargas</A>. El de Android está firmado por nosotros; el de iOS va sin firmar y hay que
        firmarlo con herramientas de terceros. Instalar apps fuera de las tiendas es bajo tu responsabilidad: descárgalas
        solo desde nuestra web y comprueba la huella SHA-256 que publicamos con cada versión.
      </P>

      <H2>8. Propiedad intelectual</H2>
      <P>
        El software, el diseño, el nombre y los logotipos de {APP_NAME} pertenecen a su titular o a sus licenciantes. No
        puedes copiarlos ni redistribuirlos fuera de lo que permite la ley o una licencia expresa.
      </P>

      <H2>9. Responsabilidad</H2>
      <P>
        Ofrecemos el servicio con diligencia, pero tal cual y sin garantías de que funcione sin interrupciones ni errores.
        En la medida en que la ley lo permita, no respondemos de daños indirectos ni de la pérdida de datos guardados en tu
        dispositivo (en las apps puedes hacer copias exportando tus libros). Nada de esto limita los derechos que te reconozca la ley de
        consumidores aplicable.
      </P>

      <H2>10. Cambios en los términos</H2>
      <P>
        Si los cambiamos, publicaremos la nueva versión con su fecha y, si el cambio es importante, te avisaremos en la
        web o en la app antes de que se aplique.
      </P>

      <H2>11. Ley aplicable</H2>
      <P>
        Estos términos se rigen por las leyes de <Dato value={LEGAL.leyAplicable} label="país y tribunales competentes" />,
        sin perjuicio de las normas de protección de consumidores de tu país de residencia que no puedan excluirse.
      </P>
    </LegalLayout>
  );
}
