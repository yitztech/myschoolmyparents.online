import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fonts, radius, shadow, space } from '../theme';

export type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

export function Icon({ name, size = 20, color = colors.text }: { name: IconName; size?: number; color?: string }) {
  return <MaterialIcons name={name} size={size} color={color} />;
}

export function AppText({ style, ...rest }: React.ComponentProps<typeof Text>) {
  return <Text {...rest} style={[styles.text, style]} />;
}

type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text' | 'danger';

export function Button({
  label,
  onPress,
  icon,
  variant = 'filled',
  busy,
  disabled,
  compact,
  style,
  accessibilityLabel,
}: {
  label?: string;
  onPress?: () => void;
  icon?: IconName;
  variant?: ButtonVariant;
  busy?: boolean;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const off = disabled || busy;
  const palette = {
    filled: { bg: colors.primary, fg: colors.onPrimary, border: colors.primary },
    tonal: { bg: colors.primaryContainer, fg: colors.onPrimaryContainer, border: colors.primaryContainer },
    outlined: { bg: 'transparent', fg: colors.primary, border: colors.outline },
    text: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
    danger: { bg: colors.error, fg: '#fff', border: colors.error },
  }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!off, busy: !!busy }}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: off ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : icon ? (
        <Icon name={icon} size={compact ? 16 : 20} color={palette.fg} />
      ) : null}
      {label ? <AppText style={[styles.buttonLabel, compact && { fontSize: 13 }, { color: palette.fg }]}>{label}</AppText> : null}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  disabled,
  filled,
  color,
  size = 22,
}: {
  icon: IconName;
  onPress?: () => void;
  label: string;
  disabled?: boolean;
  filled?: boolean;
  color?: string;
  size?: number;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={6}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.iconButton,
        filled && { backgroundColor: colors.primary, width: 46, height: 46, borderRadius: 23 },
        { opacity: disabled ? 0.35 : pressed ? 0.7 : 1 },
      ]}
    >
      <Icon name={icon} size={size} color={filled ? '#fff' : (color ?? colors.text)} />
    </Pressable>
  );
}

export function Card({ children, style, tint }: { children: React.ReactNode; style?: StyleProp<ViewStyle>; tint?: string }) {
  return <View style={[styles.card, tint ? { backgroundColor: tint } : null, style]}>{children}</View>;
}

export function Badge({ label, bg, fg, icon }: { label: string; bg: string; fg: string; icon?: IconName }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      {icon ? <Icon name={icon} size={12} color={fg} /> : null}
      <AppText style={{ color: fg, fontSize: 11, fontWeight: '700' }}>{label}</AppText>
    </View>
  );
}

export function Banner({ kind = 'error', message }: { kind?: 'error' | 'info'; message: string }) {
  const error = kind === 'error';
  return (
    <View
      accessibilityLiveRegion="polite"
      style={[styles.banner, { backgroundColor: error ? colors.errorContainer : colors.primaryContainer }]}
    >
      <Icon name={error ? 'error-outline' : 'info-outline'} size={20} color={error ? colors.onErrorContainer : colors.onPrimaryContainer} />
      <AppText style={{ flex: 1, color: error ? colors.onErrorContainer : colors.onPrimaryContainer }}>{message}</AppText>
    </View>
  );
}

export function TextField({
  label,
  error,
  helper,
  secure,
  icon,
  style,
  ...input
}: TextInputProps & { label: string; error?: string | null; helper?: string; secure?: boolean; icon?: IconName }) {
  const [hidden, setHidden] = useState(!!secure);
  const [focused, setFocused] = useState(false);
  return (
    <View style={[{ gap: 4 }, style as StyleProp<ViewStyle>]}>
      <AppText style={styles.fieldLabel}>{label}</AppText>
      <View
        style={[
          styles.field,
          { borderColor: error ? colors.error : focused ? colors.primary : colors.inputBorder, borderWidth: focused ? 2 : 1 },
        ]}
      >
        {icon ? <Icon name={icon} size={20} color={colors.muted} /> : null}
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={colors.subtle}
          {...input}
          secureTextEntry={secure ? hidden : input.secureTextEntry}
          onFocus={(e) => {
            setFocused(true);
            input.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            input.onBlur?.(e);
          }}
          style={[styles.input, input.multiline && { minHeight: 120, textAlignVertical: 'top' }]}
        />
        {secure ? (
          <IconButton
            icon={hidden ? 'visibility' : 'visibility-off'}
            label={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
            size={20}
            color={colors.muted}
            onPress={() => setHidden((h) => !h)}
          />
        ) : null}
      </View>
      {error ? <AppText style={{ color: colors.error, fontSize: 12 }}>{error}</AppText> : helper ? <AppText style={styles.helper}>{helper}</AppText> : null}
    </View>
  );
}

/** Contenedor de diálogo modal con fondo oscurecido. */
export function Dialog({
  visible,
  title,
  onClose,
  children,
  actions,
  scroll = true,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  scroll?: boolean;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar diálogo" />
        <View style={styles.dialog} accessibilityViewIsModal>
          <AppText accessibilityRole="header" style={styles.dialogTitle}>
            {title}
          </AppText>
          {scroll ? (
            <ScrollView style={{ flexGrow: 0 }} keyboardShouldPersistTaps="handled">
              {children}
            </ScrollView>
          ) : (
            children
          )}
          {actions ? <View style={styles.dialogActions}>{actions}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Dialog
      visible={visible}
      title={title}
      onClose={onCancel}
      actions={
        <>
          <Button label="Cancelar" variant="text" onPress={onCancel} />
          <Button label={confirmLabel} variant={danger ? 'danger' : 'filled'} onPress={onConfirm} />
        </>
      }
    >
      <AppText style={{ lineHeight: 21 }}>{message}</AppText>
    </Dialog>
  );
}

/** Lista de opciones en un diálogo (sustituye al menú desplegable). */
export function OptionPicker<T extends string | number>({
  label,
  value,
  options,
  onChange,
  helper,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (v: T) => void;
  helper?: string;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <View style={{ gap: 4 }}>
      <AppText style={styles.fieldLabel}>{label}</AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${current?.label ?? ''}`}
        onPress={() => setOpen(true)}
        style={[styles.field, { borderColor: colors.inputBorder, justifyContent: 'space-between' }]}
      >
        <AppText style={{ flex: 1 }}>{current?.label ?? String(value)}</AppText>
        <Icon name="arrow-drop-down" size={24} color={colors.muted} />
      </Pressable>
      {helper ? <AppText style={styles.helper}>{helper}</AppText> : null}
      <Dialog visible={open} title={label} onClose={() => setOpen(false)} actions={<Button label="Cerrar" variant="text" onPress={() => setOpen(false)} />}>
        {options.map((o) => (
          <Pressable
            key={String(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: o.value === value }}
            onPress={() => {
              onChange(o.value);
              setOpen(false);
            }}
            style={styles.option}
          >
            <Icon name={o.value === value ? 'radio-button-checked' : 'radio-button-unchecked'} size={22} color={colors.primary} />
            <AppText style={{ flex: 1, fontWeight: o.value === value ? '800' : '500' }}>{o.label}</AppText>
          </Pressable>
        ))}
      </Dialog>
    </View>
  );
}

/** Menú contextual sencillo con acciones (equivale a PopupMenuButton). */
export function ActionMenu({
  label,
  actions,
}: {
  label: string;
  actions: { key: string; label: string; icon: IconName; danger?: boolean; disabled?: boolean; onPress: () => void }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <IconButton icon="more-vert" label={label} onPress={() => setOpen(true)} color={colors.muted} />
      <Dialog visible={open} title={label} onClose={() => setOpen(false)} actions={<Button label="Cerrar" variant="text" onPress={() => setOpen(false)} />}>
        {actions.map((a) => (
          <Pressable
            key={a.key}
            accessibilityRole="menuitem"
            accessibilityState={{ disabled: !!a.disabled }}
            disabled={a.disabled}
            onPress={() => {
              setOpen(false);
              a.onPress();
            }}
            style={[styles.option, a.disabled && { opacity: 0.4 }]}
          >
            <Icon name={a.icon} size={22} color={a.danger ? colors.error : colors.text} />
            <AppText style={{ color: a.danger ? colors.error : colors.text, fontWeight: '600' }}>{a.label}</AppText>
          </Pressable>
        ))}
      </Dialog>
    </>
  );
}

export const styles = StyleSheet.create({
  text: { fontFamily: fonts.regular, color: colors.text, fontSize: 15 },
  button: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1.2,
    paddingHorizontal: space.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
  },
  buttonCompact: { minHeight: 36, paddingHorizontal: space.md, borderRadius: radius.md },
  buttonLabel: { fontWeight: '700', fontSize: 15 },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: space.lg,
    ...shadow,
  },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: space.sm, padding: space.md, borderRadius: radius.md },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.textSoft },
  field: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
  },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.text, paddingVertical: 10 },
  helper: { fontSize: 12, color: colors.muted },
  scrim: { flex: 1, backgroundColor: colors.scrim, justifyContent: 'center', padding: space.xl },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: space.xl,
    gap: space.md,
    maxHeight: '88%',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  dialogTitle: { fontSize: 20, fontWeight: '800' },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm, flexWrap: 'wrap' },
  option: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: 14, minHeight: 48 },
});

export type { TextStyle };
