
/**
 * @fileOverview Placeholder Phantom metric values (Mean P and Standard Deviation SD)
 * for Z-score calculations based on the Phantom stratagem by Ross & Wilson.
 *
 * IMPORTANT: These are illustrative placeholder values. In a real application,
 * these must be sourced from established anthropometric literature specific
 * to the Phantom model being used (e.g., Ross & Wilson, 1974).
 * The units must match the units of the measurements being collected.
 */

export interface PhantomMetric {
  P: number; // Phantom Mean
  SD: number; // Phantom Standard Deviation
  unit: string; // Unit of the measurement
}

// Keys should match the `id` in MACROINDICES_DEFINITIONS and keys in MacroindicesResults
export const PHANTOM_METRICS: Record<string, PhantomMetric> = {
  masaCorporal: { P: 70.0, SD: 12.0, unit: "kg" },
  talla: { P: 170.18, SD: 7.0, unit: "cm" },
  tallaSentada: { P: 90.0, SD: 5.0, unit: "cm" },
  envergaduraBrazos: { P: 172.0, SD: 8.0, unit: "cm" }, // Placeholder
  pliegueTriceps: { P: 12.0, SD: 4.0, unit: "mm" },
  pliegueSubescapular: { P: 15.0, SD: 5.0, unit: "mm" },
  pliegueBiceps: { P: 7.0, SD: 3.0, unit: "mm" },
  pliegueCrestaIliaca: { P: 14.0, SD: 6.0, unit: "mm" }, // Placeholder
  pliegueSupraespinal: { P: 10.0, SD: 4.0, unit: "mm" },
  pliegueAbdominal: { P: 20.0, SD: 8.0, unit: "mm" },
  pliegueMusloAnterior: { P: 22.0, SD: 7.0, unit: "mm" }, // Placeholder for pliegueMusloAnterior
  plieguePiernaMedial: { P: 18.0, SD: 6.0, unit: "mm" }, // Placeholder for plieguePiernaMedial
  perimetroCabeza: { P: 56.0, SD: 2.0, unit: "cm" }, // Placeholder
  perimetroCuello: { P: 35.0, SD: 3.0, unit: "cm" }, // Placeholder
  perimetroTorax: { P: 95.0, SD: 8.0, unit: "cm" },
  perimetroCintura: { P: 80.0, SD: 10.0, unit: "cm" },
  perimetroCadera: { P: 98.0, SD: 9.0, unit: "cm" },
  perimetroBrazoRelajado: { P: 30.0, SD: 4.0, unit: "cm" },
  perimetroBrazoFlexionadoContraido: { P: 33.0, SD: 4.5, unit: "cm" }, //perimetroBrazoFlexionadoContrido
  perimetroAntebrazo: { P: 26.0, SD: 3.0, unit: "cm" }, // Placeholder
  perimetroMuneca: { P: 17.0, SD: 1.5, unit: "cm" }, // Placeholder
  perimetroMusloSuperior: { P: 58.0, SD: 6.0, unit: "cm" }, // Placeholder (1cm Gluteo)
  perimetroMusloMedio: { P: 55.0, SD: 6.0, unit: "cm" },
  perimetroPierna: { P: 37.0, SD: 4.0, unit: "cm" }, // (Pantorrilla)
  diametroBiacromial: { P: 38.0, SD: 2.5, unit: "cm" },
  diametroBiiliocristal: { P: 28.0, SD: 2.0, unit: "cm" },
  diametroAPAbdomen: { P: 20.0, SD: 3.0, unit: "cm" }, // Placeholder
  diametroHumero: { P: 7.0, SD: 0.5, unit: "cm" },
  diametroFemur: { P: 9.5, SD: 0.7, unit: "cm" },
  longitudAcromialeRadiale: { P: 32.0, SD: 2.0, unit: "cm" },
  longitudRadialeStylion: { P: 25.0, SD: 1.8, unit: "cm" },
  longitudStylionMedioDactylion: { P: 19.0, SD: 1.5, unit: "cm" },
  alturaIliospinale: { P: 95.0, SD: 5.0, unit: "cm" },
  alturaTrochanterion: { P: 92.0, SD: 4.5, unit: "cm" },
  longitudTrochanterionTibialeLaterale: { P: 48.0, SD: 3.0, unit: "cm" },
};

    