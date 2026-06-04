
// "use client";

// import AuthWrapper from "@/components/auth/AuthWrapper";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { useEvaluationContext } from "@/contexts/EvaluationContext";
// import type { EvaluationRecord } from "@/lib/types";
// import { Badge } from "@/components/ui/badge";
// import { UserCheck, Settings2, RefreshCw, Search, TestTube2, Shapes } from "lucide-react"; 
// import Link from "next/link";
// import { useState, useEffect, useMemo } from "react";
// import { format, isValid } from "date-fns"; // Import isValid
// import { es } from "date-fns/locale";
// import { Input } from "@/components/ui/input";

// export default function AssistantPendingTestsPage() {
//   const { evaluationRecords, fetchRecords } = useEvaluationContext();
//   const [searchTerm, setSearchTerm] = useState("");
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     fetchRecords();
//   }, [fetchRecords]);

//   const handleRefresh = () => {
//     setIsLoading(true);
//     fetchRecords();
//     setTimeout(() => setIsLoading(false), 500);
//   };

//   const filteredRecords = useMemo(() => {
//     return evaluationRecords.filter(record =>
//       record.status === 'Pruebas Asignadas Asistente' &&
//       (
//         (record.participantData?.first_name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
//         (record.participantData?.last_name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
//         (record.participantData?.id_number ?? '').includes(searchTerm) ||
//         (record.id ?? '').toLowerCase().includes(searchTerm.toLowerCase())
//       )
//     ).sort((a, b) => new Date(b.submission_date).getTime() - new Date(a.submission_date).getTime());
//   }, [evaluationRecords, searchTerm]);

//   const getAssignedTestsString = (record: EvaluationRecord): string => {
//     const tests = [];
//     if (record.assigned_tests_config?.macroindices) tests.push("Macroíndices");
//     if (record.assigned_tests_config?.composicionCorporal) tests.push("Comp. Corporal");
//     if (record.assigned_tests_config?.somatotipo) tests.push("Somatotipo");
//     return tests.length > 0 ? tests.join(', ') : "Ninguna prueba asignada";
//   };

//   return (
//     <AuthWrapper allowedRoles={["Assistant"]}>
//       <div className="space-y-6">
//         <Card className="shadow-lg">
//           <CardHeader>
//             <CardTitle className="text-3xl font-headline flex items-center"><UserCheck className="mr-3 h-8 w-8 text-primary" /> Pruebas Pendientes (Asistente)</CardTitle>
//             <CardDescription>Lista de participantes con pruebas asignadas que requieren ser realizadas.</CardDescription>
//           </CardHeader>
//         </Card>

//         <Card className="shadow-md">
//           <CardHeader>
//             <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
//               <CardTitle className="text-xl">Participantes Asignados</CardTitle>
//               <div className="relative w-full sm:w-auto">
//                 <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//                 <Input
//                   type="search"
//                   placeholder="Buscar por nombre, ID..."
//                   className="pl-8 w-full sm:w-[250px] lg:w-[300px]"
//                   value={searchTerm}
//                   onChange={(e) => setSearchTerm(e.target.value)}
//                 />
//               </div>
//             </div>
//           </CardHeader>
//           <CardContent>
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Participante</TableHead>
//                   <TableHead>ID Evaluación</TableHead>
//                   <TableHead>Pruebas Asignadas</TableHead>
//                   <TableHead>Fecha Asignación (Envío)</TableHead>
//                   <TableHead className="text-right">Acciones</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredRecords.length > 0 ? (
//                   filteredRecords.map((record) => {
//                     const submissionDateObject = record.submission_date ? new Date(record.submission_date) : null;
//                     return (
//                     <TableRow key={record.id}>
//                       <TableCell>{record.participantData?.first_name} {record.participantData?.last_name}</TableCell>
//                       <TableCell>{record.id}</TableCell>
//                       <TableCell>
//                         <Badge variant="secondary">{getAssignedTestsString(record)}</Badge>
//                       </TableCell>
//                       <TableCell>
//                         {submissionDateObject && isValid(submissionDateObject)
//                           ? format(submissionDateObject, "dd MMM yyyy, HH:mm", { locale: es }) 
//                           : 'N/A'}
//                       </TableCell>
//                       <TableCell className="text-right space-x-2">
//                         {record.assigned_tests_config?.macroindices && (
//                            <Button variant="outline" size="sm" asChild className="text-primary border-primary hover:bg-primary/10 hover:text-primary mb-1 sm:mb-0">
//                             <Link href={`/assistant/tests/macroindices/${record.id}`}>
//                                 <Settings2 className="mr-1 h-4 w-4" /> Macroíndices
//                             </Link>
//                             </Button>
//                         )}
//                         {record.assigned_tests_config?.composicionCorporal && (
//                            <Button variant="outline" size="sm" asChild className="text-accent border-accent hover:bg-accent/10 hover:text-accent mb-1 sm:mb-0">
//                             <Link href={`/assistant/tests/composicion-corporal/${record.id}`}>
//                                 <TestTube2 className="mr-1 h-4 w-4" /> Comp. Corporal
//                             </Link>
//                             </Button>
//                         )}
//                         {record.assigned_tests_config?.somatotipo && (
//                            <Button variant="outline" size="sm" asChild className="text-green-600 border-green-600 hover:bg-green-600/10 hover:text-green-700">
//                             <Link href={`/assistant/tests/somatotipo/${record.id}`}>
//                                 <Shapes className="mr-1 h-4 w-4" /> Somatotipo
//                             </Link>
//                             </Button>
//                         )}
//                          {!record.assigned_tests_config?.macroindices && !record.assigned_tests_config?.composicionCorporal && !record.assigned_tests_config?.somatotipo && (
//                             <span className="text-xs text-muted-foreground">No hay pruebas específicas para realizar.</span>
//                         )}
//                       </TableCell>
//                     </TableRow>
//                    );
//                   })
//                 ) : (
//                   <TableRow>
//                     <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
//                       {evaluationRecords.filter(r => r.status === 'Pruebas Asignadas Asistente').length === 0
//                         ? "No hay pruebas asignadas actualmente."
//                         : "No hay pruebas que coincidan con su búsqueda."}
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//             <div className="mt-6 flex justify-end">
//               <Button onClick={handleRefresh} disabled={isLoading}>
//                 <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
//                 Actualizar Lista
//               </Button>
//             </div>
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
import type { EvaluationMode } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  UserCheck,
  RefreshCw,
  Search,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { Input } from "@/components/ui/input";

// Mapa de modos a ruta e icono
const evaluationModeConfig: Record<
  EvaluationMode,
  { label: string; href: (id: string) => string }
> = {
  "2C_Slaughter": {
    label: "2 Componentes - Fórmula Slaughter",
    href: (id: string) => `/assistant/tests/2componentes/ninos/${id}`,
  },
  "2C_DurninWomersley": {
    label: "2 Componentes - Fórmula Durnin - Womersley",
    href: (id: string) => `/assistant/tests/2componentes/adultos/${id}`,
  },
  "2C_Faulkner": {
    label: "2 Componentes - Fórmula Faulkner",
    href: (id: string) =>
      `/assistant/tests/2componentes/deportistas/faulkner/${id}`,
  },
  "2C_Carter": {
    label: "2 Componentes - Fórmula Carter",
    href: (id: string) =>
      `/assistant/tests/2componentes/deportistas/carter/${id}`,
  },
  "2C_Weltman": {
    label: "2 Componentes - Weltman",
    href: (id: string) => `/assistant/tests/2componentes/obesos/${id}`,
  },
  "MULT_Express": {
    label: "Multicomponente - Express",
    href: (id: string) => `/assistant/tests/express/${id}`,
  },
  "MULT_Restringido": {
    label: "Multicomponente - Restringido",
    href: (id: string) => `/assistant/tests/restringido/${id}`,
  },
  "MULT_5Componentes": {
    label: "Multicomponente - 5 Componentes",
    href: (id: string) => `/assistant/tests/5componentes/${id}`,
  },
  "MULT_Completo": {
    label: "Multicomponente - Completo",
    href: (id: string) => `/assistant/tests/completo/${id}`,
  },
};

export default function AssistantPendingTestsPage() {
  const router = useRouter();
  const { evaluationRecords, fetchRecords } = useEvaluationContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchRecords();
    setTimeout(() => setIsLoading(false), 500);
  };

  const filteredRecords = useMemo(() => {
    return evaluationRecords
      .filter(
        (record) =>
          record.status === "Pruebas Asignadas Asistente" &&
          ((record.participantData?.first_name ?? "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
            (record.participantData?.last_name ?? "")
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            (record.participantData?.id_number ?? "").includes(searchTerm) ||
            (record.id ?? "").toLowerCase().includes(searchTerm.toLowerCase()))
      )
      .sort(
        (a, b) =>
          new Date(b.submission_date).getTime() -
          new Date(a.submission_date).getTime()
      );
  }, [evaluationRecords, searchTerm]);

  return (
    <AuthWrapper allowedRoles={["Assistant", "Evaluator"]}>
      <div className="space-y-6">
        <div>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="border-pink-500 text-pink-500 hover:bg-pink-50 rounded-xl px-4 py-5 font-normal"
          >
            <ArrowLeft className="mr-3 h-5 w-5" />
            Volver
          </Button>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-3xl font-headline flex items-center">
              <UserCheck className="mr-3 h-8 w-8 text-primary" />
              Pruebas Pendientes (Asistente)
            </CardTitle>
            <CardDescription>
              Lista de participantes con protocolos asignados que requieren ser
              realizados.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="shadow-md">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <CardTitle className="text-xl">
                Participantes Asignados
              </CardTitle>

              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar por nombre, ID..."
                  className="pl-8 w-full sm:w-[250px] lg:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participante</TableHead>
                  <TableHead>ID Evaluación</TableHead>
                  <TableHead>Modo Asignado</TableHead>
                  <TableHead>Fecha Asignación (Envío)</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => {
                    const submissionDateObject = record.submission_date
                      ? new Date(record.submission_date)
                      : null;

                    const mode = record.evaluation_mode as EvaluationMode | null;
                    const modeConfig = mode ? evaluationModeConfig[mode] : null;

                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          {record.participantData?.first_name}{" "}
                          {record.participantData?.last_name}
                        </TableCell>

                        <TableCell>{record.id}</TableCell>

                        <TableCell>
                          {modeConfig ? (
                            <Badge variant="secondary">
                              {modeConfig.label}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Sin modo asignado
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          {submissionDateObject &&
                          isValid(submissionDateObject)
                            ? format(
                                submissionDateObject,
                                "dd MMM yyyy, HH:mm",
                                {
                                  locale: es,
                                }
                              )
                            : "N/A"}
                        </TableCell>

                        <TableCell className="text-right space-x-2">
                          {modeConfig ? (
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="text-primary border-primary hover:bg-primary/10 hover:text-primary"
                            >
                              <Link href={modeConfig.href(String(record.id))}>
                                Ir al Test
                              </Link>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No hay test disponible
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8"
                    >
                      {evaluationRecords.filter(
                        (r) => r.status === "Pruebas Asignadas Asistente"
                      ).length === 0
                        ? "No hay pruebas asignadas actualmente."
                        : "No hay pruebas que coincidan con su búsqueda."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="mt-6 flex justify-end">
              <Button onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${
                    isLoading ? "animate-spin" : ""
                  }`}
                />
                Actualizar Lista
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  );
}