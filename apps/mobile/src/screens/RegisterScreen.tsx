import React, { useState } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthLayout } from '../components/AuthLayout';
import { AppText, Banner, Button, TextField } from '../components/ui';
import { useApp, useT } from '../context/AppContext';
import { AuthError } from '../services/auth';
import { validateConfirmPassword, validateEmail, validateName, validatePassword } from '../lib/validators';
import { AcceptTerms } from '../components/LegalLinks';
import type { AuthStackParams } from '../navigation/types';

export function RegisterScreen({ navigation }: NativeStackScreenProps<AuthStackParams, 'Register'>) {
  const { auth } = useApp();
  const { t } = useT();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const next = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: validateConfirmPassword(confirm, password),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setBusy(true);
    setError(null);
    try {
      await auth.registerWithEmail(name, email, password);
    } catch (e) {
      setError(e instanceof AuthError ? e.message : t('auth.registerFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')}>
      {error ? <Banner message={error} /> : null}
      <TextField label={t('auth.nameLabel')} icon="person-outline" placeholder={t('auth.namePlaceholder')} autoComplete="name" value={name} onChangeText={setName} error={errors.name} />
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
        autoComplete="new-password"
        helper={t('auth.passwordHelper')}
        value={password}
        onChangeText={setPassword}
        error={errors.password}
      />
      <TextField
        label={t('auth.confirmPasswordLabel')}
        icon="lock-outline"
        secure
        autoCapitalize="none"
        autoCorrect={false}
        value={confirm}
        onChangeText={setConfirm}
        error={errors.confirm}
        onSubmitEditing={submit}
      />
      <Button label={t('auth.createAccount')} busy={busy} onPress={submit} />
      <AcceptTerms />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        <AppText>{t('auth.hasAccountQuestion')}</AppText>
        <Button label={t('auth.signInLink')} variant="text" compact disabled={busy} onPress={() => navigation.goBack()} />
      </View>
    </AuthLayout>
  );
}
