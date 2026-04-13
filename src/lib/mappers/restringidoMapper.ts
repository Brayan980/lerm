import type { RestringidoResults, GenericMeasure, MacroindicesResults, SomatotipoResults, InitialRegistrationData } from "@/lib/types";
import { Medidas4Componentes, Resultados4Componentes } from "../medidas4Componentes";

export function mapRestringidoToMacroindices(restringido: RestringidoResults): MacroindicesResults {
  const safe = (m?: GenericMeasure): GenericMeasure => m ?? { m1: null, m2: null, m3: null, result: null };

  return {
    // Medidas básicas
    masaCorporal: safe(restringido.medidas_basicas?.masa_corporal),
    talla: safe(restringido.medidas_basicas?.talla),
    tallaSentada: safe(restringido.medidas_basicas?.talla_sentado),
    envergaduraBrazos: safe(restringido.medidas_basicas?.envergadura_brazos),
  
    // Pliegues cutáneos
    pliegueTriceps: safe(restringido.pliegues_cutaneos?.triceps),
    pliegueSubescapular: safe(restringido.pliegues_cutaneos?.subescapular),
    pliegueBiceps: safe(restringido.pliegues_cutaneos?.biceps),
    pliegueCrestaIliaca: safe(restringido.pliegues_cutaneos?.cresta_iliaca),
    pliegueSupraespinal: safe(restringido.pliegues_cutaneos?.supraespinal),
    pliegueAbdominal: safe(restringido.pliegues_cutaneos?.abdominal),
    pliegueMusloAnterior: safe(restringido.pliegues_cutaneos?.muslo),
    plieguePiernaMedial: safe(restringido.pliegues_cutaneos?.pierna_pliegue),

    // Perímetros
    perimetroCintura: safe(restringido.perimetros?.cintura),
    perimetroCadera: safe(restringido.perimetros?.caderas),
    perimetroBrazoRelajado: safe(restringido.perimetros?.brazo_relajado),
    perimetroBrazoFlexionadoContrido: safe(restringido.perimetros?.brazo_flexionado_contraido),
    perimetroMusloMedio: safe(restringido.perimetros?.muslo_medio),
    perimetroPierna: safe(restringido.perimetros?.pierna_perimetro),
    perimetroMuneca: safe(restringido.diametros?.biestiloideo), // ≈ biestiloideo

    // Diámetros
    diametroHumero: safe(restringido.diametros?.humero),
    diametroFemur: safe(restringido.diametros?.femur),

    // Campos no disponibles en "RestringidoResults" o no en el resultado final
    perimetroCabeza: safe(),
    perimetroCuello: safe(),
    perimetroTorax: safe(),
    perimetroAntebrazo: safe(),
    perimetroMusloSuperior: safe(),
    diametroBiacromial: safe(),
    diametroBiiliocristal: safe(),
    diametroAPAbdomen: safe(),
    longitudAcromialeRadiale: safe(),
    longitudRadialeStylion: safe(),
    longitudStylionMedioDactylion: safe(),
    alturaIliospinale: safe(),
    alturaTrochanterion: safe(),
    longitudTrochanterionTibialeLaterale: safe(),

    // calculatedIndices: undefined,
  };
}

export function mapRestringidoToSomatotipo(restringido: RestringidoResults): SomatotipoResults {
  const safe = (m?: GenericMeasure): GenericMeasure => m ?? { m1: null, m2: null, m3: null, result: null };

  return {
    // ✅ disponibles en Restringido
    pliegueTriceps: safe(restringido.pliegues_cutaneos?.triceps),
    pliegueSubescapular: safe(restringido.pliegues_cutaneos?.subescapular),
    pliegueSupraespinal: safe(restringido.pliegues_cutaneos?.supraespinal),
    plieguePiernaMedial: safe(restringido.pliegues_cutaneos?.pierna_pliegue),
    talla: safe(restringido.medidas_basicas?.talla),
    masaCorporal: safe(restringido.medidas_basicas?.masa_corporal),
    perimetroBrazoContraido: safe(restringido.perimetros?.brazo_flexionado_contraido),
    perimetroPierna: safe(restringido.perimetros?.pierna_perimetro),
    diametroHumero: safe(restringido.diametros?.humero),
    diametroFemur: safe(restringido.diametros?.femur),

    // bloque calculado (se llena después)
    // calculatedSomatotype: undefined,
  };
}

export function mapRestringidoToComposicionCorporal4Componentes(restringido: RestringidoResults, 
  participantData: InitialRegistrationData): Medidas4Componentes {

  return {
    peso: restringido.medidas_basicas.masa_corporal.result!, //kg
    altura: restringido.medidas_basicas.talla.result!, //cm
    sexo: participantData.sex === "Masculino" ? "Masculino" : "Femenino",
    edad: participantData.calculated_age,
    etnia: restringido.etnia,

    // Pliegues (mm)
    pliegueTriceps: restringido.pliegues_cutaneos.triceps.result!,
    pliegueSubescapular: restringido.pliegues_cutaneos.subescapular.result!,
    pliegueSupraespinal: restringido.pliegues_cutaneos.supraespinal.result!,
    pliegueAbdominal: restringido.pliegues_cutaneos.abdominal.result!,
    pliegueMusloFrontal: restringido.pliegues_cutaneos.muslo.result!,
    plieguePantorrilla: restringido.pliegues_cutaneos.pierna_pliegue.result!,
  
    // Perímetros (cm)
    perimetroBrazoRelajado: restringido.perimetros.brazo_relajado.result!,
    perimetroMusloMedio: restringido.perimetros.muslo_medio.result!,
    perimetroPierna: restringido.perimetros.pierna_perimetro.result!,
    
    // Diámetros (cm)
    diametroFemur: restringido.diametros.femur.result!,
    diametroMuñeca: restringido.diametros.biestiloideo.result!,
    diametroHumero: restringido.diametros.humero.result!
    // bloque calculado (se llena después)
    // calculatedComposicion: undefined,
  };
}
