
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import type { UserRole } from "@/lib/types";

interface AuthWrapperProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export default function AuthWrapper({ children, allowedRoles }: AuthWrapperProps) {
  const { isAuthenticated, userRole, isLoading, selectedRole } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    } else if (!isLoading && isAuthenticated && allowedRoles && selectedRole && !allowedRoles.includes(selectedRole)) {
      // If logged in but role not allowed for this page, redirect to dashboard or an unauthorized page
      router.replace("/dashboard"); 
    }
  }, [isAuthenticated, isLoading, router, allowedRoles, selectedRole]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Or a loading spinner, effectively handled by redirect
  }
  
  if (allowedRoles && selectedRole && !allowedRoles.includes(selectedRole)) {
    return (
         <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Acceso Denegado</h1>
            <p className="text-muted-foreground">No tienes permiso para ver esta página con tu rol actual.</p>
            <button onClick={() => router.push('/dashboard')} className="mt-4 text-primary hover:underline">
                Ir al Dashboard
            </button>
        </div>
    );
  }

  return <>{children}</>;
}
