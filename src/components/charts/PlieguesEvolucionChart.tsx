"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface PlieguesEvolucionChartProps {
  data: Record<string, { fecha: string; valor: number }[]>;
}

export default function PlieguesEvolucionChart({ data }: PlieguesEvolucionChartProps) {
  // 🔹 Obtener todas las fechas únicas (ordenadas)
  const fechasUnicas = Array.from(
    new Set(Object.values(data).flatMap((arr) => arr.map((item) => item.fecha)))
  ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // 🔹 Convertir los datos al formato que Recharts necesita
  const chartData = fechasUnicas.map((fecha) => {
    const fila: Record<string, any> = { fecha };
    Object.entries(data).forEach(([pliegue, valores]) => {
      const registro = valores.find((v) => v.fecha === fecha);
      if (registro) fila[pliegue] = registro.valor;
    });
    return fila;
  });

  // 🎨 Paleta de colores consistente
  const colors = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
    "#8B5CF6", "#EC4899", "#14B8A6", "#F97316", "#64748B",
  ];

  return (
    <div className="p-4 bg-white rounded-2xl shadow">
      <h2 className="text-lg font-semibold text-center mb-4 text-blue-700">
        Evolución general de pliegues
      </h2>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 20, right: 20, left: 0, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="fecha"
            tickFormatter={(fecha) =>
              new Date(fecha).toLocaleString("es-ES", { month: "short" })
            }
          />
          <YAxis />
          <Tooltip
            labelFormatter={(fecha) =>
              new Date(fecha).toLocaleDateString("es-ES", {
                month: "long",
                year: "numeric",
              })
            }
          />
          <Legend />

          {Object.keys(data).map((pliegue, index) => (
            <Line
              key={pliegue}
              type="linear" // ← mantiene líneas rectas
              dataKey={pliegue}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
