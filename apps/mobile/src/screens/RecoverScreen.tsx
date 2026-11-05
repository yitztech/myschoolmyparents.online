import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthLayout } from '../components/AuthLayout';
import { AppText, Banner, Button, Card, TextField } from '../components/ui';
import { useApp, useT } from '../context/AppContext';
import { AuthError } from '../services/auth';
import { validateConfirmPassword, validateEmail, validatePassword } from '../lib/validators';
import type { AuthStackParams } from '../navigation/types';
import { colors } from '../theme';

/** Recuperación en dos pasos: el backend envía un código de 6 dígitos al correo (vale 15 min). */
export function RecoverScreen({ navigation }: NativeStackScreenProps<AuthStackParams, 'Recover'>) {
  const { auth } = useApp();
  const { t } = useT();
  const [step, setStep] = useState<'email' | 'code' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guarded = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof AuthError ? e.message : t('auth.operationFailed'));
    } finally {
      setBusy(false);
    }
  };

  const sendCode = () => {
    const err = validateEmail(email);
    setErrors({ email: err });
    if (err) return;
    void guarded(async () => {
      await auth.sendPasswordReset(email);
      setStep('code');
    });
  };

  const reset = () => {
    const next = {
      code: /^\d{6}$/.test(code.trim()) ? null : t('validation.codeRequired'),
      password: validatePassword(password),
      confirm: validateConfirmPassword(confirm, password),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;
    void guarded(async () => {
      await auth.confirmPasswordReset(email, code.trim(), password);
      setStep('done');
    });
  };

  return (
    <AuthLayout title={t('auth.recoverTitle')} subtitle={step === 'email' ? t('auth.recoverSubtitleEmail') : t('auth.recoverSubtitleCode')}>
      {error ? <Banner message={error} /> : null}
      {step === 'email' ? (
        <>
          <TextField
            label={t('auth.emailLabel')}
            icon="mail-outline"
            placeholder={t('auth.emailPlaceholder')}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            onSubmitEditing={sendCode}
          />
          <Button label={t('auth.sendCode')} busy={busy} onPress={sendCode} />
        </>
      ) : null}
      {step === 'code' ? (
        <>
          <Banner kind="info" message={t('auth.codeSentInfo', { email: email.trim() })} />
          <TextField label={t('auth.codeLabel')} icon="pin" keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} error={errors.code} />
          <TextField
            label={t('auth.newPasswordLabel')}
            icon="lock-outline"
            secure
            autoCapitalize="none"
            helper={t('auth.passwordHelper')}
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />
          <TextField label={t('auth.confirmPasswordLabel')} icon="lock-outline" secure autoCapitalize="none" value={confirm} onChangeText={setConfirm} error={errors.confirm} onSubmitEditing={reset} />
          <Button label={t('auth.changePassword')} busy={busy} onPress={reset} />
        </>
      ) : null}
      {step === 'done' ? (
        <Card tint={colors.tertiaryContainer}>
          <AppText style={{ fontWeight: '800', fontSize: 17 }}>{t('auth.passwordUpdatedTitle')}</AppText>
          <AppText style={{ marginTop: 6 }}>{t('auth.passwordUpdatedBody')}</AppText>
        </Card>
      ) : null}
      <Button label={t('auth.backToLogin')} variant={step === 'done' ? 'filled' : 'text'} disabled={busy} onPress={() => navigation.popToTop()} />
    </AuthLayout>
  );
}
