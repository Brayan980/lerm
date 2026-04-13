
import type { MacroindicesResults, CalculatedMacroindices, InitialRegistrationData, ZScoreData } from './types';
import { PHANTOM_METRICS } from './phantomValues'; // Import Phantom values
import { MACROINDICES_DEFINITIONS } from './types'; // To get labels
import { EST_TALLA_ADULTA } from './estTallaAdulta';

function safeDivide(numerator: number | null | undefined, denominator: number | null | undefined): number | null {
  if (numerator == null || denominator == null || denominator === 0) {
    return null;
  }
  return numerator / denominator;
}

function safeMultiply(val1: number | null | undefined, val2: number | null | undefined): number | null {
  if (val1 == null || val2 == null) return null;
  return val1 * val2;
}

function safeAdd(...values: (number | null | undefined)[]): number | null {
  let sum = 0;
  for (const value of values) {
    if (value == null) return null;
    sum += value;
  }
  return sum;
}

function safeSubtract(val1: number | null | undefined, val2: number | null | undefined): number | null {
  if (val1 == null || val2 == null) return null;
  return val1 - val2;
}


export function calculateAllMacroindices(
  rawMeasures: MacroindicesResults | undefined,
  participantData: InitialRegistrationData | undefined,
  masaOsea: number | undefined,
  masaAdiposa: number | undefined,
  masaMuscular: number | undefined
): CalculatedMacroindices | undefined {
  if (!rawMeasures || !participantData) return undefined;

  const calculated: CalculatedMacroindices = {};
  //Corregido: Antes estaba calculatedAge
  const { sex: sexString, calculated_age } = participantData;

  const masaKg = rawMeasures.masaCorporal?.result;
  const tallaCm = rawMeasures.talla?.result;
  const tallaM = tallaCm != null ? tallaCm / 100 : null;
  const tallaSentadaCm = rawMeasures.tallaSentada?.result;
  const perimetroToraxCm = rawMeasures.perimetroTorax?.result;
  const perimetroCinturaCm = rawMeasures.perimetroCintura?.result;
  const perimetroCaderaCm = rawMeasures.perimetroCadera?.result;
  const diametroBiacromialCm = rawMeasures.diametroBiacromial?.result;
  const diametroBiiliocristalCm = rawMeasures.diametroBiiliocristal?.result;
  const diametroAPAbdomenCm = rawMeasures.diametroAPAbdomen?.result;
  const longAcromialeRadialeCm = rawMeasures.longitudAcromialeRadiale?.result;
  const longRadialeStylionCm = rawMeasures.longitudRadialeStylion?.result;
  const longStylionMedioDactylionCm = rawMeasures.longitudStylionMedioDactylion?.result;
  const alturaIliospinaleCm = rawMeasures.alturaIliospinale?.result;
  const longTrochanterionTibialeLateraleCm = rawMeasures.longitudTrochanterionTibialeLaterale?.result;
  const longitudTibialeMedialeSphyrionTibialeCm = rawMeasures.longitudTibialeMedialeSphyrionTibiale?.result
  const masaOseaKg = masaOsea != undefined ? masaOsea : null
  const masaAdiposaKg = masaAdiposa != undefined ? masaAdiposa : null
  const masaMuscularKg = masaMuscular != undefined ? masaMuscular : null
  // 1. IMC
  if (masaKg != null && tallaM != null && tallaM > 0) {
    let classification = "No clasificable";
    const imcVal = masaKg / (tallaM * tallaM);

    if (imcVal < 18.5) classification = "Bajo peso";
    else if (imcVal < 25) classification = "Normal";
    else if (imcVal < 30) classification = "Sobrepeso";
    else classification = "Obesidad";

    calculated.imc = { value: parseFloat(imcVal.toFixed(2)), classification };

  } else {
    calculated.imc = { value: null, classification: "No clasificable" };
  }

  // 2. Índice de Livi (IL)
  if (masaKg != null && tallaCm != null && tallaCm > 0) {
    calculated.livi = parseFloat((Math.cbrt(masaKg / tallaCm)).toFixed(3));
  } else {
    calculated.livi = null;
  }

  // 3. Índice de Röher (IR)
  if (masaKg != null && tallaM != null && tallaM > 0) {
    let classification = "No clasificable";
    let interpretation = "";

    const rohrerVal = parseFloat((masaKg / (tallaM * tallaM * tallaM)).toFixed(2));
    // Clasificación para adultos
    if (rohrerVal < 8) {
      classification = "No clasificable";
    } else if (rohrerVal < 11) {
      classification = "Bajo peso";
    } else if (rohrerVal < 15) {
      classification = "Rango normal";
    } else if (rohrerVal < 17) {
      classification = "Sobrepeso";
    } else {
      classification = "Obeso"
    };

    calculated.roher = { value: parseFloat(rohrerVal.toFixed(2)), classification, };


  } else {
    calculated.roher = { value: null, classification: "No clasificable" };
  }

  // 4. Índice Ponderal (IP)
  if (tallaCm != null && masaKg != null && masaKg > 0) {
    calculated.ponderal = parseFloat((tallaCm / Math.cbrt(masaKg)).toFixed(2));
  } else {
    calculated.ponderal = null;
  }

  // 5. Índice de Bouchard (IB)
  if (masaKg != null && tallaM != null && tallaM > 0) {
    calculated.bouchard = parseFloat((masaKg / tallaM).toFixed(2));
  } else {
    calculated.bouchard = null;
  }

  // 6. Índice de Pignet (IP)
  if (tallaCm != null && masaKg != null && perimetroToraxCm != null) {
    const pignetVal = tallaCm - masaKg - perimetroToraxCm;
    let classification = "No clasificable";
    if (pignetVal < 10) classification = "Excelente condición anatómica";
    else if (pignetVal >= 10 && pignetVal <= 19) classification = "Buena condición anatómica";
    else if (pignetVal >= 20 && pignetVal <= 29) classification = "Aceptable";
    else if (pignetVal >= 30) classification = "Mala";
    calculated.pignet = { value: parseFloat(pignetVal.toFixed(2)), classification };
  } else {
    calculated.pignet = { value: null, classification: "No clasificable" };
  }

  // 7. Índice cintura-cadera (ICC)
  const iccRaw = safeDivide(perimetroCinturaCm, perimetroCaderaCm);

  if (iccRaw != null) {
    const iccVal = parseFloat(iccRaw.toFixed(2))
    let classification = "No clasificable";

    if (participantData.sex === 'Masculino') {
      if (iccVal < 1) classification = "Normalidad";
      else if (iccVal >= 1) classification = "Obesidad abdominovisceral";
    } else if (participantData.sex === 'Femenino') {
      if (iccVal < 0.80) classification = "Normalidad";
      else if (iccVal >= 0.80) classification = "Obesidad abdominovisceral";
    }

    calculated.icc = { value: iccVal, classification };

  } else {
    calculated.icc = { value: null }
  }

  // 8. Índice perímetro de cintura (IPC)
  calculated.ipc = perimetroCinturaCm != null ? parseFloat(perimetroCinturaCm.toFixed(2)) : null;

  // 9. Índice diámetro sagital umbilical (IDSU)
  calculated.idsu = diametroAPAbdomenCm != null ? parseFloat(diametroAPAbdomenCm.toFixed(2)) : null;

  // 10. Índice cintura-estatura (ICE)
  const iceRaw = safeDivide(perimetroCinturaCm, tallaCm);
  calculated.ice = iceRaw != null ? parseFloat(iceRaw.toFixed(2)) : null;

  // 11. Índice de distribución de la grasa corporal (IDGC)
  if (calculated.ipc != null && tallaM != null && tallaM > 0 && calculated.icc != null && calculated.icc.value !== 0 && calculated.icc.value !== null) {
    const perimetroCinturaM = perimetroCinturaCm != null ? perimetroCinturaCm / 100 : null;
    if (perimetroCinturaM != null) {
      const term1 = perimetroCinturaM / tallaM;
      const term2 = 1 / tallaM; // This term seems unusual in IDGC formulas, typically it's simpler. Review source if needed.
      const idgcVal = (term1 + term2) / calculated.icc.value;
      calculated.idgc = parseFloat(idgcVal.toFixed(2));
    } else {
      calculated.idgc = null;
    }
  } else {
    calculated.idgc = null;
  }

  // 12. Índice de conicidad (IC)
  if (perimetroCinturaCm != null && masaKg != null && masaKg > 0 && tallaM != null && tallaM > 0) {
    const perimetroUmbilicalM = perimetroCinturaCm / 100;
    const icVal = perimetroUmbilicalM / (0.109 * Math.sqrt(masaKg / tallaM));
    calculated.icConicidad = parseFloat(icVal.toFixed(2));
  } else {
    calculated.icConicidad = null;
  }

  // 13. Índice córmico (IC)
  if (tallaSentadaCm != null && tallaCm != null && tallaCm > 0) {
    const icCormicoVal = (tallaSentadaCm * 100) / tallaCm;
    let classification = "No clasificable";
    if (sexString === "Femenino") {
      if (icCormicoVal <= 50.9) classification = "Braquicórmicos (tronco corto)";
      else if (icCormicoVal >= 51.0 && icCormicoVal <= 52.9) classification = "Metricórmicos (tronco normal)";
      else if (icCormicoVal >= 53.0) classification = "Macrocórmicos (tronco largo)";
    } else if (sexString === "Masculino") {
      if (icCormicoVal <= 50.9) classification = "Braquicórmicos (tronco corto)";
      else if (icCormicoVal >= 51.0 && icCormicoVal <= 52.9) classification = "Metricórmicos (tronco normal)";
      else if (icCormicoVal > 53.0) classification = "Macrocórmicos (tronco largo)";
    }
    calculated.icCormico = { value: parseFloat(icCormicoVal.toFixed(2)), classification };
  } else {
    calculated.icCormico = { value: null, classification: "No clasificable" };
  }

  // 14. Índice acromio-iliaco (IAI)
  if (diametroBiiliocristalCm != null && diametroBiacromialCm != null && diametroBiacromialCm > 0) {
    // Se estaba haciendo al reves
    // const iaiVal = (diametroBiiliocristalCm * 100) / diametroBiacromialCm;

    const iaiVal = (diametroBiacromialCm / diametroBiiliocristalCm) * 100;

    let classification = "No clasificable";

    if (participantData.sex === 'Masculino') {

      if (iaiVal <= 69.9) {
        classification = "Diametro biacromial proporcionalmente más ancho respecto al diámetro biiliocristal";
        calculated.iai = { value: parseFloat(iaiVal.toFixed(2)), classification, interpretation: "Es una ventaja competitiva en natación y lanzamientos" };
      } else if (iaiVal >= 70.0 && iaiVal <= 74.9) {
        classification = "Diametro biacromial proporcional respecto al diámetro biiliocristal";
        calculated.iai = { value: parseFloat(iaiVal.toFixed(2)), classification };
      } else if (iaiVal >= 75.0) {
        classification = "Diametro biacromial proporcionalmente más ancho estrecho al diámetro biiliocristal";
        calculated.iai = { value: parseFloat(iaiVal.toFixed(2)), classification, interpretation: "Es una ventaja competitiva en lucha guecorromana" };
      }

    } else if (participantData.sex === 'Femenino') {

      if (iaiVal <= 79.9) {
        classification = "Diametro biacromial proporcionalmente más ancho respecto al diámetro biiliocristal";
        calculated.iai = { value: parseFloat(iaiVal.toFixed(2)), classification, interpretation: "Es una ventaja competitiva en natación y lanzamientos" };
      } else if (iaiVal >= 80.0 && iaiVal <= 84.9) {
        classification = "Diametro biacromial proporcional respecto al diámetro biiliocristal";
        calculated.iai = { value: parseFloat(iaiVal.toFixed(2)), classification };
      } else if (iaiVal >= 85.0) {
        classification = "Diametro biacromial proporcionalmente más ancho estrecho al diámetro biiliocristal";
        calculated.iai = { value: parseFloat(iaiVal.toFixed(2)), classification, interpretation: "Es una ventaja competitiva en lucha guecorromana" };
      }

    }

  } else {
    calculated.iai = { value: null, classification: "No clasificable" };
  }

  // 15. Índice braquial (IB)
  if (longRadialeStylionCm != null && longAcromialeRadialeCm != null && longAcromialeRadialeCm > 0) {

    //Se estaba calculando mal
    // const ibBraquialVal = (longRadialeStylionCm * 100) / longAcromialeRadialeCm;

    const ibBraquialVal = (longAcromialeRadialeCm / longRadialeStylionCm) * 100;

    let classification = "No clasificable";
    if (ibBraquialVal <= 77.9) {
      classification = "Braquípicos (antebrazo corto)";
      calculated.ibBraquial = { value: parseFloat(ibBraquialVal.toFixed(2)), classification, interpretation: "Es una ventaja competitiva en levantamiento de pesas, anillas y lucha libre" };
    } else if (ibBraquialVal >= 78.0 && ibBraquialVal <= 82.9) {
      classification = "Metropicos (antebrazo normal)";
      calculated.ibBraquial = { value: parseFloat(ibBraquialVal.toFixed(2)), classification };
    } else if (ibBraquialVal >= 83.0) {
      classification = "Macropicos (antebrazo largo)";
      calculated.ibBraquial = { value: parseFloat(ibBraquialVal.toFixed(2)), classification, interpretation: "Es una ventaja competitiva en piraguismo, waterpolo, lacrosse, escalada, baseball y balonmano" };
    }

  } else {
    calculated.ibBraquial = { value: null, classification: "No clasificable" };
  }

  // 16. Longitud relativa miembro superior (LRMS)
  const longAcromialeDactilionCm = safeAdd(longAcromialeRadialeCm, longRadialeStylionCm, longStylionMedioDactylionCm);
  if (longAcromialeDactilionCm != null && tallaCm != null && tallaCm > 0) {
    const lrmsVal = (longAcromialeDactilionCm * 100) / tallaCm;
    let classification = "No clasificable";

    if (lrmsVal <= 44.9) {
      classification = "Braquibraquiales (miembros superiores cortos)";
      calculated.lrms = { value: parseFloat(lrmsVal.toFixed(2)), classification, interpretation: "Podría ser ventajoso en actividades que requieren estabilidad o fuerza en la parte inferior del cuerpo" };

    } else if (lrmsVal >= 45.0 && lrmsVal <= 46.9) {
      classification = "Metriobraquial (miembros superiores medio)";
      calculated.lrms = { value: parseFloat(lrmsVal.toFixed(2)), classification };

    } else if (lrmsVal >= 47.0) {
      classification = "Macrobraquiales (miembros superiores largos)";
      calculated.lrms = { value: parseFloat(lrmsVal.toFixed(2)), classification, interpretation: "Esto puede ser una ventaja en deportes que requieren un mayor alcance, como natación, baloncesto o deportes de combate" };
    }


  } else {
    calculated.lrms = { value: null, classification: "No clasificable" };
  }

  // 17. Índice de Manouvrier (IM)
  if (tallaCm != null && tallaSentadaCm != null && tallaSentadaCm > 0) {
    const imVal = ((tallaCm - tallaSentadaCm) * 100) / tallaSentadaCm;
    let classification = "No clasificable";
    if (imVal <= 84.9) classification = "Braquiesquélicos (miembros inferiores cortos)";
    else if (imVal >= 85.0 && imVal <= 89.9) classification = "Mesosquélicos (miembros inferiores normales)";
    else if (imVal >= 90.0) classification = "Macroesquélicos (miembros inferiores largos)";
    calculated.imManouvrier = { value: parseFloat(imVal.toFixed(2)), classification };
  } else {
    calculated.imManouvrier = { value: null, classification: "No clasificable" };
  }

  // 18. Longitud relativa miembro inferior (LRMI)
  if (alturaIliospinaleCm != null && tallaCm != null && tallaCm > 0) {
    const lrmiVal = (alturaIliospinaleCm * 100) / tallaCm;
    let classification = "No clasificable";
    if (lrmiVal <= 54.9) {
      classification = "Braquiesquélicos (miembros inferiores cortos)";
      calculated.lrmi = { value: parseFloat(lrmiVal.toFixed(2)), classification, interpretation: "Puede ser ventajoso en actividades que requieren fuerza central o estabilidad, como levantamiento de pesas o gimnasia" };
    } else if (lrmiVal >= 55.0 && lrmiVal <= 56.9) {
      classification = "Mesosquélicos (miembros inferiores normales)";
    } else if (lrmiVal >= 57.0) {
      classification = "Macroesquélicos (miembros inferiores largos)";
      calculated.lrmi = { value: parseFloat(lrmiVal.toFixed(2)), classification, interpretation: "Puede ser ventajoso en deportes que dependen de zancadas largas o potencia en las piernas, como atletismo (carreras de velocidad o saltos) o ciclismo" };
    }
  } else {
    calculated.lrmi = { value: null, classification: "No clasificable" };
  }

  // 19. Índice crural (IC)
  // Este indice solo se puede calculas en las pruebas de perfil completo

  if (longitudTibialeMedialeSphyrionTibialeCm != null && longTrochanterionTibialeLateraleCm != null
    && longTrochanterionTibialeLateraleCm > 0 && longitudTibialeMedialeSphyrionTibialeCm > 0) {

    const icCruralVal = (longitudTibialeMedialeSphyrionTibialeCm / longTrochanterionTibialeLateraleCm) * 100;

    let classification = "No clasificable";

    if (icCruralVal < 85) {
      classification = "Braquípico (pierna corta y muslo largo)";
      calculated.icCrural = { value: parseFloat(icCruralVal.toFixed(2)), classification, interpretation: "Es una ventaja competitiva en ciclismo de ruta, fondo, maratón" };
    } else if (icCruralVal >= 85 && icCruralVal <= 100) {
      classification = "Mesópico (pierna y muslo proporcionales)";
      calculated.icCrural = { value: parseFloat(icCruralVal.toFixed(2)), classification };
    } else if (icCruralVal > 100) {
      classification = "Macrópico (pierna larga y muslo corto)";
      calculated.icCrural = { value: parseFloat(icCruralVal.toFixed(2)), classification, interpretation: "Es una ventaja competitiva en velocidad y saltos" };
    }

  } else {
    calculated.icCrural = { value: null, classification: "No calculable (datos insuficientes/no precisos)" };
  }


  // 20. Índice intermembral
  if (longAcromialeRadialeCm != null && longRadialeStylionCm != null && longStylionMedioDactylionCm != null && alturaIliospinaleCm != null && alturaIliospinaleCm > 0) {
    const indiceIntermembralVal = ((longAcromialeRadialeCm + longRadialeStylionCm + longStylionMedioDactylionCm) / alturaIliospinaleCm) * 100;
    calculated.iIntermembral = parseFloat(indiceIntermembralVal.toFixed(2));
  } else {
    calculated.iIntermembral = null;
  }

  // 21. Índice musculoso oseo
  if (masaKg != null && masaOseaKg != null) {
    calculated.iMusculoOseo = masaKg / masaOseaKg;
  }

  // 22. Índice adiposo muscular
  if (masaMuscularKg != null && masaAdiposaKg != null) {
    calculated.iAdiposoMuscular = masaAdiposaKg / masaMuscularKg;
  }

  // Esto solo aplica para niños y adolescentes menores de 18 años y para pruebas tipo restringido, 5 componentes y completo
  if (calculated_age != null && calculated_age < 18 && tallaSentadaCm != null) {

    // 20. Índice de maduracion
    const longitudPiernaCm = tallaCm != null && tallaSentadaCm != null ? tallaCm - tallaSentadaCm : null;
    let indiceMaduracion: number | null = null;

    if (longitudPiernaCm != null && tallaSentadaCm != null && masaKg != null && tallaCm != null && calculated_age != null) {
      if (sexString === "Masculino") {
        indiceMaduracion =
          -9.236 +
          (0.0002708 * longitudPiernaCm * tallaSentadaCm) -
          (0.001663 * calculated_age * longitudPiernaCm) +
          (0.007216 * calculated_age * tallaSentadaCm) +
          (0.02292 * (masaKg / (tallaCm / 100)));
      } else if (sexString === "Femenino") {
        indiceMaduracion =
          -9.376 +
          (0.0001882 * longitudPiernaCm * tallaSentadaCm) +
          (0.0022 * calculated_age * longitudPiernaCm) +
          (0.005841 * calculated_age * tallaSentadaCm) -
          (0.002658 * calculated_age * masaKg) +
          (0.07693 * (masaKg / (tallaCm / 100)));
      }
    }

    calculated.indiceMaduracion = indiceMaduracion != null ? parseFloat(indiceMaduracion.toFixed(2)) : null;

    // 21. Edad PHV
    let edadPhv: number | null = null;

    if (indiceMaduracion != null && calculated_age != null) {
      edadPhv = calculated_age - indiceMaduracion;
    }

    calculated.edadPhv = edadPhv != null ? parseFloat(edadPhv.toFixed(2)) : null;

    // 22. Clasificación
    let clasMaduracion: string | null = null;

    if (sexString === "Masculino") {
      if (edadPhv != null) {
        if (edadPhv < 13) clasMaduracion = "TEMP";
        else if (edadPhv < 15) clasMaduracion = "NORM";
        else clasMaduracion = "TARD";
      }
    } else if (sexString === "Femenino") {
      if (edadPhv != null) {
        if (edadPhv < 11) clasMaduracion = "TEMP";
        else if (edadPhv < 13) clasMaduracion = "NORM";
        else clasMaduracion = "TARD";
      }
    }
    calculated.clasMaduracion = clasMaduracion;

    // 23. Falta de crecimiento (cm)
    let faltaCm: number | null = null;

    if (indiceMaduracion != null && clasMaduracion && clasMaduracion !== "No clasificable") {
      // Buscar la fila más cercana al índice de maduración (como hace COINCIDIR en Excel)
      const closestRow = EST_TALLA_ADULTA.reduce((prev, curr) =>
        Math.abs(curr.z - indiceMaduracion!) < Math.abs(prev.z - indiceMaduracion!) ? curr : prev
      );

      if (closestRow) {
        if (sexString === "Masculino") {
          faltaCm = closestRow.hombre[clasMaduracion as keyof typeof closestRow.hombre];
        } else if (sexString === "Femenino") {
          faltaCm = closestRow.mujer[clasMaduracion as keyof typeof closestRow.mujer];
        }
      }
    }

    calculated.faltaCm = faltaCm != null ? parseFloat(faltaCm.toFixed(2)) : null;


    // 24. Estatura adulta estimada
    let estaturaAdultaEst: number | null = null;

    if (tallaCm != null && faltaCm != null) {
      estaturaAdultaEst = tallaCm + faltaCm;
    }
    calculated.estaturaAdultaEst = estaturaAdultaEst != null ? parseFloat(estaturaAdultaEst.toFixed(2)) : null;

    // 25. Edad estimada de la talla adulta
    let edadEstimadaTallaAdulta: number | null = null;

    if (edadPhv != null && clasMaduracion && (sexString === "Masculino")) {
      if (clasMaduracion === "TEMP" || clasMaduracion === "NORM") edadEstimadaTallaAdulta = edadPhv + 4;
      else if (clasMaduracion === "TARD") edadEstimadaTallaAdulta = edadPhv + 3;
    } else if (edadPhv != null && (sexString === "Femenino")) {
      edadEstimadaTallaAdulta = edadPhv + 4;
    }

    calculated.edadEstimadaTallaAdulta = edadEstimadaTallaAdulta != null ? parseFloat(edadEstimadaTallaAdulta.toFixed(2)) : null;

  }


  // Calculate Z-Score Profile
  const zScoreProfileData: ZScoreData[] = [];
  for (const def of MACROINDICES_DEFINITIONS) {
    const measureKey = def.id as keyof Omit<MacroindicesResults, 'calculatedIndices'>;
    const phantomMetric = PHANTOM_METRICS[measureKey];
    const rawMeasure = rawMeasures[measureKey];

    if (phantomMetric && rawMeasure && typeof rawMeasure.result === 'number') {
      const zScore = safeDivide(safeSubtract(rawMeasure.result, phantomMetric.P), phantomMetric.SD);
      zScoreProfileData.push({
        id: measureKey,
        label: def.label,
        zScore: zScore != null ? parseFloat(zScore.toFixed(2)) : null,
        originalValue: rawMeasure.result,
        phantomMean: phantomMetric.P,
        phantomSD: phantomMetric.SD,
        unit: phantomMetric.unit,
      });
    }
  }
  calculated.zScoreProfile = zScoreProfileData.length > 0 ? zScoreProfileData : undefined;


  return calculated;
}
