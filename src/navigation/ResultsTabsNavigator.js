// src/navigation/ResultsTabsNavigator.js
import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import CalculationScreen from '../screens/results/CalculationScreen';
import DetailingScreen from '../screens/results/DetailingScreen';
import ReportScreen from '../screens/results/ReportScreen';

const Tab = createMaterialTopTabNavigator();

export default function ResultsTabsNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Calcs"
        component={CalculationScreen}
        options={{ title: 'Cálculos' }}
      />
      <Tab.Screen
        name="Detailing"
        component={DetailingScreen}
        options={{ title: 'Detalhamento' }}
      />
      <Tab.Screen
        name="Report"
        component={ReportScreen}
        options={{ title: 'Relatório' }}
      />
    </Tab.Navigator>
  );
}
