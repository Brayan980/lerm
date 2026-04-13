
"use server"; // Marcar como Server Component para usar async/await directamente

import AuthWrapper from "@/components/auth/AuthWrapper";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getDbTime } from "@/lib/db"; // Importar la función de prueba

async function DatabaseTestPage() {
  let dbTime: string | null = null;
  let dbError: string | null = null;

  try {
    const time = await getDbTime();
    dbTime = new Date(time).toLocaleString();
  } catch (error) {
    dbError = error instanceof Error ? error.message : "Error desconocido al conectar con la BD.";
  }

  return (
    <AuthWrapper allowedRoles={["Admin"]}>
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-headline text-primary">Prueba de Conexión a Neon</CardTitle>
            <CardDescription>
              Esta página intenta conectarse a tu base de datos Neon y mostrar la hora actual del servidor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dbTime && (
              <p className="text-lg text-green-600">
                Conexión exitosa. Hora de la BD: <strong>{dbTime}</strong>
              </p>
            )}
            {dbError && (
              <p className="text-lg text-destructive">
                Error de conexión: <strong>{dbError}</strong>
              </p>
            )}
            {!dbTime && !dbError && (
              <p className="text-muted-foreground">Intentando conectar...</p>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              La conexión a la base de datos Neon ha sido probada.
            </p>
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  );
}

export default DatabaseTestPage;
