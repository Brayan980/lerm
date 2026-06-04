// nuevo registro
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format as formatDateFn } from "date-fns";
import { es } from "date-fns/locale";
import {
  BadgeCheck,
  CalendarIcon,
  CheckCircle2,
  IdCard,
  Loader2,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { TermsSections } from "@/components/terms/TermsSections";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFormData } from "@/contexts/FormDataContext";
import { useToast } from "@/hooks/use-toast";
import { calculateDecimalAge } from "@/lib/ageCalculator";
import { query } from "@/lib/db";
import type { InitialRegistrationData } from "@/lib/types";
import { cn } from "@/lib/utils";

const dataRegistrationSchema = z.object({
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
  acceptedTerms: z.boolean().refine((val) => val === true, {
    message: "Debes aceptar los términos y condiciones.",
  }),
});

type DataRegistrationFormValues = z.infer<typeof dataRegistrationSchema>;

export default function DataRegistrationForm() {
  const { setInitialData } = useFormData();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    const formElement = formRef.current;
    if (!formElement) return;

    const main = formElement.closest("main") as HTMLElement | null;

    if (main) {
      main.style.paddingTop = "0px";
    }

    let node = formElement.parentElement as HTMLElement | null;
    let pageCard: HTMLElement | null = null;

    while (node && node.tagName !== "BODY") {
      const className = typeof node.className === "string" ? node.className : "";

      if (
        node.textContent?.includes("Registro de Datos Iniciales") &&
        className.includes("rounded")
      ) {
        pageCard = node;
      }

      node = node.parentElement;
    }

    if (pageCard) {
      pageCard.style.marginTop = "-72px";
      pageCard.style.borderRadius = "26px";
      pageCard.style.boxShadow = "0 24px 60px rgba(15, 23, 42, 0.08)";
    }
  }, []);

  // Botón "Volver" del layout lateral:
  // como ese botón está fuera de este formulario, se intercepta su click aquí
  // para enviarlo directo a /evaluations.
  useEffect(() => {
    const handleVolver = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      router.push("/evaluations");
    };

    const asignarVolver = () => {
      const elementos = Array.from(
        document.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>("button, a")
      );

      const botonesVolver = elementos.filter((elemento) => {
        const texto = elemento.textContent?.trim().toLowerCase() || "";
        return texto.includes("volver");
      });

      botonesVolver.forEach((boton) => {
        boton.addEventListener("click", handleVolver, true);
      });

      return botonesVolver;
    };

    const botonesVolver = asignarVolver();

    return () => {
      botonesVolver.forEach((boton) => {
        boton.removeEventListener("click", handleVolver, true);
      });
    };
  }, [router]);

  const form = useForm<DataRegistrationFormValues>({
    resolver: zodResolver(dataRegistrationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dob: undefined,
      sex: undefined,
      email: "",
      idNumber: "",
      acceptedTerms: false,
    },
  });

  async function onSubmit(
    values: DataRegistrationFormValues,
    nextForm: "AUTO" | "PARQ" | "TAMIZAJE" = "AUTO"
  ) {
    setIsLoading(true);

    const idNumberNormalized = values.idNumber.trim();
    const emailNormalized = values.email.trim().toLowerCase();

    try {
      const existingEvaluationByIdNumber = await query(
        `
        SELECT er.id
        FROM participants p
        JOIN evaluation_records er ON er.participant_id = p.id
        WHERE p.id_number = $1
        LIMIT 1
        `,
        [idNumberNormalized]
      );

      if (existingEvaluationByIdNumber.rows.length > 0) {
        form.setError("idNumber", {
          type: "manual",
          message: "Este número de identificación ya tiene un formulario registrado.",
        });

        toast({
          title: "Ya está registrado",
          description: "La cédula ingresada ya tiene un formulario guardado en el sistema.",
          variant: "destructive",
          duration: 10000,
        });

        return;
      }

      const existingEvaluationByEmail = await query(
        `
        SELECT er.id
        FROM participants p
        JOIN evaluation_records er ON er.participant_id = p.id
        WHERE p.email = $1
        LIMIT 1
        `,
        [emailNormalized]
      );

      if (existingEvaluationByEmail.rows.length > 0) {
        form.setError("email", {
          type: "manual",
          message: "Este correo electrónico ya tiene un formulario registrado.",
        });

        toast({
          title: "Ya está registrado",
          description:
            "El correo electrónico ingresado ya tiene un formulario guardado en el sistema.",
          variant: "destructive",
          duration: 10000,
        });

        return;
      }

      await query(
        `
        DELETE FROM participants p
        WHERE (p.id_number = $1 OR p.email = $2)
        AND NOT EXISTS (
          SELECT 1
          FROM evaluation_records er
          WHERE er.participant_id = p.id
        )
        `,
        [idNumberNormalized, emailNormalized]
      );

      const age = calculateDecimalAge(values.dob);
      const participantId = `participant-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 7)}`;

      const dobForDb = formatDateFn(values.dob, "yyyy-MM-dd");

      const participantDataForDb = {
        id: participantId,
        first_name: values.firstName.trim(),
        last_name: values.lastName.trim(),
        dob: dobForDb,
        calculated_age: age,
        sex: values.sex,
        email: emailNormalized,
        id_number: idNumberNormalized,
        accepted_terms: values.acceptedTerms,
      };

      await query(
        `
        INSERT INTO participants 
        (id, first_name, last_name, dob, calculated_age, sex, email, id_number, accepted_terms)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          participantDataForDb.id,
          participantDataForDb.first_name,
          participantDataForDb.last_name,
          participantDataForDb.dob,
          participantDataForDb.calculated_age,
          participantDataForDb.sex,
          participantDataForDb.email,
          participantDataForDb.id_number,
          participantDataForDb.accepted_terms,
        ]
      );

      const participantDataForContext: InitialRegistrationData = {
        id: participantId,
        first_name: values.firstName.trim(),
        last_name: values.lastName.trim(),
        dob: values.dob.toISOString(),
        calculated_age: age,
        sex: values.sex as "Femenino" | "Masculino" | "Otro",
        email: emailNormalized,
        id_number: idNumberNormalized,
        accepted_terms: values.acceptedTerms,
      };

      localStorage.setItem("participantData", JSON.stringify(participantDataForContext));

      setInitialData(participantDataForContext);

      toast({
        title: "Datos registrados correctamente",
        description: "Serás redirigido al formulario correspondiente.",
      });

      if (nextForm === "PARQ") {
        router.push("/par-q-form?regComplete=1");
        return;
      }

      if (nextForm === "TAMIZAJE") {
        router.push("/tamizaje?regComplete=1");
        return;
      }

      if (age < 12) {
        router.push("/form/children?regComplete=1");
      } else if (age >= 12 && age < 18) {
        router.push("/form/adolescents?regComplete=1");
      } else if (age >= 18) {
        router.push("/form/ipaq?regComplete=1");
      } else {
        router.push("/par-q-form?regComplete=1");
      }
    } catch (error: any) {
      console.error(
        "[DataRegistrationForm] Error saving participant to DB:",
        error.message,
        error.stack
      );

      let friendlyMessage = "No se pudo guardar el registro del participante.";
      let errorTitle = "Error de Registro";

      if (
        error.message?.includes(
          'duplicate key value violates unique constraint "participants_email_key"'
        )
      ) {
        friendlyMessage = "El correo electrónico ingresado ya está registrado.";
        form.setError("email", { type: "manual", message: friendlyMessage });
      } else if (
        error.message?.includes(
          'duplicate key value violates unique constraint "participants_id_number_key"'
        )
      ) {
        friendlyMessage = "El número de identificación ingresado ya está registrado.";
        form.setError("idNumber", { type: "manual", message: friendlyMessage });
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
    } finally {
      setIsLoading(false);
    }
  }

  const sectionClass =
    "rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm shadow-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/80";

  const inputClass =
    "h-11 rounded-2xl border-slate-200 bg-white text-slate-800 shadow-sm transition-all placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-blue-100";

  const labelClass = "text-sm font-bold text-slate-700";

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={form.handleSubmit((values) => onSubmit(values, "AUTO"))}
        className="space-y-5"
      >
        <div className="mb-1 rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-50 via-white to-slate-50 px-6 py-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                  Nuevo registro de participante
                </h2>
                <p className="text-sm text-slate-500">
                  Complete los datos requeridos para iniciar la evaluación.
                </p>
              </div>
            </div>

            <div className="rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-blue-600 shadow-sm">
              Formulario inicial
            </div>
          </div>
        </div>

        <div className={sectionClass}>
          <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
              <UserRound className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Información personal
              </h3>
              <p className="text-sm text-slate-500">
                Datos básicos para identificar al participante.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className={labelClass}>Nombres</FormLabel>
                  <FormControl>
                    <Input className={inputClass} placeholder="Sus nombres" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className={labelClass}>Apellidos</FormLabel>
                  <FormControl>
                    <Input className={inputClass} placeholder="Sus apellidos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="dob"
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-1.5">
                  <FormLabel className={labelClass}>Fecha de Nacimiento</FormLabel>

                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            inputClass,
                            "w-full justify-start px-3 text-left font-medium hover:bg-white",
                            !field.value && "text-slate-400"
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

                    <PopoverContent className="w-auto rounded-2xl p-0 shadow-2xl" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                        initialFocus
                        captionLayout="dropdown-buttons"
                        fromYear={1900}
                        toYear={new Date().getFullYear()}
                      />
                    </PopoverContent>
                  </Popover>

                  <FormDescription className="text-xs text-slate-500">
                    La edad se calculará automáticamente.
                  </FormDescription>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sex"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className={labelClass}>Sexo</FormLabel>

                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className={inputClass}>
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
          </div>
        </div>

        <div className={sectionClass}>
          <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <Mail className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Contacto e identificación
              </h3>
              <p className="text-sm text-slate-500">
                Información necesaria para guardar y consultar el registro.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1.5">
                  <FormLabel className={labelClass}>Correo Electrónico</FormLabel>
                  <FormControl>
                    <Input
                      className={inputClass}
                      type="email"
                      placeholder="su.correo@ejemplo.com"
                      {...field}
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
                <FormItem className="space-y-1.5">
                  <FormLabel className={labelClass}>Número de Identificación</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        className={cn(inputClass, "pl-10")}
                        placeholder="Su número de identificación"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className={sectionClass}>
          <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-50 text-pink-600 ring-1 ring-pink-100">
              <BadgeCheck className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Términos y condiciones
              </h3>
              <p className="text-sm text-slate-500">
                Revise y acepte la autorización para continuar.
              </p>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-inner">
            <TermsSections />
          </div>

          <FormField
            control={form.control}
            name="acceptedTerms"
            render={({ field }) => (
              <FormItem className="mt-4 flex flex-row items-start gap-3 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50 to-white p-4 shadow-sm">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-0.5 border-blue-300 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white"
                  />
                </FormControl>

                <div className="space-y-1 leading-none">
                  <FormLabel className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    Acepto los términos y condiciones.
                  </FormLabel>

                  <FormDescription className="text-xs text-slate-500">
                    Debe aceptar los términos para poder enviar el formulario.
                  </FormDescription>

                  <FormMessage className="!mt-2" />
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="sticky bottom-0 z-10 rounded-3xl border border-slate-200 bg-white/95 p-4 shadow-2xl shadow-slate-300/50 backdrop-blur">
          <Button
            type="submit"
            className="h-12 w-full rounded-2xl bg-blue-600 text-base font-extrabold tracking-tight text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl disabled:hover:translate-y-0"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Enviar y continuar
          </Button>
        </div>
      </form>
    </Form>
  );
}
