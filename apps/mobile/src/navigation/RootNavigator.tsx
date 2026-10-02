import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useApp } from '../context/AppContext';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { RecoverScreen } from '../screens/RecoverScreen';
import { LibraryScreen } from '../screens/LibraryScreen';
import { BookScreen } from '../screens/BookScreen';
import { colors } from '../theme';
import type { AppStackParams, AuthStackParams } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParams>();
const AppStack = createNativeStackNavigator<AppStackParams>();

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.surface, primary: colors.primary, card: colors.surface, text: colors.text, border: colors.outlineVariant } };

/** Sin sesión: acceso, registro y recuperación. Con sesión (o modo local): biblioteca y libro. */
export function RootNavigator() {
  const { user } = useApp();
  return (
    <NavigationContainer theme={theme}>
      {user ? (
        <AppStack.Navigator screenOptions={{ headerShown: false }}>
          <AppStack.Screen name="Library" component={LibraryScreen} />
          <AppStack.Screen name="Book" component={BookScreen} />
        </AppStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
          <AuthStack.Screen name="Register" component={RegisterScreen} />
          <AuthStack.Screen name="Recover" component={RecoverScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}
