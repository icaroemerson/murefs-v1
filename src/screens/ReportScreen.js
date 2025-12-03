// src/screens/ReportScreen.js
import React from 'react';
import { ScrollView } from 'react-native';
import { Text } from 'react-native-paper';

export default function ReportScreen() {
  return (
    <ScrollView contentContainerStyle={{ padding: 12 }}>
      <Text variant="titleLarge">Relatório</Text>
      <Text>• Dados de entrada (Geometria, Solo, Cargas)</Text>
      <Text>• Empuxos (Rankine) e verificações: FS_tomb, FS_desl, e, σmax/σmin, qmax</Text>
      <Text>• Diretrizes de Detalhamento (mínimos, ancoragem, cobrimento)</Text>
      <Text style={{ opacity: 0.6, marginTop: 8 }}>
        * Podemos exportar em PDF (expo-print) ou HTML (FileSystem) depois.
      </Text>
    </ScrollView>
  );
}
