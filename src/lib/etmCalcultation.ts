// src/lib/etmCalculator.ts

import { EvaluationRecord } from "@/lib/types";

// 🔹 Tipo unión para los pliegues
export type PlieguesCutaneosUnion = {
  triceps?: { m1?: number | null; m2?: number | null; m3?: number | null };
  subescapular?: { m1?: number | null; m2?: number | null; m3?: number | null };
  biceps?: { m1?: number | null; m2?: number | null; m3?: number | null };
  cresta_iliaca?: { m1?: number | null; m2?: number | null; m3?: number | null };
  supraespinal?: { m1?: number | null; m2?: number | null; m3?: number | null };
  abdominal?: { m1?: number | null; m2?: number | null; m3?: number | null };
  muslo?: { m1?: number | null; m2?: number | null; m3?: number | null };
  pierna_pliegue?: { m1?: number | null; m2?: number | null; m3?: number | null };
};

// 🔹 Estructura de resultados del ETM
export interface ETMResult {
  pliegue: string;
  participantesValidos: number;
  etm: number | null;
  etmRelativo: number | null;
  interpretacion: string;
}

// 🔹 Extrae los pliegues cutáneos del resultado (según el tipo de formulario)
export const getPliegues = (record: EvaluationRecord): PlieguesCutaneosUnion | null => {
  const result = record.test_results;
  if (!result) return null;

  return (
    result.express?.pliegues_cutaneos ||
    result.restringido?.pliegues_cutaneos ||
    result.cinco_componentes?.pliegues_cutaneos ||
    result.completo?.pliegues_cutaneos ||
    null
  );
};

// 🔹 Selecciona las dos medidas más cercanas entre sí
export const getClosestTwo = (m1?: number | null, m2?: number | null, m3?: number | null) => {
  if (m1 == null || m2 == null) return { m1: m1 ?? undefined, m2: m2 ?? undefined };
  if (m3 == null) return { m1, m2 };

  const d12 = Math.abs(m1 - m2);
  const d13 = Math.abs(m1 - m3);
  const d23 = Math.abs(m2 - m3);

  if (d12 <= d13 && d12 <= d23) return { m1, m2 };
  if (d13 <= d12 && d13 <= d23) return { m1, m3 };
  return { m2, m3 };
};

// 🔹 Calcula ETM para un pliegue específico
export const calcularETMPorPliegue = (
  pliegueId: string,
  pliegueLabel: string,
  selectedRecords: EvaluationRecord[]
): ETMResult => {
  const participantesConDatos = selectedRecords.filter((record) => {
    const pliegues = getPliegues(record);
    const pliegue = (pliegues as any)?.[pliegueId];
    return pliegue && pliegue.m1 != null && pliegue.m2 != null;
  });

  if (participantesConDatos.length < 2) {
    return {
      pliegue: pliegueLabel,
      participantesValidos: participantesConDatos.length,
      etm: null,
      etmRelativo: null,
      interpretacion: "No hay suficientes datos",
    };
  }

  let sumaD2 = 0;
  let sumaMediciones = 0;
  let totalMediciones = 0;

  participantesConDatos.forEach((record) => {
    const pliegues = getPliegues(record);
    const mediciones = (pliegues as any)?.[pliegueId];
    const { m1, m2 } = getClosestTwo(mediciones.m1, mediciones.m2, mediciones.m3);

    if (m1 != null && m2 != null) {
      const diferencia = m1 - m2;
      sumaD2 += diferencia ** 2;
      sumaMediciones += m1 + m2;
      totalMediciones += 2;
    }
  });

  const n = participantesConDatos.length;
  const etm = Math.sqrt(sumaD2 / (2 * n));
  const media = sumaMediciones / totalMediciones;
  const etmRelativo = (etm / media) * 100;

  let interpretacion = "";
  if (etmRelativo < 5) interpretacion = "Excelente fiabilidad";
  else if (etmRelativo < 10) interpretacion = "Buena fiabilidad";
  else if (etmRelativo < 15) interpretacion = "Fiabilidad moderada";
  else interpretacion = "Fiabilidad baja";

  return { pliegue: pliegueLabel, participantesValidos: participantesConDatos.length, etm, etmRelativo, interpretacion };
};

// 🔹 Calcula ETM para todos los pliegues
export const calcularETM = (selectedRecords: EvaluationRecord[]): ETMResult[] => {
  const plieguesInfo = [
    { id: "triceps", label: "Tríceps" },
    { id: "subescapular", label: "Subescapular" },
    { id: "biceps", label: "Bíceps" },
    { id: "cresta_iliaca", label: "Cresta ilíaca" },
    { id: "supraespinal", label: "Supraespinal" },
    { id: "abdominal", label: "Abdominal" },
    { id: "muslo", label: "Muslo anterior" },
    { id: "pierna_pliegue", label: "Pierna medial" },
  ];

  return plieguesInfo.map((p) => calcularETMPorPliegue(p.id, p.label, selectedRecords));
};
