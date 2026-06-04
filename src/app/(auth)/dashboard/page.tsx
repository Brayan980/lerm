"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Database,
  FileText,
  ListChecks,
  ShieldCheck,
  Tags,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";

type DashboardItem = {
  title: string;
  subtitle: string;
  description: string;
  href: string;
  icon: LucideIcon;
  action: string;
};

function DashboardActionCard({
  title,
  subtitle,
  description,
  href,
  icon: Icon,
  action,
}: DashboardItem) {
  return (
    <Link href={href} className="group block h-full">
      <Card className="relative flex h-full min-h-[166px] flex-col overflow-hidden border border-border/80 bg-card shadow-sm transition-all duration-400 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">

        <div className="absolute inset-x-0 top-0 h-1 bg-primary/70" />

        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardDescription className="text-xs font-medium text-muted-foreground">
                {subtitle}
              </CardDescription>

              <CardTitle className="text-xl font-bold tracking-tight">
                {title}
              </CardTitle>
            </div>

            <div className="rounded-xl border border-primary/15 bg-primary/10 p-2.5 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="h-4 w-4" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col justify-between space-y-3 p-4 pt-0">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>

          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-xs font-semibold text-primary">
              {action}
            </span>

            <ArrowRight className="h-4 w-4 text-primary transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

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

  const roleName =
    selectedRole === "Evaluator"
      ? "Evaluador"
      : selectedRole === "Assistant"
      ? "Asistente"
      : selectedRole === "Admin"
      ? "Administrador"
      : selectedRole || "Usuario";

  const dashboardItems: DashboardItem[] = [];

  if (userRole === "Admin" && selectedRole === "Admin") {
    dashboardItems.push({
      title: "Administrar",
      subtitle: "Gestión de Usuarios",
      description: "Crear, editar y eliminar cuentas de usuario dentro del sistema.",
      href: "/admin",
      icon: Users,
      action: "Ir a Administración",
    });
  }

  if (selectedRole === "Evaluator") {
    dashboardItems.push(
      {
        title: "Sujetos Registrados",
        subtitle: "Ver Sujetos Registrados",
        description: "Consulta y gestiona los sujetos registrados en la plataforma.",
        href: "/evaluations",
        icon: ListChecks,
        action: "Ir a Sujetos Registrados",
      },
      {
        title: "Calcular ETM",
        subtitle: "Control técnico",
        description: "Calcula el error técnico de medición de las evaluaciones.",
        href: "/evaluations/etm",
        icon: BarChart3,
        action: "Ir a Calculadora de ETM",
      },
      {
        title: "Ver Evolución",
        subtitle: "Seguimiento",
        description: "Revisa la evolución física y antropométrica de un participante.",
        href: "/evolution",
        icon: Activity,
        action: "Ir a Evolución",
      },
      {
        title: "Gestionar Categorías",
        subtitle: "Clasificación",
        description: "Organiza las evaluaciones en la categoría más adecuada.",
        href: "/categories",
        icon: Tags,
        action: "Ir a Gestión de Categorías",
      },
      {
        title: "Generar Base de Datos",
        subtitle: "Reportes",
        description: "Genera una base de datos con participantes y evaluaciones.",
        href: "/participant-database",
        icon: Database,
        action: "Ir a Base de Datos",
      }
    );
  }

  if (selectedRole === "Assistant") {
    dashboardItems.push(
      {
        title: "Realizar Pruebas",
        subtitle: "Pruebas Pendientes",
        description: "Accede a los participantes que tienen pruebas asignadas.",
        href: "/assistant/pending-tests",
        icon: UserCheck,
        action: "Ir a Pruebas Pendientes",
      },
      {
        title: "Ver Completados",
        subtitle: "Historial de Evaluados",
        description: "Consulta evaluaciones finalizadas y resultados registrados.",
        href: "/reviewed-evaluations",
        icon: FileText,
        action: "Ir a Historial",
      }
    );
  }

  return (
    <div className="-mt-10 grid min-h-[calc(100vh-205px)] grid-rows-[auto_1fr] gap-5 pb-0">
      <Card className="overflow-hidden border border-border/70 bg-gradient-to-br from-primary/10 via-background to-background shadow-md">
        <CardContent className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                Panel Administrativo LERM
              </div>

              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  Bienvenido, {displayName || "Usuario"}
                </h1>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  Accede de forma rápida a las herramientas disponibles según tu perfil dentro del sistema.
                </p>
              </div>
            </div>

            <div className="grid min-w-[260px] gap-2 rounded-2xl border border-border/70 bg-background/80 p-3 shadow-sm backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-muted-foreground">Rol actual</span>
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  {roleName}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-muted-foreground">
                  Accesos disponibles
                </span>
                <span className="text-xs font-bold text-foreground">
                  {dashboardItems.length}
                </span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-muted-foreground">Estado</span>
                <span className="text-xs font-semibold text-primary">
                  Activo
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {dashboardItems.length > 0 ? (
        <div className="grid h-full auto-rows-fr content-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
          {dashboardItems.map((item) => (
            <DashboardActionCard key={item.href} {...item} />
          ))}
        </div>
      ) : (
        <Card className="border border-border/70 shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              No hay acciones específicas disponibles para tu rol en este momento.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}