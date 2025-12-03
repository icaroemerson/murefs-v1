import abacos from './abacos.json';
export function getPreDetailing({ calcs, ctxState }) {
  const cover = abacos.cover_mm;
  const dVert = abacos.minima.bar_diameter_mm.vertical;
  const dHoriz = abacos.minima.bar_diameter_mm.horizontal;
  const sMin = abacos.minima.spacing_mm.min;
  const sMax = abacos.minima.spacing_mm.max;
  const lbPerD = abacos.anchorage.lb_basic_mm_per_d['CA-50'] ?? 40;
  const lbVert = lbPerD * dVert;
  return {
    cover_mm: cover,
    vertical: { diameter_mm: dVert, spacing_mm: Math.max(sMin, Math.min(150, sMax)) },
    horizontal: { diameter_mm: dHoriz, spacing_mm: Math.max(sMin, Math.min(200, sMax)) },
    anchorage: { lb_mm: lbVert, rule: `${lbPerD}ϕ (CA-50)` },
    notes: abacos.notes
  };
}
