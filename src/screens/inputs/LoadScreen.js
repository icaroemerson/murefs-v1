// src/screens/inputs/LoadScreen.js
import React, { useMemo } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, Divider, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';

import { useProject } from '../../state/ProjectContext';
import { computeLoads } from '../../utils/calcLoads';

const fmt = (v, d = 2) => {
  if (!isFinite(v)) return '—';
  const n = Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
  return String(n).replace('.', ',');
};

const OK = ({ ok }) => (
  <Text style={{ fontWeight: '700', color: ok ? '#16a34a' : '#dc2626' }}>
    {ok ? 'OK' : 'NÃO'}
  </Text>
);

const Pair = ({ label, value, unit }) => (
  <View style={styles.row}>
    <Text style={styles.k}>{label}</Text>
    <Text style={styles.v}>
      {value}
      {unit ? ` ${unit}` : ''}
    </Text>
  </View>
);

export default function LoadScreen() {
  const ctx = useProject();
  const navigation = useNavigation();

  const result = useMemo(
    () => computeLoads(ctx),
    [
      ctx.H,
      ctx.tStem,
      ctx.bs,
      ctx.ds,
      ctx.soilGamma,
      ctx.soilPhi,
      ctx.soilQa,
      ctx.hasWaterTable,
      ctx.showPassive,
      ctx.hp,
    ]
  );

  const { weights, pressures, moments, foundation, checks } = result;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="titleLarge">Cargas / Resultados</Text>
      <Divider style={{ marginVertical: 12 }} />

      {/* PESOS */}
      <Text variant="titleMedium" style={styles.section}>
        Pesos (kN/m)
      </Text>
      <Pair label="Peso da base" value={fmt(weights.W_base)} />
      <Pair label="Peso do muro (cortina)" value={fmt(weights.W_stem)} />
      <Pair label="Peso do solo ativo" value={fmt(weights.W_soil_act)} />
      <Pair label="Peso total" value={fmt(weights.W_tot)} />

      {/* EMPUXOS */}
      <Text variant="titleMedium" style={styles.section}>
        Empuxos (kN/m)
      </Text>
      <Pair label="Empuxo ativo Ea" value={fmt(pressures.E_a)} />
      <Pair label="Empuxo passivo Ep" value={fmt(pressures.E_p)} />

      {/* MOMENTOS */}
      <Text variant="titleMedium" style={styles.section}>
        Momentos (kN·cm/m)
      </Text>
      <Pair label="Momento resistente Mr" value={fmt(moments.Mr)} />
      <Pair label="Momento de tombamento Mt" value={fmt(moments.Mt)} />
      <View style={styles.row}>
        <Text style={styles.k}>FS (tombamento) = Mr / Mt</Text>
        <Text style={styles.v}>
          {fmt(checks.overturningFS)} <OK ok={checks.overturningFS >= 2.0} />
        </Text>
      </View>

      {/* FUNDAÇÃO */}
      <Text variant="titleMedium" style={styles.section}>
        Fundação
      </Text>
      <Pair label="Excentricidade e" value={fmt(foundation.e, 1)} unit="cm" />
      <Pair label="q média" value={fmt(foundation.q_m)} unit="kPa" />
      <Pair label="q máx" value={fmt(foundation.q_max)} unit="kPa" />
      <Pair label="q mín" value={fmt(foundation.q_min)} unit="kPa" />
      <Pair label="qa (admissível)" value={fmt(foundation.qa)} unit="kPa" />
      <Pair
        label="r = qmax / |qmin|"
        value={isFinite(foundation.ratio_r) ? fmt(foundation.ratio_r) : '—'}
      />
      <Pair
        label="x = B / r"
        value={
          isFinite(foundation.x_comp_cm) ? fmt(foundation.x_comp_cm, 1) : '—'
        }
        unit="cm"
      />

      {/* Verificação geométrica B/2 > x */}
      <View style={styles.row}>
        <Text style={styles.k}>Condição geométrica: (B/2) &gt; x</Text>
        <Text style={styles.v}>
          <OK ok={!!checks.bearingOK} />
        </Text>
      </View>

      {/* Capacidade de carga qa > qmax */}
      <View style={styles.row}>
        <Text style={styles.k}>Capacidade de carga: qa &gt; qmax</Text>
        <Text style={styles.v}>
          <OK ok={foundation.qa > foundation.q_max} />
        </Text>
      </View>

      {/* DESLIZAMENTO */}
      <Text variant="titleMedium" style={styles.section}>
        Deslizamento
      </Text>
      <View style={styles.row}>
        <Text style={styles.k}>FS (deslizamento)</Text>
        <Text style={styles.v}>
          {fmt(checks.slidingFS)} <OK ok={checks.slidingFS >= 1.5} />
        </Text>
      </View>

      {/* BOTÃO: IR PARA DETALHAMENTO */}
      <Divider style={{ marginVertical: 16 }} />
      <Button
        mode="contained"
        onPress={() =>
          navigation.navigate('ResultsTabs', { screen: 'Detailing' })
        }
      >
        Ver detalhamento
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  section: { marginTop: 16, marginBottom: 6 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  k: { opacity: 0.75 },
  v: { fontWeight: '700' },
});