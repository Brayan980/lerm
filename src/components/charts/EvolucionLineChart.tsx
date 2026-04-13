"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Label,
    ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface EvolucionLineChartProps {
    nombre: string;
    datos: { fecha: string; valor: number }[];
}

export default function EvolucionLineChart({ nombre, datos }: EvolucionLineChartProps) {
    if (!datos || datos.length === 0) return null;

    // 🔹 Convertir fechas a meses abreviados
    const datosConMes = datos.map((d) => {
        const fecha = new Date(d.fecha);
        const mes = fecha.toLocaleString("es-ES", { month: "short" });
        return { ...d, mes: mes.charAt(0).toUpperCase() + mes.slice(1) };
    });

    return (
        <Card className="shadow-md col-span-full">
            <CardHeader>
                <CardTitle className="text-lg text-blue-600 text-center">
                    Tendencia del pliegue: {nombre}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={datosConMes}
                            margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="mes">
                                <Label
                                    value="Mes"
                                    offset={-5}
                                    position="insideBottom"
                                    style={{
                                        textAnchor: "middle",
                                        fill: "#374151",
                                        fontSize: 12,
                                    }}
                                />
                            </XAxis>
                            <YAxis>
                                <Label
                                    value="Valor"
                                    angle={-90}
                                    position="insideLeft"
                                    style={{
                                        textAnchor: "middle",
                                        fill: "#374151",
                                        fontSize: 12,
                                    }}
                                />
                            </YAxis>
                            <Tooltip
                                formatter={(v: number) => [`${v}`, "Valor"]}
                                labelFormatter={(l) => `Mes: ${l}`}
                            />
                            <Line
                                type="linear"
                                dataKey="valor"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                dot={{ r: 4, fill: "#3B82F6" }}
                                activeDot={{ r: 6, stroke: "#2563EB", strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
