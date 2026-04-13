import DataRegistrationForm from "@/components/forms/DataRegistrationForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DataRegistrationPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary">Registro de Datos Iniciales</CardTitle>
          <CardDescription>
            Por favor, complete la siguiente información. Todos los campos son obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataRegistrationForm />
        </CardContent>
      </Card>
    </div>
  );
}
