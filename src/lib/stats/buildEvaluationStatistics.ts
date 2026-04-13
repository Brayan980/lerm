import { getStatistics } from "./statisticsUtils";

// Lista de rutas de secciones a inspeccionar en cada protocolo
const SECTIONS = [
  "medidas_basicas",
  "pliegues_cutaneos",
  "perimetros",
  "diametros",
  "longitudes_alturas"
];

/**
 * Devuelve todas las medidas de una evaluación según el protocolo activo
 */
const getProtocolData = (evaluation: any): any | null => {
  if (!evaluation?.test_results) return null;

  const tr = evaluation.test_results;

  return (
    tr.express ??
    tr.restringido ??
    tr.cinco_componentes ??
    tr.completo ??
    null
  );
};

/**
 * Recorre una sección (por ejemplo "diametros") y devuelve pares:
 *   { key: "diametros_femur", value: 9.5 }
 */
const extractSectionValues = (
  sectionName: string,
  sectionData: any
): Record<string, number | null> => {
  if (!sectionData) return {};

  const result: Record<string, number | null> = {};

  Object.entries(sectionData).forEach(([measureName, measure]: any) => {
    const finalKey = `${sectionName}_${measureName}`;
    result[finalKey] = measure?.result ?? null;
  });

  return result;
};

/**
 * Construye estadísticas de TODAS las evaluaciones.
 */
export const buildEvaluationStatistics = (evaluations: any[]) => {
  const measureBuckets: Record<string, number[]> = {};

  for (const evalItem of evaluations) {
    const protocol = getProtocolData(evalItem);
    if (!protocol) continue;

    for (const section of SECTIONS) {
      const sectionData = protocol[section];
      if (!sectionData) continue;

      const extracted = extractSectionValues(section, sectionData);

      for (const [key, value] of Object.entries(extracted)) {
        if (value === null || typeof value !== "number" || isNaN(value)) {
          continue;
        }

        if (!measureBuckets[key]) measureBuckets[key] = [];
        measureBuckets[key].push(value);
      }
    }
  }

  // Calcular estadísticas por cada medida
  const stats: Record<string, any> = {};

  Object.entries(measureBuckets).forEach(([measureName, values]) => {
    stats[measureName] = getStatistics(values);
  });

  return stats;
};
