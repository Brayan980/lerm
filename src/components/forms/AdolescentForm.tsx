//Adolescentes / joven
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  CalendarIcon,
  CheckCircle2,
  ClipboardList,
  Loader2,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useFormData } from "@/contexts/FormDataContext";
import { useEvaluationContext } from "@/contexts/EvaluationContext";
import { useToast } from "@/hooks/use-toast";
import { calculateDecimalAge } from "@/lib/ageCalculator";
import { calculatePaqScore } from "@/lib/scoring";
import type { Frequency, DailyActivityFrequency } from "@/lib/types";
import { frequencyOptions, dailyActivityOptions } from "@/lib/types";
import { cn } from "@/lib/utils";
import FormQuestion from "./shared/FormQuestion";
import ActivityTableInput from "./shared/ActivityTableInput";
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
  { id: "lunes", label: "Lunes" },
  { id: "martes", label: "Martes" },
  { id: "miercoles", label: "Miércoles" },
  { id: "jueves", label: "Jueves" },
  { id: "viernes", label: "Viernes" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" },
];

const q2options = [
  { value: "a", label: "Ninguna", score: 1 },
  { value: "b", label: "Un poco", score: 2 },
  { value: "c", label: "Bastante", score: 3 },
  { value: "d", label: "Casi siempre", score: 4 },
  { value: "e", label: "Siempre", score: 5 },
];

const q3options = [
  { value: "a", label: "Me senté (hablando, leyendo, haciendo deberes)", score: 1 },
  { value: "b", label: "Estuve de pie o caminé un poco", score: 2 },
  { value: "c", label: "Corrí o jugué un poco", score: 3 },
  { value: "d", label: "Corrí o jugué bastante", score: 4 },
  { value: "e", label: "Corrí o jugué mucho", score: 5 },
];

const q4options = [
  { value: "a", label: "Ninguna", score: 1 },
  { value: "b", label: "1 vez", score: 2 },
  { value: "c", label: "2-3 veces", score: 3 },
  { value: "d", label: "4-5 veces", score: 4 },
  { value: "e", label: "6 o más veces", score: 5 },
];

const q7options = [
  {
    value: "a",
    label: "Durante toda la semana estuve muy poco activo. No hice nada o casi nada.",
    score: 1,
  },
  {
    value: "b",
    label: "Hice algunas actividades, pero la mayoría del tiempo estuve descansando.",
    score: 2,
  },
  {
    value: "c",
    label: "Hice actividades físicas con bastante frecuencia",
    score: 3,
  },
  {
    value: "d",
    label: "Hice actividades físicas con mucha frecuencia",
    score: 4,
  },
  {
    value: "e",
    label: "Hice actividades físicas todos los días",
    score: 5,
  },
];

const activityRecordSchema = z.record(
  z.enum(frequencyOptions.map((f) => f.value) as [Frequency, ...Frequency[]]).nullable()
);

const dailyFreqRecordSchema = z.record(
  z
    .enum(
      dailyActivityOptions.map((d) => d.value) as [
        DailyActivityFrequency,
        ...DailyActivityFrequency[]
      ]
    )
    .nullable()
);

const adolescentFormSchema = z
  .object({
    evalFirstName: z.string(),
    evalLastName: z.string(),
    evalIdNumber: z.string(),
    evalDob: z.date(),
    evalCalculatedAge: z.number().optional(),

    phone: z.string().min(7, "Teléfono inválido."),
    sex: z.enum(["Femenino", "Masculino", "Otro"], {
      required_error: "Sexo es requerido.",
    }),
    weight: z.coerce.number().positive("Peso debe ser positivo.").default(0),
    height: z.coerce.number().positive("Talla debe ser positiva.").default(0),

    paqA1_activities: activityRecordSchema.refine(
      (val) => Object.values(val).some((v) => v !== null),
      {
        message:
          "Debe seleccionar al menos una frecuencia para una actividad en la pregunta 1.",
      }
    ),
    paqA1_other_activity_text: z.string().optional().default(""),

    paqA2_educacion_fisica: z.enum(["a", "b", "c", "d", "e"], {
      required_error: "Pregunta 2 es requerida.",
    }),
    paqA3_hasta_almuerzo: z.enum(["a", "b", "c", "d", "e"], {
      required_error: "Pregunta 3 es requerida.",
    }),
    paqA4_despues_colegio: z.enum(["a", "b", "c", "d", "e"], {
      required_error: "Pregunta 4 es requerida.",
    }),
    paqA5_tardes: z.enum(["a", "b", "c", "d", "e"], {
      required_error: "Pregunta 5 es requerida.",
    }),
    paqA6_fin_semana: z.enum(["a", "b", "c", "d", "e"], {
      required_error: "Pregunta 6 es requerida.",
    }),
    paqA7_descripcion_semana: z.enum(["a", "b", "c", "d", "e"], {
      required_error: "Pregunta 7 es requerida.",
    }),

    paqA8_daily_freq: dailyFreqRecordSchema.refine(
      (val) =>
        daysOfWeek.every(
          (day) => val[day.id] !== null && val[day.id] !== undefined
        ),
      {
        message: "Debe seleccionar una frecuencia para cada día en la pregunta 8.",
      }
    ),

    paqA9_enfermo: z.enum(["si", "no"], {
      required_error: "Pregunta 9 es requerida.",
    }),
    paqA9_enfermo_razon: z.string().optional().default(""),
  })
  .refine(
    (data) => {
      if (data.paqA9_enfermo === "si") {
        return !!data.paqA9_enfermo_razon && data.paqA9_enfermo_razon.length > 0;
      }
      return true;
    },
    {
      message: "Debe especificar la razón si estuvo enfermo.",
      path: ["paqA9_enfermo_razon"],
    }
  );

type AdolescentFormValues = z.infer<typeof adolescentFormSchema>;

export default function AdolescentForm() {
  const { initialData, setInitialData } = useFormData();
  const { addEvaluationRecord } = useEvaluationContext();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    classification: string;
  } | null>(null);
  const [isClient, setIsClient] = useState(false);

  const formRef = useRef<HTMLFormElement | null>(null);
  const regComplete = searchParams.get("regComplete");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const formElement = formRef.current;

    if (formElement) {
      const main = formElement.closest("main") as HTMLElement | null;

      if (main) {
        main.style.paddingTop = "16px";
        main.style.alignItems = "flex-start";
        main.style.minHeight = "auto";
      }

      const card = formElement.closest("[data-adolescent-card]") as HTMLElement | null;

      if (card) {
        card.style.marginTop = "0px";
      }
    }

    const ocultarBotonVolver = () => {
      const elementos = Array.from(
        document.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>("button, a")
      );

      elementos.forEach((elemento) => {
        const texto = elemento.textContent?.trim().toLowerCase() || "";

        if (texto === "volver" || texto.includes("volver")) {
          elemento.style.display = "none";
          elemento.setAttribute("data-hidden-adolescent-back", "true");
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
        .querySelectorAll<HTMLElement>("[data-hidden-adolescent-back='true']")
        .forEach((elemento) => {
          elemento.style.display = "";
          elemento.removeAttribute("data-hidden-adolescent-back");
        });
    };
  }, [isClient, initialData]);

  const form = useForm<AdolescentFormValues>({
    resolver: zodResolver(adolescentFormSchema),
    defaultValues: {
      evalFirstName: "",
      evalLastName: "",
      evalIdNumber: "",
      evalDob: undefined,
      evalCalculatedAge: 0,
      phone: "",
      sex: undefined,
      weight: 0,
      height: 0,
      paqA1_activities: Object.fromEntries(
        paqAActivities.map((act) => [act.id, null])
      ),
      paqA1_other_activity_text: "",
      paqA8_daily_freq: Object.fromEntries(
        daysOfWeek.map((day) => [day.id, null])
      ),
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
        paqA1_activities: Object.fromEntries(
          paqAActivities.map((act) => [act.id, null])
        ),
        paqA1_other_activity_text: "",
        paqA8_daily_freq: Object.fromEntries(
          daysOfWeek.map((day) => [day.id, null])
        ),
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
      toast({
        title: "Error",
        description:
          "Faltan datos iniciales del participante o el ID del participante no está disponible. Por favor, regístrese primero.",
        variant: "destructive",
      });
      setIsLoading(false);
      router.push("/register-data?regComplete=0");
      return;
    }

    const paqResults = calculatePaqScore(values, "PAQ-A");
    setResults(paqResults);

    const recordToSave = {
      participant_id: initialData.id,
      form_type: "PAQ-A" as "PAQ-A",
      accepted_terms: initialData.accepted_terms,
      form_data: values,
      paq_score: paqResults.score,
      paq_classification: paqResults.classification,
    };

    const result = await addEvaluationRecord(recordToSave);

    if (result.success) {
      toast({
        title: "Formulario de adolescentes enviado",
        description: "Ahora continuará con el formulario PAR-Q.",
      });

      setIsLoading(false);
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

  const inputClass =
    "h-10 rounded-xl border-slate-200 bg-slate-50/80 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-100";

  const readOnlyInputClass =
    "h-10 rounded-xl border-slate-200 bg-slate-100/70 text-sm text-slate-700 shadow-sm cursor-not-allowed";

  const labelClass = "text-sm font-semibold text-slate-700";

  const sectionClass =
    "rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm";

  const questionClass =
    "rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm";

  if (!isClient) {
    return (
      <div className="flex min-h-[calc(100vh-180px)] flex-col items-center justify-center">
        <Loader2 className="mb-4 h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Cargando formulario...</p>
      </div>
    );
  }

  if (initialData) {
    return (
      <Card
        data-adolescent-card
        className="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-2xl"
      >
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-slate-50 px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
              <Activity className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight text-blue-700">
                Cuestionario de Actividad Física para Adolescentes
              </CardTitle>

              <CardDescription className="text-sm text-slate-500">
                Complete la información del evaluado y responda el cuestionario PAQ-A.
                Todos los campos son obligatorios a menos que se indique lo contrario.
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
                      Datos del Evaluado
                    </h3>
                    <p className="text-sm text-slate-500">
                      Información básica cargada desde el registro inicial.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="evalFirstName"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className={labelClass}>Nombres</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly className={readOnlyInputClass} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="evalLastName"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className={labelClass}>Apellidos</FormLabel>
                        <FormControl>
                          <Input {...field} readOnly className={readOnlyInputClass} />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="evalIdNumber"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className={labelClass}>
                          Número de Identificación
                        </FormLabel>
                        <FormControl>
                          <Input {...field} readOnly className={readOnlyInputClass} />
                        </FormControl>
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
                          <Input
                            type="tel"
                            {...field}
                            className={inputClass}
                            placeholder="Número de teléfono"
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
                          value={field.value}
                          disabled={!!initialData?.sex}
                        >
                          <FormControl>
                            <SelectTrigger
                              className={cn(
                                inputClass,
                                initialData?.sex && "cursor-not-allowed bg-slate-100/70"
                              )}
                            >
                              <SelectValue placeholder="Seleccione el sexo" />
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
                    name="evalDob"
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
                                  initialData?.dob &&
                                    "cursor-not-allowed bg-slate-100/70"
                                )}
                                disabled={!!initialData?.dob}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: es })
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
                              fromYear={1980}
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
                    name="evalCalculatedAge"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className={labelClass}>Edad (decimal)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value || 0}
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
                    name="weight"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className={labelClass}>Peso (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            {...field}
                            className={inputClass}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className={labelClass}>Talla (cm)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            {...field}
                            className={inputClass}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <section className={sectionClass}>
                <div className="mb-3 flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <ClipboardList className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Cuestionario de Actividad Física
                    </h3>
                    <p className="text-sm text-slate-500">
                      Responda según la actividad física realizada durante los últimos 7 días.
                    </p>
                  </div>
                </div>

                <p className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-sm leading-relaxed text-slate-600">
                  Queremos conocer cuál es tu nivel de actividad física en los últimos 7
                  días. Esto incluye deportes, gimnasia, danza, juegos, saltar, correr,
                  trepar u otras actividades que hagan sudar o sentirse cansado.
                </p>
              </section>

              <section className={questionClass}>
                <FormItem>
                  <FormLabel className="text-base font-semibold text-slate-800">
                    1. Actividad Física en tu tiempo libre: ¿Has hecho alguna de
                    estas actividades en los últimos 7 días? Si tu respuesta es sí:
                    ¿cuántas veces las has hecho?
                  </FormLabel>

                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/60 p-2">
                    <ActivityTableInput
                      control={form.control}
                      activities={paqAActivities}
                      options={frequencyOptions}
                      namePrefix="paqA1_activities"
                      otherFieldName="paqA1_other_activity_text"
                      watch={form.watch}
                      setValue={form.setValue}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="paqA1_activities"
                    render={() => <FormMessage className="text-xs" />}
                  />
                </FormItem>
              </section>

              <div className="space-y-4">
                <div className={questionClass}>
                  <FormQuestion
                    control={form.control}
                    name="paqA2_educacion_fisica"
                    questionText="2. En los últimos 7 días, durante las clases de educación física. ¿Cuántas veces estuviste muy activo durante las clases: jugando intensamente, corriendo, saltando, haciendo lanzamiento?"
                    options={q2options}
                  />
                </div>

                <div className={questionClass}>
                  <FormQuestion
                    control={form.control}
                    name="paqA3_hasta_almuerzo"
                    questionText="3. En los últimos 7 días, ¿Qué hiciste hasta el almuerzo además de comer?"
                    options={q3options}
                  />
                </div>

                <div className={questionClass}>
                  <FormQuestion
                    control={form.control}
                    name="paqA4_despues_colegio"
                    questionText="4. En los últimos 7 días, ¿cuántos días después del colegio hiciste deportes, baile o jugaste a juegos en los que estuvieras muy activo? (2:00 p.m. a 6:00 p.m.)"
                    options={q4options}
                  />
                </div>

                <div className={questionClass}>
                  <FormQuestion
                    control={form.control}
                    name="paqA5_tardes"
                    questionText="5. En los últimos 7 días, ¿cuántas tardes hiciste deporte, baile o juegos en los que estuviste muy activo? (6:00 p.m. en adelante)"
                    options={q4options}
                  />
                </div>

                <div className={questionClass}>
                  <FormQuestion
                    control={form.control}
                    name="paqA6_fin_semana"
                    questionText="6. El último fin de semana, ¿cuántas veces hiciste deporte, baile o juegos en los que estuviste muy activo?"
                    options={q4options}
                  />
                </div>

                <div className={questionClass}>
                  <FormQuestion
                    control={form.control}
                    name="paqA7_descripcion_semana"
                    questionText="7. ¿Cuál de las siguientes frases describe mejor tu última semana? Lee las cinco antes de decidir cuál te describe mejor."
                    options={q7options}
                  />
                </div>
              </div>

              <section className={questionClass}>
                <FormItem>
                  <FormLabel className="text-base font-semibold text-slate-800">
                    8. Señala con qué frecuencia hiciste actividad física para cada
                    día de la última semana.
                  </FormLabel>

                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/60 p-2">
                    <ActivityTableInput
                      control={form.control}
                      activities={daysOfWeek}
                      options={dailyActivityOptions}
                      namePrefix="paqA8_daily_freq"
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="paqA8_daily_freq"
                    render={() => <FormMessage className="text-xs" />}
                  />
                </FormItem>
              </section>

              <section className={questionClass}>
                <FormField
                  control={form.control}
                  name="paqA9_enfermo"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-semibold text-slate-800">
                        9. ¿Estuviste enfermo esta última semana o algo impidió
                        que hicieras normalmente actividades físicas?
                      </FormLabel>

                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid gap-3 md:grid-cols-2"
                        >
                          <FormItem className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 shadow-sm">
                            <FormControl>
                              <RadioGroupItem value="no" />
                            </FormControl>
                            <FormLabel className="cursor-pointer font-normal text-slate-600">
                              No
                            </FormLabel>
                          </FormItem>

                          <FormItem className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 shadow-sm">
                            <FormControl>
                              <RadioGroupItem value="si" />
                            </FormControl>
                            <FormLabel className="cursor-pointer font-normal text-slate-600">
                              Sí
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>

                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {paqA9EnfermoValue === "si" && (
                  <FormField
                    control={form.control}
                    name="paqA9_enfermo_razon"
                    render={({ field }) => (
                      <FormItem className="mt-4 space-y-1">
                        <FormLabel className={labelClass}>
                          Si la respuesta es sí, indique qué lo impidió:
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className={inputClass}
                            placeholder="Escriba la razón"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                )}
              </section>

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
                  Enviar Formulario Adolescentes
                </Button>
              </div>
            </form>
          </Form>

          {results && (
            <AlertDialog
              open={showResultsDialog}
              onOpenChange={setShowResultsDialog}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Resultados del PAQ-A</AlertDialogTitle>

                  <AlertDialogDescription>
                    <span className="block">Puntaje Obtenido: {results.score}</span>

                    <span className="block">
                      Clasificación:{" "}
                      <span className="font-semibold text-primary">
                        {results.classification}
                      </span>
                    </span>

                    <span className="mt-3 block font-medium text-foreground">
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

  if (regComplete === "1") {
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
    <Card className="mx-auto -mt-16 max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
      <CardHeader className="border-b border-slate-100 bg-red-50/50 px-6 py-5">
        <CardTitle className="text-xl font-bold text-destructive">
          Acceso Restringido
        </CardTitle>
        <CardDescription>
          Para completar este formulario, primero debe registrar los datos
          iniciales del participante.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6">
        <Button
          className="h-11 rounded-xl"
          onClick={() => router.push("/register-data")}
        >
          Ir al Registro de Datos
        </Button>
      </CardContent>
    </Card>
  );
}