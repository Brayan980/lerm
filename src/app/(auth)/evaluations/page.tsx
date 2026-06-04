"use client";

import AuthWrapper from "@/components/auth/AuthWrapper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useEvaluationContext } from "@/contexts/EvaluationContext";
import type { EvaluationRecord } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  RefreshCw,
  Search,
  ClipboardCheck,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  UserCheck,
  ArrowLeft,
  CalendarDays,
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

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
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
      href: "/register-data",
      icon: FileText,
    },
    {
      label: "Ver Completados",
      href: "/reviewed-evaluations",
      icon: UserCheck,
    },
    {
      label: "Ver Citas",
      href: "/appointments",
      icon: CalendarDays,
    },
  ];

  return (
    <AuthWrapper allowedRoles={["Evaluator"]}>
      <div className="relative -mt-6 flex items-start gap-4 bg-white sm:-mt-7 lg:-mt-8">
        <div className="w-72 shrink-0 self-stretch min-h-[calc(100vh-80px)] border-r border-slate-200 pr-3 bg-white">
          <div className="flex flex-col items-start gap-3 mb-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard")}
              className="h-10 rounded-xl border-pink-500 px-8 text-pink-500 hover:bg-pink-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>

            <aside className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-semibold text-slate-800">Menú</p>
                <p className="text-xs text-slate-500">Navegación rápida</p>
              </div>

              <div className="p-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 hover:bg-pink-50"
                    >
                      <div
                        className="
                          flex h-10 w-10 items-center justify-center rounded-xl
                          border border-slate-200 bg-slate-50
                          transition-all duration-200
                          group-hover:border-pink-200 group-hover:bg-white
                        "
                      >
                        <Icon className="h-5 w-5 text-primary" />
                      </div>

                      <div className="flex flex-col leading-tight">
                        <span className="text-sm font-medium text-slate-800">
                          {item.label}
                        </span>
                        <span className="text-xs text-slate-500">
                          Ir a esta sección
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </aside>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <Card className="shadow-lg">
            <CardHeader className="px-7 py-5">
              <CardTitle className="text-3xl font-headline flex items-center">
                <ListChecks className="mr-3 h-8 w-8 text-primary" />
                Evaluaciones Pendientes
              </CardTitle>
              <CardDescription>
                Revisa y gestiona los formularios enviados por los participantes
                que requieren acción.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="px-7 py-5">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <CardTitle className="text-xl">
                  Lista de Envíos
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({filteredRecords.length} {filteredRecords.length === 1 ? "registro" : "registros"} total)
                  </span>
                </CardTitle>

                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar en todas las evaluaciones..."
                    className="pl-8 pr-8 w-full sm:w-[250px] lg:w-[300px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <button
                      onClick={handleClearSearch}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {isSearchMode && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Search className="h-4 w-4" />
                  <span>Buscando en todos los registros...</span>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleClearSearch}
                    className="h-auto p-0"
                  >
                    Limpiar búsqueda
                  </Button>
                </div>
              )}
            </CardHeader>

            <CardContent className="px-7 pb-6 pt-0">
              {isLoadingRecords ? (
                <div className="text-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="mt-4 text-muted-foreground">Cargando evaluaciones...</p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Participante</TableHead>
                        <TableHead>Fecha Envío</TableHead>
                        <TableHead>Tipo Formulario</TableHead>
                        <TableHead>Resultado Cuestionario</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {filteredRecords.length > 0 ? (
                        filteredRecords.map((record) => {
                          const submissionDateObject = record.submission_date
                            ? new Date(record.submission_date)
                            : null;

                          return (
                            <TableRow key={record.id} className="hover:bg-muted/50">
                              <TableCell>
                                {record.participantData?.first_name}{" "}
                                {record.participantData?.last_name}
                              </TableCell>

                              <TableCell>
                                {submissionDateObject && isValid(submissionDateObject)
                                  ? format(submissionDateObject, "dd MMM yyyy, HH:mm", {
                                      locale: es,
                                    })
                                  : "N/A"}
                              </TableCell>

                              <TableCell>{record.form_type}</TableCell>

                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  {record.paq_classification && (
                                    <Badge variant="secondary" className="flex items-center w-fit">
                                      <BarChart3 className="mr-1 h-3 w-3" /> PAQ:{" "}
                                      {record.paq_classification}
                                    </Badge>
                                  )}

                                  {record.ipaq_classification && (
                                    <Badge variant="secondary" className="flex items-center w-fit">
                                      <BarChart3 className="mr-1 h-3 w-3" /> IPAQ:{" "}
                                      {record.ipaq_classification}
                                    </Badge>
                                  )}

                                  {record.parq_requires_consultation !== undefined &&
                                    record.parq_requires_consultation !== null && (
                                      <Badge
                                        variant={
                                          record.parq_requires_consultation
                                            ? "destructive"
                                            : "outline"
                                        }
                                        className="text-xs w-fit"
                                      >
                                        PAR-Q:{" "}
                                        {record.parq_requires_consultation
                                          ? "Requiere Consulta"
                                          : "No Requiere Consulta"}
                                      </Badge>
                                    )}

                                  {!record.paq_classification &&
                                    !record.ipaq_classification &&
                                    (record.parq_requires_consultation === undefined ||
                                      record.parq_requires_consultation === null) && (
                                      <span className="text-xs text-muted-foreground">N/A</span>
                                    )}
                                </div>
                              </TableCell>

                              <TableCell>
                                <Badge variant={getStatusBadgeVariant(record.status)}>
                                  {record.status}
                                </Badge>
                              </TableCell>

                              <TableCell className="text-right space-x-2">
                                <Button
                                    variant="outline"
                                    size="default"
                                    asChild
                                    className="h-10 min-w-[96px] px-12 text-sm font-semibold text-primary border-primary hover:bg-primary/10 hover:text-primary"
                                  >
                                    <Link
                                      href={`/evaluations/${record.id}`}
                                      className="inline-flex items-center justify-center gap-2"
                                    >
                                      <Eye className="h-4 w-4" />
                                      Ver
                                    </Link>
                                  </Button>

                                
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            {isSearchMode
                              ? `No se encontraron evaluaciones que coincidan con "${searchTerm}"`
                              : evaluationRecords.length === 0
                              ? "No hay evaluaciones pendientes."
                              : "No hay evaluaciones que coincidan con su búsqueda."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  {!isSearchMode && totalPages > 1 && (
                    <div className="mt-4 flex justify-center items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1 || isLoadingRecords}
                      >
                        <ChevronLeft className="h-4 w-4" /> Anterior
                      </Button>

                      {getPageNumbers().map((page, index) =>
                        page === "..." ? (
                          <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                            ...
                          </span>
                        ) : (
                          <Button
                            key={`page-${page}`}
                            variant={page === currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(page as number)}
                            disabled={isLoadingRecords}
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
                      >
                        Siguiente <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  <div className="mt-4 flex justify-between items-center">
                    {!isSearchMode && totalRecords > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Mostrando {((currentPage - 1) * recordsPerPage) + 1} a{" "}
                        {Math.min(currentPage * recordsPerPage, totalRecords)} de {totalRecords} registros
                      </p>
                    )}

                    {isSearchMode && (
                      <p className="text-sm text-muted-foreground">
                        Mostrando {filteredRecords.length} {filteredRecords.length === 1 ? "resultado" : "resultados"}
                      </p>
                    )}

                    <Button onClick={handleRefresh} disabled={isLoadingRecords} className="ml-auto">
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
        </div>
      </div>
    </AuthWrapper>
  );
}

const ListChecks = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="m16 20 4-4" />
    <path d="M8 20h2" />
    <path d="M10 14h.01" />
    <path d="M10 10h.01" />
    <path d="M10 6h.01" />
    <path d="M3 6h2" />
    <path d="M3 10h2" />
    <path d="M3 14h2" />
    <path d="M3 20h2" />
    <path d="m16 6-4 4-1-1" />
  </svg>
);
