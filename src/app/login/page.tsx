
import LoginForm from "@/components/auth/LoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
// Removed Image import as it's no longer used

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary/20 via-background to-background p-4">
      <Card className="w-full max-w-md shadow-2xl">
         <CardHeader className="text-center pt-6 pb-4"> {/* Adjusted padding slightly after image removal */}
            {/* Image component removed from here */}
          <CardTitle className="text-3xl font-headline text-primary">
            LERM
          </CardTitle>
          <CardDescription className="text-md text-muted-foreground">
            Laboratorio de Evaluación del Rendimiento Morfofuncional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}

