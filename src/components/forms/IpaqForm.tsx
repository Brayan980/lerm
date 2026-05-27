
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useFormData } from "@/contexts/FormDataContext";
import { useEvaluationContext } from "@/contexts/EvaluationContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const ipaqSchema = z.object({
  vigorous_days: z.coerce.number().int().min(0).max(7).default(0),
  no_vigorous_activity: z.boolean().default(false),
  vigorous_hours_per_day: z.coerce.number().int().min(0).default(0),
  vigorous_minutes_per_day: z.coerce.number().int().min(0).max(1440).default(0),
  vigorous_dont_know: z.boolean().default(false),

  moderate_days: z.coerce.number().int().min(0).max(7).default(0),
  no_moderate_activity: z.boolean().default(false),
  moderate_hours_per_day: z.coerce.number().int().min(0).default(0),
  moderate_minutes_per_day: z.coerce.number().int().min(0).max(1440).default(0),
  moderate_dont_know: z.boolean().default(false),

  walk_days: z.coerce.number().int().min(0).max(7).default(0),
  no_walk_activity: z.boolean().default(false),
  walk_hours_per_day: z.coerce.number().int().min(0).default(0),
  walk_minutes_per_day: z.coerce.number().int().min(0).max(1440).default(0),
  walk_dont_know: z.boolean().default(false),

  sit_hours_weekday: z.coerce.number().int().min(0).default(0),
  sit_minutes_weekday: z.coerce.number().int().min(0).max(1440).default(0),
  sit_dont_know: z.boolean().default(false),
})
.refine(data => !(data.no_vigorous_activity && (data.vigorous_days > 0)), { message: "No puede indicar días si no realizó actividad vigorosa.", path: ["vigorous_days"] })
.refine(data => !(data.no_moderate_activity && (data.moderate_days > 0)), { message: "No puede indicar días si no realizó actividad moderada.", path: ["moderate_days"] })
.refine(data => !(data.no_walk_activity && (data.walk_days > 0)), { message: "No puede indicar días si no caminó.", path: ["walk_days"] })
.refine(data => (data.no_vigorous_activity || data.vigorous_dont_know || data.vigorous_hours_per_day >= 0 || data.vigorous_minutes_per_day >= 0), { message: "Debe indicar tiempo o 'No sabe' para actividad vigorosa.", path: ["vigorous_hours_per_day"] })
.refine(data => (data.no_moderate_activity || data.moderate_dont_know || data.moderate_hours_per_day >= 0 || data.moderate_minutes_per_day >= 0), { message: "Debe indicar tiempo o 'No sabe' para actividad moderada.", path: ["moderate_hours_per_day"] })
.refine(data => (data.no_walk_activity || data.walk_dont_know || data.walk_hours_per_day >= 0 || data.walk_minutes_per_day >= 0), { message: "Debe indicar tiempo o 'No sabe' para caminata.", path: ["walk_hours_per_day"] })
.refine(data => (data.sit_dont_know || data.sit_hours_weekday >= 0 || data.sit_minutes_weekday >= 0), { message: "Debe indicar tiempo o 'No sabe' para tiempo sentado.", path: ["sit_hours_weekday"] });


type IpaqFormValues = z.infer<typeof ipaqSchema>;

interface IpaqResult {
    totalMETMinutesPerWeek: number;
    activityLevel: 'Bajo' | 'Moderado' | 'Alto' | 'Insuficientemente Activo';
}

function calculateIpaq(data: IpaqFormValues): IpaqResult {
    const METs = { vigorous: 8.0, moderate: 4.0, walk: 3.3 };
    let totalMETMinutes = 0;

    const vigorousTime = data.vigorous_dont_know || data.no_vigorous_activity ? 0 : ((data.vigorous_hours_per_day || 0) * 60 + (data.vigorous_minutes_per_day || 0));
    const moderateTime = data.moderate_dont_know || data.no_moderate_activity ? 0 : ((data.moderate_hours_per_day || 0) * 60 + (data.moderate_minutes_per_day || 0));
    const walkTime = data.walk_dont_know || data.no_walk_activity ? 0 : ((data.walk_hours_per_day || 0) * 60 + (data.walk_minutes_per_day || 0));

    const vigorousDays = data.no_vigorous_activity ? 0 : (data.vigorous_days || 0);
    const moderateDays = data.no_moderate_activity ? 0 : (data.moderate_days || 0);
    const walkDays = data.no_walk_activity ? 0 : (data.walk_days || 0);

    totalMETMinutes += (vigorousTime * METs.vigorous * vigorousDays);
    totalMETMinutes += (moderateTime * METs.moderate * moderateDays);
    totalMETMinutes += (walkTime * METs.walk * walkDays);

    totalMETMinutes = Math.round(totalMETMinutes);

    let activityLevel: IpaqResult['activityLevel'] = 'Insuficientemente Activo';

    const totalActivityDays = vigorousDays + moderateDays + walkDays;
    const meetsVigorousCriteria = vigorousDays >= 3 && totalMETMinutes >= 1500;
    const meetsCombinedCriteria = totalActivityDays >= 7 && totalMETMinutes >= 3000;

    if (meetsVigorousCriteria || meetsCombinedCriteria) {
        activityLevel = 'Alto';
    } else {
        const meetsModerateCriteria1 = vigorousDays >= 3 && vigorousTime >= 20;
        const meetsModerateCriteria2 = (moderateDays >= 5 || walkDays >=5 ) && (moderateTime >=30 || walkTime >=30);
        const meetsModerateCriteria3 = totalActivityDays >= 5 && totalMETMinutes >= 600;

        if (meetsModerateCriteria1 || meetsModerateCriteria2 || meetsModerateCriteria3) {
            activityLevel = 'Moderado';
        } else {
             if (totalMETMinutes > 0) activityLevel = 'Bajo';
             else activityLevel = 'Insuficientemente Activo';
        }
    }
    if (totalMETMinutes === 0 && vigorousTime === 0 && moderateTime === 0 && walkTime === 0) activityLevel = 'Insuficientemente Activo';


    return { totalMETMinutesPerWeek: totalMETMinutes, activityLevel };
}


export default function IpaqForm() {
  const { initialData, setInitialData } = useFormData();
  const { addEvaluationRecord } = useEvaluationContext();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [results, setResults] = useState<IpaqResult | null>(null);
  const [isClient, setIsClient] = useState(false);
  const regComplete = searchParams.get('regComplete');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<IpaqFormValues>({
    resolver: zodResolver(ipaqSchema),
    defaultValues: {
      vigorous_days: 0,
      vigorous_hours_per_day: 0,
      vigorous_minutes_per_day: 0,
      no_vigorous_activity: false,
      vigorous_dont_know: false,

      moderate_days: 0,
      moderate_hours_per_day: 0,
      moderate_minutes_per_day: 0,
      no_moderate_activity: false,
      moderate_dont_know: false,

      walk_days: 0,
      walk_hours_per_day: 0,
      walk_minutes_per_day: 0,
      no_walk_activity: false,
      walk_dont_know: false,

      sit_hours_weekday: 0,
      sit_minutes_weekday: 0,
      sit_dont_know: false,
    },
  });

  const watchNoVigorous = form.watch("no_vigorous_activity");
  const watchVigorousDontKnow = form.watch("vigorous_dont_know");
  const watchNoModerate = form.watch("no_moderate_activity");
  const watchModerateDontKnow = form.watch("moderate_dont_know");
  const watchNoWalk = form.watch("no_walk_activity");
  const watchWalkDontKnow = form.watch("walk_dont_know");
  const watchSitDontKnow = form.watch("sit_dont_know");

  useEffect(() => { if (watchNoVigorous) { form.setValue("vigorous_days", 0); form.setValue("vigorous_hours_per_day", 0); form.setValue("vigorous_minutes_per_day", 0); form.setValue("vigorous_dont_know", false); }}, [watchNoVigorous, form]);
  useEffect(() => { if (watchVigorousDontKnow && !watchNoVigorous) { form.setValue("vigorous_hours_per_day", 0); form.setValue("vigorous_minutes_per_day", 0); }}, [watchVigorousDontKnow, watchNoVigorous, form]);
  useEffect(() => { if (watchNoModerate) { form.setValue("moderate_days", 0); form.setValue("moderate_hours_per_day", 0); form.setValue("moderate_minutes_per_day", 0); form.setValue("moderate_dont_know", false); }}, [watchNoModerate, form]);
  useEffect(() => { if (watchModerateDontKnow && !watchNoModerate) { form.setValue("moderate_hours_per_day", 0); form.setValue("moderate_minutes_per_day", 0); }}, [watchModerateDontKnow, watchNoModerate, form]);
  useEffect(() => { if (watchNoWalk) { form.setValue("walk_days", 0); form.setValue("walk_hours_per_day", 0); form.setValue("walk_minutes_per_day", 0); form.setValue("walk_dont_know", false); }}, [watchNoWalk, form]);
  useEffect(() => { if (watchWalkDontKnow && !watchNoWalk) { form.setValue("walk_hours_per_day", 0); form.setValue("walk_minutes_per_day", 0); }}, [watchWalkDontKnow, watchNoWalk, form]);
  useEffect(() => { if (watchSitDontKnow) { form.setValue("sit_hours_weekday", 0); form.setValue("sit_minutes_weekday", 0); }}, [watchSitDontKnow, form]);

  async function onSubmit(values: IpaqFormValues) {
    setIsSubmitting(true);

    if (!initialData || !initialData.id) {
        toast({ title: "Error", description: "Faltan datos iniciales del participante o el ID del participante no está disponible. Por favor, regístrese primero.", variant: "destructive" });
        setIsSubmitting(false);
        router.push("/register-data?regComplete=0");
        return;
    }

    const ipaqResults = calculateIpaq(values);
    setResults(ipaqResults);

    const recordToSave = {
        participant_id: initialData.id,
        form_type: 'IPAQ' as 'IPAQ',
        accepted_terms: initialData.accepted_terms,
        form_data: values,
        ipaq_met_minutes: ipaqResults.totalMETMinutesPerWeek,
        ipaq_classification: ipaqResults.activityLevel,
    };

    const result = await addEvaluationRecord(recordToSave);

    if (result.success) {
        toast({
          title: "Formulario IPAQ Enviado",
          description: "Sus respuestas han sido procesadas y registradas.",
        });
        setShowResultsDialog(true);
    } else {
        toast({
            title: "Error al Guardar",
            description: result.message || "No se pudo guardar el registro de evaluación.",
            variant: "destructive",
        });
    }
    setIsSubmitting(false);
  }

  if (!isClient) {
    return <div className="flex flex-col justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary mb-4" /><p className="text-muted-foreground">Cargando formulario...</p></div>;
  }
  
  if (initialData) {
    return (
        <Card className="shadow-xl">
        <CardHeader>
            <CardTitle className="text-xl font-headline text-primary">Cuestionario Internacional de Actividad Física (IPAQ)</CardTitle>
            {initialData && <CardDescription>Hola {initialData.first_name}, por favor completa el cuestionario.</CardDescription>}
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
                <div className="space-y-4 p-4 border rounded-md shadow-sm bg-card/80">
                <FormLabel className="text-base font-semibold text-foreground">Actividad Física Vigorosa</FormLabel>
                <FormDescription>Piense en actividades que requieren un esfuerzo físico intenso y que le hacen respirar mucho más fuerte de lo normal.</FormDescription>
                <FormField control={form.control} name="vigorous_days" render={({ field }) => (
                    <FormItem><FormLabel>1. Durante los últimos 7 días, ¿en cuántos días realizó actividades físicas vigorosas?</FormLabel>
                    <FormControl><Input type="number" {...field} disabled={watchNoVigorous} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="no_vigorous_activity" render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="font-normal text-sm text-muted-foreground">Ninguna actividad física intensa (vaya a la pregunta 3)</FormLabel></FormItem>)} />
                {!watchNoVigorous && (<>
                    <FormLabel>2. Habitualmente, ¿cuánto tiempo en total dedicó a una actividad física intensa en uno de esos días?</FormLabel>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="vigorous_hours_per_day" render={({ field }) => (<FormItem><FormLabel className="text-xs">Horas por día:</FormLabel><FormControl><Input type="number" {...field} disabled={watchVigorousDontKnow}/></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="vigorous_minutes_per_day" render={({ field }) => (<FormItem><FormLabel className="text-xs">Minutos por día:</FormLabel><FormControl><Input type="number" {...field} disabled={watchVigorousDontKnow}/></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="vigorous_dont_know" render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={watchNoVigorous} /></FormControl>
                    <FormLabel className="font-normal text-sm text-muted-foreground">No sabe/no está seguro</FormLabel></FormItem>)} />
                </>)}
                </div>

                <div className="space-y-4 p-4 border rounded-md shadow-sm bg-card/80">
                <FormLabel className="text-base font-semibold text-foreground">Actividad Física Moderada</FormLabel>
                <FormDescription>Piense en actividades que requieren un esfuerzo físico moderado y que le hacen respirar algo más fuerte de lo normal.</FormDescription>
                <FormField control={form.control} name="moderate_days" render={({ field }) => (
                    <FormItem><FormLabel>3. ¿En cuántos días hizo actividades físicas moderadas?</FormLabel>
                    <FormControl><Input type="number" {...field} disabled={watchNoModerate}/></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="no_moderate_activity" render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="font-normal text-sm text-muted-foreground">Ninguna actividad física moderada (vaya a la pregunta 5)</FormLabel></FormItem>)} />
                {!watchNoModerate && (<>
                    <FormLabel>4. ¿Cuánto tiempo en total dedicó a una actividad física moderada en uno de esos días?</FormLabel>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="moderate_hours_per_day" render={({ field }) => (<FormItem><FormLabel className="text-xs">Horas por día:</FormLabel><FormControl><Input type="number" {...field} disabled={watchModerateDontKnow}/></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="moderate_minutes_per_day" render={({ field }) => (<FormItem><FormLabel className="text-xs">Minutos por día:</FormLabel><FormControl><Input type="number" {...field} disabled={watchModerateDontKnow}/></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="moderate_dont_know" render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={watchNoModerate}/></FormControl>
                    <FormLabel className="font-normal text-sm text-muted-foreground">No sabe/no está seguro</FormLabel></FormItem>)} />
                </>)}
                </div>

                <div className="space-y-4 p-4 border rounded-md shadow-sm bg-card/80">
                    <FormLabel className="text-base font-semibold text-foreground">Caminatas</FormLabel>
                    <FormDescription>Piense en el tiempo que usted dedicó a CAMINAR en los últimos 7 días. Incluya caminatas en el trabajo y en la casa, para transportarse de un lugar a otro, y cualquier otra caminata que usted haya hecho sólo por recreación, deporte, ejercicio o placer.</FormDescription>
                    <FormField control={form.control} name="walk_days" render={({ field }) => (
                        <FormItem><FormLabel>5. ¿En cuántos días caminó por lo menos 10 minutos seguidos?</FormLabel>
                        <FormControl><Input type="number" {...field} disabled={watchNoWalk}/></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="no_walk_activity" render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <FormLabel className="font-normal text-sm text-muted-foreground">No caminé por lo menos 10 minutos seguidos (vaya a la pregunta 7)</FormLabel></FormItem>)} />
                    {!watchNoWalk && (<>
                        <FormLabel>6. ¿Cuánto tiempo en total dedicó a caminar en uno de esos días?</FormLabel>
                        <div className="grid sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="walk_hours_per_day" render={({ field }) => (<FormItem><FormLabel className="text-xs">Horas por día:</FormLabel><FormControl><Input type="number" {...field} disabled={watchWalkDontKnow}/></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="walk_minutes_per_day" render={({ field }) => (<FormItem><FormLabel className="text-xs">Minutos por día:</FormLabel><FormControl><Input type="number" {...field} disabled={watchWalkDontKnow}/></FormControl><FormMessage /></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="walk_dont_know" render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={watchNoWalk}/></FormControl>
                        <FormLabel className="font-normal text-sm text-muted-foreground">No sabe/no está seguro</FormLabel></FormItem>)} />
                    </>)}
                </div>

                <div className="space-y-4 p-4 border rounded-md shadow-sm bg-card/80">
                    <FormLabel className="text-base font-semibold text-foreground">Tiempo Sentado</FormLabel>
                    <FormDescription>Piense en el tiempo que pasó usted SENTADO durante los días hábiles de los últimos 7 días. Incluya el tiempo que pasó en el trabajo, en casa, mientras hacía algún curso y durante su tiempo libre. Puede incluir el tiempo que pasó sentado en un escritorio, visitando a amigos, leyendo, sentado o acostado viendo la televisión.</FormDescription>
                    <FormLabel>7. ¿Cuánto tiempo pasó sentado durante un día hábil?</FormLabel>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <FormField control={form.control} name="sit_hours_weekday" render={({ field }) => (<FormItem><FormLabel className="text-xs">Horas por día:</FormLabel><FormControl><Input type="number" {...field} disabled={watchSitDontKnow}/></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="sit_minutes_weekday" render={({ field }) => (<FormItem><FormLabel className="text-xs">Minutos por día:</FormLabel><FormControl><Input type="number" {...field} disabled={watchSitDontKnow}/></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <FormField control={form.control} name="sit_dont_know" render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange}/></FormControl>
                        <FormLabel className="font-normal text-sm text-muted-foreground">No sabe/no está seguro</FormLabel></FormItem>)} />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Enviar Formulario IPAQ
                </Button>
            </form>
            </Form>

            {results && (
            <AlertDialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Resultados del IPAQ</AlertDialogTitle>
                    <AlertDialogDescription>
                    <span className="block">
                        Total MET-minutos/semana: {results.totalMETMinutesPerWeek}
                    </span>
                    <span className="block">
                        Nivel de Actividad Física:{" "}
                        <span className="font-semibold text-primary">
                        {results.activityLevel}
                        </span>
                    </span>
                    <span className="block mt-3 font-medium text-foreground">
                        Debe continuar con el Formulario PAR-Q.
                    </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <AlertDialogFooter>
                    <AlertDialogAction
                    onClick={() => {
                        setShowResultsDialog(false);
                        router.push("/par-q-form?regComplete=1");
                    }}
                    >
                    Continuar al Formulario PAR-Q
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

    
