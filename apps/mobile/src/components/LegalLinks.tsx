import React from 'react';
import { Linking, View } from 'react-native';
import { AppText } from './ui';
import { LEGAL_URLS } from '../config';
import { colors } from '../theme';

const open = (url: string) => void Linking.openURL(url).catch(() => undefined);

/** Enlaces a los documentos legales de la web (se abren en el navegador). */
export function LegalLinks({ withDelete = false }: { withDelete?: boolean }) {
  const links: [string, string][] = [
    ['Privacidad', LEGAL_URLS.privacidad],
    ['Términos', LEGAL_URLS.terminos],
    ...(withDelete ? ([['Eliminar cuenta', LEGAL_URLS.eliminarCuenta]] as [string, string][]) : []),
  ];
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14 }}>
      {links.map(([label, url]) => (
        <AppText
          key={url}
          accessibilityRole="link"
          onPress={() => open(url)}
          style={{ fontSize: 12.5, fontWeight: '700', color: colors.textSoft, textDecorationLine: 'underline', paddingVertical: 6 }}
        >
          {label}
        </AppText>
      ))}
    </View>
  );
}

/** «Al crear la cuenta aceptas…» con enlaces, para el registro. */
export function AcceptTerms() {
  const link = (label: string, url: string) => (
    <AppText accessibilityRole="link" onPress={() => open(url)} style={{ fontWeight: '700', textDecorationLine: 'underline' }}>
      {label}
    </AppText>
  );
  return (
    <AppText style={{ textAlign: 'center', fontSize: 12.5, color: colors.textSoft }}>
      Al crear la cuenta aceptas los {link('Términos', LEGAL_URLS.terminos)} y la{' '}
      {link('Política de privacidad', LEGAL_URLS.privacidad)}.
    </AppText>
  );
}
