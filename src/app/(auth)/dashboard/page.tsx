"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { Users, ListChecks, FileText, UserCheck } from "lucide-react";

export default function DashboardPage() {
  const { username, selectedRole, userRole } = useAuth();

  let displayName = username;
  if (username?.toLowerCase() === "evaluador@cecar.edu.co") {
    displayName = "Evaluador";
  } else if (username?.toLowerCase() === "asistente@cecar.edu.co") {
    displayName = "Asistente";
  } else if (username?.toLowerCase() === "admin@cecar.edu.co") {
    displayName = "Administrador";
  }

  return (
    <div className="space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-headline">
            Bienvenido al Dashboard, {displayName || "Usuario"}!
          </CardTitle>
          <CardDescription className="text-lg">
            Tu rol actual es: <span className="font-semibold text-primary">{selectedRole}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Aquí podrás acceder a las funcionalidades correspondientes a tu perfil.</p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userRole === "Admin" && selectedRole === "Admin" && (
          <Link href="/admin" className="block">
            <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gestión de Usuarios</CardTitle>
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Administrar</div>
                <p className="text-xs text-muted-foreground">
                  Crear, editar y eliminar cuentas de usuario.
                </p>
                <span className="inline-block px-0 pt-2 text-primary">Ir a Administración</span>
              </CardContent>
            </Card>
          </Link>
        )}

        {selectedRole === "Evaluator" && (
          <>
            <Link href="/evaluations" className="block">
              <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ver Sujetos Registrados</CardTitle>
                  <ListChecks className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Sujetos Registrados</div>
                  <p className="text-xs text-muted-foreground">
                    Ver y gestionar sujetos registrados.
                  </p>
                  <span className="inline-block px-0 pt-2 text-primary">
                    Ir a Sujetos Registrados
                  </span>
                </CardContent>
              </Card>
            </Link>

            <Link href="/reviewed-evaluations" className="block">
              <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Historial de Evaluados</CardTitle>
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Ver Completados</div>
                  <p className="text-xs text-muted-foreground">
                    Consultar evaluaciones con resultados finales.
                  </p>
                  <span className="inline-block px-0 pt-2 text-primary">Ir a Historial</span>
                </CardContent>
              </Card>
            </Link>

            <Link href="/evaluations/etm" className="block">
              <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Calcular ETM</CardTitle>
                  <ListChecks className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Calcular ETM</div>
                  <p className="text-xs text-muted-foreground">
                    Calcular ETM de evaluaciones de los participantes.
                  </p>
                  <span className="inline-block px-0 pt-2 text-primary">
                    Ir a Calculadora de ETM
                  </span>
                </CardContent>
              </Card>
            </Link>

            <Link href="/evolution" className="block">
              <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ver evolución</CardTitle>
                  <ListChecks className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Ver evolución</div>
                  <p className="text-xs text-muted-foreground">
                    Ver evolución de un participante
                  </p>
                  <span className="inline-block px-0 pt-2 text-primary">
                    Ir a Evolución de un Participante
                  </span>
                </CardContent>
              </Card>
            </Link>

            <Link href="/appointments" className="block">
              <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Citas programadas</CardTitle>
                  <ListChecks className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Ver Citas</div>
                  <p className="text-xs text-muted-foreground">Listar citas programadas</p>
                  <span className="inline-block px-0 pt-2 text-primary">
                    Ir a Registro de Citas
                  </span>
                </CardContent>
              </Card>
            </Link>

            <Link href="/appointments/schedule" className="block">
              <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Programar Citas</CardTitle>
                  <ListChecks className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Registrar Citas</div>
                  <p className="text-xs text-muted-foreground">
                    Registrar citas con participantes.
                  </p>
                  <span className="inline-block px-0 pt-2 text-primary">
                    Ir a Registro de Citas
                  </span>
                </CardContent>
              </Card>
            </Link>

            <Link href="/categories" className="block">
              <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Gestionar Categorias</CardTitle>
                  <ListChecks className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Gestionar Categorias</div>
                  <p className="text-xs text-muted-foreground">
                    Categoriza tus evaluaciones en la categoria más adecuada
                  </p>
                  <span className="inline-block px-0 pt-2 text-primary">
                    Ir a Gestion de Categorias
                  </span>
                </CardContent>
              </Card>
            </Link>

            <Link href="/participant-database" className="block">
              <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Generar Base de Datos</CardTitle>
                  <ListChecks className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Generar Base de Datos</div>
                  <p className="text-xs text-muted-foreground">Generar Base de Datos</p>
                  <span className="inline-block px-0 pt-2 text-primary">
                    Ir a Base de Datos
                  </span>
                </CardContent>
              </Card>
            </Link>
          </>
        )}

        {selectedRole === "Assistant" && (
          <>
            <Link href="/assistant/pending-tests" className="block">
              <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pruebas Pendientes</CardTitle>
                  <UserCheck className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Realizar Pruebas</div>
                  <p className="text-xs text-muted-foreground">
                    Acceder a la lista de participantes con pruebas asignadas.
                  </p>
                  <span className="inline-block px-0 pt-2 text-primary">
                    Ir a Pruebas Pendientes
                  </span>
                </CardContent>
              </Card>
            </Link>

            <Link href="/reviewed-evaluations" className="block">
              <Card className="shadow-lg hover:shadow-xl transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Historial de Evaluados</CardTitle>
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Ver Completados</div>
                  <p className="text-xs text-muted-foreground">
                    Consultar evaluaciones con resultados finales.
                  </p>
                  <span className="inline-block px-0 pt-2 text-primary">Ir a Historial</span>
                </CardContent>
              </Card>
            </Link>
          </>
        )}
      </div>

      {(!userRole || (userRole !== "Admin" && selectedRole !== "Evaluator" && selectedRole !== "Assistant")) && (
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              No hay acciones específicas disponibles para tu rol en este momento.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}