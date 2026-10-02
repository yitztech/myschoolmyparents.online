import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { AppProvider } from './src/context/AppContext';
import { ToastProvider } from './src/components/Toast';
import { AppText } from './src/components/ui';
import { RootNavigator } from './src/navigation/RootNavigator';
import { colors } from './src/theme';

const Loading = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
    <ActivityIndicator size="large" color={colors.primary} accessibilityLabel="Cargando" />
  </View>
);

const Failed = ({ error }: { error: string }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, padding: 24 }}>
    <AppText style={{ textAlign: 'center' }}>{`No se pudo abrir la biblioteca local.\n${error}`}</AppText>
  </View>
);

export default function App() {
  const [fontsLoaded] = useFonts({
    Nunito: require('./assets/fonts/Nunito.ttf'),
    'Nunito-Italic': require('./assets/fonts/Nunito-Italic.ttf'),
  });
  if (!fontsLoaded) return <Loading />;
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <ToastProvider>
        <AppProvider loading={<Loading />} failed={(e) => <Failed error={e} />}>
          <RootNavigator />
        </AppProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
