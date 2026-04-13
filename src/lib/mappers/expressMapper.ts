import type { ComposicionCorporalResults, ExpressResults, GenericMeasure, InitialRegistrationData, MacroindicesResults, SomatotipoResults } from "@/lib/types";
import { Medidas2Componentes } from "../composicionCorporal2Componentes";

export function mapExpressToMacroindices(express: ExpressResults): MacroindicesResults {
  return {
    // medidas básicas
    masaCorporal: express.medidas_basicas.masa_corporal,
    talla: express.medidas_basicas.talla,

    // pliegues
    pliegueTriceps: express.pliegues_cutaneos.triceps,
    pliegueSubescapular: express.pliegues_cutaneos.subescapular,
    pliegueSupraespinal: express.pliegues_cutaneos.supraespinal,
    pliegueAbdominal: express.pliegues_cutaneos.abdominal,
    pliegueMusloAnterior: express.pliegues_cutaneos.muslo,
    plieguePiernaMedial: express.pliegues_cutaneos.pierna_pliegue,

    // perímetros
    perimetroCintura: express.perimetros.cintura,
    perimetroCadera: express.perimetros.caderas,
    perimetroBrazoRelajado: express.perimetros.brazo_relajado,
    perimetroBrazoFlexionadoContrido: express.perimetros.brazo_flexionado_contraido,
    perimetroMusloMedio: express.perimetros.muslo_medio,
    perimetroPierna: express.perimetros.pierna_perimetro,

    // Indices
    // calculatedIndices: express.calculatedIndices
  };
}

// export function mapExpressToSomatotipo(express: ExpressResults): SomatotipoResults {
//   const safe = (m?: GenericMeasure): GenericMeasure => m ?? { m1: null, m2: null, m3: null, result: null };

//   return {
//     // ✔ disponibles en Express
//     pliegueTriceps: safe(express.pliegues_cutaneos?.triceps),
//     pliegueSubescapular: safe(express.pliegues_cutaneos?.subescapular),
//     pliegueSupraespinal: safe(express.pliegues_cutaneos?.supraespinal),
//     talla: safe(express.medidas_basicas?.talla),
//     masaCorporal: safe(express.medidas_basicas?.masa_corporal),


//     perimetroBrazoContraido: safe(express.perimetros.brazo_flexionado_contraido),
//     perimetroPierna: safe(express.perimetros.pierna_perimetro),
//     plieguePiernaMedial: safe(express.pliegues_cutaneos.muslo), //No estoy seguro si es lo mismo muslo que mierna medial

//     // ❌ no existen en Express → null
//     diametroHumero: safe(),
//     diametroFemur: safe(),
//     // bloque calculado (se llena después)
//     // calculatedSomatotype: undefined,
//   };
// }


export function mapExpressToComposicionCorporal2Componentes(express: ExpressResults, 
  participantData: InitialRegistrationData): Medidas2Componentes {
  const safe = (m?: GenericMeasure): GenericMeasure =>
    m ?? { m1: null, m2: null, m3: null, result: null };

  return {

    // Datos básicos
    altura: express.medidas_basicas.talla.result!, // cm
    sexo: participantData.sex === "Masculino" ? "Masculino" : "Femenino",
    edad: participantData.calculated_age, // años
    etnia: express.etnia,

    // Para masa muscular (Lee)
    pliegueTriceps: express.pliegues_cutaneos.triceps.result!,     // mm
    pliegueMusloFrontal: express.pliegues_cutaneos.muslo.result!,  // mm
    plieguePantorrilla: express.pliegues_cutaneos.pierna_pliegue.result!,   // mm

    perimetroBrazoRelajado: express.perimetros.brazo_relajado.result!, // cm
    perimetroMusloMedio: express.perimetros.muslo_medio.result!,    // cm
    perimetroPierna: express.perimetros.pierna_perimetro.result!,        // cm

    // Para masa adiposa (Kerr)
    pliegueSubescapular: express.pliegues_cutaneos.triceps.result!,  // mm
    pliegueSupraespinal: express.pliegues_cutaneos.supraespinal.result!,   // mm
    pliegueAbdominal: express.pliegues_cutaneos.abdominal.result!,      // mm


    // bloque calculado (se llena después)
    // calculatedComposicion: undefined,
  };
}