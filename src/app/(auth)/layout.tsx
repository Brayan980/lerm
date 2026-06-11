"use client";

import AppLogo from "@/components/AppLogo";
import AuthWrapper from "@/components/auth/AuthWrapper";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  LogOut,
  UserCircle,
  Settings,
  ListChecks,
  LayoutDashboard,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { logout, username, selectedRole, userRole } = useAuth();
  const router = useRouter();

  const getInitials = (name: string | null) => {
    if (!name) return "U";

    const parts = name.split("@")[0].split(/[.\-_\s]/);

    if (parts.length > 1 && parts[0].length > 0 && parts[1].length > 0) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return name.substring(0, 2).toUpperCase();
  };

  const getRoleLabel = () => {
    if (selectedRole === "Evaluator") return "Evaluador";
    if (selectedRole === "Assistant") return "Asistente";
    if (selectedRole === "Admin") return "Administrador";
    return selectedRole || "Usuario";
  };

  const avatarFallbackText = getInitials(username);
  const roleLabel = getRoleLabel();

  return (
    <AuthWrapper>
      <div className="flex h-dvh flex-col overflow-hidden bg-[#F4F7F3]">
        <header className="sticky top-0 z-50 border-b border-[#0F6B35]/20 bg-[#00A859] shadow-md">
          <div className="mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-4 sm:px-6">
            <Link
              href="/dashboard"
              passHref
              className="group flex items-center gap-3"
            >
              <div className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-white/15 px-3 ring-1 ring-white/25 transition-all duration-300 group-hover:bg-white/20">
                <div className="[&_*]:text-white">
                  <AppLogo />
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              {selectedRole === "Evaluator" && (
                <nav className="hidden items-center gap-2 md:flex">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/evaluations")}
                    className="rounded-xl px-4 font-semibold text-white transition-all hover:bg-white/15 hover:text-white"
                  >
                    <ListChecks className="mr-2 h-4 w-4" />
                    Pendientes
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/reviewed-evaluations")}
                    className="rounded-xl px-4 font-semibold text-white transition-all hover:bg-white/15 hover:text-white"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Historial
                  </Button>
                </nav>
              )}

              {username && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-11 w-11 rounded-full p-0 transition-all hover:bg-white/15"
                    >
                      <Avatar className="h-10 w-10 border-2 border-white/70 shadow-md">
                        <AvatarImage
                          src={`https://placehold.co/100x100/0F6B35/FFFFFF.png?text=${avatarFallbackText}`}
                          alt={username || "Usuario"}
                          data-ai-hint="profile avatar user"
                        />
                        <AvatarFallback className="bg-[#0F6B35] text-sm font-bold text-white">
                          {avatarFallbackText}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    className="w-64 rounded-2xl border border-[#0F6B35]/15 bg-white p-2 shadow-xl"
                    align="end"
                    forceMount
                  >
                    <DropdownMenuLabel className="font-normal">
                      <div className="rounded-xl bg-[#F4F7F3] p-3">
                        <p className="truncate text-sm font-bold leading-none text-[#183B22]">
                          {username}
                        </p>

                        <div className="mt-2 inline-flex rounded-full bg-[#00A859] px-3 py-1 text-xs font-bold text-white">
                          Rol: {roleLabel}
                        </div>
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="my-2" />

                    <DropdownMenuGroup>
                      {userRole === "Admin" && (
                        <DropdownMenuItem
                          onClick={() => router.push("/admin")}
                          className="cursor-pointer rounded-xl font-medium text-[#183B22] focus:bg-[#EAF7EF] focus:text-[#0F6B35]"
                        >
                          <Settings className="mr-2 h-4 w-4 text-[#0F6B35]" />
                          <span>Admin Usuarios</span>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        onClick={() => router.push("/dashboard")}
                        className="cursor-pointer rounded-xl font-medium text-[#183B22] focus:bg-[#EAF7EF] focus:text-[#0F6B35]"
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4 text-[#0F6B35]" />
                        <span>Dashboard</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => router.push("/dashboard")}
                        className="cursor-pointer rounded-xl font-medium text-[#183B22] focus:bg-[#EAF7EF] focus:text-[#0F6B35]"
                      >
                        <UserCircle className="mr-2 h-4 w-4 text-[#0F6B35]" />
                        <span>Perfil actual</span>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>

                    <DropdownMenuSeparator className="my-2" />

                    <DropdownMenuItem
                      onClick={logout}
                      className="cursor-pointer rounded-xl font-bold text-red-600 focus:bg-red-50 focus:text-red-700"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>

        <footer className="border-t border-[#0F6B35]/15 bg-white px-4 py-4 text-center shadow-[0_-4px_18px_rgba(15,107,53,0.05)]">
          <p className="text-sm font-semibold text-[#425047]">
            &copy; {new Date().getFullYear()} LERM - CECAR. Panel Administrativo.
          </p>

          <p className="mt-1 text-xs text-[#5D6B63]">
            Diseñado por: Omar Andres Rodriguez Sierra - Facultad de Ingeniería de Sistemas
          </p>
        </footer>
      </div>
    </AuthWrapper>
  );
}