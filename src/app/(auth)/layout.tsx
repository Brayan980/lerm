
"use client";
import AppLogo from '@/components/AppLogo';
import AuthWrapper from '@/components/auth/AuthWrapper';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { LogOut, UserCircle, Settings, ListChecks } from 'lucide-react'; // Removed BarChart3
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
import { useRouter } from 'next/navigation';


export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { logout, username, selectedRole, userRole } = useAuth();
  const router = useRouter();

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    const parts = name.split('@')[0].split(/[.\-_s]/); 
    if (parts.length > 1 && parts[0].length > 0 && parts[1].length > 0) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const avatarFallbackText = getInitials(username);

  return (
    <AuthWrapper>
      <div className="flex flex-col min-h-screen bg-background">
        <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/dashboard" passHref>
              <AppLogo />
            </Link>
            <div className="flex items-center gap-4">
               {/* Navigation Links for Evaluator */}
              {selectedRole === 'Evaluator' && (
                <nav className="hidden md:flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => router.push('/evaluations')}>
                    <ListChecks className="mr-2 h-4 w-4" />Pendientes
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => router.push('/reviewed-evaluations')}>
                     <Settings className="mr-2 h-4 w-4" />Historial
                  </Button>
                </nav>
              )}
              {username && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={`https://placehold.co/100x100/7F9CF5/FFFFFF.png?text=${avatarFallbackText}`} alt={username || "Usuario"} data-ai-hint="profile avatar user" />
                        <AvatarFallback>{avatarFallbackText}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{username}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          Rol: {selectedRole}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                        {userRole === 'Admin' && (
                             <DropdownMenuItem onClick={() => router.push('/admin')}>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Admin Usuarios</span>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                            <UserCircle className="mr-2 h-4 w-4" />
                            <span>Dashboard</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="bg-card border-t border-border py-6 text-center mt-auto">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} LERM - CECAR. Panel Administrativo.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Diseñado por: Omar Andres Rodriguez Sierra - Facultad de Ingeniería de Sistemas
          </p>
        </footer>
      </div>
    </AuthWrapper>
  );
}
