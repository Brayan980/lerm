import { calculateAllMacroindices } from '../lib/macroindicesCalculations';
import type { MacroindicesResults, InitialRegistrationData } from '../lib/types';

describe('Cálculos de Macroíndices', () => {
  const validMeasures: MacroindicesResults = {
    masaCorporal: { m1: 70, m2: 70, result: 70 },
    talla: { m1: 170, m2: 170, result: 170 },
    tallaSentada: { m1: 88, m2: 88, result: 88 },
    perimetroTorax: { m1: 95, m2: 95, result: 95 },
    perimetroCintura: { m1: 80, m2: 80, result: 80 },
    perimetroCadera: { m1: 95, m2: 95, result: 95 },
    diametroBiacromial: { m1: 40, m2: 40, result: 40 },
    diametroBiiliocristal: { m1: 28, m2: 28, result: 28 },
    diametroAPAbdomen: { m1: 20, m2: 20, result: 20 },
    longitudAcromialeRadiale: { m1: 32, m2: 32, result: 32 },
    longitudRadialeStylion: { m1: 25, m2: 25, result: 25 },
    longitudStylionMedioDactylion: { m1: 18, m2: 18, result: 18 },
    alturaIliospinale: { m1: 95, m2: 95, result: 95 },
    longitudTrochanterionTibialeLaterale: { m1: 45, m2: 45, result: 45 }
  };

  const childMeasures: MacroindicesResults = {
    masaCorporal: { m1: 58.5, m2: 58.5, result: 58.5 },
    talla: { m1: 162.5, m2: 162.5, result: 162.5 },
    tallaSentada: { m1: 80, m2: 80, result: 80 },
    perimetroTorax: { m1: 85, m2: 85, result: 85 },
    perimetroCintura: { m1: 70, m2: 70, result: 70 },
    perimetroCadera: { m1: 90, m2: 90, result: 90 },
    diametroBiacromial: { m1: 40, m2: 40, result: 40 },
    diametroBiiliocristal: { m1: 30, m2: 30, result: 30 },
    diametroAPAbdomen: { m1: 18, m2: 18, result: 18 },
    longitudAcromialeRadiale: { m1: 31, m2: 31, result: 31 },
    longitudRadialeStylion: { m1: 23, m2: 23, result: 23 },
    longitudStylionMedioDactylion: { m1: 17, m2: 17, result: 17 },
    alturaIliospinale: { m1: 90, m2: 90, result: 90 },
    longitudTrochanterionTibialeLaterale: { m1: 43, m2: 43, result: 43 }
  };


  const validParticipantData: InitialRegistrationData = {
    id: '1',
    first_name: 'John',
    last_name: 'Doe',
    dob: '2000-01-01',
    calculated_age: 25,
    sex: 'Masculino',
    email: 'john@example.com',
    id_number: '12345678',
    accepted_terms: true
  };

  const childParticipantData: InitialRegistrationData = {
    id: '2',
    first_name: 'Carlos',
    last_name: 'Hoyos',
    dob: '2000-01-01',
    calculated_age: 13.23,
    sex: 'Masculino',
    email: 'carlos@example.com',
    id_number: '9818921',
    accepted_terms: true
  }

  describe('Cálculos básicos', () => {
    it('calcula IMC correctamente', () => {
      const result = calculateAllMacroindices(validMeasures, validParticipantData, undefined, undefined, undefined);
      // IMC = peso / altura² (en metros)
      const expectedIMC = 70 / Math.pow(1.70, 2);
      expect(result?.imc?.value).toBeCloseTo(expectedIMC, 2);
    });

    it('calcula índice de Livi correctamente', () => {
      const result = calculateAllMacroindices(validMeasures, validParticipantData, undefined, undefined, undefined);
      // Livi = ∛(peso/altura)
      const expectedLivi = Math.cbrt(70/170);
      expect(result?.livi).toBeCloseTo(expectedLivi, 3);
    });

    it('calcula índice de Röher correctamente', () => {
      const result = calculateAllMacroindices(validMeasures, validParticipantData, undefined, undefined, undefined);
      // Röher = peso / altura³ (en metros)
      const expectedRoher = 70 / Math.pow(1.70, 3);
      expect(result?.roher?.value).toBeCloseTo(expectedRoher, 2);
    });
  });

  describe('Índices de proporcionalidad', () => {
    it('calcula índice córmico correctamente', () => {
      const result = calculateAllMacroindices(validMeasures, validParticipantData, undefined, undefined, undefined);
      // IC = (talla sentada * 100) / talla total
      const expectedIC = (88 * 100) / 170;
      expect(result?.icCormico?.value).toBeCloseTo(expectedIC, 2);
      // Verifica la clasificación para hombre
      expect(result?.icCormico?.classification).toBeDefined();
    });

    it('calcula índice acromio-iliaco correctamente', () => {
      const result = calculateAllMacroindices(validMeasures, validParticipantData, undefined, undefined, undefined);
      const expectedIAI = (40 * 100) / 28;
      expect(result?.iai?.value).toBeCloseTo(expectedIAI, 2);
      // expect(result?.iai?.classification).toBeDefined();
    });
  });

  describe('Índices de distribución de grasa', () => {
    it('calcula índice cintura-cadera correctamente', () => {
      const result = calculateAllMacroindices(validMeasures, validParticipantData, undefined, undefined, undefined);
      // ICC = perímetro cintura / perímetro cadera
      const expectedICC = 80 / 95;
      expect(result?.icc?.value).toBeCloseTo(expectedICC, 2);
    });

    it('calcula índice de conicidad correctamente', () => {
      const result = calculateAllMacroindices(validMeasures, validParticipantData, undefined, undefined, undefined);
      const perimetroUmbilicalM = 80 / 100;
      const expectedIC = perimetroUmbilicalM / (0.109 * Math.sqrt(70 / 1.70));
      expect(result?.icConicidad).toBeCloseTo(expectedIC, 2);
    });
  });

  describe('Clasificaciones', () => {
    it('clasifica correctamente el índice córmico para hombre', () => {
      const result = calculateAllMacroindices(validMeasures, validParticipantData, undefined, undefined, undefined);
      expect(result?.icCormico?.classification).toMatch(/(Braquicórmicos|Metricórmicos|Macrocórmicos)/);
    });

    it('clasifica correctamente el índice córmico para mujer', () => {
      const femaleParticipant = { ...validParticipantData, sex: 'Femenino' as const };
      const result = calculateAllMacroindices(validMeasures, femaleParticipant, undefined, undefined, undefined);
      expect(result?.icCormico?.classification).toMatch(/(Braquicórmicos|Metricórmicos|Macrocórmicos)/);
    });

    it('clasifica correctamente el índice acromio-iliaco', () => {
      const result = calculateAllMacroindices(validMeasures, validParticipantData, undefined, undefined, undefined);
      expect(result?.iai?.classification).toMatch("Diametro biacromial proporcionalmente más ancho estrecho al diámetro biiliocristal");
    });
  });


  // Tests específicos para maduración biológica y crecimiento

  describe('Maduración biológica y crecimiento', () => {
    it('calcula correctamente el índice de maduración para un hombre', () => {
      const result = calculateAllMacroindices(childMeasures, childParticipantData, undefined, undefined, undefined);
      expect(result?.indiceMaduracion).toBeCloseTo(-0.80, 2);
    });

    it('calcula correctamente la edad PHV', () => {
      const result = calculateAllMacroindices(childMeasures, childParticipantData, undefined, undefined, undefined);
      expect(result?.edadPhv).toBeCloseTo(14.03, 2);
    });

    it('clasifica correctamente la maduración para hombres', () => {
      const result = calculateAllMacroindices(childMeasures, childParticipantData, undefined, undefined, undefined);
      expect(result?.clasMaduracion).toBe('NORM');
    });

    it('calcula correctamente la falta de CM para hombres', () => {
      const result = calculateAllMacroindices(childMeasures, childParticipantData, undefined, undefined, undefined);
      expect(result?.faltaCm).toBeCloseTo(22.99, 2);
    });

    it('calcula correctamente la estatura adulta estimada', () => {
      const result = calculateAllMacroindices(childMeasures, childParticipantData, undefined, undefined, undefined);
      expect(result?.estaturaAdultaEst).toBeCloseTo(185.5, 1);
    });

    it('calcula correctamente la edad estimada de la talla adulta', () => {
      const result = calculateAllMacroindices(childMeasures, childParticipantData, undefined, undefined, undefined);
      // Si clas = NORM, edad estimada = edad PHV + 4
      if (result?.edadPhv && result?.clasMaduracion === 'NORM') {
        expect(result.edadEstimadaTallaAdulta).toBeCloseTo(result.edadPhv + 4, 1);
      }
    });
  })

    describe('Maduración biológica y crecimiento', () => {
    it('calcula correctamente el índice de maduración para un hombre (Carlos Hoyos)', () => {
      const result = calculateAllMacroindices(childMeasures, childParticipantData, undefined, undefined, undefined);
      expect(result?.indiceMaduracion).toBeCloseTo(-0.80, 2);
    });

    it('calcula correctamente la edad PHV (Carlos Hoyos)', () => {
      const result = calculateAllMacroindices(childMeasures, childParticipantData, undefined, undefined, undefined);
      expect(result?.edadPhv).toBeCloseTo(14.03, 2);
    });

    it('clasifica correctamente la maduración para hombres (Carlos Hoyos)', () => {
      const result = calculateAllMacroindices(childMeasures, childParticipantData, undefined, undefined, undefined);
      expect(result?.clasMaduracion).toBe('NORM');
    });

    it('calcula correctamente la falta de CM para hombres (Carlos Hoyos)', () => {
      const result = calculateAllMacroindices(childMeasures, childParticipantData, undefined, undefined, undefined);
      expect(result?.faltaCm).toBeCloseTo(22.99, 2);
    });

    it('calcula correctamente la estatura adulta estimada (Carlos Hoyos)', () => {
      const result = calculateAllMacroindices(childMeasures, childParticipantData, undefined, undefined, undefined);
      expect(result?.estaturaAdultaEst).toBeCloseTo(185.5, 1);
    });

    it('calcula correctamente la edad estimada de la talla adulta (Carlos Hoyos)', () => {
      const result = calculateAllMacroindices(childMeasures, childParticipantData, undefined, undefined, undefined);
      if (result?.edadPhv && result?.clasMaduracion === 'NORM') {
        expect(result.edadEstimadaTallaAdulta).toBeCloseTo(result.edadPhv + 4, 1);
      }
    });

    // 📘 Caso 5 - Jacinta (Mujer, 12.99 años)
    it('calcula correctamente los índices para Jacinta (Mujer, 12.99 años)', () => {
      const measures: MacroindicesResults = {
        masaCorporal: { m1: 41.7, m2: 41.7, result: 41.7 },
        talla: { m1: 142, m2: 142, result: 142 },
        tallaSentada: { m1: 75, m2: 75, result: 75 },
        perimetroTorax: { m1: 80, m2: 80, result: 80 },
        perimetroCintura: { m1: 60, m2: 60, result: 60 },
        perimetroCadera: { m1: 80, m2: 80, result: 80 },
        diametroBiacromial: { m1: 35, m2: 35, result: 35 },
        diametroBiiliocristal: { m1: 26, m2: 26, result: 26 },
        diametroAPAbdomen: { m1: 16, m2: 16, result: 16 },
        longitudAcromialeRadiale: { m1: 30, m2: 30, result: 30 },
        longitudRadialeStylion: { m1: 22, m2: 22, result: 22 },
        longitudStylionMedioDactylion: { m1: 16, m2: 16, result: 16 },
        alturaIliospinale: { m1: 80, m2: 80, result: 80 },
        longitudTrochanterionTibialeLaterale: { m1: 40, m2: 40, result: 40 },
      };

      const participant: InitialRegistrationData = {
        id: '5',
        first_name: 'Jacinta',
        last_name: 'García',
        dob: '2005-10-08',
        calculated_age: 12.99,
        sex: 'Femenino',
        email: 'jacinta@example.com',
        id_number: '5555',
        accepted_terms: true,
      };

      const result = calculateAllMacroindices(measures, participant, undefined, undefined, undefined);

      expect(result?.indiceMaduracion).toBeCloseTo(0, 1);
      expect(result?.edadPhv).toBeCloseTo(12.99, 1);
      expect(result?.clasMaduracion).toBe('NORM');
      expect(result?.faltaCm).toBeCloseTo(14.75, 1);
      expect(result?.estaturaAdultaEst).toBeCloseTo(156.75, 2);
      expect(result?.edadEstimadaTallaAdulta).toBeCloseTo(16.99, 1);
    });

    // 📘 Caso 6 - Santiago Romero (Hombre, 16.82 años)
    it('calcula correctamente los índices para Santiago Romero (Hombre, 16.82 años)', () => {
      const measures: MacroindicesResults = {
        masaCorporal: { m1: 76.9, m2: 76.9, result: 76.9 },
        talla: { m1: 175, m2: 175, result: 175 },
        tallaSentada: { m1: 86, m2: 86, result: 86 },
        perimetroTorax: { m1: 95, m2: 95, result: 95 },
        perimetroCintura: { m1: 80, m2: 80, result: 80 },
        perimetroCadera: { m1: 95, m2: 95, result: 95 },
        diametroBiacromial: { m1: 42, m2: 42, result: 42 },
        diametroBiiliocristal: { m1: 30, m2: 30, result: 30 },
        diametroAPAbdomen: { m1: 20, m2: 20, result: 20 },
        longitudAcromialeRadiale: { m1: 33, m2: 33, result: 33 },
        longitudRadialeStylion: { m1: 25, m2: 25, result: 25 },
        longitudStylionMedioDactylion: { m1: 18, m2: 18, result: 18 },
        alturaIliospinale: { m1: 95, m2: 95, result: 95 },
        longitudTrochanterionTibialeLaterale: { m1: 45, m2: 45, result: 45 },
      };

      const participant: InitialRegistrationData = {
        id: '6',
        first_name: 'Santiago',
        last_name: 'Romero',
        dob: '2007-03-09',
        calculated_age: 16.82,
        sex: 'Masculino',
        email: 'santiago@example.com',
        id_number: '6666',
        accepted_terms: true,
      };

      const result = calculateAllMacroindices(measures, participant, undefined, undefined, undefined);

      expect(result?.indiceMaduracion).toBeCloseTo(1.8, 1);
      expect(result?.edadPhv).toBeCloseTo(15.03, 2);
      expect(result?.clasMaduracion).toBe('TARD');
      expect(result?.faltaCm).toBeCloseTo(1.92, 2);
      expect(result?.estaturaAdultaEst).toBeCloseTo(176.9, 1);
      expect(result?.edadEstimadaTallaAdulta).toBeCloseTo(18.03, 2);
    });

    // 📘 Caso 7 - Dayana Montiel (Mujer, 11.33 años)
    it('calcula correctamente los índices para Dayana Montiel (Mujer, 11.33 años)', () => {
      const measures: MacroindicesResults = {
        masaCorporal: { m1: 33.1, m2: 33.1, result: 33.1 },
        talla: { m1: 145, m2: 145, result: 145 },
        tallaSentada: { m1: 76.5, m2: 76.5, result: 76.5 },
        perimetroTorax: { m1: 75, m2: 75, result: 75 },
        perimetroCintura: { m1: 60, m2: 60, result: 60 },
        perimetroCadera: { m1: 80, m2: 80, result: 80 },
        diametroBiacromial: { m1: 34, m2: 34, result: 34 },
        diametroBiiliocristal: { m1: 26, m2: 26, result: 26 },
        diametroAPAbdomen: { m1: 15, m2: 15, result: 15 },
        longitudAcromialeRadiale: { m1: 29, m2: 29, result: 29 },
        longitudRadialeStylion: { m1: 21, m2: 21, result: 21 },
        longitudStylionMedioDactylion: { m1: 15, m2: 15, result: 15 },
        alturaIliospinale: { m1: 75, m2: 75, result: 75 },
        longitudTrochanterionTibialeLaterale: { m1: 38, m2: 38, result: 38 },
      };

      const participant: InitialRegistrationData = {
        id: '7',
        first_name: 'Dayana',
        last_name: 'Montiel',
        dob: '2013-08-18',
        calculated_age: 11.33,
        sex: 'Femenino',
        email: 'dayana@example.com',
        id_number: '7777',
        accepted_terms: true,
      };

      const result = calculateAllMacroindices(measures, participant, undefined, undefined, undefined);

      expect(result?.indiceMaduracion).toBeCloseTo(-0.86, 2);
      expect(result?.edadPhv).toBeCloseTo(12.19, 2);
      expect(result?.clasMaduracion).toBe('NORM');
      expect(result?.faltaCm).toBeCloseTo(20.44, 2);
      expect(result?.estaturaAdultaEst).toBeCloseTo(165.4, 1);
      expect(result?.edadEstimadaTallaAdulta).toBeCloseTo(16.19, 2);
    });

    // 📘 Caso 9 - Jesús Barboza (Hombre, 15.79 años)
    it('calcula correctamente los índices para Jesús Barboza (Hombre, 15.79 años)', () => {
      const measures: MacroindicesResults = {
        masaCorporal: { m1: 52.5, m2: 52.5, result: 52.5 },
        talla: { m1: 171.3, m2: 171.3, result: 171.3 },
        tallaSentada: { m1: 88, m2: 88, result: 88 },
        perimetroTorax: { m1: 85, m2: 85, result: 85 },
        perimetroCintura: { m1: 75, m2: 75, result: 75 },
        perimetroCadera: { m1: 90, m2: 90, result: 90 },
        diametroBiacromial: { m1: 40, m2: 40, result: 40 },
        diametroBiiliocristal: { m1: 28, m2: 28, result: 28 },
        diametroAPAbdomen: { m1: 18, m2: 18, result: 18 },
        longitudAcromialeRadiale: { m1: 32, m2: 32, result: 32 },
        longitudRadialeStylion: { m1: 24, m2: 24, result: 24 },
        longitudStylionMedioDactylion: { m1: 18, m2: 18, result: 18 },
        alturaIliospinale: { m1: 90, m2: 90, result: 90 },
        longitudTrochanterionTibialeLaterale: { m1: 42, m2: 42, result: 42 },
      };

      const participant: InitialRegistrationData = {
        id: '9',
        first_name: 'Jesús',
        last_name: 'Barboza',
        dob: '2009-03-02',
        calculated_age: 15.79,
        sex: 'Masculino',
        email: 'jesus@example.com',
        id_number: '9999',
        accepted_terms: true,
      };

      const result = calculateAllMacroindices(measures, participant, undefined, undefined, undefined);

      expect(result?.indiceMaduracion).toBeCloseTo(1.29, 2);
      expect(result?.edadPhv).toBeCloseTo(14.5, 2);
      expect(result?.clasMaduracion).toBe('NORM');
      expect(result?.faltaCm).toBeCloseTo(6.59, 2);
      expect(result?.estaturaAdultaEst).toBeCloseTo(177.9, 1);
      expect(result?.edadEstimadaTallaAdulta).toBeCloseTo(18.5, 2);
    });

        // 📘 Caso 10
    it('calcula correctamente los índices para Jesús Barboza (Hombre, 15.79 años)', () => {
      const measures: MacroindicesResults = {
        masaCorporal: { m1: 75, m2: 75, result: 75 },
        talla: { m1: 175, m2: 175, result: 175 },
        tallaSentada: { m1: 92, m2: 92, result: 92 },
        perimetroTorax: { m1: 85, m2: 85, result: 85 },
        perimetroCintura: { m1: 75, m2: 75, result: 75 },
        perimetroCadera: { m1: 90, m2: 90, result: 90 },
        diametroBiacromial: { m1: 40, m2: 40, result: 40 },
        diametroBiiliocristal: { m1: 28, m2: 28, result: 28 },
        diametroAPAbdomen: { m1: 18, m2: 18, result: 18 },
        longitudAcromialeRadiale: { m1: 32, m2: 32, result: 32 },
        longitudRadialeStylion: { m1: 24, m2: 24, result: 24 },
        longitudStylionMedioDactylion: { m1: 18, m2: 18, result: 18 },
        alturaIliospinale: { m1: 90, m2: 90, result: 90 },
        longitudTrochanterionTibialeLaterale: { m1: 42, m2: 42, result: 42 },
      };

      const participant: InitialRegistrationData = {
        id: '10',
        first_name: 'Jesús',
        last_name: 'Barboza',
        dob: '2009-03-02',
        calculated_age: 17,
        sex: 'Masculino',
        email: 'jesus@example.com',
        id_number: '99991',
        accepted_terms: true,
      };

      const result = calculateAllMacroindices(measures, participant, undefined, undefined, undefined);

      expect(result?.indiceMaduracion).toBeCloseTo(2.75, 2);
      expect(result?.edadPhv).toBeCloseTo(14.25, 2);
      expect(result?.clasMaduracion).toBe('NORM');
      expect(result?.faltaCm).toBeCloseTo(1.16, 2);
      expect(result?.estaturaAdultaEst).toBeCloseTo(176.16, 1);
      expect(result?.edadEstimadaTallaAdulta).toBeCloseTo(18.25, 2);
    });

  });


});