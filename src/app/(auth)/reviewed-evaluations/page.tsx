// "use client";

// import AuthWrapper from "@/components/auth/AuthWrapper";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { useEvaluationContext } from "@/contexts/EvaluationContext";
// import { Badge } from "@/components/ui/badge";
// import {
//   Eye,
//   Download,
//   FileText,
//   RefreshCw,
//   Search,
//   Loader2,
//   Pencil,
//   BarChart3,
//   ClipboardCheck,
//   ChevronLeft,
//   ChevronRight,
//   Edit,
// } from "lucide-react";
// import Link from "next/link";
// import { useState, useEffect, useMemo, useCallback } from "react";
// import { format, isValid } from "date-fns";
// import { es } from "date-fns/locale";
// import { Input } from "@/components/ui/input";
// import { useAuth } from "@/contexts/AuthContext";
// import { useToast } from "@/hooks/use-toast";
// import { EvaluationMode, EvaluationRecord } from "@/lib/types";

// export default function ReviewedEvaluationsPage() {

//   const {
//     evaluationRecords,
//     fetchRecordsByPage,
//     fetchRecords,
//     isLoadingRecords,
//     currentPage,
//     totalRecords,
//     recordsPerPage,
//   } = useEvaluationContext();

//   const [searchTerm, setSearchTerm] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const { toast } = useToast();
//   const { selectedRole } = useAuth();

//   // Cargar la primera página al montar el componente
//   useEffect(() => {
//     fetchRecordsByPage(1, "completada");
//   }, [fetchRecordsByPage]);

//   const handleRefresh = async () => {
//     await fetchRecordsByPage(currentPage, "completada");
//     toast({
//       title: "Lista actualizada",
//       description: "Los registros se han actualizado correctamente.",
//     });
//   };



//   function getEvaluationRoute(
//     mode: EvaluationMode,
//     id: string | number
//   ): string {
//     const evaluationRoutes: Record<EvaluationMode, string> = {
//       "2C_Slaughter": `/assistant/tests/2componentes/ninos`,
//       "2C_DurninWomersley": `/assistant/tests/2componentes/adultos`,
//       "2C_Faulkner": `/assistant/tests/2componentes/deportistas/faulkner`,
//       "2C_Carter": `/assistant/tests/2componentes/deportistas/carter`,
//       "2C_Weltman": `/assistant/tests/2componentes/obesos`,
//       "MULT_Express": `/assistant/tests/express`,
//       "MULT_Restringido": `/assistant/tests/restringido`,
//       "MULT_5Componentes": `/assistant/tests/5componentes`,
//       "MULT_Completo": `/assistant/tests/completo`,
//     };

//     return `${evaluationRoutes[mode]}/${id}`;
//   }




//   const getStatusBadgeVariant = (status: EvaluationRecord["status"]) => {
//     switch (status) {
//       case "Nueva":
//         return "default";
//       case "Pendiente Revisión Evaluador":
//         return "secondary";
//       case "Pruebas Asignadas Asistente":
//         return "outline";
//       case "Resultados Parciales":
//         return "destructive";
//       default:
//         return "default";
//     }
//   };

//   // Generar los números de página para mostrar
//   const getPageNumbers = () => {
//     const pages: (number | string)[] = [];
//     const maxVisible = 5;

//     if (totalPages <= maxVisible) {
//       // Mostrar todas las páginas si son pocas
//       for (let i = 1; i <= totalPages; i++) {
//         pages.push(i);
//       }
//     } else {
//       // Lógica para mostrar páginas con puntos suspensivos
//       if (currentPage <= 3) {
//         for (let i = 1; i <= 4; i++) pages.push(i);
//         pages.push('...');
//         pages.push(totalPages);
//       } else if (currentPage >= totalPages - 2) {
//         pages.push(1);
//         pages.push('...');
//         for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
//       } else {
//         pages.push(1);
//         pages.push('...');
//         for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
//         pages.push('...');
//         pages.push(totalPages);
//       }
//     }

//     return pages;
//   };

//   // Filtrado del lado del cliente sobre los registros ya paginados del servidor

//   const filteredRecords = useMemo(() => {
//     return evaluationRecords
//       .filter(
//         (record) =>
//           record.status === "Completada" &&
//           ((record.participantData?.first_name ?? "")
//             .toLowerCase()
//             .includes(searchTerm.toLowerCase()) ||
//             (record.participantData?.last_name ?? "")
//               .toLowerCase()
//               .includes(searchTerm.toLowerCase()) ||
//             (record.participantData?.id_number ?? "").includes(searchTerm) ||
//             (record.form_type ?? "")
//               .toLowerCase()
//               .includes(searchTerm.toLowerCase()) ||
//             (record.status ?? "")
//               .toLowerCase()
//               .includes(searchTerm.toLowerCase()))
//       )
//       .sort(
//         (a, b) =>
//           new Date(b.submission_date).getTime() -
//           new Date(a.submission_date).getTime()
//       );
//   }, [evaluationRecords, searchTerm]);

//   // Calcular el total de páginas basado en el total de registros del servidor
//   const totalPages = Math.ceil(totalRecords / recordsPerPage);

//   const handlePageChange = async (page: number) => {
//     if (page >= 1 && page <= totalPages && page !== currentPage) {
//       await fetchRecordsByPage(page, "completada");
//     }
//   };


//   return (
//     <AuthWrapper allowedRoles={["Evaluator", "Assistant"]}>
//       <div className="space-y-6">
//         <Card className="shadow-lg">
//           <CardHeader>
//             <CardTitle className="text-3xl font-headline flex items-center">
//               <FileText className="mr-3 h-8 w-8 text-primary" /> Historial de
//               Evaluaciones Completadas
//             </CardTitle>
//             <CardDescription>
//               Consulta los registros de evaluaciones que han sido finalizadas y
//               contienen resultados.
//             </CardDescription>
//           </CardHeader>
//         </Card>

//         <Card className="shadow-xl">
//           <CardHeader>
//             <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
//               <CardTitle className="text-xl">
//                 Lista de Envíos
//                 {totalRecords > 0 && (
//                   <span className="ml-2 text-sm font-normal text-muted-foreground">
//                     ({totalRecords} {totalRecords === 1 ? 'registro' : 'registros'} total)
//                   </span>
//                 )}
//               </CardTitle>
//               <div className="relative w-full sm:w-auto">
//                 <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//                 <Input
//                   type="search"
//                   placeholder="Buscar evaluaciones..."
//                   className="pl-8 w-full sm:w-[250px] lg:w-[300px]"
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                 />
//               </div>
//             </div>
//           </CardHeader>
//           <CardContent>
//             {isLoadingRecords ? (
//               <div className="text-center py-12">
//                 <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
//                 <p className="mt-4 text-muted-foreground">Cargando evaluaciones...</p>
//               </div>
//             ) : (
//               <>
//                 <Table>
//                   <TableHeader>
//                     <TableRow>
//                       <TableHead>Participante</TableHead>
//                       <TableHead>Fecha Envío</TableHead>
//                       <TableHead>Perfil de Prueba</TableHead>
//                       <TableHead>Tipo Formulario</TableHead>
//                       <TableHead>Resultado Cuestionario</TableHead>
//                       <TableHead>Estado</TableHead>
//                       <TableHead className="text-right">Acciones</TableHead>
//                     </TableRow>
//                   </TableHeader>
//                   <TableBody>
//                     {filteredRecords.length > 0 ? (
//                       filteredRecords.map((record) => {
//                         const submissionDateObject = record.submission_date
//                           ? new Date(record.submission_date)
//                           : null;
//                         return (
//                           <TableRow key={record.id} className="hover:bg-muted/50">
//                             <TableCell>
//                               {record.participantData?.first_name}{" "}
//                               {record.participantData?.last_name}
//                             </TableCell>
//                             <TableCell>
//                               {submissionDateObject && isValid(submissionDateObject)
//                                 ? format(submissionDateObject, "dd MMM yyyy, HH:mm", {
//                                   locale: es,
//                                 })
//                                 : "N/A"}
//                             </TableCell>
//                             <TableCell>{record.evaluation_mode}</TableCell>
//                             <TableCell>{record.form_type}</TableCell>
//                             <TableCell>
//                               <div className="flex flex-col gap-1">
//                                 {record.paq_classification && (
//                                   <Badge variant="secondary" className="flex items-center w-fit">
//                                     <BarChart3 className="mr-1 h-3 w-3" /> PAQ:{" "}
//                                     {record.paq_classification}
//                                   </Badge>
//                                 )}
//                                 {record.ipaq_classification && (
//                                   <Badge variant="secondary" className="flex items-center w-fit">
//                                     <BarChart3 className="mr-1 h-3 w-3" /> IPAQ:{" "}
//                                     {record.ipaq_classification}
//                                   </Badge>
//                                 )}
//                                 {record.parq_requires_consultation !== undefined &&
//                                   record.parq_requires_consultation !== null && (
//                                     <Badge
//                                       variant={
//                                         record.parq_requires_consultation
//                                           ? "destructive"
//                                           : "outline"
//                                       }
//                                       className="text-xs w-fit"
//                                     >
//                                       PAR-Q:{" "}
//                                       {record.parq_requires_consultation
//                                         ? "Requiere Consulta"
//                                         : "No Requiere Consulta"}
//                                     </Badge>
//                                   )}
//                                 {!record.paq_classification &&
//                                   !record.ipaq_classification &&
//                                   (record.parq_requires_consultation === undefined ||
//                                     record.parq_requires_consultation === null) && (
//                                     <span className="text-xs text-muted-foreground">N/A</span>
//                                   )}
//                               </div>
//                             </TableCell>
//                             <TableCell>
//                               <Badge variant={getStatusBadgeVariant(record.status)}>
//                                 {record.status}
//                               </Badge>
//                             </TableCell>
//                             <TableCell className="text-right space-x-2">
//                               <Button
//                                 variant="outline"
//                                 size="sm"
//                                 asChild
//                                 className="text-primary border-primary hover:bg-primary/10 hover:text-primary"
//                               >
//                                 <Link
//                                   href={record.evaluation_mode?.startsWith("2C")
//                                     ? `/evaluations/2componentes/${record.id}`
//                                     : `/evaluations/${record.id}`}
//                                 >
//                                   <Eye className="mr-1 h-4 w-4" /> Ver
//                                 </Link>
//                               </Button>

//                               {selectedRole === "Assistant" && (
//                                 <Button
//                                   variant="default"
//                                   size="sm"
//                                   asChild
//                                   className="bg-accent text-accent-foreground hover:bg-accent/90"
//                                 >
//                                   <Link href={getEvaluationRoute(record.evaluation_mode!, record.id)}>
//                                     <Edit className="mr-1 h-4 w-4" /> Editar
//                                   </Link>
//                                 </Button>
//                               )}




//                             </TableCell>
//                           </TableRow>
//                         );
//                       })
//                     ) : (
//                       <TableRow>
//                         <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
//                           {evaluationRecords.length === 0
//                             ? "No hay evaluaciones pendientes."
//                             : "No hay evaluaciones que coincidan con su búsqueda."}
//                         </TableCell>
//                       </TableRow>
//                     )}
//                   </TableBody>
//                 </Table>

//                 {/* Controles de paginación */}
//                 {totalPages > 1 && searchTerm.trim() === "" && (
//                   <div className="mt-6 flex justify-center items-center gap-2">
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => handlePageChange(currentPage - 1)}
//                       disabled={currentPage === 1 || isLoadingRecords}
//                     >
//                       <ChevronLeft className="h-4 w-4" /> Anterior
//                     </Button>

//                     {getPageNumbers().map((page, index) => (
//                       page === '...' ? (
//                         <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
//                           ...
//                         </span>
//                       ) : (
//                         <Button
//                           key={`page-${page}`}
//                           variant={page === currentPage ? "default" : "outline"}
//                           size="sm"
//                           onClick={() => handlePageChange(page as number)}
//                           disabled={isLoadingRecords}
//                         >
//                           {page}
//                         </Button>
//                       )
//                     ))}

//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => handlePageChange(currentPage + 1)}
//                       disabled={currentPage === totalPages || isLoadingRecords}
//                     >
//                       Siguiente <ChevronRight className="h-4 w-4" />
//                     </Button>
//                   </div>
//                 )}

//                 <div className="mt-6 flex justify-between items-center">

//                   {searchTerm.trim() === "" ? (
//                     <p className="text-sm text-muted-foreground">
//                       Mostrando {((currentPage - 1) * recordsPerPage) + 1} a{" "}
//                       {Math.min(currentPage * recordsPerPage, totalRecords)} de {totalRecords} registros
//                     </p>
//                   ) : (
//                     <p className="text-sm text-muted-foreground">
//                       {filteredRecords.length} resultado(s) encontrados
//                     </p>
//                   )}

//                   <Button onClick={handleRefresh} disabled={isLoadingRecords} className="ml-auto">
//                     <RefreshCw
//                       className={`mr-2 h-4 w-4 ${isLoadingRecords ? "animate-spin" : ""}`}
//                     />
//                     Actualizar Lista
//                   </Button>
//                 </div>
//               </>
//             )}
//           </CardContent>
//         </Card>
//       </div>
//     </AuthWrapper>
//   );
// }

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
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Download,
  FileText,
  RefreshCw,
  Search,
  Loader2,
  Pencil,
  BarChart3,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Edit,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";
import { format, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { EvaluationMode, EvaluationRecord } from "@/lib/types";

export default function ReviewedEvaluationsPage() {

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
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { selectedRole } = useAuth();

  // Cargar la primera página al montar el componente
  useEffect(() => {
    fetchRecordsByPage(1, "completada");
  }, [fetchRecordsByPage]);

  // Cuando hay búsqueda, cargar todos los registros
  useEffect(() => {
    if (searchTerm.trim()) {
      setIsSearchMode(true);
      fetchRecords();
    } else {
      setIsSearchMode(false);
      // Si se limpia la búsqueda, volver a la página actual
      fetchRecordsByPage(currentPage, "completada");
    }
  }, [searchTerm]);

  const handleRefresh = async () => {
    if (isSearchMode) {
      fetchRecords();
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

  function getEvaluationRoute(
    mode: EvaluationMode,
    id: string | number
  ): string {
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

  // Generar los números de página para mostrar
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
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Filtrado del lado del cliente
  const filteredRecords = useMemo(() => {
    return evaluationRecords
      .filter(
        (record) =>
          record.status === "Completada" &&
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
            (record.evaluation_mode ?? "")
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

  // Calcular el total de páginas
  const totalPages = isSearchMode ? 1 : Math.ceil(totalRecords / recordsPerPage);

  const handlePageChange = async (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage && !isSearchMode) {
      await fetchRecordsByPage(page, "completada");
    }
  };

  return (
    <AuthWrapper allowedRoles={["Evaluator", "Assistant"]}>
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-headline flex items-center">
              <FileText className="mr-3 h-8 w-8 text-primary" /> Historial de
              Evaluaciones Completadas
            </CardTitle>
            <CardDescription>
              Consulta los registros de evaluaciones que han sido finalizadas y
              contienen resultados.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <CardTitle className="text-xl">
                Lista de Envíos
                {!isSearchMode && totalRecords > 0 && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({totalRecords} {totalRecords === 1 ? 'registro' : 'registros'} total)
                  </span>
                )}
                {isSearchMode && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({filteredRecords.length} {filteredRecords.length === 1 ? 'resultado' : 'resultados'})
                  </span>
                )}
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
          <CardContent>
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
                      <TableHead>Perfil de Prueba</TableHead>
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
                            <TableCell>{record.evaluation_mode}</TableCell>
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
                                size="sm"
                                asChild
                                className="text-primary border-primary hover:bg-primary/10 hover:text-primary"
                              >
                                <Link
                                  href={record.evaluation_mode?.startsWith("2C")
                                    ? `/evaluations/2componentes/${record.id}`
                                    : `/evaluations/${record.id}`}
                                >
                                  <Eye className="mr-1 h-4 w-4" /> Ver
                                </Link>
                              </Button>

                              {selectedRole === "Assistant" && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  asChild
                                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                                >
                                  <Link href={getEvaluationRoute(record.evaluation_mode!, record.id)}>
                                    <Edit className="mr-1 h-4 w-4" /> Editar
                                  </Link>
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          {isSearchMode
                            ? `No se encontraron evaluaciones que coincidan con "${searchTerm}"`
                            : evaluationRecords.length === 0
                            ? "No hay evaluaciones completadas."
                            : "No hay evaluaciones que coincidan con su búsqueda."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Controles de paginación - solo visible cuando NO está en modo búsqueda */}
                {!isSearchMode && totalPages > 1 && (
                  <div className="mt-6 flex justify-center items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || isLoadingRecords}
                    >
                      <ChevronLeft className="h-4 w-4" /> Anterior
                    </Button>

                    {getPageNumbers().map((page, index) => (
                      page === '...' ? (
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
                    ))}

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

                <div className="mt-6 flex justify-between items-center">
                  {!isSearchMode && totalRecords > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Mostrando {((currentPage - 1) * recordsPerPage) + 1} a{" "}
                      {Math.min(currentPage * recordsPerPage, totalRecords)} de {totalRecords} registros
                    </p>
                  )}
                  {isSearchMode && (
                    <p className="text-sm text-muted-foreground">
                      Mostrando {filteredRecords.length} {filteredRecords.length === 1 ? 'resultado' : 'resultados'}
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
    </AuthWrapper>
  );
}