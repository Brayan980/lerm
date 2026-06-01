//TamizajePreparticipativo
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
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
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { TermsSections } from "@/components/terms/TermsSections";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format, format as formatDateFn } from "date-fns";
import { es } from "date-fns/locale";
import { calculateDecimalAge } from "@/lib/ageCalculator";
import { query } from "@/lib/db";
import { useFormData } from "@/contexts/FormDataContext";
import { useEvaluationContext } from "@/contexts/EvaluationContext";

const tamizajeSchema = z.object({
  firstName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  lastName: z.string().min(2, { message: "El apellido debe tener al menos 2 caracteres." }),
  dob: z.date({ required_error: "La fecha de nacimiento es obligatoria." }),
  sex: z.enum(["Femenino", "Masculino", "Otro"], { required_error: "El sexo es obligatorio." }),
  email: z.string().email({ message: "Debe ser un correo electrónico válido." }),
  idNumber: z.string().min(5, { message: "El número de identificación debe tener al menos 5 caracteres." }),

  actividadFisica: z.enum(["si", "no"], {
    required_error: "Debe responder si participa en actividad física.",
  }),

  tipoActividadFisica: z.string().optional(),

  tieneEnfermedad: z.enum(["si", "no"], { required_error: "Debe responder si tiene enfermedades." }),
  tieneSintomas: z.enum(["si", "no"], { required_error: "Debe responder si tiene síntomas." }),
  enfermedades: z.array(z.string()).default([]),
  sintomas: z.array(z.string()).default([]),
  acceptedTerms: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar los términos y condiciones.",
  }),
}).superRefine((data, ctx) => {
  if (data.actividadFisica === "si" && !data.tipoActividadFisica) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["tipoActividadFisica"],
      message: "Debe seleccionar el tipo de actividad física.",
    });
  }
});

type TamizajeFormValues = z.infer<typeof tamizajeSchema>;

export default function TamizajePreparticipativo() {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resumenData, setResumenData] = useState<any>(null);
  const { toast } = useToast();
  const { addEvaluationRecord } = useEvaluationContext();
  const { initialData } = useFormData();
  const [loadedParticipantId, setLoadedParticipantId] = useState("");

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
      sintomas: [],
      acceptedTerms: false,
    },
  });

  const actividadFisicaSeleccionada = form.watch("actividadFisica");
  const fechaNacimientoSeleccionada = form.watch("dob");

  const edadCalculada = fechaNacimientoSeleccionada
    ? calculateDecimalAge(fechaNacimientoSeleccionada)
    : 0;

  const esMenorDe14 = edadCalculada < 14;

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
        console.error("[TamizajePreparticipativo] Error cargando participante desde DB:", error);
      }
    }

    const participantId = dbData.id || baseData.id || "";
    const firstName = dbData.first_name || baseData.first_name || baseData.firstName || baseData.nombres || "";
    const lastName = dbData.last_name || baseData.last_name || baseData.lastName || baseData.apellidos || "";
    const dobValue = dbData.dob || baseData.dob || baseData.fechaNacimiento || baseData.birthDate;
    const email = dbData.email || baseData.email || baseData.correo || baseData.correoElectronico || "";
    const finalIdNumber = dbData.id_number || baseData.id_number || baseData.idNumber || baseData.numeroIdentificacion || baseData.identificacion || baseData.documento || "";

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
      acceptedTerms: Boolean(dbData.accepted_terms ?? baseData.accepted_terms ?? false),
    });

    if (sexoNormalizado) {
      form.setValue("sex", sexoNormalizado, {
        shouldValidate: true,
        shouldDirty: false,
        shouldTouch: false,
      });
    }

    console.log("Tamizaje baseData:", baseData);
    console.log("Tamizaje dbData:", dbData);
    console.log("Sexo normalizado:", sexoNormalizado);
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

  const calcularResumen = (actividadFisica: string, tieneEnfermedad: string, tieneSintomas: string) => {
    if (actividadFisica === "si" && tieneEnfermedad === "no" && tieneSintomas === "no") {
      return {
        revision: "No necesita revisión médica previa",
        intensidad: "Puede realizar actividad moderada a vigorosa",
      };
    } else if (actividadFisica === "si" && tieneEnfermedad === "si" && tieneSintomas === "no") {
      return {
        revision: "No necesita revisión médica para intensidad moderada. Sí requiere para intensidad vigorosa",
        intensidad: "Se recomienda iniciar con intensidad moderada",
      };
    } else if (actividadFisica === "si" && tieneEnfermedad === "si" && tieneSintomas === "si") {
      return {
        revision: "Debe detener el ejercicio y realizar revisión médica previa",
        intensidad: "Puede retomar el ejercicio después de la revisión médica según su estado de salud",
      };
    } else if (actividadFisica === "no" && tieneEnfermedad === "no" && tieneSintomas === "si") {
      return {
        revision: "Se requiere revision medica",
        intensidad: "Puede retomar el ejercicio después de la revisión médica según su estado de salud",
      };
    }
    else if (actividadFisica === "no" && tieneEnfermedad === "no" && tieneSintomas === "no") {
      return {
        revision: "Se recomienda revisión médica previa antes de iniciar",
        intensidad: "Se recomienda iniciar con actividad de intensidad leve a moderada",
      };
    } else if (actividadFisica === "no" && tieneEnfermedad === "si" && tieneSintomas === "no") {
      return {
        revision: "Debe realizar revisión médica previa",
        intensidad: "Puede iniciar con intensidad leve a moderada después de revisión",
      };
    } else if (actividadFisica === "no" && tieneEnfermedad === "si" && tieneSintomas === "si") {
      return {
        revision: "Debe realizar revisión médica antes de iniciar",
        intensidad: "Solo podrá retomar actividad leve después de revisión médica",
      };
    } else {
      return {
        revision: "Verifique las respuestas.",
        intensidad: "Verifique las respuestas.",
      };
    }
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

    const tamizajeResponses = {
      participant: participantDataForDb,
      actividadFisica: values.actividadFisica,
      tipoActividadFisica: values.tipoActividadFisica || "",
      edadCalculada: age,
      tieneEnfermedad: values.tieneEnfermedad,
      enfermedades: values.enfermedades,
      tieneSintomas: values.tieneSintomas,
      sintomas: values.sintomas,
      revision: resumen.revision,
      intensidad: resumen.intensidad,
    };

    const submissionDate = new Date().toISOString();
    const status = "Nueva";

    await query(
      `INSERT INTO evaluation_records (
        id,
        participant_id,
        form_type,
        submission_date,
        status,
        accepted_terms,
        form_data,
        tamizaje_classification
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
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

    console.log(
      "[TamizajePreparticipativo] Evaluation record inserted successfully"
    );

    setResumenData({
      ...values,
      resumen,
    });

    toast({
      title: "Datos registrados exitosamente",
      description: "El tamizaje se ha completado correctamente.",
    });

    // Limpia los datos del sujeto anterior
    localStorage.removeItem("participantData");

    // Regresa al registro de nuevo sujeto
    router.replace("/register-data");

  } catch (error: any) {
    console.error(
      "[TamizajePreparticipativo] Error saving tamizaje to DB:",
      error.message,
      error.stack
    );

    toast({
      title: "Error de Base de Datos",
      description:
        "No se pudo guardar el tamizaje. Por favor, verifique los logs del servidor.",
      variant: "destructive",
      duration: 10000,
    });
  } finally {
    setIsLoading(false);
  }
}

  return (
    <Card className="max-w-2xl mx-auto shadow-md">
      <CardHeader>
        <CardTitle className="text-xl text-primary">
          Formulario de Tamizaje Preparticipativo
        </CardTitle>
        <CardDescription>
          Complete las siguientes secciones antes de realizar actividad física.
        </CardDescription>
      </CardHeader>

      <CardContent>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Datos personales */}
            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombres</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Sus nombres"
                        {...field}
                        readOnly
                        className="bg-muted cursor-not-allowed"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellidos</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Sus apellidos"
                        {...field}
                        readOnly
                        className="bg-muted cursor-not-allowed"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">

              <FormField
              control={form.control}
              name="dob"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Nacimiento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant={"outline"}
                          disabled
                          className={cn(
                            "w-full pl-3 text-left font-normal bg-muted cursor-not-allowed",
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
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                        captionLayout="dropdown-buttons"
                        fromYear={1900}
                        toYear={new Date().getFullYear()}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Su edad se calculará automáticamente.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />


              <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sexo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                      disabled
                    >
                      <FormControl>
                        <SelectTrigger className="bg-muted cursor-not-allowed">
                          <SelectValue placeholder="Seleccione el sexo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Femenino">Femenino</SelectItem>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* <FormField
                control={form.control}
                name="sex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sexo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione el sexo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Femenino">Femenino</SelectItem>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input
                      type="email"
                      placeholder="su.correo@ejemplo.com"
                      {...field}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="idNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Identificación</FormLabel>
                    <FormControl>
                      <Input
                      placeholder="Su número de identificación"
                      {...field}
                      readOnly
                      className="bg-muted cursor-not-allowed"
                    />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>




            {/* 1. Participación */}
            <FormField
              control={form.control}
              name="actividadFisica"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-semibold">
                    1. Participación en actividad física
                  </FormLabel>
                  <FormDescription>
                    ¿Participa actualmente en un programa de actividad física (últimos 3 meses, al menos 3 veces por semana, 30 min por día)?
                  </FormDescription>
                  <FormControl>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="si"
                          checked={field.value === "si"}
                          onChange={() => field.onChange("si")}
                          className="w-4 h-4"
                        />
                        <span>Sí</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          value="no"
                          checked={field.value === "no"}
                          onChange={() => {
                            field.onChange("no");
                            form.setValue("tipoActividadFisica", "");
                          }}
                          className="w-4 h-4"
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {actividadFisicaSeleccionada === "si" && (
              <FormField
                control={form.control}
                name="tipoActividadFisica"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">
                      Tipo de participación en actividad física
                    </FormLabel>

                    <FormDescription>
                      Según la edad calculada del participante, seleccione el tipo de actividad que realiza.
                    </FormDescription>

                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione una opción" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        {esMenorDe14 ? (
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

                    <FormDescription>
                      Edad calculada: {edadCalculada.toFixed(1)} años
                    </FormDescription>

                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* 2. Enfermedades */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="tieneEnfermedad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">
                      2. Enfermedades cardiovasculares, metabólicas o renales
                    </FormLabel>
                    <FormDescription>
                      ¿Tiene o ha tenido alguna enfermedad cardiovascular, metabólica o renal?
                    </FormDescription>
                    <FormControl>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="si"
                            checked={field.value === "si"}
                            onChange={() => field.onChange("si")}
                            className="w-4 h-4"
                          />
                          <span>Sí</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="no"
                            checked={field.value === "no"}
                            onChange={() => {
                              field.onChange("no");
                              form.setValue("enfermedades", []);
                            }}
                            className="w-4 h-4"
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enfermedades"
                render={() => (
                  <FormItem>
                    <div className="p-3 border rounded-md bg-muted/20 space-y-2">
                      <FormLabel className="font-semibold text-primary">
                        Seleccione las enfermedades:
                      </FormLabel>
                      {enfermedadesLista.map((enf) => (
                        <FormField
                          key={enf}
                          control={form.control}
                          name="enfermedades"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(enf)}
                                  disabled={form.watch("tieneEnfermedad") === "no"}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, enf])
                                      : field.onChange(field.value?.filter((value) => value !== enf));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {enf}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 3. Signos o síntomas */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="tieneSintomas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">
                      3. Signos o síntomas
                    </FormLabel>
                    <FormDescription>
                      ¿Presenta signos o síntomas de enfermedad cardiovascular, metabólica o renal?
                    </FormDescription>
                    <FormControl>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="si"
                            checked={field.value === "si"}
                            onChange={() => field.onChange("si")}
                            className="w-4 h-4"
                          />
                          <span>Sí</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            value="no"
                            checked={field.value === "no"}
                            onChange={() => {
                              field.onChange("no");
                              form.setValue("sintomas", []);
                            }}
                            className="w-4 h-4"
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sintomas"
                render={() => (
                  <FormItem>
                    <div className="p-3 border rounded-md bg-muted/20 space-y-2">
                      <FormLabel className="font-semibold text-primary">
                        Seleccione los signos o síntomas:
                      </FormLabel>
                      {sintomasLista.map((sint) => (
                        <FormField
                          key={sint}
                          control={form.control}
                          name="sintomas"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(sint)}
                                  disabled={form.watch("tieneSintomas") === "no"}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, sint])
                                      : field.onChange(field.value?.filter((value) => value !== sint));
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {sint}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Términos y condiciones */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Términos y Condiciones</h3>
              <TermsSections />
              <FormField
                control={form.control}
                name="acceptedTerms"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Acepto los términos y condiciones.
                      </FormLabel>
                      <FormDescription>
                        Debe aceptar los términos para continuar.
                      </FormDescription>
                      <FormMessage className="!mt-2" />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Enviar
            </Button>
          </form>
        </Form>
      </CardContent>

      {/* Ventana de resumen */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resumen del Tamizaje</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>
                  <strong>Participa en actividad física:</strong> {resumenData?.actividadFisica?.toUpperCase() || "Sin responder"}
                </div>
                {resumenData?.actividadFisica === "si" && resumenData?.tipoActividadFisica && (
                  <div>
                    <strong>Tipo de actividad física:</strong>{" "}
                    {resumenData.tipoActividadFisica === "deporte_escolar"
                      ? "Deporte escolar"
                      : resumenData.tipoActividadFisica === "deporte_normal"
                      ? "Deporte normal / recreativo"
                      : resumenData.tipoActividadFisica === "deportista_competencia"
                      ? "Deportista de competencia"
                      : resumenData.tipoActividadFisica === "deportista_recreativo"
                      ? "Deportista recreativo"
                      : "Normal / solo hacer ejercicio"}
                  </div>
                )}
                <div>
                  <strong>Enfermedad:</strong> {resumenData?.tieneEnfermedad?.toUpperCase() || "Sin responder"}
                </div>
                <div>
                  <strong>Síntomas:</strong> {resumenData?.tieneSintomas?.toUpperCase() || "Sin responder"}
                </div>

                {resumenData?.tieneEnfermedad === "si" && resumenData?.enfermedades.length > 0 && (
                  <div>
                    <strong>Tipos de enfermedad:</strong>
                    <ul className="list-disc ml-6">
                      {resumenData.enfermedades.map((e: string) => (
                        <li key={e}>{e}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {resumenData?.tieneSintomas === "si" && resumenData?.sintomas.length > 0 && (
                  <div>
                    <strong>Signos o síntomas:</strong>
                    <ul className="list-disc ml-6">
                      {resumenData.sintomas.map((s: string) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {resumenData?.resumen && (
                  <div className="mt-4 p-3 rounded-md border bg-muted/30">
                    <div className="font-semibold text-foreground mb-1">
                      🩺 Revisión médica previa:
                    </div>
                    <div>{resumenData.resumen.revision}</div>
                    <div className="font-semibold text-foreground mt-2">
                      🏃 Intensidad sugerida:
                    </div>
                    <div>{resumenData.resumen.intensidad}</div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowDialog(false)}>Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}