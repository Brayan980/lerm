/**
 * Librería para el fraccionamiento de composición corporal
 * Modelo de 4 Componentes:
 * - Masa Muscular: Fórmula de Lee et al (2000) por Resonancia Magnética
 * - Masa Ósea: Fórmula de Rocha (1975)
 * - Masa Adiposa: Fórmula de Kerr (ISAK)
 * - Masa Residual: Fórmula de ISAK
 */

/**
 * Interface para las medidas antropométricas del modelo de 4 componentes
 */
export interface Medidas4Componentes {
    // Datos básicos
    peso: number;                    // kg
    altura: number;                  // cm
    sexo: 'Masculino' | 'Femenino';
    edad: number;                    // años
    etnia: 'asiatico' | 'afroamericano' | 'caucasico_hispano'; // Para Lee

    // Pliegues cutáneos (mm) - Para Kerr y Lee
    pliegueTriceps: number;
    pliegueSubescapular: number;
    pliegueSupraespinal: number;
    pliegueAbdominal: number;
    pliegueMusloFrontal: number;
    plieguePantorrilla: number;

    // Perímetros (cm) - Para Lee
    perimetroBrazoRelajado: number;
    perimetroMusloMedio: number;
    perimetroPierna: number;          // CCG en la fórmula de Lee

    // Diámetros (cm) - Para Rocha
    diametroFemur: number;  // R en Rocha
    diametroMuñeca: number;  // F en Rocha (muñeca) ~ biestiloideo
    diametroHumero: number;
}

/**
 * Interface para los resultados del modelo de 4 componentes
 */
export interface Resultados4Componentes {
    masaMuscular: number | null;
    masaOsea: number | null;
    masaAdiposa: number | null;
    masaResidual: number | null;
    masaTotal: number | null;

    // Porcentajes
    porcentajeMuscular: number | null;
    porcentajeOsea: number | null;
    porcentajeAdiposa: number | null;
    porcentajeResidual: number | null;

    // Score Z solo para masa adiposa (Kerr)
    zAdiposa: number | null;
}

/**
 * Clase principal para el modelo de 4 componentes
 */
export class Modelo4Componentes {
    // Constantes Phantom para Kerr
    private static readonly ALTURA_PHANTOM = 170.18;

    // Constantes para Masa Residual ISAK
    private static readonly P_RESIDUAL_HOMBRES = 0.2413;  // 24.13%
    private static readonly P_RESIDUAL_MUJERES = 0.2096;  // 20.96%

    constructor(private medidas: Medidas4Componentes) { }

    /**
     * Calcula la Masa Muscular según Lee et al (2000)
     * Fórmula por Resonancia Magnética
     */
    public calcularMasaMuscularLee(): number | null {
        const { altura, pliegueTriceps, pliegueMusloFrontal, plieguePantorrilla, perimetroBrazoRelajado, perimetroMusloMedio,
            perimetroPierna, sexo, edad, etnia } = this.medidas;

        // Verificar datos requeridos
        if (altura == null || pliegueTriceps == null || pliegueMusloFrontal == null || plieguePantorrilla == null || perimetroBrazoRelajado == null ||
            perimetroMusloMedio == null || perimetroPierna == null ||
            sexo == null || edad == null) {
            return null;
        }

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

    public calcularMasaOseaRocha() {

        const { altura, diametroFemur, diametroMuñeca } = this.medidas;
        
        // Convertir a metros si están en cm
        const tallaMetros = altura / 100;
        const dmMetros = diametroMuñeca / 100;
        const dfMetros = diametroFemur / 100;

        // Calcular según la fórmula de Rocha: 3.02 * [Talla² * DM * DF * 400]^0.712
        const tallaCuadrado = Math.pow(tallaMetros, 2);
        const terminoBase = tallaCuadrado * dmMetros * dfMetros * 400;
        const masaOsea = 3.02 * Math.pow(terminoBase, 0.712);

        return masaOsea;
    }

    public calcularMasaOseaMartin() {
    
        const diametroTobillo = 1;
        const { altura, diametroFemur, diametroMuñeca,  } = this.medidas;

        const sumaDiametros =  + diametroMuñeca + diametroFemur + diametroTobillo;
        const terminoBase = altura * sumaDiametros;
        const masaOsea = 0.0000002 * Math.pow(terminoBase, 2); // Ajuste constante
        return masaOsea;
    }

    /**
     * Calcula la Masa Adiposa según Kerr (ISAK)
     * Retorna: [masa_adiposa, z_score]
     */
    public calcularMasaAdiposaKerr(): [number | null, number | null] {
        const { pliegueTriceps, pliegueSubescapular, pliegueSupraespinal,
            pliegueAbdominal, pliegueMusloFrontal, plieguePantorrilla, altura } = this.medidas;

        if (pliegueTriceps == null || pliegueSubescapular == null ||
            pliegueSupraespinal == null || pliegueAbdominal == null ||
            pliegueMusloFrontal == null || plieguePantorrilla == null || altura == null) {
            return [null, null];
        }

        const sumaPliegues = pliegueTriceps + pliegueSubescapular + pliegueSupraespinal +
            pliegueAbdominal + pliegueMusloFrontal + plieguePantorrilla;

        const z = ((sumaPliegues * (Modelo4Componentes.ALTURA_PHANTOM / altura)) - 116.41) / 34.79;

        const masa = ((z * 5.85) + 25.6) /
            Math.pow(Modelo4Componentes.ALTURA_PHANTOM / altura, 3);

        return [masa, z];
    }

    /**
     * Calcula la Masa Residual según ISAK
     * MR = Peso corporal (kg) × P_residual
     */
    public calcularMasaResidualISAK(): number | null {
        const { peso, sexo } = this.medidas;

        if (peso == null || sexo == null) {
            return null;
        }

        const pResidual = sexo === 'Masculino'
            ? Modelo4Componentes.P_RESIDUAL_HOMBRES
            : Modelo4Componentes.P_RESIDUAL_MUJERES;

        const masaResidual = peso * pResidual;

        return masaResidual;
    }

    /**
     * Calcula el fraccionamiento completo de 4 componentes
     */
    public calcularFraccionamientoCompleto(): Resultados4Componentes {
        const { peso } = this.medidas;

        // Calcular cada componente
        const masaMuscular = this.calcularMasaMuscularLee();
        const masaOsea = this.calcularMasaOseaRocha();
        const [masaAdiposa, zAdiposa] = this.calcularMasaAdiposaKerr();
        const masaResidual = this.calcularMasaResidualISAK();

        // Calcular masa total (suma de componentes o peso real)
        let masaTotal: number | null = null;
        if (masaMuscular != null && masaOsea != null && masaAdiposa != null && masaResidual != null) {
            masaTotal = masaMuscular + masaOsea + masaAdiposa + masaResidual;
        } else if (peso != null) {
            masaTotal = peso;
        }

        // Calcular porcentajes
        const calcularPorcentaje = (masa: number | null): number | null => {
            if (masa == null || masaTotal == null || masaTotal === 0) return null;
            return parseFloat(((masa / masaTotal) * 100).toFixed(2));
        };

        return {
            masaMuscular,
            masaOsea,
            masaAdiposa,
            masaResidual,
            masaTotal,
            porcentajeMuscular: calcularPorcentaje(masaMuscular),
            porcentajeOsea: calcularPorcentaje(masaOsea),
            porcentajeAdiposa: calcularPorcentaje(masaAdiposa),
            porcentajeResidual: calcularPorcentaje(masaResidual),
            zAdiposa
        };
    }


}
