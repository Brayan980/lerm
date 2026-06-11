"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";

const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .email({ message: "Debe ser un correo electrónico válido." }),
  password: z
    .string()
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, userList, isLoading: authContextIsLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setIsSubmitting(true);

    try {
      const normalizedUsername = values.username.trim().toLowerCase();

      const user = userList.find(
        (u) => u.username.toLowerCase() === normalizedUsername
      );

      if (user && user.password === values.password) {
        login(user.username, user.role);

        toast({
          title: "Inicio de sesión exitoso",
          description: `Bienvenido ${user.username}`,
        });

        router.push("/dashboard");
        return;
      }

      toast({
        title: "Error de inicio de sesión",
        description: "Usuario o contraseña incorrectos.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Login error:", error);

      toast({
        title: "Error inesperado",
        description: "Ocurrió un error durante el inicio de sesión.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const isButtonDisabled =
    isSubmitting || authContextIsLoading || userList.length === 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 md:space-y-5">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem className="space-y-1.5 md:space-y-2">
              <FormLabel className="text-[13px] font-bold text-[#183B22] md:text-sm">
                Usuario (Correo Electrónico)
              </FormLabel>

              <FormControl>
                <Input
                  type="email"
                  placeholder="ejemplo@cecar.edu.co"
                  autoComplete="username"
                  className="h-10 rounded-xl border-0 bg-[#EAF1FF] text-[15px] text-[#1F2937] shadow-sm placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#58A900]/60 md:h-12"
                  {...field}
                />
              </FormControl>

              <FormMessage className="text-xs font-medium" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="space-y-1.5 md:space-y-2">
              <FormLabel className="text-[13px] font-bold text-[#183B22] md:text-sm">
                Contraseña
              </FormLabel>

              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    autoComplete="current-password"
                    className="h-10 rounded-xl border-0 bg-[#EAF1FF] pr-12 text-[15px] text-[#1F2937] shadow-sm placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-[#58A900]/60 md:h-12"
                    {...field}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 h-8 -translate-y-1/2 rounded-lg px-3 text-[#0F6B35] hover:bg-[#58A900]/10 hover:text-[#0B552A] md:h-9"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </FormControl>

              <FormMessage className="text-xs font-medium" />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="show-password-login-form"
            checked={showPassword}
            onCheckedChange={(checked) => setShowPassword(Boolean(checked))}
            className="h-4 w-4 border-[#58A900] data-[state=checked]:border-[#0F6B35] data-[state=checked]:bg-[#0F6B35]"
          />

          <label
            htmlFor="show-password-login-form"
            className="text-[13px] font-bold leading-none text-[#183B22] peer-disabled:cursor-not-allowed peer-disabled:opacity-70 md:text-sm"
          >
            Mostrar contraseña
          </label>
        </div>

        {userList.length === 0 && (
          <div className="hidden items-center gap-2 rounded-xl bg-[#F4F7F3] px-3 py-2 text-xs font-semibold text-[#0F6B35] ring-1 ring-[#58A900]/20 md:flex">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            Cargando usuarios autorizados.
          </div>
        )}

        <Button
          type="submit"
          className="h-10 w-full rounded-xl bg-[#0F6B35] font-bold text-white shadow-lg transition-all duration-300 hover:bg-[#0B552A] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 md:h-12"
          disabled={isButtonDisabled}
        >
          {(isSubmitting || authContextIsLoading) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}

          {isSubmitting || authContextIsLoading
            ? "Validando acceso..."
            : "Iniciar Sesión"}
        </Button>
      </form>
    </Form>
  );
}