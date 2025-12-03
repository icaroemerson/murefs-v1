// src/screens/DebugScreen.js
import React from 'react';
import { View, ScrollView, Text } from 'react-native';

export default function DebugScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
        DebugScreen — navegação OK
      </Text>
      <Text>
        Se você está vendo esta tela, a navegação (Home → Inputs) está funcionando.
      </Text>
    </ScrollView>
  );
}
