// src/screens/CalculationScreen.js
import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { useProject } from '../state/ProjectContext';

// ===== unidades =====
const cmToM = (v) => Number(v ?? 0) / 100;

// ===== empuxos (Rankine) =====
const deg2rad = (x) => (x * Math.PI) / 180;
const Ka_Rankine = (phi_deg) => {
  const phi = deg2rad(phi_deg);
  return (1 - Math.sin(phi)) / (1 + Math.sin(phi));
};
const Kp_Rankine = (phi_deg) => {
  const phi = deg2rad(phi_deg);
  return (1 + Math.sin(phi)) / (1 - Math.sin(phi));
};

function earthPressureActive({ H_m, gamma, phi_deg, q_kPa = 0 }) {
  const Ka = Ka_Rankine(phi_deg);
  const Ea_triangle = 0.5 * Ka * gamma * H_m ** 2;   // kN/m
  const Ea_rect = Ka * q_kPa * H_m;                  // kN/m
  const Ea = Ea_triangle + Ea_rect;                  // kN/m
  const y = (Ea_triangle * (H_m / 3) + Ea_rect * (H_m / 2)) / (Ea || 1);
  const p_base = Ka * gamma * H_m + Ka * q_kPa;      // kPa
  return { Ea, y, p_base, Ka };
}
function earthPressurePassive({ Hp_m, gamma, phi_deg }) {
  const Kp = Kp_Rankine(phi_deg);
  const Ep = 0.5 * Kp * gamma * (Hp_m ** 2);         // kN/m
  const y = Hp_m / 3;
  return { Ep, y, Kp };
}

// ===== estabilidade global =====
function weightsAndLevers({ H_m, stem_t_m, toe_b_m, heel_b_m, gamma_c = 24 }) {
  const W_stem = gamma_c * stem_t_m * H_m;
  const x_stem = toe_b_m + stem_t_m / 2;

  const W_toe = gamma_c * toe_b_m * stem_t_m;
  const x_toe = toe_b_m / 2;

  const W_heel = gamma_c * heel_b_m * stem_t_m;
  const x_heel = toe_b_m + stem_t_m + heel_b_m / 2;

  const W = W_stem + W_toe + W_heel;
  const xW = (W_stem * x_stem + W_toe * x_toe + W_heel * x_heel) / (W || 1);
  return { W, xW };
}
function overturningFS({ Ea, yEa, W, xW, toeOrigin = 0 }) {
  const Mt = Ea * yEa;
  const Mr = W * (xW - toeOrigin);
  return { FS_tomb: Mr / (Mt || 1e-9), Mt, Mr };
}
function slidingFS({ W, Ea, mu_base = 0.55, cohesion_base = 0, baseB_m, Ep = 0 }) {
  const S = mu_base * W + cohesion_base * baseB_m;
  return { FS_desl: (S + Ep) / (Ea || 1e-9), S };
}
function basePressures({ W, Ea, yEa, baseB_m, xW }) {
  const V = W;
  const M = Ea * yEa - W * (xW - baseB_m / 2);
  const e = M / (V || 1e-9);
  const withinCore = Math.abs(e) <= baseB_m / 6;
  let sigmaMax, sigmaMin;
  if (withinCore) {
    sigmaMax = (V / baseB_m) * (1 + (6 * e) / baseB_m);
    sigmaMin = (V / baseB_m) * (1 - (6 * e) / baseB_m);
  } else {
    const Bp = baseB_m - 2 * Math.abs(e);
    sigmaMax = (2 * V) / (3 * Math.max(Bp, 1e-6));
    sigmaMin = 0;
  }
  return { e, withinCore, sigmaMax, sigmaMin };
}
function bearingCapacity({ phi_deg, c_kPa = 0, gamma_f, q_overburden = 0, B_m, e_m }) {
  const phi = deg2rad(phi_deg);
  const Nq = Math.exp(Math.PI * Math.tan(phi)) * Math.tan(Math.PI / 4 + phi / 2) ** 2;
  const Nc = (Nq - 1) / Math.tan(phi || 1e-6);
  const Nγ = 2 * (Nq + 1) * Math.tan(phi);
  const Bp = Math.max(1e-3, B_m - 2 * Math.abs(e_m));
  const qmax = c_kPa * Nc + q_overburden * Nq + 0.5 * gamma_f * Bp * Nγ; // kPa
  return { qmax, Nc, Nq, Nγ, Bp };
}

// ===== adaptador p/ seu ProjectContext atual =====
function mapFromProjectState(rawState) {
  const num = (x, def = 0) => (x === '' || x == null ? def : Number(x));
  return {
    H_cm: num(rawState.wallHeight ?? rawState.H ?? 300),
    elev_cm: num(rawState.elevation ?? 50),
    baseB_cm: num(rawState.baseLength ?? rawState.baseB ?? 150),
    stem_t_cm: num(rawState.stemWidth ?? rawState.stem_t ?? 24),
    toe_b_cm: num(rawState.toeWidth ?? rawState.toe_b ?? 50),
    heel_b_cm: num(rawState.heelWidth ?? rawState.heel_b ?? 76),

    gamma: num(rawState.soilWeight ?? rawState.gamma ?? 18),            // kN/m³
    phi_deg: num(rawState.soilFriction ?? rawState.phi_deg ?? 30),      // °
    cohesion_kPa: num(rawState.soilCohesion ?? 0),                      // kPa
    surcharge_q: num(rawState.load ?? rawState.surcharge_q ?? 0),       // kPa
    hasPassive: Boolean(rawState.hasPassiveSoil ?? rawState.hasPassive ?? true),
  };
}

export default function CalculationScreen() {
  const { state } = useProject();

  const res = useMemo(() => {
    const S = mapFromProjectState(state);
    const H_m   = cmToM(S.H_cm);
    const B_m   = cmToM(S.baseB_cm);
    const toe_m = cmToM(S.toe_b_cm);
    const t_m   = cmToM(S.stem_t_cm);
    const heel_m= cmToM(S.heel_b_cm);

    const Ea = earthPressureActive({ H_m, gamma: S.gamma, phi_deg: S.phi_deg, q_kPa: S.surcharge_q });
    const EpObj = S.hasPassive
      ? earthPressurePassive({ Hp_m: cmToM(S.elev_cm), gamma: S.gamma, phi_deg: S.phi_deg })
      : { Ep: 0, y: 0 };

    const Wset = weightsAndLevers({ H_m, stem_t_m: t_m, toe_b_m: toe_m, heel_b_m: heel_m });

    const OT = overturningFS({ Ea: Ea.Ea, yEa: Ea.y, W: Wset.W, xW: Wset.xW });
    const SL = slidingFS({ W: Wset.W, Ea: Ea.Ea, mu_base: 0.55, cohesion_base: 0, baseB_m: B_m, Ep: EpObj.Ep });
    const BP = basePressures({ W: Wset.W, Ea: Ea.Ea, yEa: Ea.y, baseB_m: B_m, xW: Wset.xW });
    const BC = bearingCapacity({ phi_deg: S.phi_deg, c_kPa: S.cohesion_kPa || 0, gamma_f: S.gamma, q_overburden: 0, B_m, e_m: BP.e });

    return { S, Ea, EpObj, Wset, OT, SL, BP, BC };
  }, [state]);

  return (
    <ScrollView contentContainerStyle={{ padding: 12 }}>
      <Text variant="titleLarge">Empuxos (Rankine)</Text>
      <Text>Ka: {res.Ea.Ka.toFixed(3)}</Text>
      <Text>Ea (kN/m): {res.Ea.Ea.toFixed(2)} — aplica a y = {res.Ea.y.toFixed(2)} m</Text>
      {res.S.hasPassive ? <Text>Ep (kN/m): {res.EpObj.Ep.toFixed(2)}</Text> : null}

      <Divider style={{ marginVertical: 8 }} />

      <Text variant="titleLarge">Estabilidade</Text>
      <Text>FS tombamento: {res.OT.FS_tomb.toFixed(2)}</Text>
      <Text>FS deslizamento: {res.SL.FS_desl.toFixed(2)}</Text>
      <Text>e (m): {res.BP.e.toFixed(4)} — núcleo central? {res.BP.withinCore ? 'OK' : 'Fora'}</Text>
      <Text>σmax (kPa): {res.BP.sigmaMax.toFixed(1)} — σmin (kPa): {res.BP.sigmaMin.toFixed(1)}</Text>

      <Divider style={{ marginVertical: 8 }} />

      <Text variant="titleLarge">Base (capacidade de carga)</Text>
      <Text>B’ (m): {res.BC.Bp.toFixed(3)}</Text>
      <Text>qmax suportável (kPa): {res.BC.qmax.toFixed(0)}</Text>

      <View style={{ height: 24 }} />
      <Text style={{ opacity: 0.6 }}>* Próximo: conectar esforços internos (Mu/Vu) para Detalhamento (NBR 6118/6114).</Text>
    </ScrollView>
  );
}
