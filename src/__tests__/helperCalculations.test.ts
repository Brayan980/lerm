import { calcularIMC } from '../lib/helperCalculations';

describe('calcularIMC', () => {
  it('calcula el IMC correctamente', () => {
    expect(calcularIMC(70, 1.75)).toBeCloseTo(22.86);
  });

  it('devuelve NaN si la altura es 0', () => {
    expect(calcularIMC(70, 0)).toBeNaN();
  });
});
