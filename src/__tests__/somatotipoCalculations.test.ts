import {
  safeNumber,
  calculateEndomorphy,
  calculateMesomorphy,
  calculateEctomorphy,
  calculateSomatotype
} from '../lib/somatotipoCalculations';

describe('safeNumber', () => {
  it('returns number if valid', () => {
    expect(safeNumber(5)).toBe(5);
  });
  it('returns null for null or NaN', () => {
    expect(safeNumber(null)).toBeNull();
    expect(safeNumber(NaN)).toBeNull();
  });
});

describe('calculateEndomorphy', () => {
  it('calculates endomorphy with valid inputs', () => {
    expect(calculateEndomorphy(10, 10, 10, 170.18)).not.toBeNull();
  });
  it('returns null if any input is null', () => {
    expect(calculateEndomorphy(null, 10, 10, 170.18)).toBeNull();
  });
});

describe('calculateMesomorphy', () => {
  it('calculates mesomorphy with valid inputs', () => {
    expect(
      calculateMesomorphy(5, 5, 30, 10, 35, 10, 170)
    ).not.toBeNull();
  });
  it('returns null if any input is null', () => {
    expect(
      calculateMesomorphy(null, 5, 30, 10, 35, 10, 170)
    ).toBeNull();
  });
});

describe('calculateEctomorphy', () => {
  it('calculates ectomorphy with valid inputs', () => {
    expect(calculateEctomorphy(180, 70)).not.toBeNull();
  });
  it('returns null if any input is null or peso <= 0', () => {
    expect(calculateEctomorphy(180, null)).toBeNull();
    expect(calculateEctomorphy(180, 0)).toBeNull();
  });
});

// Nota: Para calculateSomatotype se recomienda un test de integración con mocks de datos reales.