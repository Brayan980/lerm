"use client";
import AuthWrapper from "@/components/auth/AuthWrapper";
import MeasurementInputRow from "@/components/forms/assistant/MeasurementInputRow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useEvaluationContext } from "@/contexts/EvaluationContext";
import type { EvaluationRecord, TestResults, GenericMeasure, MGDeportistasFaulknerResults } from "@/lib/types";
import { DEPORTISTAS_FAULKNER_SECTIONS } from "@/lib/types";
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
import { mgDeportistasFaulkner } from "@/lib/mgCalculations";

// --- Schema genérico ---
const measureSchema = z.object({
  m1: z.number({ invalid_type_error: "Requerido" }).nullable(),
  m2: z.number({ invalid_type_error: "Requerido" }).nullable(),
  m3: z.number().nullable().optional(),
  result: z.number().nullable().optional(),
}).refine((d) => d.m1 !== null, { message: "Medida 1 es requerida.", path: ["m1"] })
  .refine((d) => d.m2 !== null, { message: "Medida 2 es requerida.", path: ["m2"] });

const deportistasFormSchema = z.object(
  Object.values(DEPORTISTAS_FAULKNER_SECTIONS).flat().reduce((acc, def) => {
    acc[def.id] = measureSchema;
    return acc;
  }, {} as Record<string, typeof measureSchema>)
);

type DeportistasFormValues = z.infer<typeof deportistasFormSchema>;

// --- Helpers para mapear resultados ---
function nestDeportistasResults(
  values: DeportistasFormValues,
  res: { porcentaje: number | null; masaKg?: number | null; formula: string; referencia: string }
): MGDeportistasFaulknerResults {
  return {
    triceps: values.triceps,
    subescapular: values.subescapular,
    supraespinal: values.supraespinal,
    abdominal: values.abdominal,
    peso: values.peso,
    calculated: res,
  };
}

function flattenDeportistasResults(data: MGDeportistasFaulknerResults): DeportistasFormValues {
  return {
    triceps: data.triceps,
    subescapular: data.subescapular,
    supraespinal: data.supraespinal,
    abdominal: data.abdominal,
    peso: data.peso ?? { m1: null, m2: null, m3: null, result: null }
  };
}

// --- Página principal ---
export default function DeportistasTestPage() {
  const { id: evaluationId } = useParams() as { id: string };
  const router = useRouter();
  const { getEvaluationRecordById, updateEvaluationRecord } = useEvaluationContext();
  const { toast } = useToast();
  const [record, setRecord] = useState<EvaluationRecord | null | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<DeportistasFormValues>({
    resolver: zodResolver(deportistasFormSchema),
    defaultValues: Object.values(DEPORTISTAS_FAULKNER_SECTIONS).flat().reduce((acc, def) => {
      acc[def.id] = { m1: null, m2: null, m3: null, result: null } as GenericMeasure;
      return acc;
    }, {} as Partial<DeportistasFormValues>),
  });

  useEffect(() => {
    if (evaluationId) {
      const foundRecord = getEvaluationRecordById(evaluationId);
      setRecord(foundRecord);
      if (foundRecord?.test_results?.dos_componentes?.mg_deportistas_faulkner) {
        form.reset(flattenDeportistasResults(foundRecord.test_results.dos_componentes.mg_deportistas_faulkner));
      }
    }
  }, [evaluationId, getEvaluationRecordById, form]);

  const onSubmit: SubmitHandler<DeportistasFormValues> = async (data) => {
    if (!record || !record.participantData) {
      toast({ title: "Error", description: "Datos del participante faltantes.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    const sexo = record.participantData.sex as "Masculino" | "Femenino";

    const res = mgDeportistasFaulkner(
      sexo,
      data.triceps.result ?? 0,
      data.subescapular.result ?? 0,
      data.supraespinal.result ?? 0,
      data.abdominal.result ?? 0,
      data.peso.result ?? 0
    );

    // const res =
    //   sexo === "Masculino"
    //     ? mgDeportistasHombresFaulkner(
    //         data.triceps.result ?? 0,
    //         data.subescapular.result ?? 0,
    //         data.supraespinal.result ?? 0,
    //         data.abdominal.result ?? 0,
    //         data.peso.result ?? 0
    //       )
    //     : mgDeportistasMujeresFaulkner(
    //         data.triceps.result ?? 0,
    //         data.subescapular.result ?? 0,
    //         data.supraespinal.result ?? 0,
    //         data.abdominal.result ?? 0,
    //         data.peso.result ?? 0
    //       );

    const mgDeportistasFaulknerResults = nestDeportistasResults(data, res);

    const currentResults = record.test_results || {};
    const updatedResults: TestResults = {
      ...currentResults,
      dos_componentes: {
        ...currentResults.dos_componentes,
        mg_deportistas_faulkner: mgDeportistasFaulknerResults,
      },
    };

    const result = await updateEvaluationRecord(record.id, {
      test_results: updatedResults,
      status: "Completada",
      assistant_notes: `Deportistas (Faulkner) guardado el ${format(new Date(), "PPPp", { locale: es })}.`,
    });

    if (result.success) {
      toast({
        title: "Resultados Guardados",
        description: "Los datos de la prueba Deportistas han sido guardados exitosamente.",
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
    return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
  }
  if (record === null) {
    return (
      <AuthWrapper allowedRoles={["Assistant", "Evaluator"]}>
        <Card><CardHeader><CardTitle>Registro no encontrado</CardTitle></CardHeader><CardContent><Link href="/assistant/pending-tests"><ArrowLeft /> Volver</Link></CardContent></Card>
      </AuthWrapper>
    );
  }

  const participant = record.participantData;

  return (
    <AuthWrapper allowedRoles={["Assistant", "Evaluator"]}>
      <div className="space-y-6">
        <Button variant="outline" onClick={() => router.back()}><ArrowLeft /> Volver</Button>
        
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-blue-700 flex items-center">
              <Activity className="mr-2 h-7 w-7" /> Prueba Deportistas (Faulkner)
            </CardTitle>
            <CardDescription>
              Participante: {participant?.first_name} {participant?.last_name}{" "}
              (ID: {participant?.id_number})
              <br />
              Edad: {participant?.calculated_age?.toFixed(1)} años, Sexo:{" "}
              {participant?.sex}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* {Object.entries(DEPORTISTAS_FAULKNER_SECTIONS).map(([sectionKey, defs]) => (
                  
                  <div key={sectionKey} className="space-y-2">
                    <h3 className="text-lg font-semibold capitalize">{sectionKey.replace("_", " ")}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-x-4 items-center py-2 border-b bg-muted/30 px-2 rounded-t-md">
                      <div>Medición</div><div>M1</div><div>M2</div><div>M3</div><div>Resultado</div>
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

                ))} */}

{Object.entries(DEPORTISTAS_FAULKNER_SECTIONS).map(([sectionKey, defs]) => (
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

                <CardFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />} Guardar Resultados
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
