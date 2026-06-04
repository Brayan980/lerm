// adulto
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import React, { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Footprints,
  Loader2,
  Timer,
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
import { Checkbox } from "@/components/ui/checkbox";
import { useFormData } from "@/contexts/FormDataContext";
import { useEvaluationContext } from "@/contexts/EvaluationContext";
import { useToast } from "@/hooks/use-toast";
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
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ipaqSchema = z
  .object({
    vigorous_days: z.coerce
      .number()
      .int()
      .min(0, "Mínimo 0 días")
      .max(7, "Máximo 7 días")
      .default(0),
    no_vigorous_activity: z.boolean().default(false),
    vigorous_hours_per_day: z.coerce
      .number()
      .int()
      .min(0, "Mínimo 0 horas")
      .max(23, "Máximo 23 horas")
      .default(0),
    vigorous_minutes_per_day: z.coerce
      .number()
      .int()
      .min(0, "Mínimo 0 minutos")
      .max(59, "Máximo 59 minutos")
      .default(0),
    vigorous_dont_know: z.boolean().default(false),

    moderate_days: z.coerce
      .number()
      .int()
      .min(0, "Mínimo 0 días")
      .max(7, "Máximo 7 días")
      .default(0),
    no_moderate_activity: z.boolean().default(false),
    moderate_hours_per_day: z.coerce
      .number()
      .int()
      .min(0, "Mínimo 0 horas")
      .max(23, "Máximo 23 horas")
      .default(0),
    moderate_minutes_per_day: z.coerce
      .number()
      .int()
      .min(0, "Mínimo 0 minutos")
      .max(59, "Máximo 59 minutos")
      .default(0),
    moderate_dont_know: z.boolean().default(false),

    walk_days: z.coerce
      .number()
      .int()
      .min(0, "Mínimo 0 días")
      .max(7, "Máximo 7 días")
      .default(0),
    no_walk_activity: z.boolean().default(false),
    walk_hours_per_day: z.coerce
      .number()
      .int()
      .min(0, "Mínimo 0 horas")
      .max(23, "Máximo 23 horas")
      .default(0),
    walk_minutes_per_day: z.coerce
      .number()
      .int()
      .min(0, "Mínimo 0 minutos")
      .max(59, "Máximo 59 minutos")
      .default(0),
    walk_dont_know: z.boolean().default(false),

    sit_hours_weekday: z.coerce
      .number()
      .int()
      .min(0, "Mínimo 0 horas")
      .max(23, "Máximo 23 horas")
      .default(0),
    sit_minutes_weekday: z.coerce
      .number()
      .int()
      .min(0, "Mínimo 0 minutos")
      .max(59, "Máximo 59 minutos")
      .default(0),
    sit_dont_know: z.boolean().default(false),
  })
  .refine((data) => !(data.no_vigorous_activity && data.vigorous_days > 0), {
    message: "No puede indicar días si no realizó actividad vigorosa.",
    path: ["vigorous_days"],
  })
  .refine((data) => !(data.no_moderate_activity && data.moderate_days > 0), {
    message: "No puede indicar días si no realizó actividad moderada.",
    path: ["moderate_days"],
  })
  .refine((data) => !(data.no_walk_activity && data.walk_days > 0), {
    message: "No puede indicar días si no caminó.",
    path: ["walk_days"],
  })
  .refine(
    (data) =>
      data.no_vigorous_activity ||
      data.vigorous_dont_know ||
      data.vigorous_hours_per_day >= 0 ||
      data.vigorous_minutes_per_day >= 0,
    {
      message: "Debe indicar tiempo o 'No sabe' para actividad vigorosa.",
      path: ["vigorous_hours_per_day"],
    }
  )
  .refine(
    (data) =>
      data.no_moderate_activity ||
      data.moderate_dont_know ||
      data.moderate_hours_per_day >= 0 ||
      data.moderate_minutes_per_day >= 0,
    {
      message: "Debe indicar tiempo o 'No sabe' para actividad moderada.",
      path: ["moderate_hours_per_day"],
    }
  )
  .refine(
    (data) =>
      data.no_walk_activity ||
      data.walk_dont_know ||
      data.walk_hours_per_day >= 0 ||
      data.walk_minutes_per_day >= 0,
    {
      message: "Debe indicar tiempo o 'No sabe' para caminata.",
      path: ["walk_hours_per_day"],
    }
  )
  .refine(
    (data) =>
      data.sit_dont_know ||
      data.sit_hours_weekday >= 0 ||
      data.sit_minutes_weekday >= 0,
    {
      message: "Debe indicar tiempo o 'No sabe' para tiempo sentado.",
      path: ["sit_hours_weekday"],
    }
  );

type IpaqFormValues = z.infer<typeof ipaqSchema>;

interface IpaqResult {
  totalMETMinutesPerWeek: number;
  activityLevel: "Bajo" | "Moderado" | "Alto" | "Insuficientemente Activo";
}

function calculateIpaq(data: IpaqFormValues): IpaqResult {
  const METs = { vigorous: 8.0, moderate: 4.0, walk: 3.3 };
  let totalMETMinutes = 0;

  const vigorousTime =
    data.vigorous_dont_know || data.no_vigorous_activity
      ? 0
      : (data.vigorous_hours_per_day || 0) * 60 +
        (data.vigorous_minutes_per_day || 0);

  const moderateTime =
    data.moderate_dont_know || data.no_moderate_activity
      ? 0
      : (data.moderate_hours_per_day || 0) * 60 +
        (data.moderate_minutes_per_day || 0);

  const walkTime =
    data.walk_dont_know || data.no_walk_activity
      ? 0
      : (data.walk_hours_per_day || 0) * 60 +
        (data.walk_minutes_per_day || 0);

  const vigorousDays = data.no_vigorous_activity ? 0 : data.vigorous_days || 0;
  const moderateDays = data.no_moderate_activity ? 0 : data.moderate_days || 0;
  const walkDays = data.no_walk_activity ? 0 : data.walk_days || 0;

  totalMETMinutes += vigorousTime * METs.vigorous * vigorousDays;
  totalMETMinutes += moderateTime * METs.moderate * moderateDays;
  totalMETMinutes += walkTime * METs.walk * walkDays;

  totalMETMinutes = Math.round(totalMETMinutes);

  let activityLevel: IpaqResult["activityLevel"] = "Insuficientemente Activo";

  const totalActivityDays = vigorousDays + moderateDays + walkDays;
  const meetsVigorousCriteria = vigorousDays >= 3 && totalMETMinutes >= 1500;
  const meetsCombinedCriteria = totalActivityDays >= 7 && totalMETMinutes >= 3000;

  if (meetsVigorousCriteria || meetsCombinedCriteria) {
    activityLevel = "Alto";
  } else {
    const meetsModerateCriteria1 = vigorousDays >= 3 && vigorousTime >= 20;
    const meetsModerateCriteria2 =
      (moderateDays >= 5 || walkDays >= 5) &&
      (moderateTime >= 30 || walkTime >= 30);
    const meetsModerateCriteria3 =
      totalActivityDays >= 5 && totalMETMinutes >= 600;

    if (
      meetsModerateCriteria1 ||
      meetsModerateCriteria2 ||
      meetsModerateCriteria3
    ) {
      activityLevel = "Moderado";
    } else {
      if (totalMETMinutes > 0) {
        activityLevel = "Bajo";
      } else {
        activityLevel = "Insuficientemente Activo";
      }
    }
  }

  if (
    totalMETMinutes === 0 &&
    vigorousTime === 0 &&
    moderateTime === 0 &&
    walkTime === 0
  ) {
    activityLevel = "Insuficientemente Activo";
  }

  return { totalMETMinutesPerWeek: totalMETMinutes, activityLevel };
}

export default function IpaqForm() {
  const { initialData } = useFormData();
  const { addEvaluationRecord } = useEvaluationContext();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingValues, setPendingValues] = useState<IpaqFormValues | null>(null);
  const [isClient, setIsClient] = useState(false);

  const formRef = useRef<HTMLFormElement | null>(null);
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
        main.style.paddingTop = "0px";
        main.style.alignItems = "flex-start";
        main.style.minHeight = "auto";
      }

      const card = formElement.closest("[data-ipaq-card]") as HTMLElement | null;

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

        if (texto === "volver") {
          elemento.style.display = "none";
          elemento.setAttribute("data-hidden-ipaq-back", "true");
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
        .querySelectorAll<HTMLElement>("[data-hidden-ipaq-back='true']")
        .forEach((elemento) => {
          elemento.style.display = "";
          elemento.removeAttribute("data-hidden-ipaq-back");
        });
    };
  }, [isClient, initialData]);

  const clampNumber = (value: string, min: number, max: number) => {
    const cleanValue = value.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");

    if (cleanValue === "") return 0;

    const numberValue = Number(cleanValue);

    if (Number.isNaN(numberValue)) return min;

    return Math.min(Math.max(numberValue, min), max);
  };

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

  useEffect(() => {
    if (watchNoVigorous) {
      form.setValue("vigorous_days", 0);
      form.setValue("vigorous_hours_per_day", 0);
      form.setValue("vigorous_minutes_per_day", 0);
      form.setValue("vigorous_dont_know", false);
    }
  }, [watchNoVigorous, form]);

  useEffect(() => {
    if (watchVigorousDontKnow && !watchNoVigorous) {
      form.setValue("vigorous_hours_per_day", 0);
      form.setValue("vigorous_minutes_per_day", 0);
    }
  }, [watchVigorousDontKnow, watchNoVigorous, form]);

  useEffect(() => {
    if (watchNoModerate) {
      form.setValue("moderate_days", 0);
      form.setValue("moderate_hours_per_day", 0);
      form.setValue("moderate_minutes_per_day", 0);
      form.setValue("moderate_dont_know", false);
    }
  }, [watchNoModerate, form]);

  useEffect(() => {
    if (watchModerateDontKnow && !watchNoModerate) {
      form.setValue("moderate_hours_per_day", 0);
      form.setValue("moderate_minutes_per_day", 0);
    }
  }, [watchModerateDontKnow, watchNoModerate, form]);

  useEffect(() => {
    if (watchNoWalk) {
      form.setValue("walk_days", 0);
      form.setValue("walk_hours_per_day", 0);
      form.setValue("walk_minutes_per_day", 0);
      form.setValue("walk_dont_know", false);
    }
  }, [watchNoWalk, form]);

  useEffect(() => {
    if (watchWalkDontKnow && !watchNoWalk) {
      form.setValue("walk_hours_per_day", 0);
      form.setValue("walk_minutes_per_day", 0);
    }
  }, [watchWalkDontKnow, watchNoWalk, form]);

  useEffect(() => {
    if (watchSitDontKnow) {
      form.setValue("sit_hours_weekday", 0);
      form.setValue("sit_minutes_weekday", 0);
    }
  }, [watchSitDontKnow, form]);

  async function onSubmit(values: IpaqFormValues) {
    setPendingValues(values);
    setShowConfirmDialog(true);
  }

  async function handleConfirmSubmit() {
    if (!pendingValues) return;

    setIsSubmitting(true);

    if (!initialData || !initialData.id) {
      toast({
        title: "Error",
        description:
          "Faltan datos iniciales del participante o el ID del participante no está disponible. Por favor, regístrese primero.",
        variant: "destructive",
      });

      setIsSubmitting(false);
      setShowConfirmDialog(false);
      router.push("/register-data?regComplete=0");
      return;
    }

    const ipaqResults = calculateIpaq(pendingValues);

    const recordToSave = {
      participant_id: initialData.id,
      form_type: "IPAQ" as "IPAQ",
      accepted_terms: initialData.accepted_terms,
      form_data: pendingValues,
      ipaq_met_minutes: ipaqResults.totalMETMinutesPerWeek,
      ipaq_classification: ipaqResults.activityLevel,
    };

    const result = await addEvaluationRecord(recordToSave);

    if (result.success) {
      toast({
        title: "Formulario IPAQ enviado",
        description: "Sus respuestas han sido procesadas y registradas.",
      });

      setShowConfirmDialog(false);
      setPendingValues(null);
      router.push("/par-q-form?regComplete=1");
    } else {
      toast({
        title: "Error al Guardar",
        description:
          result.message || "No se pudo guardar el registro de evaluación.",
        variant: "destructive",
      });
    }

    setIsSubmitting(false);
  }

  const inputClass =
    "h-10 rounded-xl border-slate-200 bg-slate-50/80 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100";

  const labelClass = "text-sm font-semibold text-slate-700";

  const sectionClass =
    "rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm";

  const checkboxClass =
    "flex flex-row items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3 shadow-sm";

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
        data-ipaq-card
        className="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-2xl"
      >
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-slate-50 px-6 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
              <Activity className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight text-blue-700">
                Cuestionario Internacional de Actividad Física IPAQ
              </CardTitle>

              <CardDescription className="text-sm text-slate-500">
                Hola {initialData.first_name}, complete el cuestionario según las
                actividades realizadas durante los últimos 7 días.
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                    <Dumbbell className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Actividad Física Vigorosa
                    </h3>
                    <p className="text-sm text-slate-500">
                      Actividades que requieren esfuerzo físico intenso y hacen
                      respirar mucho más fuerte de lo normal.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="vigorous_days"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className={labelClass}>
                          1. Durante los últimos 7 días, ¿en cuántos días realizó
                          actividades físicas vigorosas?
                        </FormLabel>

                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={7}
                            inputMode="numeric"
                            step={1}
                            {...field}
                            value={field.value === 0 ? "" : field.value}
                            onFocus={(e) => e.currentTarget.select()}
                            disabled={watchNoVigorous}
                            className={inputClass}
                            onChange={(e) =>
                              field.onChange(clampNumber(e.target.value, 0, 7))
                            }
                          />
                        </FormControl>

                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="no_vigorous_activity"
                    render={({ field }) => (
                      <FormItem className={checkboxClass}>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-0.5"
                          />
                        </FormControl>

                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer text-sm font-medium text-slate-700">
                            Ninguna actividad física intensa
                          </FormLabel>
                          <FormDescription className="text-xs text-slate-500">
                            Si marca esta opción, continúe con actividad moderada.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {!watchNoVigorous && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                      <FormLabel className="text-sm font-semibold text-slate-700">
                        2. Habitualmente, ¿cuánto tiempo dedicó a una actividad
                        física intensa en uno de esos días?
                      </FormLabel>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="vigorous_hours_per_day"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-xs font-semibold text-slate-600">
                                Horas por día
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  max={23}
                                  inputMode="numeric"
                                  step={1}
                                  {...field}
                                  value={field.value === 0 ? "" : field.value}
                                  onFocus={(e) => e.currentTarget.select()}
                                  disabled={watchVigorousDontKnow}
                                  className={inputClass}
                                  onChange={(e) =>
                                    field.onChange(
                                      clampNumber(e.target.value, 0, 23)
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="vigorous_minutes_per_day"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-xs font-semibold text-slate-600">
                                Minutos por día
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  max={59}
                                  inputMode="numeric"
                                  step={1}
                                  {...field}
                                  value={field.value === 0 ? "" : field.value}
                                  onFocus={(e) => e.currentTarget.select()}
                                  disabled={watchVigorousDontKnow}
                                  className={inputClass}
                                  onChange={(e) =>
                                    field.onChange(
                                      clampNumber(e.target.value, 0, 59)
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="vigorous_dont_know"
                        render={({ field }) => (
                          <FormItem className="mt-3 flex flex-row items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={watchNoVigorous}
                              />
                            </FormControl>
                            <FormLabel className="cursor-pointer text-sm font-normal text-slate-600">
                              No sabe / no está seguro
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </section>

              <section className={sectionClass}>
                <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                    <Activity className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Actividad Física Moderada
                    </h3>
                    <p className="text-sm text-slate-500">
                      Actividades con esfuerzo moderado que hacen respirar algo
                      más fuerte de lo normal.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="moderate_days"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className={labelClass}>
                          3. ¿En cuántos días hizo actividades físicas moderadas?
                        </FormLabel>

                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={7}
                            inputMode="numeric"
                            step={1}
                            {...field}
                            value={field.value === 0 ? "" : field.value}
                            onFocus={(e) => e.currentTarget.select()}
                            disabled={watchNoModerate}
                            className={inputClass}
                            onChange={(e) =>
                              field.onChange(clampNumber(e.target.value, 0, 7))
                            }
                          />
                        </FormControl>

                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="no_moderate_activity"
                    render={({ field }) => (
                      <FormItem className={checkboxClass}>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-0.5"
                          />
                        </FormControl>

                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer text-sm font-medium text-slate-700">
                            Ninguna actividad física moderada
                          </FormLabel>
                          <FormDescription className="text-xs text-slate-500">
                            Si marca esta opción, continúe con caminatas.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {!watchNoModerate && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                      <FormLabel className="text-sm font-semibold text-slate-700">
                        4. ¿Cuánto tiempo dedicó a una actividad física moderada
                        en uno de esos días?
                      </FormLabel>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="moderate_hours_per_day"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-xs font-semibold text-slate-600">
                                Horas por día
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  max={23}
                                  inputMode="numeric"
                                  step={1}
                                  {...field}
                                  value={field.value === 0 ? "" : field.value}
                                  onFocus={(e) => e.currentTarget.select()}
                                  disabled={watchModerateDontKnow}
                                  className={inputClass}
                                  onChange={(e) =>
                                    field.onChange(
                                      clampNumber(e.target.value, 0, 23)
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="moderate_minutes_per_day"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-xs font-semibold text-slate-600">
                                Minutos por día
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  max={59}
                                  inputMode="numeric"
                                  step={1}
                                  {...field}
                                  value={field.value === 0 ? "" : field.value}
                                  onFocus={(e) => e.currentTarget.select()}
                                  disabled={watchModerateDontKnow}
                                  className={inputClass}
                                  onChange={(e) =>
                                    field.onChange(
                                      clampNumber(e.target.value, 0, 59)
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="moderate_dont_know"
                        render={({ field }) => (
                          <FormItem className="mt-3 flex flex-row items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={watchNoModerate}
                              />
                            </FormControl>
                            <FormLabel className="cursor-pointer text-sm font-normal text-slate-600">
                              No sabe / no está seguro
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </section>

              <section className={sectionClass}>
                <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <Footprints className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Caminatas
                    </h3>
                    <p className="text-sm text-slate-500">
                      Incluya caminatas en el trabajo, casa, transporte,
                      recreación, deporte, ejercicio o placer.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="walk_days"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel className={labelClass}>
                          5. ¿En cuántos días caminó por lo menos 10 minutos
                          seguidos?
                        </FormLabel>

                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            max={7}
                            inputMode="numeric"
                            step={1}
                            {...field}
                            value={field.value === 0 ? "" : field.value}
                            onFocus={(e) => e.currentTarget.select()}
                            disabled={watchNoWalk}
                            className={inputClass}
                            onChange={(e) =>
                              field.onChange(clampNumber(e.target.value, 0, 7))
                            }
                          />
                        </FormControl>

                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="no_walk_activity"
                    render={({ field }) => (
                      <FormItem className={checkboxClass}>
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-0.5"
                          />
                        </FormControl>

                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer text-sm font-medium text-slate-700">
                            No caminé por lo menos 10 minutos seguidos
                          </FormLabel>
                          <FormDescription className="text-xs text-slate-500">
                            Si marca esta opción, continúe con tiempo sentado.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {!watchNoWalk && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                      <FormLabel className="text-sm font-semibold text-slate-700">
                        6. ¿Cuánto tiempo dedicó a caminar en uno de esos días?
                      </FormLabel>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="walk_hours_per_day"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-xs font-semibold text-slate-600">
                                Horas por día
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  max={23}
                                  inputMode="numeric"
                                  step={1}
                                  {...field}
                                  value={field.value === 0 ? "" : field.value}
                                  onFocus={(e) => e.currentTarget.select()}
                                  disabled={watchWalkDontKnow}
                                  className={inputClass}
                                  onChange={(e) =>
                                    field.onChange(
                                      clampNumber(e.target.value, 0, 23)
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="walk_minutes_per_day"
                          render={({ field }) => (
                            <FormItem className="space-y-1">
                              <FormLabel className="text-xs font-semibold text-slate-600">
                                Minutos por día
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  max={59}
                                  inputMode="numeric"
                                  step={1}
                                  {...field}
                                  value={field.value === 0 ? "" : field.value}
                                  onFocus={(e) => e.currentTarget.select()}
                                  disabled={watchWalkDontKnow}
                                  className={inputClass}
                                  onChange={(e) =>
                                    field.onChange(
                                      clampNumber(e.target.value, 0, 59)
                                    )
                                  }
                                />
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="walk_dont_know"
                        render={({ field }) => (
                          <FormItem className="mt-3 flex flex-row items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled={watchNoWalk}
                              />
                            </FormControl>
                            <FormLabel className="cursor-pointer text-sm font-normal text-slate-600">
                              No sabe / no está seguro
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </section>

              <section className={sectionClass}>
                <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                    <Clock3 className="h-5 w-5" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Tiempo Sentado
                    </h3>
                    <p className="text-sm text-slate-500">
                      Incluya tiempo sentado en trabajo, casa, estudio,
                      transporte, lectura o televisión.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Timer className="h-4 w-4 text-slate-500" />
                    <FormLabel className="text-sm font-semibold text-slate-700">
                      7. ¿Cuánto tiempo pasó sentado durante un día hábil?
                    </FormLabel>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="sit_hours_weekday"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-semibold text-slate-600">
                            Horas por día
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={23}
                              inputMode="numeric"
                              step={1}
                              {...field}
                              value={field.value === 0 ? "" : field.value}
                              onFocus={(e) => e.currentTarget.select()}
                              disabled={watchSitDontKnow}
                              className={inputClass}
                              onChange={(e) =>
                                field.onChange(clampNumber(e.target.value, 0, 23))
                              }
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sit_minutes_weekday"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-xs font-semibold text-slate-600">
                            Minutos por día
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              max={59}
                              inputMode="numeric"
                              step={1}
                              {...field}
                              value={field.value === 0 ? "" : field.value}
                              onFocus={(e) => e.currentTarget.select()}
                              disabled={watchSitDontKnow}
                              className={inputClass}
                              onChange={(e) =>
                                field.onChange(clampNumber(e.target.value, 0, 59))
                              }
                            />
                          </FormControl>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="sit_dont_know"
                    render={({ field }) => (
                      <FormItem className="mt-3 flex flex-row items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer text-sm font-normal text-slate-600">
                          No sabe / no está seguro
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </section>

              <div className="sticky bottom-0 z-10 rounded-2xl border border-slate-100 bg-white/90 p-3 shadow-lg backdrop-blur">
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-blue-600 text-base font-semibold shadow-md transition-all hover:bg-blue-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                  )}
                  Enviar Formulario IPAQ
                </Button>
              </div>
            </form>
          </Form>

          <AlertDialog
            open={showConfirmDialog}
            onOpenChange={(open) => {
              if (!isSubmitting) {
                setShowConfirmDialog(open);
              }
            }}
          >
            <AlertDialogContent className="rounded-3xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-xl font-bold text-slate-900">
                  ¿Está listo para enviar el formulario IPAQ?
                </AlertDialogTitle>

                <AlertDialogDescription className="text-sm text-slate-500">
                  Al seleccionar <span className="font-semibold text-slate-700">Listo</span>,
                  se guardarán las respuestas y continuará al formulario PAR-Q.
                  Si desea revisar o corregir alguna respuesta, seleccione
                  <span className="font-semibold text-slate-700"> Cancelar</span>.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter className="gap-2 sm:gap-2">
                <AlertDialogCancel
                  disabled={isSubmitting}
                  className="rounded-xl border-slate-200 px-5 font-semibold"
                >
                  Cancelar
                </AlertDialogCancel>

                <AlertDialogAction
                  disabled={isSubmitting}
                  onClick={(event) => {
                    event.preventDefault();
                    handleConfirmSubmit();
                  }}
                  className="rounded-xl bg-blue-600 px-5 font-semibold hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}
                  Listo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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