// src/screens/inputs/GeometryScreen.js
import React from 'react';
import { ScrollView, View } from 'react-native';
import { Text, TextInput, Switch, Divider } from 'react-native-paper';
import { useProject } from '../../state/ProjectContext';
import WallDrawingL from '../../components/WallDrawingL';

export default function GeometryScreen() {
  const {
    H, setH,
    tStem, setTStem, tStemManual, setTStemManual,
    bs, setBs, bsManual, setBsManual,
    ds, setDs, dsManual, setDsManual,
    showPassive, setShowPassive,
    hp, setHp,
    bp, setBp,
  } = useProject();

  // util
  const onEdit = (setter, manualSetter) => (txt) => {
    manualSetter?.(true);
    setter(txt);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text variant="titleLarge">Geometria — Perfil L</Text>
      <Divider />

      {/* ENTRADAS */}
      <View style={{ gap: 8 }}>
        <TextInput
          mode="outlined"
          label="Altura do muro H (cm)"
          value={H}
          onChangeText={onEdit(setH)}
          keyboardType="numeric"
          placeholder="Informe a altura total do muro"
        />

        <TextInput
          mode="outlined"
          label="Espessura da cortina t (cm)"
          value={tStem}
          onChangeText={onEdit(setTStem, setTStemManual)}
          keyboardType="numeric"
          placeholder="padrão 8% da altura"
        />

        <TextInput
          mode="outlined"
          label="Largura da base B (cm)"
          value={bs}
          onChangeText={onEdit(setBs, setBsManual)}
          keyboardType="numeric"
          placeholder="50%~60% da altura"
        />

        <TextInput
          mode="outlined"
          label="Espessura da base dS (cm)"
          value={ds}
          onChangeText={onEdit(setDs, setDsManual)}
          keyboardType="numeric"
          placeholder="padrão 8% da altura"
        />

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Switch value={showPassive} onValueChange={setShowPassive} />
          <Text>Considerar empuxo passivo</Text>
        </View>

        {showPassive && (
          <View style={{ gap: 8 }}>
            <TextInput
              mode="outlined"
              label="Altura do terreno passivo hp (cm)"
              value={hp}
              onChangeText={setHp}
              keyboardType="numeric"
              placeholder="Informe a altura do terreno passivo"
            />
            <TextInput
              mode="outlined"
              label="Largura do terreno passivo bp (cm)"
              value={bp}
              onChangeText={setBp}
              keyboardType="numeric"
              placeholder="Largura visual do terreno passivo"
            />
          </View>
        )}
      </View>

      {/* DESENHO */}
      <Divider style={{ marginTop: 8 }} />
      <WallDrawingL
        H={H} tStem={tStem} bs={bs} ds={ds}
        showPassive={showPassive} hp={hp} bp={bp}
      />

      <View style={{ height: 12 }} />
    </ScrollView>
  );
}
