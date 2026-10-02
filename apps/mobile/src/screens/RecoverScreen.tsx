import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthLayout } from '../components/AuthLayout';
import { AppText, Banner, Button, Card, TextField } from '../components/ui';
import { useApp } from '../context/AppContext';
import { AuthError } from '../services/auth';
import { validateConfirmPassword, validateEmail, validatePassword } from '../lib/validators';
import type { AuthStackParams } from '../navigation/types';

/** Recuperación en dos pasos: el backend envía un código de 6 dígitos al correo (vale 15 min). */
export function RecoverScreen({ navigation }: NativeStackScreenProps<AuthStackParams, 'Recover'>) {
  const { auth } = useApp();
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
      setError(e instanceof AuthError ? e.message : 'No se pudo completar la operación.');
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
      code: /^\d{6}$/.test(code.trim()) ? null : 'Escribe el código de 6 dígitos.',
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
    <AuthLayout title="Recupera tu acceso" subtitle={step === 'email' ? 'Te enviamos un código para crear una contraseña nueva.' : 'Escribe el código y tu contraseña nueva.'}>
      {error ? <Banner message={error} /> : null}
      {step === 'email' ? (
        <>
          <TextField
            label="Correo electrónico"
            icon="mail-outline"
            placeholder="tucorreo@ejemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            onSubmitEditing={sendCode}
          />
          <Button label="Enviar código" busy={busy} onPress={sendCode} />
        </>
      ) : null}
      {step === 'code' ? (
        <>
          <Banner kind="info" message={`Si hay una cuenta con ${email.trim()}, recibirás un código de 6 dígitos.`} />
          <TextField label="Código" icon="pin" keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} error={errors.code} />
          <TextField
            label="Contraseña nueva"
            icon="lock-outline"
            secure
            autoCapitalize="none"
            helper="Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo."
            value={password}
            onChangeText={setPassword}
            error={errors.password}
          />
          <TextField label="Confirmar contraseña" icon="lock-outline" secure autoCapitalize="none" value={confirm} onChangeText={setConfirm} error={errors.confirm} onSubmitEditing={reset} />
          <Button label="Cambiar contraseña" busy={busy} onPress={reset} />
        </>
      ) : null}
      {step === 'done' ? (
        <Card tint="#d1fae5">
          <AppText style={{ fontWeight: '800', fontSize: 17 }}>Contraseña actualizada</AppText>
          <AppText style={{ marginTop: 6 }}>Ya puedes iniciar sesión con tu contraseña nueva.</AppText>
        </Card>
      ) : null}
      <Button label="Volver a iniciar sesión" variant={step === 'done' ? 'filled' : 'text'} disabled={busy} onPress={() => navigation.popToTop()} />
    </AuthLayout>
  );
}
