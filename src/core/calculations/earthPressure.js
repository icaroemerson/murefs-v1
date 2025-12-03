/**
 * earthPressure.js
 * Funções de cálculo geotécnico para empuxos de terra (Ativo e Passivo).
 */

// --- EMPUXO ATIVO ---

/**
 * Calcula o coeficiente de empuxo ativo de Rankine (Ka).
 * @param {number} frictionAngle Ângulo de atrito interno do solo (φ), em GRAUS.
 * @returns {number} Coeficiente Ka.
 */
export const calculateKa = (frictionAngle) => {
  if (typeof frictionAngle !== 'number' || frictionAngle < 0 || frictionAngle > 90) return 0;
  const angleInRadians = frictionAngle * (Math.PI / 180);
  const sinPhi = Math.sin(angleInRadians);
  return (1 - sinPhi) / (1 + sinPhi);
};

/**
 * Calcula a força do empuxo ativo de Rankine (Ea).
 * @param {number} ka Coeficiente de empuxo ativo.
 * @param {number} soilWeight Peso específico do solo (γ), em kN/m³.
 * @param {number} height Altura do maciço de solo, em METROS.
 * @returns {number} Força do empuxo ativo (Ea), em kN/m.
 */
export const calculateActiveThrust = (ka, soilWeight, height) => {
  if (ka < 0 || soilWeight < 0 || height < 0) return 0;
  return 0.5 * soilWeight * Math.pow(height, 2) * ka;
};

// --- EMPUXO PASSIVO (NOVAS FUNÇÕES) ---

/**
 * Calcula o coeficiente de empuxo passivo de Rankine (Kp).
 * Fórmula: Kp = (1 + sen(φ)) / (1 - sen(φ))
 * @param {number} frictionAngle Ângulo de atrito interno do solo (φ), em GRAUS.
 * @returns {number} Coeficiente Kp.
 */
export const calculateKp = (frictionAngle) => {
  if (typeof frictionAngle !== 'number' || frictionAngle < 0 || frictionAngle > 90) return 0;
  const angleInRadians = frictionAngle * (Math.PI / 180);
  const sinPhi = Math.sin(angleInRadians);
  return (1 + sinPhi) / (1 - sinPhi);
};

/**
 * Calcula a força do empuxo passivo de Rankine (Ep).
 * @param {number} kp Coeficiente de empuxo passivo.
 * @param {number} soilWeight Peso específico do solo (γ), em kN/m³.
 * @param {number} height Altura do maciço de solo na frente do muro, em METROS.
 * @returns {number} Força do empuxo passivo (Ep), em kN/m.
 */
export const calculatePassiveThrust = (kp, soilWeight, height) => {
  if (kp < 0 || soilWeight < 0 || height < 0) return 0;
  return 0.5 * soilWeight * Math.pow(height, 2) * kp;
};


// --- MOMENTO FLETOR ---

/**
 * Calcula o momento fletor CARACTERÍSTICO (Mk) na base do paramento.
 * @param {number} activeThrust Força do empuxo ativo (Ea), em kN/m.
 * @param {number} stemHeight Altura do paramento (H'), em METROS.
 * @returns {number} Momento fletor característico (Mk), em kNm/m.
 */
export const calculateBendingMoment = (activeThrust, stemHeight) => {
  if (activeThrust < 0 || stemHeight < 0) return 0;
  return activeThrust * (stemHeight / 3);
};