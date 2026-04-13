"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Trash2, Download, Calculator } from "lucide-react";
import { useEvaluationContext } from "@/contexts/EvaluationContext";
import { format, isValid } from "date-fns";
import { es } from "date-fns/locale";
import { EvaluationRecord, FormType } from "@/lib/types";
import { generarReporte2C } from "@/lib/generar-reporte2c";
import { generarReporte2CExcel } from "@/lib/generar-reporte2c-excel";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function TwoComponentsResultsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { getEvaluationRecordById, deleteEvaluationRecord } = useEvaluationContext();

  const record = getEvaluationRecordById(id);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const { toast } = useToast();

  const participant = record?.participantData;
  const participantName = participant
    ? participant.first_name && participant.last_name
      ? `${participant.first_name} ${participant.last_name}`
      : participant.first_name || participant.last_name || "Participante Desconocido"
    : "Cargando...";
  const participantDobObject = participant?.dob ? new Date(participant.dob) : null;

  if (!record || !record.test_results?.dos_componentes) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Resultados no encontrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Detectar qué resultado está presente
  const dc = record.test_results.dos_componentes;
  const detectedKey = Object.keys(dc).find((k) => (dc as any)[k]);
  const resultBlock = detectedKey ? (dc as any)[detectedKey] : null;
  const calculated = resultBlock?.calculated;

  return (
    <div className="space-y-6">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push("/evaluations")}
        className="mb-4 print:hidden"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Evaluaciones
      </Button>

      <Card className="shadow-xl" id="evaluationDetailCard">
        {/* Encabezado */}
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
            <div>
              <CardTitle className="text-2xl font-headline text-primary">
                Detalles de Evaluación: {participantName}
              </CardTitle>
              <CardDescription>
                ID de Registro: {record.id}{" "}
                <span className="ml-2 text-xs text-muted-foreground">
                  (Estado: {record.status})
                </span>
              </CardDescription>
            </div>

            <div className="flex gap-2 mt-2 sm:mt-0 print:hidden">

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsDeleting(true);
                  deleteEvaluationRecord(record.id).then((result) => {
                    if (result.success) {
                      toast({
                        title: "Registro Eliminado",
                        description: "La evaluación ha sido eliminada.",
                      });
                      router.push("/evaluations");
                    } else {
                      toast({
                        title: "Error al Eliminar",
                        description:
                          result.message ||
                          "No se pudo eliminar el registro.",
                        variant: "destructive",
                      });
                    }
                    setIsDeleting(false);
                  });
                }}
                disabled={isDeleting}
                className="text-destructive border-destructive hover:bg-destructive/10"
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-1 h-4 w-4" />
                )}
                Eliminar
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={async () => {
                  setIsGeneratingPdf(true);
                  await generarReporte2C(record);
                  setIsGeneratingPdf(false);
                }}
                disabled={isGeneratingPdf}
              >
                {isGeneratingPdf ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-1 h-4 w-4" />
                )}
                Descargar Reporte (PDF)
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={async () => generarReporte2CExcel(record)}
              >
                <Download className="mr-1 h-4 w-4" />
                Descargar Reporte (Excel)
              </Button>
            </div>
            
          </div>
        </CardHeader>

        {/* Información del participante */}
        <CardContent className="space-y-6 divide-y divide-border">
          <section className="pt-4">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Información del Participante
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <p>
                <strong className="text-foreground">Nombre Completo:</strong>{" "}
                {participantName}
              </p>
              <p>
                <strong className="text-foreground">Identificación:</strong>{" "}
                {participant?.id_number || "N/A"}
              </p>
              <p>
                <strong className="text-foreground">Fecha de Nacimiento:</strong>{" "}
                {participantDobObject && isValid(participantDobObject)
                  ? format(participantDobObject, "PPP", { locale: es })
                  : "N/A"}{" "}
                (Edad:{" "}
                {typeof participant?.calculated_age === "number"
                  ? participant.calculated_age.toFixed(1)
                  : "N/A"}
                )
              </p>
              <p>
                <strong className="text-foreground">Sexo:</strong>{" "}
                {participant?.sex || "N/A"}
              </p>
              <p>
                <strong className="text-foreground">Correo:</strong>{" "}
                {participant?.email || "N/A"}
              </p>
              <p>
                <strong className="text-foreground">Términos Aceptados:</strong>{" "}
                {record.accepted_terms ? "Sí" : "No"}
              </p>
            </div>
          </section>

          {/* Resultados 2 Componentes */}
          <section className="pt-4">
            <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
              <Calculator className="mr-2 h-5 w-5 text-primary" />
              Resultados 2 Componentes
            </h3>
            {calculated ? (
              <div className="space-y-2 text-sm">
                <p>
                  <strong>% Grasa Corporal:</strong>{" "}
                  {calculated.porcentaje?.toFixed(2)} %
                </p>
                <p>
                  <strong>Masa Grasa:</strong>{" "}
                  {calculated.masaKg?.toFixed(2)} kg
                </p>
                <p>
                  <strong>Masa Libre de Grasa:</strong>{" "}
                  {calculated.masaLibreKg?.toFixed(2)} kg
                </p>
                <p>
                  <strong>Fórmula aplicada:</strong> {calculated.formula}
                </p>
                <p>
                  <strong>Referencia:</strong> {calculated.referencia}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground">
                No se encontraron resultados calculados.
              </p>
            )}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

