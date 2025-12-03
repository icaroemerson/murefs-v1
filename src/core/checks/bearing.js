// src/core/checks/bearing.js
// Entradas esperadas (todas numéricas):
//  - PT: peso total (kN/m)
//  - MR: momento resistente (kN·cm/m)
//  - MT: momento de tombamento (kN·cm/m)
//  - B_cm: largura da base do muro (cm)
//  - qa_adm: capacidade de carga admissível (kPa = kN/m²)
//
// Observação de unidades:
//  - Convertemos B de cm -> m e momentos de kN·cm/m -> kN·m/m para consistência.
//  - As tensões saem em kPa (= kN/m²).
//
// Regras clássicas:
//  e = (MR - MT) / PT      [momento em kN·m/m, PT em kN/m => e em m]
//  q_avg = PT / B_m        [kN/m / m = kN/m² = kPa]
//  q_max = q_avg * (1 + 6e/B_m)
//  q_min = q_avg * (1 - 6e/B_m)
//  Condições usuais:
//   - e <= B/6 para não tracionar (q_min ≥ 0). Se e > B/6, considerar faixa de compressão reduzida.
//   - Verificação: q_max ≤ q_a (admissível)

export function bearingCheck({ PT, MR, MT, B_cm, qa_adm }) {
  // Proteções
  const PTn = Number(PT) || 0;             // kN/m
  const MRcm = Number(MR) || 0;            // kN·cm/m
  const MTcm = Number(MT) || 0;            // kN·cm/m
  const Bcm = Number(B_cm) || 0;           // cm
  const qa = Number(qa_adm) || 0;          // kPa

  const Bm = Bcm / 100;                    // m
  const MRm = MRcm / 100;                  // kN·m/m
  const MTm = MTcm / 100;                  // kN·m/m

  if (PTn <= 0 || Bm <= 0) {
    return {
      ok: false,
      reason: 'Dados insuficientes (PT ou B inválidos).',
      e_m: 0, q_avg: 0, q_max: 0, q_min: 0, qa_adm: qa, within_kernel: null
    };
  }

  const e_m = (MRm - MTm) / PTn;           // m
  const q_avg = PTn / Bm;                  // kPa

  const ratio = (6 * e_m) / Bm;
  const q_max = q_avg * (1 + ratio);       // kPa
  const q_min = q_avg * (1 - ratio);       // kPa

  // Núcleo (sem tração) quando e <= B/6
  const within_kernel = Math.abs(e_m) <= Bm / 6 + 1e-12;

  // Critério de capacidade: q_max <= qa
  const ok = qa > 0 ? (q_max <= qa) : false;

  return {
    ok,
    qa_adm: qa,
    e_m,
    q_avg,
    q_max,
    q_min,
    within_kernel
  };
}
