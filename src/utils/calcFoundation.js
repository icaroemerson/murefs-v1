// src/utils/calcFoundation.js
// Cálculos de fundação em unidade coerente com a comparação a qa (kPa).
// Convenções usadas aqui:
// - Dimensões geométricas informadas em cm (do seu app): bs (largura da base)
// - Cargas por metro (kN/m) e momentos por metro (kN·cm/m) vindos do módulo de cargas
// - qa (capacidade admissível) em kPa (= kN/m²)

export function calcFoundation({
  // da geometria (cm)
  bs_cm,          // largura total da base (cm)

  // do solo
  qa_kPa,         // capacidade de carga admissível (kPa)

  // do módulo de cargas (por metro)
  PT_kNpm,        // peso total (kN/m)
  Mr_kNcm_pm,     // momento resistente (kN·cm/m)
  Mt_kNcm_pm,     // momento de tombamento (kN·cm/m)
}) {
  // Sanidade
  const B_cm = Number(bs_cm) || 0;
  const qa   = Number(qa_kPa) || 0;
  const PT   = Number(PT_kNpm) || 0;
  const Mr   = Number(Mr_kNcm_pm) || 0;
  const Mt   = Number(Mt_kNcm_pm) || 0;

  // Conversões básicas
  const B_m  = B_cm / 100;            // m
  const Mres_kNcm = Mr;               // kN·cm/m
  const Mtomb_kNcm = Mt;              // kN·cm/m
  const Mres_kNm = Mres_kNcm / 100;   // kN·m/m
  const Mtomb_kNm = Mtomb_kNcm / 100; // kN·m/m

  // Excentricidade (em m): e = (Mres - Mtomb) / PT
  // (Momentos por metro, força por metro → e por metro)
  const e_m = PT !== 0 ? (Mres_kNm - Mtomb_kNm) / PT : 0;

  // Tensão média (kPa): q_avg = PT / B  (PT em kN/m; B em m → kN/m² = kPa)
  const q_avg_kPa = (B_m > 0) ? PT / B_m : 0;

  // Tensões extremas (kPa): q = q_avg * (1 ± 6e/B)
  const ratio = (B_m > 0) ? (6 * e_m / B_m) : 0;
  const qmax_kPa = q_avg_kPa * (1 + ratio);
  const qmin_kPa = q_avg_kPa * (1 - ratio);

  // Critério (1): capacidade ∴ qmax ≤ qa
  const passesBearing = qa > 0 ? (qmax_kPa <= qa) : false;

  // Critério (2): verificação de excentricidade baseada na “distância x”
  // Usuário: se qmax/qmin = r (usar |qmin| se qmin<0), então x = B / r, e deve valer x ≤ B/2
  // Observação: se qmin≈0 ou muda sinal, tratamos magnitude para evitar divisão por zero.
  const abs_qmin = Math.max(Math.abs(qmin_kPa), 1e-9);
  const r = Math.abs(qmax_kPa) / abs_qmin;  // razão sempre positiva
  const x_m = (r > 0) ? (B_m / r) : Infinity;
  const passesEccentricity = (x_m <= B_m / 2);

  return {
    B_m,
    e_m,
    q_avg_kPa,
    qmax_kPa,
    qmin_kPa,
    qa_kPa: qa,
    x_m,
    ratio_r: r,
    passesBearing,
    passesEccentricity,
  };
}
