"use client";

interface StatsRow {
  count: number;
  sum: number;
  mean: number;
  median: number;
  mode: number | null;
  min: number;
  max: number;
  range: number;
  variance: number;
  stdDeviation: number;
  standardError: number;
  skewness: number;
  kurtosis: number;
  percentile25: number;
  percentile50: number;
  percentile75: number;
}

export default function StatisticsTable({ statistics }: { statistics: Record<string, StatsRow> }) {
  if (!statistics || Object.keys(statistics).length === 0) {
    return <p className="text-sm text-gray-500 mt-4">No hay datos estadísticos disponibles.</p>;
  }

  const rows = Object.entries(statistics);

  return (
    <div className="overflow-auto mt-6">
      <table className="min-w-max text-xs border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">Variable</th>
            <th className="border p-2">Cantidad</th>
            <th className="border p-2">Suma</th>
            <th className="border p-2">Media</th>
            <th className="border p-2">Mediana</th>
            <th className="border p-2">Moda</th>
            <th className="border p-2">Min</th>
            <th className="border p-2">Max</th>
            <th className="border p-2">Rango</th>
            <th className="border p-2">Varianza</th>
            <th className="border p-2">Desviacion est.</th>
            <th className="border p-2">Error est.</th>
            <th className="border p-2">Asimetría</th>
            <th className="border p-2">Curtosis</th>
            <th className="border p-2">Percentil 25</th>
            <th className="border p-2">Percentil 50</th>
            <th className="border p-2">Percentil 75</th>
          </tr>
        </thead>

        <tbody>
          {rows.map(([variable, stats]) => (
            <tr key={variable}>
              <td className="border p-2 font-semibold">{variable}</td>
              <td className="border p-2 text-center">{stats.count}</td>
              <td className="border p-2 text-center">{stats.sum.toFixed(2)}</td>
              <td className="border p-2 text-center">{stats.mean.toFixed(2)}</td>
              <td className="border p-2 text-center">{stats.median.toFixed(2)}</td>
              <td className="border p-2 text-center">{stats.mode ?? "—"}</td>
              <td className="border p-2 text-center">{stats.min.toFixed(2)}</td>
              <td className="border p-2 text-center">{stats.max.toFixed(2)}</td>
              <td className="border p-2 text-center">{stats.range.toFixed(2)}</td>
              <td className="border p-2 text-center">{stats.variance.toFixed(5)}</td>
              <td className="border p-2 text-center">{stats.stdDeviation.toFixed(5)}</td>
              <td className="border p-2 text-center">{stats.standardError.toFixed(5)}</td>
              <td className="border p-2 text-center">{isNaN(stats.skewness) ? "—" : stats.skewness.toFixed(5)}</td>
              <td className="border p-2 text-center">{isNaN(stats.kurtosis) ? "—" : stats.kurtosis.toFixed(5)}</td>
              <td className="border p-2 text-center">{stats.percentile25.toFixed(2)}</td>
              <td className="border p-2 text-center">{stats.percentile50.toFixed(2)}</td>
              <td className="border p-2 text-center">{stats.percentile75.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
