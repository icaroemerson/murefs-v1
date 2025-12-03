import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import SettingsHomeScreen from '../screens/settings/SettingsHomeScreen';
import ThemeSettingsScreen from '../screens/settings/ThemeSettingsScreen';
import RecentProjectsScreen from '../screens/settings/RecentProjectsScreen';

const Stack = createNativeStackNavigator();

export default function SettingsStackNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SettingsHome"
        component={SettingsHomeScreen}
        options={{ title: 'Configurações' }}
      />
      <Stack.Screen
        name="ThemeSettings"
        component={ThemeSettingsScreen}
        options={{ title: 'Tema' }}
      />
      <Stack.Screen
        name="RecentProjects"
        component={RecentProjectsScreen}
        options={{ title: 'Projetos Recentes' }}
      />
    </Stack.Navigator>
  );
}
