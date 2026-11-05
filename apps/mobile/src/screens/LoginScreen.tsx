import React, { useState } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthLayout } from '../components/AuthLayout';
import { AppText, Banner, Button, TextField } from '../components/ui';
import { useApp, useT } from '../context/AppContext';
import { AuthError } from '../services/auth';
import { validateEmail } from '../lib/validators';
import { displayVersion } from '../lib/appVersion';
import { LegalLinks } from '../components/LegalLinks';
import { colors } from '../theme';
import type { AuthStackParams } from '../navigation/types';

export function LoginScreen({ navigation }: NativeStackScreenProps<AuthStackParams, 'Login'>) {
  const { auth } = useApp();
  const { t } = useT();
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
      setError(e instanceof AuthError ? e.message : t('auth.loginFailed'));
    } finally {
      setBusy(false);
    }
  };

  const submit = () => {
    const next = { email: validateEmail(email), password: password ? null : t('auth.loginPasswordRequired') };
    setErrors(next);
    if (next.email || next.password) return;
    void run(() => auth.signInWithEmail(email, password));
  };

  return (
    <AuthLayout title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
      {error ? <Banner message={error} /> : null}
      <TextField
        label={t('auth.emailLabel')}
        icon="mail-outline"
        placeholder={t('auth.emailPlaceholder')}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
      />
      <TextField
        label={t('auth.passwordLabel')}
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
        <Button label={t('auth.forgotPassword')} variant="text" compact disabled={busy} onPress={() => navigation.navigate('Recover')} />
      </View>
      <Button label={t('auth.signIn')} busy={busy} onPress={submit} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.outlineVariant }} />
        <AppText style={{ color: colors.muted }}>{t('auth.orSeparator')}</AppText>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.outlineVariant }} />
      </View>
      <Button
        label={t('auth.continueLocal')}
        icon="offline-pin"
        variant="outlined"
        disabled={busy}
        onPress={() => void run(() => auth.signInLocally())}
      />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        <AppText>{t('auth.noAccountQuestion')}</AppText>
        <Button label={t('auth.createAccount')} variant="text" compact disabled={busy} onPress={() => navigation.navigate('Register')} />
      </View>
      <LegalLinks />
      <AppText style={{ textAlign: 'center', fontSize: 12, color: colors.subtle, fontWeight: '500' }}>{displayVersion()}</AppText>
    </AuthLayout>
  );
}
