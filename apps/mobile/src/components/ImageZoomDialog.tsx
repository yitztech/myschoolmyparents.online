import React from 'react';
import { Image, Modal, Pressable, ScrollView, View } from 'react-native';
import { IconButton } from './ui';

/** Foto original ampliada a pantalla completa. */
export function ImageZoomDialog({ uri, onClose }: { uri: string | null; onClose: () => void }) {
  return (
    <Modal visible={uri !== null} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)' }}>
        <ScrollView maximumZoomScale={4} minimumZoomScale={1} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} centerContent>
          <Pressable onPress={onClose} accessibilityLabel="Cerrar foto">
            {uri ? <Image source={{ uri }} style={{ width: '100%', height: 600 }} resizeMode="contain" accessibilityLabel="Foto de la página" /> : null}
          </Pressable>
        </ScrollView>
        <View style={{ position: 'absolute', top: 48, right: 16 }}>
          <IconButton icon="close" label="Cerrar" color="#fff" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}
