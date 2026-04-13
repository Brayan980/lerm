import { calculateDecimalAge } from '../lib/ageCalculator';

describe('calculateDecimalAge', () => {
  // Fecha fija para las pruebas para evitar que fallen con el tiempo
  const fixedCurrentDate = new Date('2025-09-30');

  test('calcula correctamente la edad decimal para una fecha de nacimiento válida', () => {
    const birthDate = new Date('2000-01-01');
    const age = calculateDecimalAge(birthDate, fixedCurrentDate);
    expect(age).toBe(25.75); // 25 años y 9 meses aproximadamente
  });

  test('acepta fecha de nacimiento como string', () => {
    const age = calculateDecimalAge('2000-01-01', fixedCurrentDate);
    expect(age).toBe(25.75);
  });

  test('retorna 0 para fecha de nacimiento inválida', () => {
    const age = calculateDecimalAge('invalid-date', fixedCurrentDate);
    expect(age).toBe(0);
  });

  test('retorna 0 para fecha de nacimiento en el futuro', () => {
    const futureBirthDate = new Date('2026-01-01');
    const age = calculateDecimalAge(futureBirthDate, fixedCurrentDate);
    expect(age).toBe(0);
  });

  test('calcula correctamente la edad para fecha de nacimiento en el mismo año', () => {
    const birthDate = new Date('2025-01-01');
    const age = calculateDecimalAge(birthDate, fixedCurrentDate);
    expect(age).toBeCloseTo(0.74, 2); // ~8.9 meses (del 1 de enero al 30 de septiembre)
  });

  test('maneja correctamente el cambio de año', () => {
    const birthDate = new Date('2024-12-31');
    const currentDate = new Date('2025-01-01');
    const age = calculateDecimalAge(birthDate, currentDate);
    expect(age).toBeCloseTo(0.003, 2); // Aproximadamente 1 día
  });

  test('usa la fecha actual si no se proporciona fecha actual', () => {
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - 20); // 20 años atrás
    const age = calculateDecimalAge(birthDate);
    expect(age).toBeGreaterThan(19.99);
    expect(age).toBeLessThan(20.01);
  });

  test('maneja fechas en el límite del rango de Date', () => {
    const veryOldDate = new Date('1900-01-01');
    const age = calculateDecimalAge(veryOldDate, fixedCurrentDate);
    expect(age).toBeGreaterThan(0);
  });
});