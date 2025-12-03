import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';

export default function SettingsScreen() {
  return (
    <View style={{ flex:1, padding:16 }}>
      <Text variant="titleMedium">Configurações</Text>
      <Text style={{ marginTop: 8, opacity: 0.7 }}>
        (Tema e recent projects serão ligados aqui depois)
      </Text>
    </View>
  );
}
