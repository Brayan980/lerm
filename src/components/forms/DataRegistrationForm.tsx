
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TermsSections } from "@/components/terms/TermsSections";
import { useFormData } from "@/contexts/FormDataContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { calculateDecimalAge } from "@/lib/ageCalculator";
import type { InitialRegistrationData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format as formatDateFn } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { query } from "@/lib/db"; // Import the query function

const dataRegistrationSchema = z.object({
  firstName: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  lastName: z.string().min(2, { message: "El apellido debe tener al menos 2 caracteres." }),
  dob: z.date({ required_error: "La fecha de nacimiento es obligatoria." }),
  sex: z.enum(["Femenino", "Masculino", "Otro"], { required_error: "El sexo es obligatorio." }),
  email: z.string().email({ message: "Debe ser un correo electrónico válido." }),
  idNumber: z.string().min(5, { message: "El número de identificación debe tener al menos 5 caracteres." }),
  // acceptedTerms: z.literal(true, {
  //   errorMap: () => ({ message: "Debes aceptar los términos y condiciones." }),
  // }),
  acceptedTerms: z.boolean()
    .refine((val) => val === true, {
      message: "Debes aceptar los términos y condiciones.",
    }),
});

type DataRegistrationFormValues = z.infer<typeof dataRegistrationSchema>;

export default function DataRegistrationForm() {
  const { setInitialData } = useFormData();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

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

  async function onSubmit(values: DataRegistrationFormValues) {
    setIsLoading(true);
    const age = calculateDecimalAge(values.dob);
    const participantId = `participant-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const dobForDb = formatDateFn(values.dob, 'yyyy-MM-dd');

    const participantDataForDb = {
      id: participantId,
      first_name: values.firstName,
      last_name: values.lastName,
      dob: dobForDb, // Formatted for DATE SQL type
      calculated_age: age,
      sex: values.sex,
      email: values.email.toLowerCase(), // Store email in lowercase
      id_number: values.idNumber,
      accepted_terms: values.acceptedTerms,
    };

    try {
      console.log("[DataRegistrationForm] Attempting to insert participant:", participantDataForDb.email);
      await query(
        `INSERT INTO participants (id, first_name, last_name, dob, calculated_age, sex, email, id_number, accepted_terms)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
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
      console.log("[DataRegistrationForm] Participant inserted successfully:", participantDataForDb.email);

      const participantDataForContext: InitialRegistrationData = {
        id: participantId,
        first_name: values.firstName,
        last_name: values.lastName,
        dob: values.dob.toISOString(), // ISO string for context and subsequent forms
        calculated_age: age,
        sex: values.sex,
        email: values.email.toLowerCase(),
        id_number: values.idNumber,
        accepted_terms: values.acceptedTerms,
      };
      setInitialData(participantDataForContext);

      toast({
        title: "Datos registrados en la base de datos",
        description: "Serás redirigido al formulario correspondiente.",
      });

      // Redirection logic based on age
      if (age < 14) {
        router.push("/form/children?regComplete=1");
      } else if (age >= 14 && age < 18) {
        router.push("/form/adolescents?regComplete=1");
      } else if (age >= 18) {
        router.push("/form/ipaq?regComplete=1");
      } else {
        toast({ title: "Información", description: "No hay un formulario específico para esta edad actualmente. Redirigiendo a PAR-Q." });
        router.push("/par-q-form?regComplete=1");
      }

    } catch (error: any) {
      console.error("[DataRegistrationForm] Error saving participant to DB:", error.message, error.stack);
      let friendlyMessage = "No se pudo guardar el registro del participante.";
      let errorTitle = "Error de Registro";

      if (error.message?.includes('duplicate key value violates unique constraint "participants_email_key"')) {
        friendlyMessage = "El correo electrónico ingresado ya está registrado.";
        form.setError("email", { type: "manual", message: friendlyMessage });
      } else if (error.message?.includes('duplicate key value violates unique constraint "participants_id_number_key"')) {
        friendlyMessage = "El número de identificación ingresado ya está registrado.";
        form.setError("idNumber", { type: "manual", message: friendlyMessage });
      } else {
        // For other DB errors, likely connection or configuration issues in production
        errorTitle = "Error de Base de Datos";
        friendlyMessage = "No se pudo registrar al participante. Por favor, verifique los logs del servidor para más detalles sobre problemas de conexión o configuración de la base de datos.";
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombres</FormLabel>
                <FormControl>
                  <Input placeholder="Sus nombres" {...field} />
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
                  <Input placeholder="Sus apellidos" {...field} />
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
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
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
          />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo Electrónico</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="su.correo@ejemplo.com" {...field} />
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
                  <Input placeholder="Su número de identificación" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>


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

        <div className="flex flex-col sm:flex-row gap-4">
          <Button type="submit" className="flex-1" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Enviar y Continuar
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.push('/par-q-form')} disabled={isLoading}>
            Ir a Formulario PAR-Q
          </Button>

          <Button type="button" variant="outline" className="flex-1" onClick={() => router.push('/tamizaje')} disabled={isLoading}>
            Ir a Tamizaje Preparticipativo
          </Button>

        </div>
      </form>
    </Form>
  );
}

