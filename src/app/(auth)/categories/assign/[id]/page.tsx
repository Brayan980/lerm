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
import { CheckCircle, Circle, Search, ArrowLeft, Save, Users, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useEvaluationContext } from "@/contexts/EvaluationContext";
import { EvaluationRecord } from "@/lib/types";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  description: string;
}

export default function IncludeEvaluationsPage() {
  const { id: categoryId } = useParams();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { evaluationRecords, fetchRecords } = useEvaluationContext();
  const router = useRouter();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [category, setCategory] = useState<Category | null>(null);

  // Cargar datos de la categoría
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const response = await fetch(`/api/categories`);
        if (response.ok) {
          const categories = await response.json();
          const currentCategory = categories.find((cat: Category) => cat.id === categoryId);
          setCategory(currentCategory || null);
        }
      } catch (error) {
        console.error("Error loading category:", error);
      }
    };

    fetchCategory();
  }, [categoryId]);

  // Cargar evaluaciones ya asignadas a esta categoría
  useEffect(() => {
    const fetchAssignedEvaluations = async () => {
      try {
        const response = await fetch(`/api/categories/${categoryId}/evaluations`);
        if (response.ok) {
          const assignedEvaluations = await response.json();
          setSelectedIds(assignedEvaluations.map((evaluation: any) => evaluation.evaluation_record_id));
        }
      } catch (error) {
        console.error("Error loading assigned evaluations:", error);
      }
    };

    if (categoryId) {
      fetchAssignedEvaluations();
      fetchRecords();
    }
  }, [categoryId, fetchRecords]);

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

  const handleSaveAssignments = async () => {
    if (!categoryId) return;

    try {
      setIsSaving(true);

      const response = await fetch(`/api/categories/${categoryId}/evaluations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          evaluationIds: selectedIds
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al guardar asignaciones');
      }

      toast({
        title: "Éxito",
        description: `Se asignaron ${selectedIds.length} evaluaciones a la categoría "${category?.name}"`,
      });

      // Redirigir de vuelta a la página de categorías
      router.push('/categories');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Obtener las evaluaciones seleccionadas
  const selectedEvaluations = useMemo(() => {
    return evaluationRecords.filter(record => selectedIds.includes(record.id));
  }, [evaluationRecords, selectedIds]);

  // Filtrar evaluaciones completadas
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

        return cumpleBusqueda;
      })
      .sort(
        (a, b) =>
          new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime()
      );
  }, [evaluationRecords, searchTerm]);

  const removeSelectedEvaluation = (evaluationId: string) => {
    setSelectedIds(prev => prev.filter(id => id !== evaluationId));
  };

  const clearAllSelections = () => {
    setSelectedIds([]);
  };

  if (!category) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando categoría...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">

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

      {/* Card principal */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-blue-700 text-2xl">
            Incluir Evaluaciones en Categoría
          </CardTitle>
          <CardDescription>
            Haz clic en una fila o en el ícono de la derecha para seleccionar las evaluaciones que quieres incluir en esta categoría.
            Las evaluaciones ya asignadas aparecerán preseleccionadas.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Buscar evaluaciones completadas..."
                  className="pl-8 w-[250px] lg:w-[300px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <Search className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              </Button>
            </div>

            <div className="flex items-center gap-3">

              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">
                  Seleccionadas: <strong>{selectedIds.length}</strong>
                </div>
                <Button
                  onClick={handleSaveAssignments}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Guardando..." : "Guardar Asignaciones"}
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={clearAllSelections}
                disabled={selectedIds.length === 0}
                className="border-gray-300 hover:bg-gray-100"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar Selección
              </Button>
            </div>
          </div>

          {/* Tabla de evaluaciones */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Participante</TableHead>
                <TableHead>Fecha de Actualización</TableHead>
                <TableHead>Tipo de Formulario</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Modo de Evaluación</TableHead>
                <TableHead className="text-right">Seleccionar</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => (
                  <TableRow
                    key={record.id}
                    className={`cursor-pointer transition ${selectedIds.includes(record.id)
                        ? "bg-blue-50"
                        : "hover:bg-gray-50"
                      }`}
                    onClick={() => toggleSelect(record.id)}
                  >
                    <TableCell className="font-medium">
                      {record.participantData?.first_name} {record.participantData?.last_name}
                      {record.participantData?.id_number && (
                        <div className="text-sm text-muted-foreground">
                          ID: {record.participantData.id_number}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.updated_at
                        ? new Date(record.updated_at).toLocaleDateString('es-ES')
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {record.form_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          record.status === "Completada" ? "default" :
                            record.status === "Nueva" ? "secondary" :
                              "outline"
                        }
                      >
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {record.evaluation_mode ? (
                        <Badge variant="secondary">
                          {record.evaluation_mode}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {selectedIds.includes(record.id) ? (
                        <CheckCircle className="text-blue-600 inline-block h-5 w-5" />
                      ) : (
                        <Circle className="text-gray-300 inline-block h-5 w-5" />
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
                      : "No hay evaluaciones que coincidan con tu búsqueda."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Sección de Evaluaciones Seleccionadas - Similar a la página de citas */}
          {selectedIds.length > 0 && (
            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Evaluaciones Seleccionadas ({selectedIds.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllSelections}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpiar todas
                </Button>
              </div>

              {/* Badges de evaluaciones seleccionadas */}
              <div className="min-h-20 border-2 border-dashed border-blue-200 rounded-lg p-4 bg-blue-50">
                <div className="flex flex-wrap gap-2">
                  {selectedEvaluations.map((evaluation) => (
                    <Badge
                      key={evaluation.id}
                      variant="secondary"
                      className="px-3 py-2 text-sm bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 group"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">
                            {evaluation.participantData?.first_name} {evaluation.participantData?.last_name}
                          </span>
                          <span className="text-xs text-blue-700">
                            {evaluation.evaluation_mode || "Sin modo"}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSelectedEvaluation(evaluation.id);
                          }}
                          className="ml-1 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Lista detallada de evaluaciones seleccionadas */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Resumen de evaluaciones para la categoría "{category.name}"
                </label>
                <div className="bg-gray-50 border rounded-lg p-3 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedEvaluations.map((evaluation) => (
                      <div key={evaluation.id} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div>
                          <span className="font-medium">
                            {evaluation.participantData?.first_name} {evaluation.participantData?.last_name}
                          </span>
                          <div className="text-xs text-muted-foreground">
                            {evaluation.form_type} • {evaluation.evaluation_mode || "Sin modo"}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSelectedEvaluation(evaluation.id)}
                          className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Información de selección */}
          {selectedIds.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-blue-800">
                    {selectedIds.length} evaluaciones seleccionadas
                  </h4>
                  <p className="text-sm text-blue-600">
                    Haz clic en "Guardar Asignaciones" para incluir estas evaluaciones en la categoría "{category.name}"
                  </p>
                </div>
                <Button
                  onClick={handleSaveAssignments}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Guardando..." : "Guardar Asignaciones"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}