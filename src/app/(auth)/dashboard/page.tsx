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
      <Card className="relative flex h-full min-h-[140px] flex-col overflow-hidden rounded-2xl border-0 bg-[#00A859] text-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:bg-[#059447] hover:shadow-xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-white/40" />

        <CardHeader className="p-4 pb-2">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <CardDescription className="text-[11px] font-bold uppercase tracking-wide text-white/80">
                {subtitle}
              </CardDescription>

              <CardTitle className="text-lg font-extrabold tracking-tight text-white">
                {title}
              </CardTitle>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/25 transition-all duration-300 group-hover:bg-white group-hover:text-[#0F6B35]">
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col justify-between space-y-3 p-4 pt-0">
          <p className="text-sm leading-relaxed text-white/90">
            {description}
          </p>

          <div className="flex items-center justify-between border-t border-white/30 pt-2">
            <span className="text-sm font-bold text-white">
              {action}
            </span>

            <ArrowRight className="h-5 w-5 text-white transition-transform duration-300 group-hover:translate-x-1" />
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
      description:
        "Crear, editar y eliminar cuentas de usuario dentro del sistema.",
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
        description:
          "Consulta y gestiona los sujetos registrados en la plataforma.",
        href: "/evaluations",
        icon: ListChecks,
        action: "Ir a Sujetos Registrados",
      },
      {
        title: "Calcular ETM",
        subtitle: "Control técnico",
        description:
          "Calcula el error técnico de medición de las evaluaciones.",
        href: "/evaluations/etm",
        icon: BarChart3,
        action: "Ir a Calculadora de ETM",
      },
      {
        title: "Ver Evolución",
        subtitle: "Seguimiento",
        description:
          "Revisa la evolución física y antropométrica de un participante.",
        href: "/evolution",
        icon: Activity,
        action: "Ir a Evolución",
      },
      {
        title: "Gestionar Categorías",
        subtitle: "Clasificación",
        description:
          "Organiza las evaluaciones en la categoría más adecuada.",
        href: "/categories",
        icon: Tags,
        action: "Ir a Gestión de Categorías",
      },
      {
        title: "Generar Base de Datos",
        subtitle: "Reportes",
        description:
          "Genera una base de datos con participantes y evaluaciones.",
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
        description:
          "Accede a los participantes que tienen pruebas asignadas.",
        href: "/assistant/pending-tests",
        icon: UserCheck,
        action: "Ir a Pruebas Pendientes",
      },
      {
        title: "Ver Completados",
        subtitle: "Historial de Evaluados",
        description:
          "Consulta evaluaciones finalizadas y resultados registrados.",
        href: "/reviewed-evaluations",
        icon: FileText,
        action: "Ir a Historial",
      }
    );
  }

  return (
    <div className="bg-[#F4F7F3] pt-0 pb-1">

      <div className="grid gap-5">
        <Card className="overflow-hidden rounded-2xl border-0 bg-white shadow-md">
          <CardContent className="p-0">
            <div className="grid overflow-hidden lg:grid-cols-[1fr_320px]">
              <div className="bg-[#00A859] p-5 text-white">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold text-white ring-1 ring-white/25">
                    <ShieldCheck className="h-4 w-4" />
                    Panel Administrativo LERM
                  </div>

                  <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">
                      Bienvenido, {displayName || "Usuario"}
                    </h1>

                    <p className="max-w-3xl text-sm leading-relaxed text-white/90">
                      Accede de forma rápida a las herramientas disponibles
                      según tu perfil dentro del sistema.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center bg-[#0F6B35] p-5 text-white">
                <div className="w-full space-y-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/20">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-medium text-white/80">
                      Rol actual
                    </span>

                    <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#0F6B35]">
                      {roleName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-medium text-white/80">
                      Accesos disponibles
                    </span>

                    <span className="text-xs font-bold text-white">
                      {dashboardItems.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-medium text-white/80">
                      Estado
                    </span>

                    <span className="text-xs font-bold text-white">
                      Activo
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {dashboardItems.length > 0 ? (
          <div className="grid auto-rows-fr gap-4 md:grid-cols-2 xl:grid-cols-3">
            {dashboardItems.map((item) => (
              <DashboardActionCard key={item.href} {...item} />
            ))}
          </div>
        ) : (
          <Card className="rounded-2xl border border-[#0F6B35]/10 bg-white shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-[#425047]">
                No hay acciones específicas disponibles para tu rol en este
                momento.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}