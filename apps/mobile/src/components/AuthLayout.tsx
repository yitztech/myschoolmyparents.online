import React from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from './ui';
import { colors } from '../theme';

/** Envoltorio común de las pantallas de acceso: scroll, ancho limitado y cabecera con logo. */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.surface }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 24, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24, alignItems: 'center' }}
      >
        <View style={{ width: '100%', maxWidth: 440, gap: 14 }}>
          <Image
            source={require('../../assets/branding/my_school_my_parents_logo.png')}
            style={{ width: 72, height: 72, borderRadius: 20 }}
            accessibilityLabel="Logotipo de MySchoolMyParents"
          />
          <View style={{ gap: 4 }}>
            <AppText accessibilityRole="header" style={{ fontSize: 28, fontWeight: '800' }}>
              {title}
            </AppText>
            <AppText style={{ fontSize: 16, color: colors.muted }}>{subtitle}</AppText>
          </View>
          {children}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
