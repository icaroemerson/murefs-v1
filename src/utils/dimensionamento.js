// src/utils/dimensionamento.js
import abacoFlexaoSimples from '../data/abacos';

// áreas de barras (cm²) – você disse que não quer usar 6,3, então começo em 8mm
const BAR_AREAS_CM2 = {
  8: 0.503,
  10: 0.785,
  12.5: 1.227,
  16: 2.011,
  20: 3.142,
};

// alguns espaçamentos padrão (cm)
const SPACING_CM = [10, 12, 15, 20, 25, 30];

/**
 * Dado um kc calculado, um concreto (C25, C30, ...) e um aço (CA50, CA60),
 * acha na tua tabela a PRIMEIRA linha cujo kc[concreto] >= kcCalc.
 * Se não achar, pega a última linha da tabela.
 */
export function pickFromAbaco({ kcCalc, concrete = 'C25', steel = 'CA50' }) {
  if (!kcCalc || !isFinite(kcCalc)) {
    return { kcTable: null, ks: null, beta: null };
  }

  // garante que o concreto existe
  const concKey = concrete;
  const steelKey = steel;

  // procura a linha
  let chosen = null;
  for (let i = 0; i < abacoFlexaoSimples.length; i++) {
    const row = abacoFlexaoSimples[i];
    const kcCol = row.kc?.[concKey];
    if (typeof kcCol === 'number' && kcCol >= kcCalc) {
      chosen = row;
      break;
    }
  }

  // se não encontrou nenhuma maior, pega a última
  if (!chosen) {
    chosen = abacoFlexaoSimples[abacoFlexaoSimples.length - 1];
  }

  const kcTable = chosen.kc?.[concKey] ?? null;
  const ks = chosen.ks?.[steelKey] ?? null;
  const beta = chosen.beta ?? null;

  return { kcTable, ks, beta };
}

/**
 * Calcula área de aço por flexão simples do jeito que você descreveu.
 * md_kNcm: momento de projeto em kN·cm/m
 * d_cm: braço mecânico em cm (ds - cobrimento - 0,5)
 */
export function calcAsFlexao({
  md_kNcm,
  d_cm,
  concrete = 'C25',
  steel = 'CA50',
}) {
  // seu kc: kc = (100 * d²) / Md
  // cuidado com unidades: d em cm, Md em kN·cm
  const kcCalc = (100 * d_cm * d_cm) / md_kNcm;

  const { kcTable, ks } = pickFromAbaco({
    kcCalc,
    concrete,
    steel,
  });

  // se não achou ks, não dá pra seguir
  if (!ks) {
    return {
      kcCalc,
      kcTable,
      ks: null,
      As_cm2: null,
      Asmin_cm2: null,
      suggestions: [],
    };
  }

  // As = ks * (Md / d)
  const As_cm2 = ks * (md_kNcm / d_cm);

  // Asmín = (0,15/100)*100*ds  -> você descreveu assim
  // mas aqui não temos ds, então vou deixar a função receber depois
  return {
    kcCalc,
    kcTable,
    ks,
    As_cm2,
  };
}

/**
 * Calcula Asmín separado porque você definiu que depende de ds (espessura da base).
 * ds_cm: espessura da base em cm
 */
export function calcAsMin(ds_cm) {
  // Asmin = 0,0015 * 100 * ds = 0,15 * ds
  return 0.15 * ds_cm;
}

/**
 * Gera 2–3 opções de armadura (bitola + espaçamento) para atingir As_req.
 * A ideia: As_prov ≈ (area_barra_cm2 * 100) / espaçamento_cm
 */
export function suggestRebars(As_req_cm2) {
  const out = [];
  for (const [phiStr, area] of Object.entries(BAR_AREAS_CM2)) {
    const phi = Number(phiStr);
    for (const s of SPACING_CM) {
      const AsProv = (area * 100) / s; // cm²/m
      if (AsProv >= As_req_cm2) {
        out.push({
          phi,
          spacing: s,
          AsProv: Number(AsProv.toFixed(2)),
        });
        if (out.length >= 3) {
          return out;
        }
        break; // já achei um espaçamento pra essa bitola
      }
    }
  }
  return out;
}
