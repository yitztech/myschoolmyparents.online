import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MOBILE_LOCALES, type MobileLocale } from '../i18n';

interface Props {
  visible: boolean;
  currentLocale: MobileLocale;
  onSelect: (locale: MobileLocale) => void;
  onClose: () => void;
}

export function LanguageSwitcherModal({ visible, currentLocale, onSelect, onClose }: Props) {
  const currentHeader =
    MOBILE_LOCALES.find((l) => l.code === currentLocale)?.header ?? MOBILE_LOCALES[0].header;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          <View style={styles.headerBox}>
            <Text style={styles.headerText}>{currentHeader}</Text>
          </View>
          <View style={styles.list}>
            {MOBILE_LOCALES.map((item, idx) => {
              const isSelected = item.code === currentLocale;
              return (
                <Pressable
                  key={item.code}
                  style={[
                    styles.row,
                    idx < MOBILE_LOCALES.length - 1 && styles.rowBorder,
                    isSelected && styles.rowSelected,
                  ]}
                  onPress={() => {
                    onSelect(item.code);
                    onClose();
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.label} ${isSelected ? '(seleccionado)' : ''}`}
                >
                  <View style={styles.labelGroup}>
                    <Text style={styles.flag}>{item.flag}</Text>
                    <Text style={[styles.label, isSelected && styles.labelSelected]}>{item.label}</Text>
                  </View>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerBox: {
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  list: {
    backgroundColor: '#ffffff',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    minHeight: 52,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowSelected: {
    backgroundColor: '#fafaf9',
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  flag: {
    fontSize: 22,
  },
  label: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
  labelSelected: {
    color: '#78350f',
    fontWeight: '700',
  },
  checkmark: {
    fontSize: 18,
    color: '#78350f',
    fontWeight: 'bold',
  },
});
