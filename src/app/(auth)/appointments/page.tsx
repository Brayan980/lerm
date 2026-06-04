"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import jsPDF from "jspdf";

import {
  ArrowLeft,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Clock,
  FileText,
  Filter,
  Loader2,
  MapPin,
  Plus,
  RefreshCcw,
  Users,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

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
  const router = useRouter();
  const searchParams = useSearchParams();

  const getToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentLabs, setCurrentLabs] = useState<Appointment[]>([]);
  const [upcomingLabReservations, setUpcomingLabReservations] = useState<
    Appointment[]
  >([]);
  const [labReservationState, setLabReservationState] = useState<
    "RESERVADO" | "OCUPADO" | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

    const [startDate, setStartDate] = useState<string>(
    searchParams.get("start") || getToday()
    );

    const [endDate, setEndDate] = useState<string>(
    searchParams.get("end") || searchParams.get("start") || getToday()
    );

  const getSalaNombre = (location: string | null) => {
    if (location === "Sala A") return "REHABILITACIÓN Y MASAJES";
    if (location === "Sala B") return "FISIOLOGÍA Y BIOMECÁNICA";
    return location || "Lugar no definido";
  };

  const getParticipants = (participants?: Participant[]) => {
    return Array.isArray(participants) ? participants : [];
  };

  const getParticipantName = (participant: Participant) => {
    if (participant.firstName && participant.lastName) {
      return `${participant.firstName} ${participant.lastName}`;
    }

    if (participant.firstName) return participant.firstName;
    if (participant.email) return participant.email;

    return "Participante sin nombre";
  };

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

  const formatReservationDate = (date: string) => {
    const safeDate = date.split("T")[0];
    const [year, month, day] = safeDate.split("-").map(Number);

    return new Date(year, month - 1, day).toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
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

  const totalParticipants = appointments.reduce((total, appointment) => {
    return total + getParticipants(appointment.participants).length;
  }, 0);

  const labsCount = currentLabs.length + upcomingLabReservations.length;

  function generateReportPDF(
    appointments: Appointment[],
    startDate: string,
    endDate: string
  ) {
    const doc = new jsPDF();
    let y = 20;

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

    y += 4;
    doc.setDrawColor(180);
    doc.line(10, y, 200, y);
    y += 8;

    let totalParticipantes = 0;

    appointments.forEach((appt, index) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      const fechaFormateada = formatReservationDate(appt.appointment_date);
      const participantes = getParticipants(appt.participants);
      const numParticipantes = participantes.length;

      totalParticipantes += numParticipantes;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(0, 60, 140);
      doc.text(`${index + 1}. ${fechaFormateada}`, 14, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(20);

      doc.text("Lugar:", 14, y);
      doc.text(getSalaNombre(appt.location), 40, y);
      y += 5;

      doc.text("Hora:", 14, y);
      doc.text(`${formatTime(appt.start_time)} - ${formatTime(appt.end_time)}`, 40, y);
      y += 5;

      doc.text("Notas:", 14, y);
      doc.text(appt.notes || "Ninguna", 40, y);
      y += 7;

      doc.setFont("helvetica", "bold");
      doc.text(`Participantes (${numParticipantes}):`, 14, y);
      y += 6;

      doc.setFont("helvetica", "normal");

      participantes.forEach((participant) => {
        doc.text(`• ${getParticipantName(participant)}`, 20, y);
        y += 5;
      });

      y += 3;
      doc.setDrawColor(220);
      doc.line(10, y, 200, y);
      y += 7;
    });

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

    try {
      const params = new URLSearchParams();

      if (startDate) params.append("start", startDate);
      if (endDate) params.append("end", endDate);

      const res = await fetch(`/api/appointments?${params.toString()}`);
      const data = await res.json();

      if (!data.success) {
        toast({
          title: "No se pudieron cargar las citas",
          description: "Intenta actualizar nuevamente la lista.",
          variant: "destructive",
        });
        return;
      }

      setAppointments(data.data);

      const now = new Date();

      const labAppointments = data.data
        .filter(
          (appt: Appointment) =>
            appt.location === "Sala A" || appt.location === "Sala B"
        )
        .sort((a: Appointment, b: Appointment) => {
          const aDate = parseAppointmentDateTime(
            a.appointment_date,
            a.start_time
          ).getTime();
          const bDate = parseAppointmentDateTime(
            b.appointment_date,
            b.start_time
          ).getTime();

          return aDate - bDate;
        });

      const upcomingLabs = labAppointments
        .filter((appt: Appointment) => {
          const start = parseAppointmentDateTime(
            appt.appointment_date,
            appt.start_time
          );
          return start > now;
        })
        .slice(0, 2);

      const activeLabs = labAppointments.filter((appt: Appointment) => {
        const start = parseAppointmentDateTime(
          appt.appointment_date,
          appt.start_time
        );
        const end = parseAppointmentDateTime(
          appt.appointment_date,
          appt.end_time
        );

        return now >= start && now <= end;
      });

      setCurrentLabs(activeLabs);
      setUpcomingLabReservations(upcomingLabs);

      if (activeLabs.length > 0) {
        setLabReservationState("OCUPADO");
      } else if (upcomingLabs.length > 0) {
        setLabReservationState("RESERVADO");
      } else {
        setLabReservationState(null);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error al consultar citas",
        description: "Revisa la conexión con la base de datos e intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

    const limpiarFechas = () => {
        setStartDate("");
        setEndDate("");
        };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchAppointments();

    const interval = setInterval(() => {
      fetchAppointments();
    }, 10000);

    return () => clearInterval(interval);
  }, [startDate, endDate]);

  return (
    <div className="-mt-6 space-y-5">
      <Button
        variant="outline"
        onClick={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push("/evaluations");
          }
        }}
        className="print:hidden rounded-xl border-primary/30 px-4 py-5 text-primary hover:bg-primary/10"
      >
        <ArrowLeft className="mr-2 h-5 w-5" />
        Volver
      </Button>

      {labReservationState === "OCUPADO" && currentLabs.length > 0 && (
        <div className="space-y-2">
          {currentLabs.map((lab) => (
            <div
              key={lab.id}
              className="flex flex-col gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-800 shadow-sm md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-red-100 p-2">
                  <MapPin className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-bold">{getSalaNombre(lab.location)}</p>
                  <p className="text-sm text-red-700">
                    {formatReservationDate(lab.appointment_date)} ·{" "}
                    {formatTime(lab.start_time)} - {formatTime(lab.end_time)}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold">
                Ocupado · Disponible {getTimeRemaining(lab.appointment_date, lab.end_time)}
              </span>
            </div>
          ))}
        </div>
      )}

      {upcomingLabReservations.length > 0 && (
        <div className="space-y-2">
          {upcomingLabReservations.map((lab) => (
            <div
              key={lab.id}
              className="flex flex-col gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 shadow-sm md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-amber-100 p-2">
                  <CalendarClock className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-bold">{getSalaNombre(lab.location)}</p>
                  <p className="text-sm text-amber-800">
                    {formatReservationDate(lab.appointment_date)} ·{" "}
                    {formatTime(lab.start_time)}
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-blue-700">
                Reservado · {getTimeRemaining(lab.appointment_date, lab.start_time)}
              </span>
            </div>
          ))}
        </div>
      )}

      <Card className="overflow-hidden border border-border/70 bg-gradient-to-br from-primary/10 via-background to-background shadow-xl">
        <CardContent className="p-0">
          <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <CalendarCheck className="h-3.5 w-3.5" />
                Gestión de citas LERM
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Citas Agendadas
                </h1>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  Consulta, filtra y genera informes de las citas programadas para los laboratorios.
                </p>
              </div>
            </div>

            <Link href="/appointments/schedule">
              <Button className="rounded-xl px-5 py-5 shadow-md">
                <Plus className="mr-2 h-5 w-5" />
                Registrar Citas
              </Button>
            </Link>
          </div>

          <div className="grid border-t bg-background/70 md:grid-cols-4">
            <div className="border-b p-4 md:border-b-0 md:border-r">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total citas</p>
                  <p className="text-xl font-bold">{appointments.length}</p>
                </div>
              </div>
            </div>

            <div className="border-b p-4 md:border-b-0 md:border-r">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Participantes</p>
                  <p className="text-xl font-bold">{totalParticipants}</p>
                </div>
              </div>
            </div>

            <div className="border-b p-4 md:border-b-0 md:border-r">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Salas activas</p>
                  <p className="text-xl font-bold">{labsCount}</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2 text-primary">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hora actual</p>
                  <p className="text-xl font-bold">
                    {currentTime.toLocaleTimeString("es-CO", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/70 shadow-md">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Filter className="h-4 w-4 text-primary" />
                Filtros de búsqueda
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="space-y-1">
                  <Label htmlFor="startDate" className="text-xs text-muted-foreground">
                    Desde
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                        const value = e.target.value;
                        setStartDate(value);

                        if (!endDate || endDate < value) {
                            setEndDate(value);
                        }
                        }}
                    className="h-11 w-[180px] rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="endDate" className="text-xs text-muted-foreground">
                    Hasta
                  </Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-11 w-[180px] rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={limpiarFechas}
                className="h-11 rounded-xl"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Limpiar
              </Button>

              <Button
                variant="outline"
                onClick={fetchAppointments}
                className="h-11 rounded-xl"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Actualizar
              </Button>

              <Button
                onClick={() => {
                  if (!startDate || !endDate) {
                    toast({
                      title: "Rango de fechas incompleto",
                      description:
                        "Selecciona una fecha de inicio y una fecha de fin antes de generar el PDF.",
                      variant: "destructive",
                    });
                    return;
                  }

                  generateReportPDF(appointments, startDate, endDate);

                  toast({
                    title: "PDF generado exitosamente",
                    description:
                      "Tu informe fue creado y se descargó correctamente.",
                  });
                }}
                className="h-11 rounded-xl shadow-md"
              >
                <FileText className="mr-2 h-4 w-4" />
                Generar Informe
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="border border-border/70 shadow-sm">
          <CardContent className="flex min-h-[260px] flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="mb-3 h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Cargando citas agendadas...</p>
          </CardContent>
        </Card>
      ) : appointments.length === 0 ? (
        <Card className="border border-dashed border-border/80 shadow-sm">
          <CardContent className="flex min-h-[280px] flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-2xl bg-primary/10 p-4 text-primary">
              <CalendarDays className="h-10 w-10" />
            </div>

            <h2 className="text-xl font-bold text-foreground">
              No hay citas agendadas
            </h2>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              No se encontraron citas para el rango de fechas seleccionado.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {appointments.map((appt) => {
            const participants = getParticipants(appt.participants);
            const visibleParticipants = participants.slice(0, 2);
            const extraParticipants = participants.length - visibleParticipants.length;

            return (
              <Card
                key={appt.id}
                className="group relative overflow-hidden border border-border/70 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-primary/70" />

                <CardHeader className="p-5 pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardDescription className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Fecha de la cita
                      </CardDescription>

                      <CardTitle className="mt-1 text-xl font-bold capitalize leading-tight">
                        {formatReservationDate(appt.appointment_date)}
                      </CardTitle>
                    </div>

                    <div className="rounded-xl border border-primary/15 bg-primary/10 p-3 text-primary">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 p-5 pt-0">
                  <div className="grid gap-3">
                    <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2">
                      <Clock className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {formatTime(appt.start_time)} - {formatTime(appt.end_time)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {getSalaNombre(appt.location)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 rounded-xl bg-muted/50 px-3 py-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">
                        {participants.length} participante
                        {participants.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  {participants.length > 0 && (
                    <div className="rounded-xl border bg-background p-3">
                      <p className="mb-2 text-xs font-semibold text-muted-foreground">
                        Participantes
                      </p>

                      <div className="space-y-1">
                        {visibleParticipants.map((participant, index) => (
                          <p key={`${participant.email}-${index}`} className="text-sm">
                            {getParticipantName(participant)}
                          </p>
                        ))}

                        {extraParticipants > 0 && (
                          <p className="text-xs font-semibold text-primary">
                            +{extraParticipants} participante
                            {extraParticipants === 1 ? "" : "s"} más
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {appt.notes && (
                    <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Notas
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {appt.notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}