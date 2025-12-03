// Núcleo de cálculo para muro perfil L conforme regras que você especificou.
// Entradas em cm e kN/m³; saídas em kN/m e kN·cm/m onde indicado.
// Arredondamento “para cima” com uma casa (ceil1).

function ceil1(x) {
  const v = Number(x) || 0;
  return Math.ceil(v * 10) / 10;
}

export function computeLoadsAndChecks(input) {
  const {
    wallHeight, baseWidth, baseThick, stemThickness,
    soilUnitWeight, soilUnitWeightSat, soilFrictionAngle,
    waterTable, hasPassiveSoil, passiveHeight,
    gammaConcrete = 25, // kN/m³
    bearingCapacity = 200, // kPa
  } = input;

  // Conversões e sanitização
  const h_cm  = Number(wallHeight) || 0;
  const bs_cm = Number(baseWidth) || 0;
  const ds_cm = Number(baseThick) || 0;
  const do_cm = Number(stemThickness) || 0;
  const hp_cm = Number(passiveHeight) || 0;

  const phi_deg = Number(soilFrictionAngle) || 0;
  const gamma_s   = Number(soilUnitWeight) || 0;
  const gamma_sat = Number(soilUnitWeightSat) || 0;

  // Altura útil (ativa) = h - ds
  const h_eff_cm = Math.max(0, h_cm - ds_cm);
  const h_eff_m  = h_eff_cm / 100;

  // Largura solo sobre base = bs - do (cm)
  const b_soil_cm = Math.max(0, bs_cm - do_cm);

  // Empuxo: γ efetivo
  const gamma_eff = waterTable ? Math.max(0, gamma_sat - 9.81) : gamma_s;

  // Ka Rankine: tan^2(45 - φ/2)
  const Ka = Math.tan(((45 - phi_deg / 2) * Math.PI) / 180) ** 2;

  // Pesos (kN/m) — áreas em m² * 1 m
  // Base: área = bs * ds (cm²)
  const A_base_m2 = (bs_cm / 100) * (ds_cm / 100);
  const W_base = ceil1(gammaConcrete * A_base_m2);

  // Muro (fuste): área = do * (h - ds) (cm²)
  const A_wall_m2 = (do_cm / 100) * (h_eff_cm / 100);
  const W_wall = ceil1(gammaConcrete * A_wall_m2);

  // Solo: área = (bs - do) * (h - ds)
  const A_soil_m2 = (b_soil_cm / 100) * (h_eff_cm / 100);
  const W_soil = ceil1(gamma_eff * A_soil_m2);

  const PT = ceil1(W_base + W_wall + W_soil);

  // Empuxos (kN/m)
  // Ativo: E = 0.5 * γ_eff * Ka * h_eff^2
  const E_active = ceil1(0.5 * gamma_eff * Ka * (h_eff_m ** 2));

  // Passivo (pela sua regra: mesma fórmula com a altura hp; quando aplicável)
  const hp_m = Math.max(0, hp_cm) / 100;
  const E_passive = hasPassiveSoil && hp_cm > ds_cm
    ? ceil1(0.5 * gamma_eff * Ka * (hp_m ** 2))
    : 0;

  // Alavancas para Mo (tombamento) pela sua definição:
  // Mo = Ea * (h_eff/3) - Ep * (hp/3)
  const Mo_kNcm = ceil1(
    (E_active * (h_eff_cm / 3)) - (E_passive * (hp_cm / 3))
  );

  // Momentos Resistentes (kN·cm/m):
  // Base: centróide = bs/2
  const arm_base_cm = bs_cm / 2;
  // Muro: centróide = do/2 (como você definiu)
  const arm_wall_cm = do_cm / 2;
  // Solo: centróide = do + bs/2
  const arm_soil_cm = do_cm + bs_cm / 2;

  const Mr_kNcm = ceil1(
    (W_base * arm_base_cm) +
    (W_wall * arm_wall_cm) +
    (W_soil * arm_soil_cm)
  );

  // Fatores de segurança
  // Deslizamento: (PT * tan φ) / Ea
  const FS_sliding_raw = E_active > 0
    ? (PT * Math.tan((phi_deg * Math.PI) / 180)) / E_active
    : Infinity;
  const FS_sliding = ceil1(FS_sliding_raw);

  // Tombamento: Mr/Mo
  const FS_overturning_raw = Mo_kNcm > 0 ? Mr_kNcm / Mo_kNcm : Infinity;
  const FS_overturning = ceil1(FS_overturning_raw);

  // Fundação
  // e (m) = (Mr - Mo)/PT, usando kN·cm / (kN/m) = (cm·m)
  // Para coerência, converter Mr, Mo para kN·m/m (dividindo por 100) antes:
  const Mr_kNm = Mr_kNcm / 100;
  const Mo_kNm = Mo_kNcm / 100;
  const e_m = PT > 0 ? (Mr_kNm - Mo_kNm) / PT : 0;

  const bs_m = bs_cm / 100;
  const q_avg = bs_m > 0 ? ceil1(PT / bs_m) : 0; // kPa (= kN/m²)

  const q_max = ceil1(q_avg * (1 + ((6 * e_m) / bs_m)));
  const q_min = ceil1(q_avg * (1 - ((6 * e_m) / bs_m)));

  const ratio_q = (q_min > 0) ? ceil1(q_max / q_min) : null;
  const x_m = (ratio_q && ratio_q > 0) ? (bs_m / ratio_q) : null;

  // Critérios
  const slidingOK = FS_sliding >= 1.5;
  const overtOK   = FS_overturning >= 2.0;
  const bearingOK = q_max <= Number(bearingCapacity || 0);

  const warnings = [];
  if (!(hasPassiveSoil && hp_cm > ds_cm) && hasPassiveSoil) {
    warnings.push('Altura do terreno passivo ≤ espessura da base: não há empuxo passivo efetivo.');
  }
  if (q_min < 0) {
    warnings.push('Tensão mínima tracionada (q_min < 0). Verifique excentricidade/apoio.');
  }
  if (x_m != null && x_m > 0.5 * bs_m) {
    warnings.push('Resultante fora do núcleo central (x > 0,5·bs).');
  }

  return {
    // eco de entradas
    inputsEcho: {
      h_cm, bs_cm, ds_cm, do_cm,
      phi_deg,
      gamma_s, gamma_sat, gamma_eff,
      waterTable: !!waterTable,
      hasPassive: !!hasPassiveSoil,
      hp_cm,
      Ka,
    },

    // pesos
    W_base, W_wall, W_soil, PT,

    // empuxos
    E_active, E_passive,

    // momentos
    Mr_kNcm, Mo_kNcm,

    // verificações
    FS_sliding, FS_overturning,

    // fundação
    e_m, q_avg, q_max, q_min, ratio_q, x_m,
    bearingOK,

    warnings,
  };
}
