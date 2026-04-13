import type { ComposicionCorporalResults, MacroindicesResults, SomatotipoResults, CompletoResults, GenericMeasure } from "@/lib/types";

export function mapCompletoToMacroindices(completo: CompletoResults): MacroindicesResults {
  const safe = (m?: GenericMeasure): GenericMeasure => m ?? { m1: null, m2: null, m3: null, result: null };

  return {
    // Medidas básicas
    masaCorporal: safe(completo.medidas_basicas?.masa_corporal),
    talla: safe(completo.medidas_basicas?.talla),
    tallaSentada: safe(completo.medidas_basicas?.talla_sentado),
    envergaduraBrazos: safe(completo.medidas_basicas?.envergadura_brazos),

    // Pliegues cutáneos
    pliegueTriceps: safe(completo.pliegues_cutaneos?.triceps),
    pliegueSubescapular: safe(completo.pliegues_cutaneos?.subescapular),
    pliegueBiceps: safe(completo.pliegues_cutaneos?.biceps),
    pliegueCrestaIliaca: safe(completo.pliegues_cutaneos?.cresta_iliaca),
    pliegueSupraespinal: safe(completo.pliegues_cutaneos?.supraespinal),
    pliegueAbdominal: safe(completo.pliegues_cutaneos?.abdominal),
    pliegueMusloAnterior: safe(completo.pliegues_cutaneos?.muslo),
    plieguePiernaMedial: safe(completo.pliegues_cutaneos?.pierna_pliegue),

    // Perímetros
    perimetroCabeza: safe(completo.perimetros?.cabeza),
    perimetroCuello: safe(completo.perimetros?.cuello),
    perimetroBrazoRelajado: safe(completo.perimetros?.brazo_relajado),
    perimetroBrazoFlexionadoContrido: safe(completo.perimetros?.brazo_flexionado_contraido),
    perimetroAntebrazo: safe(completo.perimetros?.antebrazo),
    perimetroMuneca: safe(completo.perimetros?.muneca),
    perimetroTorax: safe(completo.perimetros?.torax),
    perimetroCintura: safe(completo.perimetros?.cintura),
    perimetroCadera: safe(completo.perimetros?.caderas),
    perimetroMusloSuperior: safe(completo.perimetros?.muslo_1cm_gluteo),
    perimetroMusloMedio: safe(completo.perimetros?.muslo_medio),
    perimetroPierna: safe(completo.perimetros?.pierna_perimetro),

    // Diámetros
    diametroBiacromial: safe(completo.diametros?.biacromial),
    diametroBiiliocristal: safe(completo.diametros?.biliocrestal),
    diametroAPAbdomen: safe(completo.diametros?.antero_posterior_abdomen),
    diametroHumero: safe(completo.diametros?.humero),
    diametroFemur: safe(completo.diametros?.femur),

    // Longitudes y Alturas
    
    longitudAcromialeRadiale: safe(completo.longitudes_alturas?.acromiale_radiale),
    longitudTibialeMedialeSphyrionTibiale: safe(completo.longitudes_alturas?.tibiale_mediale_sphyrion_tibiale),
    longitudRadialeStylion: safe(completo.longitudes_alturas?.radiale_stylion),
    longitudStylionMedioDactylion: safe(completo.longitudes_alturas?.stylion_medio_dactylion),
    alturaIliospinale: safe(completo.longitudes_alturas?.altura_ilioespinale),
    alturaTrochanterion: safe(completo.longitudes_alturas?.altura_trochanterion),
    longitudTrochanterionTibialeLaterale: safe(completo.longitudes_alturas?.trochanterion_tibiale_laterale),
    
    // calculatedIndices: undefined,
  };
}

export function mapCompletoToSomatotipo(completo: CompletoResults): SomatotipoResults {
  const safe = (m?: GenericMeasure): GenericMeasure => m ?? { m1: null, m2: null, m3: null, result: null };

  return {
    // ✅ disponibles en Completo
    pliegueTriceps: safe(completo.pliegues_cutaneos?.triceps),
    pliegueSubescapular: safe(completo.pliegues_cutaneos?.subescapular),
    pliegueSupraespinal: safe(completo.pliegues_cutaneos?.supraespinal),
    plieguePiernaMedial: safe(completo.pliegues_cutaneos?.pierna_pliegue),
    talla: safe(completo.medidas_basicas?.talla),
    masaCorporal: safe(completo.medidas_basicas?.masa_corporal),
    perimetroBrazoContraido: safe(completo.perimetros?.brazo_flexionado_contraido),
    perimetroPierna: safe(completo.perimetros?.pierna_perimetro),
    diametroHumero: safe(completo.diametros?.humero),
    diametroFemur: safe(completo.diametros?.femur),

    // bloque calculado (se llena después)
    // calculatedSomatotype: undefined,
  };
}

export function mapCompletoToComposicionCorporal(completo: CompletoResults): ComposicionCorporalResults {
  const safe = (m?: GenericMeasure): GenericMeasure => m ?? { m1: null, m2: null, m3: null, result: null };

  return {

      peso: safe(completo.medidas_basicas?.masa_corporal),
      estatura: safe(completo.medidas_basicas?.talla),
      talla_sentado: safe(completo.medidas_basicas?.talla_sentado),
      pliegue_triceps: safe(completo.pliegues_cutaneos?.triceps),
      pliegue_subescapular: safe(completo.pliegues_cutaneos?.subescapular),
      pliegue_supraespinal: safe(completo.pliegues_cutaneos?.supraespinal),
      pliegue_abdominal: safe(completo.pliegues_cutaneos?.abdominal),
      pliegue_muslo_frontal: safe(completo.pliegues_cutaneos?.muslo),
      pliegue_pantorrilla: safe(completo.pliegues_cutaneos?.pierna_pliegue),
      perimetro_cabeza: safe(completo.perimetros?.cabeza),
      perimetro_brazo_relajado: safe(completo.perimetros?.brazo_relajado),
      perimetro_antebrazo: safe(completo.perimetros?.antebrazo),
      perimetro_muslo: safe(completo.perimetros?.muslo_medio),
      perimetro_pantorrilla: safe(completo.perimetros?.pierna_perimetro),
      perimetro_caja_toracica: safe(completo.perimetros?.torax),
      perimetro_cintura: safe(completo.perimetros?.cintura),
      diametro_biacromial: safe(completo.diametros?.biacromial),
      diametro_biiliocristal: safe(completo.diametros?.biliocrestal),
      diametro_humero: safe(completo.diametros?.humero),
      diametro_femur: safe(completo.diametros?.femur),
      diametro_ap_caja_toracica: safe(completo.diametros?.antero_posterior_torax),
      diametro_transversal_caja_toracica: safe(completo.diametros?.transverso_torax),

    // ✅ disponibles en Completo
    //Solo es de utilidad para los calculos que se hacen antes del fraccionamiento de composicion corporal
    circBrazoRelajado: safe(completo.perimetros?.brazo_relajado),
    circBrazoContraido: safe(completo.perimetros?.brazo_flexionado_contraido),
    circCintura: safe(completo.perimetros?.cintura),
    circCadera: safe(completo.perimetros?.caderas),
    circMuslo: safe(completo.perimetros?.muslo_medio),
    circPantorrilla: safe(completo.perimetros?.pierna_perimetro),
    circMuneca: safe(completo.perimetros?.muneca),
    pliegueTricipital: safe(completo.pliegues_cutaneos?.triceps),
    pliegueSubescapular: safe(completo.pliegues_cutaneos?.subescapular),
    pliegueSuprailíaco: safe(completo.pliegues_cutaneos?.supraespinal),
    pliegueAbdominal: safe(completo.pliegues_cutaneos?.abdominal),
    pliegueMusloAnterior: safe(completo.pliegues_cutaneos?.muslo),
    plieguePantorrillaMedial: safe(completo.pliegues_cutaneos?.pierna_pliegue),
    pliegueBiceps: safe(completo.pliegues_cutaneos?.biceps),
    diametroBiestiloideo: safe(completo.diametros?.biestiloideo),
    diametroHumero: safe(completo.diametros?.humero),
    diametroFemur: safe(completo.diametros?.femur),
    
    // ❌ No existen en "Completo" pero si en "ComposicionCorporalResults"
    plieguePectoral: safe(),
    pliegueAxilarMedio: safe(),

    // bloque calculado (se llena después)
    // calculatedComposicion: undefined,
  };
}