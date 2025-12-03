// src/screens/results/CalculationScreen.js
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Divider } from 'react-native-paper';

import { useProject } from '../../state/ProjectContext';
import { computeLoads } from '../../utils/calcLoads';
import abacoFlexaoSimples from '../../data/abacos';
import tabela14 from '../../data/tabela14';

const fmt = (v, d = 2) => {
  if (!isFinite(v)) return '—';
  const n = Math.round(v * 10 ** d) / 10 ** d;
  return String(n).replace('.', ',');
};

function getKsFromAbaco(concrete = 'C25', steel = 'CA50', kcNeeded = 0) {
  if (!kcNeeded || !isFinite(kcNeeded)) return 0.024;
  for (const row of abacoFlexaoSimples) {
    const kcRow = row.kc?.[concrete];
    if (kcRow && kcRow >= kcNeeded) {
      return row.ks?.[steel] ?? 0.024;
    }
  }
  const last = abacoFlexaoSimples[abacoFlexaoSimples.length - 1];
  return last?.ks?.[steel] ?? 0.024;
}

export default function CalculationScreen() {
  const ctx = useProject();
  const {
    H,
    tStem,
    bs,
    ds,
    soilGamma,
    soilPhi,
    soilQa,
    hasWaterTable,
    showPassive,
    hp,
  } = ctx;

  const result = useMemo(() => computeLoads(ctx), [ctx]);
  const { weights, pressures, moments, foundation, checks } = result;

  // ===== DETALHAMENTO (mesma lógica do DetailingScreen, mas sem desenho) =====
  const Hn = Number(H) || 0;
  const t = Number(tStem) || 0;
  const B = Number(bs) || 0;
  const dSapata = Number(ds) || 0;

  const fck = 'C25';
  const steel = 'CA50';
  const cobr = 4;
  const phi = 1.0;

  const realMt = moments.Mt || 0;
  const Md = realMt * 1.4;

  const dUtil = dSapata - cobr - 0.5 * phi;
  const dUtilPos = dUtil > 0 ? dUtil : dSapata * 0.8;

  const kcNeeded = Md > 0 ? (100 * dUtilPos * dUtilPos) / Md : 0;
  const ks = getKsFromAbaco(fck, steel, kcNeeded);

  const As = dUtilPos > 0 ? ks * (Md / dUtilPos) : 0; // cm²/m
  const AsMin = 0.0015 * 100 * dSapata;               // cm²/m
  const AsAdotada = Math.max(As, AsMin);

  const AsDist = Math.max(
    AsMin / 2,
    As / 5,
    0.9
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="titleLarge">Cálculos detalhados</Text>
      <Divider style={{ marginVertical: 12 }} />

      {/* Dados de entrada resumidos */}
      <Text variant="titleMedium" style={styles.section}>Entradas principais</Text>
      <Text>Altura H = {H} cm</Text>
      <Text>Espessura cortina t_stem = {tStem} cm</Text>
      <Text>Largura base B = {bs} cm</Text>
      <Text>Espessura base d_s = {ds} cm</Text>
      <Text>Peso específico solo γ = {soilGamma} kN/m³</Text>
      <Text>Ângulo de atrito φ = {soilPhi}°</Text>
      <Text>q_adm = {soilQa} kPa</Text>
      <Text>Lençol freático: {hasWaterTable ? 'Sim' : 'Não'}</Text>
      <Text>Empuxo passivo: {showPassive ? `Sim (h_p = ${hp} cm)` : 'Não'}</Text>

      {/* Pesos */}
      <Text variant="titleMedium" style={styles.section}>Pesos</Text>
      <Text>
        Peso base W_base = γ_conc · B · d_s → {fmt(weights.W_base)} kN/m
      </Text>
      <Text>
        Peso muro (cortina) W_stem = γ_conc · (H - d_s) · t_stem → {fmt(weights.W_stem)} kN/m
      </Text>
      <Text>
        Peso solo W_soil = γ_solo · (H - d_s) · (B - t_stem) → {fmt(weights.W_soil_act)} kN/m
      </Text>
      <Text>
        Peso total W_tot = W_base + W_stem + W_soil → {fmt(weights.W_tot)} kN/m
      </Text>

      {/* Empuxos */}
      <Text variant="titleMedium" style={styles.section}>Empuxos</Text>
      <Text>
        k_a = tg²(45° - φ/2) → Ea = (γ_solo/2) · k_a · (H - d_s)² = {fmt(pressures.E_a)} kN/m
      </Text>
      <Text>
        Empuxo passivo (se houver): Ep = (γ_solo/2) · k_p · h_p² = {fmt(pressures.E_p)} kN/m
      </Text>

      {/* Momentos */}
      <Text variant="titleMedium" style={styles.section}>Momentos</Text>
      <Text>
        Momento resistente: Mr = W_soil · x_soil + W_base · x_base + W_stem · x_stem = {fmt(moments.Mr)} kN·cm/m
      </Text>
      <Text>
        Momento de tombamento: Mt = Ea · z_a - Ep · z_p = {fmt(moments.Mt)} kN·cm/m
      </Text>
      <Text>
        Fator de segurança ao tombamento: FS_t = Mr / Mt = {fmt(checks.overturningFS)}
      </Text>

      {/* Fundação */}
      <Text variant="titleMedium" style={styles.section}>Fundação</Text>
      <Text>
        Excentricidade: e = (Mr - Mt) / W_tot = {fmt(foundation.e, 1)} cm
      </Text>
      <Text>
        q_média = W_tot / B = {fmt(foundation.q_m)} kPa
      </Text>
      <Text>
        q_max = q_média · (1 + 6e/B) = {fmt(foundation.q_max)} kPa
      </Text>
      <Text>
        q_min = q_média · (1 - 6e/B) = {fmt(foundation.q_min)} kPa
      </Text>
      <Text>
        Verificação geométrica: (B/2) &gt; x → {checks.bearingOK ? 'OK' : 'NÃO OK'}
      </Text>
      <Text>
        Verificação capacidade de carga: q_adm &gt; q_max ?
      </Text>
      <Text>
        → q_adm = {fmt(foundation.qa)} kPa, q_max = {fmt(foundation.q_max)} kPa
      </Text>

      {/* Deslizamento */}
      <Text variant="titleMedium" style={styles.section}>Deslizamento</Text>
      <Text>
        Força resistente ao deslizamento: R = W_tot · tg(φ_base)
      </Text>
      <Text>
        Fator de segurança ao deslizamento: FS_d = R / Ea = {fmt(checks.slidingFS)}
      </Text>

      {/* Detalhamento – cálculos */}
      <Text variant="titleMedium" style={styles.section}>Detalhamento à flexão</Text>
      <Text>
        Momento de projeto: Md = 1,4 · Mt = {fmt(Md)} kN·cm/m
      </Text>
      <Text>
        d útil: d = d_s - cobr - 0,5φ = {fmt(dUtilPos, 1)} cm
      </Text>
      <Text>
        kc = 100 · d² / Md = {fmt(kcNeeded, 2)}
      </Text>
      <Text>
        ks (ábaco) para {fck}/{steel} = {fmt(ks, 3)}
      </Text>
      <Text>
        As(calc) = ks · (Md / d) = {fmt(As, 2)} cm²/m
      </Text>
      <Text>
        Asmín = 0,15% · 100 · d_s = {fmt(AsMin, 2)} cm²/m
      </Text>
      <Text style={{ fontWeight: '700' }}>
        As adotada = max(As, Asmín) = {fmt(AsAdotada, 2)} cm²/m
      </Text>
      <Text style={{ fontWeight: '700', marginTop: 4 }}>
        As distribuída = max(Asmín/2, As/5, 0,9) = {fmt(AsDist, 2)} cm²/m
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  section: {
    marginTop: 16,
    marginBottom: 6,
    fontWeight: '700',
  },
});