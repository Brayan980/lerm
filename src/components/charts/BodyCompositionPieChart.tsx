
"use client";

import type { KerrBodyComposition } from "@/lib/types";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BodyCompositionPieChartProps {
  kerrData: KerrBodyComposition | undefined;
}

// Updated to hardcoded hex colors for testing PDF generation
const COLORS_PDF_TEST = {
  masaMuscular: "#3B82F6",   // Blue-500
  masaAdiposa: "#EF4444",    // Red-500
  masaOsea: "#10B981",       // Emerald-500
  masaPiel: "#F97316",       // Orange-500
  masaResidual: "#6B7280",   // Gray-500
};

const componentLabels: Record<keyof Omit<KerrBodyComposition, 'masaTotalKg'>, string> = {
  masaMuscular: "Masa Muscular",
  masaAdiposa: "Masa Adiposa",
  masaOsea: "Masa Ósea",
  masaPiel: "Masa Piel",
  masaResidual: "Masa Residual",
};

const CustomTooltipContent = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const { name, value, porcentaje } = data; // name is componentKey, value is masaKg
    return (
      <div className="p-2 bg-background border border-border rounded-md shadow-lg text-xs">
        <p className="font-semibold">{componentLabels[name as keyof typeof componentLabels] || name}</p>
        <p>Masa: {typeof value === 'number' ? value.toFixed(2) : 'N/A'} kg</p>
        <p>Porcentaje: {typeof porcentaje === 'number' ? porcentaje.toFixed(2) : 'N/A'} %</p>
      </div>
    );
  }
  return null;
};

export default function BodyCompositionPieChart({ kerrData }: BodyCompositionPieChartProps) {
  if (!kerrData) {
    return <p className="text-sm text-muted-foreground">Datos de composición de 5 componentes no disponibles.</p>;
  }

  const chartData = Object.entries(kerrData)
    .filter(([key, value]) => key !== 'masaTotalKg' && value && typeof value.masaKg === 'number' && value.masaKg > 0) // Ensure masaKg is a positive number
    .map(([key, value]) => ({
      name: key as keyof Omit<KerrBodyComposition, 'masaTotalKg'>,
      value: value.masaKg,
      porcentaje: value.porcentaje,
      fill: COLORS_PDF_TEST[key as keyof typeof COLORS_PDF_TEST] || '#8884d8', // Use test colors
    }));

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay datos válidos con masa positiva para mostrar en el gráfico.</p>;
  }

  const renderLegendText = (value: string, entry: any) => {
    const { payload } = entry;
    const label = componentLabels[payload.name as keyof typeof componentLabels] || payload.name;
    const percentage = typeof payload.porcentaje === 'number' ? `(${payload.porcentaje.toFixed(2)}%)` : '';
    // Use a direct color for legend text for PDF testing
    return <span style={{ color: '#374151' }} className="text-xs">{label} {percentage}</span>; // Gray-700 for legend text
  };


  return (
    <ResponsiveContainer width="100%" height={350}>
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
          wrapperStyle={{fontSize: "10px", paddingTop: "10px"}}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
