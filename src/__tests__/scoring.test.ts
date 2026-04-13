import { calculatePaqScore, PaqCFormValues, PaqAFormValues } from '../lib/scoring';

describe('calculatePaqScore - PAQ-C', () => {
  it('should calculate a high activity score', () => {
    const values: PaqCFormValues = {
      paqC1_activities: { saltar_soga: '7+', correr: '5-6' },
      paqC2_educacion_fisica: 'e',
      paqC3_recreo: 'd',
      paqC4_antes_despues_comer: 'c',
      paqC5_despues_colegio: 'd',
      paqC6_noche: 'b',
      paqC7_fin_semana: 'e',
      paqC8_descripcion_semana: 'd',
      paqC9_daily_freq: { lunes: 'Mucha', martes: 'Bastante', miercoles: 'Normal' },
      paqC10_enfermo: 'no',
    };
    const result = calculatePaqScore(values, 'PAQ-C');
    expect(result.score).toBeGreaterThanOrEqual(3.67);
    expect(result.score).toBeLessThanOrEqual(5.0);
    expect(result.classification).toBe('Actividad física alta');
  });

  it('should handle "otros" activity correctly', () => {
    const values: PaqCFormValues = {
      paqC1_activities: { otros: '3-4' },
      paqC2_educacion_fisica: 'b',
      paqC3_recreo: 'b',
      paqC4_antes_despues_comer: 'b',
      paqC5_despues_colegio: 'b',
      paqC6_noche: 'b',
      paqC7_fin_semana: 'b',
      paqC8_descripcion_semana: 'b',
      paqC9_daily_freq: { lunes: 'Poca' },
      paqC10_enfermo: 'si',
    };
    const result = calculatePaqScore(values, 'PAQ-C');
    expect(result.score).toBeGreaterThanOrEqual(1.0);
    expect(result.score).toBeLessThanOrEqual(2.33);
    expect(result.classification).toBe('Actividad física baja');
  });

  it('should return "No clasificable" if no answers provided', () => {
    const values: PaqCFormValues = {
      paqC1_activities: {},
      paqC2_educacion_fisica: '',
      paqC3_recreo: '',
      paqC4_antes_despues_comer: '',
      paqC5_despues_colegio: '',
      paqC6_noche: '',
      paqC7_fin_semana: '',
      paqC8_descripcion_semana: '',
      paqC9_daily_freq: {},
      paqC10_enfermo: 'no',
    } as any;
    const result = calculatePaqScore(values, 'PAQ-C');
    expect(result.score).toBe(0);
    expect(result.classification).toBe('No clasificable');
  });
});

describe('calculatePaqScore - PAQ-A', () => {
  it('should calculate a moderate activity score', () => {
    const values: PaqAFormValues = {
      paqA1_activities: { futbol: '3-4' },
      paqA2_educacion_fisica: 'c',
      paqA3_hasta_almuerzo: 'c',
      paqA4_despues_colegio: 'c',
      paqA5_tardes: 'c',
      paqA6_fin_semana: 'c',
      paqA7_descripcion_semana: 'c',
      paqA8_daily_freq: { lunes: 'Normal', martes: 'Normal' },
      paqA9_enfermo: 'no',
    };
    const result = calculatePaqScore(values, 'PAQ-A');
    expect(result.score).toBeGreaterThanOrEqual(2.34);
    expect(result.score).toBeLessThanOrEqual(3.66);
    expect(result.classification).toBe('Actividad física moderada');
  });
});
