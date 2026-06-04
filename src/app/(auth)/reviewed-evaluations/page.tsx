"use client";

import AuthWrapper from "@/components/auth/AuthWrapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useEvaluationContext } from "@/contexts/EvaluationContext";
import { useToast } from "@/hooks/use-toast";
import { EvaluationMode, EvaluationRecord } from "@/lib/types";
import { format, isValid } from "date-fns";
import { es } from "date-fns/locale";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  FileCheck2,
  FileText,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function ReviewedEvaluationsPage() {
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

  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const { toast } = useToast();
  const { selectedRole } = useAuth();

  useEffect(() => {
    fetchRecordsByPage(1, "completada");
  }, [fetchRecordsByPage]);

  useEffect(() => {
    if (searchTerm.trim()) {
      setIsSearchMode(true);
      fetchRecords();
    } else {
      setIsSearchMode(false);
      fetchRecordsByPage(currentPage, "completada");
    }
  }, [searchTerm, fetchRecords, fetchRecordsByPage, currentPage]);

  const totalPages = isSearchMode
    ? 1
    : Math.ceil(totalRecords / recordsPerPage);

  const handleRefresh = async () => {
    if (isSearchMode) {
      await fetchRecords();
    } else {
      await fetchRecordsByPage(currentPage, "completada");
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

  function getEvaluationRoute(mode: EvaluationMode, id: string | number): string {
    const evaluationRoutes: Record<EvaluationMode, string> = {
      "2C_Slaughter": `/assistant/tests/2componentes/ninos`,
      "2C_DurninWomersley": `/assistant/tests/2componentes/adultos`,
      "2C_Faulkner": `/assistant/tests/2componentes/deportistas/faulkner`,
      "2C_Carter": `/assistant/tests/2componentes/deportistas/carter`,
      "2C_Weltman": `/assistant/tests/2componentes/obesos`,
      "MULT_Express": `/assistant/tests/express`,
      "MULT_Restringido": `/assistant/tests/restringido`,
      "MULT_5Componentes": `/assistant/tests/5componentes`,
      "MULT_Completo": `/assistant/tests/completo`,
    };

    return `${evaluationRoutes[mode]}/${id}`;
  }

  const getEvaluationModeName = (mode?: string | null) => {
    const names: Record<string, string> = {
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

    if (!mode) return "Sin perfil";
    return names[mode] ?? mode;
  };

  const getFormTypeName = (formType?: string | null) => {
    if (!formType) return "Sin formulario";
    return formType.replace(/_/g, " ").toUpperCase();
  };

  const getInitials = (record: EvaluationRecord) => {
    const first = record.participantData?.first_name?.trim()?.[0] ?? "";
    const last = record.participantData?.last_name?.trim()?.[0] ?? "";
    const initials = `${first}${last}`.toUpperCase();
    return initials || "EV";
  };

  const getParticipantName = (record: EvaluationRecord) => {
    const firstName = record.participantData?.first_name ?? "";
    const lastName = record.participantData?.last_name ?? "";
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || "Participante sin nombre";
  };

  const getStatusClasses = (status: EvaluationRecord["status"]) => {
    switch (status) {
      case "Completada":
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
      case "Nueva":
        return "border-blue-200 bg-blue-50 text-blue-700";
      case "Pendiente Revisión Evaluador":
        return "border-amber-200 bg-amber-50 text-amber-700";
      case "Pruebas Asignadas Asistente":
        return "border-violet-200 bg-violet-50 text-violet-700";
      case "Resultados Parciales":
        return "border-orange-200 bg-orange-50 text-orange-700";
      default:
        return "border-slate-200 bg-slate-50 text-slate-600";
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

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

    return pages;
  };

  const filteredRecords = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return evaluationRecords
      .filter((record) => {
        if (record.status !== "Completada") return false;
        if (!term) return true;

        return (
          (record.participantData?.first_name ?? "")
            .toLowerCase()
            .includes(term) ||
          (record.participantData?.last_name ?? "").toLowerCase().includes(term) ||
          (record.participantData?.id_number ?? "").includes(searchTerm) ||
          (record.form_type ?? "").toLowerCase().includes(term) ||
          (record.evaluation_mode ?? "").toLowerCase().includes(term) ||
          getEvaluationModeName(record.evaluation_mode).toLowerCase().includes(term) ||
          (record.status ?? "").toLowerCase().includes(term)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.submission_date).getTime() -
          new Date(a.submission_date).getTime()
      );
  }, [evaluationRecords, searchTerm]);

  const handlePageChange = async (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && !isSearchMode) {
      await fetchRecordsByPage(page, "completada");
    }
  };

  return (
    <AuthWrapper allowedRoles={["Evaluator", "Assistant"]}>
      <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-slate-50 via-white to-blue-50/40 px-3 pb-2 pt-0 sm:px-4 lg:px-5">
        <div className="mx-auto -mt-8 max-w-[1600px] space-y-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push("/dashboard");
              }
            }}
            className="h-10 rounded-2xl border-pink-200 bg-white/95 px-5 text-pink-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 hover:shadow-md"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>

          <Card className="overflow-hidden rounded-[1.6rem] border-slate-200/80 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
            <CardHeader className="relative px-6 py-4 sm:px-7">
              <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-[4rem] bg-blue-50" />
              <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
                    <FileCheck2 className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                      >
                        <Sparkles className="mr-1 h-3 w-3" /> Historial
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                      >
                        {isSearchMode
                          ? `${filteredRecords.length} resultados`
                          : `${totalRecords} registros`}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl font-black tracking-tight text-slate-950 sm:text-[1.65rem]">
                      Evaluaciones Completadas
                    </CardTitle>
                    <CardDescription className="mt-1 max-w-3xl text-sm text-slate-600 sm:text-[0.95rem]">
                      Consulta, revisa y continúa los registros finalizados que ya contienen resultados.
                    </CardDescription>
                  </div>
                </div>

                <Button
                  onClick={handleRefresh}
                  disabled={isLoadingRecords}
                  className="h-10 rounded-2xl bg-blue-600 px-5 font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl"
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${isLoadingRecords ? "animate-spin" : ""}`}
                  />
                  Actualizar
                </Button>
              </div>
            </CardHeader>
          </Card>

          <Card className="overflow-hidden rounded-[1.6rem] border-slate-200/80 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            <CardHeader className="border-b border-slate-100 px-6 py-4 sm:px-7">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <CardTitle className="text-2xl font-black text-slate-950">
                    Lista de Envíos
                    <span className="ml-2 text-base font-normal text-slate-500">
                      {isSearchMode
                        ? `(${filteredRecords.length} ${
                            filteredRecords.length === 1 ? "resultado" : "resultados"
                          })`
                        : `(${totalRecords} ${
                            totalRecords === 1 ? "registro" : "registros"
                          } total)`}
                    </span>
                  </CardTitle>
                  <CardDescription className="mt-1 text-sm text-slate-500">
                    Ordenadas por fecha de envío, de la más reciente a la más antigua.
                  </CardDescription>
                </div>

                <div className="relative w-full xl:w-[430px]">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="search"
                    placeholder="Buscar por nombre, documento, formulario o prueba..."
                    className="h-11 rounded-2xl border-slate-200 bg-slate-50/70 pl-11 pr-10 text-sm shadow-inner focus-visible:ring-blue-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {isSearchMode && (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  <Search className="h-4 w-4" />
                  <span>Buscando en todos los registros completados.</span>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleClearSearch}
                    className="h-auto p-0 font-semibold text-blue-700"
                  >
                    Limpiar búsqueda
                  </Button>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-0">
              {isLoadingRecords ? (
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-600">
                    <RefreshCw className="h-8 w-8 animate-spin" />
                  </div>
                  <p className="font-semibold text-slate-900">Cargando evaluaciones...</p>
                  <p className="mt-1 text-sm text-slate-500">Un momento mientras se actualiza la información.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto px-6 pt-4">
                    <div className="overflow-hidden rounded-3xl border border-slate-200">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/90 hover:bg-slate-50">
                            <TableHead className="h-12 text-xs font-black uppercase tracking-wide text-slate-500">
                              Participante
                            </TableHead>
                            <TableHead className="h-12 text-xs font-black uppercase tracking-wide text-slate-500">
                              Fecha envío
                            </TableHead>
                            <TableHead className="h-12 text-xs font-black uppercase tracking-wide text-slate-500">
                              Perfil de prueba
                            </TableHead>
                            <TableHead className="h-12 text-xs font-black uppercase tracking-wide text-slate-500">
                              Tipo formulario
                            </TableHead>
                            <TableHead className="h-12 text-xs font-black uppercase tracking-wide text-slate-500">
                              Resultado cuestionario
                            </TableHead>
                            <TableHead className="h-12 text-xs font-black uppercase tracking-wide text-slate-500">
                              Estado
                            </TableHead>
                            <TableHead className="h-12 text-right text-xs font-black uppercase tracking-wide text-slate-500">
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
                              const hasEvaluationMode = Boolean(record.evaluation_mode);

                              return (
                                <TableRow
                                  key={record.id}
                                  className="border-slate-100 transition hover:bg-blue-50/30"
                                >
                                  <TableCell className="py-3.5">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm font-black text-slate-700 shadow-sm">
                                        {getInitials(record)}
                                      </div>
                                      <div>
                                        <p className="font-black leading-tight text-slate-950">
                                          {getParticipantName(record)}
                                        </p>
                                        <p className="mt-1 text-xs font-medium text-slate-500">
                                          ID: {record.participantData?.id_number || "Sin documento"}
                                        </p>
                                      </div>
                                    </div>
                                  </TableCell>

                                  <TableCell className="whitespace-nowrap py-3.5 text-slate-600">
                                    {submissionDateObject && isValid(submissionDateObject)
                                      ? format(submissionDateObject, "dd MMM yyyy, HH:mm", {
                                          locale: es,
                                        })
                                      : "Sin fecha"}
                                  </TableCell>

                                  <TableCell className="py-3.5">
                                    <Badge
                                      variant="outline"
                                      className="w-fit border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-700"
                                    >
                                      {getEvaluationModeName(record.evaluation_mode)}
                                    </Badge>
                                  </TableCell>

                                  <TableCell className="py-3.5">
                                    <Badge
                                      variant="outline"
                                      className="w-fit border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
                                    >
                                      {getFormTypeName(record.form_type)}
                                    </Badge>
                                  </TableCell>

                                  <TableCell className="py-3.5">
                                    <div className="flex flex-col gap-1.5">
                                      {record.paq_classification && (
                                        <Badge
                                          variant="outline"
                                          className="flex w-fit items-center border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
                                        >
                                          <BarChart3 className="mr-1 h-3 w-3" /> PAQ: {record.paq_classification}
                                        </Badge>
                                      )}

                                      {record.ipaq_classification && (
                                        <Badge
                                          variant="outline"
                                          className="flex w-fit items-center border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700"
                                        >
                                          <BarChart3 className="mr-1 h-3 w-3" /> IPAQ: {record.ipaq_classification}
                                        </Badge>
                                      )}

                                      {record.parq_requires_consultation !== undefined &&
                                        record.parq_requires_consultation !== null && (
                                          <Badge
                                            variant="outline"
                                            className={`w-fit px-3 py-1 text-xs font-bold ${
                                              record.parq_requires_consultation
                                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                                : "border-emerald-200 bg-emerald-50 text-emerald-700"
                                            }`}
                                          >
                                            PAR-Q: {record.parq_requires_consultation
                                              ? "Requiere Consulta"
                                              : "No Requiere Consulta"}
                                          </Badge>
                                        )}

                                      {!record.paq_classification &&
                                        !record.ipaq_classification &&
                                        (record.parq_requires_consultation === undefined ||
                                          record.parq_requires_consultation === null) && (
                                          <Badge
                                            variant="outline"
                                            className="w-fit border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500"
                                          >
                                            Sin resultado
                                          </Badge>
                                        )}
                                    </div>
                                  </TableCell>

                                  <TableCell className="py-3.5">
                                    <Badge
                                      variant="outline"
                                      className={`w-fit px-3 py-1 text-xs font-bold ${getStatusClasses(record.status)}`}
                                    >
                                      <CheckCircle2 className="mr-1 h-3 w-3" />
                                      {record.status}
                                    </Badge>
                                  </TableCell>

                                  <TableCell className="py-3.5 text-right">
                                    <div className="flex justify-end gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                        className="h-10 rounded-2xl border-blue-200 bg-white px-5 font-bold text-blue-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 hover:shadow-md"
                                      >
                                        <Link
                                          href={record.evaluation_mode?.startsWith("2C")
                                            ? `/evaluations/2componentes/${record.id}`
                                            : `/evaluations/${record.id}`}
                                        >
                                          <Eye className="mr-2 h-4 w-4" /> Ver
                                        </Link>
                                      </Button>

                                      {selectedRole === "Assistant" && hasEvaluationMode && (
                                        <Button
                                          variant="default"
                                          size="sm"
                                          asChild
                                          className="h-10 rounded-2xl bg-slate-900 px-5 font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
                                        >
                                          <Link
                                            href={getEvaluationRoute(
                                              record.evaluation_mode as EvaluationMode,
                                              record.id
                                            )}
                                          >
                                            <Edit className="mr-2 h-4 w-4" /> Editar
                                          </Link>
                                        </Button>
                                      )}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} className="py-14 text-center">
                                <div className="mx-auto flex max-w-md flex-col items-center">
                                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-50 text-slate-400">
                                    <FileText className="h-8 w-8" />
                                  </div>
                                  <p className="font-bold text-slate-900">
                                    {isSearchMode
                                      ? `No se encontraron evaluaciones para "${searchTerm}"`
                                      : "No hay evaluaciones completadas."}
                                  </p>
                                  <p className="mt-1 text-sm text-slate-500">
                                    Ajusta la búsqueda o actualiza la lista para revisar nuevos registros.
                                  </p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {!isSearchMode && totalPages > 1 && (
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2 px-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || isLoadingRecords}
                        className="h-10 rounded-2xl border-slate-200 px-4"
                      >
                        <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
                      </Button>

                      {getPageNumbers().map((page, index) =>
                        page === "..." ? (
                          <span
                            key={`ellipsis-${index}`}
                            className="px-2 text-sm text-slate-400"
                          >
                            ...
                          </span>
                        ) : (
                          <Button
                            key={`page-${page}`}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page as number)}
                            disabled={isLoadingRecords}
                            className={`h-10 w-10 rounded-2xl p-0 font-bold ${
                              page === currentPage
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
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
                        className="h-10 rounded-2xl border-slate-200 px-4"
                      >
                        Siguiente <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 px-7 py-4 sm:flex-row sm:items-center sm:justify-between">
                    {!isSearchMode && totalRecords > 0 && (
                      <p className="text-sm font-medium text-slate-500">
                        Mostrando {((currentPage - 1) * recordsPerPage) + 1} a {" "}
                        {Math.min(currentPage * recordsPerPage, totalRecords)} de {totalRecords} registros
                      </p>
                    )}

                    {isSearchMode && (
                      <p className="text-sm font-medium text-slate-500">
                        Mostrando {filteredRecords.length} {filteredRecords.length === 1 ? "resultado" : "resultados"}
                      </p>
                    )}

                    <Button
                      onClick={handleRefresh}
                      disabled={isLoadingRecords}
                      variant="outline"
                      className="h-11 rounded-2xl border-blue-200 px-5 font-bold text-blue-600 hover:bg-blue-50 hover:text-blue-700 sm:ml-auto"
                    >
                      <RefreshCw
                        className={`mr-2 h-4 w-4 ${isLoadingRecords ? "animate-spin" : ""}`}
                      />
                      Actualizar lista
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthWrapper>
  );
}
