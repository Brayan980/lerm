"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock, MapPin, NotebookPen, Users, Search, X, UserPlus, Mail, Phone, User, ArrowLeft } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { InitialRegistrationData } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

// -------------------
// Tipos
// -------------------
export interface SelectedParticipant {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    idNumber?: string;
}

interface AppointmentSummary {
    fecha: string;
    horario: string;
    ubicacion: string;
    notas: string;
    participantes: SelectedParticipant[];
    totalParticipantes: number;
}

// -------------------
// Página principal
// -------------------
export default function AppointmentPage() {

    const { username } = useAuth(); // Este es el email unico de cada usuario
    const router = useRouter();

    // buscar el id del usuario actual en la base de datos si es necesario

    // -------------------
    // Estados
    // -------------------

    const [participants, setParticipants] = useState<InitialRegistrationData[]>([]);
    const [isLoadingParticipants, setIsLoadingParticipants] = useState(true);
    const [estadoSalas, setEstadoSalas] = useState({
        salaA: { estado: "LIBRE", hora: null as string | null },
        salaB: { estado: "LIBRE", hora: null as string | null },
    });

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedParticipants, setSelectedParticipants] = useState<SelectedParticipant[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [showSummaryDialog, setShowSummaryDialog] = useState(false);
    const [appointmentSummary, setAppointmentSummary] = useState<AppointmentSummary | null>(null);
    const [form, setForm] = useState({
        date: "",
        start: "",
        end: "",
        location: "",
        notes: "",
    });
    const [now, setNow] = useState(Date.now());

    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const formatearHora = (hora: string | null) => {
        if (!hora) return "";

        const [h, m] = hora.split(":").map(Number);
        const periodo = h >= 12 ? "p. m." : "a. m.";
        const hora12 = h % 12 === 0 ? 12 : h % 12;

        return `${hora12}:${m.toString().padStart(2, "0")} ${periodo}`;
    };

    const formatTimeRemaining = (hora: string | null) => {
        if (!hora) return "";

        const [h, m] = hora.split(":").map(Number);

        const nowDate = new Date();
        const target = new Date();

        target.setHours(h, m, 0, 0);

        const diff = target.getTime() - nowDate.getTime();

        if (diff <= 0) return "0m 00s";

        const totalSeconds = Math.floor(diff / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
    };


    const fetchLabStatus = useCallback(async () => {
            try {
                const res = await fetch("/api/lab-status", { cache: "no-store" });
                const data = await res.json();

                setEstadoSalas({
                    salaA: {
                        estado: data.salaA.estado,
                        hora: data.salaA.ocupadoHasta,
                    },
                    salaB: {
                        estado: data.salaB.estado,
                        hora: data.salaB.ocupadoHasta,
                    },
                });
            } catch (error) {
                console.error("Error cargando estado del laboratorio:", error);

                setEstadoSalas({
                    salaA: { estado: "LIBRE", hora: null },
                    salaB: { estado: "LIBRE", hora: null },
                });
            }
        }, []);
    
    // -------------------
    // Función local para obtener participantes
    // -------------------
    const fetchParticipants = useCallback(async () => {
    setIsLoadingParticipants(true);

        try {
            const res = await fetch("/api/participants", { cache: "no-store" });

            if (!res.ok) {
                throw new Error(`Error HTTP ${res.status}`);
            }

            const data = await res.json();

            if (data.success) {
                setParticipants(data.data);
            } else {
                setParticipants([]);
                toast({
                    title: "Error cargando participantes",
                    description: data.error || "No se pudieron obtener los registros.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("[AppointmentPage] Error fetching participants:", error);
            setParticipants([]);
            toast({
                title: "Error cargando participantes",
                description: "No se pudieron obtener los registros.",
                variant: "destructive",
            });
        } finally {
            setIsLoadingParticipants(false);
        }
    }, []);

    // Cargar participantes al montar el componente
    useEffect(() => {
            fetchParticipants();
            fetchLabStatus();

            // Actualizar estado del laboratorio cada 30 segundos
            const interval = setInterval(() => {
                fetchLabStatus();
            }, 10000);

            return () => clearInterval(interval);
        }, [fetchParticipants, fetchLabStatus]);

    useEffect(() => {
            const interval = setInterval(() => {
                setNow(Date.now());
            }, 1000);

            return () => clearInterval(interval);
        }, []);


    // -------------------
    // Filtrado de participantes
    // -------------------
    const filteredParticipants = useMemo(() => {
        return participants.filter((p) => {
            const nombreCompleto = `${p.first_name} ${p.last_name}`.toLowerCase();
            return (
                nombreCompleto.includes(searchTerm.toLowerCase()) ||
                (p.id_number ?? "").includes(searchTerm) ||
                (p.email ?? "").toLowerCase().includes(searchTerm.toLowerCase())
            );
        });
    }, [participants, searchTerm]);

    // -------------------
    // Cierre del dropdown
    // -------------------
    useEffect(() => {

        const handleClickOutside = (event: MouseEvent) => {

            if (!searchRef.current) return;

            const target = event.target as Node;

            if (!searchRef.current.contains(target)) {
                setShowResults(false);
            }

        };

            document.addEventListener("mousedown", handleClickOutside);

            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };

        }, []);

    // -------------------
    // Selección de participante
    // -------------------
    const toggleSelect = (record: any) => {
        const participantId = record.id;
        const isAlreadySelected = selectedParticipants.some((p) => p.id === participantId);

        if (isAlreadySelected) {
            setSelectedParticipants((prev) => prev.filter((p) => p.id !== participantId));
        } else {
            const newParticipant: SelectedParticipant = {
                id: participantId,
                firstName: record.first_name ?? "",
                lastName: record.last_name ?? "",
                email: record.email,
                phone: record.phone,
                idNumber: record.id_number,
            };
            setSelectedParticipants((prev) => [...prev, newParticipant]);
        }

        setSearchTerm("");
        setShowResults(false);
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        setShowResults(value.length > 0);
    };

    const removeParticipant = (participantId: string) => {
        setSelectedParticipants((prev) => prev.filter((p) => p.id !== participantId));
    };

    const clearAllParticipants = () => {
        setSelectedParticipants([]);
    };

    // -------------------
    // Preparar resumen
    // -------------------
    const prepararResumenCita = (): AppointmentSummary => {
        return {
            fecha: form.date,
            horario: `${form.start} - ${form.end}`,
            ubicacion: form.location,
            notas: form.notes,
            participantes: selectedParticipants,
            totalParticipantes: selectedParticipants.length,
        };
    };

    const mostrarResumen = () => {
        const resumen = prepararResumenCita();
        setAppointmentSummary(resumen);
        setShowSummaryDialog(true);
    };

    // -------------------
    // Enviar cita programada
    // -------------------
    const isFormValid = form.date && form.start && form.end && form.location && selectedParticipants.length > 0;

    const programarCitas = async () => {
        if (!isFormValid) return;

        const participantesConEmail = selectedParticipants.filter((p) => p.email);
        const emails = participantesConEmail.map((p) => p.email!);

        toast({ title: "Enviando...", description: "Programando cita" });

        try {
            const response = await fetch("/api/schedule-appointment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username,
                    date: form.date,
                    start: form.start,
                    end: form.end,
                    location: form.location,
                    notes: form.notes || "Ninguna",
                    participants: selectedParticipants,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "¡Cita programada!",
                    description: `Email enviado a ${data.sentTo} participantes.`,
                });

                setShowResults(false);
                setSearchTerm("");
                setSelectedParticipants([]);
                setForm({ date: "", start: "", end: "", location: "", notes: "" });


                fetch("/api/lab-status")
                .then((res) => res.json())
                .then((labData) => {
                    setEstadoSalas({
                        salaA: {
                            estado: labData.salaA.estado,
                            hora: labData.salaA.ocupadoHasta,
                        },
                        salaB: {
                            estado: labData.salaB.estado,
                            hora: labData.salaB.ocupadoHasta,
                        },
                    });
                });

            } else {
                toast({
                    title: "Error",
                    description: JSON.stringify(data.error) ?? "No se pudo enviar",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({ title: "Error de red", description: "No se pudo conectar.", variant: "destructive" });
        }

    };

    return (
        <div className="space-y-6">


            <Button
                variant="outline"
                onClick={() => {
                    if (window.history.length > 1) {
                    router.back();
                    } else {
                    router.push("/evaluations");
                    }
                }}
                className="mb-4 print:hidden border-pink-500 text-pink-500 hover:bg-pink-50 rounded-xl px-5 py-6 font-normal"
                >
                <ArrowLeft className="mr-3 h-5 w-5" />
                Volver
                </Button>

            <Card className="shadow-lg">

                <CardHeader>
                    <CardTitle className="text-blue-700 text-2xl">
                        Programar Citas
                    </CardTitle>
                    <CardDescription>
                        Busca y selecciona participantes de las evaluaciones completadas para programar citas grupales.

                    </CardDescription>
                </CardHeader>

          
                

                
                

            <CardContent>

            <Card className="shadow-md border-l-4 border-blue-500 mb-6">
                    <CardHeader>
                        <CardTitle className="text-lg">
                        Estado del Laboratorio
                        </CardTitle>
                    </CardHeader>

                <CardContent>

                        <div className="space-y-4">

                            {/* SALA A */}
                            <div>
                                <p className="text-sm font-semibold mb-1">
                                    REHABILITACIÓN Y MASAJES
                                </p>

                                {estadoSalas.salaA.estado === "LIBRE" && (
                                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-green-400 bg-green-50 text-green-800 text-sm">
                                        <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                                        Disponible
                                    </div>
                                )}

                                {estadoSalas.salaA.estado === "RESERVADO" && (
                                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-yellow-400 bg-yellow-50 text-yellow-800 text-sm">
                                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                                        <span>
                                            <strong>Reservado</strong> a las {formatearHora(estadoSalas.salaA.hora)}
                                        </span>
                                    </div>
                                )}

                                {estadoSalas.salaA.estado === "OCUPADO" && (
                                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-400 bg-red-50 text-red-800 text-sm">
                                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                                        <span>
                                            <strong>Ocupado</strong> hasta {formatearHora(estadoSalas.salaA.hora)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* SALA B */}
                            <div>
                                <p className="text-sm font-semibold mb-1">
                                    FISIOLOGÍA Y BIOMECÁNICA
                                </p>

                                {estadoSalas.salaB.estado === "LIBRE" && (
                                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-green-400 bg-green-50 text-green-800 text-sm">
                                        <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                                        Disponible
                                    </div>
                                )}

                                {estadoSalas.salaB.estado === "RESERVADO" && (
                                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-yellow-400 bg-yellow-50 text-yellow-800 text-sm">
                                        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                                        <span>
                                            <strong>Reservado</strong> a las {formatearHora(estadoSalas.salaB.hora)}
                                        </span>
                                    </div>
                                )}

                                {estadoSalas.salaB.estado === "OCUPADO" && (
                                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg border border-red-400 bg-red-50 text-red-800 text-sm">
                                        <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                                        <span>
                                            <strong>Ocupado</strong> hasta {formatearHora(estadoSalas.salaB.hora)}
                                        </span>
                                    </div>
                                )}
                            </div>

                        </div>



                    </CardContent>
                </Card>
                {/* Reserva directa del laboratorio */}
                    <Card className="shadow-md border-l-4 border-purple-500 mb-6">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-purple-600" />
                                    Reservar Laboratorio
                                </CardTitle>

                                <CardDescription>
                                  Utilice esta opción para reservar el laboratorio para reuniones u otras actividades.
                                </CardDescription>
                            </CardHeader>

                            <CardContent>

                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

                                <div>
                                    <label className="text-sm font-medium">Fecha</label>
                                    <Input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium">Hora inicio</label>
                                    <Input
                                    type="time"
                                    value={form.start}
                                    onChange={(e) => setForm({ ...form, start: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium">Hora fin</label>
                                    <Input
                                    type="time"
                                    value={form.end}
                                    onChange={(e) => setForm({ ...form, end: e.target.value })}
                                    />
                                </div>
                                <div>
                                <label className="text-sm font-medium">Sala</label>

                                <select
                                    className="w-full border rounded-md p-2"
                                    value={form.location}
                                    onChange={(e) =>
                                    setForm({ ...form, location: e.target.value })
                                    }
                                >
                                    <option value="">Seleccione sala</option>
                                    <option value="Sala A">REHABILITACIÓN Y MASAJES</option>
                                    <option value="Sala B">FISIOLOGÍA Y BIOMECÁNICA</option>
                                </select>
                                </div>
                                <div>
                                <label className="text-sm font-medium">Motivo de la reserva</label>

                                <Textarea
                                    placeholder="Ej: reunión de coordinación..."
                                    className="h-[40px]"
                                    onChange={(e) =>
                                    setForm({ ...form, notes: e.target.value, location: "Laboratorio" })
                                    }
                                />

                                </div>

                                </div>

                                

                                <div className="mt-4">

                                <Button
                                    className="bg-purple-600 hover:bg-purple-700"
                                    onClick={async () => {
                                        if (!form.date || !form.start || !form.end) {
                                            toast({
                                                title: "Faltan datos",
                                                description: "Completa fecha, hora de inicio y hora de fin.",
                                                variant: "destructive",
                                            });
                                            return;
                                        }

                                        try {
                                            const response = await fetch("/api/schedule-appointment", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                    username,
                                                    date: form.date,
                                                    start: form.start,
                                                    end: form.end,
                                                    location: form.location,
                                                    notes: form.notes || "Reserva de laboratorio",
                                                    participants: []
                                                }),
                                            });

                                            const data = await response.json();

                                            if (data.success) {
                                                toast({
                                                    title: "Laboratorio reservado",
                                                    description: "La reserva se guardó correctamente.",
                                                });

                                                setShowResults(false);
                                                setSearchTerm("");
                                                setForm({ date: "", start: "", end: "", location: "", notes: "" });

                                                fetch("/api/lab-status")
                                                    .then((res) => res.json())
                                                    .then((labData) => {
                                                        setEstadoSalas({
                                                            salaA: {
                                                                estado: labData.salaA.estado,
                                                                hora: labData.salaA.ocupadoHasta,
                                                            },
                                                            salaB: {
                                                                estado: labData.salaB.estado,
                                                                hora: labData.salaB.ocupadoHasta,
                                                            },
                                                        });
                                                    });

                                            } else {
                                                toast({
                                                    title: "Error",
                                                    description: data.error ?? "No se pudo reservar el laboratorio.",
                                                    variant: "destructive",
                                                });
                                            }
                                        } catch (error) {
                                            toast({
                                                title: "Error",
                                                description: "No se pudo reservar el laboratorio.",
                                                variant: "destructive",
                                            });
                                        }
                                    }}
                                >
                                    Reservar laboratorio
                                </Button>

                                </div>

                            </CardContent>
                    </Card>


                    {/* Sección de Búsqueda y Selección de Participantes */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2 pb-2 border-b">
                            <Users className="h-5 w-5 text-blue-600" />
                            Selección de Participantes
                        </h3>

                        {/* Barra de Búsqueda */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <Search className="h-4 w-4" />
                                Buscar participantes en evaluaciones completadas
                            </label>

                            <div ref={searchRef} className="relative">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        ref={inputRef}
                                        type="text"
                                        placeholder="Buscar por nombre, ID o email..."
                                        value={searchTerm}
                                        onChange={(e) => handleSearchChange(e.target.value)}
                                        onFocus={() => setShowResults(searchTerm.length > 0)}
                                        className="pl-10 pr-4 py-3 border-2 border-gray-200 focus:border-blue-500 transition-colors"
                                    />
                                </div>

                                {/* Resultados de Búsqueda */}
                                {showResults && searchTerm.trim().length > 0 && filteredParticipants.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 bg-white border-2 border-blue-200 border-t-0 rounded-b-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                                        {filteredParticipants.map((record) => {
                                            const isSelected = selectedParticipants.some(p => p.id === record.id);
                                            return (
                                                <div
                                                    key={record.id}
                                                    className={`p-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-blue-50 ${isSelected ? 'bg-green-50 border-green-200' : ''
                                                        }`}
                                                    onClick={() => toggleSelect(record)}
                                                >
                                                    <div className="font-medium text-gray-900">
                                                        {record.first_name} {record.last_name}
                                                    </div>
                                                    <div className="text-sm text-gray-600 space-y-1 mt-1">
                                                        <div className="flex items-center gap-4 flex-wrap">
                                                            {record.email && (
                                                                <span className="flex items-center gap-1">
                                                                    <Mail className="h-3 w-3" />
                                                                    {record.email}
                                                                </span>
                                                            )}
                                                            {record.id_number && (
                                                                <span>ID: {record.id_number}</span>
                                                            )}
                                                        </div>
                                                        {/* <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {record.form_type}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {format(new Date(record.submission_date), "dd/MM/yyyy", { locale: es })}
                              </span>
                            </div> */}
                                                    </div>
                                                    {isSelected && (
                                                        <div className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                                                            <Users className="h-3 w-3" />
                                                            Seleccionado
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {showResults && searchTerm.length > 0 && filteredParticipants.length === 0 && !isLoadingParticipants && (
                                    <div className="absolute top-full left-0 right-0 bg-white border-2 border-gray-200 border-t-0 rounded-b-lg shadow-lg z-50 p-4 text-center text-gray-500">
                                        No se encontraron participantes con evaluaciones completadas
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Participantes Seleccionados */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Users className="h-4 w-4" />
                                    Participantes seleccionados ({selectedParticipants.length})
                                </label>
                                {selectedParticipants.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearAllParticipants}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <X className="h-4 w-4 mr-1" />
                                        Limpiar todos
                                    </Button>
                                )}
                            </div>

                            {/* Badges de participantes seleccionados */}
                            <div className="min-h-20 border-2 border-dashed border-gray-200 rounded-lg p-4 bg-gray-50">
                                {selectedParticipants.length === 0 ? (
                                    <div className="text-center text-gray-500 py-8">
                                        <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                        <p>No hay participantes seleccionados</p>
                                        <p className="text-sm">Usa la barra de búsqueda para encontrar participantes</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedParticipants.map((participant) => (
                                            <Badge
                                                key={participant.id}
                                                variant="secondary"
                                                className="px-3 py-2 text-sm bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 group"
                                            >
                                                <div className="flex items-center gap-1">
                                                    <span>{participant.firstName} {participant.lastName}</span>
                                                    <button
                                                        onClick={() => removeParticipant(participant.id)}
                                                        className="ml-1 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Textarea con lista de participantes */}
                            {selectedParticipants.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        Lista de participantes para la cita
                                    </label>
                                    <Textarea
                                        value={selectedParticipants.map(p => `${p.email}`).join(", ")}
                                        readOnly
                                        rows={2}
                                        className="bg-gray-50 text-sm resize-none"
                                        placeholder="Los participantes seleccionados aparecerán aquí..."
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sección de Detalles de la Cita */}
                    <div className="space-y-4 pt-6 border-t">
                        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2 pb-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            Detalles de la Cita
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Calendar className="h-4 w-4" />
                                    Fecha de la cita *
                                </label>
                                <Input
                                    type="date"
                                    value={form.date}
                                    onChange={(e) =>
                                    setForm((prev) => ({ ...prev, date: e.target.value }))
                                    }
                                    min={new Date().toISOString().split('T')[0]}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Clock className="h-4 w-4" />
                                    Hora de inicio *
                                </label>
                                <Input
                                    type="time"
                                    value={form.start}
                                    onChange={(e) =>
                                    setForm((prev) => ({ ...prev, start: e.target.value }))
                                    }
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <Clock className="h-4 w-4" />
                                    Hora de finalización *
                                </label>
                                <Input
                                    type="time"
                                    value={form.end}
                                    onChange={(e) =>
                                    setForm((prev) => ({ ...prev, end: e.target.value }))
                                    }
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <MapPin className="h-4 w-4" />
                                Ubicación *
                                </label>




                              <select
                                className="w-full border rounded-md p-2"
                                value={form.location}
                                onChange={(e) =>
                                    setForm((prev) => ({ ...prev, location: e.target.value }))
                                }
                                >
                                <option value="">Seleccione ubicación</option>
                                <option value="Sala A">REHABILITACIÓN Y MASAJES</option>
                                <option value="Sala B">FISIOLOGÍA Y BIOMECÁNICA</option>
                                </select>

                                </div>
                        </div>

                        {/* Notas adicionales */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <NotebookPen className="h-4 w-4" />
                                Notas adicionales
                            </label>
                            <Textarea
                                placeholder="Describe el propósito de la cita, temas a tratar, materiales necesarios, o cualquier información relevante..."
                                rows={4}
                                value={form.notes}
                                onChange={(e) =>
                                setForm((prev) => ({ ...prev, notes: e.target.value }))
                                }
                            />
                        </div>
                    </div>

                    {/* Resumen y Acción */}
                    <div className="pt-6 border-t">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex-1 space-y-2">
                                <div className="text-sm text-gray-600">
                                    {isFormValid ? (
                                        <>
                                            <strong>Resumen:</strong>{" "}
                                            {form.date && `${format(new Date(form.date), "PPPP", { locale: es })} `}
                                            {form.start && `de ${form.start} a ${form.end} `}
                                            {form.location && `en ${form.location}`}
                                            {selectedParticipants.length > 0 && ` • ${selectedParticipants.length} participante(s)`}
                                        </>
                                    ) : (
                                        <span className="text-orange-600">
                                            <strong>Nota:</strong> Complete todos los campos obligatorios (*)
                                        </span>
                                    )}
                                </div>
                                {selectedParticipants.length > 0 && (
                                    <div className="text-xs text-gray-500">
                                        <strong>Participantes:</strong> {selectedParticipants.map(p => `${p.firstName} ${p.lastName}`).join(", ")}
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={programarCitas}
                                disabled={!isFormValid}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-base font-medium whitespace-nowrap transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                size="lg"
                            >
                                <Calendar className="h-5 w-5 mr-2" />
                                Programar Cita
                            </Button>

                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Modal de Resumen de Cita */}
            <AlertDialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
                <AlertDialogContent className="max-w-3xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl flex items-center gap-2 text-blue-700">
                            <Calendar className="h-6 w-6" />
                            Resumen de la Cita Programada
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-4 text-sm text-muted-foreground">
                                {/* Información General de la Cita */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border bg-blue-50">
                                    <div>
                                        <strong className="text-foreground flex items-center gap-2">
                                            <Calendar className="h-4 w-4" />
                                            Fecha:
                                        </strong>
                                        <div className="mt-1">
                                            {appointmentSummary?.fecha ? format(new Date(appointmentSummary.fecha), "PPPP", { locale: es }) : "No especificada"}
                                        </div>
                                    </div>
                                    <div>
                                        <strong className="text-foreground flex items-center gap-2">
                                            <Clock className="h-4 w-4" />
                                            Horario:
                                        </strong>
                                        <div className="mt-1">{appointmentSummary?.horario || "No especificado"}</div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <strong className="text-foreground flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            Ubicación:
                                        </strong>
                                        <div className="mt-1">{appointmentSummary?.ubicacion || "No especificada"}</div>
                                    </div>
                                </div>

                                {/* Resumen de Participantes */}
                                <div>
                                    <strong className="text-foreground flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Participantes ({appointmentSummary?.totalParticipantes}):
                                    </strong>

                                    <ul className="list-disc list-inside mt-2 max-h-48 overflow-y-auto border rounded-lg p-3 bg-muted/30">

                                        {appointmentSummary?.participantes.map((participant) => (
                                            <li key={participant.id} className="mb-1">
                                                {participant.firstName} {participant.lastName}
                                            </li>
                                        ))}
                                    </ul>

                                </div>

                                {/* Notas Adicionales */}
                                {appointmentSummary?.notas && (
                                    <div className="p-3 rounded-lg border bg-muted/30">
                                        <strong className="text-foreground flex items-center gap-2">
                                            <NotebookPen className="h-4 w-4" />
                                            Notas adicionales:
                                        </strong>
                                        <div className="mt-1 text-foreground/80">{appointmentSummary.notas}</div>
                                    </div>
                                )}

                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex gap-2">
                        <AlertDialogAction onClick={() => setShowSummaryDialog(false)}>Entendido</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}