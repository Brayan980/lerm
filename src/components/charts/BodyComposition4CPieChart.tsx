"use client";

import type { Resultados4Componentes } from "@/lib/medidas4Componentes";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BodyComposition4CPieChartProps {
  data4C: Resultados4Componentes | undefined;
}

// Colores específicos para el modelo de 4 componentes
const COLORS_4C = {
  masaMuscular: "#3B82F6",   // Blue-500
  masaOsea: "#10B981",       // Emerald-500
  masaAdiposa: "#EF4444",    // Red-500
  masaResidual: "#6B7280",   // Gray-500
};

const componentLabels4C: Record<string, string> = {
  masaMuscular: "Masa Muscular",
  masaOsea: "Masa Ósea",
  masaAdiposa: "Masa Adiposa",
  masaResidual: "Masa Residual",
};

interface ChartDataItem {
  name: string;
  value: number;
  porcentaje: number;
  fill: string;
  label: string;
}

const CustomTooltipContent4C = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data: ChartDataItem = payload[0].payload;
    const { label, value, porcentaje } = data;
    return (
      <div className="p-2 bg-background border border-border rounded-md shadow-lg text-xs">
        <p className="font-semibold">{label}</p>
        <p>Masa: {value.toFixed(2)} kg</p>
        <p>Porcentaje: {porcentaje.toFixed(2)} %</p>
      </div>
    );
  }
  return null;
};

const renderLegendText4C = (value: string, entry: any) => {
  const { payload } = entry;
  const percentage = typeof payload.porcentaje === 'number' ? `(${payload.porcentaje.toFixed(2)}%)` : '';
  return (
    <span style={{ color: '#374151' }} className="text-xs">
      {payload.label} {percentage}
    </span>
  );
};

export default function BodyComposition4CPieChart({ data4C }: BodyComposition4CPieChartProps) {
  if (!data4C) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Composición Corporal - 4 Componentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Datos de composición de 4 componentes no disponibles.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Construir datos del gráfico
  const chartData: ChartDataItem[] = [];

  if (data4C.masaMuscular != null && data4C.porcentajeMuscular != null && data4C.masaMuscular > 0) {
    chartData.push({
      name: 'masaMuscular',
      value: data4C.masaMuscular,
      porcentaje: data4C.porcentajeMuscular,
      fill: COLORS_4C.masaMuscular,
      label: componentLabels4C.masaMuscular,
    });
  }

  if (data4C.masaOsea != null && data4C.porcentajeOsea != null && data4C.masaOsea > 0) {
    chartData.push({
      name: 'masaOsea',
      value: data4C.masaOsea,
      porcentaje: data4C.porcentajeOsea,
      fill: COLORS_4C.masaOsea,
      label: componentLabels4C.masaOsea,
    });
  }

  if (data4C.masaAdiposa != null && data4C.porcentajeAdiposa != null && data4C.masaAdiposa > 0) {
    chartData.push({
      name: 'masaAdiposa',
      value: data4C.masaAdiposa,
      porcentaje: data4C.porcentajeAdiposa,
      fill: COLORS_4C.masaAdiposa,
      label: componentLabels4C.masaAdiposa,
    });
  }

  if (data4C.masaResidual != null && data4C.porcentajeResidual != null && data4C.masaResidual > 0) {
    chartData.push({
      name: 'masaResidual',
      value: data4C.masaResidual,
      porcentaje: data4C.porcentajeResidual,
      fill: COLORS_4C.masaResidual,
      label: componentLabels4C.masaResidual,
    });
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Composición Corporal - 4 Componentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hay datos válidos con masa positiva para mostrar en el gráfico.
          </p>
        </CardContent>
      </Card>
    );
  }

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
        <Tooltip content={<CustomTooltipContent4C />} />
        <Legend
          formatter={renderLegendText4C}
          wrapperStyle={{ fontSize: "10px", paddingTop: "10px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}