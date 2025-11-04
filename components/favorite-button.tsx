import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';

export function FavoriteButton({ active, onPress }: { active: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.button} onPress={onPress} accessibilityLabel="favorite-button">
      <IconSymbol name={active ? 'heart.fill' : 'heart'} size={22} color={active ? '#e11' : '#666'} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
});
