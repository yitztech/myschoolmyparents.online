import React, { useState } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthLayout } from '../components/AuthLayout';
import { AppText, Banner, Button, TextField } from '../components/ui';
import { useApp } from '../context/AppContext';
import { AuthError } from '../services/auth';
import { validateEmail } from '../lib/validators';
import { displayVersion } from '../lib/appVersion';
import { colors } from '../theme';
import type { AuthStackParams } from '../navigation/types';

export function LoginScreen({ navigation }: NativeStackScreenProps<AuthStackParams, 'Login'>) {
  const { auth } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      // La sesión llega por el contexto y la navegación cambia sola a la biblioteca.
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'No se pudo iniciar sesión. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    const next = { email: validateEmail(email), password: password ? null : 'Escribe tu contraseña.' };
    setErrors(next);
    if (next.email || next.password) return;
    void run(() => auth.signInWithEmail(email, password));
  };

  return (
    <AuthLayout title="Hola de nuevo" subtitle="Entra para seguir con tus libros de lectura.">
      {error ? <Banner message={error} /> : null}
      <TextField
        label="Correo electrónico"
        icon="mail-outline"
        placeholder="tucorreo@ejemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
      />
      <TextField
        label="Contraseña"
        icon="lock-outline"
        secure
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="current-password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        onSubmitEditing={submit}
      />
      <View style={{ alignItems: 'flex-end' }}>
        <Button label="¿Olvidaste tu contraseña?" variant="text" compact disabled={busy} onPress={() => navigation.navigate('Recover')} />
      </View>
      <Button label="Entrar" busy={busy} onPress={submit} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.outlineVariant }} />
        <AppText style={{ color: colors.muted }}>o</AppText>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.outlineVariant }} />
      </View>
      <Button
        label="Continuar sin cuenta (Modo local)"
        icon="offline-pin"
        variant="outlined"
        disabled={busy}
        onPress={() => void run(() => auth.signInLocally())}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        <AppText>¿No tienes cuenta?</AppText>
        <Button label="Crear cuenta" variant="text" compact disabled={busy} onPress={() => navigation.navigate('Register')} />
      </View>
      <AppText style={{ textAlign: 'center', fontSize: 12, color: colors.subtle, fontWeight: '500' }}>{displayVersion()}</AppText>
    </AuthLayout>
  );
}
