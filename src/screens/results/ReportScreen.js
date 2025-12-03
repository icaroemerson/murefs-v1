// src/screens/results/ReportScreen.js
import React, { useMemo } from 'react';
import { ScrollView, View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Divider } from 'react-native-paper';

import { useProject } from '../../state/ProjectContext';
import { computeLoads } from '../../utils/calcLoads';
import abacoFlexaoSimples from '../../data/abacos';

// === ks pelo ábaco kc–ks ===
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

const fmt = (v, d = 2) => {
  if (!isFinite(v)) return '—';
  const n = Math.round(v * Math.pow(10, d)) / Math.pow(10, d);
  return String(n).replace('.', ',');
};

export default function ReportScreen() {
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

  // ===== CÁLCULOS DE CARGAS / ESTABILIDADE =====
  const loadResult = useMemo(() => computeLoads(ctx), [ctx]);
  const { weights, pressures, moments, foundation, checks } = loadResult;

  // ===== DETALHAMENTO (mesma base do DetailingScreen) =====
  const Mt_real = moments.Mt || 0;   // kN·cm/m
  const Md = Mt_real * 1.4;          // kN·cm/m

  const dSapata = Number(ds) || 0;   // cm
  const cobr = 4;                    // cm (padrão, pode ligar ao contexto depois)
  const phiBarra = 1.0;              // 10 mm = 1 cm

  const dUtil = dSapata - cobr - 0.5 * phiBarra;
  const dUtilPos = dUtil > 0 ? dUtil : dSapata * 0.8;

  const kcNeeded = Md > 0 ? (100 * dUtilPos * dUtilPos) / Md : 0;
  const fck = 'C25';
  const steel = 'CA50';
  const ks = getKsFromAbaco(fck, steel, kcNeeded);

  const As_calc = dUtilPos > 0 ? ks * (Md / dUtilPos) : 0; // cm²/m
  const As_min = 0.0015 * 100 * dSapata;                   // cm²/m
  const As_adotada = Math.max(As_calc, As_min);

  // As distribuída = max(Asmín/2, As_adotada/5, 0,9)
  const As_dist = Math.max(As_min / 2, As_adotada / 5, 0.9);

  function handleGeneratePdf() {
    if (typeof window !== 'undefined' && window.print) {
      window.print();
    } else {
      Alert.alert(
        'Função indisponível',
        'A geração direta de PDF está disponível apenas na versão Web. No celular, utilize a captura de tela ou a impressão do próprio sistema.'
      );
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="titleLarge" style={{ marginBottom: 8 }}>
          Relatório de dimensionamento
        </Text>
        <Divider style={{ marginBottom: 12 }} />

        {/* 1. Entradas principais */}
        <Text style={styles.sectionTitle}>1. Entradas principais</Text>
        <Text style={styles.line}>Altura do muro H = {fmt(Number(H), 0)} cm</Text>
        <Text style={styles.line}>Espessura da cortina t_stem = {fmt(Number(tStem), 0)} cm</Text>
        <Text style={styles.line}>Largura da base B = {fmt(Number(bs), 0)} cm</Text>
        <Text style={styles.line}>Espessura da base d_s = {fmt(Number(ds), 0)} cm</Text>
        <Text style={styles.line}>Peso específico do solo γ = {fmt(Number(soilGamma), 0)} kN/m³</Text>
        <Text style={styles.line}>Ângulo de atrito φ = {fmt(Number(soilPhi), 0)}°</Text>
        <Text style={styles.line}>Tensão admissível qₐdₘ = {fmt(Number(soilQa), 0)} kPa</Text>
        <Text style={styles.line}>
          Presença de nível d&apos;água: {hasWaterTable ? 'Sim' : 'Não'}
        </Text>
        <Text style={styles.line}>
          Empuxo passivo considerado: {showPassive ? `Sim (hₚ = ${fmt(Number(hp), 0)} cm)` : 'Não'}
        </Text>

        {/* 2. Pesos e empuxos */}
        <Text style={styles.sectionTitle}>2. Pesos e empuxos</Text>
        <Text style={styles.line}>Peso da base W_base = {fmt(weights.W_base)} kN/m</Text>
        <Text style={styles.line}>Peso do muro W_stem = {fmt(weights.W_stem)} kN/m</Text>
        <Text style={styles.line}>Peso do solo ativo W_soil = {fmt(weights.W_soil_act)} kN/m</Text>
        <Text style={styles.line}>Peso total W_tot = {fmt(weights.W_tot)} kN/m</Text>
        <Text style={styles.line}>Empuxo ativo Ea = {fmt(pressures.E_a)} kN/m</Text>
        <Text style={styles.line}>Empuxo passivo Ep = {fmt(pressures.E_p)} kN/m</Text>

        {/* 3. Tombamento */}
        <Text style={styles.sectionTitle}>3. Verificação ao tombamento</Text>
        <Text style={styles.line}>Momento resistente Mr = {fmt(moments.Mr)} kN·cm/m</Text>
        <Text style={styles.line}>Momento de tombamento Mt = {fmt(moments.Mt)} kN·cm/m</Text>
        <Text style={styles.line}>
          FSₜ = Mr / Mt = {fmt(checks.overturningFS)}{' '}
          {checks.overturningFS >= 2.0 ? '≥ 2,0 → Atendida' : '→ Não atendida'}
        </Text>

        {/* 4. Fundação */}
        <Text style={styles.sectionTitle}>4. Verificação da fundação</Text>
        <Text style={styles.line}>Excentricidade e = {fmt(foundation.e, 1)} cm</Text>
        <Text style={styles.line}>q_média = {fmt(foundation.q_m)} kPa</Text>
        <Text style={styles.line}>q_max = {fmt(foundation.q_max)} kPa</Text>
        <Text style={styles.line}>q_min = {fmt(foundation.q_min)} kPa</Text>
        <Text style={styles.line}>
          r = q_max / |q_min| ={' '}
          {isFinite(foundation.ratio_r) ? fmt(foundation.ratio_r) : '—'}
        </Text>
        <Text style={styles.line}>
          x = B / r ={' '}
          {isFinite(foundation.x_comp_cm) ? `${fmt(foundation.x_comp_cm, 1)} cm` : '—'}
        </Text>
        <Text style={styles.line}>
          Condição geométrica (B/2) &gt; x:{' '}
          {checks.bearingOK ? 'Atendida' : 'Não atendida'}
        </Text>
        <Text style={styles.line}>
          Capacidade de carga qa &gt; q_max:{' '}
          {foundation.qa > foundation.q_max ? 'Atendida' : 'Não atendida'}
        </Text>

        {/* 5. Deslizamento */}
        <Text style={styles.sectionTitle}>5. Verificação ao deslizamento</Text>
        <Text style={styles.line}>
          FS (deslizamento) = {fmt(checks.slidingFS)}{' '}
          {checks.slidingFS >= 1.5 ? '≥ 1,5 → Atendida' : '→ Não atendida'}
        </Text>

        {/* 6. Detalhamento à flexão */}
        <Text style={styles.sectionTitle}>6. Detalhamento à flexão</Text>
        <Text style={styles.line}>Md = 1,4·Mt = {fmt(Md)} kN·cm/m</Text>
        <Text style={styles.line}>d útil ≅ {fmt(dUtilPos, 2)} cm</Text>
        <Text style={styles.line}>kc ≅ {fmt(kcNeeded, 2)}</Text>
        <Text style={styles.line}>ks (ábaco {fck}/{steel}) = {fmt(ks, 3)}</Text>
        <Text style={styles.line}>As(calculada) = {fmt(As_calc, 2)} cm²/m</Text>
        <Text style={styles.line}>Asmín = {fmt(As_min, 2)} cm²/m</Text>
        <Text style={styles.line}>As adotada = {fmt(As_adotada, 2)} cm²/m</Text>
        <Text style={styles.line}>
          As distribuída = max(Asmín/2, As/5, 0,9) = {fmt(As_dist, 2)} cm²/m
        </Text>

        {/* Aviso didático dentro do relatório */}
        <Divider style={{ marginVertical: 16 }} />
        <Text style={styles.warning}>
          Aviso: Este relatório foi gerado por um aplicativo com finalidade
          exclusivamente didática. Os resultados não devem ser utilizados, por
          si só, em projetos executivos ou obras reais. Os autores não se
          responsabilizam pelo uso indevido das informações aqui apresentadas.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleGeneratePdf}
          style={styles.footerButton}
        >
          Gerar relatório em PDF
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 4,
    fontWeight: '700',
  },
  line: {
    fontSize: 13,
    marginBottom: 2,
  },
  warning: {
    fontSize: 11,
    color: '#b91c1c',
    textAlign: 'justify',
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    backgroundColor: '#f3f4f6',
  },
  footerButton: {
    backgroundColor: '#6b21a8',
  },
});