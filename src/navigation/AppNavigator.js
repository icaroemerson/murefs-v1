// src/navigation/AppNavigator.js
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import InputTabsNavigator from './InputTabsNavigator';
import ResultsTabsNavigator from './ResultsTabsNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: true }}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Murefs' }}
      />
      <Stack.Screen
        name="Inputs"
        component={InputTabsNavigator}
        options={{ title: 'Entradas' }}
      />
      <Stack.Screen
        name="ResultsTabs"
        component={ResultsTabsNavigator}
        options={{ title: 'Resultados' }}
      />
    </Stack.Navigator>
  );
}
