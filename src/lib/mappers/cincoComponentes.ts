import type { ComposicionCorporalResults, MacroindicesResults, SomatotipoResults, CincoComponentesResults, GenericMeasure } from "@/lib/types";

export function mapCincoComponentesToMacroindices(cincoComponentes: CincoComponentesResults): MacroindicesResults {
  const safe = (m?: GenericMeasure): GenericMeasure => m ?? { m1: null, m2: null, m3: null, result: null };

  return {
    // Medidas básicas
    masaCorporal: cincoComponentes.medidas_basicas.masa_corporal,
    talla: cincoComponentes.medidas_basicas.talla,
    tallaSentada: cincoComponentes.medidas_basicas.talla_sentado,

    // Pliegues cutáneos
    pliegueTriceps: cincoComponentes.pliegues_cutaneos.triceps,
    pliegueSubescapular: cincoComponentes.pliegues_cutaneos.subescapular,
    pliegueBiceps: cincoComponentes.pliegues_cutaneos.biceps,
    pliegueCrestaIliaca: cincoComponentes.pliegues_cutaneos.cresta_iliaca,
    pliegueSupraespinal: cincoComponentes.pliegues_cutaneos.supraespinal,
    pliegueAbdominal: cincoComponentes.pliegues_cutaneos.abdominal,
    pliegueMusloAnterior: cincoComponentes.pliegues_cutaneos.muslo,
    plieguePiernaMedial: cincoComponentes.pliegues_cutaneos.pierna_pliegue,

    // Perímetros
    perimetroCabeza: cincoComponentes.perimetros.cabeza,
    perimetroBrazoRelajado: cincoComponentes.perimetros.brazo_relajado,
    perimetroBrazoFlexionadoContrido: cincoComponentes.perimetros.brazo_flexionado_contraido,
    perimetroAntebrazo: cincoComponentes.perimetros.antebrazo,
    perimetroTorax: cincoComponentes.perimetros.torax,
    perimetroCintura: cincoComponentes.perimetros.cintura,
    perimetroCadera: cincoComponentes.perimetros.caderas,
    perimetroMusloMedio: cincoComponentes.perimetros.muslo_medio,
    perimetroPierna: cincoComponentes.perimetros.pierna_perimetro,

    // Diámetros
    diametroBiacromial: cincoComponentes.diametros.biacromial,
    diametroBiiliocristal: cincoComponentes.diametros.biliocrestal,
    diametroAPAbdomen: cincoComponentes.diametros.antero_posterior_torax,
    diametroHumero: cincoComponentes.diametros.humero,
    diametroFemur: cincoComponentes.diametros.femur,

    // El resto de campos no existen en "CincoComponentes" y se mapean como nulos o undefined.
    envergaduraBrazos: safe(),
    perimetroCuello: safe(),
    perimetroMuneca: safe(),
    perimetroMusloSuperior: safe(),
    longitudAcromialeRadiale: safe(),
    longitudRadialeStylion: safe(),
    longitudStylionMedioDactylion: safe(),
    alturaIliospinale: safe(),
    alturaTrochanterion: safe(),
    longitudTrochanterionTibialeLaterale: safe(),

    // calculatedIndices: undefined,
  };
}

export function mapCincoComponentesToSomatotipo(cincoComponentes: CincoComponentesResults): SomatotipoResults {
  const safe = (m?: GenericMeasure): GenericMeasure => m ?? { m1: null, m2: null, m3: null, result: null };

  return {
    // ✅ disponibles
    pliegueTriceps: safe(cincoComponentes.pliegues_cutaneos?.triceps),
    pliegueSubescapular: safe(cincoComponentes.pliegues_cutaneos?.subescapular),
    pliegueSupraespinal: safe(cincoComponentes.pliegues_cutaneos?.supraespinal),
    plieguePiernaMedial: safe(cincoComponentes.pliegues_cutaneos?.pierna_pliegue),
    talla: safe(cincoComponentes.medidas_basicas?.talla),
    masaCorporal: safe(cincoComponentes.medidas_basicas?.masa_corporal),
    perimetroBrazoContraido: safe(cincoComponentes.perimetros?.brazo_flexionado_contraido),
    perimetroPierna: safe(cincoComponentes.perimetros?.pierna_perimetro),
    diametroHumero: safe(cincoComponentes.diametros?.humero),
    diametroFemur: safe(cincoComponentes.diametros?.femur),

    // bloque calculado (se llena después)
    // calculatedSomatotype: undefined,
  };
}

export function mapCincoComponentesToComposicionCorporal(cincoComponentes: CincoComponentesResults): ComposicionCorporalResults {
  const safe = (m?: GenericMeasure): GenericMeasure => m ?? { m1: null, m2: null, m3: null, result: null };

  return {
    // ✅ disponibles
    peso: safe(cincoComponentes.medidas_basicas?.masa_corporal),
    estatura: safe(cincoComponentes.medidas_basicas?.talla),
    talla_sentado: safe(cincoComponentes.medidas_basicas?.talla_sentado),
    pliegue_triceps: safe(cincoComponentes.pliegues_cutaneos?.triceps),
    pliegue_subescapular: safe(cincoComponentes.pliegues_cutaneos?.subescapular),
    pliegue_supraespinal: safe(cincoComponentes.pliegues_cutaneos?.supraespinal),
    pliegue_abdominal: safe(cincoComponentes.pliegues_cutaneos?.abdominal),
    pliegue_muslo_frontal: safe(cincoComponentes.pliegues_cutaneos?.muslo),
    pliegue_pantorrilla: safe(cincoComponentes.pliegues_cutaneos?.pierna_pliegue),
    perimetro_cabeza: safe(cincoComponentes.perimetros?.cabeza),
    perimetro_brazo_relajado: safe(cincoComponentes.perimetros?.brazo_relajado),
    perimetro_antebrazo: safe(cincoComponentes.perimetros?.antebrazo),
    perimetro_muslo: safe(cincoComponentes.perimetros?.muslo_medio),
    perimetro_pantorrilla: safe(cincoComponentes.perimetros?.pierna_perimetro),
    perimetro_caja_toracica: safe(cincoComponentes.perimetros?.torax),
    perimetro_cintura: safe(cincoComponentes.perimetros?.cintura),
    diametro_biacromial: safe(cincoComponentes.diametros?.biacromial),
    diametro_biiliocristal: safe(cincoComponentes.diametros?.biliocrestal),
    diametro_humero: safe(cincoComponentes.diametros?.humero),
    diametro_femur: safe(cincoComponentes.diametros?.femur),
    diametro_ap_caja_toracica: safe(cincoComponentes.diametros?.antero_posterior_torax),
    diametro_transversal_caja_toracica: safe(cincoComponentes.diametros?.transverso_torax),

    //Solo es de utilidad para los calculos que se hacen antes del fraccionamiento de composicion corporal
    circCintura: safe(cincoComponentes.perimetros?.cintura),
    circCadera: safe(cincoComponentes.perimetros?.caderas),
    circBrazoRelajado: safe(cincoComponentes.perimetros?.brazo_relajado),
    circBrazoContraido: safe(cincoComponentes.perimetros?.brazo_flexionado_contraido),
    circMuslo: safe(cincoComponentes.perimetros?.muslo_medio),
    circPantorrilla: safe(cincoComponentes.perimetros?.pierna_perimetro),
    pliegueTricipital: safe(cincoComponentes.pliegues_cutaneos?.triceps),
    pliegueSubescapular: safe(cincoComponentes.pliegues_cutaneos?.subescapular),
    pliegueSuprailíaco: safe(cincoComponentes.pliegues_cutaneos?.supraespinal), // ≈ supraespinal
    pliegueAbdominal: safe(cincoComponentes.pliegues_cutaneos?.abdominal),
    pliegueMusloAnterior: safe(cincoComponentes.pliegues_cutaneos?.muslo),
    plieguePantorrillaMedial: safe(cincoComponentes.pliegues_cutaneos?.pierna_pliegue),
    pliegueBiceps: safe(cincoComponentes.pliegues_cutaneos?.biceps),
    diametroHumero: safe(cincoComponentes.diametros?.humero),
    diametroFemur: safe(cincoComponentes.diametros?.femur),

    // ❌ no existen
    plieguePectoral: safe(),
    pliegueAxilarMedio: safe(),
    diametroBiestiloideo: safe(),
    circMuneca: safe(),
    
    // calculatedComposicion: undefined,
  };
}