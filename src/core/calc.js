import { cmToM, deg2rad, safeNum } from './units';

export const Ka_Rankine = (phi_deg) => {
  const phi = deg2rad(phi_deg);
  return (1 - Math.sin(phi)) / (1 + Math.sin(phi));
};
export const Kp_Rankine = (phi_deg) => {
  const phi = deg2rad(phi_deg);
  return (1 + Math.sin(phi)) / (1 - Math.sin(phi));
};

export function earthPressureActive({ H_m, gamma, phi_deg, q_kPa = 0 }) {
  const Ka = Ka_Rankine(phi_deg);
  const Ea_triangle = 0.5 * Ka * gamma * H_m ** 2;
  const Ea_rect = Ka * q_kPa * H_m;
  const Ea = Ea_triangle + Ea_rect;
  const y = (Ea_triangle * (H_m / 3) + Ea_rect * (H_m / 2)) / (Ea || 1);
  const p_base = Ka * gamma * H_m + Ka * q_kPa;
  return { Ea, y, p_base, Ka };
}

export function earthPressurePassive({ Hp_m, gamma, phi_deg }) {
  const Kp = Kp_Rankine(phi_deg);
  const Ep = 0.5 * Kp * gamma * (Hp_m ** 2);
  const y = Hp_m / 3;
  return { Ep, y, Kp };
}

export function weightsAndLevers({ H_m, stem_t_m, toe_b_m, heel_b_m, gamma_c = 24 }) {
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

export function overturningFS({ Ea, yEa, W, xW, toeOrigin = 0 }) {
  const Mt = Ea * yEa;
  const Mr = W * (xW - toeOrigin);
  return { FS_tomb: Mr / (Mt || 1e-9), Mt, Mr };
}

export function slidingFS({ W, Ea, mu_base = 0.55, cohesion_base = 0, baseB_m, Ep = 0 }) {
  const S = mu_base * W + cohesion_base * baseB_m;
  return { FS_desl: (S + Ep) / (Ea || 1e-9), S };
}

export function basePressures({ W, Ea, yEa, baseB_m, xW }) {
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

export function bearingCapacity({ phi_deg, c_kPa = 0, gamma_f, q_overburden = 0, B_m, e_m }) {
  const phi = deg2rad(phi_deg);
  const Nq = Math.exp(Math.PI * Math.tan(phi)) * Math.tan(Math.PI / 4 + phi / 2) ** 2;
  const Nc = (Nq - 1) / Math.tan(phi || 1e-6);
  const Nγ = 2 * (Nq + 1) * Math.tan(phi);
  const Bp = Math.max(1e-3, B_m - 2 * Math.abs(e_m));
  const qmax = c_kPa * Nc + q_overburden * Nq + 0.5 * gamma_f * Bp * Nγ;
  return { qmax, Nc, Nq, Nγ, Bp };
}

export function mapFromProjectState(raw) {
  return {
    H_m:   cmToM(safeNum(raw.wallHeight ?? raw.H ?? 300)),
    Hp_m:  cmToM(safeNum(raw.elevation ?? 50)),
    B_m:   cmToM(safeNum(raw.baseLength ?? raw.baseB ?? 150)),
    t_m:   cmToM(safeNum(raw.stemWidth ?? raw.stem_t ?? 24)),
    toe_m: cmToM(safeNum(raw.toeWidth ?? raw.toe_b ?? 50)),
    heel_m:cmToM(safeNum(raw.heelWidth ?? raw.heel_b ?? 76)),
    gamma: safeNum(raw.soilWeight ?? raw.gamma ?? 18),
    phi_deg: safeNum(raw.soilFriction ?? raw.phi_deg ?? 30),
    c_kPa: safeNum(raw.soilCohesion ?? 0),
    q_kPa: safeNum(raw.load ?? raw.surcharge_q ?? 0),
    hasPassive: Boolean(raw.hasPassiveSoil ?? raw.hasPassive ?? true),
  };
}

export function runAllCalculations(ctxState) {
  const S = mapFromProjectState(ctxState);
  const Ea = earthPressureActive({ H_m: S.H_m, gamma: S.gamma, phi_deg: S.phi_deg, q_kPa: S.q_kPa });
  const EpObj = S.hasPassive ? earthPressurePassive({ Hp_m: S.Hp_m, gamma: S.gamma, phi_deg: S.phi_deg }) : { Ep: 0, y: 0, Kp: null };
  const Wset = weightsAndLevers({ H_m: S.H_m, stem_t_m: S.t_m, toe_b_m: S.toe_m, heel_b_m: S.heel_m });
  const OT = overturningFS({ Ea: Ea.Ea, yEa: Ea.y, W: Wset.W, xW: Wset.xW });
  const SL = slidingFS({ W: Wset.W, Ea: Ea.Ea, mu_base: 0.55, cohesion_base: 0, baseB_m: S.B_m, Ep: EpObj.Ep });
  const BP = basePressures({ W: Wset.W, Ea: Ea.Ea, yEa: Ea.y, baseB_m: S.B_m, xW: Wset.xW });
  const BC = bearingCapacity({ phi_deg: S.phi_deg, c_kPa: S.c_kPa, gamma_f: S.gamma, q_overburden: 0, B_m: S.B_m, e_m: BP.e });
  return { S, Ea, EpObj, Wset, OT, SL, BP, BC };
}
