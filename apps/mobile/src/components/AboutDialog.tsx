import React from 'react';
import { Image, View } from 'react-native';
import { AppText, Button, Dialog, Icon } from './ui';
import { APP_NAME, displayVersion } from '../lib/appVersion';
import { colors } from '../theme';
import { LegalLinks } from './LegalLinks';

/** Modal «Acerca de la app»: logotipo, nombre, versión, descripción y estado de sincronización. */
export function AboutDialog({ visible, onClose, syncStatus }: { visible: boolean; onClose: () => void; syncStatus: string }) {
  return (
    <Dialog visible={visible} title="Acerca de la app" onClose={onClose} actions={<Button label="Cerrar" variant="text" onPress={onClose} />}>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Image source={require('../../assets/branding/my_school_my_parents_logo.png')} style={{ width: 64, height: 64, borderRadius: 16 }} />
        <AppText style={{ fontSize: 18, fontWeight: '800', textAlign: 'center' }}>{APP_NAME}</AppText>
        <View style={{ backgroundColor: colors.primaryContainer, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
          <AppText style={{ color: colors.onPrimaryContainer, fontWeight: '700', fontSize: 12.5 }}>{displayVersion()}</AppText>
        </View>
        <AppText style={{ textAlign: 'center', color: colors.textSoft, lineHeight: 19, fontSize: 13 }}>
          Lectura comprensiva interactiva y bilingüe para niños y familias. Transforma fotos de libros escolares en audio-lecturas con karaoke palabra por palabra.
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
