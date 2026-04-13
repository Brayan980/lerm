import {
  mgNiñosAdolecentesSlaughter,
  mgNiños,
  mgNiñas,
  calcularDCAdultos,
  mgAdultosDurninWomersley,
  mgDeportistasHombresFaulkner,
  mgDeportistasFaulkner,
  mgDeportistasMujeresFaulkner
} from '../lib/mgCalculations';

describe('Cálculos de Masa Grasa', () => {
  describe('Fórmula de Slaughter para Niños y Adolescentes', () => {
    const triceps = 15;
    const piernaMedial = 12;
    const pesoKg = 45;

    it('calcula correctamente para niños', () => {
      const resultado = mgNiñosAdolecentesSlaughter('Masculino', triceps, piernaMedial, pesoKg);
      const porcentajeEsperado = 0.735 * (triceps + piernaMedial) + 1.0;
      const masaGrasaEsperada = (porcentajeEsperado / 100) * pesoKg;

      expect(resultado.porcentaje).toBeCloseTo(porcentajeEsperado, 2);
      expect(resultado.masaKg).toBeCloseTo(masaGrasaEsperada, 2);
      expect(resultado.formula).toContain('0.735');
      expect(resultado.referencia).toContain('Slaughter');
    });

    it('calcula correctamente para niñas', () => {
      const resultado = mgNiñosAdolecentesSlaughter('Femenino', triceps, piernaMedial, pesoKg);
      const porcentajeEsperado = 0.610 * (triceps + piernaMedial) + 5.1;
      const masaGrasaEsperada = (porcentajeEsperado / 100) * pesoKg;

      expect(resultado.porcentaje).toBeCloseTo(porcentajeEsperado, 2);
      expect(resultado.masaKg).toBeCloseTo(masaGrasaEsperada, 2);
      expect(resultado.formula).toContain('0.610');
      expect(resultado.referencia).toContain('Slaughter');
    });

    it('maneja correctamente la ausencia de peso', () => {
      const resultado = mgNiñosAdolecentesSlaughter('Masculino', triceps, piernaMedial);
      expect(resultado.porcentaje).toBeDefined();
      expect(resultado.masaKg).toBeNull();
    });
  });

  describe('Fórmulas específicas por género para niños', () => {
    it('mgNiños calcula correctamente', () => {
      const resultado = mgNiños(15, 12, 45);
      expect(resultado.porcentaje).toBeCloseTo(20.845, 2); // 0.735 * (15 + 12) + 1.0
      expect(resultado.masaKg).toBeCloseTo(9.38, 2); // (20.845 / 100) * 45
    });

    it('mgNiñas calcula correctamente', () => {
      const resultado = mgNiñas(15, 12, 45);
      expect(resultado.porcentaje).toBeCloseTo(21.57, 2); // 0.610 * (15 + 12) + 5.1
      expect(resultado.masaKg).toBeCloseTo(9.71, 2); // (21.57 / 100) * 45
    });
  });

  describe('Cálculo de Densidad Corporal para Adultos', () => {
    const pliegues = {
      triceps: 15,
      biceps: 10,
      subescapular: 20,
      crestaIliaca: 18
    };

    it('calcula DC correctamente para hombre joven', () => {
      const resultado = calcularDCAdultos('Masculino', 25, 
        pliegues.triceps, pliegues.biceps, pliegues.subescapular, pliegues.crestaIliaca);
      const sumaPliegues = pliegues.triceps + pliegues.biceps + pliegues.subescapular + pliegues.crestaIliaca;
      const logSum = Math.log10(sumaPliegues);
      const dcEsperada = 1.1631 - 0.0632 * logSum;

      expect(resultado.dc).toBeCloseTo(dcEsperada, 4);
      expect(resultado.formula).toContain('20-29');
    });

    it('calcula DC correctamente para mujer joven', () => {
      const resultado = calcularDCAdultos('Femenino', 25,
        pliegues.triceps, pliegues.biceps, pliegues.subescapular, pliegues.crestaIliaca);
      const sumaPliegues = pliegues.triceps + pliegues.biceps + pliegues.subescapular + pliegues.crestaIliaca;
      const logSum = Math.log10(sumaPliegues);
      const dcEsperada = 1.1599 - 0.0717 * logSum;

      expect(resultado.dc).toBeCloseTo(dcEsperada, 4);
      expect(resultado.formula).toContain('20-29');
    });

    it('maneja diferentes rangos de edad', () => {
      const edades = [25, 35, 45, 55];
      edades.forEach(edad => {
        const resultado = calcularDCAdultos('Masculino', edad,
          pliegues.triceps, pliegues.biceps, pliegues.subescapular, pliegues.crestaIliaca);
        expect(resultado.dc).toBeGreaterThan(0.9);
        expect(resultado.dc).toBeLessThan(1.2);
        expect(resultado.formula).toBeDefined();
      });
    });
  });

  describe('Durnin-Womersley para Adultos', () => {
    const pliegues = {
      triceps: 15,
      biceps: 10,
      subescapular: 20,
      crestaIliaca: 18
    };

    it('calcula el porcentaje de grasa correctamente', () => {
      const resultado = mgAdultosDurninWomersley('Masculino', 25,
        pliegues.triceps, pliegues.biceps, pliegues.subescapular, pliegues.crestaIliaca, 70);
      
      expect(resultado.porcentaje).toBeDefined();
      expect(resultado.masaKg).toBeDefined();
      expect(resultado.formula).toContain('1.1631 - 0.0632*log10');
      expect(resultado.referencia).toContain('Siri');
    });

    it('maneja la ausencia de peso', () => {
      const resultado = mgAdultosDurninWomersley('Masculino', 25,
        pliegues.triceps, pliegues.biceps, pliegues.subescapular, pliegues.crestaIliaca);
      
      expect(resultado.porcentaje).toBeDefined();
      expect(resultado.masaKg).toBeNull();
    });
  });

  describe('Faulkner para Deportistas', () => {
    const pliegues = {
      triceps: 10,
      subescapular: 12,
      supraespinal: 8,
      abdominal: 15
    };

    it('calcula correctamente para hombres deportistas', () => {
      const resultado = mgDeportistasHombresFaulkner(
        pliegues.triceps, pliegues.subescapular, pliegues.supraespinal, pliegues.abdominal, 75
      );
      const porcentajeEsperado = 0.153 * (pliegues.triceps + pliegues.subescapular + 
                                         pliegues.supraespinal + pliegues.abdominal) + 5.783;

      expect(resultado.porcentaje).toBeCloseTo(porcentajeEsperado, 2);
      expect(resultado.formula).toContain('0.153');
      expect(resultado.referencia).toContain('Faulkner');
    });

    it('calcula correctamente para ambos sexos usando mgDeportistasFaulkner', () => {
      const resultadoHombre = mgDeportistasFaulkner('Masculino',
        pliegues.triceps, pliegues.subescapular, pliegues.supraespinal, pliegues.abdominal, 75);
      const resultadoMujer = mgDeportistasFaulkner('Femenino',
        pliegues.triceps, pliegues.subescapular, pliegues.supraespinal, pliegues.abdominal, 75);

      expect(resultadoHombre.porcentaje).toBeDefined();
      expect(resultadoMujer.porcentaje).toBeDefined();
      expect(resultadoHombre.referencia).toContain('Faulkner');
      expect(resultadoMujer.referencia).toContain('Faulkner');
    });
  });
});