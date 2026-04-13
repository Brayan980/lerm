
import type { ComposicionCorporalResults, InitialRegistrationData, CalculatedComposicionCorporal, ComposicionCorporalCategoria, KerrBodyComposition } from './types';
import { FraccionamientoAntropometrico } from './kerr-fractionation'

export function safeLog10(value: number | null | undefined): number | null {
  if (value == null || value <= 0) {
    return null;
  }
  return Math.log10(value);
}

export function safePow(base: number | null | undefined, exponent: number): number | null {
    if (base == null) return null;
    return Math.pow(base, exponent);
}

export function safeSum(...values: (number | null | undefined)[]): number | null {
  let sum = 0;
  let hasNullInSum = false;
  for (const value of values) {
    if (value == null) {
      hasNullInSum = true;
      // For sum, if any critical value is null, the whole sum might be null.
      // However, if it's a sum of many optional terms, we might sum the non-null ones.
      // For now, strict: if any is null, sum is null unless specifically handled.
    } else {
        sum += value;
    }
  }
  if (hasNullInSum && values.some(v => v == null && !values.every(v => v == null))) {
      // This logic can be adjusted based on how "sum of nulls" should behave.
      // If any essential part of a sum is null, the sum itself is null.
      // If we sum optional parts, and some are null, we sum the existing ones.
      // For Kerr residual, this is critical.
  }
  return sum; // This sum includes nulls as 0 if not all are null
}

export function strictSafeSum(...values: (number | null | undefined)[]): number | null {
    let sum = 0;
    for (const value of values) {
        if (value == null) return null; // If any value is null, the sum is null
        sum += value;
    }
    return sum;
}


export function safeMultiply(...values: (number | null | undefined)[]): number | null {
  if (values.length === 0) return null;
  let product = 1;
  for (const value of values) {
    if (value == null) return null;
    product *= value;
  }
  return product;
}

export function safeSubtract(val1: number | null | undefined, val2: number | null | undefined): number | null {
    if (val1 == null || val2 == null) return null;
    return val1 - val2;
}

export function safeDivide(numerator: number | null | undefined, denominator: number | null | undefined): number | null {
  if (numerator == null || denominator == null || denominator === 0) {
    return null;
  }
  return numerator / denominator;
}


export function calculateAllComposicionCorporal(
  directMeasures: ComposicionCorporalResults | undefined,
  participantData: InitialRegistrationData | undefined
): CalculatedComposicionCorporal | undefined {
  if (!directMeasures || !participantData) return undefined;

  const calculated: CalculatedComposicionCorporal = {};
  const { calculated_age, sex: sexString } = participantData;

  const sexNum = sexString === 'Masculino' ? 1 : (sexString === 'Femenino' ? 0 : null);
  const etniaNum = 0; 

  const pesoKg = directMeasures.peso?.result;
  const estaturaCm = directMeasures.estatura?.result;
  const estaturaM = estaturaCm != null ? estaturaCm / 100 : null;

  const pliegueTriMm = directMeasures.pliegueTricipital?.result;
  const pliegueSubMm = directMeasures.pliegueSubescapular?.result;
  const pliegueSuprailiacoMm = directMeasures.pliegueSuprailíaco?.result; 
  const pliegueBicMm = directMeasures.pliegueBiceps?.result;
  const pliegueAbdominalMm = directMeasures.pliegueAbdominal?.result;
  const pliegueMusloAnteriorMm = directMeasures.pliegueMusloAnterior?.result; 
  const plieguePantorrillaMedialMm = directMeasures.plieguePantorrillaMedial?.result; 
  
  // const plieguePectoralMm = directMeasures.plieguePectoral?.result;
  // const pliegueAxilarMedioMm = directMeasures.pliegueAxilarMedio?.result;


  const diametroMuñecaCm = directMeasures.diametroBiestiloideo?.result;
  const diametroMuñecaM = diametroMuñecaCm != null ? diametroMuñecaCm / 100 : null;
  const diametroFemurCm = directMeasures.diametroFemur?.result; 
  const diametroFemurM = diametroFemurCm != null ? diametroFemurCm / 100 : null;
  const diametroHumeroCm = directMeasures.diametroHumero?.result; 
  const diametroHumeroM = diametroHumeroCm != null ? diametroHumeroCm / 100 : null;
  
  const circCinturaCm = directMeasures.circCintura?.result; 
  const circMunecaCm = directMeasures.circMuneca?.result; 
  const circMunecaM = circMunecaCm != null ? circMunecaCm / 100 : null;

  let dcDurnin: number | null = null;
  const sum4PlieguesDurnin = strictSafeSum(pliegueTriMm, pliegueBicMm, pliegueSubMm, pliegueSuprailiacoMm);
  const logSum4PlieguesDurnin = safeLog10(sum4PlieguesDurnin);

  if (logSum4PlieguesDurnin != null && calculated_age != null && sexNum != null && calculated_age >= 17) {
    if (sexNum === 1) { // Hombres
      if (calculated_age >= 17 && calculated_age < 20) dcDurnin = safeSubtract(1.1620, safeMultiply(0.0630, logSum4PlieguesDurnin));
      else if (calculated_age >= 20 && calculated_age <= 29) dcDurnin = safeSubtract(1.1631, safeMultiply(0.0632, logSum4PlieguesDurnin));
      else if (calculated_age >= 30 && calculated_age <= 39) dcDurnin = safeSubtract(1.1422, safeMultiply(0.0544, logSum4PlieguesDurnin));
      else if (calculated_age >= 40 && calculated_age <= 49) dcDurnin = safeSubtract(1.1620, safeMultiply(0.0700, logSum4PlieguesDurnin));
      else if (calculated_age >= 50 && calculated_age <= 72) dcDurnin = safeSubtract(1.1715, safeMultiply(0.0799, logSum4PlieguesDurnin));
    } else { // Mujeres (sexNum === 0)
      if (calculated_age >= 17 && calculated_age < 20) dcDurnin = safeSubtract(1.1549, safeMultiply(0.0678, logSum4PlieguesDurnin));
      else if (calculated_age >= 20 && calculated_age <= 29) dcDurnin = safeSubtract(1.1599, safeMultiply(0.0717, logSum4PlieguesDurnin));
      else if (calculated_age >= 30 && calculated_age <= 39) dcDurnin = safeSubtract(1.1423, safeMultiply(0.0632, logSum4PlieguesDurnin));
      else if (calculated_age >= 40 && calculated_age <= 49) dcDurnin = safeSubtract(1.1333, safeMultiply(0.0612, logSum4PlieguesDurnin));
      else if (calculated_age >= 50 && calculated_age <= 68) dcDurnin = safeSubtract(1.1339, safeMultiply(0.0645, logSum4PlieguesDurnin));
    }
  }
  calculated.densidadCorporalDurnin = dcDurnin != null ? parseFloat(dcDurnin.toFixed(4)) : null;

  if (calculated.densidadCorporalDurnin != null && calculated.densidadCorporalDurnin > 0) {
    const mgSiri = safeSubtract(safeDivide(495, calculated.densidadCorporalDurnin), 450);
    calculated.porcentajeMasaGrasaSiri = mgSiri != null ? parseFloat(mgSiri.toFixed(2)) : null;
  } else {
    calculated.porcentajeMasaGrasaSiri = null;
  }
  
  if (circCinturaCm != null && pesoKg != null && sexNum != null && calculated_age !=null && calculated_age >=18 ) {
    if (sexNum === 1) { 
        const term1 = safeMultiply(0.31457, circCinturaCm);
        const term2 = safeMultiply(0.10969, pesoKg);
        const sumTerms = safeSubtract(term1, term2);
        const gcHombresObesos = strictSafeSum(sumTerms, 10.8336);
        calculated.porcentajeGrasaObesosHombres = gcHombresObesos != null ? parseFloat(gcHombresObesos.toFixed(2)) : null;
    } else { 
        if (estaturaCm != null) {
            const term1 = safeMultiply(0.11077, circCinturaCm);
            const term2 = safeMultiply(0.17666, estaturaCm);
            const term3 = safeMultiply(0.14354, pesoKg);
            const sumTerms = strictSafeSum(safeSubtract(term1, term2), term3, 51.03301);
            calculated.porcentajeGrasaObesosMujeres = sumTerms != null ? parseFloat(sumTerms.toFixed(2)) : null;
        } else {
            calculated.porcentajeGrasaObesosMujeres = null;
        }
    }
  } else {
    calculated.porcentajeGrasaObesosHombres = null;
    calculated.porcentajeGrasaObesosMujeres = null;
  }

  let categoria: ComposicionCorporalCategoria = 'No Aplicable';
  let mfKg: number | null = null;
  let moKg: number | null = null;
  let mmeKg: number | null = null;

  if (calculated_age != null && sexNum != null && estaturaM != null && pesoKg != null) {
    if (calculated_age < 18) { 
        categoria = 'Niño/Adolescente';
        const suma6Pliegues = strictSafeSum(pliegueTriMm, pliegueSubMm, pliegueSuprailiacoMm, pliegueAbdominalMm, pliegueMusloAnteriorMm, plieguePantorrillaMedialMm);
        
        if (suma6Pliegues != null) {
            mfKg = safeSubtract(safeMultiply(0.372, suma6Pliegues), 4.036);
        }
        
        if (diametroMuñecaM != null && diametroHumeroM != null && diametroFemurM != null) {
             const termAge = safeMultiply(0.057, calculated_age);
             const termAltura = safeMultiply(2.315, estaturaM);
             const termBiest = safeMultiply(2.279, diametroMuñecaM);
             const termEpicHum = safeMultiply(1.575, diametroHumeroM);
             const termEpicFem = safeMultiply(1.251, diametroFemurM);
             const sumTerms = strictSafeSum(termAge, termAltura, termBiest, termEpicHum, termEpicFem);
             moKg = safeSubtract(sumTerms, 72.351);
        }

        if (circMunecaM != null && circMunecaM > 0) {
            const termPeso = safeMultiply(0.244, pesoKg);
            const termAlturaMuneca = safeDivide(safePow(estaturaM, 2), circMunecaM);
            const termAMMult = safeMultiply(7.8, termAlturaMuneca);
            const termSexo = safeMultiply(6.6, sexNum);
            const termEdad = safeMultiply(0.098, calculated_age);
            
            const sumInitial = strictSafeSum(termPeso, termAMMult, termSexo, etniaNum);
            mmeKg = safeSubtract(sumInitial, termEdad);
        }

    } else { 
        if (sexNum === 1) { 
            categoria = 'Hombre Adulto';
            const termPesoMF = safeMultiply(0.24, pesoKg);
            const termPlAbdMF = safeMultiply(0.56, pliegueAbdominalMm);
            const termPlMusloMF = safeMultiply(0.43, pliegueMusloAnteriorMm);
            const termAlturaMF = safeMultiply(0.27, estaturaM);
            const sumInitialMF = strictSafeSum(-20.22, termPesoMF, termPlAbdMF, termPlMusloMF);
            mfKg = safeSubtract(sumInitialMF, termAlturaMF);

            if (diametroMuñecaM != null && diametroHumeroCm != null && diametroFemurCm != null) {
                const termAlturaBiest = safeMultiply(2.326, safePow(estaturaM, 2), diametroMuñecaM);
                const sumEpicsCm = strictSafeSum(diametroHumeroCm, diametroFemurCm);
                const termEpicsAdj = safeMultiply(sumEpicsCm, 0.001);
                moKg = strictSafeSum(3.023, termAlturaBiest, termEpicsAdj);
            }
            
            if (circMunecaM != null && circMunecaM > 0) {
                const termPesoMME = safeMultiply(0.244, pesoKg);
                const termAlturaMunecaMME = safeDivide(safePow(estaturaM, 2), circMunecaM);
                const termAMMultMME = safeMultiply(7.8, termAlturaMunecaMME);
                const termSexoMME = safeMultiply(6.6, 1); 
                const termEdadMME = safeMultiply(0.098, calculated_age);
                
                const sumInitialMME = strictSafeSum(termPesoMME, termAMMultMME, termSexoMME, etniaNum);
                mmeKg = safeSubtract(sumInitialMME, termEdadMME);
            }

        } else if (sexNum === 0) { 
            categoria = 'Mujer Adulta';
            const termPesoMF_F = safeMultiply(0.23, pesoKg);
            const termPlAbdMF_F = safeMultiply(0.50, pliegueAbdominalMm);
            const termPlMusloMF_F = safeMultiply(0.26, pliegueMusloAnteriorMm);
            const termAlturaMF_F = safeMultiply(0.14, estaturaM);
            const sumInitialMF_F = strictSafeSum(-10.34, termPesoMF_F, termPlAbdMF_F, termPlMusloMF_F);
            mfKg = safeSubtract(sumInitialMF_F, termAlturaMF_F);

            if (diametroMuñecaM != null && diametroHumeroCm != null && diametroFemurCm != null) {
                const termAlturaBiest = safeMultiply(2.326, safePow(estaturaM, 2), diametroMuñecaM);
                const sumEpicsCm = strictSafeSum(diametroHumeroCm, diametroFemurCm);
                const termEpicsAdj = safeMultiply(sumEpicsCm, 0.001);
                moKg = strictSafeSum(3.023, termAlturaBiest, termEpicsAdj);
            }

             if (circMunecaM != null && circMunecaM > 0) {
                const termPesoMME_F = safeMultiply(0.244, pesoKg);
                const termAlturaMunecaMME_F = safeDivide(safePow(estaturaM, 2), circMunecaM);
                const termAMMultMME_F = safeMultiply(7.8, termAlturaMunecaMME_F);
                const termSexoMME_F = safeMultiply(6.6, 0); 
                const termEdadMME_F = safeMultiply(0.098, calculated_age);
                
                const sumInitialMME_F = strictSafeSum(termPesoMME_F, termAMMultMME_F, termSexoMME_F, etniaNum);
                mmeKg = safeSubtract(sumInitialMME_F, termEdadMME_F);
            }
        }
    }
  }
  
  calculated.categoriaCalculo = categoria;
  calculated.masaGrasaKg = mfKg != null ? parseFloat(mfKg.toFixed(3)) : null;
  calculated.masaOseaKg = moKg != null ? parseFloat(moKg.toFixed(3)) : null;
  calculated.masaMuscularEsqueleticaKg = mmeKg != null ? parseFloat(mmeKg.toFixed(3)) : null;

  if (calculated_age != null && calculated_age >= 17 && calculated_age <= 25) {
    if (estaturaM != null && diametroMuñecaM != null && diametroFemurM != null) {
        const termInsideBracket = safeMultiply(safePow(estaturaM, 2), diametroMuñecaM, diametroFemurM, 400);
        const poweredTerm = safePow(termInsideBracket, 0.712);
        const moRocha = safeMultiply(3.02, poweredTerm);
        calculated.masaOseaRocha = moRocha != null ? parseFloat(moRocha.toFixed(2)) : null;
    } else {
        calculated.masaOseaRocha = null;
    }
  } else {
     calculated.masaOseaRocha = null;
  }

  if (participantData.sex != 'Otro'){
    const calculadoraFraccionamientoAntropometrico = new FraccionamientoAntropometrico({
      peso: directMeasures.peso.result!,
      altura: directMeasures.estatura.result!,
      sexo: participantData.sex,
      edad: participantData.calculated_age,
      alturaSentado: directMeasures.talla_sentado.result!,
      pliegueTriceps: directMeasures.pliegue_triceps.result!,
      pliegueSubescapular: directMeasures.pliegue_subescapular.result!,
      pliegueSupraespinal: directMeasures.pliegue_supraespinal.result!,
      pliegueAbdominal: directMeasures.pliegue_abdominal.result!,
      pliegueMusloFrontal: directMeasures.pliegue_muslo_frontal.result!,
      plieguePantorrilla: directMeasures.pliegue_pantorrilla.result!,
      perimetroCabeza: directMeasures.perimetro_cabeza.result!,
      perimetroBrazoRelajado: directMeasures.perimetro_brazo_relajado.result!,
      perimetroAntebrazo: directMeasures.perimetro_antebrazo.result!,
      perimetroMuslo: directMeasures.perimetro_muslo.result!,
      perimetroPantorrilla: directMeasures.perimetro_pantorrilla.result!,
      perimetroCajaToracica: directMeasures.perimetro_caja_toracica.result!,
      perimetroCintura: directMeasures.perimetro_cintura.result!,
      diametroBiacromial: directMeasures.diametro_biacromial.result!,
      diametroBiiliocristal: directMeasures.diametro_biiliocristal.result!,
      diametroHumero: directMeasures.diametro_humero.result!,
      diametroFemur: directMeasures.diametro_femur.result!,
      diametroApCajaToracica: directMeasures.diametro_ap_caja_toracica.result!,
      diametroTransversalCajaToracica: directMeasures.diametro_transversal_caja_toracica.result!
    });

    // const fraccionamiento = calculadoraFraccionamientoAntropometrico.calcularFraccionamientoCompleto();

    // const porcentajePiel = (fraccionamiento.masaPiel / fraccionamiento.masaTotalPredictiva * 100).toFixed(2);
    // const porcentajeAdiposa = (fraccionamiento.masaAdiposa / fraccionamiento.masaTotalPredictiva * 100).toFixed(2);
    // const porcentajeMuscular = (fraccionamiento.masaMuscular / fraccionamiento.masaTotalPredictiva * 100).toFixed(2);
    // const porcentajeOsea = (fraccionamiento.masaOseaTotal / fraccionamiento.masaTotalPredictiva * 100).toFixed(2);
    // const porcentajeResidual = (fraccionamiento.masaResidual / fraccionamiento.masaTotalPredictiva * 100).toFixed(2);

    // calculated.kerrComponents = {
    //   masaMuscular: {
    //     masaKg: fraccionamiento.masaMuscular != null ? parseFloat(fraccionamiento.masaMuscular.toFixed(2)) : null,
    //     porcentaje: parseFloat(porcentajeMuscular)
    //   },
    //   masaAdiposa: {
    //     masaKg:  fraccionamiento.masaAdiposa != null ? parseFloat(fraccionamiento.masaAdiposa.toFixed(2)): null,
    //     porcentaje: parseFloat(porcentajeAdiposa)
    //   },
    //   masaOsea: {
    //     masaKg: fraccionamiento.masaOseaTotal != null ? fraccionamiento.masaOseaTotal : null,
    //     porcentaje: parseFloat(porcentajeOsea)
    //   },
    //   masaPiel: {
    //     masaKg: fraccionamiento.masaPiel != null ? fraccionamiento.masaPiel : null,
    //     porcentaje: parseFloat(porcentajePiel)
    //   },
    //   masaResidual: {
    //     masaKg: fraccionamiento.masaResidual != null ? fraccionamiento.masaResidual : null,
    //     porcentaje: parseFloat(porcentajeResidual)
    //   },
    //   masaTotalKg: fraccionamiento.masaTotalPredictiva
    // }
    
    const fraccionamiento = calculadoraFraccionamientoAntropometrico.calcularFraccionamientoCompleto();

// Función helper para calcular porcentajes de forma segura
const calcularPorcentaje = (valor: number | null, total: number | null): number | null => {
  if (valor == null || total == null || total === 0) return null;
  return parseFloat(((valor / total) * 100).toFixed(2));
};

const porcentajePiel = calcularPorcentaje(fraccionamiento.masaPiel, fraccionamiento.masaTotalPredictiva);
const porcentajeAdiposa = calcularPorcentaje(fraccionamiento.masaAdiposa, fraccionamiento.masaTotalPredictiva);
const porcentajeMuscular = calcularPorcentaje(fraccionamiento.masaMuscular, fraccionamiento.masaTotalPredictiva);
const porcentajeOsea = calcularPorcentaje(fraccionamiento.masaOseaTotal, fraccionamiento.masaTotalPredictiva);
const porcentajeResidual = calcularPorcentaje(fraccionamiento.masaResidual, fraccionamiento.masaTotalPredictiva);

calculated.kerrComponents = {
  masaMuscular: {
    masaKg: fraccionamiento.masaMuscular != null ? parseFloat(fraccionamiento.masaMuscular.toFixed(2)) : null,
    porcentaje: porcentajeMuscular
  },
  masaAdiposa: {
    masaKg: fraccionamiento.masaAdiposa != null ? parseFloat(fraccionamiento.masaAdiposa.toFixed(2)) : null,
    porcentaje: porcentajeAdiposa
  },
  masaOsea: {
    masaKg: fraccionamiento.masaOseaTotal != null ? parseFloat(fraccionamiento.masaOseaTotal.toFixed(2)) : null,
    porcentaje: porcentajeOsea
  },
  masaPiel: {
    masaKg: fraccionamiento.masaPiel != null ? parseFloat(fraccionamiento.masaPiel.toFixed(2)) : null,
    porcentaje: porcentajePiel
  },
  masaResidual: {
    masaKg: fraccionamiento.masaResidual != null ? parseFloat(fraccionamiento.masaResidual.toFixed(2)) : null,
    porcentaje: porcentajeResidual
  },
  masaTotalKg: fraccionamiento.masaTotalPredictiva != null ? parseFloat(fraccionamiento.masaTotalPredictiva.toFixed(2)) : null
};

  }else{
    calculated.kerrComponents = undefined;
  }

  return calculated;
}
