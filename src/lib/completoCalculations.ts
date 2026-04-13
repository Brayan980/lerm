// import type { CompletoResults } from './types';
// import { calculateCincoComponentesResults } from './cincoComponentesCalculations';

// interface CalculatedCompletoResults {
//   // Incluye todos los cálculos de 5 componentes
//   imc?: { value: number | null; classification?: string };
//   icc?: number | null;
//   ice?: number | null;
//   porcentajeGrasa?: { value: number | null; classification?: string };
//   densidadCorporal?: number | null;
//   masaGrasa?: { value: number | null; classification?: string };
//   masaMuscular?: { value: number | null; classification?: string };
//   indiceCormico?: { value: number | null; classification?: string };
//   masaOsea?: { value: number | null; classification?: string };
//   masaResidual?: { value: number | null; classification?: string };
//   masaPiel?: { value: number | null; classification?: string };
//   distribucionComponentes?: {
//     masaMuscular: number;
//     masaGrasa: number;
//     masaOsea: number;
//     masaResidual: number;
//     masaPiel: number;
//   } | null;

//   // Cálculos específicos del protocolo completo
//   perfilZ?: Array<{
//     medida: string;
//     valor: number;
//     zScore: number;
//     media: number;
//     desviacionEstandar: number;
//   }>;
//   somatotipo?: {
//     endomorfia: number;
//     mesomorfia: number;
//     ectomorfia: number;
//     clasificacion: string;
//   };
// }

// export function calculateCompletoResults(
//   data: CompletoResults, 
//   sex: 'Masculino' | 'Femenino', 
//   age: number
// ): CalculatedCompletoResults {
//   if (!data.medidas_basicas?.masa_corporal?.result || !data.medidas_basicas?.talla?.result) {
//     return {};
//   }

//   // Primero calculamos todo lo que ya tenemos en 5 componentes
//   const cincoComponentesData = {
//     medidas_basicas: data.medidas_basicas,
//     pliegues_cutaneos: data.pliegues_cutaneos,
//     perimetros: data.perimetros
//   };

//   const cincoComponentesResults = calculateCincoComponentesResults(cincoComponentesData, sex, age);

//   // Cálculo del somatotipo (Heath-Carter)
//   let somatotipo = null;
//   const peso = data.medidas_basicas.masa_corporal.result;
//   const talla = data.medidas_basicas.talla.result;
//   const triceps = data.pliegues_cutaneos?.triceps?.result;
//   const subescapular = data.pliegues_cutaneos?.subescapular?.result;
//   const supraespinal = data.pliegues_cutaneos?.supraespinal?.result;
//   const humero = data.diametros?.humero?.result;
//   const femur = data.diametros?.femur?.result;
//   const brazoFlexionado = data.perimetros?.brazo_flexionado_contraido?.result;
//   const pantorrilla = data.perimetros?.pierna?.result;

//   if (triceps && subescapular && supraespinal && 
//       humero && femur && brazoFlexionado && pantorrilla) {
    
//     // Cálculo de la endomorfia
//     const sumaPliegues = triceps + subescapular + supraespinal;
//     const endomorfia = -0.7182 + 0.1451 * sumaPliegues - 0.00068 * Math.pow(sumaPliegues, 2) + 0.0000014 * Math.pow(sumaPliegues, 3);

//     // Cálculo de la mesomorfia
//     const mesomorfia = (0.858 * humero + 0.601 * femur + 
//                        0.188 * (brazoFlexionado - triceps/10) + 
//                        0.161 * (pantorrilla - subescapular/10)) - 
//                        (0.131 * talla) + 4.5;

//     // Cálculo de la ectomorfia
//     const ip = talla / Math.pow(peso, 1/3);
//     let ectomorfia;
//     if (ip >= 40.75) {
//       ectomorfia = (0.732 * ip) - 28.58;
//     } else if (ip > 38.25) {
//       ectomorfia = (0.463 * ip) - 17.63;
//     } else {
//       ectomorfia = 0.1;
//     }

//     // Determinación de la clasificación
//     let clasificacion = '';
//     if (endomorfia > mesomorfia && endomorfia > ectomorfia) {
//       clasificacion = 'Endomorfo';
//     } else if (mesomorfia > endomorfia && mesomorfia > ectomorfia) {
//       clasificacion = 'Mesomorfo';
//     } else {
//       clasificacion = 'Ectomorfo';
//     }

//     somatotipo = {
//       endomorfia: Number(endomorfia.toFixed(1)),
//       mesomorfia: Number(mesomorfia.toFixed(1)),
//       ectomorfia: Number(ectomorfia.toFixed(1)),
//       clasificacion
//     };
//   }

//   // Aquí irían los cálculos del perfil Z usando el método Phantom
//   // (Este es un cálculo complejo que requiere valores de referencia)

//   return {
//     ...cincoComponentesResults,
//     somatotipo,
//     // Añadir perfilZ cuando se implemente
//   };
// }