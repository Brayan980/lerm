
import type { SomatotipoResults, CalculatedSomatotype } from './types';

export function safeNumber(value: number | null | undefined): number | null {
  if (value == null || isNaN(value)) {
    return null;
  }
  return value;
}

export function calculateEndomorphy(
  pliegueTricepsMm: number | null ,
  pliegueSubescapularMm: number | null ,
  pliegueSupraespinalMm: number | null ,
  alturaCm: number | null
): number | null {
  const pt = safeNumber(pliegueTricepsMm);
  const ps = safeNumber(pliegueSubescapularMm);
  const pss = safeNumber(pliegueSupraespinalMm);
  const alt = safeNumber(alturaCm);

  if (pt === null || ps === null || pss === null) {
    return null;
  }

  let X = pt + ps + pss;

  // Corrección de Heath-Carter si la talla es distinta de 170.18 cm
  if (alt !== null && alt !== 0 && Math.abs(alt - 170.18) > 0.001) { // Check if alt is not 170.18
    X = X * (170.18 / alt);
  }

  const endomorfia = -0.7182 + 0.1451 * X - 0.00068 * X * X + 0.0000014 * X * X * X;
  return parseFloat(endomorfia.toFixed(1));
}

export function calculateMesomorphy(
  // Nuevas definiciones según el último prompt del usuario:
  diametroHumeroCm_AG: number | null,      // AG = diámetro húmero (cm)
  diametroFemurCm_CG: number | null,       // CG = diámetro fémur (cm)
  circBrazoContraidoCm: number | null,   // Usado para HB_corregido
  pliegueTricepsMm: number | null,         // Usado para HB_corregido
  circPantorrillaCm: number | null,      // Usado para FB_corregido
  plieguePantorrillaMm: number | null,   // Usado para FB_corregido
  alturaCm_SH: number | null              // SH = talla (altura en cm)
): number | null {
  
  const AG_diamHumero = safeNumber(diametroHumeroCm_AG);
  const CG_diamFemur = safeNumber(diametroFemurCm_CG);
  const circBrazo = safeNumber(circBrazoContraidoCm);
  const pt = safeNumber(pliegueTricepsMm);
  const circPant = safeNumber(circPantorrillaCm);
  const pp = safeNumber(plieguePantorrillaMm);
  const SH_altura = safeNumber(alturaCm_SH);

  if (AG_diamHumero === null || CG_diamFemur === null || circBrazo === null || pt === null || circPant === null || pp === null || SH_altura === null) {
    return null;
  }

  // HB (Corregido): circunferencia del brazo contraído (cm) - (pliegue tríceps (mm) / 10)
  const HB_corregido = circBrazo - (pt / 10);
  // FB (Corregido): circunferencia pantorrilla (cm) - (pliegue pantorrilla (mm) / 10)
  const FB_corregido = circPant - (pp / 10);
  
  const mesomorfia =
    0.858 * AG_diamHumero +       // AG = diámetro húmero
    0.601 * CG_diamFemur +        // CG = diámetro fémur
    0.188 * HB_corregido +        // HB = circ brazo corregida
    0.161 * FB_corregido -        // FB = circ pantorrilla corregida
    0.131 * SH_altura +           // SH = talla
    4.5;
  return parseFloat(mesomorfia.toFixed(1));
}

export function calculateEctomorphy(alturaCm: number | null, pesoKg: number | null): number | null {
  const alt = safeNumber(alturaCm);
  const peso = safeNumber(pesoKg);

  if (alt === null || peso === null || peso <= 0) {
    return null;
  }

  const indicePonderal = alt / Math.pow(peso, 1 / 3);

  let ectomorfia: number;
  if (indicePonderal > 40.74) {
    ectomorfia = 0.732 * indicePonderal - 28.58;
  } else if (indicePonderal > 39.65 && indicePonderal <= 40.74) {
    ectomorfia = 0.463 * indicePonderal - 17.615;
  } else if (indicePonderal <= 39.65) { // Incluye el caso en que IP sea exactamente 39.65 o menor
    ectomorfia = 0.5;
  } else {
    return null; // Condición de IP no cubierta, aunque con la lógica actual es improbable.
  }
  return parseFloat(ectomorfia.toFixed(1));
}

export function calculateSomatotype(directMeasures: SomatotipoResults | undefined): CalculatedSomatotype | null {
  if (!directMeasures) {
    return null;
  }

  // Variables para Endomorfia
const pliegueTricepsEndo = directMeasures.pliegueTriceps?.result ?? null;
const pliegueSubescapularEndo = directMeasures.pliegueSubescapular?.result ?? null;
const pliegueSupraespinalEndo = directMeasures.pliegueSupraespinal?.result ?? null;
const alturaCmEndo = directMeasures.talla?.result ?? null; // Usado para corrección de X

// Variables para Mesomorfia
const diametroHumeroCm_AG = directMeasures.diametroHumero?.result ?? null;
const diametroFemurCm_CG = directMeasures.diametroFemur?.result ?? null;
const circBrazoFlexionadoCm_HB = directMeasures.perimetroBrazoContraido?.result ?? null;
const pliegueTricepsMm_HB = directMeasures.pliegueTriceps?.result ?? null;
const circPantorrillaCm_FB = directMeasures.perimetroPierna?.result ?? null;
const plieguePantorrillaMm_FB = directMeasures.plieguePiernaMedial?.result ?? null;
const alturaCm_SH = directMeasures.talla?.result ?? null;

// Variables para Ectomorfia
const alturaCmEcto = directMeasures.talla?.result ?? null;
const pesoKgEcto = directMeasures.masaCorporal?.result ?? null;

  const endomorfia = calculateEndomorphy(pliegueTricepsEndo, pliegueSubescapularEndo, pliegueSupraespinalEndo, alturaCmEndo);
  const mesomorfia = calculateMesomorphy(
      diametroHumeroCm_AG,
      diametroFemurCm_CG,
      circBrazoFlexionadoCm_HB,
      pliegueTricepsMm_HB,
      circPantorrillaCm_FB,
      plieguePantorrillaMm_FB,
      alturaCm_SH
  );
  const ectomorfia = calculateEctomorphy(alturaCmEcto, pesoKgEcto);
  
  let somatotypeString: string | undefined = undefined;
  if (endomorfia !== null && mesomorfia !== null && ectomorfia !== null) {
    somatotypeString = `${endomorfia.toFixed(1)} - ${mesomorfia.toFixed(1)} - ${ectomorfia.toFixed(1)}`;
  }


  if (endomorfia === null && mesomorfia === null && ectomorfia === null) {
    // Solo devuelve null si todos los componentes son null
    return null;
  }

  return {
    endomorfia,
    mesomorfia,
    ectomorfia,
    somatotypeString,
  };
}

