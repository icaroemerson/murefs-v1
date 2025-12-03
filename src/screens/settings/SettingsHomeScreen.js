import React from 'react';
import { View } from 'react-native';
import { List } from 'react-native-paper';

export default function SettingsHomeScreen({ navigation }) {
  return (
    <View style={{ flex: 1 }}>
      <List.Section>
        <List.Item
          title="Tema"
          description="Claro, Escuro ou seguir o sistema"
          left={(props) => <List.Icon {...props} icon="theme-light-dark" />}
          onPress={() => navigation.navigate('ThemeSettings')}
        />
        <List.Item
          title="Projetos Recentes"
          description="Abrir ou remover projetos recentes"
          left={(props) => <List.Icon {...props} icon="clock-outline" />}
          onPress={() => navigation.navigate('RecentProjects')}
        />
      </List.Section>
    </View>
  );
}
