// src/navigation/InputTabsNavigator.js
import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import GeometryScreen from '../screens/inputs/GeometryScreen';
import SoilScreen from '../screens/inputs/SoilScreen';
import LoadScreen from '../screens/inputs/LoadScreen';

const Tab = createMaterialTopTabNavigator();

export default function InputTabsNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Geometry"   // garante que Geometria abre primeiro
      screenOptions={{
        lazy: true,                 // só monta a aba quando o usuário entra
        unmountOnBlur: false,       // mantém estado ao trocar de aba
        tabBarIndicatorStyle: { height: 3 },
      }}
    >
      <Tab.Screen
        name="Geometry"
        component={GeometryScreen}
        options={{ title: 'Geometria' }}
      />
      <Tab.Screen
        name="Soil"
        component={SoilScreen}
        options={{ title: 'Solo' }}
      />
      <Tab.Screen
        name="Load"
        component={LoadScreen}
        options={{ title: 'Cargas' }}
      />
    </Tab.Navigator>
  );
}
