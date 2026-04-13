import {
  safeLog10,
  safePow,
  safeSum,
  strictSafeSum,
  safeMultiply,
  safeSubtract,
  safeDivide,
  calculateAllComposicionCorporal
} from '../lib/composicionCorporalCalculations';
import type { ComposicionCorporalResults, InitialRegistrationData } from '../lib/types';

describe('Funciones Auxiliares de Cálculo', () => {
  describe('safeLog10', () => {
    it('calcula correctamente el logaritmo base 10 para números positivos', () => {
      expect(safeLog10(100)).toBe(2);
      expect(safeLog10(1000)).toBe(3);
      expect(safeLog10(1)).toBe(0);
    });

    it('maneja casos especiales y valores límite', () => {
      expect(safeLog10(0)).toBeNull();
      expect(safeLog10(-5)).toBeNull();
      expect(safeLog10(undefined)).toBeNull();
      expect(safeLog10(null)).toBeNull();
    });
  });

  describe('safePow', () => {
    it('calcula correctamente la potencia para casos normales', () => {
      expect(safePow(2, 3)).toBe(8);
      expect(safePow(3, 2)).toBe(9);
      expect(safePow(5, 0)).toBe(1);
    });

    it('maneja casos especiales y valores límite', () => {
      expect(safePow(null, 2)).toBeNull();
      expect(safePow(undefined, 2)).toBeNull();
      expect(safePow(0, 5)).toBe(0);
      expect(safePow(-2, 2)).toBe(4);
    });
  });

  describe('safeSum', () => {
    it('suma correctamente números válidos', () => {
      expect(safeSum(1, 2, 3)).toBe(6);
      expect(safeSum(0, 0, 0)).toBe(0);
      expect(safeSum(-1, 1)).toBe(0);
    });

    it('maneja valores nulos y undefined', () => {
      expect(safeSum(1, 2, null, 3)).toBe(6);
      expect(safeSum(1, undefined, 2)).toBe(3);
      expect(safeSum(null, null)).toBe(0);
    });

    it('maneja arrays vacíos y casos especiales', () => {
      expect(safeSum()).toBe(0);
      expect(safeSum(1)).toBe(1);
      expect(safeSum(...Array(5).fill(1))).toBe(5);
    });
  });

  describe('strictSafeSum', () => {
    it('suma correctamente cuando todos los valores son válidos', () => {
      expect(strictSafeSum(1, 2, 3)).toBe(6);
      expect(strictSafeSum(0, 0)).toBe(0);
      expect(strictSafeSum(-1, 1)).toBe(0);
    });

    it('retorna null si algún valor es null o undefined', () => {
      expect(strictSafeSum(1, null, 3)).toBeNull();
      expect(strictSafeSum(1, undefined, 2)).toBeNull();
      expect(strictSafeSum(null)).toBeNull();
    });
  });

  describe('safeMultiply', () => {
    it('multiplica correctamente números válidos', () => {
      expect(safeMultiply(2, 3, 4)).toBe(24);
      expect(safeMultiply(1, 1, 1)).toBe(1);
      expect(safeMultiply(-2, 3)).toBe(-6);
    });

    it('maneja valores nulos y undefined', () => {
      expect(safeMultiply(2, null, 4)).toBeNull();
      expect(safeMultiply(2, undefined)).toBeNull();
      expect(safeMultiply(null, null)).toBeNull();
    });

    it('maneja casos especiales', () => {
      expect(safeMultiply()).toBeNull();
      expect(safeMultiply(0, 5)).toBe(0);
      expect(safeMultiply(1)).toBe(1);
    });
  });

  describe('safeSubtract', () => {
    it('resta correctamente números válidos', () => {
      expect(safeSubtract(5, 3)).toBe(2);
      expect(safeSubtract(0, 0)).toBe(0);
      expect(safeSubtract(-1, -1)).toBe(0);
    });

    it('maneja valores nulos y undefined', () => {
      expect(safeSubtract(null, 3)).toBeNull();
      expect(safeSubtract(5, null)).toBeNull();
      expect(safeSubtract(undefined, 3)).toBeNull();
    });
  });

  describe('safeDivide', () => {
    it('divide correctamente números válidos', () => {
      expect(safeDivide(10, 2)).toBe(5);
      expect(safeDivide(0, 5)).toBe(0);
      expect(safeDivide(-6, 2)).toBe(-3);
    });

    it('maneja división por cero y valores especiales', () => {
      expect(safeDivide(10, 0)).toBeNull();
      expect(safeDivide(null, 2)).toBeNull();
      expect(safeDivide(10, null)).toBeNull();
      expect(safeDivide(undefined, 2)).toBeNull();
    });
  });
});

