// pasar a tamizage
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format as formatDateFn } from "date-fns";
import { es } from "date-fns/locale";
import {
  Activity,
  AlertTriangle,
  CalendarIcon,
  CheckCircle2,
  HeartPulse,
  Loader2,
  PhoneCall,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { TermsSections } from "@/components/terms/TermsSections";
import FormQuestion from "./shared/FormQuestion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useFormData } from "@/contexts/FormDataContext";
import { useEvaluationContext } from "@/contexts/EvaluationContext";
import { useToast } from "@/hooks/use-toast";
import { calculateDecimalAge } from "@/lib/ageCalculator";
import { cn } from "@/lib/utils";
import { query } from "@/lib/db";
import type { InitialRegistrationData } from "@/lib/types";

const parQSchema = z.object({
  firstName: z.string().min(2, "Nombres son requeridos."),
  lastName: z.string().min(2, "Apellidos son requeridos."),
  idNumber: z.string().min(5, "Número de identificación inválido."),
  dob: z.date({ required_error: "Fecha de nacimiento es requerida." }),
  calculatedAge: z.number().optional(),

  sex: z.preprocess(
    (value) => {
      if (typeof value === "string") {
        const normalized = value.trim().toLowerCase();

        if (normalized === "femenino") return "Femenino";
        if (normalized === "masculino") return "Masculino";
        if (normalized === "otro") return "Otro";
        if (normalized === "") return undefined;
      }

      return value;
    },
    z.enum(["Femenino", "Masculino", "Otro"], {
      required_error: "El sexo es obligatorio.",
      invalid_type_error: "El sexo es obligatorio.",
    })
  ),

  phone: z.string().min(7, "Teléfono inválido."),
  address: z.string().min(5, "Dirección es requerida."),
  city: z.string().min(3, "Ciudad es requerida."),
  email: z.string().email("Correo electrónico inválido."),

  emergencyFirstName: z.string().min(2, "Nombres de emergencia son requeridos."),
  emergencyLastName: z.string().min(2, "Apellidos de emergencia son requeridos."),
  emergencyRelationship: z.string().min(3, "Parentesco es requerido."),
  emergencyPhone: z.string().min(7, "Teléfono de emergencia inválido."),

  q1_heart_condition: z.enum(["si", "no"], {
    required_error: "Respuesta requerida.",
  }),
  q2_chest_pain_activity: z.enum(["si", "no"], {
    required_error: "Respuesta requerida.",
  }),
  q3_chest_pain_rest: z.enum(["si", "no"], {
    required_error: "Respuesta requerida.",
  }),
  q4_dizziness_balance: z.enum(["si", "no"], {
    required_error: "Respuesta requerida.",
  }),
  q5_bone_joint_problem: z.enum(["si", "no"], {
    required_error: "Respuesta requerida.",
  }),
  q6_drug_prescription: z.enum(["si", "no"], {
    required_error: "Respuesta requerida.",
  }),
  q7_other_reason: z.enum(["si", "no"], {
    required_error: "Respuesta requerida.",
  }),

  acceptedTermsParQ: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar los términos y condiciones para continuar.",
  }),
});

type ParQFormValues = z.infer<typeof parQSchema>;

const emergencyRelationshipOptions = [
  "Abuelo (a)",
  "Padre",
  "Madre",
  "Tío (a)",
  "Hermano (a)",
  "Primo (a)",
  "Amigo (a)",
  "Hijo (a)",
  "Nieto (a)",
  "Sobrino (a)",
  "Esposo (a)",
  "Novio (a)",
  "Suegro (a)",
  "Cuñado (a)",
  "Yerno (a)",
];

const parQQuestions = [
  {
    name: "q1_heart_condition" as keyof ParQFormValues,
    text: "1. ¿Le ha dicho alguna vez un médico que tiene una enfermedad del corazón y le ha recomendado realizar actividad física solamente con supervisión médica?",
  },
  {
    name: "q2_chest_pain_activity" as keyof ParQFormValues,
    text: "2. ¿Nota dolor en el pecho cuando practica alguna actividad física?",
  },
  {
    name: "q3_chest_pain_rest" as keyof ParQFormValues,
    text: "3. ¿Ha notado dolor en el pecho en reposo durante el último mes?",
  },
  {
    name: "q4_dizziness_balance" as keyof ParQFormValues,
    text: "4. ¿Ha perdido la conciencia o el equilibrio después de notar sensación de mareo?",
  },
  {
    name: "q5_bone_joint_problem" as keyof ParQFormValues,
    text: "5. ¿Tiene algún problema en los huesos o articulaciones que podría empeorar a causa de la actividad física?",
  },
  {
    name: "q6_drug_prescription" as keyof ParQFormValues,
    text: "6. ¿Le ha prescrito su médico medicación arterial o para algún problema de corazón?",
  },
  {
    name: "q7_other_reason" as keyof ParQFormValues,
    text: "7. ¿Está al corriente de cualquier otra razón que le impida hacer ejercicio sin supervisión médica?",
  },
];

const yesNoOptions = [
  { value: "si", label: "Sí" },
  { value: "no", label: "No" },
];

export default function ParQForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { initialData, setInitialData } = useFormData();
  const { addEvaluationRecord } = useEvaluationContext();

  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [savedParticipantId, setSavedParticipantId] = useState<string | null>(null);
  const [confirmationData, setConfirmationData] = useState<{
    fullName: string;
    idNumber: string;
    answers: Array<{ question: string; answer: string }>;
    consultationRecommended: boolean;
  } | null>(null);
  const [isClient, setIsClient] = useState(false);

  const formRef = useRef<HTMLFormElement | null>(null);
  const searchParams = useSearchParams();
  const regComplete = searchParams.get("regComplete");

  useEffect(() => {
    setIsClient(true);
  }, []);

useEffect(() => {
  if (!isClient) return;

  const ajustarVista = () => {
    const formElement = formRef.current;
    if (!formElement) return;

    const main = formElement.closest("main") as HTMLElement | null;

    if (main) {
      main.style.paddingTop = "16px";
      main.style.alignItems = "flex-start";
      main.style.minHeight = "auto";
    }

    const card = formElement.closest("[data-parq-card]") as HTMLElement | null;

    if (card) {
      card.style.marginTop = "0px";
    }
  };

  const ocultarBotonVolver = () => {
    const elementos = Array.from(
      document.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>("button, a")
    );

    elementos.forEach((elemento) => {
      const texto = elemento.textContent?.trim().toLowerCase() || "";

      if (texto === "volver" || texto.includes("volver")) {
        elemento.style.display = "none";
        elemento.setAttribute("data-hidden-parq-back", "true");
      }
    });
  };

  ajustarVista();
  ocultarBotonVolver();

  const observer = new MutationObserver(() => {
    ajustarVista();
    ocultarBotonVolver();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  return () => {
    observer.disconnect();

    document
      .querySelectorAll<HTMLElement>("[data-hidden-parq-back='true']")
      .forEach((elemento) => {
        elemento.style.display = "";
        elemento.removeAttribute("data-hidden-parq-back");
      });
  };
}, [isClient, initialData]);

  useEffect(() => {
    if (!isClient) return;

    const ocultarBotonVolver = () => {
      const elementos = Array.from(
        document.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>("button, a")
      );

      elementos.forEach((elemento) => {
        const texto = elemento.textContent?.trim().toLowerCase() || "";

        if (texto === "volver") {
          elemento.style.display = "none";
          elemento.setAttribute("data-hidden-parq-back", "true");
        }
      });
    };

    ocultarBotonVolver();

    const observer = new MutationObserver(() => {
      ocultarBotonVolver();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();

      document
        .querySelectorAll<HTMLElement>("[data-hidden-parq-back='true']")
        .forEach((elemento) => {
          elemento.style.display = "";
          elemento.removeAttribute("data-hidden-parq-back");
        });
    };
  }, [isClient]);

  const normalizeSex = (
    sex?: string | null
  ): "Femenino" | "Masculino" | "Otro" | undefined => {
    const value = String(sex || "").trim().toLowerCase();

    if (value === "femenino") return "Femenino";
    if (value === "masculino") return "Masculino";
    if (value === "otro") return "Otro";

    return undefined;
  };

  const form = useForm<ParQFormValues>({
    resolver: zodResolver(parQSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      idNumber: "",
      dob: undefined,
      email: "",
      calculatedAge: 0,
      sex: undefined,
      phone: "",
      address: "",
      city: "",
      emergencyFirstName: "",
      emergencyLastName: "",
      emergencyRelationship: "",
      emergencyPhone: "",
      q1_heart_condition: undefined,
      q2_chest_pain_activity: undefined,
      q3_chest_pain_rest: undefined,
      q4_dizziness_balance: undefined,
      q5_bone_joint_problem: undefined,
      q6_drug_prescription: undefined,
      q7_other_reason: undefined,
      acceptedTermsParQ: false,
    },
  });

  useEffect(() => {
    if (!isClient) return;

    const loadInitialData = async () => {
      if (initialData) {
        let sexFromData = normalizeSex(initialData.sex);

        try {
          const participantResult = await query(
            `
            SELECT first_name, last_name, id_number, dob, calculated_age, sex, email, accepted_terms
            FROM participants
            WHERE id_number = $1
            LIMIT 1
            `,
            [initialData.id_number]
          );

          const participantFromDb = participantResult.rows?.[0];

          if (participantFromDb?.sex) {
            sexFromData = normalizeSex(participantFromDb.sex);
          }

          form.reset({
            firstName: participantFromDb?.first_name || initialData.first_name || "",
            lastName: participantFromDb?.last_name || initialData.last_name || "",
            idNumber: participantFromDb?.id_number || initialData.id_number || "",
            dob: participantFromDb?.dob
              ? new Date(participantFromDb.dob)
              : initialData.dob
                ? new Date(initialData.dob)
                : undefined,
            email: participantFromDb?.email || initialData.email || "",
            calculatedAge:
              Number(participantFromDb?.calculated_age) ||
              initialData.calculated_age ||
              0,
            sex: sexFromData,
            phone: "",
            address: "",
            city: "",
            emergencyFirstName: "",
            emergencyLastName: "",
            emergencyRelationship: "",
            emergencyPhone: "",
            q1_heart_condition: undefined,
            q2_chest_pain_activity: undefined,
            q3_chest_pain_rest: undefined,
            q4_dizziness_balance: undefined,
            q5_bone_joint_problem: undefined,
            q6_drug_prescription: undefined,
            q7_other_reason: undefined,
            acceptedTermsParQ: Boolean(
              participantFromDb?.accepted_terms ?? initialData.accepted_terms
            ),
          });

          return;
        } catch (error) {
          console.error("[ParQForm] Error cargando participante desde DB:", error);
        }

        form.reset({
          firstName: initialData.first_name || "",
          lastName: initialData.last_name || "",
          idNumber: initialData.id_number || "",
          dob: initialData.dob ? new Date(initialData.dob) : undefined,
          email: initialData.email || "",
          calculatedAge: initialData.calculated_age || 0,
          sex: sexFromData,
          phone: "",
          address: "",
          city: "",
          emergencyFirstName: "",
          emergencyLastName: "",
          emergencyRelationship: "",
          emergencyPhone: "",
          q1_heart_condition: undefined,
          q2_chest_pain_activity: undefined,
          q3_chest_pain_rest: undefined,
          q4_dizziness_balance: undefined,
          q5_bone_joint_problem: undefined,
          q6_drug_prescription: undefined,
          q7_other_reason: undefined,
          acceptedTermsParQ: Boolean(initialData.accepted_terms),
        });

        return;
      }

      form.reset({
        firstName: "",
        lastName: "",
        idNumber: "",
        dob: undefined,
        email: "",
        calculatedAge: 0,
        sex: undefined,
        phone: "",
        address: "",
        city: "",
        emergencyFirstName: "",
        emergencyLastName: "",
        emergencyRelationship: "",
        emergencyPhone: "",
        q1_heart_condition: undefined,
        q2_chest_pain_activity: undefined,
        q3_chest_pain_rest: undefined,
        q4_dizziness_balance: undefined,
        q5_bone_joint_problem: undefined,
        q6_drug_prescription: undefined,
        q7_other_reason: undefined,
        acceptedTermsParQ: false,
      });
    };

    loadInitialData();
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
    let currentAcceptedTerms =
      initialData?.accepted_terms || values.acceptedTermsParQ;

    if (!currentParticipantId) {
      const newParticipantId = `participant-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 7)}`;

      const dobForDb = formatDateFn(values.dob, "yyyy-MM-dd");
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
        await query(
          `
          INSERT INTO participants 
          (id, first_name, last_name, dob, calculated_age, sex, email, id_number, accepted_terms)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `,
          [
            newParticipantData.id,
            newParticipantData.first_name,
            newParticipantData.last_name,
            newParticipantData.dob,
            newParticipantData.calculated_age,
            newParticipantData.sex,
            newParticipantData.email,
            newParticipantData.id_number,
            newParticipantData.accepted_terms,
          ]
        );

        currentParticipantId = newParticipantId;
        currentAcceptedTerms = newParticipantData.accepted_terms;

        setInitialData({
          id: newParticipantId,
          first_name: values.firstName,
          last_name: values.lastName,
          dob: dobForDb,
          calculated_age: age,
          sex: values.sex,
          email: values.email.toLowerCase(),
          id_number: values.idNumber,
          accepted_terms: values.acceptedTermsParQ,
        });

        toast({
          title: "Participante Registrado",
          description: "Nuevo participante creado exitosamente desde PAR-Q.",
        });
      } catch (error: any) {
        console.error(
          "[ParQForm] Error saving new participant to DB:",
          error.message,
          error.stack
        );

        let friendlyMessage = "No se pudo registrar al nuevo participante.";
        let errorTitle = "Error de Registro";

        if (
          error.message?.includes(
            'duplicate key value violates unique constraint "participants_email_key"'
          )
        ) {
          friendlyMessage =
            "El correo electrónico ingresado ya está registrado para otro participante.";
          form.setError("email", { type: "manual", message: friendlyMessage });
        } else if (
          error.message?.includes(
            'duplicate key value violates unique constraint "participants_id_number_key"'
          )
        ) {
          friendlyMessage =
            "El número de identificación ingresado ya está registrado para otro participante.";
          form.setError("idNumber", {
            type: "manual",
            message: friendlyMessage,
          });
        } else {
          errorTitle = "Error de Base de Datos";
          friendlyMessage =
            "No se pudo registrar al participante. Por favor, verifique los logs del servidor.";
        }

        toast({
          title: errorTitle,
          description: friendlyMessage,
          variant: "destructive",
          duration: 10000,
        });

        setIsLoading(false);
        return;
      }
    }

    if (!currentParticipantId) {
      toast({
        title: "Error Crítico",
        description: "No se pudo obtener o crear un ID de participante.",
        variant: "destructive",
      });

      setIsLoading(false);
      return;
    }

    const parqAnswers: Record<string, "si" | "no"> = {
      q1_heart_condition: values.q1_heart_condition,
      q2_chest_pain_activity: values.q2_chest_pain_activity,
      q3_chest_pain_rest: values.q3_chest_pain_rest,
      q4_dizziness_balance: values.q4_dizziness_balance,
      q5_bone_joint_problem: values.q5_bone_joint_problem,
      q6_drug_prescription: values.q6_drug_prescription,
      q7_other_reason: values.q7_other_reason,
    };

    const requiresConsultation = Object.values(parqAnswers).some(
      (ans) => ans === "si"
    );

    const recordToSave = {
      participant_id: currentParticipantId,
      form_type: "PAR-Q" as "PAR-Q",
      accepted_terms: currentAcceptedTerms,
      form_data: values,
      parqAnswers: parqAnswers,
      parq_requires_consultation: requiresConsultation,
    };

    const result = await addEvaluationRecord(recordToSave);

    if (result.success) {
      setSavedParticipantId(currentParticipantId);

      const dobForContext = formatDateFn(values.dob, "yyyy-MM-dd");
      const ageForContext = calculateDecimalAge(values.dob);

      setInitialData({
        id: currentParticipantId,
        first_name: values.firstName,
        last_name: values.lastName,
        dob: dobForContext,
        calculated_age: ageForContext,
        sex: values.sex,
        email: values.email.toLowerCase(),
        id_number: values.idNumber,
        accepted_terms: Boolean(currentAcceptedTerms),
      });

      setConfirmationData({
        fullName: `${values.firstName} ${values.lastName}`,
        idNumber: values.idNumber,
        answers: parQQuestions.map((q) => ({
          question: q.text.substring(0, q.text.indexOf("?") + 1),
          answer: (values as any)[q.name]?.toUpperCase(),
        })),
        consultationRecommended: requiresConsultation,
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

  const inputClass =
    "h-10 rounded-xl border-slate-200 bg-slate-50/80 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100/70";

  const readOnlyInputClass =
    "h-10 cursor-not-allowed rounded-xl border-slate-200 bg-slate-100/70 text-sm text-slate-700 shadow-sm";

  const labelClass = "text-sm font-semibold text-slate-700";

  const sectionClass =
    "rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm";

  if (!isClient) {
    return (
      <div className="flex min-h-[calc(100vh-180px)] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Cargando...</span>
      </div>
    );
  }

  if (regComplete === "1" && !initialData) {
    return (
      <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">
          Cargando datos del participante...
        </p>
      </div>
    );
  }

  return (
    <Card
      data-parq-card
      className="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-2xl"
    >
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-slate-50 px-6 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
            <HeartPulse className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-blue-700">
              Cuestionario de Aptitud para la Actividad Física PAR-Q
            </CardTitle>

            <CardDescription className="text-sm text-slate-500">
              Complete la información y responda todas las preguntas con sinceridad.
              {initialData
                ? ` Continuando registro de ${initialData.first_name} ${initialData.last_name}.`
                : " Registro nuevo."}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-6 py-4">
        <Form {...form}>
          <form
            ref={formRef}
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-5"
          >
            <section className={sectionClass}>
              <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <UserRound className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Datos Personales
                  </h3>
                  <p className="text-sm text-slate-500">
                    Información básica del participante.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className={labelClass}>Nombres</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          readOnly={!!initialData?.first_name}
                          className={
                            initialData?.first_name ? readOnlyInputClass : inputClass
                          }
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className={labelClass}>Apellidos</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          readOnly={!!initialData?.last_name}
                          className={
                            initialData?.last_name ? readOnlyInputClass : inputClass
                          }
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="idNumber"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className={labelClass}>
                        Número de Identificación
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          readOnly={!!initialData?.id_number}
                          className={
                            initialData?.id_number ? readOnlyInputClass : inputClass
                          }
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem className="flex flex-col space-y-1">
                      <FormLabel className={labelClass}>
                        Fecha de Nacimiento
                      </FormLabel>

                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                inputClass,
                                "w-full justify-start px-3 text-left font-normal hover:bg-white",
                                !field.value && "text-muted-foreground",
                                initialData?.dob && readOnlyInputClass
                              )}
                              disabled={!!initialData?.dob}
                            >
                              {field.value ? (
                                formatDateFn(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Seleccione fecha</span>
                              )}

                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>

                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() ||
                              date < new Date("1900-01-01") ||
                              !!initialData?.dob
                            }
                            initialFocus
                            captionLayout="dropdown-buttons"
                            fromYear={1900}
                            toYear={new Date().getFullYear()}
                          />
                        </PopoverContent>
                      </Popover>

                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="calculatedAge"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className={labelClass}>
                        Edad calculada
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          value={field.value || ""}
                          readOnly
                          className={readOnlyInputClass}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sex"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className={labelClass}>Sexo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                        disabled={!!initialData?.sex}
                      >
                        <FormControl>
                          <SelectTrigger
                            className={
                              initialData?.sex ? readOnlyInputClass : inputClass
                            }
                          >
                            <SelectValue placeholder="Seleccione sexo" />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent>
                          <SelectItem value="Femenino">Femenino</SelectItem>
                          <SelectItem value="Masculino">Masculino</SelectItem>
                          <SelectItem value="Otro">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className={labelClass}>Teléfono</FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} className={inputClass} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className={labelClass}>Dirección</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputClass} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className={labelClass}>Ciudad</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputClass} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1 md:col-span-2 xl:col-span-3">
                      <FormLabel className={labelClass}>
                        Correo Electrónico
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          {...field}
                          readOnly={!!initialData?.email}
                          className={
                            initialData?.email ? readOnlyInputClass : inputClass
                          }
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className={sectionClass}>
              <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <PhoneCall className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    En Caso de Emergencia
                  </h3>
                  <p className="text-sm text-slate-500">
                    Persona de contacto ante cualquier eventualidad.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="emergencyFirstName"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className={labelClass}>Nombres</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputClass} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyLastName"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className={labelClass}>Apellidos</FormLabel>
                      <FormControl>
                        <Input {...field} className={inputClass} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyRelationship"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className={labelClass}>Parentesco</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className={inputClass}>
                            <SelectValue placeholder="Seleccione el parentesco" />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent>
                          {emergencyRelationshipOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="emergencyPhone"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className={labelClass}>Teléfono</FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} className={inputClass} />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <section className={sectionClass}>
              <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <Activity className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Cuestionario PAR-Q
                  </h3>
                  <p className="text-sm text-slate-500">
                    Responda cada pregunta con Sí o No.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {parQQuestions.map((q) => (
                  <div
                    key={q.name}
                    className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 shadow-sm"
                  >
                    <FormQuestion
                      control={form.control}
                      name={q.name as string}
                      questionText={q.text}
                      options={yesNoOptions}
                      orientation="horizontal"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 p-4 text-sm text-slate-600">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <FormDescription className="text-sm leading-relaxed text-slate-600">
                  Por favor: si su salud cambia de tal forma que contesta SÍ a
                  alguna de las preguntas anteriores, dígaselo al profesional del
                  fitness. Pregúntele si debería cambiar el plan de actividad física.
                </FormDescription>
              </div>
            </section>

            {!initialData && (
              <section className={sectionClass}>
                <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-pink-50 text-pink-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Términos y Condiciones
                    </h3>
                    <p className="text-sm text-slate-500">
                      Revise y acepte para continuar.
                    </p>
                  </div>
                </div>

                <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-sm">
                  <TermsSections />
                </div>

                <FormField
                  control={form.control}
                  name="acceptedTermsParQ"
                  render={({ field }) => (
                    <FormItem className="mt-4 flex flex-row items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/70 p-4 shadow-sm">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="mt-0.5"
                        />
                      </FormControl>

                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-semibold text-slate-800">
                          He leído y acepto los términos y condiciones.
                        </FormLabel>

                        <FormDescription className="text-xs text-slate-500">
                          Debe aceptar los términos para continuar.
                        </FormDescription>

                        <FormMessage className="!mt-2 text-xs" />
                      </div>
                    </FormItem>
                  )}
                />
              </section>
            )}

            <div className="sticky bottom-0 z-10 rounded-2xl border border-slate-100 bg-white/90 p-3 shadow-lg backdrop-blur">
              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-blue-600 text-base font-semibold shadow-md transition-all hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                )}
                Enviar Formulario PAR-Q
              </Button>
            </div>
          </form>
        </Form>

        {confirmationData && (
          <AlertDialog
            open={showConfirmationDialog}
            onOpenChange={setShowConfirmationDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmación PAR-Q</AlertDialogTitle>

                <AlertDialogDescription className="max-h-[300px] overflow-y-auto">
                  <span className="mb-2 block">
                    <strong>Nombre:</strong> {confirmationData.fullName}
                  </span>

                  <span className="mb-4 block">
                    <strong>Identificación:</strong> {confirmationData.idNumber}
                  </span>

                  <strong className="mb-2 block">Respuestas:</strong>

                  {confirmationData.answers.map((ans) => (
                    <span key={ans.question} className="block text-xs">
                      <strong>{ans.question}:</strong> {ans.answer}
                    </span>
                  ))}

                  <span className="mt-4 block font-semibold text-foreground">
                    {confirmationData.consultationRecommended
                      ? "Al menos una respuesta fue SÍ. Se recomienda consultar a un médico antes de iniciar actividad física intensa."
                      : "Todas las respuestas fueron NO. Generalmente puede iniciar actividad física."}
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogAction
                  onClick={() => {
                    const values = form.getValues();
                    const participantIdForTamizaje =
                      savedParticipantId || initialData?.id;

                    if (!participantIdForTamizaje) {
                      toast({
                        title: "Datos incompletos",
                        description:
                          "No se encontró el ID del participante para continuar al tamizaje.",
                        variant: "destructive",
                      });
                      return;
                    }

                    setInitialData({
                      id: participantIdForTamizaje,
                      first_name: values.firstName,
                      last_name: values.lastName,
                      dob: values.dob
                        ? formatDateFn(values.dob, "yyyy-MM-dd")
                        : "",
                      calculated_age: values.dob
                        ? calculateDecimalAge(values.dob)
                        : values.calculatedAge || 0,
                      sex: values.sex,
                      email: values.email.toLowerCase(),
                      id_number: values.idNumber,
                      accepted_terms: Boolean(
                        initialData?.accepted_terms ?? values.acceptedTermsParQ
                      ),
                    });

                    setShowConfirmationDialog(false);
                    router.push("/tamizaje?regComplete=1");
                  }}
                >
                  Continuar a Tamizaje Preparticipativo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardContent>
    </Card>
  );
}