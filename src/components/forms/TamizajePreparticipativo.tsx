// TamizajePreparticipativo
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Activity,
  AlertTriangle,
  CalendarIcon,
  CheckCircle2,
  ClipboardCheck,
  HeartPulse,
  Loader2,
  ShieldCheck,
  Stethoscope,
  UserRound,
} from "lucide-react";
import { format as formatDateFn } from "date-fns";
import { es } from "date-fns/locale";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { TermsSections } from "@/components/terms/TermsSections";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { calculateDecimalAge } from "@/lib/ageCalculator";
import { query } from "@/lib/db";
import { useFormData } from "@/contexts/FormDataContext";

const tamizajeSchema = z
  .object({
    firstName: z.string().min(2, {
      message: "El nombre debe tener al menos 2 caracteres.",
    }),
    lastName: z.string().min(2, {
      message: "El apellido debe tener al menos 2 caracteres.",
    }),
    dob: z.date({
      required_error: "La fecha de nacimiento es obligatoria.",
    }),
    sex: z.enum(["Femenino", "Masculino", "Otro"], {
      required_error: "El sexo es obligatorio.",
    }),
    email: z.string().email({
      message: "Debe ser un correo electrónico válido.",
    }),
    idNumber: z.string().min(5, {
      message: "El número de identificación debe tener al menos 5 caracteres.",
    }),

    actividadFisica: z.enum(["si", "no"], {
      required_error: "Debe responder si participa en actividad física.",
    }),

    tipoActividadFisica: z.string().optional(),

    tieneEnfermedad: z.enum(["si", "no"], {
      required_error: "Debe responder si tiene enfermedades.",
    }),
    tieneSintomas: z.enum(["si", "no"], {
      required_error: "Debe responder si tiene síntomas.",
    }),

    enfermedades: z.array(z.string()).default([]),
    otraEnfermedad: z.string().optional(),

    sintomas: z.array(z.string()).default([]),
    otroSintoma: z.string().optional(),

    acceptedTerms: z.boolean().refine((val) => val === true, {
      message: "Debes aceptar los términos y condiciones.",
    }),
  })
  .superRefine((data, ctx) => {
    if (data.actividadFisica === "si" && !data.tipoActividadFisica) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tipoActividadFisica"],
        message: "Debe seleccionar el tipo de actividad física.",
      });
    }

    if (
      data.tieneEnfermedad === "si" &&
      data.enfermedades.includes("Otra") &&
      !data.otraEnfermedad?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["otraEnfermedad"],
        message: "Debe escribir cuál es la otra enfermedad.",
      });
    }

    if (
      data.tieneSintomas === "si" &&
      data.sintomas.includes("Otros") &&
      !data.otroSintoma?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["otroSintoma"],
        message: "Debe escribir cuál es el otro signo o síntoma.",
      });
    }
  });

type TamizajeFormValues = z.infer<typeof tamizajeSchema>;

export default function TamizajePreparticipativo() {
  const router = useRouter();
  const { toast } = useToast();
  const { initialData } = useFormData();

  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resumenData, setResumenData] = useState<any>(null);
  const [loadedParticipantId, setLoadedParticipantId] = useState("");

  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    const ajustarVista = () => {
      const formElement = formRef.current;
      if (!formElement) return;

      const main = formElement.closest("main") as HTMLElement | null;

      if (main) {
        main.style.paddingTop = "16px";
        main.style.alignItems = "flex-start";
        main.style.minHeight = "auto";
      }

      const card = formElement.closest("[data-tamizaje-card]") as HTMLElement | null;

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
          elemento.setAttribute("data-hidden-tamizaje-back", "true");
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
        .querySelectorAll<HTMLElement>("[data-hidden-tamizaje-back='true']")
        .forEach((elemento) => {
          elemento.style.display = "";
          elemento.removeAttribute("data-hidden-tamizaje-back");
        });
    };
  }, [initialData]);

  const form = useForm<TamizajeFormValues>({
    resolver: zodResolver(tamizajeSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dob: undefined,
      sex: undefined,
      email: "",
      idNumber: "",
      actividadFisica: undefined,
      tipoActividadFisica: "",
      tieneEnfermedad: undefined,
      tieneSintomas: undefined,
      enfermedades: [],
      otraEnfermedad: "",
      sintomas: [],
      otroSintoma: "",
      acceptedTerms: false,
    },
  });

  const actividadFisicaSeleccionada = form.watch("actividadFisica");
  const tieneEnfermedadSeleccionada = form.watch("tieneEnfermedad");
  const tieneSintomasSeleccionado = form.watch("tieneSintomas");
  const enfermedadesSeleccionadas = form.watch("enfermedades");
  const sintomasSeleccionados = form.watch("sintomas");
  const fechaNacimientoSeleccionada = form.watch("dob");

  const edadCalculada = fechaNacimientoSeleccionada
    ? calculateDecimalAge(fechaNacimientoSeleccionada)
    : 0;

  const esMenorDe12 = edadCalculada < 12;

  useEffect(() => {
    const normalizeSex = (
      value: any
    ): "Femenino" | "Masculino" | "Otro" | undefined => {
      if (!value) return undefined;

      const sexValue = String(value).trim().toLowerCase();

      if (
        sexValue === "masculino" ||
        sexValue === "m" ||
        sexValue === "male" ||
        sexValue === "hombre" ||
        sexValue.includes("mas")
      ) {
        return "Masculino";
      }

      if (
        sexValue === "femenino" ||
        sexValue === "f" ||
        sexValue === "female" ||
        sexValue === "mujer" ||
        sexValue.includes("fem")
      ) {
        return "Femenino";
      }

      if (sexValue === "otro" || sexValue === "other") {
        return "Otro";
      }

      return undefined;
    };

    const loadParticipantData = async () => {
      let localData: any = {};

      const savedData = localStorage.getItem("participantData");

      if (savedData) {
        try {
          localData = JSON.parse(savedData);
        } catch (error) {
          console.error("Error leyendo participantData:", error);
        }
      }

      const baseData: any = initialData || localData || {};

      const idNumber =
        baseData.id_number ||
        baseData.idNumber ||
        baseData.numeroIdentificacion ||
        baseData.identificacion ||
        baseData.documento ||
        "";

      let dbData: any = {};

      if (idNumber) {
        try {
          const participantResult = await query(
            `
            SELECT id, first_name, last_name, id_number, dob, calculated_age, sex, email, accepted_terms
            FROM participants
            WHERE id_number = $1
            LIMIT 1
            `,
            [idNumber]
          );

          dbData = participantResult.rows?.[0] || {};
        } catch (error) {
          console.error(
            "[TamizajePreparticipativo] Error cargando participante desde DB:",
            error
          );
        }
      }

      const participantId = dbData.id || baseData.id || "";

      const firstName =
        dbData.first_name ||
        baseData.first_name ||
        baseData.firstName ||
        baseData.nombres ||
        "";

      const lastName =
        dbData.last_name ||
        baseData.last_name ||
        baseData.lastName ||
        baseData.apellidos ||
        "";

      const dobValue =
        dbData.dob ||
        baseData.dob ||
        baseData.fechaNacimiento ||
        baseData.birthDate;

      const email =
        dbData.email ||
        baseData.email ||
        baseData.correo ||
        baseData.correoElectronico ||
        "";

      const finalIdNumber =
        dbData.id_number ||
        baseData.id_number ||
        baseData.idNumber ||
        baseData.numeroIdentificacion ||
        baseData.identificacion ||
        baseData.documento ||
        "";

      const sexoNormalizado = normalizeSex(
        dbData.sex ||
          baseData.sex ||
          baseData.sexo ||
          baseData.genero ||
          baseData.gender
      );

      setLoadedParticipantId(participantId);

      form.reset({
        ...form.getValues(),
        firstName,
        lastName,
        dob: dobValue ? new Date(dobValue) : undefined,
        sex: sexoNormalizado,
        email,
        idNumber: finalIdNumber,
        acceptedTerms: Boolean(
          dbData.accepted_terms ?? baseData.accepted_terms ?? false
        ),
      });

      if (sexoNormalizado) {
        form.setValue("sex", sexoNormalizado, {
          shouldValidate: true,
          shouldDirty: false,
          shouldTouch: false,
        });
      }
    };

    loadParticipantData();
  }, [initialData, form]);

  const enfermedadesLista = [
    "Enfermedad cardiaca o vascular",
    "Enfermedad cerebrovascular",
    "Diabetes tipo 1 o 2",
    "Hipercolesterolemia o triglicéridos altos",
    "Enfermedad renal",
  ];

  const sintomasLista = [
    "Dolor o malestar en el pecho",
    "Mareo",
    "Falta de aire durante el día o la noche",
    "Hinchazón de tobillos",
    "Palpitaciones anormales en reposo",
    "Dolor punzante en la pierna",
    "Fatiga inusual con la actividad",
  ];

  const calcularResumen = (
    actividadFisica: string,
    tieneEnfermedad: string,
    tieneSintomas: string
  ) => {
    if (
      actividadFisica === "si" &&
      tieneEnfermedad === "no" &&
      tieneSintomas === "no"
    ) {
      return {
        revision: "No necesita revisión médica previa",
        intensidad: "Puede realizar actividad moderada a vigorosa",
      };
    }

    if (
      actividadFisica === "si" &&
      tieneEnfermedad === "si" &&
      tieneSintomas === "no"
    ) {
      return {
        revision:
          "No necesita revisión médica para intensidad moderada. Sí requiere para intensidad vigorosa",
        intensidad: "Se recomienda iniciar con intensidad moderada",
      };
    }

    if (
      actividadFisica === "si" &&
      tieneEnfermedad === "si" &&
      tieneSintomas === "si"
    ) {
      return {
        revision: "Debe detener el ejercicio y realizar revisión médica previa",
        intensidad:
          "Puede retomar el ejercicio después de la revisión médica según su estado de salud",
      };
    }

    if (
      actividadFisica === "no" &&
      tieneEnfermedad === "no" &&
      tieneSintomas === "si"
    ) {
      return {
        revision: "Se requiere revisión médica",
        intensidad:
          "Puede retomar el ejercicio después de la revisión médica según su estado de salud",
      };
    }

    if (
      actividadFisica === "no" &&
      tieneEnfermedad === "no" &&
      tieneSintomas === "no"
    ) {
      return {
        revision: "Se recomienda revisión médica previa antes de iniciar",
        intensidad:
          "Se recomienda iniciar con actividad de intensidad leve a moderada",
      };
    }

    if (
      actividadFisica === "no" &&
      tieneEnfermedad === "si" &&
      tieneSintomas === "no"
    ) {
      return {
        revision: "Debe realizar revisión médica previa",
        intensidad:
          "Puede iniciar con intensidad leve a moderada después de revisión",
      };
    }

    if (
      actividadFisica === "no" &&
      tieneEnfermedad === "si" &&
      tieneSintomas === "si"
    ) {
      return {
        revision: "Debe realizar revisión médica antes de iniciar",
        intensidad:
          "Solo podrá retomar actividad leve después de revisión médica",
      };
    }

    return {
      revision: "Verifique las respuestas.",
      intensidad: "Verifique las respuestas.",
    };
  };

  async function onSubmit(values: TamizajeFormValues) {
    setIsLoading(true);

    const participantId = initialData?.id || loadedParticipantId;

    if (!participantId) {
      toast({
        title: "Datos incompletos",
        description:
          "No se encontraron los datos del participante. Inicie nuevamente desde el registro.",
        variant: "destructive",
      });

      setIsLoading(false);
      return;
    }

    try {
      const age = calculateDecimalAge(values.dob);
      const dobForDb = formatDateFn(values.dob, "yyyy-MM-dd");

      const resumen = calcularResumen(
        values.actividadFisica,
        values.tieneEnfermedad,
        values.tieneSintomas
      );

      const participantDataForDb = {
        id: participantId,
        first_name: values.firstName,
        last_name: values.lastName,
        dob: dobForDb,
        calculated_age: age,
        sex: values.sex,
        email: values.email.toLowerCase(),
        id_number: values.idNumber,
        accepted_terms: values.acceptedTerms,
      };

      const enfermedadesFinales = [
        ...values.enfermedades.filter((enfermedad) => enfermedad !== "Otra"),
        ...(values.enfermedades.includes("Otra") &&
        values.otraEnfermedad?.trim()
          ? [`Otra: ${values.otraEnfermedad.trim()}`]
          : []),
      ];

      const sintomasFinales = [
        ...values.sintomas.filter((sintoma) => sintoma !== "Otros"),
        ...(values.sintomas.includes("Otros") && values.otroSintoma?.trim()
          ? [`Otros: ${values.otroSintoma.trim()}`]
          : []),
      ];

      const tamizajeResponses = {
        participant: participantDataForDb,
        actividadFisica: values.actividadFisica,
        tipoActividadFisica: values.tipoActividadFisica || "",
        edadCalculada: age,
        tieneEnfermedad: values.tieneEnfermedad,
        enfermedades: enfermedadesFinales,
        otraEnfermedad: values.otraEnfermedad?.trim() || "",
        tieneSintomas: values.tieneSintomas,
        sintomas: sintomasFinales,
        otroSintoma: values.otroSintoma?.trim() || "",
        revision: resumen.revision,
        intensidad: resumen.intensidad,
      };

      const submissionDate = new Date().toISOString();
      const status = "Nueva";

      await query(
        `
        INSERT INTO evaluation_records (
          id,
          participant_id,
          form_type,
          submission_date,
          status,
          accepted_terms,
          form_data,
          tamizaje_classification
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          `eval-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          participantId,
          "TAMIZAJE",
          submissionDate,
          status,
          true,
          JSON.stringify(tamizajeResponses),
          resumen.revision,
        ]
      );

      setResumenData({
        ...values,
        enfermedades: enfermedadesFinales,
        sintomas: sintomasFinales,
        resumen,
      });

      setShowDialog(true);

      toast({
        title: "Datos registrados exitosamente",
        description: "El tamizaje se ha completado correctamente.",
      });
    } catch (error) {
      console.error("[TamizajePreparticipativo] Error guardando:", error);

      toast({
        title: "Error al guardar",
        description:
          "No se pudo guardar el tamizaje. Revise la consola o intente nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass =
    "h-10 rounded-xl border-slate-200 bg-slate-50/80 text-sm text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100/70";

  const readOnlyInputClass =
    "h-10 cursor-not-allowed rounded-xl border-slate-200 bg-slate-100/70 text-sm text-slate-700 shadow-sm";

  const labelClass = "text-sm font-semibold text-slate-700";

  const sectionClass =
    "rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm";

  const siNoBoxClass = (selected: boolean, tipo: "si" | "no") =>
    cn(
      "flex h-14 w-full cursor-pointer items-center gap-3 rounded-xl border p-3 text-left shadow-sm transition-all focus:outline-none focus:ring-2",
      selected
        ? tipo === "si"
          ? "border-red-300 bg-red-50 text-red-800 ring-red-100"
          : "border-emerald-300 bg-emerald-50 text-emerald-800 ring-emerald-100"
        : "border-slate-100 bg-slate-50/80 text-slate-700 hover:border-blue-200 hover:bg-white hover:shadow-md"
    );

  const siNoIndicatorClass = (selected: boolean, tipo: "si" | "no") =>
    cn(
      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-white transition-all",
      selected
        ? tipo === "si"
          ? "border-red-500 bg-red-500"
          : "border-emerald-500 bg-emerald-500"
        : "border-slate-300 bg-white"
    );

  const checkboxCardClass = (selected: boolean, disabled: boolean) =>
    cn(
      "flex w-full items-start gap-3 rounded-xl border p-3 text-left shadow-sm transition-all",
      disabled
        ? "cursor-not-allowed border-slate-100 bg-slate-100/70 text-slate-400 opacity-70"
        : selected
          ? "cursor-pointer border-blue-300 bg-blue-50 text-blue-800 ring-2 ring-blue-100"
          : "cursor-pointer border-slate-100 bg-white/80 text-slate-700 hover:border-blue-200 hover:bg-white hover:shadow-md"
    );

  const checkboxIndicatorClass = (selected: boolean, disabled: boolean) =>
    cn(
      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-white transition-all",
      disabled
        ? "border-slate-300 bg-slate-100"
        : selected
          ? "border-blue-500 bg-blue-500"
          : "border-slate-300 bg-white"
    );

  return (
    <Card
      data-tamizaje-card
      className="mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-2xl"
    >
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-blue-50 via-white to-slate-50 px-6 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
            <HeartPulse className="h-6 w-6" />
          </div>

          <div className="space-y-1">
            <CardTitle className="text-2xl font-bold tracking-tight text-blue-700">
              Formulario de Tamizaje Preparticipativo
            </CardTitle>

            <CardDescription className="text-sm text-slate-500">
              Complete las siguientes secciones antes de realizar actividad física.
              La información del participante se carga desde el registro inicial.
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
                    Datos personales
                  </h3>
                  <p className="text-sm text-slate-500">
                    Información básica cargada automáticamente.
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
                          placeholder="Sus nombres"
                          {...field}
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
                  name="lastName"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className={labelClass}>Apellidos</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Sus apellidos"
                          {...field}
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
                  name="idNumber"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className={labelClass}>
                        Número de Identificación
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Su número de identificación"
                          {...field}
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
                              type="button"
                              variant="outline"
                              disabled
                              className={cn(
                                readOnlyInputClass,
                                "w-full justify-start px-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                formatDateFn(field.value, "PPP", { locale: es })
                              ) : (
                                <span>Seleccione una fecha</span>
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
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                            captionLayout="dropdown-buttons"
                            fromYear={1900}
                            toYear={new Date().getFullYear()}
                          />
                        </PopoverContent>
                      </Popover>

                      <FormDescription className="text-xs text-slate-500">
                        Edad calculada: {edadCalculada.toFixed(1)} años
                      </FormDescription>

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
                        disabled
                      >
                        <FormControl>
                          <SelectTrigger className={readOnlyInputClass}>
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
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel className={labelClass}>
                        Correo Electrónico
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="su.correo@ejemplo.com"
                          {...field}
                          readOnly
                          className={readOnlyInputClass}
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
                  <Activity className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    1. Participación en actividad física
                  </h3>
                  <p className="text-sm text-slate-500">
                    Programa realizado en los últimos 3 meses, al menos 3 veces
                    por semana y 30 minutos por día.
                  </p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="actividadFisica"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <div className="grid gap-3 md:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => field.onChange("si")}
                          className={siNoBoxClass(field.value === "si", "si")}
                          aria-pressed={field.value === "si"}
                        >
                          <span className={siNoIndicatorClass(field.value === "si", "si")}>
                            {field.value === "si" && <CheckCircle2 className="h-4 w-4" />}
                          </span>
                          <span className="text-sm font-semibold">
                            Sí participa
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            field.onChange("no");
                            form.setValue("tipoActividadFisica", "");
                          }}
                          className={siNoBoxClass(field.value === "no", "no")}
                          aria-pressed={field.value === "no"}
                        >
                          <span className={siNoIndicatorClass(field.value === "no", "no")}>
                            {field.value === "no" && <CheckCircle2 className="h-4 w-4" />}
                          </span>
                          <span className="text-sm font-semibold">
                            No participa
                          </span>
                        </button>
                      </div>
                    </FormControl>

                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              {actividadFisicaSeleccionada === "si" && (
                <FormField
                  control={form.control}
                  name="tipoActividadFisica"
                  render={({ field }) => (
                    <FormItem className="mt-4 space-y-1">
                      <FormLabel className={labelClass}>
                        Tipo de participación en actividad física
                      </FormLabel>

                      <FormDescription className="text-xs text-slate-500">
                        Según la edad calculada, seleccione el tipo de actividad
                        que realiza.
                      </FormDescription>

                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ""}
                      >
                        <FormControl>
                          <SelectTrigger className={inputClass}>
                            <SelectValue placeholder="Seleccione una opción" />
                          </SelectTrigger>
                        </FormControl>

                        <SelectContent>
                          {esMenorDe12 ? (
                            <>
                              <SelectItem value="deporte_escolar">
                                Deporte escolar
                              </SelectItem>
                              <SelectItem value="deporte_normal">
                                Deporte normal / recreativo
                              </SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="deportista_competencia">
                                Deportista de competencia
                              </SelectItem>
                              <SelectItem value="deportista_recreativo">
                                Deportista recreativo
                              </SelectItem>
                              <SelectItem value="normal_ejercicio">
                                Normal / solo hacer ejercicio
                              </SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>

                      <FormDescription className="text-xs text-slate-500">
                        Edad calculada: {edadCalculada.toFixed(1)} años
                      </FormDescription>

                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
              )}
            </section>

            <section className={sectionClass}>
              <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <Stethoscope className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    2. Enfermedades cardiovasculares, metabólicas o renales
                  </h3>
                  <p className="text-sm text-slate-500">
                    Indique si tiene o ha tenido alguna de estas enfermedades.
                  </p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="tieneEnfermedad"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <div className="grid gap-3 md:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => field.onChange("si")}
                          className={siNoBoxClass(field.value === "si", "si")}
                          aria-pressed={field.value === "si"}
                        >
                          <span className={siNoIndicatorClass(field.value === "si", "si")}>
                            {field.value === "si" && <CheckCircle2 className="h-4 w-4" />}
                          </span>
                          <span className="text-sm font-semibold">
                            Sí presenta
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            field.onChange("no");
                            form.setValue("enfermedades", []);
                            form.setValue("otraEnfermedad", "");
                          }}
                          className={siNoBoxClass(field.value === "no", "no")}
                          aria-pressed={field.value === "no"}
                        >
                          <span className={siNoIndicatorClass(field.value === "no", "no")}>
                            {field.value === "no" && <CheckCircle2 className="h-4 w-4" />}
                          </span>
                          <span className="text-sm font-semibold">
                            No presenta
                          </span>
                        </button>
                      </div>
                    </FormControl>

                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enfermedades"
                render={() => (
                  <FormItem className="mt-4">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <FormLabel className="text-sm font-bold text-blue-700">
                        Seleccione las enfermedades:
                      </FormLabel>

                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {enfermedadesLista.map((enf) => (
                          <FormField
                            key={enf}
                            control={form.control}
                            name="enfermedades"
                            render={({ field }) => {
                              const isChecked = field.value?.includes(enf) || false;
                              const isDisabled = tieneEnfermedadSeleccionada !== "si";

                              return (
                                <FormItem>
                                  <FormControl>
                                    <button
                                      type="button"
                                      disabled={isDisabled}
                                      onClick={() => {
                                        if (isDisabled) return;

                                        if (isChecked) {
                                          field.onChange(
                                            field.value?.filter(
                                              (value) => value !== enf
                                            )
                                          );
                                        } else {
                                          field.onChange([...(field.value || []), enf]);
                                        }
                                      }}
                                      className={checkboxCardClass(isChecked, isDisabled)}
                                    >
                                      <span className={checkboxIndicatorClass(isChecked, isDisabled)}>
                                        {isChecked && <CheckCircle2 className="h-3.5 w-3.5" />}
                                      </span>

                                      <span className="text-sm font-medium">
                                        {enf}
                                      </span>
                                    </button>
                                  </FormControl>
                                </FormItem>
                              );
                            }}
                          />
                        ))}

                        <FormField
                          control={form.control}
                          name="enfermedades"
                          render={({ field }) => {
                            const isChecked = field.value?.includes("Otra") || false;
                            const isDisabled = tieneEnfermedadSeleccionada !== "si";

                            return (
                              <FormItem>
                                <FormControl>
                                  <button
                                    type="button"
                                    disabled={isDisabled}
                                    onClick={() => {
                                      if (isDisabled) return;

                                      if (isChecked) {
                                        field.onChange(
                                          field.value?.filter(
                                            (value) => value !== "Otra"
                                          )
                                        );
                                        form.setValue("otraEnfermedad", "");
                                      } else {
                                        field.onChange([...(field.value || []), "Otra"]);
                                      }
                                    }}
                                    className={checkboxCardClass(isChecked, isDisabled)}
                                  >
                                    <span className={checkboxIndicatorClass(isChecked, isDisabled)}>
                                      {isChecked && <CheckCircle2 className="h-3.5 w-3.5" />}
                                    </span>

                                    <span className="text-sm font-medium">
                                      Otra
                                    </span>
                                  </button>
                                </FormControl>
                              </FormItem>
                            );
                          }}
                        />
                      </div>

                      {enfermedadesSeleccionadas?.includes("Otra") &&
                        tieneEnfermedadSeleccionada === "si" && (
                          <FormField
                            control={form.control}
                            name="otraEnfermedad"
                            render={({ field }) => (
                              <FormItem className="mt-3 space-y-1">
                                <FormLabel className={labelClass}>
                                  ¿Cuál otra enfermedad?
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Escriba la otra enfermedad"
                                    {...field}
                                    className={inputClass}
                                  />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        )}
                    </div>

                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </section>

            <section className={sectionClass}>
              <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    3. Signos o síntomas
                  </h3>
                  <p className="text-sm text-slate-500">
                    Indique si presenta signos o síntomas de enfermedad
                    cardiovascular, metabólica o renal.
                  </p>
                </div>
              </div>

              <FormField
                control={form.control}
                name="tieneSintomas"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <div className="grid gap-3 md:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => field.onChange("si")}
                          className={siNoBoxClass(field.value === "si", "si")}
                          aria-pressed={field.value === "si"}
                        >
                          <span className={siNoIndicatorClass(field.value === "si", "si")}>
                            {field.value === "si" && <CheckCircle2 className="h-4 w-4" />}
                          </span>
                          <span className="text-sm font-semibold">
                            Sí presenta
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            field.onChange("no");
                            form.setValue("sintomas", []);
                            form.setValue("otroSintoma", "");
                          }}
                          className={siNoBoxClass(field.value === "no", "no")}
                          aria-pressed={field.value === "no"}
                        >
                          <span className={siNoIndicatorClass(field.value === "no", "no")}>
                            {field.value === "no" && <CheckCircle2 className="h-4 w-4" />}
                          </span>
                          <span className="text-sm font-semibold">
                            No presenta
                          </span>
                        </button>
                      </div>
                    </FormControl>

                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sintomas"
                render={() => (
                  <FormItem className="mt-4">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                      <FormLabel className="text-sm font-bold text-blue-700">
                        Seleccione los signos o síntomas:
                      </FormLabel>

                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {sintomasLista.map((sint) => (
                          <FormField
                            key={sint}
                            control={form.control}
                            name="sintomas"
                            render={({ field }) => {
                              const isChecked = field.value?.includes(sint) || false;
                              const isDisabled = tieneSintomasSeleccionado !== "si";

                              return (
                                <FormItem>
                                  <FormControl>
                                    <button
                                      type="button"
                                      disabled={isDisabled}
                                      onClick={() => {
                                        if (isDisabled) return;

                                        if (isChecked) {
                                          field.onChange(
                                            field.value?.filter(
                                              (value) => value !== sint
                                            )
                                          );
                                        } else {
                                          field.onChange([...(field.value || []), sint]);
                                        }
                                      }}
                                      className={checkboxCardClass(isChecked, isDisabled)}
                                    >
                                      <span className={checkboxIndicatorClass(isChecked, isDisabled)}>
                                        {isChecked && <CheckCircle2 className="h-3.5 w-3.5" />}
                                      </span>

                                      <span className="text-sm font-medium">
                                        {sint}
                                      </span>
                                    </button>
                                  </FormControl>
                                </FormItem>
                              );
                            }}
                          />
                        ))}

                        <FormField
                          control={form.control}
                          name="sintomas"
                          render={({ field }) => {
                            const isChecked = field.value?.includes("Otros") || false;
                            const isDisabled = tieneSintomasSeleccionado !== "si";

                            return (
                              <FormItem>
                                <FormControl>
                                  <button
                                    type="button"
                                    disabled={isDisabled}
                                    onClick={() => {
                                      if (isDisabled) return;

                                      if (isChecked) {
                                        field.onChange(
                                          field.value?.filter(
                                            (value) => value !== "Otros"
                                          )
                                        );
                                        form.setValue("otroSintoma", "");
                                      } else {
                                        field.onChange([...(field.value || []), "Otros"]);
                                      }
                                    }}
                                    className={checkboxCardClass(isChecked, isDisabled)}
                                  >
                                    <span className={checkboxIndicatorClass(isChecked, isDisabled)}>
                                      {isChecked && <CheckCircle2 className="h-3.5 w-3.5" />}
                                    </span>

                                    <span className="text-sm font-medium">
                                      Otros
                                    </span>
                                  </button>
                                </FormControl>
                              </FormItem>
                            );
                          }}
                        />
                      </div>

                      {sintomasSeleccionados?.includes("Otros") &&
                        tieneSintomasSeleccionado === "si" && (
                          <FormField
                            control={form.control}
                            name="otroSintoma"
                            render={({ field }) => (
                              <FormItem className="mt-3 space-y-1">
                                <FormLabel className={labelClass}>
                                  ¿Cuál otro signo o síntoma?
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Escriba el otro signo o síntoma"
                                    {...field}
                                    className={inputClass}
                                  />
                                </FormControl>
                                <FormMessage className="text-xs" />
                              </FormItem>
                            )}
                          />
                        )}
                    </div>

                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </section>

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
                    Revise y acepte la autorización para finalizar.
                  </p>
                </div>
              </div>

              <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-sm">
                <TermsSections />
              </div>

              <FormField
                control={form.control}
                name="acceptedTerms"
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
                        Acepto los términos y condiciones.
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
                Enviar Tamizaje
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-xl text-blue-700">
              <ClipboardCheck className="h-5 w-5" />
              Resumen del Tamizaje
            </AlertDialogTitle>

            <AlertDialogDescription asChild>
              <div className="max-h-[420px] space-y-3 overflow-y-auto text-sm text-muted-foreground">
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <strong>Participa en actividad física:</strong>{" "}
                  {resumenData?.actividadFisica?.toUpperCase() ||
                    "Sin responder"}
                </div>

                {resumenData?.actividadFisica === "si" &&
                  resumenData?.tipoActividadFisica && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                      <strong>Tipo de actividad física:</strong>{" "}
                      {resumenData.tipoActividadFisica === "deporte_escolar"
                        ? "Deporte escolar"
                        : resumenData.tipoActividadFisica === "deporte_normal"
                          ? "Deporte normal / recreativo"
                          : resumenData.tipoActividadFisica ===
                              "deportista_competencia"
                            ? "Deportista de competencia"
                            : resumenData.tipoActividadFisica ===
                                "deportista_recreativo"
                              ? "Deportista recreativo"
                              : "Normal / solo hacer ejercicio"}
                    </div>
                  )}

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <strong>Enfermedad:</strong>{" "}
                    {resumenData?.tieneEnfermedad?.toUpperCase() ||
                      "Sin responder"}
                  </div>

                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                    <strong>Síntomas:</strong>{" "}
                    {resumenData?.tieneSintomas?.toUpperCase() ||
                      "Sin responder"}
                  </div>
                </div>

                {resumenData?.tieneEnfermedad === "si" &&
                  resumenData?.enfermedades.length > 0 && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                      <strong>Tipos de enfermedad:</strong>
                      <ul className="ml-6 mt-2 list-disc">
                        {resumenData.enfermedades.map((e: string) => (
                          <li key={e}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {resumenData?.tieneSintomas === "si" &&
                  resumenData?.sintomas.length > 0 && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                      <strong>Signos o síntomas:</strong>
                      <ul className="ml-6 mt-2 list-disc">
                        {resumenData.sintomas.map((s: string) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                {resumenData?.resumen && (
                  <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
                    <div className="mb-1 font-semibold text-foreground">
                      🩺 Revisión médica previa:
                    </div>
                    <div>{resumenData.resumen.revision}</div>

                    <div className="mt-3 font-semibold text-foreground">
                      🏃 Intensidad sugerida:
                    </div>
                    <div>{resumenData.resumen.intensidad}</div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowDialog(false);
                localStorage.removeItem("participantData");
                router.push("/register-data");
              }}
            >
              Nuevo Registro
            </AlertDialogAction>

            <AlertDialogCancel
              onClick={() => {
                setShowDialog(false);
                localStorage.removeItem("participantData");
                router.push("/evaluations");
              }}
            >
              Ver evaluaciones
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}