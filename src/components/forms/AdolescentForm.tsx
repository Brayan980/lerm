
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFormData } from "@/contexts/FormDataContext";
import { useEvaluationContext } from "@/contexts/EvaluationContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { calculateDecimalAge } from "@/lib/ageCalculator";
import { calculatePaqScore } from "@/lib/scoring";
import type { Frequency, DailyActivityFrequency } from "@/lib/types";
import { frequencyOptions, dailyActivityOptions } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import React, { useEffect, useState } from "react";
import FormQuestion from "./shared/FormQuestion";
import ActivityTableInput from "./shared/ActivityTableInput";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


const paqAActivities: { id: string; label: string; isOther?: boolean }[] = [
    { id: "saltar_cuerda", label: "Saltar la cuerda" },
    { id: "jugar_cacho_lleva", label: "Jugar a juegos como el cacho o la lleva" },
    { id: "patinar", label: "Patinar" },
    { id: "montar_bicicleta", label: "Montar bicicleta" },
    { id: "caminar_ejercicio", label: "Caminar (como ejercicio)" },
    { id: "correr", label: "Correr" },
    { id: "natacion", label: "Natación" },
    { id: "bailar", label: "Bailar" },
    { id: "futbol_futsal", label: "Fútbol/futsal" },
    { id: "voleibol", label: "Voleibol" },
    { id: "baloncesto", label: "Baloncesto" },
    { id: "atletismo", label: "Atletismo" },
    { id: "pesas", label: "Pesas" },
    { id: "artes_marciales", label: "Artes marciales (karate, taekwondo)" },
    { id: "otros", label: "Otros", isOther: true },
];

const daysOfWeek: { id: string; label: string }[] = [
    { id: "lunes", label: "Lunes" }, { id: "martes", label: "Martes" }, { id: "miercoles", label: "Miércoles" },
    { id: "jueves", label: "Jueves" }, { id: "viernes", label: "Viernes" }, { id: "sabado", label: "Sábado" },
    { id: "domingo", label: "Domingo" },
];

const q2options = [ // For PAQ-A Q2
    { value: 'a', label: 'Ninguna', score: 1 },
    { value: 'b', label: 'Un poco', score: 2 },
    { value: 'c', label: 'Bastante', score: 3 },
    { value: 'd', label: 'Casi siempre', score: 4 },
    { value: 'e', label: 'Siempre', score: 5 }
];

const q3options = [ // For PAQ-A Q3
    { value: 'a', label: 'Me senté (hablando, leyendo, haciendo deberes)', score: 1 },
    { value: 'b', label: 'Estuve de pie o caminé un poco', score: 2 },
    { value: 'c', label: 'Corrí o jugué un poco', score: 3 },
    { value: 'd', label: 'Corrí o jugué bastante', score: 4 },
    { value: 'e', label: 'Corrí o jugué mucho', score: 5 }
];

const q4options = [ // For PAQ-A Q4, Q5, Q6
    { value: 'a', label: 'Ninguna', score: 1 },
    { value: 'b', label: '1 vez', score: 2 },
    { value: 'c', label: '2-3 veces', score: 3 },
    { value: 'd', label: '4-5 veces', score: 4 },
    { value: 'e', label: '6 o más veces', score: 5 }
];

const q7options = [ // For PAQ-A Q7
    { value: 'a', label: 'Durante toda la semana estuve muy poco activo. No hice nada o casi nada.', score: 1 },
    { value: 'b', label: 'Hice algunas actividades, pero la mayoría del tiempo estuve descansando.', score: 2 },
    { value: 'c', label: 'Hice actividades físicas con bastante frecuencia', score: 3 },
    { value: 'd', label: 'Hice actividades físicas con mucha frecuencia', score: 4 },
    { value: 'e', label: 'Hice actividades físicas todos los días', score: 5 }
];

const activityRecordSchema = z.record(z.enum(frequencyOptions.map(f => f.value) as [Frequency, ...Frequency[]]).nullable());
const dailyFreqRecordSchema = z.record(z.enum(dailyActivityOptions.map(d => d.value) as [DailyActivityFrequency, ...DailyActivityFrequency[]]).nullable());


const adolescentFormSchema = z.object({
  evalFirstName: z.string(),
  evalLastName: z.string(),
  evalIdNumber: z.string(),
  evalDob: z.date(),
  evalCalculatedAge: z.number().optional(),

  phone: z.string().min(7, "Teléfono inválido."),
  sex: z.enum(["Femenino", "Masculino", "Otro"], { required_error: "Sexo es requerido." }),
  weight: z.coerce.number().positive("Peso debe ser positivo.").default(0),
  height: z.coerce.number().positive("Talla debe ser positiva.").default(0),

  paqA1_activities: activityRecordSchema.refine(val => Object.values(val).some(v => v !== null), {message: "Debe seleccionar al menos una frecuencia para una actividad en la pregunta 1."}),
  paqA1_other_activity_text: z.string().optional().default(""),

  paqA2_educacion_fisica: z.enum(['a', 'b', 'c', 'd', 'e'], { required_error: "Pregunta 2 es requerida." }),
  paqA3_hasta_almuerzo: z.enum(['a', 'b', 'c', 'd', 'e'], { required_error: "Pregunta 3 es requerida." }),
  paqA4_despues_colegio: z.enum(['a', 'b', 'c', 'd', 'e'], { required_error: "Pregunta 4 es requerida." }),
  paqA5_tardes: z.enum(['a', 'b', 'c', 'd', 'e'], { required_error: "Pregunta 5 es requerida." }),
  paqA6_fin_semana: z.enum(['a', 'b', 'c', 'd', 'e'], { required_error: "Pregunta 6 es requerida." }),
  paqA7_descripcion_semana: z.enum(['a', 'b', 'c', 'd', 'e'], { required_error: "Pregunta 7 es requerida." }),

  paqA8_daily_freq: dailyFreqRecordSchema.refine(val => daysOfWeek.every(day => val[day.id] !== null && val[day.id] !== undefined), {message: "Debe seleccionar una frecuencia para cada día en la pregunta 8."}),

  paqA9_enfermo: z.enum(['si', 'no'], { required_error: "Pregunta 9 es requerida." }),
  paqA9_enfermo_razon: z.string().optional().default(""),
}).refine(data => {
    if (data.paqA9_enfermo === 'si') {
        return !!data.paqA9_enfermo_razon && data.paqA9_enfermo_razon.length > 0;
    }
    return true;
}, {
    message: "Debe especificar la razón si estuvo enfermo.",
    path: ["paqA9_enfermo_razon"],
});

type AdolescentFormValues = z.infer<typeof adolescentFormSchema>;

export default function AdolescentForm() {
  const { initialData, setInitialData } = useFormData();
  const { addEvaluationRecord } = useEvaluationContext();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [results, setResults] = useState<{ score: number; classification: string } | null>(null);
  const [isClient, setIsClient] = useState(false);
  const regComplete = searchParams.get('regComplete');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<AdolescentFormValues>({
    resolver: zodResolver(adolescentFormSchema),
    defaultValues: {
      evalFirstName: "", evalLastName: "", evalIdNumber: "", evalDob: undefined,
      evalCalculatedAge: 0, phone: "", sex: undefined, weight: 0, height: 0,
      paqA1_activities: Object.fromEntries(paqAActivities.map(act => [act.id, null])),
      paqA1_other_activity_text: "",
      paqA8_daily_freq: Object.fromEntries(daysOfWeek.map(day => [day.id, null])),
      paqA9_enfermo: undefined,
      paqA9_enfermo_razon: "",
    },
  });

  useEffect(() => {
    if (initialData) {
        form.reset({
            evalFirstName: initialData.first_name || "",
            evalLastName: initialData.last_name || "",
            evalIdNumber: initialData.id_number || "",
            evalDob: initialData.dob ? new Date(initialData.dob) : undefined,
            evalCalculatedAge: initialData.calculated_age || 0,
            phone: "",
            sex: initialData.sex || undefined,
            weight: 0,
            height: 0,
            paqA1_activities: Object.fromEntries(paqAActivities.map(act => [act.id, null])),
            paqA1_other_activity_text: "",
            paqA8_daily_freq: Object.fromEntries(daysOfWeek.map(day => [day.id, null])),
            paqA9_enfermo: undefined,
            paqA9_enfermo_razon: "",
        });
    }
  }, [initialData, form]);

  const evalDobValue = form.watch("evalDob");
  useEffect(() => {
    if (evalDobValue) {
      form.setValue("evalCalculatedAge", calculateDecimalAge(evalDobValue));
    }
  }, [evalDobValue, form]);

  const paqA9EnfermoValue = form.watch("paqA9_enfermo");

  async function onSubmit(values: AdolescentFormValues) {
    setIsLoading(true);

    if (!initialData || !initialData.id) {
        toast({ title: "Error", description: "Faltan datos iniciales del participante o el ID del participante no está disponible. Por favor, regístrese primero.", variant: "destructive" });
        setIsLoading(false);
        router.push("/register-data?regComplete=0");
        return;
    }

    const paqResults = calculatePaqScore(values, 'PAQ-A');
    setResults(paqResults);

    const recordToSave = {
        participant_id: initialData.id,
        form_type: 'PAQ-A' as 'PAQ-A',
        accepted_terms: initialData.accepted_terms,
        form_data: values,
        paq_score: paqResults.score,
        paq_classification: paqResults.classification,
    };

    const result = await addEvaluationRecord(recordToSave);

    if (result.success) {
        toast({
          title: "Formulario Enviado",
          description: "Los datos del adolescente han sido procesados y registrados.",
        });
        setShowResultsDialog(true);
    } else {
        toast({
            title: "Error al Guardar",
            description: result.message || "No se pudo guardar el registro de evaluación.",
            variant: "destructive",
        });
    }
    setIsLoading(false);
  }

  if (!isClient) {
    return <div className="flex flex-col justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /><p className="text-muted-foreground">Cargando formulario...</p></div>;
  }
  
  if (initialData) {
    return (
        <Card className="shadow-xl">
        <CardHeader>
            <CardTitle className="text-xl font-headline text-primary">Cuestionario de Actividad Física para Adolescentes</CardTitle>
            <CardDescription>Todos los campos son obligatorios a menos que se indique lo contrario.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <h3 className="text-lg font-semibold border-b pb-2 text-primary">Datos del Evaluado</h3>
                <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="evalFirstName" render={({ field }) => (<FormItem><FormLabel>Nombres</FormLabel><FormControl><Input {...field} readOnly className="bg-muted/50"/></FormControl></FormItem>)} />
                <FormField control={form.control} name="evalLastName" render={({ field }) => (<FormItem><FormLabel>Apellidos</FormLabel><FormControl><Input {...field} readOnly className="bg-muted/50"/></FormControl></FormItem>)} />
                <FormField control={form.control} name="evalIdNumber" render={({ field }) => (<FormItem><FormLabel>Número de Identificación</FormLabel><FormControl><Input {...field} readOnly className="bg-muted/50"/></FormControl></FormItem>)} />
                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="sex" render={({ field }) => (<FormItem><FormLabel>Sexo</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!!initialData?.sex}><FormControl><SelectTrigger className={initialData?.sex ? "bg-muted/50 cursor-not-allowed" : ""}><SelectValue placeholder="Seleccione el sexo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Femenino">Femenino</SelectItem><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Otro">Otro</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="evalDob" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Fecha de Nacimiento</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground", initialData?.dob && "bg-muted/50 cursor-not-allowed")} disabled={!!initialData?.dob}>
                            {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button></FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01") || !!initialData?.dob} initialFocus captionLayout="dropdown-buttons" fromYear={1980} toYear={new Date().getFullYear()} />
                        </PopoverContent></Popover><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="evalCalculatedAge" render={({ field }) => (<FormItem><FormLabel>Edad (decimal)</FormLabel><FormControl><Input type="number" {...field} value={field.value || 0} readOnly className="bg-muted/50"/></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="weight" render={({ field }) => (<FormItem><FormLabel>Peso (kg)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="height" render={({ field }) => (<FormItem><FormLabel>Talla (cm)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>

                <h3 className="text-lg font-semibold border-b pb-2 text-primary">Cuestionario de Actividad Física</h3>
                <p className="text-sm text-muted-foreground">Queremos conocer cuál es tu nivel de actividad física en los últimos 7 días (última semana). Esto incluye todas aquellas actividades como deportes, gimnasia o danza que hacen sudar o sentirse cansado, o juegos que hagan que se acelere tu respiración como jugar, saltar, correr, trepar y otras.</p>

                <FormItem>
                    <FormLabel className="text-base">1. Actividad Física en tu tiempo libre: ¿Has hecho alguna de estas actividades en los últimos 7 días (última semana)? Si tu respuesta es sí: ¿cuántas veces las has hecho?</FormLabel>
                    <ActivityTableInput control={form.control} activities={paqAActivities} options={frequencyOptions} namePrefix="paqA1_activities" otherFieldName="paqA1_other_activity_text" watch={form.watch} setValue={form.setValue} />
                    <FormField control={form.control} name="paqA1_activities" render={() => <FormMessage />} />
                </FormItem>

                <FormQuestion control={form.control} name="paqA2_educacion_fisica" questionText="2. En los últimos 7 días, durante las clases de educación física. ¿Cuántas veces estuviste muy activo durante las clases: jugando intensamente, corriendo, saltando, haciendo lanzamiento?" options={q2options} />
                <FormQuestion control={form.control} name="paqA3_hasta_almuerzo" questionText="3. En los últimos 7 días, ¿Qué hiciste hasta el almuerzo (además de comer)?" options={q3options} />
                <FormQuestion control={form.control} name="paqA4_despues_colegio" questionText="4. En los últimos 7 días, ¿cuántos días después del colegio hiciste deportes, baile o jugaste a juegos en los que estuvieras muy activo? (2:00pma6:00pm)" options={q4options} />
                <FormQuestion control={form.control} name="paqA5_tardes" questionText="5. En los últimos 7 días, cuantas tardes hiciste deporte, ¿baile o jugar a juegos en los que estuviste muy activo? (6:00p.m en adelante)" options={q4options} />
                <FormQuestion control={form.control} name="paqA6_fin_semana" questionText="6. El último Fin de Semana. ¿Cuántas veces hiciste deporte, baile o jugar a juegos en los que estuviste muy activo?" options={q4options} />
                <FormQuestion control={form.control} name="paqA7_descripcion_semana" questionText="7. ¿Cuál de las siguientes frases describen mejor tu última semana? Lee las cinco antes de decidir cuál te describe mejor." options={q7options} />

                <FormItem>
                    <FormLabel className="text-base">8. Señala con qué frecuencia hiciste actividad física para cada día de la última semana.</FormLabel>
                    <ActivityTableInput control={form.control} activities={daysOfWeek} options={dailyActivityOptions} namePrefix="paqA8_daily_freq" />
                    <FormField control={form.control} name="paqA8_daily_freq" render={() => <FormMessage />} />
                </FormItem>

                <FormField control={form.control} name="paqA9_enfermo" render={({ field }) => (
                    <FormItem className="space-y-3 p-4 border rounded-md shadow-sm bg-card">
                    <FormLabel className="text-base">9. ¿Estuviste enfermo esta última semana o algo impidió que hicieras normalmente actividades físicas?</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                        <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="no" /></FormControl><FormLabel className="font-normal text-muted-foreground hover:text-foreground cursor-pointer">No</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="si" /></FormControl><FormLabel className="font-normal text-muted-foreground hover:text-foreground cursor-pointer">Sí</FormLabel></FormItem>
                        </RadioGroup></FormControl><FormMessage />
                    </FormItem>)} />

                {paqA9EnfermoValue === 'si' && (
                <FormField control={form.control} name="paqA9_enfermo_razon" render={({ field }) => (
                    <FormItem><FormLabel>Si la respuesta es sí, indique que lo impidió:</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Enviar Formulario Adolescentes
                </Button>
            </form>
            </Form>
            {results && (
            <AlertDialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Resultados del Cuestionario</AlertDialogTitle>
                    <AlertDialogDescription>
                    Puntaje Obtenido: {results.score}
                    <br />
                    Clasificación: <span className="font-semibold text-primary">{results.classification}</span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => {
                    setShowResultsDialog(false);
                    form.reset();
                    setInitialData(null);
                    router.push('/register-data?regComplete=0');
                    }}>
                    Entendido y Nuevo Registro
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            )}
        </CardContent>
        </Card>
    );
  }

  if (regComplete === '1') {
    return (
        <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Cargando datos del participante...</p>
        </div>
    );
  }

  return (
    <Card className="shadow-xl">
        <CardHeader>
            <CardTitle className="text-xl font-headline text-destructive">Acceso Restringido</CardTitle>
            <CardDescription>
                Para completar este formulario, primero debe registrar los datos iniciales del participante.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Button onClick={() => router.push('/register-data')}>Ir al Registro de Datos</Button>
        </CardContent>
    </Card>
  );
}
