// niños
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useEffect, useRef, useState } from "react";
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
  UsersRound,
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
import { useFormData } from "@/contexts/FormDataContext";
import { useEvaluationContext } from "@/contexts/EvaluationContext";
import { useToast } from "@/hooks/use-toast";
import { calculateDecimalAge } from "@/lib/ageCalculator";
import { calculatePaqScore } from "@/lib/scoring";
import type { Frequency, DailyActivityFrequency } from "@/lib/types";
import { frequencyOptions, dailyActivityOptions } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
  { id: "lunes", label: "Lunes" },
  { id: "martes", label: "Martes" },
  { id: "miercoles", label: "Miércoles" },
  { id: "jueves", label: "Jueves" },
  { id: "viernes", label: "Viernes" },
  { id: "sabado", label: "Sábado" },
  { id: "domingo", label: "Domingo" },
];

const q2_options_c = [
  { value: "a", label: "Ninguna", score: 1 },
  { value: "b", label: "Un poco", score: 2 },
  { value: "c", label: "Bastante", score: 3 },
  { value: "d", label: "Casi siempre", score: 4 },
  { value: "e", label: "Siempre", score: 5 },
];

const q3_options_c = [
  { value: "a", label: "Me senté (hablando, leyendo, haciendo deberes)", score: 1 },
  { value: "b", label: "Estuve de pie o caminé un poco", score: 2 },
  { value: "c", label: "Corrí o jugué un poco", score: 3 },
  { value: "d", label: "Corrí o jugué bastante", score: 4 },
  { value: "e", label: "Corrí o jugué mucho", score: 5 },
];

const q5_options_c = [
  { value: "a", label: "Ninguna", score: 1 },
  { value: "b", label: "1 vez", score: 2 },
  { value: "c", label: "2-3 veces", score: 3 },
  { value: "d", label: "4-5 veces", score: 4 },
  { value: "e", label: "6 o más veces", score: 5 },
];

const q8_options_c = [
  {
    value: "a",
    label:
      "Durante toda la semana estuve muy poco activo. No hice nada o casi nada.",
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

const childrenFormSchema = z
  .object({
    repFirstName: z.string().min(2, "Nombre del representante es requerido."),
    repLastName: z.string().min(2, "Apellido del representante es requerido."),
    repEmail: z.string().email("Correo inválido."),
    repPhone: z.string().min(7, "Teléfono inválido."),
    repIdNumber: z.string().min(5, "Identificación inválida."),

    evalFirstName: z.string().min(2, "Nombre del evaluado es requerido."),
    evalLastName: z.string().min(2, "Apellido del evaluado es requerido."),
    evalIdNumber: z.string().min(5, "Identificación del evaluado inválida."),
    evalSex: z.enum(["Femenino", "Masculino", "Otro"], {
      required_error: "Sexo es requerido.",
    }),
    evalDob: z.date({
      required_error: "Fecha de nacimiento del evaluado es requerida.",
    }),
    evalCalculatedAge: z.number().optional(),
    evalWeight: z.coerce.number().positive("Peso debe ser positivo.").default(0),
    evalHeight: z.coerce.number().positive("Talla debe ser positiva.").default(0),

    paqC1_activities: activityRecordSchema.refine(
      (val) => Object.values(val).some((v) => v !== null),
      {
        message:
          "Debe seleccionar al menos una frecuencia para una actividad en la pregunta 1.",
      }
    ),
    paqC1_other_activity_text: z.string().optional().default(""),

    paqC2_educacion_fisica: z.enum(["a", "b", "c", "d", "e"], {
      required_error: "Pregunta 2 es requerida.",
    }),
    paqC3_recreo: z.enum(["a", "b", "c", "d", "e"], {
      required_error: "Pregunta 3 es requerida.",
    }),
    paqC4_antes_despues_comer: z.enum(["a", "b", "c", "d", "e"], {
      required_error: "Pregunta 4 es requerida.",
    }),
    paqC5_despues_colegio: z.enum(["a", "b", "c", "d", "e"], {
      required_error: "Pregunta 5 es requerida.",
    }),
    paqC6_noche: z.enum(["a", "b", "c", "d", "e"], {
      required_error: "Pregunta 6 es requerida.",
    }),
    paqC7_fin_semana: z.enum(["a", "b", "c", "d", "e"], {
      required_error: "Pregunta 7 es requerida.",
    }),
    paqC8_descripcion_semana: z.enum(["a", "b", "c", "d", "e"], {
      required_error: "Pregunta 8 es requerida.",
    }),

    paqC9_daily_freq: dailyFreqRecordSchema.refine(
      (val) =>
        daysOfWeek.every(
          (day) => val[day.id] !== null && val[day.id] !== undefined
        ),
      {
        message: "Debe seleccionar una frecuencia para cada día en la pregunta 9.",
      }
    ),

    paqC10_enfermo: z.enum(["si", "no"], {
      required_error: "Pregunta 10 es requerida.",
    }),
    paqC10_enfermo_razon: z.string().optional().default(""),
  })
  .refine(
    (data) => {
      if (data.paqC10_enfermo === "si") {
        return (
          !!data.paqC10_enfermo_razon &&
          data.paqC10_enfermo_razon.length > 0
        );
      }

      return true;
    },
    {
      message: "Debe especificar la razón si estuvo enfermo.",
      path: ["paqC10_enfermo_razon"],
    }
  );

type ChildrenFormValues = z.infer<typeof childrenFormSchema>;


type ClickableOption = {
  value: string;
  label: string;
  score?: number;
};

type ClickableActivity = {
  id: string;
  label: string;
  isOther?: boolean;
};

function SelectableOptionCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group flex min-h-11 w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-all duration-200",
        selected
          ? "border-blue-500 bg-blue-50 text-blue-700 shadow-sm ring-2 ring-blue-100"
          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50/70 hover:text-blue-700"
      )}
    >
      <span
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-200",
          selected
            ? "border-blue-600 bg-blue-600 text-white"
            : "border-blue-300 bg-white group-hover:border-blue-500"
        )}
      >
        {selected && <CheckCircle2 className="h-3.5 w-3.5" />}
      </span>

      <span className="font-medium leading-snug">{label}</span>
    </button>
  );
}

function limpiarNumeroDecimal(value: unknown) {
  const texto = String(value ?? "")
    .replace(",", ".")
    .replace(/[^\d.]/g, "");

  if (!texto) return "";

  const [enteroOriginal = "", ...decimalesOriginales] = texto.split(".");
  const enteroLimpio = enteroOriginal.replace(/^0+(?=\d)/, "");

  if (texto.includes(".")) {
    const decimales = decimalesOriginales.join("").slice(0, 2);
    return `${enteroLimpio || "0"}.${decimales}`;
  }

  return enteroLimpio;
}

function mostrarNumeroLimpio(value: unknown) {
  if (value === null || value === undefined || value === "" || value === 0) {
    return "";
  }

  return String(value).replace(/^0+(?=\d)/, "");
}

function moverNumeroConScroll(
  event: React.WheelEvent<HTMLInputElement>,
  value: unknown,
  onChange: (value: string) => void,
  minimo = 1,
  salto = 0.1
) {
  event.preventDefault();

  if (value === null || value === undefined || value === "") {
    onChange(String(minimo));
    return;
  }

  const numeroActual = Number(String(value).replace(",", "."));
  const base = Number.isFinite(numeroActual) ? numeroActual : minimo;
  const siguiente = event.deltaY < 0 ? base + salto : base - salto;
  const valorFinal = Math.max(minimo, siguiente);

  onChange(String(Number(valorFinal.toFixed(2))));
}

function ClickableFormQuestion({
  control,
  name,
  questionText,
  options,
}: {
  control: any;
  name: any;
  questionText: string;
  options: ClickableOption[];
}) {
  const hasLongOptions = options.some((option) => option.label.length > 45);

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-3">
          <FormLabel className="text-base font-semibold text-slate-800">
            {questionText}
          </FormLabel>

          <FormControl>
            <div
              className={cn(
                "grid gap-2",
                hasLongOptions
                  ? "md:grid-cols-1"
                  : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
              )}
            >
              {options.map((option) => (
                <SelectableOptionCard
                  key={option.value}
                  label={option.label}
                  selected={field.value === option.value}
                  onClick={() => field.onChange(option.value)}
                />
              ))}
            </div>
          </FormControl>

          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );
}

function ClickableActivityTableInput({
  control,
  activities,
  options,
  namePrefix,
  otherFieldName,
  watch,
}: {
  control: any;
  activities: ClickableActivity[];
  options: ClickableOption[];
  namePrefix: string;
  otherFieldName?: any;
  watch?: any;
  setValue?: any;
}) {
  const hasOtherColumn = Boolean(otherFieldName);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div
        className={cn(
          "hidden gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 md:grid",
          hasOtherColumn ? "md:grid-cols-[1fr_2.3fr_0.9fr]" : "md:grid-cols-[1fr_2.6fr]"
        )}
      >
        <div>Actividad</div>
        <div>Frecuencia</div>
        {hasOtherColumn && <div>Especificar Otros</div>}
      </div>

      <div className="divide-y divide-slate-100">
        {activities.map((activity) => (
          <FormField
            key={activity.id}
            control={control}
            name={`${namePrefix}.${activity.id}` as any}
            render={({ field }) => {
              const selectedValue = field.value ?? "";
              const shouldShowOtherInput =
                activity.isOther &&
                otherFieldName &&
                watch?.(`${namePrefix}.${activity.id}`) &&
                watch?.(`${namePrefix}.${activity.id}`) !== "no";

              return (
                <FormItem
                  className={cn(
                    "grid gap-3 px-4 py-4 md:items-start",
                    hasOtherColumn
                      ? "md:grid-cols-[1fr_2.3fr_0.9fr]"
                      : "md:grid-cols-[1fr_2.6fr]"
                  )}
                >
                  <div className="flex items-center text-sm font-medium text-slate-600 md:min-h-11">
                    {activity.label}
                  </div>

                  <div className="space-y-2">
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                      {options.map((option) => (
                        <SelectableOptionCard
                          key={option.value}
                          label={option.label}
                          selected={selectedValue === option.value}
                          onClick={() => field.onChange(option.value)}
                        />
                      ))}
                    </div>

                    <FormMessage className="text-xs" />
                  </div>

                  {hasOtherColumn && (
                    <div className="md:min-h-11">
                      {shouldShowOtherInput ? (
                        <FormField
                          control={control}
                          name={otherFieldName}
                          render={({ field: otherField }) => (
                            <FormItem className="space-y-1">
                              <FormControl>
                                <Input
                                  {...otherField}
                                  className="h-11 rounded-xl border-slate-200 bg-slate-50/80 text-sm shadow-sm focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-100"
                                  placeholder="Especifique"
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <span className="hidden text-xs text-slate-400 md:block">
                          —
                        </span>
                      )}
                    </div>
                  )}
                </FormItem>
              );
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChildrenFormPaqC() {
  const { initialData } = useFormData();
  const { addEvaluationRecord } = useEvaluationContext();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const formRef = useRef<HTMLFormElement | null>(null);
  const regComplete = searchParams.get("regComplete");

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const formElement = formRef.current;
    const main = formElement?.closest("main") as HTMLElement | null;

    const previousMainPaddingTop = main?.style.paddingTop || "";
    const previousMainAlignItems = main?.style.alignItems || "";
    const previousMainMinHeight = main?.style.minHeight || "";

    if (main) {
      main.style.paddingTop = "24px";
      main.style.alignItems = "flex-start";
      main.style.minHeight = "auto";
    }

    const ocultarBotonVolver = () => {
      const elementos = Array.from(
        document.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>("button, a")
      );

      elementos.forEach((elemento) => {
        const texto = elemento.textContent?.trim().toLowerCase() || "";
        const estaDentroDelFormulario = elemento.closest("[data-children-paqc-card]");

        if (!estaDentroDelFormulario && texto === "volver") {
          elemento.style.display = "none";
          elemento.setAttribute("data-hidden-children-back", "true");
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

      if (main) {
        main.style.paddingTop = previousMainPaddingTop;
        main.style.alignItems = previousMainAlignItems;
        main.style.minHeight = previousMainMinHeight;
      }

      document
        .querySelectorAll<HTMLElement>("[data-hidden-children-back='true']")
        .forEach((elemento) => {
          elemento.style.display = "";
          elemento.removeAttribute("data-hidden-children-back");
        });
    };
  }, []);

  const form = useForm<ChildrenFormValues>({
    resolver: zodResolver(childrenFormSchema),
    defaultValues: {
      repFirstName: "",
      repLastName: "",
      repEmail: "",
      repPhone: "",
      repIdNumber: "",
      evalFirstName: "",
      evalLastName: "",
      evalIdNumber: "",
      evalSex: undefined,
      evalDob: undefined,
      evalCalculatedAge: 0,
      evalWeight: "" as unknown as number,
      evalHeight: "" as unknown as number,
      paqC1_activities: Object.fromEntries(
        paqCActivities.map((act) => [act.id, null])
      ),
      paqC1_other_activity_text: "",
      paqC9_daily_freq: Object.fromEntries(
        daysOfWeek.map((day) => [day.id, null])
      ),
      paqC10_enfermo: undefined,
      paqC10_enfermo_razon: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        repFirstName: "",
        repLastName: "",
        repEmail: "",
        repPhone: "",
        repIdNumber: "",
        evalFirstName: initialData.first_name || "",
        evalLastName: initialData.last_name || "",
        evalIdNumber: initialData.id_number || "",
        evalSex: initialData.sex || undefined,
        evalDob: initialData.dob ? new Date(initialData.dob) : undefined,
        evalCalculatedAge: Number(Number(initialData.calculated_age ?? 0).toFixed(2)),
        evalWeight: "" as unknown as number,
        evalHeight: "" as unknown as number,
        paqC1_activities: Object.fromEntries(
          paqCActivities.map((act) => [act.id, null])
        ),
        paqC1_other_activity_text: "",
        paqC9_daily_freq: Object.fromEntries(
          daysOfWeek.map((day) => [day.id, null])
        ),
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

    const paqResults = calculatePaqScore(values, "PAQ-C");

    const recordToSave = {
      participant_id: initialData.id,
      form_type: "PAQ-C" as "PAQ-C",
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
    }

    toast({
      title: "Error al Guardar",
      description: result.message || "No se pudo guardar el registro de evaluación.",
      variant: "destructive",
    });

    setIsLoading(false);
  }

  const inputClass =
    "h-10 rounded-xl border-slate-200 bg-slate-50/80 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-100";

  const readOnlyInputClass =
    "h-10 cursor-not-allowed rounded-xl border-slate-200 bg-slate-100/70 text-sm text-slate-700 shadow-sm";

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
        data-children-paqc-card
        className="mx-auto mt-4 w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-2xl shadow-slate-300/40"
      >
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-slate-50 px-7 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
              <Activity className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight text-blue-700">
                Cuestionario de Actividad Física para Niños
              </CardTitle>

              <CardDescription className="text-sm text-slate-500">
                Complete los datos del representante, los datos del evaluado y responda el cuestionario PAQ-C.
                Todos los campos son obligatorios a menos que se indique lo contrario.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-7 py-5">
          <Form {...form}>
            <form
              ref={formRef}
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
              <section className={sectionClass}>
                <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                    <UsersRound className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Datos del Representante
                    </h3>
                    <p className="text-sm text-slate-500">
                      Información de contacto del adulto responsable.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="repFirstName"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className={labelClass}>Nombres</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className={inputClass}
                            placeholder="Nombres del representante"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="repLastName"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className={labelClass}>Apellidos</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className={inputClass}
                            placeholder="Apellidos del representante"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="repEmail"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className={labelClass}>Correo</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            {...field}
                            className={inputClass}
                            placeholder="correo@ejemplo.com"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="repPhone"
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
                    name="repIdNumber"
                    render={({ field }) => (
                      <FormItem className="space-y-1 md:col-span-2">
                        <FormLabel className={labelClass}>
                          Número de Identificación
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className={inputClass}
                            placeholder="Identificación del representante"
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
                        <FormMessage className="text-xs" />
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
                        <FormMessage className="text-xs" />
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
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="evalSex"
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
                                initialData?.sex &&
                                  "cursor-not-allowed bg-slate-100/70"
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
                              fromYear={2000}
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
                            step="0.01"
                            {...field}
                            value={Number(field.value ?? 0).toFixed(2)}
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
                    name="evalWeight"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className={labelClass}>Peso (kg)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            min="1"
                            step="0.1"
                            value={mostrarNumeroLimpio(field.value)}
                            onChange={(e) => {
                              field.onChange(limpiarNumeroDecimal(e.target.value));
                            }}
                            onWheel={(e) => {
                              moverNumeroConScroll(e, field.value, field.onChange, 1, 0.1);
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            className={inputClass}
                            placeholder="Ej: 60.5"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="evalHeight"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className={labelClass}>Talla (cm)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            inputMode="decimal"
                            min="1"
                            step="0.1"
                            value={mostrarNumeroLimpio(field.value)}
                            onChange={(e) => {
                              field.onChange(limpiarNumeroDecimal(e.target.value));
                            }}
                            onWheel={(e) => {
                              moverNumeroConScroll(e, field.value, field.onChange, 1, 0.1);
                            }}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                            className={inputClass}
                            placeholder="Ej: 120.5"
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
                      Cuestionario PAQ-C
                    </h3>
                    <p className="text-sm text-slate-500">
                      Responda según la actividad física realizada durante los últimos 7 días.
                    </p>
                  </div>
                </div>

                <p className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-sm leading-relaxed text-slate-600">
                  Queremos conocer cuál es el nivel de actividad física del niño
                  durante la última semana. Incluya juegos, deportes, caminar,
                  correr, bailar, educación física u otras actividades.
                </p>
              </section>

              <section className={questionClass}>
                <FormItem>
                  <FormLabel className="text-base font-semibold text-slate-800">
                    1. ¿Has hecho alguna de estas actividades en los últimos 7 días?
                    Si tu respuesta es sí, ¿cuántas veces lo has hecho?
                  </FormLabel>

                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/60 p-2">
                    <ClickableActivityTableInput
                      control={form.control}
                      activities={paqCActivities}
                      options={frequencyOptions}
                      namePrefix="paqC1_activities"
                      otherFieldName="paqC1_other_activity_text"
                      watch={form.watch}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="paqC1_activities"
                    render={() => <FormMessage className="text-xs" />}
                  />
                </FormItem>
              </section>

              <div className="space-y-4">
                <div className={questionClass}>
                  <ClickableFormQuestion
                    control={form.control}
                    name="paqC2_educacion_fisica"
                    questionText="2. Durante las clases de educación física, ¿cuántas veces estuviste muy activo?"
                    options={q2_options_c}
                  />
                </div>

                <div className={questionClass}>
                  <ClickableFormQuestion
                    control={form.control}
                    name="paqC3_recreo"
                    questionText="3. ¿Qué hiciste durante el recreo?"
                    options={q3_options_c}
                  />
                </div>

                <div className={questionClass}>
                  <ClickableFormQuestion
                    control={form.control}
                    name="paqC4_antes_despues_comer"
                    questionText="4. ¿Qué hiciste antes y después de comer?"
                    options={q3_options_c}
                  />
                </div>

                <div className={questionClass}>
                  <ClickableFormQuestion
                    control={form.control}
                    name="paqC5_despues_colegio"
                    questionText="5. En los últimos 7 días, inmediatamente después del colegio, ¿cuántos días jugaste, hiciste deporte o bailaste en los que estuvieras muy activo?"
                    options={q5_options_c}
                  />
                </div>

                <div className={questionClass}>
                  <ClickableFormQuestion
                    control={form.control}
                    name="paqC6_noche"
                    questionText="6. En los últimos 7 días, ¿cuántos días entre las 6 p.m y 10 p.m jugaste, bailaste o hiciste deportes en los que estuvieras muy activo?"
                    options={q5_options_c}
                  />
                </div>

                <div className={questionClass}>
                  <ClickableFormQuestion
                    control={form.control}
                    name="paqC7_fin_semana"
                    questionText="7. El último fin de semana, ¿cuántas veces jugaste, bailaste o hiciste deportes en los que estuvieras muy activo?"
                    options={q5_options_c}
                  />
                </div>

                <div className={questionClass}>
                  <ClickableFormQuestion
                    control={form.control}
                    name="paqC8_descripcion_semana"
                    questionText="8. ¿Cuál de las siguientes frases describen mejor tu última semana? Lee las cinco antes de decidir cuál te describe mejor."
                    options={q8_options_c}
                  />
                </div>
              </div>

              <section className={questionClass}>
                <FormItem>
                  <FormLabel className="text-base font-semibold text-slate-800">
                    9. Señala con qué frecuencia hiciste actividad física para cada
                    día de la última semana.
                  </FormLabel>

                  <div className="mt-3 overflow-hidden rounded-xl border border-slate-100 bg-slate-50/60 p-2">
                    <ClickableActivityTableInput
                      control={form.control}
                      activities={daysOfWeek}
                      options={dailyActivityOptions}
                      namePrefix="paqC9_daily_freq"
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="paqC9_daily_freq"
                    render={() => <FormMessage className="text-xs" />}
                  />
                </FormItem>
              </section>

              <section className={questionClass}>
                <FormField
                  control={form.control}
                  name="paqC10_enfermo"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base font-semibold text-slate-800">
                        10. ¿Estuviste enfermo esta última semana o algo impidió
                        que hicieras normalmente actividades físicas?
                      </FormLabel>

                      <FormControl>
                        <div className="grid gap-3 md:grid-cols-2">
                          <SelectableOptionCard
                            label="No"
                            selected={field.value === "no"}
                            onClick={() => field.onChange("no")}
                          />

                          <SelectableOptionCard
                            label="Sí"
                            selected={field.value === "si"}
                            onClick={() => field.onChange("si")}
                          />
                        </div>
                      </FormControl>

                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                {paqC10EnfermoValue === "si" && (
                  <FormField
                    control={form.control}
                    name="paqC10_enfermo_razon"
                    render={({ field }) => (
                      <FormItem className="mt-4 space-y-1">
                        <FormLabel className={labelClass}>
                          Si la respuesta es sí, qué lo impidió:
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
                  Enviar Formulario PAQ-C
                </Button>
              </div>
            </form>
          </Form>
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