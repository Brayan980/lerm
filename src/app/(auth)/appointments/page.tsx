
"use client";
import { useEffect, useState } from "react";
import { CalendarDays, MapPin, Clock, RefreshCcw, Search, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

interface Participant {
    email: string;
    firstName?: string;
    lastName?: string;
    idNumber?: string;
}

interface Appointment {
    id: string;
    location: string | null;
    notes: string | null;
    appointment_date: string;
    start_time: string;
    end_time: string;
    participants: Participant[];
}

export default function AppointmentsPage() {
    const getSalaNombre = (location: string | null) => {
        if (location === "Sala A") return "REHABILITACIÓN Y MASAJES";
        if (location === "Sala B") return "FISIOLOGÍA Y BIOMECÁNICA";
        return location;
    };

    const getToday = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };
    const [currentLabs, setCurrentLabs] = useState<Appointment[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

    const router = useRouter();
    const searchParams = useSearchParams();
    const [startDate, setStartDate] = useState<string>(
        searchParams.get("start") || getToday()
    );

    const [endDate, setEndDate] = useState<string>(
        searchParams.get("end") || ""
    );
    const [labReservation, setLabReservation] = useState<Appointment | null>(null);
    const [labReservationState, setLabReservationState] = useState<"RESERVADO" | "OCUPADO" | null>(null);
    const [nextLabReservation, setNextLabReservation] = useState<Appointment | null>(null);
    const [upcomingLabReservations, setUpcomingLabReservations] = useState<Appointment[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000); // cada segundo

        return () => clearInterval(interval);
    }, []);

    function generateReportPDF(appointments: Appointment[], startDate: string, endDate: string) {
        const doc = new jsPDF();
        let y = 20;

        // ===== Encabezado =====
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("Informe de Citas - LERM", 14, y);

        y += 10;

        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(60);

        doc.text(`Desde  ${startDate}  Hasta  ${endDate}`, 14, y);
        y += 6;

        const generationDate = new Date().toLocaleString("es-CO");
        doc.text(`Fecha de generación: ${generationDate}`, 14, y);

        // Línea separadora
        y += 4;
        doc.setDrawColor(180);
        doc.line(10, y, 200, y);
        y += 8;

        let totalParticipantes = 0;

        // ===== Citas =====
        appointments.forEach((appt, index) => {

            // Salto de página si se llena
            if (y > 260) {
                doc.addPage();
                y = 20;
            }

            const fechaFormateada = new Date(appt.appointment_date).toLocaleDateString("es-CO", {
                weekday: "long",
                day: "numeric",
                month: "long"
            });

            const participantes = appt.participants ?? [];
            const numParticipantes = participantes.length;
            totalParticipantes += numParticipantes;

            // ===== Número y fecha =====
            doc.setFont("helvetica", "bold");
            doc.setFontSize(13);
            doc.setTextColor(0, 60, 140);
            doc.text(`${index + 1}. ${fechaFormateada}`, 14, y);
            y += 7;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(11);
            doc.setTextColor(20);

            // Información alineada tipo "campo : valor"
            doc.text(`Lugar:`, 14, y);
            doc.text(appt.location || "No definido", 40, y);
            y += 5;

            doc.text(`Hora:`, 14, y);
            doc.text(`${appt.start_time} - ${appt.end_time}`, 40, y);
            y += 5;

            doc.text(`Notas:`, 14, y);
            doc.text(appt.notes || "Ninguna", 40, y);
            y += 7;

            // Participantes
            doc.setFont("helvetica", "bold");
            doc.text(`Participantes (${numParticipantes}):`, 14, y);
            y += 6;

            doc.setFont("helvetica", "normal");

            participantes.forEach((p) => {
                const nombre =
                    p.firstName && p.lastName ? `${p.firstName} ${p.lastName}` : p.email;

                doc.text(`• ${nombre}`, 20, y);
                y += 5;
            });

            // Separador entre citas
            y += 3;
            doc.setDrawColor(220);
            doc.line(10, y, 200, y);
            y += 7;
        });

        // ===== Total participantes =====
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(`TOTAL DE PARTICIPANTES: ${totalParticipantes}`, 14, y);

        doc.save("informe_citas_lerm.pdf");
    }


    async function fetchAppointments() {
        if (appointments.length === 0) {
            setLoading(true);
        }

        const params = new URLSearchParams();
        if (startDate) params.append("start", startDate);
        if (endDate) params.append("end", endDate);

        const res = await fetch(`/api/appointments?${params.toString()}`);
        const data = await res.json();

        if (data.success) {
            setAppointments(data.data);

            const now = currentTime;

            const labAppointments = data.data
                .filter((appt: Appointment) =>
                    appt.location === "Sala A" || appt.location === "Sala B"
                )
                .sort((a: Appointment, b: Appointment) => {
                    const aDate = parseAppointmentDateTime(a.appointment_date, a.start_time).getTime();
                    const bDate = parseAppointmentDateTime(b.appointment_date, b.start_time).getTime();
                    return aDate - bDate;
                });

            const upcomingLabs = labAppointments
                .filter((appt: Appointment) => {
                    const start = parseAppointmentDateTime(appt.appointment_date, appt.start_time);
                    return start > now;
                })
                .slice(0, 2);

            setUpcomingLabReservations(upcomingLabs);

            const currentLabs = labAppointments.filter((appt: Appointment) => {
                const start = parseAppointmentDateTime(appt.appointment_date, appt.start_time);
                const end = parseAppointmentDateTime(appt.appointment_date, appt.end_time);

                return currentTime >= start && currentTime <= end;
            });

            setCurrentLabs(currentLabs);

            if (currentLabs.length > 0) {
                setLabReservation(currentLabs[0]);
                setLabReservationState("OCUPADO");
            } else {
                const nextLab = labAppointments.find((appt: Appointment) => {
                    const start = parseAppointmentDateTime(appt.appointment_date, appt.start_time);
                    return start > now;
                });

                if (nextLab) {
                    setLabReservation(nextLab);
                    setLabReservationState("RESERVADO");
                } else {
                    setLabReservation(null);
                    setLabReservationState(null);
                }
            }
        }

        setLoading(false);
    }

    useEffect(() => {
        fetchAppointments();

        // 🔄 Recargar citas automáticamente cada 30 segundos
        const interval = setInterval(() => {
            fetchAppointments();
        }, 10000);

        return () => clearInterval(interval);
    }, [startDate, endDate]);

    // 🔹 Formatea la hora con AM/PM
    const formatTime = (time: string) => {
        const [hour, minute] = time.split(":").map(Number);
        const period = hour >= 12 ? "p.m." : "a.m.";
        const formattedHour = hour % 12 || 12;
         return `${formattedHour}:${minute.toString().padStart(2, "0")} ${period}`;
    
    };
        const parseAppointmentDateTime = (date: string, time: string) => {
            const safeDate = date.split("T")[0];

            const [year, month, day] = safeDate.split("-").map(Number);
            const [hour, minute] = time.split(":").map(Number);

            return new Date(year, month - 1, day, hour, minute, 0);
        };
            
        const getTimeRemaining = (date: string, time: string) => {
            const now = currentTime;
            const target = parseAppointmentDateTime(date, time);

            const diffMs = target.getTime() - now.getTime();

            if (diffMs <= 0) return "En curso";

            const minutes = Math.floor(diffMs / 60000);

            if (minutes < 60) return `En ${minutes} min`;

            const hours = Math.floor(minutes / 60);
            return `En ${hours} h`;
        };

    const formatReservationDate = (date: string) => {
        const safeDate = date.split("T")[0];
        const [year, month, day] = safeDate.split("-").map(Number);

        return new Date(year, month - 1, day).toLocaleDateString("es-CO", {
            weekday: "long",
            day: "numeric",
            month: "long",
        });
    };
    const limpiarFechas = () => {
        setStartDate(getToday());
        setEndDate("");
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
                className="mb-4 print:hidden border-pink-500 text-pink-500 hover:bg-pink-50 rounded-xl px-4 py-5 font-normal"
                >
                <ArrowLeft className="mr-3 h-5 w-5" />
                Volver
                </Button>

            {/* Header */}

            {/* Header */}
            {labReservationState === "OCUPADO" && currentLabs.map((lab: Appointment) => (
                    <div
                        key={lab.id}
                        className="p-3 rounded-lg flex items-center gap-2 
                        bg-red-50 border border-red-300 text-red-800 mb-2"
                    >
                        <MapPin className="w-5 h-5" />

                        <div className="flex flex-wrap items-center gap-2">
                            <strong>
                                {lab.location === "Sala A"
                                    ? "REHABILITACIÓN Y MASAJES"
                                    : "FISIOLOGÍA Y BIOMECÁNICA"}
                            </strong>

                            <span className="text-sm opacity-80">
                                | {formatReservationDate(lab.appointment_date)}
                            </span>

                            <span className="text-sm opacity-80">
                                | {formatTime(lab.start_time)} - {formatTime(lab.end_time)}
                            </span>

                            <span className="text-sm font-semibold">
                                | Disponible en {getTimeRemaining(
                                    lab.appointment_date,
                                    lab.end_time
                                )}
                            </span>
                        </div>
                    </div>
                ))}

           {upcomingLabReservations.length > 0 && (
                <div className="space-y-2 mb-4">
                    {upcomingLabReservations.map((lab) => (
                        <div
                            key={lab.id}
                            className="p-3 rounded-lg flex items-center gap-2 
                            bg-yellow-50 border border-yellow-300 text-yellow-800"
                        >
                            <MapPin className="w-5 h-5" />

                            <div className="flex flex-wrap items-center gap-2">
                                <strong>
                                    {lab.location === "Sala A"
                                        ? "REHABILITACIÓN Y MASAJES"
                                        : lab.location === "Sala B"
                                        ? "FISIOLOGÍA Y BIOMECÁNICA"
                                        : lab.location}
                                </strong>

                                <span className="text-sm opacity-80">
                                    | {formatReservationDate(lab.appointment_date)}
                                </span>

                                <span className="text-sm opacity-80">
                                    | {formatTime(lab.start_time)}
                                </span>

                                <span className="text-sm font-semibold text-blue-700">
                                    | {getTimeRemaining(
                                        lab.appointment_date,
                                        lab.start_time
                                    )}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Card className="shadow-lg">

                <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div>
                        <CardTitle className="text-blue-700 text-2xl">
                        Citas Agendadas
                        </CardTitle>
                        <CardDescription>
                        Haz clic en una fila o en el ícono de la derecha para seleccionar las
                        evaluaciones que se usarán en el cálculo del ETM.
                        </CardDescription>
                    </div>

                    <Link href="/appointments/schedule">
                        <Button
                        className="
                            bg-pink-500
                            hover:bg-pink-600
                            text-white
                            px-4
                            py-2
                            rounded-lg
                            shadow-md
                            transition-all
                            duration-200
                        "
                        >
                        Registrar Citas
                        </Button>
                    </Link>
                    </CardHeader>


                {/* Filtros */}

                <CardContent>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 flex-wrap">
                        <div className="flex flex-col sm:flex-row items-center gap-2">

                            {/* 🔹 Campos de fecha */}
                            <div className="flex items-center gap-2">

                                <Label htmlFor="startDate" className="text-sm text-gray-600">
                                    Desde
                                </Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-[160px]"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <Label htmlFor="endDate" className="text-sm text-gray-600">
                                    Hasta
                                </Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-[160px]"
                                />
                            </div>

                        </div>


                        <div className="flex items-center gap-3">
                            
                            <Button
                                onClick={limpiarFechas}
                                className="
                                    bg-pink-500 
                                    hover:bg-pink-600 
                                    text-white 
                                    px-4 
                                    py-2
                                    rounded-lg
                                    shadow-md
                                    transition-all 
                                    duration-200
                                "
                            >
                                Limpiar
                            </Button>

                            <Button
                                variant="secondary"
                                onClick={() => {
                                    if (!startDate || !endDate) {
                                        toast({
                                            title: "Rango de fechas incompleto",
                                            description: "Selecciona una fecha de inicio y una fecha de fin antes de generar el PDF.",
                                            variant: "destructive"
                                        });
                                        return;
                                    }

                                    generateReportPDF(appointments, startDate, endDate);

                                    toast({
                                        title: "PDF generado exitosamente",
                                        description: "Tu informe fue creado y se descargó correctamente.",
                                    });
                                }}
                                className="
        bg-pink-500 
        hover:bg-pink-600 
        text-white 
        px-4 
        py-2
        rounded-lg
        shadow-md
        transition-all 
        duration-200
    "
                            >
                                Generar Informe
                            </Button>

                        </div>

                    </div>
                </CardContent>


                {/* Contenido */}
                {loading ? (
                    <p className="text-center text-gray-500 mt-10 animate-pulse">
                        Cargando citas...
                    </p>
                ) : appointments.length === 0 ? (
                    <div className="text-center m-10 text-gray-400">
                        <CalendarDays className="w-10 h-10 mx-auto mb-2" />
                        <p>No hay citas agendadas desde la fecha seleccionada.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 rounded-lg p-4">
                        {appointments.map((appt) => (
                            <div key={appt.id}>
                                <Card className="hover:shadow-lg transition border border-gray-200 rounded-2xl">
                                    <CardContent className="p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <h2 className="font-semibold text-gray-800 text-lg">
                                                {new Date(appt.appointment_date).toLocaleDateString("es-CO", {
                                                    weekday: "long",
                                                    day: "numeric",
                                                    month: "long",
                                                })}
                                            </h2>
                                            <div className="flex items-center text-gray-600 text-sm">
                                                <Clock className="w-4 h-4 mr-1" />
                                                {formatTime(appt.start_time)} - {formatTime(appt.end_time)}
                                            </div>
                                        </div>

                                        {appt.location && (
                                            <p className="text-gray-700 flex items-center text-sm mb-2">
                                                <MapPin className="w-4 h-4 mr-1 text-blue-500" />

                                                {appt.location === "Sala A"
                                                    ? "REHABILITACIÓN Y MASAJES"
                                                    : appt.location === "Sala B"
                                                    ? "FISIOLOGÍA Y BIOMECÁNICA"
                                                    : appt.location}

                                            </p>
                                        )}

                                        {appt.notes && (
                                            <p className="text-gray-500 text-sm italic"><strong>Notas:</strong> {appt.notes}</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                )}

            </Card>


        </div>
    );
}
