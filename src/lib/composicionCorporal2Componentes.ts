/**
 * Librería simplificada para el cálculo de:
 * - Masa Muscular: Fórmula de Lee et al. (2000)
 * - Masa Adiposa: Fórmula de Kerr (ISAK)
 */

export interface Medidas2Componentes {
  // Datos básicos
  altura: number; // cm
  sexo: "Masculino" | "Femenino";
  edad: number; // años
  etnia?: "asiatico" | "afroamericano" | "caucasico_hispano";

  // Para masa muscular (Lee)
  pliegueTriceps: number;       // mm
  pliegueMusloFrontal: number;  // mm
  plieguePantorrilla: number;   // mm
  perimetroBrazoRelajado: number; // cm
  perimetroMusloMedio: number;    // cm
  perimetroPierna: number;        // cm

  // Para masa adiposa (Kerr)
  pliegueSubescapular: number;   // mm
  pliegueSupraespinal: number;   // mm
  pliegueAbdominal: number;      // mm
}

export interface Resultados2Componentes {
  masaMuscular: number | null;
  masaAdiposa: number | null;
  zAdiposa: number | null;
}

/**
 * Clase principal para el cálculo de masa muscular y adiposa
 */
export class Modelo2Componentes {
  private static readonly ALTURA_PHANTOM = 170.18;

  constructor(private medidas: Medidas2Componentes) { }

  /**
   * Masa Muscular según Lee et al. (2000)
   */
  public calcularMasaMuscularLee(): number | null {
    const {
      altura,
      pliegueTriceps,
      pliegueMusloFrontal,
      plieguePantorrilla,
      perimetroBrazoRelajado,
      perimetroMusloMedio,
      perimetroPierna,
      sexo,
      edad,
      etnia,
    } = this.medidas;

    // CAG = perímetro brazo relajado - π *  tríceps pliegue
    const CAG = perimetroBrazoRelajado - (3.1416 * (pliegueTriceps / 10));

    // CTG = pliegue muslo - π * perímetro muslo medio
    const CTG = perimetroMusloMedio - (3.1416 * (pliegueMusloFrontal / 10));

    // CCG = pliegue pierna - π * perímetro brazo relajado
    const CCG = perimetroPierna - (3.1416 * (plieguePantorrilla / 10));

    // Valores de sexo y etnia
    const sexoValor = sexo === 'Masculino' ? 1 : 0;
    let etniaValor = 0;
    if (etnia === 'asiatico') etniaValor = -2.0;
    else if (etnia === 'afroamericano') etniaValor = 1.1;
    else etniaValor = 0; // caucásico e hispano

    // Fórmula de Lee et al (2000)
    // Altura*(0.00744*CAG² + 0.00088*CTG² + 0.00441*CCG²) + 2.4*sexo - 0.048*edad + etnia + 7.8
    const masaMuscular = (altura / 100) * (0.00744 * (Math.pow(CAG, 2)) + 0.00088 * (Math.pow(CTG, 2)) + 0.00441 * (Math.pow(CCG, 2))) + 2.4 * sexoValor - 0.048 * edad + etniaValor + 7.8
    return masaMuscular;

  }

  /**
   * Masa Adiposa según Kerr (ISAK)
   * Retorna masa adiposa (kg) y z-score
   */
  public calcularMasaAdiposaKerr(): [number | null, number | null] {
    const {
      pliegueTriceps,
      pliegueSubescapular,
      pliegueSupraespinal,
      pliegueAbdominal,
      pliegueMusloFrontal,
      plieguePantorrilla,
      altura,
    } = this.medidas;

    const sumaPliegues =
      pliegueTriceps +
      pliegueSubescapular +
      pliegueSupraespinal +
      pliegueAbdominal +
      pliegueMusloFrontal +
      plieguePantorrilla;

    const z =
      ((sumaPliegues *
        (Modelo2Componentes.ALTURA_PHANTOM / altura)) -
        116.41) /
      34.79;

    const masa =
      ((z * 5.85 + 25.6) /
        Math.pow(Modelo2Componentes.ALTURA_PHANTOM / altura, 3));

    return [parseFloat(masa.toFixed(2)), parseFloat(z.toFixed(2))];
  }

  /**
   * Calcula ambas: masa muscular (Lee) y adiposa (Kerr)
   */
  public calcularComposicionMuscularAdiposa(): Resultados2Componentes {
    const masaMuscular = this.calcularMasaMuscularLee();
    const [masaAdiposa, zAdiposa] = this.calcularMasaAdiposaKerr();

    return { masaMuscular, masaAdiposa, zAdiposa };
  }
}
