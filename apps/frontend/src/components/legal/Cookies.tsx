import { A, H2, LegalLayout, P } from './LegalLayout';

/** Cookies y almacenamiento local (BORRADOR). */
export function Cookies() {
  return (
    <LegalLayout slug="cookies" title="Cookies y almacenamiento local">
      <P>
        <strong>La web no usa cookies</strong>, ni propias ni de terceros. Por eso no verás un aviso para aceptarlas.
      </P>

      <H2>Lo que sí guardamos en tu navegador</H2>
      <P>
        Lo imprescindible para que la app funcione. No se usa para seguirte ni se comparte con nadie:
      </P>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-ink">
              <th className="py-2 pr-4 font-black">Qué</th>
              <th className="py-2 pr-4 font-black">Dónde</th>
              <th className="py-2 pr-4 font-black">Para qué</th>
              <th className="py-2 font-black">Cuánto dura</th>
            </tr>
          </thead>
          <tbody className="font-medium">
            <tr className="border-b border-ink/20">
              <td className="py-2 pr-4"><code>msm_session</code></td>
              <td className="py-2 pr-4">localStorage</td>
              <td className="py-2 pr-4">Mantener tu sesión iniciada</td>
              <td className="py-2">7 días, o hasta que cierres sesión</td>
            </tr>
            <tr className="border-b border-ink/20">
              <td className="py-2 pr-4">Biblioteca</td>
              <td className="py-2 pr-4">IndexedDB</td>
              <td className="py-2 pr-4">Tus libros, fotos, textos y ajustes de lectura</td>
              <td className="py-2">Hasta que los borres</td>
            </tr>
          </tbody>
        </table>
      </div>

      <H2>Analítica sin cookies</H2>
      <P>
        Para contar visitas usamos Umami, que no usa cookies ni identificadores persistentes y no guarda tu dirección IP.
        Las fuentes tipográficas se sirven desde nuestro propio dominio, sin pasar por terceros.
      </P>

      <H2>En las apps</H2>
      <P>
        La sesión se guarda en el llavero del sistema (Keychain en iOS, Keystore en Android) y los libros, en una base de
        datos local del teléfono. Desinstalar la app los borra.
      </P>

      <H2>Cómo borrarlo</H2>
      <P>
        Cierra sesión para borrar <code>msm_session</code>. Para borrar también la biblioteca, elimina los datos del sitio
        myschoolmyparents.online desde los ajustes de tu navegador. Más detalles en la{' '}
        <A href="/legal/privacidad">Política de privacidad</A>.
      </P>
    </LegalLayout>
  );
}
