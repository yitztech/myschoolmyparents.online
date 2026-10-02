/**
 * Datos del titular y de las páginas legales, en un solo sitio.
 *
 * Los textos legales (src/components/legal/) son BORRADORES: mientras un dato
 * valga `null`, la página lo muestra como «[pendiente: …]» resaltado y arriba
 * aparece el aviso de borrador. Cuando un abogado los revise, se rellenan
 * aquí y se pone `borrador: false`.
 */
export const LEGAL = {
  borrador: true,
  /** Fecha de la última revisión de los textos (AAAA-MM-DD). */
  actualizado: '2026-10-02',
  /** Nombre o razón social de quien ofrece el servicio. */
  titular: null as string | null,
  /** NIF, RFC o el identificador fiscal que corresponda. */
  identificacionFiscal: null as string | null,
  domicilio: null as string | null,
  /** Buzón para privacidad y para pedir la eliminación de la cuenta. */
  correoPrivacidad: null as string | null,
  /** Buzón de contacto general. */
  correoContacto: null as string | null,
  /** País cuya ley rige los términos y tribunales competentes. */
  leyAplicable: null as string | null,
  /** Empresa que aloja el servidor y el correo transaccional, y dónde. */
  alojamiento: null as string | null,
  /** Cuánto se guardan los registros técnicos del servidor. */
  plazoRegistros: null as string | null,
  /** Plazo para atender una solicitud de eliminación por correo. */
  plazoEliminacion: null as string | null,
} as const;

export const SITE_URL = 'https://myschoolmyparents.online';
export const APP_NAME = 'MySchoolMyParents Online';

/** Repositorio público donde se publican los instaladores de la app. */
export const RELEASES_URL = 'https://github.com/yitztech/myschoolmyparents.online/releases';

export const LEGAL_PAGES = [
  { slug: 'privacidad', title: 'Política de privacidad' },
  { slug: 'terminos', title: 'Términos y condiciones de uso' },
  { slug: 'cookies', title: 'Cookies y almacenamiento local' },
  { slug: 'eliminar-cuenta', title: 'Eliminar tu cuenta' },
] as const;

export type LegalSlug = (typeof LEGAL_PAGES)[number]['slug'];

/** Versión de la app móvil que se ofrece para descargar (sale de apps/mobile/app.json al compilar). */
export const MOBILE_VERSION = __MOBILE_VERSION__;
