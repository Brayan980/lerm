// measurementUtils.ts

import type {
  ExpressResults,
  RestringidoResults,
  CincoComponentesResults,
  CompletoResults,
  GenericMeasure
} from "@/lib/types";

/**
 * Extrae el valor result de una medida
 */
export const getMeasureValue = (m: GenericMeasure | undefined | null): number | null => {
  if (!m) return null;
  return m.result ?? null;
};

/**
 * Procesa todas las medidas dentro de un objeto (medidas_basicas, pliegues, etc.)
 */
export const extractGroupValues = (group: Record<string, GenericMeasure>): Record<string, number | null> => {
  const result: Record<string, number | null> = {};
  for (const key of Object.keys(group)) {
    result[key] = getMeasureValue(group[key]);
  }
  return result;
};

/**
 * Procesa cualquier protocolo (Express, Restringido, 5C, Completo)
 */
export const extractAllProtocolMeasures = (
  protocol:
    | ExpressResults
    | RestringidoResults
    | CincoComponentesResults
    | CompletoResults
) => {
  const output: Record<string, any> = {
    etnia: protocol.etnia
  };

  // recorre las secciones del protocolo
  for (const sectionKey of Object.keys(protocol)) {
    if (sectionKey === "etnia") continue;

    // @ts-ignore
    const section = protocol[sectionKey];

    // ejemplo: medidas_basicas, pliegues_cutaneos, perimetros, diametros...
    output[sectionKey] = extractGroupValues(section as Record<string, GenericMeasure>);
  }

  return output;
};
