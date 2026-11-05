import React from 'react';
import { Image, Modal, Pressable, ScrollView, View } from 'react-native';
import { IconButton } from './ui';
import { useT } from '../context/AppContext';

/** Foto original ampliada a pantalla completa. */
export function ImageZoomDialog({ uri, onClose }: { uri: string | null; onClose: () => void }) {
  const { t } = useT();
  return (
    <Modal visible={uri !== null} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' }}>
        <ScrollView maximumZoomScale={4} minimumZoomScale={1} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} centerContent>
          <Pressable onPress={onClose} accessibilityLabel={t('capture.closePhoto')}>
            {uri ? <Image source={{ uri }} style={{ width: '100%', height: 600 }} resizeMode="contain" accessibilityLabel={t('capture.pageImage')} /> : null}
          </Pressable>
        </ScrollView>
        <View style={{ position: 'absolute', top: 48, right: 16 }}>
          <IconButton icon="close" label={t('close')} color="#fff" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
