"use client";

import AuthWrapper from "@/components/auth/AuthWrapper";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEvaluationContext } from "@/contexts/EvaluationContext";
import type { EvaluationRecord } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  RefreshCw,
  Search,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  UserCheck,
  ArrowLeft,
  CalendarDays,
  ListChecks,
  Sparkles,
  ClipboardList,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function EvaluationsPage() {
  const router = useRouter();
  const {
    evaluationRecords,
    fetchRecordsByPage,
    fetchRecords,
    isLoadingRecords,
    currentPage,
    totalRecords,
    recordsPerPage,
  } = useEvaluationContext();

  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);

  useEffect(() => {
    fetchRecordsByPage(1, "no_completada");
  }, [fetchRecordsByPage]);

  useEffect(() => {
    if (searchTerm.trim()) {
      setIsSearchMode(true);
      fetchRecords();
    } else {
      setIsSearchMode(false);
      fetchRecordsByPage(currentPage, "no_completada");
    }
  }, [searchTerm]);

  const handleRefresh = async () => {
    if (isSearchMode) {
      fetchRecords();
    } else {
      await fetchRecordsByPage(currentPage, "no_completada");
    }

    toast({
      title: "Lista actualizada",
      description: "Los registros se han actualizado correctamente.",
    });
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setIsSearchMode(false);
  };

  const filteredRecords = useMemo(() => {
    return evaluationRecords
      .filter(
        (record) =>
          record.status !== "Completada" &&
          record.status !== "Archivada" &&
          ((record.participantData?.first_name ?? "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
            (record.participantData?.last_name ?? "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            (record.participantData?.id_number ?? "").includes(searchTerm) ||
            (record.form_type ?? "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            (record.status ?? "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            String((record as EvaluationRecord & Record<string, unknown>).evaluation_mode ?? "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase()))
      )
      .sort(
        (a, b) =>
          new Date(b.submission_date).getTime() -
          new Date(a.submission_date).getTime()
      );
  }, [evaluationRecords, searchTerm]);

  const totalPages = isSearchMode ? 1 : Math.ceil(totalRecords / recordsPerPage);

  const handlePageChange = async (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && !isSearchMode) {
      await fetchRecordsByPage(page, "no_completada");
    }
  };

  const getStatusBadgeVariant = (status: EvaluationRecord["status"]) => {
    switch (status) {
      case "Nueva":
        return "default";
      case "Pendiente Revisión Evaluador":
        return "secondary";
      case "Pruebas Asignadas Asistente":
        return "outline";
      case "Resultados Parciales":
        return "destructive";
      default:
        return "default";
    }
  };

  const getStatusBadgeClassName = (status: EvaluationRecord["status"]) => {
    switch (status) {
      case "Nueva":
        return "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-50";
      case "Pendiente Revisión Evaluador":
        return "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50";
      case "Pruebas Asignadas Asistente":
        return "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-50";
      case "Resultados Parciales":
        return "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50";
      default:
        return "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-50";
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const menuItems = [
    {
      label: "Registro de nuevo Sujeto",
      description: "Crear evaluación",
      href: "/register-data",
      icon: FileText,
    },
    {
      label: "Ver Completados",
      description: "Evaluaciones cerradas",
      href: "/reviewed-evaluations",
      icon: UserCheck,
    },
    {
      label: "Ver Citas",
      description: "Agenda del laboratorio",
      href: "/appointments",
      icon: CalendarDays,
    },
  ];

  const getParticipantName = (record: EvaluationRecord) => {
    const firstName = record.participantData?.first_name ?? "";
    const lastName = record.participantData?.last_name ?? "";
    return `${firstName} ${lastName}`.trim() || "Sin nombre";
  };

  const getParticipantInitials = (record: EvaluationRecord) => {
    const firstName = record.participantData?.first_name?.trim()?.charAt(0) ?? "";
    const lastName = record.participantData?.last_name?.trim()?.charAt(0) ?? "";
    return `${firstName}${lastName}`.toUpperCase() || "EV";
  };


  const getAssignedTestName = (record: EvaluationRecord) => {
    const data = record as EvaluationRecord & Record<string, unknown>;

    // En el detalle de la evaluación la prueba asignada sale desde record.evaluation_mode.
    // Por eso aquí primero convertimos esos códigos internos en nombres limpios.
    const evaluationModeLabels: Record<string, string> = {
      "2C_Slaughter": "Slaughter",
      "2C_DurninWomersley": "Durnin-Womersley",
      "2C_Faulkner": "Faulkner",
      "2C_Carter": "Carter",
      "2C_Weltman": "Weltman",
      "MULT_Express": "Express",
      "MULT_Restringido": "Restringido",
      "MULT_5Componentes": "5 Componentes",
      "MULT_Completo": "Completo",
    };

    const cleanText = (value: string) =>
      value
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const formatKnownTestName = (value: string) => {
      const cleaned = cleanText(value);
      const lower = cleaned.toLowerCase();

      if (!cleaned) return "";

      if (evaluationModeLabels[value]) {
        return evaluationModeLabels[value];
      }

      if (lower.includes("durnin") || lower.includes("womersley")) {
        return "Durnin-Womersley";
      }
      if (lower.includes("slaughter")) {
        return "Slaughter";
      }
      if (lower.includes("faulkner")) {
        return "Faulkner";
      }
      if (lower.includes("carter")) {
        return "Carter";
      }
      if (lower.includes("weltman")) {
        return "Weltman";
      }
      if (lower.includes("5 componentes") || lower.includes("cinco componentes")) {
        return "5 Componentes";
      }
      if (lower.includes("restringido")) return "Restringido";
      if (lower.includes("express")) return "Express";
      if (lower.includes("completo")) return "Completo";

      return cleaned;
    };

    const getText = (value: unknown): string => {
      if (typeof value === "string") return formatKnownTestName(value);

      if (value && typeof value === "object") {
        const obj = value as Record<string, unknown>;

        const directText =
          getText(obj.assigned_test_type) ||
          getText(obj.assignedTestType) ||
          getText(obj.assigned_test) ||
          getText(obj.assignedTest) ||
          getText(obj.tipo_prueba) ||
          getText(obj.tipoPrueba) ||
          getText(obj.test_type) ||
          getText(obj.testType) ||
          getText(obj.selected_test_type) ||
          getText(obj.selectedTestType) ||
          getText(obj.selected_test) ||
          getText(obj.selectedTest) ||
          getText(obj.selected_profile) ||
          getText(obj.selectedProfile) ||
          getText(obj.profile) ||
          getText(obj.profileName) ||
          getText(obj.name) ||
          getText(obj.label) ||
          getText(obj.title) ||
          getText(obj.value);

        if (directText) return directText;

        const category = getText(obj.category) || getText(obj.tipo) || getText(obj.group);
        const profile = getText(obj.profile) || getText(obj.name) || getText(obj.label);

        if (category && profile) return `${category} - ${profile}`;
      }

      return "";
    };

    const candidates = [
      data.evaluation_mode,
      data.evaluationMode,
      data.assigned_evaluation_mode,
      data.assignedEvaluationMode,
      data.assigned_test_type,
      data.assignedTestType,
      data.assigned_test,
      data.assignedTest,
      data.assigned_test_name,
      data.assignedTestName,
      data.test_assignment,
      data.testAssignment,
      data.test_assignment_data,
      data.testAssignmentData,
      data.test_type,
      data.testType,
      data.tipo_prueba,
      data.tipoPrueba,
      data.selected_test_type,
      data.selectedTestType,
      data.selected_test,
      data.selectedTest,
      data.assigned_profile,
      data.assignedProfile,
      data.test_profile,
      data.testProfile,
      data.prueba_asignada,
      data.pruebaAsignada,
      data.form_data,
      data.formData,
      data.extra_data,
      data.extraData,
      data.metadata,
    ];

    for (const value of candidates) {
      const textValue = getText(value);
      if (textValue) return textValue;
    }

    return "";
  };

  return (
    <AuthWrapper allowedRoles={["Evaluator"]}>
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-50 via-white to-blue-50/40 px-3 pb-2 pt-0 sm:px-4 lg:px-5">
        <div className="mx-auto -mt-8 flex max-w-[1600px] items-start gap-3">
          <aside className="sticky top-1 hidden w-72 shrink-0 lg:block">
            <div className="overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="border-b border-slate-100 bg-gradient-to-br from-blue-50 via-white to-indigo-50 px-5 py-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  className="mb-3 h-10 w-full justify-start rounded-2xl border-pink-200 bg-white/80 px-4 text-pink-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver
                </Button>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-900">Menú</p>
                    <p className="text-xs text-slate-500">Navegación rápida</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1 p-2.5">
                {menuItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-100 hover:bg-blue-50/70 hover:shadow-sm"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-primary shadow-sm transition-all duration-200 group-hover:border-blue-200 group-hover:bg-blue-100/50">
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex flex-col leading-tight">
                        <span className="text-sm font-semibold text-slate-800">
                          {item.label}
                        </span>
                        <span className="mt-1 text-xs text-slate-500">
                          {item.description}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>

          <main className="min-w-0 flex-1 space-y-2.5">
            <Card className="overflow-hidden rounded-[1.6rem] border-slate-200/80 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
              <CardHeader className="relative px-6 py-3 sm:px-7">
                <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-primary/5" />
                <div className="relative flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                      <ListChecks className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge className="rounded-full border-blue-200 bg-blue-50 px-3 py-1 text-blue-700 hover:bg-blue-50">
                          <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                          Panel de gestión
                        </Badge>
                        <Badge variant="outline" className="rounded-full bg-white px-3 py-1 text-slate-600">
                          {filteredRecords.length} pendientes visibles
                        </Badge>
                      </div>

                      <CardTitle className="text-2xl font-bold tracking-tight text-slate-950 sm:text-[1.65rem]">
                        Evaluaciones Pendientes
                      </CardTitle>
                      <CardDescription className="mt-0.5 max-w-2xl text-sm text-slate-500 sm:text-[0.95rem]">
                        Revisa, busca y gestiona los formularios enviados por los participantes que requieren acción.
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row lg:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push("/dashboard")}
                      className="h-10 rounded-xl border-pink-200 text-pink-600 hover:bg-pink-50 lg:hidden"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Volver
                    </Button>

                    <Button
                      onClick={handleRefresh}
                      disabled={isLoadingRecords}
                      className="h-10 rounded-xl px-5 shadow-sm"
                    >
                      <RefreshCw
                        className={`mr-2 h-4 w-4 ${isLoadingRecords ? "animate-spin" : ""}`}
                      />
                      Actualizar
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="overflow-hidden rounded-[1.6rem] border-slate-200/80 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
              <CardHeader className="border-b border-slate-100 bg-white px-6 py-3 sm:px-7">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-950">
                      Lista de Envíos
                      <span className="ml-2 text-sm font-medium text-slate-500">
                        ({filteredRecords.length} {filteredRecords.length === 1 ? "registro" : "registros"} total)
                      </span>
                    </CardTitle>
                    <CardDescription className="mt-0.5 text-sm text-slate-500">
                      Ordenadas por fecha de envío, de la más reciente a la más antigua.
                    </CardDescription>
                  </div>

                  <div className="relative w-full xl:w-[380px]">
                    <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="search"
                      placeholder="Buscar por nombre, documento, formulario o estado..."
                      className="h-11 rounded-2xl border-slate-200 bg-slate-50 pl-11 pr-10 shadow-inner transition-all focus:bg-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                      <button
                        type="button"
                        onClick={handleClearSearch}
                        className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {isSearchMode && (
                  <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-700">
                    <Search className="h-4 w-4" />
                    <span>Buscando en todos los registros...</span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={handleClearSearch}
                      className="h-auto p-0 font-semibold text-blue-700 underline-offset-4 hover:underline"
                    >
                      Limpiar búsqueda
                    </Button>
                  </div>
                )}
              </CardHeader>

              <CardContent className="px-6 pb-3 pt-3 sm:px-7">
                {isLoadingRecords ? (
                  <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 text-center">
                    <RefreshCw className="h-9 w-9 animate-spin text-primary" />
                    <p className="mt-4 text-sm font-medium text-slate-700">Cargando evaluaciones...</p>
                    <p className="mt-1 text-xs text-slate-500">Espera un momento mientras se actualiza la lista.</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
                      <Table>
                        <TableHeader className="bg-slate-50/90">
                          <TableRow className="border-slate-200 hover:bg-slate-50/90">
                            <TableHead className="h-10 pl-5 text-xs font-bold uppercase tracking-wide text-slate-500">
                              Participante
                            </TableHead>
                            <TableHead className="h-10 text-xs font-bold uppercase tracking-wide text-slate-500">
                              Fecha Envío
                            </TableHead>
                            <TableHead className="h-10 text-xs font-bold uppercase tracking-wide text-slate-500">
                              Tipo Formulario
                            </TableHead>
                            <TableHead className="h-10 text-xs font-bold uppercase tracking-wide text-slate-500">
                              Resultado Cuestionario
                            </TableHead>
                            <TableHead className="h-10 text-xs font-bold uppercase tracking-wide text-slate-500">
                              Estado / Prueba
                            </TableHead>
                            <TableHead className="h-9 text-xs font-bold uppercase tracking-wide text-slate-500 text-center pr-6">
                              Acciones
                            </TableHead>
                          </TableRow>
                        </TableHeader>

                        <TableBody>
                          {filteredRecords.length > 0 ? (
                            filteredRecords.map((record) => {
                              const submissionDateObject = record.submission_date
                                ? new Date(record.submission_date)
                                : null;

                              return (
                                <TableRow
                                  key={record.id}
                                  className="border-slate-100 transition-colors hover:bg-blue-50/40"
                                >
                                  <TableCell className="py-3 pl-5">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                                        {getParticipantInitials(record)}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="truncate font-semibold text-slate-900">
                                          {getParticipantName(record)}
                                        </p>
                                        {record.participantData?.id_number && (
                                          <p className="mt-0.5 text-xs text-slate-500">
                                            ID: {record.participantData.id_number}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>

                                  <TableCell className="py-3 text-sm text-slate-600">
                                    {submissionDateObject && isValid(submissionDateObject)
                                      ? format(submissionDateObject, "dd MMM yyyy, HH:mm", {
                                          locale: es,
                                        })
                                      : "N/A"}
                                  </TableCell>

                                  <TableCell className="py-3">
                                    <Badge
                                      variant="outline"
                                      className="rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                                    >
                                      {record.form_type}
                                    </Badge>
                                  </TableCell>

                                  <TableCell className="py-3">
                                    <div className="flex flex-col gap-1.5">
                                      {record.paq_classification && (
                                        <Badge className="flex w-fit items-center rounded-full border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-50">
                                          <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
                                          PAQ: {record.paq_classification}
                                        </Badge>
                                      )}

                                      {record.ipaq_classification && (
                                        <Badge className="flex w-fit items-center rounded-full border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">
                                          <BarChart3 className="mr-1.5 h-3.5 w-3.5" />
                                          IPAQ: {record.ipaq_classification}
                                        </Badge>
                                      )}

                                      {record.parq_requires_consultation !== undefined &&
                                        record.parq_requires_consultation !== null && (
                                          <Badge
                                            className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                                              record.parq_requires_consultation
                                                ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-50"
                                                : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                                            }`}
                                          >
                                            PAR-Q: {record.parq_requires_consultation ? "Requiere Consulta" : "No Requiere Consulta"}
                                          </Badge>
                                        )}

                                      {!record.paq_classification &&
                                        !record.ipaq_classification &&
                                        (record.parq_requires_consultation === undefined ||
                                          record.parq_requires_consultation === null) &&
                                        (record.form_type?.toUpperCase() === "TAMIZAJE" ? (
                                          <Badge className="w-fit rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                                            Tamizaje registrado
                                          </Badge>
                                        ) : (
                                          <span className="text-xs font-medium text-slate-400">Sin resultado</span>
                                        ))}
                                    </div>
                                  </TableCell>

                                  <TableCell className="py-3">
                                    <div className="flex flex-col items-start gap-1.5">
                                      <Badge
                                        variant={getStatusBadgeVariant(record.status)}
                                        className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${getStatusBadgeClassName(record.status)}`}
                                      >
                                        {record.status}
                                      </Badge>

                                      {record.status === "Pruebas Asignadas Asistente" ? (
                                        <Badge className="w-fit rounded-full border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-50">
                                          {getAssignedTestName(record) || "Prueba no identificada"}
                                        </Badge>
                                      ) : record.status === "Nueva" ? (
                                        <Badge className="w-fit rounded-full border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                                          Sin prueba asignada
                                        </Badge>
                                      ) : getAssignedTestName(record) ? (
                                        <Badge className="w-fit rounded-full border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-50">
                                          {getAssignedTestName(record)}
                                        </Badge>
                                      ) : null}
                                    </div>
                                  </TableCell>

                                  <TableCell className="py-3 pr-5 text-right">
                                    <Button
                                      variant="outline"
                                      size="default"
                                      asChild
                                      className="h-9 min-w-[112px] rounded-xl border-blue-200 bg-white px-5 text-sm font-semibold text-primary shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-primary hover:shadow"
                                    >
                                      <Link
                                        href={`/evaluations/${record.id}`}
                                        className="inline-flex items-center justify-center gap-2"
                                      >
                                        <Eye className="h-4 w-8" />
                                        Ver
                                      </Link>
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={6} className="py-14 text-center">
                                <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 px-6 py-8">
                                  <Search className="h-9 w-9 text-slate-400" />
                                  <p className="mt-3 text-sm font-semibold text-slate-700">
                                    {isSearchMode
                                      ? `No se encontraron evaluaciones que coincidan con "${searchTerm}"`
                                      : evaluationRecords.length === 0
                                      ? "No hay evaluaciones pendientes."
                                      : "No hay evaluaciones que coincidan con su búsqueda."}
                                  </p>
                                  {isSearchMode && (
                                    <Button
                                      type="button"
                                      variant="link"
                                      onClick={handleClearSearch}
                                      className="mt-1 h-auto p-0 text-primary"
                                    >
                                      Limpiar búsqueda
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>

                    {!isSearchMode && totalPages > 1 && (
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1 || isLoadingRecords}
                          className="rounded-xl"
                        >
                          <ChevronLeft className="mr-1 h-4 w-4" />
                          Anterior
                        </Button>

                        {getPageNumbers().map((page, index) =>
                          page === "..." ? (
                            <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
                              ...
                            </span>
                          ) : (
                            <Button
                              key={`page-${page}`}
                              variant={page === currentPage ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page as number)}
                              disabled={isLoadingRecords}
                              className="rounded-xl"
                            >
                              {page}
                            </Button>
                          )
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages || isLoadingRecords}
                          className="rounded-xl"
                        >
                          Siguiente
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        {!isSearchMode && totalRecords > 0 && (
                          <p className="text-sm text-slate-500">
                            Mostrando {((currentPage - 1) * recordsPerPage) + 1} a {" "}
                            {Math.min(currentPage * recordsPerPage, totalRecords)} de {totalRecords} registros
                          </p>
                        )}

                        {isSearchMode && (
                          <p className="text-sm text-slate-500">
                            Mostrando {filteredRecords.length} {filteredRecords.length === 1 ? "resultado" : "resultados"}
                          </p>
                        )}
                      </div>

                      <Button
                        onClick={handleRefresh}
                        disabled={isLoadingRecords}
                        variant="outline"
                        className="h-10 rounded-xl bg-white shadow-sm"
                      >
                        <RefreshCw
                          className={`mr-2 h-4 w-4 ${isLoadingRecords ? "animate-spin" : ""}`}
                        />
                        Actualizar Lista
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </AuthWrapper>
  );
}
