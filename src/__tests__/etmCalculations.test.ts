import {
  getClosestTwo,
  getPliegues,
  calcularETMPorPliegue,
  calcularETM,
} from "../lib/etmCalcultation";

import type { EvaluationRecord } from "../lib/types";

describe('etmCalculator', () => {
  
  // ============================================
  // Tests para getClosestTwo
  // ============================================
  describe('getClosestTwo', () => {
    it('debe retornar m1 y m2 cuando solo hay dos mediciones', () => {
      const result = getClosestTwo(12, 12, null);
      expect(result).toEqual({ m1: 12, m2: 12 });
    });

    it('debe retornar m1 y m2 cuando son las más cercanas', () => {
      const result = getClosestTwo(12, 12.6, 14.5);
      expect(result).toEqual({ m1: 12, m2: 12.6 });
    });

    it('debe retornar m1 y m3 cuando son las más cercanas', () => {
      const result = getClosestTwo(10, 15, 10.5);
      expect(result).toEqual({ m1: 10, m3: 10.5 });
    });

    it('debe retornar m2 y m3 cuando son las más cercanas', () => {
      const result = getClosestTwo(7, 9, 9.4);
      expect(result).toEqual({ m2: 9, m3: 9.4 });
    });

    it('debe manejar valores null correctamente', () => {
      const result = getClosestTwo(12, null, null);
      expect(result).toEqual({ m1: 12, m2: undefined });
    });

    it('debe manejar cuando m1 es null', () => {
      const result = getClosestTwo(null, 12, null);
      expect(result).toEqual({ m1: undefined, m2: 12 });
    });
  })
});

// ============================================
  // Tests para getPliegues
  // ============================================
  describe('getPliegues', () => {
    it('debe extraer pliegues de formulario express', () => {
      const record: EvaluationRecord = {
        id: '1',
        participant_id: '1',
        test_results: {
          express: {
            pliegues_cutaneos: {
              triceps: { m1: 12, m2: 12, m3: null }
            }
          }
        }
      } as any;

      const pliegues = getPliegues(record);
      expect(pliegues?.triceps).toEqual({ m1: 12, m2: 12, m3: null });
    });

    it('debe extraer pliegues de formulario restringido', () => {
      const record: EvaluationRecord = {
        id: '1',
        participant_id: '1',
        test_results: {
          restringido: {
            pliegues_cutaneos: {
              subescapular: { m1: 15, m2: 15, m3: null }
            }
          }
        }
      } as any;

      const pliegues = getPliegues(record);
      expect(pliegues?.subescapular).toEqual({ m1: 15, m2: 15, m3: null });
    });

    it('debe extraer pliegues de formulario 5 componentes', () => {
      const record: EvaluationRecord = {
        id: '1',
        participant_id: '1',
        test_results: {
          cinco_componentes: {
            pliegues_cutaneos: {
              subescapular: { m1: 10, m2: 10.2, m3: null },
              triceps: { m1: 12, m2: 12.5, m3: null}
            }
          }
        }
      } as any;

      const pliegues = getPliegues(record);
      expect(pliegues?.subescapular).toEqual({ m1: 10, m2: 10.2, m3: null });
    expect(pliegues?.triceps).toEqual({ m1: 12, m2: 12.5, m3: null });
    });

    it('debe retornar null cuando no hay test_results', () => {
      const record: EvaluationRecord = {
        id: '1',
        participant_id: '1',
        test_results: null
      } as any;

      const pliegues = getPliegues(record);
      expect(pliegues).toBeNull();
    });
  });

  // ============================================
  // Tests para calcularETMPorPliegue
  // ============================================
  describe('calcularETMPorPliegue', () => {
    const mockRecords: EvaluationRecord[] = [
      {
        id: '1',
        participant_id: '1',
        participant_name: 'jose angel',
        test_results: {
          express: {
            pliegues_cutaneos: {
              triceps: { m1: 12, m2: 12, m3: null }
            }
          }
        }
      },
      {
        id: '2',
        participant_id: '2',
        participant_name: 'pablo emilio',
        test_results: {
          express: {
            pliegues_cutaneos: {
              triceps: { m1: 11, m2: 11, m3: null }
            }
          }
        }
      },
      {
        id: '3',
        participant_id: '3',
        participant_name: 'martin elias',
        test_results: {
          express: {
            pliegues_cutaneos: {
              triceps: { m1: 10, m2: 10, m3: null }
            }
          }
        }
      },
      {
        id: '4',
        participant_id: '4',
        participant_name: 'Alvaro Uribe',
        test_results: {
          express: {
            pliegues_cutaneos: {
              triceps: { m1: 10, m2: 10, m3: null }
            }
          }
        }
      },
      {
        id: '5',
        participant_id: '5',
        participant_name: 'Gustavo Petro',
        test_results: {
          express: {
            pliegues_cutaneos: {
              triceps: { m1: 12, m2: 12.6, m3: null }
            }
          }
        }
      }
    ] as any;

    it('debe calcular ETM correctamente para Tríceps', () => {
      const result = calcularETMPorPliegue('triceps', 'Tríceps', mockRecords);
      
      expect(result.participantesValidos).toBe(5);
      expect(result.pliegue).toBe('Tríceps');
      expect(result.etm).toBeCloseTo(0.1897, 3);
      expect(result.etmRelativo).toBeCloseTo(1.72, 1);
      expect(result.interpretacion).toBe('Excelente fiabilidad');
    });

    it('debe retornar mensaje de datos insuficientes con menos de 2 participantes', () => {
      const singleRecord = [mockRecords[0]];
      const result = calcularETMPorPliegue('triceps', 'Tríceps', singleRecord);
      
      expect(result.participantesValidos).toBe(1);
      expect(result.etm).toBeNull();
      expect(result.etmRelativo).toBeNull();
      expect(result.interpretacion).toBe('No hay suficientes datos');
    });

    it('debe calcular ETM para Cresta ilíaca con diferencia cero', () => {
      const records: EvaluationRecord[] = [
        {
          id: '1',
          participant_id: '1',
          test_results: {
            express: {
              pliegues_cutaneos: {
                cresta_iliaca: { m1: 13.2, m2: 13.2, m3: null }
              }
            }
          }
        },
        {
          id: '2',
          participant_id: '2',
          test_results: {
            express: {
              pliegues_cutaneos: {
                cresta_iliaca: { m1: 12.8, m2: 12.8, m3: null }
              }
            }
          }
        },
        {
          id: '4',
          participant_id: '4',
          test_results: {
            express: {
              pliegues_cutaneos: {
                cresta_iliaca: { m1: 15, m2: 15, m3: null }
              }
            }
          }
        }
      ] as any;

      const result = calcularETMPorPliegue('cresta_iliaca', 'Cresta ilíaca', records);
      
      expect(result.participantesValidos).toBe(3);
      expect(result.etm).toBeCloseTo(0.0, 4);
      expect(result.etmRelativo).toBeCloseTo(0.0, 2);
      expect(result.interpretacion).toBe('Excelente fiabilidad');
    });
  });

  // ============================================
  // Tests para calcularETM (todos los pliegues)
  // ============================================
  describe('calcularETM', () => {
    const mockCompleteRecords: EvaluationRecord[] = [
      {
        id: '1',
        participant_id: '1',
        participant_name: 'jose angel',
        test_results: {
          completo: {
            pliegues_cutaneos: {
              triceps: { m1: 12, m2: 12, m3: null },
              subescapular: { m1: 15, m2: 15, m3: null },
              biceps: { m1: 7, m2: 7, m3: null },
              cresta_iliaca: { m1: 13.2, m2: 13.2, m3: null },
              supraespinal: { m1: 18, m2: 18, m3: null },
              abdominal: { m1: 20, m2: 20, m3: null },
              muslo: { m1: 22, m2: 22, m3: null },
              pierna_pliegue: { m1: 10, m2: 10, m3: null }
            }
          }
        }
      },
      {
        id: '2',
        participant_id: '2',
        participant_name: 'pablo emilio',
        test_results: {
          completo: {
            pliegues_cutaneos: {
              triceps: { m1: 11, m2: 11, m3: null },
              subescapular: { m1: 9.8, m2: 9.8, m3: null },
              biceps: { m1: 6.5, m2: 6.5, m3: null },
              cresta_iliaca: { m1: 12.8, m2: 12.8, m3: null },
              supraespinal: { m1: 10.2, m2: 10.2, m3: null },
              abdominal: { m1: 14.2, m2: 14.2, m3: null },
              muslo: { m1: 15, m2: 15, m3: null },
              pierna_pliegue: { m1: 9.5, m2: 9.5, m3: null }
            }
          }
        }
      },
      {
        id: '3',
        participant_id: '3',
        participant_name: 'martin elias',
        test_results: {
          completo: {
            pliegues_cutaneos: {
              triceps: { m1: 10, m2: 10, m3: null },
              subescapular: { m1: 10, m2: 10, m3: null },
              supraespinal: { m1: 10, m2: 10, m3: null },
              abdominal: { m1: 10, m2: 10, m3: null },
              muslo: { m1: 10, m2: 10, m3: null },
              pierna_pliegue: { m1: 10, m2: 10, m3: null }
            }
          }
        }
      },
      {
        id: '4',
        participant_id: '4',
        participant_name: 'Alvaro Uribe',
        test_results: {
          completo: {
            pliegues_cutaneos: {
              triceps: { m1: 10, m2: 10, m3: null },
              subescapular: { m1: 12.5, m2: 12.5, m3: null },
              supraespinal: { m1: 11.2, m2: 11.2, m3: null },
              abdominal: { m1: 15.5, m2: 15.5, m3: null },
              muslo: { m1: 14.2, m2: 14.2, m3: null },
              pierna_pliegue: { m1: 15, m2: 15, m3: null }
            }
          }
        }
      },
      {
        id: '5',
        participant_id: '5',
        participant_name: 'Gustavo Petro',
        test_results: {
          completo: {
            pliegues_cutaneos: {
              triceps: { m1: 12, m2: 12.6, m3: null },
              subescapular: { m1: 14.5, m2: 14.8, m3: null },
              biceps: { m1: 9, m2: 9.4, m3: null },
              cresta_iliaca: { m1: 15, m2: 15, m3: null },
              supraespinal: { m1: 13, m2: 12.8, m3: null },
              abdominal: { m1: 20, m2: 20.5, m3: null },
              muslo: { m1: 16, m2: 16.5, m3: null },
              pierna_pliegue: { m1: 10, m2: 10.5, m3: null }
            }
          }
        }
      }
    ] as any;

    it('debe calcular ETM para todos los pliegues', () => {
      const results = calcularETM(mockCompleteRecords);
      
      expect(results).toHaveLength(8);
      expect(results[0].pliegue).toBe('Tríceps');
      expect(results[1].pliegue).toBe('Subescapular');
      expect(results[2].pliegue).toBe('Bíceps');
      expect(results[3].pliegue).toBe('Cresta ilíaca');
      expect(results[4].pliegue).toBe('Supraespinal');
      expect(results[5].pliegue).toBe('Abdominal');
      expect(results[6].pliegue).toBe('Muslo anterior');
      expect(results[7].pliegue).toBe('Pierna medial');
    });

    it('debe tener todos los resultados con "Excelente fiabilidad"', () => {
      const results = calcularETM(mockCompleteRecords);
      
      results.forEach(result => {
        if (result.etm !== null) {
          expect(result.interpretacion).toBe('Excelente fiabilidad');
        }
      });
    });

    it('debe tener el número correcto de participantes válidos', () => {
      const results = calcularETM(mockCompleteRecords);
      
      expect(results[0].participantesValidos).toBe(5); // Tríceps
      expect(results[1].participantesValidos).toBe(5); // Subescapular
      expect(results[2].participantesValidos).toBe(3); // Bíceps
      expect(results[3].participantesValidos).toBe(3); // Cresta ilíaca
      expect(results[4].participantesValidos).toBe(5); // Supraespinal
      expect(results[5].participantesValidos).toBe(5); // Abdominal
      expect(results[6].participantesValidos).toBe(5); // Muslo
      expect(results[7].participantesValidos).toBe(5); // Pierna
    });
  });

  // ============================================
  // Tests de interpretación
  // ============================================
  describe('interpretación de ETM Relativo', () => {
    it('debe clasificar como "Excelente fiabilidad" cuando ETM < 5%', () => {
      const records: EvaluationRecord[] = [
        {
          id: '1',
          participant_id: '1',
          test_results: {
            express: {
              pliegues_cutaneos: {
                triceps: { m1: 10, m2: 10, m3: null }
              }
            }
          }
        },
        {
          id: '2',
          participant_id: '2',
          test_results: {
            express: {
              pliegues_cutaneos: {
                triceps: { m1: 10, m2: 10, m3: null }
              }
            }
          }
        }
      ] as any;

      const result = calcularETMPorPliegue('triceps', 'Tríceps', records);
      expect(result.interpretacion).toBe('Excelente fiabilidad');
    });

    it('debe clasificar como "Buena fiabilidad" cuando ETM entre 5% y 10%', () => {
      const records: EvaluationRecord[] = [
        {
          id: '1',
          participant_id: '1',
          test_results: {
            express: {
              pliegues_cutaneos: {
                triceps: { m1: 10, m2: 11, m3: null }
              }
            }
          }
        },
        {
          id: '2',
          participant_id: '2',
          test_results: {
            express: {
              pliegues_cutaneos: {
                triceps: { m1: 10, m2: 11, m3: null }
              }
            }
          }
        }
      ] as any;

      const result = calcularETMPorPliegue('triceps', 'Tríceps', records);
      expect(result.etmRelativo).toBeGreaterThanOrEqual(5);
      expect(result.etmRelativo).toBeLessThan(10);
      expect(result.interpretacion).toBe('Buena fiabilidad');
    });
  });