"use client";

import { calculateAllMacroindices } from "@/lib/macroindicesCalculations";
import { calculateAllComposicionCorporal } from "@/lib/composicionCorporalCalculations";
import { calculateSomatotype } from "@/lib/somatotipoCalculations";
import { mapCincoComponentesToComposicionCorporal, mapCincoComponentesToMacroindices, mapCincoComponentesToSomatotipo } from "@/lib/mappers/cincoComponentes";


import AuthWrapper from "@/components/auth/AuthWrapper";
import MeasurementInputRow from "@/components/forms/assistant/MeasurementInputRow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEvaluationContext } from "@/contexts/EvaluationContext";
import { useAuth } from "@/contexts/AuthContext";
import type { EvaluationRecord, TestResults, AssignedTests, GenericMeasure, CincoComponentesResults } from "@/lib/types";
import { CINCOCOMPONENTES_SECTIONS, Ethnicity } from "@/lib/types"; // 🔹 debes crear este archivo igual que EXPRESS_SECTIONS
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CheckCircle, Loader2, Save, Activity } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Schema para cada medición ---
const measureSchema = z.object({
  m1: z.number({ invalid_type_error: "Requerido" }).nullable(),
  m2: z.number({ invalid_type_error: "Requerido" }).nullable(),
  m3: z.number().nullable().optional(),
  result: z.number().nullable().optional(),
}).refine((data) => data.m1 !== null, { message: "Medida 1 es requerida.", path: ["m1"] })
  .refine((data) => data.m2 !== null, { message: "Medida 2 es requerida.", path: ["m2"] });

// --- Schema dinámico en base a CINCOCOMPONENTES_SECTIONS ---
// const cincoFormSchema = z.object(
//   Object.values(CINCOCOMPONENTES_SECTIONS).flat().reduce((acc, def) => {
//     acc[def.id] = measureSchema;
//     return acc;
//   }, {} as Record<string, typeof measureSchema>)
// );

// type CincoFormValues = z.infer<typeof cincoFormSchema>;

const cincoComponentesFormSchema = z.object({
  etnia: z.nativeEnum(Ethnicity),
  masa_corporal: measureSchema,
  talla: measureSchema,
  talla_sentado: measureSchema,
  triceps: measureSchema,
  subescapular: measureSchema,
  biceps: measureSchema,
  cresta_iliaca: measureSchema,
  supraespinal: measureSchema,
  abdominal: measureSchema,
  muslo: measureSchema,
  pierna_pliegue: measureSchema,
  cabeza: measureSchema,
  brazo_relajado: measureSchema,
  brazo_flexionado_contraido: measureSchema,
  antebrazo: measureSchema,
  torax: measureSchema,
  cintura: measureSchema,
  caderas: measureSchema,
  muslo_medio: measureSchema,
  pierna_perimetro: measureSchema,
  biacromial: measureSchema,
  biliocrestal: measureSchema,
  transverso_torax: measureSchema,
  antero_posterior_torax: measureSchema,
  humero: measureSchema,
  femur: measureSchema,
}
);

// Explicit schema for all fields
type CincoComponentesFormValues = {
  etnia: Ethnicity;
  masa_corporal: GenericMeasure;
  talla: GenericMeasure;
  talla_sentado: GenericMeasure;
  triceps: GenericMeasure;
  subescapular: GenericMeasure;
  biceps: GenericMeasure;
  cresta_iliaca: GenericMeasure;
  supraespinal: GenericMeasure;
  abdominal: GenericMeasure;
  muslo: GenericMeasure;
  pierna_pliegue: GenericMeasure;
  cabeza: GenericMeasure;
  brazo_relajado: GenericMeasure;
  brazo_flexionado_contraido: GenericMeasure;
  antebrazo: GenericMeasure;
  torax: GenericMeasure;
  cintura: GenericMeasure;
  caderas: GenericMeasure;
  muslo_medio: GenericMeasure;
  pierna_perimetro: GenericMeasure;
  biacromial: GenericMeasure;
  biliocrestal: GenericMeasure;
  transverso_torax: GenericMeasure;
  antero_posterior_torax: GenericMeasure;
  humero: GenericMeasure;
  femur: GenericMeasure;
};


// --- Helpers para mapear plano ⇄ anidado ---
function nestCincoResultados(values: CincoComponentesFormValues): CincoComponentesResults {
  return {
    etnia: values.etnia,
    medidas_basicas: {
      masa_corporal: values.masa_corporal,
      talla: values.talla,
      talla_sentado: values.talla_sentado,
    },
    pliegues_cutaneos: {
      triceps: values.triceps,
      subescapular: values.subescapular,
      biceps: values.biceps,
      cresta_iliaca: values.cresta_iliaca,
      supraespinal: values.supraespinal,
      abdominal: values.abdominal,
      muslo: values.muslo,
      pierna_pliegue: values.pierna_pliegue,
    },
    perimetros: {
      cabeza: values.cabeza,
      brazo_relajado: values.brazo_relajado,
      brazo_flexionado_contraido: values.brazo_flexionado_contraido,
      antebrazo: values.antebrazo,
      torax: values.torax,
      cintura: values.cintura,
      caderas: values.caderas,
      muslo_medio: values.muslo_medio,
      pierna_perimetro: values.pierna_perimetro,
    },
    diametros: {
      biacromial: values.biacromial,
      biliocrestal: values.biliocrestal,
      transverso_torax: values.transverso_torax,
      antero_posterior_torax: values.antero_posterior_torax,
      humero: values.humero,
      femur: values.femur,
    },
  };
}

function flattenCincoResultados(data: CincoComponentesResults): CincoComponentesFormValues {
  return {
    etnia: data.etnia,
    ...data.medidas_basicas,
    ...data.pliegues_cutaneos,
    ...data.perimetros,
    ...data.diametros
  };
}

// --- Página principal ---
export default function CincoComponentesTestPage() {
  const { id: evaluationId } = useParams() as { id: string };
  const router = useRouter();
  const { getEvaluationRecordById, updateEvaluationRecord } = useEvaluationContext();
  const { selectedRole } = useAuth();
  const { toast } = useToast();

  const normalizedRole = String(selectedRole || "").toLowerCase();
  const isEvaluatorRole =
    normalizedRole === "evaluator" || normalizedRole === "evaluador";

  const backRoute = isEvaluatorRole
    ? `/evaluations/${evaluationId}`
    : "/assistant/pending-tests";

  const backLabel = isEvaluatorRole
    ? "Volver al detalle"
    : "Volver a Pruebas Pendientes";

  const [record, setRecord] = useState<EvaluationRecord | null | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // const form = useForm<CincoFormValues>({
  //   resolver: zodResolver(cincoFormSchema),
  //   defaultValues: Object.values(CINCOCOMPONENTES_SECTIONS).flat().reduce((acc, def) => {
  //     acc[def.id] = { m1: null, m2: null, m3: null, result: null } as GenericMeasure;
  //     return acc;
  //   }, {} as Partial<CincoFormValues>),
  // });

    const form = useForm<CincoComponentesFormValues>({
      resolver: zodResolver(cincoComponentesFormSchema),
      defaultValues: {
        etnia: undefined, // Matches optional schema
        masa_corporal: { m1: null, m2: null, m3: null, result: null },
        talla: { m1: null, m2: null, m3: null, result: null },
        talla_sentado: { m1: null, m2: null, m3: null, result: null },
        triceps: { m1: null, m2: null, m3: null, result: null },
        subescapular: { m1: null, m2: null, m3: null, result: null },
        biceps: { m1: null, m2: null, m3: null, result: null },
        cresta_iliaca: { m1: null, m2: null, m3: null, result: null },
        supraespinal: { m1: null, m2: null, m3: null, result: null },
        abdominal: { m1: null, m2: null, m3: null, result: null },
        muslo: { m1: null, m2: null, m3: null, result: null },
        pierna_pliegue: { m1: null, m2: null, m3: null, result: null },
        cabeza: { m1: null, m2: null, m3: null, result: null },
        brazo_relajado: { m1: null, m2: null, m3: null, result: null },
        brazo_flexionado_contraido: { m1: null, m2: null, m3: null, result: null },
        antebrazo: { m1: null, m2: null, m3: null, result: null },
        torax: { m1: null, m2: null, m3: null, result: null },
        cintura: { m1: null, m2: null, m3: null, result: null },
        caderas: { m1: null, m2: null, m3: null, result: null },
        muslo_medio: { m1: null, m2: null, m3: null, result: null },
        pierna_perimetro: { m1: null, m2: null, m3: null, result: null },
        biacromial: { m1: null, m2: null, m3: null, result: null },
        biliocrestal: { m1: null, m2: null, m3: null, result: null },
        transverso_torax: { m1: null, m2: null, m3: null, result: null },
        antero_posterior_torax: { m1: null, m2: null, m3: null, result: null },
        humero: { m1: null, m2: null, m3: null, result: null },
        femur: { m1: null, m2: null, m3: null, result: null },
      },
    });

  useEffect(() => {
    if (evaluationId) {
      const foundRecord = getEvaluationRecordById(evaluationId);
      setRecord(foundRecord);
      if (foundRecord?.test_results?.cinco_componentes) {
        form.reset(flattenCincoResultados(foundRecord.test_results.cinco_componentes));
      }
    }
  }, [evaluationId, getEvaluationRecordById, form]);

  const onSubmit: SubmitHandler<CincoComponentesFormValues> = async (data) => {
    if (!record || !record.participantData) {
      toast({ title: "Error", description: "No se pudo cargar el registro o los datos del participante.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);

    const cincoComponentesResults = nestCincoResultados(data);



    // 2️⃣ Composición corporal
    const compInput = mapCincoComponentesToComposicionCorporal(cincoComponentesResults);
    const calculatedComposicion = calculateAllComposicionCorporal(compInput, record.participantData);

        // 1️⃣ Macroíndices
    const macroInput = mapCincoComponentesToMacroindices(cincoComponentesResults);
    const calculatedIndices = calculateAllMacroindices(macroInput, record.participantData, 
      calculatedComposicion?.kerrComponents?.masaOsea.masaKg!, 
      calculatedComposicion?.kerrComponents?.masaAdiposa.masaKg!,
      calculatedComposicion?.kerrComponents?.masaMuscular.masaKg!,
    );


    // 3️⃣ Somatotipo
    const somatoInput = mapCincoComponentesToSomatotipo(cincoComponentesResults);
    const calculatedSomatotype = calculateSomatotype(somatoInput) ?? undefined;

    // 4️⃣ Construir el objeto final de test_results
    const currentTestResults = record.test_results || {};
    const updatedTestResults: TestResults = {
      ...currentTestResults,
      cinco_componentes: cincoComponentesResults,
      calculatedIndices,       // 🔹 bloque de macroíndices
      calculatedComposicion,   // 🔹 bloque de composición corporal
      calculatedSomatotype // 🔹 bloque de somatotipo
    };


    let newStatus: EvaluationRecord["status"] = "Completada"; // Cambiamos el estado a Completada directamente
    const assignedTests = record.assigned_tests_config;

    const result = await updateEvaluationRecord(record.id, {
      ethnicity: updatedTestResults.cinco_componentes?.etnia,
      test_results: updatedTestResults,
      status: newStatus,
      assistant_notes: `5 Componentes guardado el ${format(new Date(), "PPPp", { locale: es })}.`,
    });

    if (result.success) {
      toast({
        title: "Resultados Guardados",
        description: "Los datos de la prueba de 5 Componentes han sido guardados exitosamente.",
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
            <Button
              variant="outline"
              onClick={() => router.push(backRoute)}
              className="mt-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backLabel}
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(backRoute)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {backLabel}
        </Button>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-blue-700 flex items-center">
              <Activity className="mr-2 h-7 w-7" /> Prueba Multicomponente (5 Componentes)
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

                {Object.entries(CINCOCOMPONENTES_SECTIONS).map(([sectionKey, defs]) => (
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
                    Guardar Resultados 5 Componentes
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
