// src/utils/calcLoads.js
// Entradas de geometria em cm; solo: γ(kN/m³), φ(graus), qa(kPa). Saídas conforme comentários.

const toNum = (v, def = 0) => {
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : Number(v);
  return Number.isFinite(n) ? n : def;
};

export function computeLoads({
  H, tStem, bs, ds,
  soilGamma, soilPhi, soilQa,
  hasWaterTable, // reservado para futuros ajustes de γ efetivo
  showPassive, hp,
  gammaConcrete = 25, // kN/m³
}) {
  // Normaliza entradas
  const Hn   = toNum(H);
  const t    = toNum(tStem);
  const B    = toNum(bs);
  const dS   = toNum(ds);
  const γ    = toNum(soilGamma, 18);
  const φdeg = toNum(soilPhi, 30);
  const qa   = toNum(soilQa, 200);
  const HP   = toNum(hp, 0);

  // Altura útil (acima da sapata)
  const Hnet = Math.max(0, Hn - dS);

  // Conversões
  const cm2_to_m2 = 1 / (100 * 100);

  // Pesos (kN/m)
  const A_base_cm2 = B * dS;
  const W_base = gammaConcrete * A_base_cm2 * cm2_to_m2;
  const x_base = B / 2; // cm

  const A_stem_cm2 = t * Hnet;
  const W_stem = gammaConcrete * A_stem_cm2 * cm2_to_m2;
  const x_stem = t / 2; // cm

  const larguraSoloAtivo = Math.max(B - t, 0);
  const A_soil_act_cm2 = larguraSoloAtivo * Hnet;
  const W_soil_act = γ * A_soil_act_cm2 * cm2_to_m2;
  const x_soil_act = t + (larguraSoloAtivo / 2); // cm

  // Coeficientes de empuxo (Rankine)
  const Ka = Math.tan((Math.PI / 4) - ( (φdeg * Math.PI/180) / 2 )) ** 2;
  const Kp = 1 / Ka;

  // Empuxos (kN/m) – usando alturas em metros
  const E_a = 0.5 * γ * Ka * (Hnet/100) ** 2;

  let E_p = 0;
  if (showPassive && HP > dS) {
    E_p = 0.5 * γ * Kp * (HP/100) ** 2;
  }

  // Resultantes (para momentos)
  const z_a = dS + (Hnet / 3); // cm
  const z_p = showPassive && HP > dS ? dS + (HP / 3) : 0; // cm

  // Soma de pesos
  const W_tot = W_base + W_stem + W_soil_act;

  // Momentos (kN·cm/m) sobre a aresta esquerda
  const Mr = (W_soil_act * x_soil_act) + (W_base * x_base) + (W_stem * x_stem);
  const Mt = (E_a * z_a) - (E_p * z_p);

  // Excentricidade (cm)
  const e = W_tot > 0 ? (Mr - Mt) / W_tot : 0;

  // Tensão média (kPa) — B em metros
  const Bm = B / 100;
  const q_m = Bm > 0 ? (W_tot / Bm) : 0; // kN/m por m = kN/m² = kPa

  // Parabola retangular (Winkler) — sem exigir qmin ≥ 0
  const q_max = q_m * (1 + (Bm > 0 ? (6 * (e/100) / Bm) : 0));
  const q_min = q_m * (1 - (Bm > 0 ? (6 * (e/100) / Bm) : 0));

  // Deslizamento
  const slidingFS = (E_a - E_p) !== 0
    ? (W_tot * Math.tan((φdeg * Math.PI)/180)) / (E_a - E_p)
    : Infinity;

  // Tombamento
  const overturningFS = Mt !== 0 ? (Mr / Mt) : Infinity;

  // Verificação de fundação (critério solicitado):
  // r = qmax / |qmin| ; x = B / r (cm)
const abs_qmin = Math.abs(q_min);
let r = Infinity;
if (abs_qmin > 1e-9) r = q_max / abs_qmin;

const x_comp_cm = (Number.isFinite(r) && r > 0) ? (B / r) : Infinity;

// ➜ Agora a condição tem DOIS critérios:
// 1) (B/2) > x   e   2) q_max <= qa
const bearingByEcc = (B / 2) > x_comp_cm;
const bearingByQa  = q_max <= qa;
const bearingOK    = bearingByEcc && bearingByQa;
  // Nota: qa (kPa) segue mostrado para referência; você pode cruzar depois com outro critério se quiser.

  return {
    inputs: {
      H: Hn, tStem: t, bs: B, ds: dS,
      soilGamma: γ, soilPhi: φdeg, soilQa: qa,
      hasWaterTable, showPassive, hp: HP
    },
    weights: { W_base, x_base, W_stem, x_stem, W_soil_act, x_soil_act, W_tot },
    pressures: { E_a, E_p },
    moments: { Mr, Mt },
    foundation: {
      e, q_m, q_max, q_min, qa,
      ratio_r: r, x_comp_cm, B_half_cm: B/2,
    },
    checks: {
      slidingFS,
      overturningFS,
      bearingOK,
    },
    Ka,
  };
}
