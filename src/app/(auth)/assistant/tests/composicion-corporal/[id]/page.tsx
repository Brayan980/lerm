
"use client";

import AuthWrapper from "@/components/auth/AuthWrapper";
import MeasurementInputRow from "@/components/forms/assistant/MeasurementInputRow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { useEvaluationContext } from "@/contexts/EvaluationContext";
import type { EvaluationRecord, ComposicionCorporalResults, CalculatedComposicionCorporal, AssignedTests, TestResults } from "@/lib/types";
import { COMPOSICION_CORPORAL_DEFINITIONS } from "@/lib/types";
import { calculateAllComposicionCorporal } from "@/lib/composicionCorporalCalculations";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle, Loader2, Save, TestTube2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

const measureSchema = z.object({
  m1: z.number({invalid_type_error: "Requerido"}).nullable(),
  m2: z.number({invalid_type_error: "Requerido"}).nullable(),
  m3: z.number().nullable().optional(),
  result: z.number().nullable().optional(),
}).refine(data => data.m1 !== null, { message: "Medida 1 es requerida.", path: ["m1"] })
  .refine(data => data.m2 !== null, { message: "Medida 2 es requerida.", path: ["m2"] });


const composicionCorporalFormSchemaObject = COMPOSICION_CORPORAL_DEFINITIONS.reduce((acc, item) => {
  acc[item.id] = measureSchema;
  return acc;
}, {} as Record<keyof Omit<ComposicionCorporalResults, 'calculatedComposicion'>, typeof measureSchema>);

const composicionCorporalFormSchema = z.object(composicionCorporalFormSchemaObject);

type ComposicionCorporalFormValues = z.infer<typeof composicionCorporalFormSchema>;

export default function ComposicionCorporalTestPage() {
  const { id: evaluationId } = useParams() as { id: string };
  const router = useRouter();
  const { getEvaluationRecordById, updateEvaluationRecord } = useEvaluationContext();
  const { toast } = useToast();
  const [record, setRecord] = useState<EvaluationRecord | null | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ComposicionCorporalFormValues>({
    resolver: zodResolver(composicionCorporalFormSchema),
    defaultValues: COMPOSICION_CORPORAL_DEFINITIONS.reduce((acc, item) => {
      acc[item.id] = { m1: null, m2: null, m3: null, result: null };
      return acc;
    }, {} as Partial<ComposicionCorporalFormValues>),
  });

  useEffect(() => {
    if (evaluationId) {
      const foundRecord = getEvaluationRecordById(evaluationId);
      setRecord(foundRecord);
      if (foundRecord?.test_results?.composicionCorporal) {
         const { calculatedComposicion, ...formData } = foundRecord.test_results.composicionCorporal;
         form.reset(formData as ComposicionCorporalFormValues);
      }
    }
  }, [evaluationId, getEvaluationRecordById, form]);

  const onSubmit: SubmitHandler<ComposicionCorporalFormValues> = async (data) => {
    if (!record || !record.participantData) {
        toast({ title: "Error", description: "No se pudo cargar el registro o los datos del participante.", variant: "destructive" });
        setIsSubmitting(false);
        return;
    }
    setIsSubmitting(true);

    const directMeasuresAsComposicionResults: ComposicionCorporalResults = data as unknown as ComposicionCorporalResults;

    const calculatedComposicion = calculateAllComposicionCorporal(directMeasuresAsComposicionResults, record.participantData);

    const composicionCorporalDataWithCalculations: ComposicionCorporalResults = {
        ...directMeasuresAsComposicionResults,
        calculatedComposicion: calculatedComposicion,
    };
    
    const currentTestResults = record.test_results || {};
    const updatedTestResults: TestResults = { 
        ...currentTestResults, 
        composicionCorporal: composicionCorporalDataWithCalculations 
    };
    
    let newStatus: EvaluationRecord['status'] = record.status;
    const assignedTests = record.assigned_tests_config;
    
    let allAssignedTestsCompleted = true;
    let atLeastOneTestPerformed = Object.keys(updatedTestResults).some(key => updatedTestResults[key as keyof TestResults] !== null && updatedTestResults[key as keyof TestResults] !== undefined);

    const assignedTestKeys = assignedTests ? Object.keys(assignedTests).filter(key => assignedTests[key as keyof AssignedTests]) : [];

    if (assignedTestKeys.length === 0 && atLeastOneTestPerformed) {
        allAssignedTestsCompleted = false;
    } else if (assignedTestKeys.length > 0) {
        for (const testKey of assignedTestKeys) {
            if (!updatedTestResults[testKey as keyof TestResults]) {
                allAssignedTestsCompleted = false;
                break;
            }
        }
    } else {
        allAssignedTestsCompleted = false; 
    }

    if (allAssignedTestsCompleted) {
        newStatus = 'Completada';
    } else if (atLeastOneTestPerformed) {
        newStatus = 'Resultados Parciales';
    }
    
    if (record.status === 'Pruebas Asignadas Asistente' && newStatus === 'Pruebas Asignadas Asistente' && atLeastOneTestPerformed) {
        newStatus = 'Resultados Parciales';
    }


    const result = await updateEvaluationRecord(record.id, {
      test_results: updatedTestResults,
      status: newStatus,
      assistant_notes: `Composición Corporal (con cálculos detallados) guardada el ${format(new Date(), "PPPp", { locale: es })}.`
    });

    if (result.success) {
      toast({
        title: "Resultados Guardados",
        description: "Los datos de Composición Corporal y sus cálculos han sido guardados.",
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
        <Card className="shadow-lg"><CardHeader><CardTitle>Registro no Encontrado</CardTitle></CardHeader>
          <CardContent><p>No se pudo encontrar la evaluación.</p>
          <Button variant="outline" asChild className="mt-4"><Link href="/assistant/pending-tests"><ArrowLeft className="mr-2 h-4 w-4" />Volver a Pruebas Pendientes</Link></Button>
          </CardContent>
        </Card>
      </AuthWrapper>
    );
  }

  const participant = record.participantData;

  return (
    <AuthWrapper allowedRoles={["Assistant", "Evaluator"]}>
      <div className="space-y-6">
         <Button variant="outline" size="sm" onClick={() => router.push('/assistant/pending-tests')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Pruebas Pendientes
        </Button>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-accent flex items-center"><TestTube2 className="mr-2 h-7 w-7"/>Prueba de Composición Corporal</CardTitle>
            <CardDescription>
              Participante: {participant?.first_name} {participant?.last_name} (ID: {participant?.id_number})
              <br/>
              Fecha de Nacimiento: {participant?.dob ? format(new Date(participant.dob), "PPP", { locale: es }) : 'N/A'} (Edad: {participant?.calculated_age?.toFixed(1)}, Sexo: {participant?.sex})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-x-4 items-center py-2 border-b bg-muted/30 px-2 rounded-t-md">
                    <div className="sm:col-span-1"><h4 className="text-sm font-semibold">Medición</h4></div>
                    <div className="sm:col-span-1"><h4 className="text-sm font-semibold">Medida 1</h4></div>
                    <div className="sm:col-span-1"><h4 className="text-sm font-semibold">Medida 2</h4></div>
                    <div className="sm:col-span-1"><h4 className="text-sm font-semibold">Medida 3</h4></div>
                    <div className="sm:col-span-1"><h4 className="text-sm font-semibold">Resultado</h4></div>
                </div>
                
                {COMPOSICION_CORPORAL_DEFINITIONS.map((def) => (
                  <MeasurementInputRow
                    key={def.id}
                    control={form.control}
                    namePrefix={def.id as string}
                    label={def.label}
                    unit={def.unit}
                    threshold={def.threshold}
                    watch={form.watch}
                    setValue={form.setValue}
                  />
                ))}
                <CardFooter className="pt-8">
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar Resultados de Composición Corporal
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
