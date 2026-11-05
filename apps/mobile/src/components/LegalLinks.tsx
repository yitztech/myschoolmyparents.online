import React from 'react';
import { Linking, View } from 'react-native';
import { AppText } from './ui';
import { LEGAL_URLS } from '../config';
import { useT } from '../context/AppContext';
import { colors } from '../theme';

const open = (url: string) => void Linking.openURL(url).catch(() => undefined);

/** Enlaces a los documentos legales de la web (se abren en el navegador). */
export function LegalLinks({ withDelete = false }: { withDelete?: boolean }) {
  const { t } = useT();
  const links: [string, string][] = [
    [t('auth.legalPrivacy'), LEGAL_URLS.privacidad],
    [t('auth.legalTerms'), LEGAL_URLS.terminos],
    ...(withDelete ? ([[t('auth.legalDeleteAccount'), LEGAL_URLS.eliminarCuenta]] as [string, string][]) : []),
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
  const { t } = useT();
  const TERMS = '\u0001';
  const PRIVACY = '\u0002';
  const parts = t('auth.acceptTerms', { terms: TERMS, privacy: PRIVACY }).split(/([\u0001\u0002])/);
  return (
    <AppText style={{ textAlign: 'center', fontSize: 12.5, color: colors.textSoft }}>
      {parts.map((part, i) => {
        if (part === TERMS) return <AppText key={i} accessibilityRole="link" onPress={() => open(LEGAL_URLS.terminos)} style={{ fontWeight: '700', textDecorationLine: 'underline' }}>{t('auth.legalTerms')}</AppText>;
        if (part === PRIVACY) return <AppText key={i} accessibilityRole="link" onPress={() => open(LEGAL_URLS.privacidad)} style={{ fontWeight: '700', textDecorationLine: 'underline' }}>{t('auth.legalPrivacyPolicy')}</AppText>;
        return part;
      })}
    </AppText>
  );
}
