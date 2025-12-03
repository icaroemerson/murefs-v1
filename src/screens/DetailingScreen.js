// src/screens/DetailingScreen.js
import React, { useMemo, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, TextInput, Divider, Button } from 'react-native-paper';
import { useProject } from '../state/ProjectContext';
import { computeLoads } from '../utils/calcLoads';
import {
  calcAsFlexao,
  calcAsMin,
  suggestRebars,
} from '../utils/dimensionamento';

const fmt = (v, d = 2) => {
  if (!isFinite(v)) return '—';
  const n = Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
  return String(n).replace('.', ',');
};

export default function DetailingScreen() {
  const {
    ds, // espessura da base (cm)
  } = useProject();

  // parâmetros de detalhamento (locais por enquanto)
  const [cover, setCover] = useState('4'); // cm
  const [concrete, setConcrete] = useState('C25');
  const [steel, setSteel] = useState('CA50');

  // 1) pegar cargas pra ter Mt
  const ctx = useProject();
  const loads = useMemo(() => computeLoads(ctx), [ctx]);
  const Mt = loads?.moments?.Mt ?? 0; // kN·cm/m

  // 2) momento de projeto
  const Md = 1.4 * Mt;

  // 3) d = ds - cover - 0,5
  const dsNum = Number(ds) || 0;
  const coverNum = Number(cover.toString().replace(',', '.')) || 0;
  const d_cm = dsNum - coverNum - 0.5;

  // 4) cálculo da área de aço
  const flex = useMemo(() => {
    if (Md <= 0 || d_cm <= 0) {
      return null;
    }
    const base = calcAsFlexao({
      md_kNcm: Md,
      d_cm,
      concrete,
      steel,
    });
    const Asmin = calcAsMin(dsNum);
    const As_req = Math.max(base.As_cm2 ?? 0, Asmin);

    const suggestions = suggestRebars(As_req);

    return {
      ...base,
      Asmin,
      As_req,
      suggestions,
    };
  }, [Md, d_cm, concrete, steel, dsNum]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="titleLarge">Detalhamento da Base</Text>
      <Divider style={{ marginVertical: 12 }} />

      <Text variant="titleMedium">Dados de entrada</Text>

      <TextInput
        label="Cobrimento (cm)"
        value={cover}
        onChangeText={setCover}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Concreto (ex.: C25, C30)"
        value={concrete}
        onChangeText={setConcrete}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label="Aço (ex.: CA50, CA60)"
        value={steel}
        onChangeText={setSteel}
        mode="outlined"
        style={styles.input}
      />

      <View style={styles.block}>
        <Text>Espessura da base ds: {fmt(dsNum, 0)} cm</Text>
        <Text>Momento de tombamento Mt: {fmt(Mt)} kN·cm/m</Text>
        <Text>Momento de projeto Md = 1,4·Mt: {fmt(Md)} kN·cm/m</Text>
        <Text>d = ds - cobr - 0,5 = {fmt(d_cm, 1)} cm</Text>
      </View>

      <Divider style={{ marginVertical: 12 }} />

      <Text variant="titleMedium">Resultados</Text>
      {flex ? (
        <View style={styles.block}>
          <Text>kc calculado: {fmt(flex.kcCalc)}</Text>
          <Text>ks adotado: {flex.ks ? fmt(flex.ks, 3) : '—'}</Text>
          <Text>As calculada: {fmt(flex.As_cm2)} cm²/m</Text>
          <Text>As mínima: {fmt(flex.Asmin)} cm²/m</Text>
          <Text style={{ fontWeight: '700' }}>
            As a adotar: {fmt(flex.As_req)} cm²/m
          </Text>

          <Divider style={{ marginVertical: 10 }} />
          <Text variant="titleSmall">Sugestões de armadura</Text>
          {flex.suggestions && flex.suggestions.length > 0 ? (
            flex.suggestions.map((sug, idx) => (
              <Text key={idx}>
                {idx + 1}. φ{sug.phi} c/{sug.spacing} → {fmt(sug.AsProv)} cm²/m
              </Text>
            ))
          ) : (
            <Text>Nenhuma sugestão encontrada.</Text>
          )}
        </View>
      ) : (
        <Text>Informe dados válidos para calcular.</Text>
      )}

      <Button
        mode="contained"
        style={{ marginTop: 20 }}
        onPress={() => {
          // no futuro: salvar detalhamento no contexto
        }}
      >
        Salvar detalhamento
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  input: { marginBottom: 12 },
  block: { marginTop: 10, gap: 4 },
});
