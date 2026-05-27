"use client";
import { calculateAllMacroindices } from "@/lib/macroindicesCalculations";

import AuthWrapper from "@/components/auth/AuthWrapper";
import MeasurementInputRow from "@/components/forms/assistant/MeasurementInputRow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEvaluationContext } from "@/contexts/EvaluationContext";
import { EvaluationRecord, TestResults, AssignedTests, ExpressResults, GenericMeasure, Ethnicity } from "@/lib/types";
import { EXPRESS_SECTIONS } from "@/lib/types";
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
import { mapExpressToMacroindices, mapExpressToComposicionCorporal2Componentes } from "@/lib/mappers/expressMapper";
import macro from "styled-jsx/macro";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Modelo2Componentes } from "@/lib/composicionCorporal2Componentes";

// Schema for GenericMeasure
const measureSchema = z.object({
  m1: z.number().nullable(),
  m2: z.number().nullable(),
  m3: z.number().nullable().optional(),
  result: z.number().nullable().optional(),
});

// Explicit schema for all fields
const expressFormSchema = z.object({
  etnia: z.nativeEnum(Ethnicity), 
  masa_corporal: measureSchema,
  talla: measureSchema,
  triceps: measureSchema,
  subescapular: measureSchema,
  supraespinal: measureSchema,
  abdominal: measureSchema,
  muslo: measureSchema,
  pierna_pliegue: measureSchema,
  brazo_relajado: measureSchema,
  brazo_flexionado_contraido: measureSchema,
  cintura: measureSchema,
  caderas: measureSchema,
  muslo_medio: measureSchema,
  pierna_perimetro: measureSchema,
});

// Define ExpressFormValues explicitly
type ExpressFormValues = {
  etnia: Ethnicity;
  masa_corporal: GenericMeasure;
  talla: GenericMeasure;
  triceps: GenericMeasure;
  subescapular: GenericMeasure;
  supraespinal: GenericMeasure;
  abdominal: GenericMeasure;
  muslo: GenericMeasure;
  pierna_pliegue: GenericMeasure;
  brazo_relajado: GenericMeasure;
  brazo_flexionado_contraido: GenericMeasure;
  cintura: GenericMeasure;
  caderas: GenericMeasure;
  muslo_medio: GenericMeasure;
  pierna_perimetro: GenericMeasure;
};

// --- Helpers para mapear plano ⇄ anidado ---
function nestExpressResults(values: ExpressFormValues): ExpressResults {
  return {
    etnia: values.etnia,
    medidas_basicas: {
      masa_corporal: values.masa_corporal,
      talla: values.talla,
    },
    pliegues_cutaneos: {
      triceps: values.triceps,
      subescapular: values.subescapular,
      supraespinal: values.supraespinal,
      abdominal: values.abdominal,
      muslo: values.muslo,
      pierna_pliegue: values.pierna_pliegue,
    },
    perimetros: {
      brazo_relajado: values.brazo_relajado,
      brazo_flexionado_contraido: values.brazo_flexionado_contraido,
      cintura: values.cintura,
      caderas: values.caderas,
      muslo_medio: values.muslo_medio,
      pierna_perimetro: values.pierna_perimetro,
    },
  };
}

function flattenExpressResults(data: ExpressResults): ExpressFormValues {
  return {
    etnia: data.etnia,
    ...data.medidas_basicas,
    ...data.pliegues_cutaneos,
    ...data.perimetros,
  };
}

// --- Página principal ---
export default function ExpressTestPage() {
  const { id: evaluationId } = useParams() as { id: string };
  const router = useRouter();
  const { getEvaluationRecordById, updateEvaluationRecord } = useEvaluationContext();
  const { toast } = useToast();
  const [record, setRecord] = useState<EvaluationRecord | null | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the form
  const form = useForm<ExpressFormValues>({
    resolver: zodResolver(expressFormSchema),
    defaultValues: {
      etnia: undefined, // Matches optional schema
      masa_corporal: { m1: null, m2: null, m3: null, result: null },
      talla: { m1: null, m2: null, m3: null, result: null },
      triceps: { m1: null, m2: null, m3: null, result: null },
      subescapular: { m1: null, m2: null, m3: null, result: null },
      supraespinal: { m1: null, m2: null, m3: null, result: null },
      abdominal: { m1: null, m2: null, m3: null, result: null },
      muslo: { m1: null, m2: null, m3: null, result: null },
      pierna_pliegue: { m1: null, m2: null, m3: null, result: null },
      brazo_relajado: { m1: null, m2: null, m3: null, result: null },
      brazo_flexionado_contraido: { m1: null, m2: null, m3: null, result: null },
      cintura: { m1: null, m2: null, m3: null, result: null },
      caderas: { m1: null, m2: null, m3: null, result: null },
      muslo_medio: { m1: null, m2: null, m3: null, result: null },
      pierna_perimetro: { m1: null, m2: null, m3: null, result: null },
    },
  });

  useEffect(() => {
    if (evaluationId) {
      const foundRecord = getEvaluationRecordById(evaluationId);
      setRecord(foundRecord);
      if (foundRecord?.test_results?.express) {
        form.reset(flattenExpressResults(foundRecord.test_results.express));
      }
    }
  }, [evaluationId, getEvaluationRecordById, form]);


  const onSubmit: SubmitHandler<ExpressFormValues> = async (data) => {
    if (!record || !record.participantData) {
      toast({ title: "Error", description: "No se pudo cargar el registro o los datos del participante.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);

    const expressResults = nestExpressResults(data);

    // Macroíndices
    const macroInput = mapExpressToMacroindices(expressResults);
    const calculatedIndices = calculateAllMacroindices(macroInput, record.participantData, undefined, undefined, undefined);

    // Composición corporal
    const medidas2Componentes = mapExpressToComposicionCorporal2Componentes(expressResults, record.participantData);

    const modelo2Componentes = new Modelo2Componentes(medidas2Componentes);
    const calculatedComposicion2Componentes = modelo2Componentes.calcularComposicionMuscularAdiposa();

    // Construir el objeto final de test_results
    const currentTestResults = record.test_results || {};
    const updatedTestResults: TestResults = {
      ...currentTestResults,
      express: expressResults,
      calculatedIndices,       // 🔹 bloque de macroíndices
      calculatedComposicion2Componentes // 🔹 bloque de composición corporal
      // calculatedSomatotype  // 🔹 bloque de somatotipo
    };

    let newStatus: EvaluationRecord["status"] = "Completada"; // Cambiamos el estado a Completada directamente
    const assignedTests = record.assigned_tests_config;

    const result = await updateEvaluationRecord(record.id, {
      ethnicity: updatedTestResults.express?.etnia,
      test_results: updatedTestResults,
      status: newStatus,
      assistant_notes: `Express guardado el ${format(new Date(), "PPPp", { locale: es })}.`,
    });

    if (result.success) {
      toast({
        title: "Resultados Guardados",
        description: "Los datos de la prueba Express han sido guardados exitosamente.",
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
              <Activity className="mr-2 h-7 w-7" /> Prueba Express
            </CardTitle>
            <CardDescription>
              Participante: {participant?.first_name} {participant?.last_name} (ID: {participant?.id_number})
              <br />
              Fecha de Nacimiento: {participant?.dob ? format(new Date(participant.dob), "PPP", { locale: es }) : "N/A"} (Edad: {participant?.calculated_age?.toFixed(1)}, Sexo: {participant?.sex})
            </CardDescription>
          </CardHeader>
          <CardContent>

            <Form {...form}>

              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                {/* 🔹 Campo Etnia */}
                <FormField
                  control={form.control}
                  name="etnia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etnia</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una etnia" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.values(Ethnicity).map((eth) => (
                            <SelectItem key={eth} value={eth}>
                              {eth}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {Object.entries(EXPRESS_SECTIONS).map(([sectionKey, defs]) => (
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
                        threshold={def.threshold} // puedes ajustar si quieres
                        watch={form.watch}
                        setValue={form.setValue}
                      />
                    ))}
                  </div>
                ))}


                <CardFooter className="pt-8">
                  <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar Resultados de Express
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
