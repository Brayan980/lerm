"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  NotebookPen,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { InitialRegistrationData } from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";

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

type LabState = "LIBRE" | "RESERVADO" | "OCUPADO" | string;

type LabStatus = {
  estado: LabState;
  hora: string | null;
};

const salaOptions = [
  { value: "Sala A", label: "REHABILITACIÓN Y MASAJES" },
  { value: "Sala B", label: "FISIOLOGÍA Y BIOMECÁNICA" },
];

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseLocalDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateLong(date: string) {
  if (!date) return "Fecha no definida";

  return format(parseLocalDate(date), "PPPP", { locale: es });
}

function formatHour(hour: string | null) {
  if (!hour) return "";

  const [h, m] = hour.split(":").map(Number);
  const period = h >= 12 ? "p. m." : "a. m.";
  const hour12 = h % 12 === 0 ? 12 : h % 12;

  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

function formatTimeRemaining(hour: string | null) {
  if (!hour) return "";

  const [h, m] = hour.split(":").map(Number);
  const now = new Date();
  const target = new Date();

  target.setHours(h, m, 0, 0);

  const diff = target.getTime() - now.getTime();

  if (diff <= 0) return "0m 00s";

  const totalSeconds = Math.floor(diff / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const restMinutes = minutes % 60;
    return `${hours}h ${restMinutes}m`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function getSalaLabel(location: string) {
  return (
    salaOptions.find((sala) => sala.value === location)?.label ||
    location ||
    "Sin ubicación"
  );
}

function LabStatusCard({
  title,
  status,
}: {
  title: string;
  status: LabStatus;
}) {
  const isFree = status.estado === "LIBRE";
  const isReserved = status.estado === "RESERVADO";
  const isBusy = status.estado === "OCUPADO";

  const containerClass = isFree
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : isReserved
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : isBusy
        ? "border-red-200 bg-red-50 text-red-800"
        : "border-border bg-muted/40 text-muted-foreground";

  const iconClass = isFree
    ? "bg-emerald-100 text-emerald-700"
    : isReserved
      ? "bg-amber-100 text-amber-700"
      : isBusy
        ? "bg-red-100 text-red-700"
        : "bg-muted text-muted-foreground";

  const dotClass = isFree
    ? "bg-emerald-500"
    : isReserved
      ? "bg-amber-500"
      : isBusy
        ? "bg-red-500"
        : "bg-muted-foreground";

  const label = isFree
    ? "Disponible"
    : isReserved
      ? "Reservado"
      : isBusy
        ? "Ocupado"
        : status.estado;

  return (
    <div className={`rounded-2xl border p-3 shadow-sm ${containerClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
            {title}
          </p>
          <div className="flex items-center gap-2 text-sm font-bold">
            <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
            {label}
          </div>
        </div>

        <div className={`rounded-xl p-2 ${iconClass}`}>
          {isFree ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
        </div>
      </div>

      {!isFree && status.hora && (
        <div className="mt-2 rounded-xl bg-white/60 px-3 py-1.5 text-xs font-medium">
          {isReserved ? "Reservado a las" : "Ocupado hasta"}{" "}
          {formatHour(status.hora)}
          <span className="ml-2 text-xs opacity-80">
            ({formatTimeRemaining(status.hora)})
          </span>
        </div>
      )}
    </div>
  );
}

export default function AppointmentPage() {
  const { username } = useAuth();
  const router = useRouter();

  const [participants, setParticipants] = useState<InitialRegistrationData[]>(
    [],
  );
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(true);
  const [isSubmittingAppointment, setIsSubmittingAppointment] = useState(false);
  const [isSubmittingReservation, setIsSubmittingReservation] = useState(false);

  const [estadoSalas, setEstadoSalas] = useState({
    salaA: { estado: "LIBRE", hora: null as string | null },
    salaB: { estado: "LIBRE", hora: null as string | null },
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<
    SelectedParticipant[]
  >([]);
  const [showResults, setShowResults] = useState(false);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);
  const [appointmentSummary, setAppointmentSummary] =
    useState<AppointmentSummary | null>(null);
  const [now, setNow] = useState(Date.now());

  const [form, setForm] = useState({
    date: getToday(),
    start: "",
    end: "",
    location: "",
    notes: "",
  });

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    fetchParticipants();
    fetchLabStatus();

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

  const filteredParticipants = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    if (!term) return [];

    return participants.filter((participant) => {
      const fullName =
        `${participant.first_name} ${participant.last_name}`.toLowerCase();
      const idNumber = participant.id_number ?? "";
      const email = (participant.email ?? "").toLowerCase();

      return (
        fullName.includes(term) ||
        idNumber.includes(term) ||
        email.includes(term)
      );
    });
  }, [participants, searchTerm]);

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

  const toggleSelect = (
    record: InitialRegistrationData & { phone?: string },
  ) => {
    const participantId = record.id;
    const isAlreadySelected = selectedParticipants.some(
      (p) => p.id === participantId,
    );

    if (isAlreadySelected) {
      setSelectedParticipants((prev) =>
        prev.filter((p) => p.id !== participantId),
      );
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
    setShowResults(value.trim().length > 0);
  };

  const removeParticipant = (participantId: string) => {
    setSelectedParticipants((prev) =>
      prev.filter((p) => p.id !== participantId),
    );
  };

  const clearAllParticipants = () => {
    setSelectedParticipants([]);
  };

  const resetForm = () => {
    setForm({
      date: getToday(),
      start: "",
      end: "",
      location: "",
      notes: "",
    });
  };

  const isFormValid = Boolean(
    form.date &&
    form.start &&
    form.end &&
    form.location &&
    selectedParticipants.length > 0,
  );

  const isReservationValid = Boolean(
    form.date && form.start && form.end && form.location,
  );

  const prepararResumenCita = (): AppointmentSummary => {
    return {
      fecha: form.date,
      horario: `${formatHour(form.start)} - ${formatHour(form.end)}`,
      ubicacion: getSalaLabel(form.location),
      notas: form.notes,
      participantes: selectedParticipants,
      totalParticipantes: selectedParticipants.length,
    };
  };

  const mostrarResumen = () => {
    if (!isFormValid) {
      toast({
        title: "Datos incompletos",
        description:
          "Completa fecha, horario, sala y selecciona al menos un participante.",
        variant: "destructive",
      });
      return;
    }

    setAppointmentSummary(prepararResumenCita());
    setShowSummaryDialog(true);
  };

  const programarCitas = async () => {
    if (!isFormValid) return;

    setIsSubmittingAppointment(true);

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
          title: "Cita programada",
          description: `Se notificó a ${data.sentTo ?? selectedParticipants.length} participante(s).`,
        });

        setShowSummaryDialog(false);
        setShowResults(false);
        setSearchTerm("");
        setSelectedParticipants([]);
        resetForm();
        fetchLabStatus();
      } else {
        toast({
          title: "Error",
          description: data.error
            ? String(data.error)
            : "No se pudo programar la cita.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error de red",
        description: "No se pudo conectar con el servidor.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingAppointment(false);
    }
  };

  const reservarLaboratorio = async () => {
    if (!isReservationValid) {
      toast({
        title: "Faltan datos",
        description: "Completa fecha, hora de inicio, hora de fin y sala.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingReservation(true);

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
          participants: [],
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
        resetForm();
        fetchLabStatus();
      } else {
        toast({
          title: "Error",
          description: data.error
            ? String(data.error)
            : "No se pudo reservar el laboratorio.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "No se pudo reservar el laboratorio.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReservation(false);
    }
  };

  const currentHour = useMemo(() => {
    return new Date(now).toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [now]);

  return (
    <div className="-mt-10 space-y-3 pb-0">
      <Button
        variant="outline"
        onClick={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push("/appointments");
          }
        }}
        className="print:hidden h-10 rounded-xl border-primary/30 px-4 text-primary hover:bg-primary/10"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver
      </Button>

      <Card className="overflow-hidden border border-border/70 bg-gradient-to-br from-primary/10 via-background to-background shadow-xl">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                Gestión de citas LERM
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Programar Citas
                </h1>
                <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
                  Reserva laboratorios, selecciona participantes y programa
                  citas grupales de forma rápida y organizada.
                </p>
              </div>
            </div>

            <div className="grid min-w-[260px] gap-1.5 rounded-2xl border border-border/70 bg-background/80 p-3 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-muted-foreground">
                  Participantes cargados
                </span>
                <span className="text-sm font-bold text-foreground">
                  {participants.length}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-muted-foreground">
                  Seleccionados
                </span>
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {selectedParticipants.length}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-muted-foreground">
                  Hora actual
                </span>
                <span className="text-sm font-bold text-primary">
                  {currentHour}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/70 shadow-md">
        <CardHeader className="p-4 pb-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                Estado del Laboratorio
              </CardTitle>
              <CardDescription className="text-xs">
                Consulta la disponibilidad actual de las salas antes de
                programar una cita.
              </CardDescription>
            </div>

            <Button
              variant="outline"
              onClick={fetchLabStatus}
              className="h-10 rounded-xl"
            >
              Actualizar estado
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0">
          <div className="grid gap-2 md:grid-cols-2">
            <LabStatusCard
              title="REHABILITACIÓN Y MASAJES"
              status={estadoSalas.salaA}
            />
            <LabStatusCard
              title="FISIOLOGÍA Y BIOMECÁNICA"
              status={estadoSalas.salaB}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 xl:grid-cols-[0.9fr_1.4fr]">
        <Card className="border border-border/70 shadow-md">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Reservar Laboratorio
            </CardTitle>
            <CardDescription className="text-xs">
              Usa esta opción para apartar una sala sin asociar participantes.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 p-4 pt-0">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Fecha
                </label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Sala
                </label>
                <select
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={form.location}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, location: e.target.value }))
                  }
                >
                  <option value="">Seleccione sala</option>
                  {salaOptions.map((sala) => (
                    <option key={sala.value} value={sala.value}>
                      {sala.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Hora inicio
                </label>
                <Input
                  type="time"
                  value={form.start}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, start: e.target.value }))
                  }
                  className="h-10 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Hora fin
                </label>
                <Input
                  type="time"
                  value={form.end}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, end: e.target.value }))
                  }
                  className="h-10 rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Motivo de la reserva
              </label>
              <Textarea
                placeholder="Ej: reunión de coordinación, preparación de materiales..."
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="min-h-[62px] rounded-xl"
              />
            </div>

            <Button
              onClick={reservarLaboratorio}
              disabled={!isReservationValid || isSubmittingReservation}
              className="h-10 w-full rounded-xl shadow-md"
            >
              {isSubmittingReservation ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="mr-2 h-4 w-4" />
              )}
              Reservar laboratorio
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-md">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Programar cita con participantes
            </CardTitle>
            <CardDescription className="text-xs">
              Busca participantes, selecciónalos y programa una cita grupal.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 p-4 pt-0">
            <div className="space-y-2" ref={searchRef}>
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Search className="h-4 w-4" />
                Buscar participante
              </label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Buscar por nombre, cédula o correo..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowResults(searchTerm.trim().length > 0)}
                  className="h-10 rounded-xl pl-10"
                />

                {showResults && searchTerm.trim().length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-72 overflow-y-auto rounded-2xl border bg-background shadow-xl">
                    {isLoadingParticipants ? (
                      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cargando participantes...
                      </div>
                    ) : filteredParticipants.length > 0 ? (
                      filteredParticipants.map((record) => {
                        const isSelected = selectedParticipants.some(
                          (p) => p.id === record.id,
                        );

                        return (
                          <button
                            key={record.id}
                            type="button"
                            className={`flex w-full items-start gap-3 border-b p-4 text-left transition-colors last:border-b-0 hover:bg-primary/5 ${
                              isSelected ? "bg-emerald-50" : ""
                            }`}
                            onClick={() => toggleSelect(record)}
                          >
                            <div className="rounded-xl bg-primary/10 p-2 text-primary">
                              <UserPlus className="h-4 w-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-foreground">
                                {record.first_name} {record.last_name}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                {record.id_number && (
                                  <span>ID: {record.id_number}</span>
                                )}
                                {record.email && <span>{record.email}</span>}
                              </div>
                            </div>

                            {isSelected && (
                              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                Seleccionado
                              </span>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        No se encontraron participantes.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-muted/20 p-3">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Participantes seleccionados
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedParticipants.length} participante(s) agregados a la
                    cita.
                  </p>
                </div>

                {selectedParticipants.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllParticipants}
                    className="rounded-xl text-muted-foreground"
                  >
                    Limpiar
                  </Button>
                )}
              </div>

              {selectedParticipants.length === 0 ? (
                <div className="rounded-xl border border-dashed bg-background p-3 text-center text-sm text-muted-foreground">
                  Aún no has seleccionado participantes.
                </div>
              ) : (
                <div className="grid gap-2 md:grid-cols-2">
                  {selectedParticipants.map((participant) => (
                    <div
                      key={participant.id}
                      className="rounded-xl border bg-background p-2.5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground">
                            {participant.firstName} {participant.lastName}
                          </p>
                          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                            {participant.idNumber && (
                              <p className="flex items-center gap-2">
                                <User className="h-3.5 w-3.5" />
                                {participant.idNumber}
                              </p>
                            )}
                            {participant.email && (
                              <p className="flex items-center gap-2 truncate">
                                <Mail className="h-3.5 w-3.5" />
                                {participant.email}
                              </p>
                            )}
                            {participant.phone && (
                              <p className="flex items-center gap-2">
                                <Phone className="h-3.5 w-3.5" />
                                {participant.phone}
                              </p>
                            )}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeParticipant(participant.id)}
                          className="h-8 w-8 rounded-full text-muted-foreground hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Fecha *
                </label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="h-10 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Inicio *
                </label>
                <Input
                  type="time"
                  value={form.start}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, start: e.target.value }))
                  }
                  className="h-10 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Fin *
                </label>
                <Input
                  type="time"
                  value={form.end}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, end: e.target.value }))
                  }
                  className="h-10 rounded-xl"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  Sala *
                </label>
                <select
                  className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={form.location}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, location: e.target.value }))
                  }
                  required
                >
                  <option value="">Seleccione sala</option>
                  {salaOptions.map((sala) => (
                    <option key={sala.value} value={sala.value}>
                      {sala.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <NotebookPen className="h-4 w-4" />
                Notas adicionales
              </label>
              <Textarea
                placeholder="Describe el propósito de la cita, materiales necesarios o cualquier información relevante..."
                rows={2}
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="min-h-[62px] rounded-xl"
              />
            </div>

            <div className="rounded-2xl border bg-background p-3">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-1 text-sm">
                  {isFormValid ? (
                    <>
                      <p className="font-semibold text-foreground">
                        Resumen listo para programar
                      </p>
                      <p className="text-muted-foreground">
                        {formatDateLong(form.date)} · {formatHour(form.start)} -{" "}
                        {formatHour(form.end)} · {getSalaLabel(form.location)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedParticipants.length} participante(s):{" "}
                        {selectedParticipants
                          .map((p) => `${p.firstName} ${p.lastName}`)
                          .join(", ")}
                      </p>
                    </>
                  ) : (
                    <div className="flex items-start gap-2 text-amber-700">
                      <AlertCircle className="mt-0.5 h-4 w-4" />
                      <span>
                        Completa fecha, horario, sala y selecciona al menos un
                        participante.
                      </span>
                    </div>
                  )}
                </div>

                <Button
                  onClick={mostrarResumen}
                  disabled={!isFormValid || isSubmittingAppointment}
                  className="h-10 rounded-xl px-6 shadow-md"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Revisar y programar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <AlertDialogContent className="max-w-3xl rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-2xl text-primary">
              <Calendar className="h-6 w-6" />
              Confirmar cita programada
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-sm text-muted-foreground">
                <div className="grid gap-4 rounded-2xl border bg-primary/5 p-4 md:grid-cols-2">
                  <div>
                    <strong className="flex items-center gap-2 text-foreground">
                      <Calendar className="h-4 w-4" />
                      Fecha
                    </strong>
                    <div className="mt-1 capitalize">
                      {appointmentSummary?.fecha
                        ? formatDateLong(appointmentSummary.fecha)
                        : "No especificada"}
                    </div>
                  </div>

                  <div>
                    <strong className="flex items-center gap-2 text-foreground">
                      <Clock className="h-4 w-4" />
                      Horario
                    </strong>
                    <div className="mt-1">
                      {appointmentSummary?.horario || "No especificado"}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <strong className="flex items-center gap-2 text-foreground">
                      <MapPin className="h-4 w-4" />
                      Sala
                    </strong>
                    <div className="mt-1">
                      {appointmentSummary?.ubicacion || "No especificada"}
                    </div>
                  </div>
                </div>

                <div>
                  <strong className="flex items-center gap-2 text-foreground">
                    <Users className="h-4 w-4" />
                    Participantes ({appointmentSummary?.totalParticipantes})
                  </strong>

                  <div className="mt-2 max-h-48 overflow-y-auto rounded-2xl border bg-background p-3">
                    <div className="grid gap-2 md:grid-cols-2">
                      {appointmentSummary?.participantes.map((participant) => (
                        <div
                          key={participant.id}
                          className="rounded-xl bg-muted/40 px-3 py-2 text-foreground"
                        >
                          {participant.firstName} {participant.lastName}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {appointmentSummary?.notas && (
                  <div className="rounded-2xl border bg-muted/30 p-3">
                    <strong className="flex items-center gap-2 text-foreground">
                      <NotebookPen className="h-4 w-4" />
                      Notas adicionales
                    </strong>
                    <div className="mt-1 text-foreground/80">
                      {appointmentSummary.notas}
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={programarCitas}
              disabled={isSubmittingAppointment}
              className="rounded-xl"
            >
              {isSubmittingAppointment && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Confirmar cita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
