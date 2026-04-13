
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
import { Eye, EyeOff, Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().email({ message: "Debe ser un correo electrónico válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
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
      const normalizedUsername = values.username.toLowerCase();
      const user = userList.find(u => u.username.toLowerCase() === normalizedUsername);

      if (user && user.password === values.password) {
        // login function in AuthContext is currently synchronous
        // If it were async, we would await it: await login(user.username, user.role);
        login(user.username, user.role);
        
        router.push("/dashboard");
        toast({ title: "Inicio de sesión exitoso", description: `Bienvenido ${user.username}` });
      } else {
        toast({
          title: "Error de inicio de sesión",
          description: "Usuario o contraseña incorrectos.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Error Inesperado",
        description: "Ocurrió un error durante el inicio de sesión.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const isButtonDisabled = isSubmitting || authContextIsLoading || userList.length === 0;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Usuario (Correo Electrónico)</FormLabel>
              <FormControl>
                <Input placeholder="ejemplo@cecar.edu.co" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contraseña</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="********" {...field} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center space-x-2">
           <Checkbox id="show-password-login-form" checked={showPassword} onCheckedChange={(checked) => setShowPassword(Boolean(checked))} />
           <label htmlFor="show-password-login-form" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Mostrar contraseña
          </label>
        </div>
        <Button type="submit" className="w-full" disabled={isButtonDisabled}>
          {(isSubmitting || authContextIsLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Iniciar Sesión
        </Button>
      </form>
    </Form>
  );
}
