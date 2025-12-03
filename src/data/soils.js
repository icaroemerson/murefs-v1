// src/data/soils.js
// Tabela simples: cada solo tem gamma (kN/m³), phi (graus) e qa (kPa)
export const SOILS = [
  { id: 'areia_fofa',   name: 'Areia fofa',         gamma: 17, phi: 30, qa: 150 },
  { id: 'areia_media',  name: 'Areia média',        gamma: 18, phi: 32, qa: 200 },
  { id: 'areia_compacta', name: 'Areia compacta',   gamma: 19, phi: 36, qa: 300 },
  { id: 'silte',        name: 'Silte',              gamma: 17, phi: 26, qa: 120 },
  { id: 'argila_mole',  name: 'Argila mole',        gamma: 16, phi: 18, qa: 80  },
  { id: 'argila_media', name: 'Argila média',       gamma: 17, phi: 22, qa: 120 },
  { id: 'argila_rija',  name: 'Argila rija',        gamma: 18, phi: 26, qa: 180 },
  { id: 'saibro',       name: 'Saibro',             gamma: 19, phi: 34, qa: 250 },
];
