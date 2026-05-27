"use client";
import AuthWrapper from "@/components/auth/AuthWrapper";
import MeasurementInputRow from "@/components/forms/assistant/MeasurementInputRow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useEvaluationContext } from "@/contexts/EvaluationContext";
import type { EvaluationRecord, TestResults, GenericMeasure, MGDeportistasFaulknerResults } from "@/lib/types";
import { DEPORTISTAS_CARTER_SECTIONS } from "@/lib/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle, Loader2, Save, Activity } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { mgDeportistasCarter } from "@/lib/mgCalculations";

// --- Schema genérico para cada medida ---
const measureSchema = z.object({
  m1: z.number({ invalid_type_error: "Requerido" }).nullable(),
  m2: z.number({ invalid_type_error: "Requerido" }).nullable(),
  m3: z.number().nullable().optional(),
  result: z.number().nullable().optional(),
}).refine((d) => d.m1 !== null, { message: "Medida 1 es requerida.", path: ["m1"] })
  .refine((d) => d.m2 !== null, { message: "Medida 2 es requerida.", path: ["m2"] });

// --- Schema dinámico en base a DEPORTISTAS_CARTER_SECTIONS ---
const deportistasCarterFormSchema = z.object(
  Object.values(DEPORTISTAS_CARTER_SECTIONS).flat().reduce((acc, def) => {
    acc[def.id] = measureSchema;
    return acc;
  }, {} as Record<string, typeof measureSchema>)
);

type DeportistasCarterFormValues = z.infer<typeof deportistasCarterFormSchema>;

// --- Helpers para mapear plano ⇄ anidado ---
function nestDeportistasCarterResults(
  values: DeportistasCarterFormValues,
  res: { porcentaje: number | null; masaKg?: number | null; formula: string; referencia: string }
) {
  return {
    peso: values.peso,
    triceps: values.triceps,
    subescapular: values.subescapular,
    supraespinal: values.supraespinal,
    abdominal: values.abdominal,
    muslo_anterior: values.muslo_anterior,
    pierna_medial: values.pierna_medial,
    calculated: res,
  };
}

// --- Página principal ---
export default function DeportistasCarterTestPage() {
  const { id: evaluationId } = useParams() as { id: string };
  const router = useRouter();
  const { getEvaluationRecordById, updateEvaluationRecord } = useEvaluationContext();
  const { toast } = useToast();
  const [record, setRecord] = useState<EvaluationRecord | null | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DeportistasCarterFormValues>({
    resolver: zodResolver(deportistasCarterFormSchema),
    defaultValues: Object.values(DEPORTISTAS_CARTER_SECTIONS).flat().reduce((acc, def) => {
      acc[def.id] = { m1: null, m2: null, m3: null, result: null } as GenericMeasure;
      return acc;
    }, {} as Partial<DeportistasCarterFormValues>),
  });

  useEffect(() => {
    if (evaluationId) {
      const foundRecord = getEvaluationRecordById(evaluationId);
      setRecord(foundRecord);
      if (foundRecord?.test_results?.dos_componentes?.mg_deportistas_carter) {
        form.reset(foundRecord.test_results.dos_componentes.mg_deportistas_carter as any);
      }
    }
  }, [evaluationId, getEvaluationRecordById, form]);

  const onSubmit: SubmitHandler<DeportistasCarterFormValues> = async (data) => {
    if (!record || !record.participantData) {
      toast({ title: "Error", description: "No se pudo cargar el registro o los datos del participante.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const sexo = record.participantData.sex as "Masculino" | "Femenino";

    const res = mgDeportistasCarter(
      sexo,
      data.triceps.result ?? 0,
      data.subescapular.result ?? 0,
      data.supraespinal.result ?? 0,
      data.abdominal.result ?? 0,
      data.muslo_anterior.result ?? 0,
      data.pierna_medial.result ?? 0,
      data.peso.result ?? 0
    );

    const mgDeportistasCarterResults = nestDeportistasCarterResults(data, res);

    const currentResults = record.test_results || {};
    const updatedResults: TestResults = {
      ...currentResults,
      dos_componentes: {
        ...currentResults.dos_componentes,
        mg_deportistas_carter: mgDeportistasCarterResults,
      },
    };

    const result = await updateEvaluationRecord(record.id, {
      test_results: updatedResults,
      status: "Completada",
      assistant_notes: `Deportistas (Carter) guardado el ${format(new Date(), "PPPp", { locale: es })}.`,
    });

    if (result.success) {
      toast({
        title: "Resultados Guardados",
        description: "Los datos de la prueba Deportistas (Carter) han sido guardados exitosamente.",
        action: <CheckCircle className="text-green-500" />,
      });
      router.push("/assistant/pending-tests");
    } else {
      toast({
        title: "Error al Guardar",
        description: result.message || "No se pudieron guardar los resultados.",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  if (record === undefined) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  if (record === null) {
    return (
      <AuthWrapper allowedRoles={["Assistant", "Evaluator"]}>
        <Card className="shadow-lg">
          <CardHeader><CardTitle>Registro no Encontrado</CardTitle></CardHeader>
          <CardContent>
            <p>No se pudo encontrar la evaluación.</p>
            <Button variant="outline" asChild className="mt-4">
              <Link href="/assistant/pending-tests"><ArrowLeft className="mr-2 h-4 w-4" />Volver a Pruebas Pendientes</Link>
            </Button>
          </CardContent>
        </Card>
      </AuthWrapper>
    );
  }

  const participant = record.participantData;

  return (
    <AuthWrapper allowedRoles={["Assistant", "Evaluator"]}>
      <div className="space-y-6">
        <Button variant="outline" size="sm" onClick={() => router.push("/assistant/pending-tests")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Pruebas Pendientes
        </Button>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-blue-700 flex items-center">
              <Activity className="mr-2 h-7 w-7" /> Prueba Deportistas (Carter)
            </CardTitle>
            <CardDescription>
              Participante: {participant?.first_name} {participant?.last_name} (ID: {participant?.id_number})
              <br />
              Edad: {participant?.calculated_age?.toFixed(1)} años, Sexo: {participant?.sex}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {Object.entries(DEPORTISTAS_CARTER_SECTIONS).map(([sectionKey, defs]) => (
                  <div key={sectionKey} className="space-y-2">
                    <h3 className="text-lg font-semibold capitalize">{sectionKey.replace("_", " ")}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-x-4 items-center py-2 border-b bg-muted/30 px-2 rounded-t-md">
                      <div className="sm:col-span-1"><h4 className="text-sm font-semibold">Medición</h4></div>
                      <div className="sm:col-span-1"><h4 className="text-sm font-semibold">Medida 1</h4></div>
                      <div className="sm:col-span-1"><h4 className="text-sm font-semibold">Medida 2</h4></div>
                      <div className="sm:col-span-1"><h4 className="text-sm font-semibold">Medida 3</h4></div>
                      <div className="sm:col-span-1"><h4 className="text-sm font-semibold">Resultado</h4></div>
                    </div>
                    {defs.map((def) => (
                      <MeasurementInputRow
                        key={def.id}
                        control={form.control}
                        namePrefix={def.id}
                        label={def.label}
                        unit={def.unit}
                        threshold={def.threshold}
                        watch={form.watch}
                        setValue={form.setValue}
                      />
                    ))}
                  </div>
                ))}

                <CardFooter className="pt-8">
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar Resultados de Deportistas (Carter)
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  );
}
