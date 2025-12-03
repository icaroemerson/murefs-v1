import React from 'react';
import { View } from 'react-native';
import { List, Text } from 'react-native-paper';

export default function RecentProjectsScreen() {
  // Placeholder — depois podemos integrar com AsyncStorage para listar projetos reais
  const mock = [
    { id: '1', name: 'Muro 3.0 m — Areia média', date: '2025-10-20' },
    { id: '2', name: 'Muro 4.5 m — Argila média', date: '2025-10-22' },
  ];

  return (
    <View style={{ flex: 1 }}>
      <List.Section>
        <List.Subheader>Projetos recentes</List.Subheader>
        {mock.map((p) => (
          <List.Item
            key={p.id}
            title={p.name}
            description={`Acesso em ${p.date}`}
            left={(props) => <List.Icon {...props} icon="folder" />}
            onPress={() => {
              // TODO: abrir projeto (carregar estado salvo)
            }}
          />
        ))}
        {mock.length === 0 && (
          <Text style={{ paddingHorizontal: 16, paddingVertical: 8, opacity: 0.6 }}>
            Nenhum projeto recente.
          </Text>
        )}
      </List.Section>
    </View>
  );
}
