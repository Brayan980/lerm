// import type { RestringidoResults } from './types';
// import { calculateExpressResults } from './expressCalculations';

// interface CalculatedRestringidoResults {
//   imc?: { value: number | null; classification?: string };
//   icc?: number | null;  // Índice cintura-cadera
//   ice?: number | null;  // Índice cintura-estatura
//   porcentajeGrasa?: { value: number | null; classification?: string };
//   densidadCorporal?: number | null;
//   masaGrasa?: { value: number | null; classification?: string };
//   masaMuscular?: { value: number | null; classification?: string };
//   indiceCormico?: { value: number | null; classification?: string };
//   indiceAcromioIliaco?: { value: number | null; classification?: string };
//   longitudRelativaMiembroSuperior?: { value: number | null; classification?: string };
// }

// export function calculateRestringidoResults(data: RestringidoResults, sex: 'Masculino' | 'Femenino', age: number): CalculatedRestringidoResults {
//   if (!data.medidas_basicas?.masa_corporal?.result || !data.medidas_basicas?.talla?.result) {
//     return {};
//   }

//   // Primero calculamos todo lo que ya tenemos en express
//   const expressData = {
//     medidas_basicas: data.medidas_basicas,
//     pliegues_cutaneos: data.pliegues_cutaneos,
//     perimetros: data.perimetros
//   };
  
//   const expressResults = calculateExpressResults(expressData, sex, age);

//   // Cálculos adicionales específicos de restringido
//   const talla = data.medidas_basicas.talla.result;
//   const tallaSentado = data.medidas_basicas.talla_sentado?.result;
  
//   // Índice Córmico (IC)
//   let indiceCormico = null;
//   let indiceCormicoClas = '';
//   if (tallaSentado) {
//     indiceCormico = (tallaSentado / talla) * 100;
//     if (indiceCormico < 51) indiceCormicoClas = 'Braquicórmicos (tronco corto)';
//     else if (indiceCormico < 53) indiceCormicoClas = 'Metricórmicos (tronco normal)';
//     else indiceCormicoClas = 'Macrocórmicos (tronco largo)';
//   }

//   // Otros índices específicos de restringido...
//   // (Aquí irían los cálculos adicionales)

//   return {
//     ...expressResults,
//     indiceCormico: indiceCormico ? { value: indiceCormico, classification: indiceCormicoClas } : undefined,
//     // Añadir el resto de resultados específicos de restringido
//   };
// }