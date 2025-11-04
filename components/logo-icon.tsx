import React from 'react';
import { Image, StyleSheet } from 'react-native';

export function LogoIcon({ size = 24 }: { size?: number }) {
  return (
    <Image
      source={require('../assets/images/react-logo.png')}
      style={[styles.icon, { width: size, height: size }]}
      resizeMode="contain"
    />
  );
}

const styles = StyleSheet.create({
  icon: {
    tintColor: undefined,
  },
});
