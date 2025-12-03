import {
  calculateKa, calculateActiveThrust,
  calculateKp, calculatePassiveThrust
} from './earthPressure.js'; // Assuming earthPressure.js is correct

/**
 * stability.js
 * Contém as funções para realizar as verificações de estabilidade global do muro.
 */

// --- Funções Auxiliares ---
const calculateComponentWeight = (width, height, specificWeight = 25) => {
  // Ensure inputs are numbers and non-negative
  const w = parseFloat(width) || 0;
  const h = parseFloat(height) || 0;
  const sw = parseFloat(specificWeight) || 0;
  if (w < 0 || h < 0 || sw < 0) return 0;
  return w * h * 1 * sw; // width * height * 1m depth * specificWeight
};

// --- Verificação de Tombamento ---
export const checkOverturning = (geometryData, activeSoilData) => {
  try {
    // --- Conversão de Unidades (CM para METROS) ---
    const h = parseFloat(geometryData.wallHeight) / 100 || 0;
    const b_ponta = parseFloat(geometryData.toeWidth) / 100 || 0;
    const b_calcanhar = parseFloat(geometryData.heelWidth) / 100 || 0;
    const b_parede = parseFloat(geometryData.stemWidth) / 100 || 0;
    const esp_base = h > 0 ? h / 10 : 0; // Base height = H/10
    const h_paramento = h - esp_base;
    const totalBaseWidth = b_ponta + b_parede + b_calcanhar;

    if (h <= 0 || totalBaseWidth <= 0 || h_paramento < 0) return { factorOfSafety: 'N/A', isApproved: false, stabilizingMoment: '0.00', overturningMoment: '0.00' };

    // --- Pesos (kN/m) ---
    const P_paramento = calculateComponentWeight(b_parede, h_paramento);
    const P_base = calculateComponentWeight(totalBaseWidth, esp_base);
    const P_solo_calcanhar = calculateComponentWeight(b_calcanhar, h_paramento, parseFloat(activeSoilData.soilWeight));

    // --- Momentos Estabilizantes (Me) - Giro na Ponta ---
    const x_paramento = b_ponta + (b_parede / 2);
    const Me_paramento = P_paramento * x_paramento;
    const x_base = totalBaseWidth / 2;
    const Me_base = P_base * x_base;
    const x_solo_calcanhar = b_ponta + b_parede + (b_calcanhar / 2);
    const Me_solo_calcanhar = P_solo_calcanhar * x_solo_calcanhar;
    const totalMe = Me_paramento + Me_base + Me_solo_calcanhar;

    // --- Momento de Tombamento (Mt) ---
    const ka = calculateKa(parseFloat(activeSoilData.soilFriction));
    const Ea = calculateActiveThrust(ka, parseFloat(activeSoilData.soilWeight), h);
    const totalMt = Ea * (h / 3); // Point of action for triangular load

    // --- Fator de Segurança ---
    const factorOfSafety = totalMt > 0 ? totalMe / totalMt : Infinity;
    const isApproved = factorOfSafety >= 1.5;

    return {
      factorOfSafety: factorOfSafety === Infinity ? '∞' : factorOfSafety.toFixed(2),
      isApproved,
      stabilizingMoment: totalMe.toFixed(2),
      overturningMoment: totalMt.toFixed(2),
    };
  } catch (error) {
    console.error("Erro em checkOverturning:", error);
    return { factorOfSafety: 'Erro', isApproved: false, stabilizingMoment: 'Erro', overturningMoment: 'Erro' };
  }
};

// --- Verificação de Deslizamento ---
export const checkSliding = (geometryData, activeSoilData, foundationSoilData) => {
  try {
    // --- Conversão e Pesos ---
    const h = parseFloat(geometryData.wallHeight) / 100 || 0;
    const b_ponta = parseFloat(geometryData.toeWidth) / 100 || 0;
    const b_calcanhar = parseFloat(geometryData.heelWidth) / 100 || 0;
    const b_parede = parseFloat(geometryData.stemWidth) / 100 || 0;
    const esp_base = h > 0 ? h / 10 : 0;
    const h_paramento = h - esp_base;
    const totalBaseWidth = b_ponta + b_parede + b_calcanhar;

     if (h <= 0 || totalBaseWidth <= 0 || h_paramento < 0) return { factorOfSafety: 'N/A', isApproved: false, resistingForce: '0.00', drivingForce: '0.00' };

    const P_paramento = calculateComponentWeight(b_parede, h_paramento);
    const P_base = calculateComponentWeight(totalBaseWidth, esp_base);
    const P_solo_calcanhar = calculateComponentWeight(b_calcanhar, h_paramento, parseFloat(activeSoilData.soilWeight));
    const totalVerticalForce = P_paramento + P_base + P_solo_calcanhar;

    // --- Forças Resistentes (Fr) ---
    const foundationFrictionAngle = parseFloat(foundationSoilData.soilFriction);
    const frictionCoefficient = Math.tan(foundationFrictionAngle * (Math.PI / 180)); // μ = tan(φ)
    const frictionForce = totalVerticalForce * frictionCoefficient;

    // Empuxo Passivo (Assume altura do solo passivo = 50cm, precisa vir do input/contexto)
    const passiveSoilHeight = 0.5; // TODO: Get this from context/input
    const kp = calculateKp(parseFloat(foundationSoilData.soilFriction)); // Use foundation soil friction
    const passiveThrust = geometryData.hasPassiveSoil // Check if passive soil is considered
                          ? calculatePassiveThrust(kp, parseFloat(foundationSoilData.soilWeight), passiveSoilHeight)
                          : 0;

    const totalResistingForce = frictionForce + passiveThrust;

    // --- Força Atuante (Fa) ---
    const ka = calculateKa(parseFloat(activeSoilData.soilFriction));
    const activeThrust = calculateActiveThrust(ka, parseFloat(activeSoilData.soilWeight), h);

    // --- Fator de Segurança ---
    const factorOfSafety = activeThrust > 0 ? totalResistingForce / activeThrust : Infinity;
    const isApproved = factorOfSafety >= 1.5;

    return {
      factorOfSafety: factorOfSafety === Infinity ? '∞' : factorOfSafety.toFixed(2),
      isApproved,
      resistingForce: totalResistingForce.toFixed(2),
      drivingForce: activeThrust.toFixed(2),
    };
  } catch (error) {
    console.error("Erro em checkSliding:", error);
    return { factorOfSafety: 'Erro', isApproved: false, resistingForce: 'Erro', drivingForce: 'Erro' };
  }
};

// --- Verificação das Tensões na Base ---
export const checkBearingCapacity = (geometryData, activeSoilData, foundationSoilData, overturningResult) => {
  try {
    const { stabilizingMoment, overturningMoment } = overturningResult; // Get moments from overturning check

    // --- Conversão e Pesos ---
    const h = parseFloat(geometryData.wallHeight) / 100 || 0;
    const b_ponta = parseFloat(geometryData.toeWidth) / 100 || 0;
    const b_calcanhar = parseFloat(geometryData.heelWidth) / 100 || 0;
    const b_parede = parseFloat(geometryData.stemWidth) / 100 || 0;
    const esp_base = h > 0 ? h / 10 : 0;
    const h_paramento = h - esp_base;
    const totalBaseWidth = b_ponta + b_parede + b_calcanhar; // B

    if (h <= 0 || totalBaseWidth <= 0 || h_paramento < 0) return { eccentricity: 'N/A', isInMiddleThird: false, maxStress: 'N/A', minStress: 'N/A', isStressOk: false, isApproved: false };

    const P_paramento = calculateComponentWeight(b_parede, h_paramento);
    const P_base = calculateComponentWeight(totalBaseWidth, esp_base);
    // Peso do solo sobre o calcanhar usa o peso específico do SOLO DE REATERRO
    const P_solo_calcanhar = calculateComponentWeight(b_calcanhar, h_paramento, parseFloat(activeSoilData.soilWeight));
    const totalVerticalForce = P_paramento + P_base + P_solo_calcanhar; // ΣFv (ou N)

    if (totalVerticalForce === 0) return { eccentricity: 'N/A', isInMiddleThird: false, maxStress: 'N/A', minStress: 'N/A', isStressOk: false, isApproved: false };


    // --- Posição da Resultante e Excentricidade ---
    const Mstab = parseFloat(stabilizingMoment) || 0;
    const Mtomb = parseFloat(overturningMoment) || 0;
    const netMomentAtToe = Mstab - Mtomb; // Momento resultante em relação à ponta (ponto 0)
    const resultantPositionX = netMomentAtToe / totalVerticalForce; // x_res = ΣM / ΣFv (posição a partir da ponta)
    const eccentricity = Math.abs((totalBaseWidth / 2) - resultantPositionX); // e = |B/2 - x_res|

    const middleThirdLimit = totalBaseWidth / 6;
    const isInMiddleThird = eccentricity <= middleThirdLimit;

    // --- Cálculo das Tensões (kPa = kN/m²) ---
    const baseArea = totalBaseWidth * 1; // Área por metro de muro (m²)
    const maxStress = (totalVerticalForce / baseArea) * (1 + (6 * eccentricity) / totalBaseWidth);
    const minStress = (totalVerticalForce / baseArea) * (1 - (6 * eccentricity) / totalBaseWidth);

    // Tensão Admissível (precisa vir do contexto/input)
    // const admissibleStress = parseFloat(foundationSoilData.admissibleStress) || 0;
    const admissibleStress = 150; // TODO: Substituir por valor do contexto/input (em kPa)
    const isStressOk = maxStress <= admissibleStress;

    return {
      eccentricity: eccentricity.toFixed(3), // em metros
      isInMiddleThird,
      maxStress: maxStress.toFixed(2), // em kPa
      minStress: minStress.toFixed(2), // em kPa
      admissibleStress: admissibleStress.toFixed(2), // em kPa
      isStressOk,
      isApproved: isInMiddleThird && isStressOk && minStress >= 0, // Garante que não há tração (minStress >= 0)
    };
  } catch (error) {
    console.error("Erro em checkBearingCapacity:", error);
    return { eccentricity: 'Erro', isInMiddleThird: false, maxStress: 'Erro', minStress: 'Erro', isStressOk: false, isApproved: false };
  }
};