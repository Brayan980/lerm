"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Label,
    ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface EvolucionChartProps {
    nombre: string;
    datos: { fecha: string; valor: number }[];
    color?: string;
}

export default function EvolucionChart({ nombre, datos, color }: EvolucionChartProps) {
    // 🔹 Transformamos la fecha para mostrar solo el mes abreviado (Ene, Feb, Mar, etc.)
    const datosConMes = datos.map((d) => {
        const fecha = new Date(d.fecha);
        const mes = fecha.toLocaleString("es-ES", { month: "short" }); // ejemplo: "ene", "feb", "mar"
        return { ...d, mes: mes.charAt(0).toUpperCase() + mes.slice(1) }; // Capitaliza la primera letra
    });

    return (
        <Card className="shadow-md">
            <CardHeader>
                <CardTitle className="text-lg text-blue-600 text-center">{nombre}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={datosConMes}
                            barSize={40} // 🔹 más delgadas
                            barCategoryGap="40%"
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
                                formatter={(value: number) => [`${value}`, "Valor"]}
                                labelFormatter={(label: string) => `Mes: ${label}`}
                            />
                            <Bar
                                dataKey="valor"
                                name={nombre}
                                fill={color ?? "#3B82F6"}
                                radius={[6, 6, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
