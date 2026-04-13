
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
import {
    calcularETM,
    getClosestTwo,
    getPliegues
} from "@/lib/etmCalcultation";

import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useEvaluationContext } from "@/contexts/EvaluationContext";
import { EvaluationRecord } from "@/lib/types";
import React from "react";

// Tipo union para manejar pliegues de diferentes formularios
type PlieguesCutaneosUnion = {
    triceps?: { m1?: number | null; m2?: number | null; m3?: number | null };
    subescapular?: { m1?: number | null; m2?: number | null; m3?: number | null };
    biceps?: { m1?: number | null; m2?: number | null; m3?: number | null };
    cresta_iliaca?: { m1?: number | null; m2?: number | null; m3?: number | null };
    supraespinal?: { m1?: number | null; m2?: number | null; m3?: number | null };
    abdominal?: { m1?: number | null; m2?: number | null; m3?: number | null };
    muslo?: { m1?: number | null; m2?: number | null; m3?: number | null };
    pierna_pliegue?: { m1?: number | null; m2?: number | null; m3?: number | null };
};

export default function ETMPage() {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const { selectedRole } = useAuth();
    const { evaluationRecords, fetchRecords } = useEvaluationContext();
    const router = useRouter();
    const { toast } = useToast();

    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [etmResults, setEtmResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);

    // 🔹 Nuevos estados para los filtros de fecha
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");

    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
        );
    };

    const handleRefresh = () => {
        setIsLoading(true);
        fetchRecords();
        setTimeout(() => setIsLoading(false), 500);
    };

    const handleCalcularETM = () => {
        const resultados = calcularETM(selectedRecords);
        setEtmResults(resultados);
        setShowResults(true);

        toast({
            title: "ETM Calculado",
            description: `Se calculó el ETM para ${selectedIds.length} evaluaciones.`,
        });
    };

    const selectedRecords = useMemo(
        () => evaluationRecords.filter((r) => selectedIds.includes(r.id)),
        [evaluationRecords, selectedIds]
    );

    // 🔹 Construir tabla de pliegues
    const plieguesData = useMemo(() => {


        return selectedRecords.map((record) => ({
            participante: `${record.participantData?.first_name ?? ""} ${record.participantData?.last_name ?? ""}`,
            pliegues: getPliegues(record)
        }));


    }, [selectedRecords]);


    // 🔹 Filtro por búsqueda y por fechas (usando `updated_at`)
    const filteredRecords = useMemo(() => {
        return evaluationRecords
            .filter((record) => {
                const nombre = `${record.participantData?.first_name ?? ""} ${record.participantData?.last_name ?? ""
                    }`.toLowerCase();

                const cumpleBusqueda =
                    record.status === "Completada" && !record.evaluation_mode?.startsWith("2C") &&
                    (nombre.includes(searchTerm.toLowerCase()) ||
                        (record.participantData?.id_number ?? "").includes(searchTerm) ||
                        (record.form_type ?? "")
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()));


                const fechaActualizacion = new Date(record.updated_at!);
                let cumpleFechas = true;

                if (fromDate) {
                    const desde = new Date(fromDate);
                    desde.setHours(0, 0, 0, 0);
                    cumpleFechas = cumpleFechas && fechaActualizacion >= desde;
                }

                if (toDate) {
                    // Incluye todo el día "hasta"
                    const hasta = new Date(toDate);
                    hasta.setHours(23, 59, 59, 999);

                    cumpleFechas = cumpleFechas && fechaActualizacion <= hasta;
                }


                return cumpleBusqueda && cumpleFechas;
            })
            .sort(
                (a, b) =>
                    new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime()
            );
    }, [evaluationRecords, searchTerm, fromDate, toDate]);

    return (
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
                        Selección de Evaluaciones
                    </CardTitle>
                    <CardDescription>
                        Haz clic en una fila o en el ícono de la derecha para seleccionar las
                        evaluaciones que se usarán en el cálculo del ETM.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {/* 🔹 Filtros (Búsqueda + Fechas) */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 flex-wrap">
                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Buscar en completadas..."
                                    className="pl-8 w-[250px] lg:w-[300px]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* 🔹 Campos de fecha */}
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

                        {/* <div className="flex items-center gap-3">
                            <div className="text-sm text-muted-foreground">
                                Seleccionadas: <strong>{selectedIds.length}</strong>
                            </div>
                            <Button
                                onClick={handleCalcularETM}
                                disabled={selectedIds.length < 2}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Calcular ETM
                            </Button>
                        </div> */}

                        <div className="flex items-center gap-3">
                            <div className="text-sm text-muted-foreground">
                                Seleccionadas: <strong>{selectedIds.length}</strong>
                            </div>

                            <Button
                                onClick={handleCalcularETM}
                                disabled={selectedIds.length < 2}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Calcular ETM
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSelectedIds([]);
                                    setEtmResults([]);
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

                    {/* Tabla principal */}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {/* <TableHead>ID</TableHead> */}
                                <TableHead>Participante</TableHead>
                                <TableHead>Última actualización</TableHead>
                                <TableHead>Tipo Formulario</TableHead>
                                <TableHead>Resultados</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {filteredRecords.length > 0 ? (
                                filteredRecords.map((record) => (
                                    <TableRow
                                        key={record.id}
                                        className={`cursor-pointer transition ${selectedIds.includes(record.id)
                                            ? "bg-blue-100"
                                            : "hover:bg-gray-50"
                                            }`}
                                        onClick={() => toggleSelect(record.id)}
                                    >
                                        {/* <TableCell className="font-mono text-xs text-muted-foreground">
                                            {record.id}
                                        </TableCell> */}
                                        <TableCell>
                                            {record.participantData?.first_name}{" "}
                                            {record.participantData?.last_name}
                                        </TableCell>
                                        <TableCell>
                                            {record.updated_at!.split("T")[0]}
                                        </TableCell>
                                        <TableCell>{record.form_type}</TableCell>
                                        <TableCell className="text-xs">
                                            {record.evaluation_mode ? (
                                                <Badge variant="outline">{record.evaluation_mode}</Badge>
                                            ) : (
                                                <span className="text-muted-foreground">N/A</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {selectedIds.includes(record.id) ? (
                                                <CheckCircle className="text-blue-600 inline-block" />
                                            ) : (
                                                <Circle className="text-gray-300 inline-block" />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-center text-muted-foreground py-8"
                                    >
                                        {evaluationRecords.filter(
                                            (r) => r.status === "Completada"
                                        ).length === 0
                                            ? "No hay evaluaciones completadas."
                                            : "No hay evaluaciones que coincidan con tu búsqueda o rango de fechas."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>



                    {/* 🔹 Segunda tabla: Pliegues de los seleccionados */}
                    {selectedIds.length > 0 && (
                        <div className="mt-10">
                            <h3 className="text-lg font-semibold text-blue-700 mb-4">
                                Datos de los Participantes Seleccionados
                            </h3>

                            <Table>
                                <TableHeader className="">
                                    {/* Primera fila: nombres de los pliegues */}
                                    <TableRow className="bg-blue-700 hover:bg-blue-700">
                                        <TableHead rowSpan={2} className="text-white font-semibold border-r border-blue-600">Participante</TableHead>
                                        <TableHead colSpan={2} className="text-white text-center font-semibold border-r border-blue-600">Tríceps</TableHead>
                                        <TableHead colSpan={2} className="text-white text-center font-semibold border-r border-blue-600">Subescapular</TableHead>
                                        <TableHead colSpan={2} className="text-white text-center font-semibold border-r border-blue-600">Bíceps</TableHead>
                                        <TableHead colSpan={2} className="text-white text-center font-semibold border-r border-blue-600">Cresta ilíaca</TableHead>
                                        <TableHead colSpan={2} className="text-white text-center font-semibold border-r border-blue-600">Supraespinal</TableHead>
                                        <TableHead colSpan={2} className="text-white text-center font-semibold border-r border-blue-600">Abdominal</TableHead>
                                        <TableHead colSpan={2} className="text-white text-center font-semibold border-r border-blue-600">Muslo anterior</TableHead>
                                        <TableHead colSpan={2} className="text-white text-center font-semibold">Pierna medial</TableHead>
                                    </TableRow>

                                    {/* Segunda fila: M1 / M2 */}
                                    <TableRow className="bg-blue-600 hover:bg-blue-600">
                                        {Array(8).fill(null).map((_, i) => (
                                            <React.Fragment key={i}>
                                                <TableHead className="text-white text-center text-xs">M1 (mm)</TableHead>
                                                <TableHead className={`text-white text-center text-xs ${i < 7 ? 'border-r border-blue-500' : ''}`}>M2 (mm)</TableHead>
                                            </React.Fragment>
                                        ))}
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {plieguesData.map((item, idx) => {
                                        const p = item.pliegues;

                                        const { m1: triceps1, m2: triceps2 } = getClosestTwo(p?.triceps?.m1, p?.triceps?.m2, p?.triceps?.m3);
                                        const { m1: sub1, m2: sub2 } = getClosestTwo(p?.subescapular?.m1, p?.subescapular?.m2, p?.subescapular?.m3);
                                        const { m1: biceps1, m2: biceps2 } = getClosestTwo(p?.biceps?.m1, p?.biceps?.m2, p?.biceps?.m3);
                                        const { m1: crest1, m2: crest2 } = getClosestTwo(p?.cresta_iliaca?.m1, p?.cresta_iliaca?.m2, p?.cresta_iliaca?.m3);
                                        const { m1: supra1, m2: supra2 } = getClosestTwo(p?.supraespinal?.m1, p?.supraespinal?.m2, p?.supraespinal?.m3);
                                        const { m1: abdo1, m2: abdo2 } = getClosestTwo(p?.abdominal?.m1, p?.abdominal?.m2, p?.abdominal?.m3);
                                        const { m1: muslo1, m2: muslo2 } = getClosestTwo(p?.muslo?.m1, p?.muslo?.m2, p?.muslo?.m3);
                                        const { m1: pierna1, m2: pierna2 } = getClosestTwo(p?.pierna_pliegue?.m1, p?.pierna_pliegue?.m2, p?.pierna_pliegue?.m3);

                                        return (
                                            <TableRow key={item.participante} className={idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}>
                                                <TableCell className="font-semibold text-blue-900 border-r border-gray-200">{item.participante}</TableCell>
                                                <TableCell className="text-center">{triceps1 ?? "-"}</TableCell>
                                                <TableCell className="text-center border-r border-gray-200">{triceps2 ?? "-"}</TableCell>
                                                <TableCell className="text-center">{sub1 ?? "-"}</TableCell>
                                                <TableCell className="text-center border-r border-gray-200">{sub2 ?? "-"}</TableCell>
                                                <TableCell className="text-center">{biceps1 ?? "-"}</TableCell>
                                                <TableCell className="text-center border-r border-gray-200">{biceps2 ?? "-"}</TableCell>
                                                <TableCell className="text-center">{crest1 ?? "-"}</TableCell>
                                                <TableCell className="text-center border-r border-gray-200">{crest2 ?? "-"}</TableCell>
                                                <TableCell className="text-center">{supra1 ?? "-"}</TableCell>
                                                <TableCell className="text-center border-r border-gray-200">{supra2 ?? "-"}</TableCell>
                                                <TableCell className="text-center">{abdo1 ?? "-"}</TableCell>
                                                <TableCell className="text-center border-r border-gray-200">{abdo2 ?? "-"}</TableCell>
                                                <TableCell className="text-center">{muslo1 ?? "-"}</TableCell>
                                                <TableCell className="text-center border-r border-gray-200">{muslo2 ?? "-"}</TableCell>
                                                <TableCell className="text-center">{pierna1 ?? "-"}</TableCell>
                                                <TableCell className="text-center">{pierna2 ?? "-"}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}



                    {/* 🔹 Tabla de Resultados ETM */}
                    {showResults && etmResults.length > 0 && (
                        <div className="mt-10">
                            <h3 className="text-lg font-semibold text-blue-700 mb-4">
                                Tabla de Resultados por Pliegue
                            </h3>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Pliegue Cutáneo</TableHead>
                                        <TableHead>Participantes Válidos</TableHead>
                                        <TableHead>ETM (mm)</TableHead>
                                        <TableHead>ETM Relativo (%)</TableHead>
                                        <TableHead>Interpretación</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {etmResults.map((resultado, index) => (
                                        <TableRow key={index}>
                                            <TableCell className="font-medium">{resultado.pliegue}</TableCell>
                                            <TableCell>{resultado.participantesValidos}</TableCell>
                                            <TableCell>
                                                {resultado.etm !== null ? (
                                                    <span className="text-blue-600 font-semibold">
                                                        {resultado.etm.toFixed(4)} mm
                                                    </span>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {resultado.etmRelativo !== null ? (
                                                    <span className="text-red-600 font-semibold">
                                                        {resultado.etmRelativo.toFixed(2)} %
                                                    </span>
                                                ) : (
                                                    "-"
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        resultado.interpretacion === "Excelente fiabilidad" ? "default" :
                                                            resultado.interpretacion === "Buena fiabilidad" ? "secondary" :
                                                                resultado.interpretacion === "Fiabilidad moderada" ? "outline" :
                                                                    "destructive"
                                                    }
                                                >
                                                    {resultado.interpretacion}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}