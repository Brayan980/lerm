// statisticsUtils.ts

/**
 * Limpia el array y solo devuelve valores numéricos válidos
 */
export const cleanNumbers = (values: any[]): number[] =>
  values.filter((n) => typeof n === "number" && !isNaN(n));

/**
 * Suma
 */
export const sum = (values: number[]): number =>
  values.reduce((a, b) => a + b, 0);

/**
 * Media (promedio)
 */
export const mean = (values: number[]): number => {
  if (values.length === 0) return 0;
  return sum(values) / values.length;
};

/**
 * Mediana
 */
export const median = (values: number[]): number => {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
};

/**
 * Moda
 */
export const mode = (values: number[]): number | null => {
  if (values.length === 0) return null;

  const freq: Record<number, number> = {};
  values.forEach((v) => (freq[v] = (freq[v] || 0) + 1));

  let maxFreq = 0;
  let moda: number | null = null;

  Object.entries(freq).forEach(([value, count]) => {
    if (count > maxFreq) {
      maxFreq = count;
      moda = Number(value);
    }
  });

  return moda;
};

/**
 * Varianza
 */
export const variance = (values: number[]): number => {
  if (values.length === 0) return 0;

  const m = mean(values);
  return (
    values.reduce((acc, val) => acc + Math.pow(val - m, 2), 0) /
    values.length
  );
};

/**
 * Desviación estándar
 */
export const stdDeviation = (values: number[]): number =>
  Math.sqrt(variance(values));

/**
 * Error típico (Standard Error)
 */
export const standardError = (values: number[]): number => {
  if (values.length === 0) return 0;
  return stdDeviation(values) / Math.sqrt(values.length);
};

/**
 * Percentil
 */
export const percentile = (values: number[], p: number): number => {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);

  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sorted[lower];

  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
};

/**
 * Asimetría (skewness) — Fisher-Pearson
 */
export const skewness = (values: number[]): number => {
  if (values.length < 2) return 0;

  const m = mean(values);
  const sd = stdDeviation(values);
  if (sd === 0) return 0;

  const n = values.length;
  const sumCubed = values.reduce(
    (acc, val) => acc + Math.pow(val - m, 3),
    0
  );

  return (n / ((n - 1) * (n - 2))) * (sumCubed / Math.pow(sd, 3));
};

/**
 * Curtosis (kurtosis) — Fisher
 */
export const kurtosis = (values: number[]): number => {
  if (values.length < 2) return 0;

  const m = mean(values);
  const sd = stdDeviation(values);
  if (sd === 0) return 0;

  const n = values.length;
  const sumFourth = values.reduce(
    (acc, val) => acc + Math.pow(val - m, 4),
    0
  );

  // Fisher kurtosis (excess kurtosis)
  return (n * sumFourth) / ((n - 1) * Math.pow(sd, 4)) - 3;
};

/**
 * Empaqueta todas las estadísticas en un solo objeto
 */
export const getStatistics = (rawValues: any[]) => {
  const values = cleanNumbers(rawValues);

  return {
    count: values.length,
    sum: sum(values),
    mean: mean(values),
    median: median(values),
    mode: mode(values),
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
    range: values.length ? Math.max(...values) - Math.min(...values) : 0,
    variance: variance(values),
    stdDeviation: stdDeviation(values),
    standardError: standardError(values),
    skewness: skewness(values),
    kurtosis: kurtosis(values),
    percentile25: percentile(values, 25),
    percentile50: percentile(values, 50), // igual a mediana
    percentile75: percentile(values, 75),
    raw: values
  };
};
