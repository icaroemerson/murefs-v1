// src/screens/results/DetailingScreen.js
import React, { useMemo, useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { Text, Divider, TextInput } from 'react-native-paper';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';

import { useProject } from '../../state/ProjectContext';
import { computeLoads } from '../../utils/calcLoads';
import abacoFlexaoSimples from '../../data/abacos';
import tabela14 from '../../data/tabela14';

// Normaliza texto "c25", " C 30 " -> "C25", "C30"
function normalizeConcrete(txt) {
  if (!txt) return 'C25';
  const t = txt.toUpperCase().replace(/\s+/g, '');
  // se não começar com C + número, cai no padrão
  if (!/^C\d+/.test(t)) return 'C25';
  return t;
}

// Normaliza texto "ca50", " CA 60 " -> "CA50", "CA60"
function normalizeSteel(txt) {
  if (!txt) return 'CA50';
  const t = txt.toUpperCase().replace(/\s+/g, '');
  if (!/^CA\d+/.test(t)) return 'CA50';
  return t;
}

// pega ks do ábaco (abacos.js)
function getKsFromAbaco(concreteKey = 'C25', steelKey = 'CA50', kcNeeded = 0) {
  if (!kcNeeded || !isFinite(kcNeeded) || kcNeeded <= 0) return 0.024;

  for (const row of abacoFlexaoSimples) {
    const kcRow = row.kc?.[concreteKey];
    if (kcRow && kcRow >= kcNeeded) {
      const ks = row.ks?.[steelKey];
      if (ks) return ks;
      return 0.024;
    }
  }

  const last = abacoFlexaoSimples[abacoFlexaoSimples.length - 1];
  return last?.ks?.[steelKey] ?? 0.024;
}

const fmt = (v, d = 2) => {
  if (!isFinite(v)) return '—';
  const n = Math.round(v * 10 ** d) / 10 ** d;
  return String(n).replace('.', ',');
};

export default function DetailingScreen() {
  const ctx = useProject();
  const { H, tStem, bs, ds } = ctx;

  // ====== campos para digitar concreto, aço e cobrimento ======
  const [concreteText, setConcreteText] = useState('C25');
  const [steelText, setSteelText] = useState('CA50');
  const [coverText, setCoverText] = useState('4'); // cm

  const concreteKey = useMemo(
    () => normalizeConcrete(concreteText),
    [concreteText],
  );
  const steelKey = useMemo(
    () => normalizeSteel(steelText),
    [steelText],
  );

  // converte cobrimento
  const cobr = (() => {
    const num = Number((coverText || '').replace(',', '.'));
    if (!isFinite(num) || num <= 0) return 4;
    return num;
  })();

  // ========= GEOMETRIA =========
  const Hn = Number(H) || 0;
  const t = Number(tStem) || 0;
  const B = Number(bs) || 0;
  const dSapata = Number(ds) || 0;

  // ========= CARGAS / MOMENTOS REAIS =========
  const loadResult = useMemo(() => computeLoads(ctx), [ctx]);
  const realMt = loadResult?.moments?.Mt || 0; // kN·cm/m

  // momento de projeto
  const Md = realMt * 1.4; // kN·cm/m

  // diâmetro de referência (10 mm = 1 cm)
  const phi_cm = 1.0;

  // d útil = ds - cobrimento - 0,5 φ
  const dUtil = dSapata - cobr - 0.5 * phi_cm;
  const dUtilPos = dUtil > 0 ? dUtil : dSapata * 0.8;

  // kc = (100 * d^2) / Md
  const kcNeeded = Md > 0 ? (100 * dUtilPos * dUtilPos) / Md : 0;

  // ks pelo ábaco (usando concreto e aço digitados)
  const ks = getKsFromAbaco(concreteKey, steelKey, kcNeeded);

  // As = ks * (Md / d)
  const AsCalc = dUtilPos > 0 ? ks * (Md / dUtilPos) : 0; // cm²/m

  // Asmín = 0,15% * 100 * ds
  const AsMin = 0.0015 * 100 * dSapata; // cm²/m
  const AsAdotada = Math.max(AsCalc, AsMin);

  // ========= ÁREA DE AÇO DISTRIBUÍDO =========
  // As_dist = max( Asmín/2 ; Asadotada/5 ; 0,9 cm²/m )
  const AsDist1 = AsMin / 2;
  const AsDist2 = AsAdotada / 5;
  const AsDist3 = 0.9;
  const AsDistribuida = Math.max(AsDist1, AsDist2, AsDist3);

  // ========= COMBINAÇÕES TABELA 1.4 =========
  const opcoesDetalhe = tabela14
    .filter(item => isFinite(item.area))
    .filter(item => item.area >= AsAdotada)
    .sort((a, b) => a.area - b.area)
    .slice(0, 3);

  const fallbackOption = { diam: 10, s: 15, area: AsAdotada };
  const efetivas = opcoesDetalhe.length > 0 ? opcoesDetalhe : [fallbackOption];

  const [selectedIndex, setSelectedIndex] = useState(0);
  const combinacaoEscolhida = efetivas[Math.min(selectedIndex, efetivas.length - 1)];

  // ========= DESENHO (perfil L para a direita) =========
  const svgWidth = 320;
  const svgHeight = 220;

  const escala = Hn ? 140 / Hn : 0.4;
  const basepx = B * escala;
  const stempx = Hn * escala;
  const stemThickPx = t * escala;
  const baseThickPx = dSapata * escala;

  const offsetX = (svgWidth - basepx) / 2;
  const groundY = 180;
  const baseTopY = groundY - baseThickPx;

  // cortina na direita → L virado para o solo à direita
  const stemLeftX = offsetX + (basepx - stemThickPx);
  const stemTopY = baseTopY - stempx;

  const numBarrasBase = 5;
  const espHoriz = basepx / (numBarrasBase + 1);

  const numBarrasStem = 5;
  const espVert = stempx / (numBarrasStem + 1);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="titleLarge">Detalhamento</Text>
      <Divider style={{ marginVertical: 12 }} />

      {/* ENTRADAS: CONCRETO, AÇO, COBRIMENTO */}
      <Text variant="titleMedium" style={{ marginBottom: 8 }}>
        Materiais
      </Text>

      <TextInput
        label="Classe do concreto (ex.: C25)"
        mode="outlined"
        value={concreteText}
        onChangeText={setConcreteText}
        style={{ marginBottom: 8 }}
      />

      <TextInput
        label="Tipo de aço (ex.: CA50)"
        mode="outlined"
        value={steelText}
        onChangeText={setSteelText}
        style={{ marginBottom: 8 }}
      />

      <TextInput
        label="Cobrimento (cm)"
        mode="outlined"
        value={coverText}
        onChangeText={setCoverText}
        keyboardType="numeric"
        style={{ marginBottom: 4 }}
        right={<TextInput.Affix text="cm" />}
      />

      <Text style={{ marginBottom: 8, fontSize: 12, color: '#b91c1c' }}>
        * Atenção: cobrimentos menores que o mínimo da NBR 6118 não são recomendados.
      </Text>

      <Divider style={{ marginVertical: 8 }} />

      {/* RESUMO FLEXÃO */}
      <Text variant="bodyMedium">
        Mt (real) = {fmt(realMt)} kN·cm/m → Md = 1,4·Mt = {fmt(Md)} kN·cm/m
      </Text>
      <Text variant="bodyMedium">
        d = {fmt(dUtilPos, 1)} cm | kc ≅ {fmt(kcNeeded, 2)} | ks = {fmt(ks, 3)}
      </Text>
      <Text variant="bodyMedium">
        As(calc) = {fmt(AsCalc, 2)} cm²/m | Asmín = {fmt(AsMin, 2)} cm²/m
      </Text>
      <Text variant="bodyMedium" style={{ fontWeight: '700' }}>
        As adotada = {fmt(AsAdotada, 2)} cm²/m
      </Text>
      <Text variant="bodyMedium" style={{ fontWeight: '700', marginBottom: 10 }}>
        As distribuída = {fmt(AsDistribuida, 2)} cm²/m
      </Text>

      {/* COMBINAÇÕES TABELA 1.4 */}
      <Text variant="titleSmall" style={{ marginTop: 6, marginBottom: 4 }}>
        Combinações que atendem (Tabela 1.4)
      </Text>

      {efetivas.map((opt, idx) => {
        const selecionada = idx === selectedIndex;
        return (
          <View
            key={`${opt.diam}-${opt.s}-${idx}`}
            style={[
              styles.comboRow,
              selecionada && styles.comboRowSelected,
            ]}
          >
            <Text style={{ flex: 1 }}>
              {idx + 1}. φ {opt.diam} c/{opt.s} → {fmt(opt.area, 2)} cm²/m
            </Text>
            <Text
              style={styles.comboSelect}
              onPress={() => setSelectedIndex(idx)}
            >
              {selecionada ? 'Usando' : 'Usar'}
            </Text>
          </View>
        );
      })}

      {/* DESENHO ESQUEMÁTICO */}
      <Text variant="labelMedium" style={{ marginTop: 12, marginBottom: 6 }}>
        Representação esquemática (perfil L)
      </Text>

      <Svg width={svgWidth} height={svgHeight} style={{ backgroundColor: '#fff' }}>
        {/* base do muro */}
        <Rect
          x={offsetX}
          y={baseTopY}
          width={basepx}
          height={baseThickPx}
          fill="#d1d5db"
          stroke="#4b5563"
          strokeWidth={1}
        />

        {/* cortina à direita */}
        <Rect
          x={stemLeftX}
          y={stemTopY}
          width={stemThickPx}
          height={stempx}
          fill="#e5e7eb"
          stroke="#4b5563"
          strokeWidth={1}
        />

        {/* barras base (esquemático) */}
        {Array.from({ length: numBarrasBase }).map((_, i) => {
          const bx = offsetX + espHoriz * (i + 1);
          const by = groundY - 4;
          return (
            <Line
              key={`base-bar-${i}`}
              x1={bx}
              y1={by}
              x2={bx}
              y2={baseTopY + 4}
              stroke="#dc2626"
              strokeWidth={2}
            />
          );
        })}

        {/* barras cortina (esquemático) */}
        {Array.from({ length: numBarrasStem }).map((_, i) => {
          const by = stemTopY + espVert * (i + 1);
          const bx = stemLeftX + stemThickPx / 2;
          return (
            <Line
              key={`stem-bar-${i}`}
              x1={bx - 5}
              y1={by}
              x2={bx + 5}
              y2={by}
              stroke="#dc2626"
              strokeWidth={2}
            />
          );
        })}

        {/* legenda com combinação escolhida */}
        <SvgText
          x={offsetX + basepx + 6}
          y={baseTopY + 12}
          fontSize="10"
          fill="#111827"
        >
          {`φ ${combinacaoEscolhida.diam} c/${combinacaoEscolhida.s}`}
        </SvgText>
      </Svg>

      <Text style={{ marginTop: 10, opacity: 0.7, fontSize: 12 }}>
        * Concreto, aço e cobrimento digitados aqui alimentam o ábaco (kc/ks) e
        toda a rotina de dimensionamento.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  comboRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 4,
  },
  comboRowSelected: {
    backgroundColor: '#e0f2fe',
  },
  comboSelect: {
    fontWeight: '700',
    color: '#2563eb',
  },
});