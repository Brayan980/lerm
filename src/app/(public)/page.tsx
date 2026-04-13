
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-14rem)] py-8 px-4"> {/* Adjusted min-height and padding */}
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          {/* Imagen eliminada */}
          <CardTitle className="text-3xl font-headline text-primary">
            LERM
          </CardTitle>
          <CardDescription className="text-md text-muted-foreground"> {/* text-lg to text-md */}
            Laboratorio de Evaluación del Rendimiento Morfofuncional
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-4">
          <div>
            <h2 className="text-xl font-semibold text-center mb-4 text-foreground">
              Acceso Personal
            </h2>
            <LoginForm />
          </div>
          
          <div className="relative my-4"> {/* Reduced margin for separator */}
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground"> {/* Changed bg-background to bg-card */}
                O
              </span>
            </div>
          </div>

          <Button asChild size="lg" className="w-full group">
            <Link href="/register-data">
              Iniciar Registro de Datos
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
