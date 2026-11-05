import React from 'react';
import { Image, View } from 'react-native';
import { AppText, Button, Dialog, Icon } from './ui';
import { APP_NAME, displayVersion } from '../lib/appVersion';
import { colors } from '../theme';
import { useT } from '../context/AppContext';
import { LegalLinks } from './LegalLinks';

/** Modal «Acerca de la app»: logotipo, nombre, versión, descripción y estado de sincronización. */
export function AboutDialog({ visible, onClose, syncStatus }: { visible: boolean; onClose: () => void; syncStatus: string }) {
  const { t } = useT();
  return (
    <Dialog visible={visible} title={t('library.aboutTitle')} onClose={onClose} actions={<Button label={t('close')} variant="text" onPress={onClose} />}>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Image source={require('../../assets/branding/my_school_my_parents_logo.png')} style={{ width: 64, height: 64, borderRadius: 16 }} />
        <AppText style={{ fontSize: 18, fontWeight: '800', textAlign: 'center' }}>{APP_NAME}</AppText>
        <View style={{ backgroundColor: colors.primaryContainer, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
          <AppText style={{ color: colors.onPrimaryContainer, fontWeight: '700', fontSize: 12.5 }}>{displayVersion()}</AppText>
        </View>
        <AppText style={{ textAlign: 'center', color: colors.textSoft, lineHeight: 19, fontSize: 13 }}>
          {t('library.aboutDescription')}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surfaceLow, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
          <Icon name="sync" size={16} color={colors.muted} />
          <AppText style={{ fontSize: 12, fontWeight: '600', color: colors.textSoft }}>{syncStatus}</AppText>
        </View>
        <LegalLinks withDelete />
      </View>
    </Dialog>
  );
}
