
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import AppNavigator from './AppNavigator';
import SettingsScreen from '../screens/SettingsScreen';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
 
    <Drawer.Navigator initialRouteName="Main"> 
      <Drawer.Screen
        name="Main"
        component={AppNavigator}
        options={{ title: 'Murefs - Início', headerShown: false }}
      />
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Configurações' }}
      />
    </Drawer.Navigator>
  );
}