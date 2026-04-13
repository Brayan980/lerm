"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ArrowLeft, CheckCircle, Circle, Search } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useEvaluationContext } from "@/contexts/EvaluationContext";
import { EvaluationRecord } from "@/lib/types";
import { getPliegues } from "@/lib/etmCalcultation";
import EvolucionChart from "@/components/charts/EvolucionChart";
import AuthWrapper from "@/components/auth/AuthWrapper";
import EvolucionLineChart from "@/components/charts/EvolucionLineChart";
import PlieguesEvolucionChart from "@/components/charts/PlieguesEvolucionChart";
import { useRouter } from "next/navigation";

export default function EvolucionPlieguesPage() {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [selectedPliegue, setSelectedPliegue] = useState<string | null>(null);

    const [showResults, setShowResults] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const { evaluationRecords, fetchRecords } = useEvaluationContext();
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
        );
    };

    const filteredRecords = useMemo(() => {
        return evaluationRecords
            .filter((record) => {
                const nombre = `${record.participantData?.first_name ?? ""} ${record.participantData?.last_name ?? ""}`.toLowerCase();
                const cumpleBusqueda =
                    record.status === "Completada" && !record.evaluation_mode?.startsWith("2C") &&
                    (nombre.includes(searchTerm.toLowerCase()) ||
                        (record.participantData?.id_number ?? "").includes(searchTerm));
                const fecha = new Date(record.updated_at!);
                let cumpleFechas = true;

                if (fromDate) {
                    const desde = new Date(fromDate);
                    desde.setHours(0, 0, 0, 0);
                    cumpleFechas = cumpleFechas && fecha >= desde;
                }
                if (toDate) {
                    const hasta = new Date(toDate);
                    hasta.setHours(23, 59, 59, 999);
                    cumpleFechas = cumpleFechas && fecha <= hasta;
                }

                return cumpleBusqueda && cumpleFechas;
            })
            .sort(
                (a, b) =>
                    new Date(a.updated_at!).getTime() -
                    new Date(b.updated_at!).getTime()
            );
    }, [evaluationRecords, searchTerm, fromDate, toDate]);

    const selectedRecords = useMemo(
        () => filteredRecords.filter((r) => selectedIds.includes(r.id)),
        [filteredRecords, selectedIds]
    );

    // 🔹 Construir los datos de evolución por pliegue
    const plieguesEvolucion = useMemo(() => {
        const map: Record<string, { fecha: string; valor: number }[]> = {};

        selectedRecords.forEach((record) => {
            const pliegues = getPliegues(record);
            const fecha = record.updated_at?.split("T")[0] ?? "";

            if (!pliegues) return;

            // Cada entrada: nombre del pliegue → valores (m1, m2, m3)
            Object.entries(pliegues).forEach(([pliegueNombre, mediciones]) => {
                const { m1, m2, m3 } = mediciones as any;
                // Valor final = promedio de mediciones válidas
                const valores = [m1, m2, m3].filter((v) => v != null);
                if (valores.length === 0) return;

                const valorFinal =
                    valores.reduce((a, b) => a + b, 0) / valores.length;

                if (!map[pliegueNombre]) map[pliegueNombre] = [];
                map[pliegueNombre].push({ fecha, valor: valorFinal });
            });
        });

        // ordenar cada pliegue por fecha
        Object.values(map).forEach((arr) =>
            arr.sort(
                (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
            )
        );

        return map;
    }, [selectedRecords]);


    return (
        <AuthWrapper allowedRoles={["Evaluator"]}>
            <div className="space-y-6">

            <Button variant="outline" size="sm" onClick={() => router.push('/dashboard')} className="
        mb-4 print:hidden 
        border-pink-400 
        text-pink-600 
        hover:bg-pink-500 
        hover:text-white 
        hover:border-pink-600
        transition-all duration-200
    "
            >
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
            </Button>

                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-blue-700 text-2xl">
                            Evolución de Pliegues
                        </CardTitle>
                        <CardDescription>
                            Selecciona las evaluaciones de un participante para ver cómo evolucionaron los valores de sus pliegues cutáneos.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {/* 🔹 Filtros */}
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 flex-wrap">
                            <div className="flex flex-col sm:flex-row items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Buscar participante..."
                                        className="pl-8 w-[250px] lg:w-[300px]"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-600">Desde:</label>
                                    <Input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className="w-[160px]"
                                    />
                                </div>

                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-gray-600">Hasta:</label>
                                    <Input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="w-[160px]"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="text-sm text-muted-foreground">
                                    Seleccionadas: <strong>{selectedIds.length}</strong>
                                </div>

                                <Button
                                    onClick={() => {
                                        if (selectedIds.length === 0) {
                                            toast({
                                                title: "Selecciona al menos una evaluación",
                                                variant: "destructive",
                                            });
                                            return;
                                        }
                                        setShowResults(true);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    Mostrar evolución
                                </Button>

                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedIds([]);
                                        setShowResults(false);
                                        setSearchTerm("");
                                        setFromDate("");
                                        setToDate("");
                                    }}
                                    className="border-gray-300 hover:bg-gray-100"
                                >
                                    Limpiar
                                </Button>
                            </div>
                        </div>

                        {/* Tabla de evaluaciones */}
                        {searchTerm.trim() === "" ? (
                            <div className="text-center text-gray-500 py-8 italic">
                                Escribe el nombre o documento de un participante para ver sus evaluaciones.
                            </div>
                        ) : filteredRecords.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Participante</TableHead>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Tipo Formulario</TableHead>
                                        <TableHead>Perfil</TableHead>
                                        <TableHead className="text-right">Seleccionar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredRecords.map((record) => (
                                        <TableRow
                                            key={record.id}
                                            onClick={() => toggleSelect(record.id)}
                                            className={`cursor-pointer transition ${selectedIds.includes(record.id)
                                                ? "bg-blue-100"
                                                : "hover:bg-gray-50"
                                                }`}
                                        >
                                            <TableCell>
                                                {record.participantData?.first_name}{" "}
                                                {record.participantData?.last_name}
                                            </TableCell>
                                            <TableCell>{record.updated_at!.split("T")[0]}</TableCell>
                                            <TableCell>{record.form_type}</TableCell>
                                            <TableCell>{record.evaluation_mode}</TableCell>
                                            <TableCell className="text-right">
                                                {selectedIds.includes(record.id) ? (
                                                    <CheckCircle className="text-blue-600 inline-block" />
                                                ) : (
                                                    <Circle className="text-gray-300 inline-block" />
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center text-gray-500 py-8 italic">
                                No se encontraron evaluaciones que coincidan con la búsqueda.
                            </div>
                        )}

                    </CardContent>
                </Card>

                <PlieguesEvolucionChart data={plieguesEvolucion} />


                {showResults && Object.keys(plieguesEvolucion).length > 0 && (
                    <div className="space-y-8">
                        {/* 🔹 Selector de pliegue */}
                        <div className="flex flex-wrap items-center gap-3">
                            <label className="text-gray-700 font-medium">Selecciona un pliegue:</label>
                            <select
                                className="border rounded-md px-3 py-2 text-sm"
                                value={selectedPliegue ?? ""}
                                onChange={(e) =>
                                    setSelectedPliegue(e.target.value || null)
                                }
                            >
                                <option value="">-- Selecciona --</option>
                                {Object.keys(plieguesEvolucion).map((pliegue) => (
                                    <option key={pliegue} value={pliegue}>
                                        {pliegue}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 🔹 Gráfica principal (línea de tendencia del pliegue elegido) */}
                        {selectedPliegue && (
                            <EvolucionLineChart
                                nombre={selectedPliegue}
                                datos={plieguesEvolucion[selectedPliegue] ?? []}
                            />
                        )}
                    </div>
                )}

            </div>
        </AuthWrapper>
    );
}
