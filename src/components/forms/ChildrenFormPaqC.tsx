//niños
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

const paqCActivities: { id: string; label: string; isOther?: boolean }[] = [
  { id: "saltar_soga", label: "Saltar la soga" },
  { id: "juegos", label: "Juegos (Ej: Chapadas, escondidas)" },
  { id: "montar_bicicleta", label: "Montar en bicicleta" },
  { id: "caminata_paseo", label: "Caminata o paseo a pie" },
  { id: "correr_parque", label: "Salir a correr al parque" },
  { id: "natacion", label: "Natación" },
  { id: "bailar_danza", label: "Bailar/danza" },
  { id: "gimnasia", label: "Gimnasia" },
  { id: "futbol", label: "Fútbol" },
  { id: "voley", label: "Vóley" },
  { id: "basquet", label: "Básquet" },
  { id: "atletismo", label: "Atletismo" },
  { id: "artes_marciales", label: "Artes Marciales" },
  { id: "otros", label: "Otros", isOther: true },
];

const daysOfWeek: { id: string; label: string }[] = [
    { id: "lunes", label: "Lunes" }, { id: "martes", label: "Martes" }, { id: "miercoles", label: "Miércoles" },
    { id: "jueves", label: "Jueves" }, { id: "viernes", label: "Viernes" }, { id: "sabado", label: "Sábado" },
    { id: "domingo", label: "Domingo" },
];

const q2_options_c = [
    { value: 'a', label: 'Ninguna', score: 1 },
    { value: 'b', label: 'Un poco', score: 2 },
    { value: 'c', label: 'Bastante', score: 3 },
    { value: 'd', label: 'Casi siempre', score: 4 },
    { value: 'e', label: 'Siempre', score: 5 }
];

const q3_options_c = [
    { value: 'a', label: 'Me senté (hablando, leyendo, haciendo deberes)', score: 1 },
    { value: 'b', label: 'Estuve de pie o caminé un poco', score: 2 },
    { value: 'c', label: 'Corrí o jugué un poco', score: 3 },
    { value: 'd', label: 'Corrí o jugué bastante', score: 4 },
    { value: 'e', label: 'Corrí o jugué mucho', score: 5 }
];

const q5_options_c = [ // For questions 5, 6, 7 of PAQ-C
    { value: 'a', label: 'Ninguna', score: 1 },
    { value: 'b', label: '1 vez', score: 2 },
    { value: 'c', label: '2-3 veces', score: 3 },
    { value: 'd', label: '4-5 veces', score: 4 },
    { value: 'e', label: '6 o más veces', score: 5 }
];

const q8_options_c = [ // For question 8 of PAQ-C
    { value: 'a', label: 'Durante toda la semana estuve muy poco activo. No hice nada o casi nada.', score: 1 },
    { value: 'b', label: 'Hice algunas actividades, pero la mayoría del tiempo estuve descansando.', score: 2 },
    { value: 'c', label: 'Hice actividades físicas con bastante frecuencia', score: 3 },
    { value: 'd', label: 'Hice actividades físicas con mucha frecuencia', score: 4 },
    { value: 'e', label: 'Hice actividades físicas todos los días', score: 5 }
];


const activityRecordSchema = z.record(z.enum(frequencyOptions.map(f => f.value) as [Frequency, ...Frequency[]]).nullable());
const dailyFreqRecordSchema = z.record(z.enum(dailyActivityOptions.map(d => d.value) as [DailyActivityFrequency, ...DailyActivityFrequency[]]).nullable());

const childrenFormSchema = z.object({
  repFirstName: z.string().min(2, "Nombre del representante es requerido."),
  repLastName: z.string().min(2, "Apellido del representante es requerido."),
  repEmail: z.string().email("Correo inválido."),
  repPhone: z.string().min(7, "Teléfono inválido."),
  repIdNumber: z.string().min(5, "Identificación inválida."),

  evalFirstName: z.string().min(2, "Nombre del evaluado es requerido."),
  evalLastName: z.string().min(2, "Apellido del evaluado es requerido."),
  evalIdNumber: z.string().min(5, "Identificación del evaluado inválida."),
  evalSex: z.enum(["Femenino", "Masculino", "Otro"], { required_error: "Sexo es requerido." }),
  evalDob: z.date({ required_error: "Fecha de nacimiento del evaluado es requerida." }),
  evalCalculatedAge: z.number().optional(),
  evalWeight: z.coerce.number().positive("Peso debe ser positivo.").default(0),
  evalHeight: z.coerce.number().positive("Talla debe ser positiva.").default(0),

  paqC1_activities: activityRecordSchema.refine(val => Object.values(val).some(v => v !== null), {message: "Debe seleccionar al menos una frecuencia para una actividad en la pregunta 1."}),
  paqC1_other_activity_text: z.string().optional().default(""),

  paqC2_educacion_fisica: z.enum(['a', 'b', 'c', 'd', 'e'], { required_error: "Pregunta 2 es requerida." }),
  paqC3_recreo: z.enum(['a', 'b', 'c', 'd', 'e'], { required_error: "Pregunta 3 es requerida." }),
  paqC4_antes_despues_comer: z.enum(['a', 'b', 'c', 'd', 'e'], { required_error: "Pregunta 4 es requerida." }),
  paqC5_despues_colegio: z.enum(['a', 'b', 'c', 'd', 'e'], { required_error: "Pregunta 5 es requerida." }),
  paqC6_noche: z.enum(['a', 'b', 'c', 'd', 'e'], { required_error: "Pregunta 6 es requerida." }),
  paqC7_fin_semana: z.enum(['a', 'b', 'c', 'd', 'e'], { required_error: "Pregunta 7 es requerida." }),
  paqC8_descripcion_semana: z.enum(['a', 'b', 'c', 'd', 'e'], { required_error: "Pregunta 8 es requerida." }),

  paqC9_daily_freq: dailyFreqRecordSchema.refine(val => daysOfWeek.every(day => val[day.id] !== null && val[day.id] !== undefined), {message: "Debe seleccionar una frecuencia para cada día en la pregunta 9."}),

  paqC10_enfermo: z.enum(['si', 'no'], { required_error: "Pregunta 10 es requerida." }),
  paqC10_enfermo_razon: z.string().optional().default(""),
}).refine(data => {
    if (data.paqC10_enfermo === 'si') {
        return !!data.paqC10_enfermo_razon && data.paqC10_enfermo_razon.length > 0;
    }
    return true;
}, {
    message: "Debe especificar la razón si estuvo enfermo.",
    path: ["paqC10_enfermo_razon"],
});


type ChildrenFormValues = z.infer<typeof childrenFormSchema>;

export default function ChildrenFormPaqC() {
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

  const form = useForm<ChildrenFormValues>({
    resolver: zodResolver(childrenFormSchema),
    defaultValues: {
      repFirstName: "", repLastName: "", repEmail: "", repPhone: "", repIdNumber: "",
      evalFirstName: "", evalLastName: "", evalIdNumber: "", evalSex: undefined,
      evalDob: undefined, evalCalculatedAge: 0, evalWeight: 0, evalHeight: 0,
      paqC1_activities: Object.fromEntries(paqCActivities.map(act => [act.id, null])),
      paqC1_other_activity_text: "",
      paqC9_daily_freq: Object.fromEntries(daysOfWeek.map(day => [day.id, null])),
      paqC10_enfermo: undefined,
      paqC10_enfermo_razon: "",
    },
  });

  useEffect(() => {
    if (initialData) {
        form.reset({
            repFirstName: "", repLastName: "", repEmail: "", repPhone: "", repIdNumber: "",
            evalFirstName: initialData.first_name || "",
            evalLastName: initialData.last_name || "",
            evalIdNumber: initialData.id_number || "",
            evalSex: initialData.sex || undefined,
            evalDob: initialData.dob ? new Date(initialData.dob) : undefined,
            evalCalculatedAge: Number(Number(initialData.calculated_age ?? 0).toFixed(2)),
            evalWeight: 0,
            evalHeight: 0,
            paqC1_activities: Object.fromEntries(paqCActivities.map(act => [act.id, null])),
            paqC1_other_activity_text: "",
            paqC9_daily_freq: Object.fromEntries(daysOfWeek.map(day => [day.id, null])),
            paqC10_enfermo: undefined,
            paqC10_enfermo_razon: "",
        });
    }
  }, [initialData, form]);

  const evalDobValue = form.watch("evalDob");
useEffect(() => {
  if (evalDobValue) {
    const age = Number(calculateDecimalAge(evalDobValue).toFixed(2));
    form.setValue("evalCalculatedAge", age);
  }
}, [evalDobValue, form]);

  const paqC10EnfermoValue = form.watch("paqC10_enfermo");


  async function onSubmit(values: ChildrenFormValues) {
    setIsLoading(true);

    if (!initialData || !initialData.id) {
        toast({ title: "Error", description: "Faltan datos iniciales del participante o el ID del participante no está disponible. Por favor, regístrese primero.", variant: "destructive" });
        setIsLoading(false);
        router.push("/register-data?regComplete=0");
        return;
    }

    const paqResults = calculatePaqScore(values, 'PAQ-C');
    setResults(paqResults);

    const recordToSave = {
        participant_id: initialData.id,
        form_type: 'PAQ-C' as 'PAQ-C',
        accepted_terms: initialData.accepted_terms,
        form_data: values,
        paq_score: paqResults.score,
        paq_classification: paqResults.classification,
    };

    const result = await addEvaluationRecord(recordToSave);

    if (result.success) {
        toast({
        title: "Formulario PAQ-C enviado",
        description: "Ahora continuará con el formulario PAR-Q.",
        });

        router.push("/par-q-form?regComplete=1");
        return;
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
            <CardTitle className="text-xl font-headline text-primary">Cuestionario de Actividad Física para Niños (PAQ-C)</CardTitle>
            <CardDescription>Todos los campos son obligatorios a menos que se indique lo contrario.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                <h3 className="text-lg font-semibold border-b pb-2 text-primary">Datos del Representante</h3>
                <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="repFirstName" render={({ field }) => (<FormItem><FormLabel>Nombres</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="repLastName" render={({ field }) => (<FormItem><FormLabel>Apellidos</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="repEmail" render={({ field }) => (<FormItem><FormLabel>Correo</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="repPhone" render={({ field }) => (<FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="repIdNumber" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Número de Identificación</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>

                <h3 className="text-lg font-semibold border-b pb-2 text-primary">Datos del Evaluado</h3>
                <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="evalFirstName" render={({ field }) => (<FormItem><FormLabel>Nombres</FormLabel><FormControl><Input {...field} readOnly className="bg-muted/50" /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="evalLastName" render={({ field }) => (<FormItem><FormLabel>Apellidos</FormLabel><FormControl><Input {...field} readOnly className="bg-muted/50"/></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="evalIdNumber" render={({ field }) => (<FormItem><FormLabel>Número de Identificación</FormLabel><FormControl><Input {...field} readOnly className="bg-muted/50"/></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="evalSex" render={({ field }) => (<FormItem><FormLabel>Sexo</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!!initialData?.sex}><FormControl><SelectTrigger className={initialData?.sex ? "bg-muted/50 cursor-not-allowed" : ""}><SelectValue placeholder="Seleccione el sexo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Femenino">Femenino</SelectItem><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Otro">Otro</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="evalDob" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Fecha de Nacimiento</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground", initialData?.dob && "bg-muted/50 cursor-not-allowed")} disabled={!!initialData?.dob}>
                            {field.value ? format(field.value, "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button></FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01") || !!initialData?.dob} initialFocus captionLayout="dropdown-buttons" fromYear={2000} toYear={new Date().getFullYear()} />
                        </PopoverContent></Popover><FormMessage /></FormItem>)} />

                        <FormField
                        control={form.control}
                        name="evalCalculatedAge"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Edad (decimal)</FormLabel>
                            <FormControl>
                                <Input
                                type="number"
                                step="0.01"
                                {...field}
                                value={Number(field.value ?? 0).toFixed(2)}
                                readOnly
                                className="bg-muted/50"
                                />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                
                <FormField control={form.control} name="evalWeight" render={({ field }) => (<FormItem><FormLabel>Peso (kg)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="evalHeight" render={({ field }) => (<FormItem><FormLabel>Talla (cm)</FormLabel><FormControl><Input type="number" step="0.1" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>

                <h3 className="text-lg font-semibold border-b pb-2 text-primary">Cuestionario PAQ-C</h3>
                <FormItem>
                    <FormLabel className="text-base">1. ¿Has hecho alguna de estas actividades en los últimos 7 días? Si tu respuesta es sí, ¿cuántas veces lo has hecho?</FormLabel>
                    <ActivityTableInput control={form.control} activities={paqCActivities} options={frequencyOptions} namePrefix="paqC1_activities" otherFieldName="paqC1_other_activity_text" watch={form.watch} setValue={form.setValue} />
                    <FormField control={form.control} name="paqC1_activities" render={() => <FormMessage />} />
                </FormItem>

                <FormQuestion control={form.control} name="paqC2_educacion_fisica" questionText="2. Durante las clases de educación física, ¿cuántas veces estuviste muy activo?" options={q2_options_c} />
                <FormQuestion control={form.control} name="paqC3_recreo" questionText="3. ¿Qué hiciste durante el recreo?" options={q3_options_c} />
                <FormQuestion control={form.control} name="paqC4_antes_despues_comer" questionText="4. ¿Qué hiciste antes y después de comer?" options={q3_options_c} />
                <FormQuestion control={form.control} name="paqC5_despues_colegio" questionText="5. En los últimos 7 días, inmediatamente después del colegio, ¿cuántos días jugaste, hiciste deporte o bailaste en los que estuvieras muy activo?" options={q5_options_c} />
                <FormQuestion control={form.control} name="paqC6_noche" questionText="6. En los últimos 7 días, ¿cuántos días entre las 6 p.m y 10 p.m jugaste, bailaste o hiciste deportes en los que estuvieras muy activo?" options={q5_options_c} />
                <FormQuestion control={form.control} name="paqC7_fin_semana" questionText="7. El último fin de semana, ¿cuántas veces jugaste, bailaste o hiciste deportes en los que estuvieras muy activo?" options={q5_options_c} />
                <FormQuestion control={form.control} name="paqC8_descripcion_semana" questionText="8. ¿Cuál de las siguientes frases describen mejor tu última semana? Lee las cinco antes de decidir cuál te describe mejor." options={q8_options_c} />

                <FormItem>
                    <FormLabel className="text-base">9. Señala con qué frecuencia hiciste actividad física para cada día de la última semana.</FormLabel>
                    <ActivityTableInput control={form.control} activities={daysOfWeek} options={dailyActivityOptions} namePrefix="paqC9_daily_freq" />
                    <FormField control={form.control} name="paqC9_daily_freq" render={() => <FormMessage />} />
                </FormItem>

                <FormField control={form.control} name="paqC10_enfermo" render={({ field }) => (
                    <FormItem className="space-y-3 p-4 border rounded-md shadow-sm bg-card">
                    <FormLabel className="text-base">10. ¿Estuviste enfermo esta última semana o algo impidió que hicieras normalmente actividades físicas?</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-col space-y-1">
                        <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="no" /></FormControl><FormLabel className="font-normal text-muted-foreground hover:text-foreground cursor-pointer">No</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0"><FormControl><RadioGroupItem value="si" /></FormControl><FormLabel className="font-normal text-muted-foreground hover:text-foreground cursor-pointer">Sí</FormLabel></FormItem>
                        </RadioGroup></FormControl><FormMessage />
                    </FormItem>)} />

                {paqC10EnfermoValue === 'si' && (
                <FormField control={form.control} name="paqC10_enfermo_razon" render={({ field }) => (
                    <FormItem><FormLabel>Si la respuesta es sí, qué lo impidió:</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Enviar Formulario PAQ-C
                </Button>
            </form>
            </Form>
            
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
