"use client";

import { Modelo2Componentes, Resultados2Componentes } from "@/lib/composicionCorporal2Componentes";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface BodyCompositionExpressChartProps {
  resultados?: Resultados2Componentes;
}

// Colores fijos para PDF/consistencia visual
const COLORS = {
  masaMuscular: "#3B82F6", // Blue-500
  masaAdiposa: "#EF4444",  // Red-500
};

const componentLabels: Record<keyof Resultados2Componentes, string> = {
  masaMuscular: "Masa Muscular",
  masaAdiposa: "Masa Adiposa",
  zAdiposa: "Z-Score Adiposa",
};

const CustomTooltipContent = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const { name, value, porcentaje } = data;
    return (
      <div className="p-2 bg-background border border-border rounded-md shadow-lg text-xs">
        <p className="font-semibold">{componentLabels[name as keyof typeof componentLabels] || name}</p>
        <p>Masa: {typeof value === "number" ? value.toFixed(2) : "N/A"} kg</p>
        {porcentaje !== undefined && <p>Porcentaje: {typeof porcentaje === "number" ? porcentaje.toFixed(2) : "N/A"} %</p>}
      </div>
    );
  }
  return null;
};

export default function BodyCompositionExpressChart({ resultados }: BodyCompositionExpressChartProps) {
  if (!resultados) {
    return <p className="text-sm text-muted-foreground">Datos de composición no disponibles.</p>;
  }

  // Generamos los datos del gráfico
  const total = (resultados.masaMuscular ?? 0) + (resultados.masaAdiposa ?? 0);
  const chartData = [
    {
      name: "masaMuscular",
      value: resultados.masaMuscular ?? 0,
      porcentaje: total > 0 ? ((resultados.masaMuscular ?? 0) / total) * 100 : 0,
      fill: COLORS.masaMuscular,
    },
    {
      name: "masaAdiposa",
      value: resultados.masaAdiposa ?? 0,
      porcentaje: total > 0 ? ((resultados.masaAdiposa ?? 0) / total) * 100 : 0,
      fill: COLORS.masaAdiposa,
    },
  ];

  if (chartData.every(d => d.value === 0)) {
    return <p className="text-sm text-muted-foreground">No hay datos válidos con masa positiva para mostrar en el gráfico.</p>;
  }

  const renderLegendText = (value: string, entry: any) => {
    const { payload } = entry;
    const label = componentLabels[payload.name as keyof typeof componentLabels] || payload.name;
    const percentage = typeof payload.porcentaje === "number" ? `(${payload.porcentaje.toFixed(2)}%)` : "";
    return <span style={{ color: "#374151" }} className="text-xs">{label} {percentage}</span>;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          dataKey="value"
          nameKey="name"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltipContent />} />
        <Legend
          formatter={renderLegendText}
          wrapperStyle={{ fontSize: "10px", paddingTop: "10px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
