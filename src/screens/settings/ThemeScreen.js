import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Text, SegmentedButtons, Button, HelperText } from 'react-native-paper';

export default function ThemeScreen({ navigation }) {
  const [mode, setMode] = useState('system'); // 'light' | 'dark' | 'system'

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text variant="titleMedium">Tema</Text>

      <SegmentedButtons
        value={mode}
        onValueChange={setMode}
        buttons={[
          { value: 'light', label: 'Claro' },
          { value: 'dark', label: 'Escuro' },
          { value: 'system', label: 'Sistema' },
        ]}
      />

      <HelperText type="info" style={{ marginTop: 8 }}>
        Esta tela é um protótipo. Posso ativar o tema global (Claro/Escuro/Sistema) criando um
        ThemeContext e conectando ao PaperProvider — me diga que eu já deixo tudo pronto.
      </HelperText>

      <View style={{ marginTop: 12 }}>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Voltar às Configurações
        </Button>
      </View>
    </ScrollView>
  );
}
