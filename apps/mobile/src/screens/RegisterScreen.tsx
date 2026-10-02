import React, { useState } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthLayout } from '../components/AuthLayout';
import { AppText, Banner, Button, TextField } from '../components/ui';
import { useApp } from '../context/AppContext';
import { AuthError } from '../services/auth';
import { validateConfirmPassword, validateEmail, validateName, validatePassword } from '../lib/validators';
import type { AuthStackParams } from '../navigation/types';

export function RegisterScreen({ navigation }: NativeStackScreenProps<AuthStackParams, 'Register'>) {
  const { auth } = useApp();
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
      setError(e instanceof AuthError ? e.message : 'No se pudo crear la cuenta. Inténtalo de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="Crea tu cuenta" subtitle="Guarda tus libros y sigue donde te quedaste.">
      {error ? <Banner message={error} /> : null}
      <TextField label="Nombre" icon="person-outline" placeholder="Ej. María García" autoComplete="name" value={name} onChangeText={setName} error={errors.name} />
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
        autoComplete="new-password"
        helper="Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo."
        value={password}
        onChangeText={setPassword}
        error={errors.password}
      />
      <TextField
        label="Confirmar contraseña"
        icon="lock-outline"
        secure
        autoCapitalize="none"
        autoCorrect={false}
        value={confirm}
        onChangeText={setConfirm}
        error={errors.confirm}
        onSubmitEditing={submit}
      />
      <Button label="Crear cuenta" busy={busy} onPress={submit} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        <AppText>¿Ya tienes cuenta?</AppText>
        <Button label="Iniciar sesión" variant="text" compact disabled={busy} onPress={() => navigation.goBack()} />
      </View>
    </AuthLayout>
  );
}
