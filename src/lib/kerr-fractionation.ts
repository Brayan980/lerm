/**
 * Librería para el fraccionamiento antropométrico del cuerpo humano
 * según el Método de D. Kerr (1988) - Estrategia PHANTOM
 * 
 * Calcula las masas de: piel, tejido adiposo, músculo, hueso y tejido residual
 */

/**
 * Interface para almacenar las medidas antropométricas necesarias
 */
export interface MedidasAntropometricas {
  // // Datos básicos
  // peso?: number;                          // kg
  // altura?: number;                        // cm
  // sexo?: 'Masculino' | 'Femenino';                      // 'M' para masculino, 'F' para femenino
  // edad?: number;                          // años
  // alturaSentado?: number;                 // cm

  // // Pliegues cutáneos (mm)
  // pliegueTriceps: number;
  // pliegueSubescapular: number;
  // pliegueSupraespinal: number;
  // pliegueAbdominal: number;
  // pliegueMusloFrontal: number;
  // plieguePantorrilla: number;

  // // Perímetros (cm)
  // perimetroCabeza: number;
  // perimetroBrazoRelajado: number;
  // perimetroAntebrazo: number;
  // perimetroMuslo: number;
  // perimetroPantorrilla: number;
  // perimetroCajaToracica: number;
  // perimetroCintura: number;

  // // Diámetros (cm)
  // diametroBiacromial: number;
  // diametroBiiliocristal: number;
  // diametroHumero: number;
  // diametroFemur: number;
  // diametroApCajaToracica: number;
  // diametroTransversalCajaToracica: number;

  // Datos básicos
  peso?: number;                          // kg
  altura?: number;                        // cm
  sexo?: 'Masculino' | 'Femenino';       
  edad?: number;                          // años
  alturaSentado?: number;                 // cm

  // Pliegues cutáneos (mm)
  pliegueTriceps?: number;
  pliegueSubescapular?: number;
  pliegueSupraespinal?: number;
  pliegueAbdominal?: number;
  pliegueMusloFrontal?: number;
  plieguePantorrilla?: number;

  // Perímetros (cm)
  perimetroCabeza?: number;
  perimetroBrazoRelajado?: number;
  perimetroAntebrazo?: number;
  perimetroMuslo?: number;
  perimetroPantorrilla?: number;
  perimetroCajaToracica?: number;
  perimetroCintura?: number;

  // Diámetros (cm)
  diametroBiacromial?: number;
  diametroBiiliocristal?: number;
  diametroHumero?: number;
  diametroFemur?: number;
  diametroApCajaToracica?: number;
  diametroTransversalCajaToracica?: number;

}

/**
 * Interface para almacenar los resultados del fraccionamiento
 */
export interface ResultadosFraccionamiento {
  // masaPiel: number;
  // masaAdiposa: number;
  // masaMuscular: number;
  // masaOseaCabeza: number;
  // masaOseaCuerpo: number;
  // masaOseaTotal: number;
  // masaResidual: number;
  // masaTotalPredictiva: number;
  // superficieCorporal: number;

  // // Scores Z de proporcionalidad Phantom
  // zOseaCabeza: number;
  // zOseaCuerpo: number;
  // zAdiposa: number;
  // zMuscular: number;
  // zResidual: number;

  masaPiel: number | null;
  masaAdiposa: number | null;
  masaMuscular: number | null;
  masaOseaCabeza: number | null;
  masaOseaCuerpo: number | null;
  masaOseaTotal: number | null;
  masaResidual: number | null;
  masaTotalPredictiva: number | null;
  superficieCorporal: number | null;

  // Scores Z de proporcionalidad Phantom
  zOseaCabeza: number | null;
  zOseaCuerpo: number | null;
  zAdiposa: number | null;
  zMuscular: number | null;
  zResidual: number | null;
}

/**
 * Interface para perímetros corregidos
 */
interface PerimetrosCorregidos {
  // brazo: number;
  // antebrazo: number;
  // muslo: number;
  // pantorrilla: number;
  // cajaToracica: number;

   brazo: number | null;
  antebrazo: number | null;
  muslo: number | null;
  pantorrilla: number | null;
  cajaToracica: number | null;
}


// /**
//  * Clase principal para realizar el fraccionamiento antropométrico
//  * según el método de Kerr (1988)
//  */
// export class FraccionamientoAntropometrico {
//   // Constantes Phantom
//   private static readonly ALTURA_PHANTOM = 170.18;
//   private static readonly ALTURA_SENTADO_PHANTOM = 89.92;

//   constructor(private medidas: MedidasAntropometricas) {}

//   /**
//    * Calcula la superficie corporal en m²
//    * SA = CSA • W^0.425 • H^0.725 / 10000
//    */
//   public calcularSuperficieCorporal(): number {
//     let CSA: number;

//     if (this.medidas.edad >= 12) {
//       CSA = this.medidas.sexo === 'Masculino' ? 68.308 : 73.704;
//     } else {
//       CSA = 70.691;
//     }

//     const SA = (CSA * 
//                 Math.pow(this.medidas.peso, 0.425) * 
//                 Math.pow(this.medidas.altura, 0.725) / 10000);

//     return SA;
//   }

//   /**
//    * Calcula la masa de piel en kg
//    * MS = SA • TSK • 1.05
//    */
//   public calcularMasaPiel(superficie: number): number {
//     const TSK = this.medidas.sexo === 'Masculino' ? 2.07 : 1.96;
//     const masaPiel = superficie * TSK * 1.05;
//     return masaPiel;
//   }

//   /**
//    * Calcula la masa ósea de la cabeza
//    * Retorna: [masa_osea_cabeza, z_score]
//    */
//   public calcularMasaOseaCabeza(): [number, number] {
//     const z = (this.medidas.perimetroCabeza - 56.0) / 1.44;

//     const masa = ((z * 0.18) + 1.20) / 
//                  Math.pow(FraccionamientoAntropometrico.ALTURA_PHANTOM / this.medidas.altura, 3);

//     return [masa, z];
//   }

//   /**
//    * Calcula la masa ósea del cuerpo
//    * Retorna: [masa_osea_cuerpo, z_score]
//    */
//   public calcularMasaOseaCuerpo(): [number, number] {
//     const sumaOsea = this.medidas.diametroBiacromial +
//                      this.medidas.diametroBiiliocristal +
//                      (2 * this.medidas.diametroHumero) +
//                      (2 * this.medidas.diametroFemur);

//     const z = ((sumaOsea * (FraccionamientoAntropometrico.ALTURA_PHANTOM / this.medidas.altura)) - 98.88) / 5.33;

//     const masa = ((z * 1.34) + 6.70) / 
//                  Math.pow(FraccionamientoAntropometrico.ALTURA_PHANTOM / this.medidas.altura, 3);

//     return [masa, z];
//   }

//   /**
//    * Calcula la masa adiposa
//    * Retorna: [masa_adiposa, z_score]
//    */
//   public calcularMasaAdiposa(): [number, number] {
//     const sumaPliegues = this.medidas.pliegueTriceps +
//                         this.medidas.pliegueSubescapular +
//                         this.medidas.pliegueSupraespinal +
//                         this.medidas.pliegueAbdominal +
//                         this.medidas.pliegueMusloFrontal +
//                         this.medidas.plieguePantorrilla;

//     const z = ((sumaPliegues * (FraccionamientoAntropometrico.ALTURA_PHANTOM / this.medidas.altura)) - 116.41) / 34.79;

//     const masa = ((z * 5.85) + 25.6) / 
//                  Math.pow(FraccionamientoAntropometrico.ALTURA_PHANTOM / this.medidas.altura, 3);

//     return [masa, z];
//   }

//   /**
//    * Calcula los perímetros corregidos por los pliegues cutáneos
//    * Fórmula: Perímetro corregido = Perímetro total - (π × Pliegue / 10)
//    */
//   public calcularPerimetrosCorregidos(): PerimetrosCorregidos {
//     // Convertir pliegues de mm a cm y aplicar corrección (π * pliegue / 10)
//     const correccionTriceps = Math.PI * (this.medidas.pliegueTriceps / 10);
//     const correccionMuslo = Math.PI * (this.medidas.pliegueMusloFrontal / 10);
//     const correccionPantorrilla = Math.PI * (this.medidas.plieguePantorrilla / 10);
//     const correccionSubescapular = Math.PI * (this.medidas.pliegueSubescapular / 10);

//     return {
//       brazo: this.medidas.perimetroBrazoRelajado - correccionTriceps,
//       antebrazo: this.medidas.perimetroAntebrazo,
//       muslo: this.medidas.perimetroMuslo - correccionMuslo,
//       pantorrilla: this.medidas.perimetroPantorrilla - correccionPantorrilla,
//       cajaToracica: this.medidas.perimetroCajaToracica - correccionSubescapular
//     };
//   }

//   /**
//    * Calcula la masa muscular
//    * Retorna: [masa_muscular, z_score]
//    */
//   public calcularMasaMuscular(): [number, number] {
//     const perimetros = this.calcularPerimetrosCorregidos();

//     const sumaMuscular = perimetros.brazo +
//                         perimetros.antebrazo +
//                         perimetros.muslo +
//                         perimetros.pantorrilla +
//                         perimetros.cajaToracica;

//     const z = ((sumaMuscular * (FraccionamientoAntropometrico.ALTURA_PHANTOM / this.medidas.altura)) - 207.21) / 13.74;

//     const masa = ((z * 5.4) + 24.5) / 
//                  Math.pow(FraccionamientoAntropometrico.ALTURA_PHANTOM / this.medidas.altura, 3);

//     return [masa, z];
//   }

//   /**
//    * Calcula la masa residual
//    * Retorna: [masa_residual, z_score]
//    */
//   public calcularMasaResidual(): [number, number] {
//     // Perímetro de cintura corregido
//     const correccionAbdominal = Math.PI * (this.medidas.pliegueAbdominal / 10);
//     const perimetroCinturaCorregido = this.medidas.perimetroCintura - correccionAbdominal;

//     const sumaResidual = this.medidas.diametroApCajaToracica +
//                         this.medidas.diametroTransversalCajaToracica +
//                         perimetroCinturaCorregido;

//     const z = ((sumaResidual * (FraccionamientoAntropometrico.ALTURA_SENTADO_PHANTOM / this.medidas.alturaSentado)) - 109.35) / 7.08;

//     const masa = ((z * 1.24) + 6.10) / 
//                  Math.pow(FraccionamientoAntropometrico.ALTURA_SENTADO_PHANTOM / this.medidas.alturaSentado, 3);

//     return [masa, z];
//   }

//   /**
//    * Realiza el fraccionamiento completo del cuerpo
//    * Retorna un objeto ResultadosFraccionamiento con todos los valores
//    */
//   public calcularFraccionamientoCompleto(): ResultadosFraccionamiento {
//     // Calcular superficie corporal
//     const superficie = this.calcularSuperficieCorporal();

//     // Calcular todas las masas
//     const masaPiel = this.calcularMasaPiel(superficie);
//     const [masaOseaCabeza, zOseaCabeza] = this.calcularMasaOseaCabeza();
//     const [masaOseaCuerpo, zOseaCuerpo] = this.calcularMasaOseaCuerpo();
//     const [masaAdiposa, zAdiposa] = this.calcularMasaAdiposa();
//     const [masaMuscular, zMuscular] = this.calcularMasaMuscular();
//     const [masaResidual, zResidual] = this.calcularMasaResidual();

//     const masaOseaTotal = masaOseaCabeza + masaOseaCuerpo;
//     const masaTotalPredictiva = masaPiel + masaAdiposa + masaMuscular + 
//                                 masaOseaTotal + masaResidual;

//     return {
//       masaPiel,
//       masaAdiposa,
//       masaMuscular,
//       masaOseaCabeza,
//       masaOseaCuerpo,
//       masaOseaTotal,
//       masaResidual,
//       masaTotalPredictiva,
//       superficieCorporal: superficie,
//       zOseaCabeza,
//       zOseaCuerpo,
//       zAdiposa,
//       zMuscular,
//       zResidual
//     };
//   }
// }

/**
 * Clase principal para realizar el fraccionamiento antropométrico
 * según el método de Kerr (1988)
 */
export class FraccionamientoAntropometrico {
  // Constantes Phantom
  private static readonly ALTURA_PHANTOM = 170.18;
  private static readonly ALTURA_SENTADO_PHANTOM = 89.92;

  constructor(private medidas: MedidasAntropometricas) {}

  /**
   * Calcula la superficie corporal en m²
   * SA = CSA • W^0.425 • H^0.725 / 10000
   * Retorna null si faltan datos requeridos
   */
  public calcularSuperficieCorporal(): number | null {
    const { peso, altura, edad, sexo } = this.medidas;
    
    if (peso == null || altura == null || edad == null || sexo == null) {
      return null;
    }

    let CSA: number;
    if (edad >= 12) {
      CSA = sexo === 'Masculino' ? 68.308 : 73.704;
    } else {
      CSA = 70.691;
    }

    const SA = (CSA * Math.pow(peso, 0.425) * Math.pow(altura, 0.725) / 10000);
    return SA;
  }

  /**
   * Calcula la masa de piel en kg
   * MS = SA • TSK • 1.05
   * Retorna null si falta superficie o sexo
   */
  public calcularMasaPiel(superficie?: number): number | null {
    const { sexo } = this.medidas;
    
    if (superficie == null || sexo == null) {
      return null;
    }

    const TSK = sexo === 'Masculino' ? 2.07 : 1.96;
    return superficie * TSK * 1.05;
  }

  /**
   * Calcula la masa ósea de la cabeza
   * Retorna: [masa_osea_cabeza | null, z_score | null]
   */
  public calcularMasaOseaCabeza(): [number | null, number | null] {
    const { perimetroCabeza, altura } = this.medidas;
    
    if (perimetroCabeza == null || altura == null) {
      return [null, null];
    }

    const z = (perimetroCabeza - 56.0) / 1.44;
    const masa = ((z * 0.18) + 1.20) / 
                 Math.pow(FraccionamientoAntropometrico.ALTURA_PHANTOM / altura, 3);

    return [masa, z];
  }

  /**
   * Calcula la masa ósea del cuerpo
   * Retorna: [masa_osea_cuerpo | null, z_score | null]
   */
  public calcularMasaOseaCuerpo(): [number | null, number | null] {
    const { diametroBiacromial, diametroBiiliocristal, diametroHumero, diametroFemur, altura } = this.medidas;
    
    if (diametroBiacromial == null || diametroBiiliocristal == null || 
        diametroHumero == null || diametroFemur == null || altura == null) {
      return [null, null];
    }

    const sumaOsea = diametroBiacromial + diametroBiiliocristal + 
                     (2 * diametroHumero) + (2 * diametroFemur);

    const z = ((sumaOsea * (FraccionamientoAntropometrico.ALTURA_PHANTOM / altura)) - 98.88) / 5.33;
    const masa = ((z * 1.34) + 6.70) / 
                 Math.pow(FraccionamientoAntropometrico.ALTURA_PHANTOM / altura, 3);

    return [masa, z];
  }

  /**
   * Calcula la masa adiposa
   * Retorna: [masa_adiposa | null, z_score | null]
   */
  public calcularMasaAdiposa(): [number | null, number | null] {
    const { pliegueTriceps, pliegueSubescapular, pliegueSupraespinal, 
            pliegueAbdominal, pliegueMusloFrontal, plieguePantorrilla, altura } = this.medidas;
    
    if (pliegueTriceps == null || pliegueSubescapular == null || 
        pliegueSupraespinal == null || pliegueAbdominal == null || 
        pliegueMusloFrontal == null || plieguePantorrilla == null || altura == null) {
      return [null, null];
    }

    const sumaPliegues = pliegueTriceps + pliegueSubescapular + pliegueSupraespinal + 
                        pliegueAbdominal + pliegueMusloFrontal + plieguePantorrilla;

    const z = ((sumaPliegues * (FraccionamientoAntropometrico.ALTURA_PHANTOM / altura)) - 116.41) / 34.79;
    const masa = ((z * 5.85) + 25.6) / 
                 Math.pow(FraccionamientoAntropometrico.ALTURA_PHANTOM / altura, 3);

    return [masa, z];
  }

  /**
   * Calcula los perímetros corregidos por los pliegues cutáneos
   * Fórmula: Perímetro corregido = Perímetro total - (π × Pliegue / 10)
   */
  public calcularPerimetrosCorregidos(): PerimetrosCorregidos {
    const { pliegueTriceps, pliegueMusloFrontal, plieguePantorrilla, pliegueSubescapular,
            perimetroBrazoRelajado, perimetroAntebrazo, perimetroMuslo, 
            perimetroPantorrilla, perimetroCajaToracica } = this.medidas;

    const brazo = (pliegueTriceps != null && perimetroBrazoRelajado != null)
      ? perimetroBrazoRelajado - (Math.PI * pliegueTriceps / 10)
      : null;

    const antebrazo = perimetroAntebrazo ?? null;

    const muslo = (pliegueMusloFrontal != null && perimetroMuslo != null)
      ? perimetroMuslo - (Math.PI * pliegueMusloFrontal / 10)
      : null;

    const pantorrilla = (plieguePantorrilla != null && perimetroPantorrilla != null)
      ? perimetroPantorrilla - (Math.PI * plieguePantorrilla / 10)
      : null;

    const cajaToracica = (pliegueSubescapular != null && perimetroCajaToracica != null)
      ? perimetroCajaToracica - (Math.PI * pliegueSubescapular / 10)
      : null;

    return { brazo, antebrazo, muslo, pantorrilla, cajaToracica };
  }

  /**
   * Calcula la masa muscular
   * Retorna: [masa_muscular | null, z_score | null]
   */
  public calcularMasaMuscular(): [number | null, number | null] {
    const { altura } = this.medidas;
    
    if (altura == null) {
      return [null, null];
    }

    const perimetros = this.calcularPerimetrosCorregidos();

    // Verificar que todos los perímetros necesarios estén disponibles
    if (perimetros.brazo == null || perimetros.antebrazo == null || 
        perimetros.muslo == null || perimetros.pantorrilla == null || 
        perimetros.cajaToracica == null) {
      return [null, null];
    }

    const sumaMuscular = perimetros.brazo + perimetros.antebrazo + perimetros.muslo + 
                        perimetros.pantorrilla + perimetros.cajaToracica;

    const z = ((sumaMuscular * (FraccionamientoAntropometrico.ALTURA_PHANTOM / altura)) - 207.21) / 13.74;
    const masa = ((z * 5.4) + 24.5) / 
                 Math.pow(FraccionamientoAntropometrico.ALTURA_PHANTOM / altura, 3);

    return [masa, z];
  }

  /**
   * Calcula la masa residual
   * Retorna: [masa_residual | null, z_score | null]
   */
  public calcularMasaResidual(): [number | null, number | null] {
    const { pliegueAbdominal, perimetroCintura, diametroApCajaToracica, 
            diametroTransversalCajaToracica, alturaSentado } = this.medidas;
    
    if (pliegueAbdominal == null || perimetroCintura == null || 
        diametroApCajaToracica == null || diametroTransversalCajaToracica == null || 
        alturaSentado == null) {
      return [null, null];
    }

    const correccionAbdominal = Math.PI * (pliegueAbdominal / 10);
    const perimetroCinturaCorregido = perimetroCintura - correccionAbdominal;

    const sumaResidual = diametroApCajaToracica + diametroTransversalCajaToracica + 
                        perimetroCinturaCorregido;

    const z = ((sumaResidual * (FraccionamientoAntropometrico.ALTURA_SENTADO_PHANTOM / alturaSentado)) - 109.35) / 7.08;
    const masa = ((z * 1.24) + 6.10) / 
                 Math.pow(FraccionamientoAntropometrico.ALTURA_SENTADO_PHANTOM / alturaSentado, 3);

    return [masa, z];
  }

  /**
   * Realiza el fraccionamiento completo del cuerpo
   * Retorna un objeto ResultadosFraccionamiento con todos los valores (null si faltan datos)
   */
  public calcularFraccionamientoCompleto(): ResultadosFraccionamiento {
    // Calcular superficie corporal
    const superficie = this.calcularSuperficieCorporal();

    // Calcular todas las masas
    const masaPiel = this.calcularMasaPiel(superficie ?? undefined);
    const [masaOseaCabeza, zOseaCabeza] = this.calcularMasaOseaCabeza();
    const [masaOseaCuerpo, zOseaCuerpo] = this.calcularMasaOseaCuerpo();
    const [masaAdiposa, zAdiposa] = this.calcularMasaAdiposa();
    const [masaMuscular, zMuscular] = this.calcularMasaMuscular();
    const [masaResidual, zResidual] = this.calcularMasaResidual();

    // Calcular masa ósea total (null si alguna es null)
    const masaOseaTotal = (masaOseaCabeza != null && masaOseaCuerpo != null)
      ? masaOseaCabeza + masaOseaCuerpo
      : null;

    // Calcular masa total predictiva (null si falta algún componente)
    let masaTotalPredictiva: number | null = null;
    if (masaPiel != null && masaAdiposa != null && masaMuscular != null && 
        masaOseaTotal != null && masaResidual != null) {
      masaTotalPredictiva = masaPiel + masaAdiposa + masaMuscular + 
                           masaOseaTotal + masaResidual;
    }

    return {
      masaPiel,
      masaAdiposa,
      masaMuscular,
      masaOseaCabeza,
      masaOseaCuerpo,
      masaOseaTotal,
      masaResidual,
      masaTotalPredictiva,
      superficieCorporal: superficie,
      zOseaCabeza,
      zOseaCuerpo,
      zAdiposa,
      zMuscular,
      zResidual
    };
  }

  /**
   * Verifica si hay suficientes datos para realizar el fraccionamiento completo
   */
  public tieneDatosSuficientes(): boolean {
    const resultado = this.calcularFraccionamientoCompleto();
    return resultado.masaTotalPredictiva != null;
  }

  /**
   * Obtiene un listado de los datos faltantes necesarios para el cálculo completo
   */
  public obtenerDatosFaltantes(): string[] {
    const faltantes: string[] = [];
    const m = this.medidas;

    // Datos básicos
    if (m.peso == null) faltantes.push('peso');
    if (m.altura == null) faltantes.push('altura');
    if (m.sexo == null) faltantes.push('sexo');
    if (m.edad == null) faltantes.push('edad');
    if (m.alturaSentado == null) faltantes.push('alturaSentado');

    // Pliegues cutáneos
    if (m.pliegueTriceps == null) faltantes.push('pliegueTriceps');
    if (m.pliegueSubescapular == null) faltantes.push('pliegueSubescapular');
    if (m.pliegueSupraespinal == null) faltantes.push('pliegueSupraespinal');
    if (m.pliegueAbdominal == null) faltantes.push('pliegueAbdominal');
    if (m.pliegueMusloFrontal == null) faltantes.push('pliegueMusloFrontal');
    if (m.plieguePantorrilla == null) faltantes.push('plieguePantorrilla');

    // Perímetros
    if (m.perimetroCabeza == null) faltantes.push('perimetroCabeza');
    if (m.perimetroBrazoRelajado == null) faltantes.push('perimetroBrazoRelajado');
    if (m.perimetroAntebrazo == null) faltantes.push('perimetroAntebrazo');
    if (m.perimetroMuslo == null) faltantes.push('perimetroMuslo');
    if (m.perimetroPantorrilla == null) faltantes.push('perimetroPantorrilla');
    if (m.perimetroCajaToracica == null) faltantes.push('perimetroCajaToracica');
    if (m.perimetroCintura == null) faltantes.push('perimetroCintura');

    // Diámetros
    if (m.diametroBiacromial == null) faltantes.push('diametroBiacromial');
    if (m.diametroBiiliocristal == null) faltantes.push('diametroBiiliocristal');
    if (m.diametroHumero == null) faltantes.push('diametroHumero');
    if (m.diametroFemur == null) faltantes.push('diametroFemur');
    if (m.diametroApCajaToracica == null) faltantes.push('diametroApCajaToracica');
    if (m.diametroTransversalCajaToracica == null) faltantes.push('diametroTransversalCajaToracica');

    return faltantes;
  }
}