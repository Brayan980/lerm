import { FraccionamientoAntropometrico, MedidasAntropometricas } from '../lib/kerr-fractionation';

describe('FraccionamientoAntropometrico - Método de Kerr (1988)', () => {

  const medidasEjemplo: MedidasAntropometricas = {
    peso: 82.5,
    altura: 170.0,
    sexo: 'Masculino',
    edad: 15,
    alturaSentado: 88.0,

    pliegueTriceps: 12.0,
    pliegueSubescapular: 14.5,
    pliegueSupraespinal: 12.9,
    pliegueAbdominal: 20.0,
    pliegueMusloFrontal: 16.0,
    plieguePantorrilla: 10.0,

    perimetroCabeza: 56.0,
    perimetroBrazoRelajado: 33.0,
    perimetroAntebrazo: 27.0,
    perimetroMuslo: 55.0,
    perimetroPantorrilla: 38.0,
    perimetroCajaToracica: 98.0,
    perimetroCintura: 90.0,

    diametroBiacromial: 40.0,
    diametroBiiliocristal: 28.0,
    diametroHumero: 6.5,
    diametroFemur: 9.5,
    diametroApCajaToracica: 20.0,
    diametroTransversalCajaToracica: 30.0
  };

  const fracc = new FraccionamientoAntropometrico(medidasEjemplo);

  test('✔️ calcularSuperficieCorporal debe retornar valor esperado', () => {
    const superficie = fracc.calcularSuperficieCorporal();
    expect(superficie).toBeCloseTo(1.84, 1);
  });

  test('✔️ calcularMasaPiel debe retornar aproximadamente 4.011 kg', () => {
    const superficie = fracc.calcularSuperficieCorporal();
    const masaPiel = fracc.calcularMasaPiel(superficie);
    expect(masaPiel).toBeCloseTo(4.011, 3);
  });

  test('✔️ calcularMasaAdiposa debe retornar aproximadamente 20.336 kg y Z = -0.889', () => {
    const [masa, z] = fracc.calcularMasaAdiposa();
    expect(masa).toBeCloseTo(20.336, 3);
    expect(z).toBeCloseTo(-0.889, 3);
  });

  test('✔️ calcularMasaMuscular debe retornar aproximadamente 35.214 kg y Z = 2.005', () => {
    const [masa, z] = fracc.calcularMasaMuscular();
    expect(masa).toBeCloseTo(35.214, 3);
    expect(z).toBeCloseTo(2.005, 3);
  });

  test('✔️ calcularMasaOseaCabeza debe retornar 1.196 kg y Z = 0', () => {
    const [masa, z] = fracc.calcularMasaOseaCabeza();
    expect(masa).toBeCloseTo(1.196, 3);
    expect(z).toBeCloseTo(0.0, 3);
  });

  test('✔️ calcularMasaOseaCuerpo debe retornar 6.986 kg y Z = 0.230', () => {
    const [masa, z] = fracc.calcularMasaOseaCuerpo();
    expect(masa).toBeCloseTo(6.986, 3);
    expect(z).toBeCloseTo(0.230, 3);
  });

  test('✔️ calcularMasaResidual debe retornar 10.197 kg y Z = 3.854', () => {
    const [masa, z] = fracc.calcularMasaResidual();
    expect(masa).toBeCloseTo(10.197, 3);
    expect(z).toBeCloseTo(3.854, 3);
  });

  test('✔️ calcularFraccionamientoCompleto debe retornar todos los resultados coherentes', () => {
    const resultados = fracc.calcularFraccionamientoCompleto();

    expect(resultados.masaPiel).toBeCloseTo(4.011, 3);
    expect(resultados.masaAdiposa).toBeCloseTo(20.336, 3);
    expect(resultados.masaMuscular).toBeCloseTo(35.214, 3);
    expect(resultados.masaOseaCabeza).toBeCloseTo(1.196, 3);
    expect(resultados.masaOseaCuerpo).toBeCloseTo(6.986, 3);
    expect(resultados.masaOseaTotal).toBeCloseTo(8.182, 3);
    expect(resultados.masaResidual).toBeCloseTo(10.197, 3);
    expect(resultados.masaTotalPredictiva).toBeCloseTo(77.939, 3);
  });
});

  // ==========================================================
  // 🧪 CASO 2: Mujer - 30 años - Datos completos (Kerr 1988)
  // ==========================================================
  describe('FraccionamientoAntropometrico - Mujer (30 años, 68kg, 162cm)', () => {

    const medidasMujer: MedidasAntropometricas = {
      peso: 68.0,
      altura: 162.0,
      sexo: 'Femenino',
      edad: 30,
      alturaSentado: 86.0,

      pliegueTriceps: 18.5,
      pliegueSubescapular: 22.0,
      pliegueSupraespinal: 20.5,
      pliegueAbdominal: 25.0,
      pliegueMusloFrontal: 28.0,
      plieguePantorrilla: 15.0,

      perimetroCabeza: 55.5,
      perimetroBrazoRelajado: 28.0,
      perimetroAntebrazo: 24.5,
      perimetroMuslo: 52.0,
      perimetroPantorrilla: 35.0,
      perimetroCajaToracica: 88.0,
      perimetroCintura: 78.0,

      diametroBiacromial: 36.0,
      diametroBiiliocristal: 28.5,
      diametroHumero: 5.8,
      diametroFemur: 8.8,
      diametroApCajaToracica: 18.5,
      diametroTransversalCajaToracica: 27.0
    };

    const fraccMujer = new FraccionamientoAntropometrico(medidasMujer);

    test('✔️ calcularSuperficieCorporal debe retornar aproximadamente 1.7709 m²', () => {
      const superficie = fraccMujer.calcularSuperficieCorporal();
      expect(superficie).toBeCloseTo(1.7709, 3);
    });

    test('✔️ calcularMasaPiel debe retornar aproximadamente 3.645 kg', () => {
      const superficie = fraccMujer.calcularSuperficieCorporal();
      const masaPiel = fraccMujer.calcularMasaPiel(superficie);
      expect(masaPiel).toBeCloseTo(3.645, 3);
    });

    test('✔️ calcularMasaAdiposa debe retornar aproximadamente 24.854 kg y Z = 0.549', () => {
      const [masa, z] = fraccMujer.calcularMasaAdiposa();
      expect(masa).toBeCloseTo(24.854, 3);
      expect(z).toBeCloseTo(0.549, 3);
    });

    test('✔️ calcularMasaMuscular debe retornar aproximadamente 22.565 kg y Z = 0.307', () => {
      const [masa, z] = fraccMujer.calcularMasaMuscular();
      expect(masa).toBeCloseTo(22.565, 3);
      expect(z).toBeCloseTo(0.307, 3);
    });

    test('✔️ calcularMasaOseaCabeza debe retornar aproximadamente 0.981 kg y Z = -0.347', () => {
      const [masa, z] = fraccMujer.calcularMasaOseaCabeza();
      expect(masa).toBeCloseTo(0.981, 3);
      expect(z).toBeCloseTo(-0.347, 3);
    });

    test('✔️ calcularMasaOseaCuerpo debe retornar aproximadamente 5.682 kg y Z = -0.084', () => {
      const [masa, z] = fraccMujer.calcularMasaOseaCuerpo();
      expect(masa).toBeCloseTo(5.682, 3);
      expect(z).toBeCloseTo(-0.084, 3);
    });

    test('✔️ calcularMasaResidual debe retornar aproximadamente 7.109 kg y Z = 1.634', () => {
      const [masa, z] = fraccMujer.calcularMasaResidual();
      expect(masa).toBeCloseTo(7.109, 3);
      expect(z).toBeCloseTo(1.634, 3);
    });

    test('✔️ calcularFraccionamientoCompleto debe retornar todos los resultados coherentes', () => {
      const resultados = fraccMujer.calcularFraccionamientoCompleto();

      expect(resultados.masaPiel).toBeCloseTo(3.645, 3);
      expect(resultados.masaAdiposa).toBeCloseTo(24.854, 3);
      expect(resultados.masaMuscular).toBeCloseTo(22.565, 3);
      expect(resultados.masaOseaCabeza).toBeCloseTo(0.981, 3);
      expect(resultados.masaOseaCuerpo).toBeCloseTo(5.682, 3);
      expect(resultados.masaOseaTotal).toBeCloseTo(6.663, 3);
      expect(resultados.masaResidual).toBeCloseTo(7.109, 3);
      expect(resultados.masaTotalPredictiva).toBeCloseTo(64.836, 3);
    });
  });

    // ==========================================================
  // 🧪 CASO 3: Hombre - 22 años - Datos completos (Kerr 1988)
  // ==========================================================
  describe('FraccionamientoAntropometrico - Hombre (22 años, 78.5kg, 182cm)', () => {

    const medidasHombre: MedidasAntropometricas = {
      peso: 78.5,
      altura: 182.0,
      sexo: 'Masculino',
      edad: 22,
      alturaSentado: 96.0,

      pliegueTriceps: 8.0,
      pliegueSubescapular: 9.5,
      pliegueSupraespinal: 10.0,
      pliegueAbdominal: 12.0,
      pliegueMusloFrontal: 14.0,
      plieguePantorrilla: 7.5,

      perimetroCabeza: 58.5,
      perimetroBrazoRelajado: 34.0,
      perimetroAntebrazo: 29.5,
      perimetroMuslo: 60.0,
      perimetroPantorrilla: 40.0,
      perimetroCajaToracica: 102.0,
      perimetroCintura: 76.0,

      diametroBiacromial: 43.0,
      diametroBiiliocristal: 29.5,
      diametroHumero: 7.5,
      diametroFemur: 10.2,
      diametroApCajaToracica: 22.0,
      diametroTransversalCajaToracica: 32.0
    };

    const fraccHombre = new FraccionamientoAntropometrico(medidasHombre);

    test('✔️ calcularSuperficieCorporal debe retornar aproximadamente 1.8982 m²', () => {
      const superficie = fraccHombre.calcularSuperficieCorporal();
      expect(superficie).toBeCloseTo(1.8982, 3);
    });

    test('✔️ calcularMasaPiel debe retornar aproximadamente 4.126 kg', () => {
      const superficie = fraccHombre.calcularSuperficieCorporal();
      const masaPiel = fraccHombre.calcularMasaPiel(superficie);
      expect(masaPiel).toBeCloseTo(4.126, 3);
    });

    test('✔️ calcularMasaAdiposa debe retornar aproximadamente 19.102 kg y Z = -1.707', () => {
      const [masa, z] = fraccHombre.calcularMasaAdiposa();
      expect(masa).toBeCloseTo(19.102, 3);
      expect(z).toBeCloseTo(-1.707, 3);
    });

    test('✔️ calcularMasaMuscular debe retornar aproximadamente 44.193 kg y Z = 2.154', () => {
      const [masa, z] = fraccHombre.calcularMasaMuscular();
      expect(masa).toBeCloseTo(44.193, 3);
      expect(z).toBeCloseTo(2.154, 3);
    });

    test('✔️ calcularMasaOseaCabeza debe retornar aproximadamente 1.850 kg y Z = 1.736', () => {
      const [masa, z] = fraccHombre.calcularMasaOseaCabeza();
      expect(masa).toBeCloseTo(1.850, 3);
      expect(z).toBeCloseTo(1.736, 3);
    });

    test('✔️ calcularMasaOseaCuerpo debe retornar aproximadamente 8.814 kg y Z = 0.378', () => {
      const [masa, z] = fraccHombre.calcularMasaOseaCuerpo();
      expect(masa).toBeCloseTo(8.814, 3);
      expect(z).toBeCloseTo(0.378, 3);
    });

    test('✔️ calcularMasaResidual debe retornar aproximadamente 9.317 kg y Z = 1.255', () => {
      const [masa, z] = fraccHombre.calcularMasaResidual();
      expect(masa).toBeCloseTo(9.317, 3);
      expect(z).toBeCloseTo(1.255, 3);
    });

    test('✔️ calcularFraccionamientoCompleto debe retornar todos los resultados coherentes', () => {
      const resultados = fraccHombre.calcularFraccionamientoCompleto();

      expect(resultados.masaPiel).toBeCloseTo(4.126, 3);
      expect(resultados.masaAdiposa).toBeCloseTo(19.102, 3);
      expect(resultados.masaMuscular).toBeCloseTo(44.193, 3);
      expect(resultados.masaOseaCabeza).toBeCloseTo(1.850, 3);
      expect(resultados.masaOseaCuerpo).toBeCloseTo(8.814, 3);
      expect(resultados.masaOseaTotal).toBeCloseTo(10.664, 3);
      expect(resultados.masaResidual).toBeCloseTo(9.317, 3);
      expect(resultados.masaTotalPredictiva).toBeCloseTo(87.401, 3);
    });
  });
