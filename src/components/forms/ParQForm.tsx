
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
import { Checkbox } from "@/components/ui/checkbox";
import { TermsSections } from "@/components/terms/TermsSections";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { calculateDecimalAge } from "@/lib/ageCalculator";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format as formatDateFn } from "date-fns";
import { es } from "date-fns/locale";
import React, { useEffect, useState } from "react";
import FormQuestion from "./shared/FormQuestion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useFormData } from "@/contexts/FormDataContext";
import { useEvaluationContext } from "@/contexts/EvaluationContext";
import { query } from "@/lib/db";
import type { InitialRegistrationData } from "@/lib/types";

const parQSchema = z.object({
  firstName: z.string().min(2, "Nombres son requeridos."),
  lastName: z.string().min(2, "Apellidos son requeridos."),
  idNumber: z.string().min(5, "Número de identificación inválido."),
  dob: z.date({ required_error: "Fecha de nacimiento es requerida." }),
  calculatedAge: z.number().optional(),
  sex: z.enum(["Femenino", "Masculino", "Otro"], { required_error: "Sexo es requerido." }),
  phone: z.string().min(7, "Teléfono inválido."),
  address: z.string().min(5, "Dirección es requerida."),
  city: z.string().min(3, "Ciudad es requerida."),
  email: z.string().email("Correo electrónico inválido."),

  emergencyFirstName: z.string().min(2, "Nombres de emergencia son requeridos."),
  emergencyLastName: z.string().min(2, "Apellidos de emergencia son requeridos."),
  emergencyRelationship: z.string().min(3, "Parentesco es requerido."),
  emergencyPhone: z.string().min(7, "Teléfono de emergencia inválido."),

  q1_heart_condition: z.enum(['si', 'no'], { required_error: "Respuesta requerida." }),
  q2_chest_pain_activity: z.enum(['si', 'no'], { required_error: "Respuesta requerida." }),
  q3_chest_pain_rest: z.enum(['si', 'no'], { required_error: "Respuesta requerida." }),
  q4_dizziness_balance: z.enum(['si', 'no'], { required_error: "Respuesta requerida." }),
  q5_bone_joint_problem: z.enum(['si', 'no'], { required_error: "Respuesta requerida." }),
  q6_drug_prescription: z.enum(['si', 'no'], { required_error: "Respuesta requerida." }),
  q7_other_reason: z.enum(['si', 'no'], { required_error: "Respuesta requerida." }),
  // acceptedTermsParQ: z.literal(true, { 
  //   errorMap: () => ({ message: "Debes aceptar los términos y condiciones para continuar." }),
  // }),
  acceptedTermsParQ: z
  .boolean()
  .refine((val) => val === true, {
    message: "Debes aceptar los términos y condiciones para continuar.",
  }),

});

type ParQFormValues = z.infer<typeof parQSchema>;

const parQQuestions = [
    { name: "q1_heart_condition" as keyof ParQFormValues, text: "1. ¿Le ha dicho alguna vez un médico que tiene una enfermedad del corazón y le ha recomendado realizar actividad física solamente con supervisión médica?"},
    { name: "q2_chest_pain_activity" as keyof ParQFormValues, text: "2. ¿Nota dolor en el pecho cuando practica alguna actividad física?"},
    { name: "q3_chest_pain_rest" as keyof ParQFormValues, text: "3. ¿Ha notado dolor en el pecho en reposo durante el último mes?"},
    { name: "q4_dizziness_balance" as keyof ParQFormValues, text: "4. ¿Ha perdido la conciencia o el equilibrio después de notar sensación de mareo?"},
    { name: "q5_bone_joint_problem" as keyof ParQFormValues, text: "5. ¿Tiene algún problema en los huesos o articulaciones que podría empeorar a causa de la actividad física?"},
    { name: "q6_drug_prescription" as keyof ParQFormValues, text: "6. ¿Le ha prescrito su médico medicación arterial o para algún problema de corazón?"},
    { name: "q7_other_reason" as keyof ParQFormValues, text: "7. ¿Está al corriente de cualquier otra razón que le impida hacer ejercicio sin supervisión médica?"},
];
const yesNoOptions = [{value: 'si', label: 'Sí'}, {value: 'no', label: 'No'}];


export default function ParQForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { initialData, setInitialData } = useFormData();

  // const { initialData, setInitialData } = useFormData() as {
  //   initialData: InitialRegistrationData | null;
  //   setInitialData: (data: InitialRegistrationData | null) => void;
  // };

  const { addEvaluationRecord } = useEvaluationContext();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    fullName: string;
    idNumber: string;
    answers: Array<{ question: string; answer: string }>;
    consultationRecommended: boolean;
  } | null>(null);
  const [isClient, setIsClient] = useState(false);
  const searchParams = useSearchParams();
  const regComplete = searchParams.get('regComplete');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<ParQFormValues>({
    resolver: zodResolver(parQSchema),
    defaultValues: {
        firstName: "", lastName: "", idNumber: "", dob: undefined, email: "",
        calculatedAge: 0, sex: undefined, phone: "", address: "", city: "",
        emergencyFirstName: "", emergencyLastName: "", emergencyRelationship: "", emergencyPhone: "",
        acceptedTermsParQ: false, 
    },
  });

  useEffect(() => {
    if (isClient) { // Ensure this runs only client-side after initial mount
      if (initialData) {
          form.reset({
              firstName: initialData.first_name || "",
              lastName: initialData.last_name || "",
              idNumber: initialData.id_number || "",
              dob: initialData.dob ? new Date(initialData.dob) : undefined,
              email: initialData.email || "",
              calculatedAge: initialData.calculated_age || 0,
              sex: initialData.sex || undefined,
              phone: "", 
              address: "",
              city: "",
              emergencyFirstName: "", emergencyLastName: "", emergencyRelationship: "", emergencyPhone: "",
              q1_heart_condition: undefined, q2_chest_pain_activity: undefined, q3_chest_pain_rest: undefined,
              q4_dizziness_balance: undefined, q5_bone_joint_problem: undefined, q6_drug_prescription: undefined,
              q7_other_reason: undefined,
              acceptedTermsParQ: initialData.accepted_terms, 
          });
      } else {
          form.reset({
              firstName: "", lastName: "", idNumber: "", dob: undefined, email: "",
              calculatedAge: 0, sex: undefined, phone: "", address: "", city: "",
              emergencyFirstName: "", emergencyLastName: "", emergencyRelationship: "", emergencyPhone: "",
              q1_heart_condition: undefined, q2_chest_pain_activity: undefined, q3_chest_pain_rest: undefined,
              q4_dizziness_balance: undefined, q5_bone_joint_problem: undefined, q6_drug_prescription: undefined,
              q7_other_reason: undefined,
              acceptedTermsParQ: false,
          });
      }
    }
  }, [initialData, form, isClient]);


  const dobValue = form.watch("dob");
  useEffect(() => {
    if (dobValue) {
      form.setValue("calculatedAge", calculateDecimalAge(dobValue));
    } else {
      form.setValue("calculatedAge", 0);
    }
  }, [dobValue, form]);


  async function onSubmit(values: ParQFormValues) {
    setIsLoading(true);
    let currentParticipantId = initialData?.id;
    let currentAcceptedTerms = initialData?.accepted_terms || values.acceptedTermsParQ;

    if (!currentParticipantId) {
      const newParticipantId = `participant-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const dobForDb = formatDateFn(values.dob, 'yyyy-MM-dd');
      const age = calculateDecimalAge(values.dob);

      const newParticipantData: InitialRegistrationData = {
        id: newParticipantId,
        first_name: values.firstName,
        last_name: values.lastName,
        dob: dobForDb,
        calculated_age: age,
        sex: values.sex,
        email: values.email.toLowerCase(),
        id_number: values.idNumber,
        accepted_terms: values.acceptedTermsParQ,
      };

      try {
        console.log("[ParQForm] Attempting to insert new participant:", newParticipantData.email);
        await query(
          `INSERT INTO participants (id, first_name, last_name, dob, calculated_age, sex, email, id_number, accepted_terms)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            newParticipantData.id, newParticipantData.first_name, newParticipantData.last_name,
            newParticipantData.dob, newParticipantData.calculated_age, newParticipantData.sex,
            newParticipantData.email, newParticipantData.id_number, newParticipantData.accepted_terms
          ]
        );
        console.log("[ParQForm] New participant inserted successfully:", newParticipantData.email);
        currentParticipantId = newParticipantId;
        currentAcceptedTerms = newParticipantData.accepted_terms;
        // Update context if a new participant was created directly from PAR-Q
        setInitialData({
           id: newParticipantId,
           first_name: values.firstName,
           last_name: values.lastName,
           dob: values.dob.toISOString(), // Use ISO string for context
           calculated_age: age,
           sex: values.sex,
           email: values.email.toLowerCase(),
           id_number: values.idNumber,
           accepted_terms: values.acceptedTermsParQ,
        });
        toast({ title: "Participante Registrado", description: "Nuevo participante creado exitosamente desde PAR-Q." });
      } catch (error: any) {
        console.error("[ParQForm] Error saving new participant to DB:", error.message, error.stack);
        let friendlyMessage = "No se pudo registrar al nuevo participante.";
        let errorTitle = "Error de Registro";
        if (error.message?.includes('duplicate key value violates unique constraint "participants_email_key"')) {
          friendlyMessage = "El correo electrónico ingresado ya está registrado para otro participante.";
          form.setError("email", { type: "manual", message: friendlyMessage });
        } else if (error.message?.includes('duplicate key value violates unique constraint "participants_id_number_key"')) {
          friendlyMessage = "El número de identificación ingresado ya está registrado para otro participante.";
          form.setError("idNumber", { type: "manual", message: friendlyMessage });
        } else {
           errorTitle = "Error de Base de Datos";
           friendlyMessage = "No se pudo registrar al participante. Por favor, verifique los logs del servidor para más detalles sobre problemas de conexión o configuración de la base de datos.";
        }
        toast({ title: errorTitle, description: friendlyMessage, variant: "destructive", duration: 10000 });
        setIsLoading(false);
        return;
      }
    }

    if (!currentParticipantId) {
        toast({ title: "Error Crítico", description: "No se pudo obtener o crear un ID de participante.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    const parqAnswers: Record<string, 'si' | 'no'> = {
        q1_heart_condition: values.q1_heart_condition,
        q2_chest_pain_activity: values.q2_chest_pain_activity,
        q3_chest_pain_rest: values.q3_chest_pain_rest,
        q4_dizziness_balance: values.q4_dizziness_balance,
        q5_bone_joint_problem: values.q5_bone_joint_problem,
        q6_drug_prescription: values.q6_drug_prescription,
        q7_other_reason: values.q7_other_reason,
    };
    const requiresConsultation = Object.values(parqAnswers).some(ans => ans === 'si');

    const recordToSave = {
        participant_id: currentParticipantId,
        form_type: 'PAR-Q' as 'PAR-Q',
        accepted_terms: currentAcceptedTerms,
        form_data: values, 
        parqAnswers: parqAnswers,
        parq_requires_consultation: requiresConsultation,
    };

    const result = await addEvaluationRecord(recordToSave);

    if (result.success) {
        setConfirmationData({
            fullName: `${values.firstName} ${values.lastName}`,
            idNumber: values.idNumber,
            answers: parQQuestions.map(q => ({
                question: q.text.substring(0, q.text.indexOf("?") + 1),
                answer: (values as any)[q.name]?.toUpperCase()
            })),
            consultationRecommended: requiresConsultation
        });
        setShowConfirmationDialog(true);
        toast({
          title: "Formulario PAR-Q Enviado",
          description: "Sus respuestas han sido registradas.",
        });
    } else {
         toast({
            title: "Error al Guardar Evaluación PAR-Q",
            description: result.message || "No se pudo guardar el registro PAR-Q.",
            variant: "destructive",
        });
    }
    setIsLoading(false);
  }

  if (!isClient) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /> <span className="ml-2">Cargando...</span></div>;
  }

  if (initialData) {
    // Already handled by useEffect pre-filling the form
  } else if (regComplete === '1' && !initialData) { // Came from registration, but data not yet in context
    return (
        <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Cargando datos del participante...</p>
        </div>
    );
  }
  // Otherwise, if no initialData and not regComplete, just show the blank form for direct entry.

    return (
        <Card className="shadow-xl">
        <CardHeader>
            <CardTitle className="text-xl font-headline text-primary">Cuestionario de Aptitud para la Actividad Física (PAR-Q)</CardTitle>
            <CardDescription>
              Por favor, complete la siguiente información y responda todas las preguntas con sinceridad.
              {initialData ? ` (Continuando registro de ${initialData.first_name} ${initialData.last_name})` : " (Registro nuevo)"}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <h3 className="text-lg font-semibold border-b pb-2 text-primary">Datos Personales</h3>
                <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="firstName" render={({ field }) => (<FormItem><FormLabel>Nombres</FormLabel><FormControl><Input {...field} readOnly={!!initialData?.first_name} className={initialData?.first_name ? "bg-muted/50" : ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="lastName" render={({ field }) => (<FormItem><FormLabel>Apellidos</FormLabel><FormControl><Input {...field} readOnly={!!initialData?.last_name} className={initialData?.last_name ? "bg-muted/50" : ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="idNumber" render={({ field }) => (<FormItem><FormLabel>Número de Identificación</FormLabel><FormControl><Input {...field} readOnly={!!initialData?.id_number} className={initialData?.id_number ? "bg-muted/50" : ""} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="dob" render={({ field }) => (
                    <FormItem className="flex flex-col"><FormLabel>Fecha de Nacimiento</FormLabel>
                    <Popover><PopoverTrigger asChild><FormControl>
                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal",!field.value && "text-muted-foreground", initialData?.dob && "bg-muted/50 cursor-not-allowed")} disabled={!!initialData?.dob}>
                            {field.value ? formatDateFn(field.value, "PPP", { locale: es }) : <span>Seleccione fecha</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button></FormControl></PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01") || !!initialData?.dob} initialFocus captionLayout="dropdown-buttons" fromYear={1900} toYear={new Date().getFullYear()} />
                        </PopoverContent></Popover><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="calculatedAge" render={({ field }) => (<FormItem><FormLabel>Edad (calculada)</FormLabel><FormControl><Input type="number" {...field} value={field.value || ""} readOnly className="bg-muted/50"/></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="sex" render={({ field }) => (<FormItem><FormLabel>Sexo</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!!initialData?.sex}><FormControl><SelectTrigger className={initialData?.sex ? "bg-muted/50 cursor-not-allowed" : ""}><SelectValue placeholder="Seleccione el sexo" /></SelectTrigger></FormControl><SelectContent><SelectItem value="Femenino">Femenino</SelectItem><SelectItem value="Masculino">Masculino</SelectItem><SelectItem value="Otro">Otro</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="address" render={({ field }) => (<FormItem><FormLabel>Dirección</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="city" render={({ field }) => (<FormItem><FormLabel>Ciudad</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>Correo Electrónico</FormLabel><FormControl><Input type="email" {...field} readOnly={!!initialData?.email} className={initialData?.email ? "bg-muted/50" : ""} /></FormControl><FormMessage /></FormItem>)} />
                </div>

                <h3 className="text-lg font-semibold border-b pb-2 text-primary">En Caso de Emergencia</h3>
                <div className="grid md:grid-cols-2 gap-6">
                <FormField control={form.control} name="emergencyFirstName" render={({ field }) => (<FormItem><FormLabel>Nombres</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="emergencyLastName" render={({ field }) => (<FormItem><FormLabel>Apellidos</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="emergencyRelationship" render={({ field }) => (<FormItem><FormLabel>Parentesco</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="emergencyPhone" render={({ field }) => (<FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>

                <h3 className="text-lg font-semibold border-b pb-2 text-primary">Cuestionario PAR-Q</h3>
                {parQQuestions.map(q => (
                    <FormQuestion key={q.name} control={form.control} name={q.name as string} questionText={q.text} options={yesNoOptions} orientation="horizontal" />
                ))}
                <FormDescription className="text-sm text-muted-foreground pt-4">
                    Por favor: si su salud cambia de tal forma que contesta SÍ a alguna de las preguntas anteriores, dígaselo al profesional del fitness. Pregúntele si debería cambiar el plan de actividad física.
                </FormDescription>

                {( !initialData) && ( 
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Términos y Condiciones</h3>
                        <TermsSections />
                        <FormField
                            control={form.control}
                            name="acceptedTermsParQ"
                            render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                                <FormControl>
                                <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    disabled={!!initialData?.accepted_terms} 
                                />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                <FormLabel className={initialData?.accepted_terms ? "cursor-not-allowed text-muted-foreground" : ""}>
                                    He leído y acepto los términos y condiciones.
                                </FormLabel>
                                <FormDescription className={initialData?.accepted_terms ? "cursor-not-allowed" : ""}>
                                    Debe aceptar los términos para continuar.
                                </FormDescription>
                                <FormMessage className="!mt-2" />
                                </div>
                            </FormItem>
                            )}
                        />
                    </div>
                )}


                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Enviar Formulario PAR-Q
                </Button>
            </form>
            </Form>

            {confirmationData && (
                <AlertDialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
                    <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmación PAR-Q</AlertDialogTitle>
                        <AlertDialogDescription className="max-h-[300px] overflow-y-auto">
                            <span className="block mb-2"><strong>Nombre:</strong> {confirmationData.fullName}</span>
                            <span className="block mb-4"><strong>Identificación:</strong> {confirmationData.idNumber}</span>
                            <strong className="block mb-2">Respuestas:</strong>
                            {confirmationData.answers.map(ans => (
                                <span key={ans.question} className="block text-xs"><strong>{ans.question}:</strong> {ans.answer}</span>
                            ))}
                            <span className="block mt-4 font-semibold text-foreground">
                                {confirmationData.consultationRecommended
                                    ? "Al menos una respuesta fue SÍ. Se recomienda consultar a un médico antes de iniciar actividad física intensa."
                                    : "Todas las respuestas fueron NO. Generalmente puede iniciar actividad física."
                                }
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => {
                            setShowConfirmationDialog(false);
                            setInitialData(null); 
                            form.reset({ 
                                firstName: "", lastName: "", idNumber: "", dob: undefined, email: "",
                                sex: undefined, phone: "", address: "", city: "", calculatedAge: 0,
                                emergencyFirstName: "", emergencyLastName: "", emergencyRelationship: "", emergencyPhone: "",
                                q1_heart_condition: undefined, q2_chest_pain_activity: undefined, q3_chest_pain_rest: undefined,
                                q4_dizziness_balance: undefined, q5_bone_joint_problem: undefined, q6_drug_prescription: undefined,
                                q7_other_reason: undefined,
                                acceptedTermsParQ: false,
                            });
                            router.push('/register-data?regComplete=0'); 
                        }}>
                            Nuevo Registro Completo
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={() => {
                            setShowConfirmationDialog(false);
                            setInitialData(null); 
                            form.reset({ 
                                firstName: "", lastName: "", idNumber: "", dob: undefined, email: "",
                                sex: undefined, phone: "", address: "", city: "", calculatedAge: 0,
                                emergencyFirstName: "", emergencyLastName: "", emergencyRelationship: "", emergencyPhone: "",
                                q1_heart_condition: undefined, q2_chest_pain_activity: undefined, q3_chest_pain_rest: undefined,
                                q4_dizziness_balance: undefined, q5_bone_joint_problem: undefined, q6_drug_prescription: undefined,
                                q7_other_reason: undefined,
                                acceptedTermsParQ: false,
                            });
                            router.push('/'); 
                        }}>Entendido</AlertDialogAction>
                    </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </CardContent>
        </Card>
    );
}
    
