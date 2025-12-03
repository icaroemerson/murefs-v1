import React from 'react';
import { View } from 'react-native';
import { RadioButton, Text } from 'react-native-paper';
import { useProject } from '../../state/ProjectContext';
export default function UnitsSettingsScreen() {
  const { state, actions } = useProject();
  return (
    <View style={{ padding: 16 }}>
      <Text variant="titleMedium">Unidades</Text>
      <RadioButton.Group onValueChange={actions.setUnits} value={state.units}>
        <RadioButton.Item label="SI (kN, m, kPa)" value="SI" />
      </RadioButton.Group>
    </View>
  );
}
