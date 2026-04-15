"use client";

import AppLogo from "@/components/AppLogo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const logoHref = !isLoading && isAuthenticated ? "/evaluations" : "/";

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link href={logoHref}>
            <AppLogo />
          </Link>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push("/");
              }
            }}
            className="border-pink-500 text-pink-500 hover:bg-pink-50 rounded-xl px-4 py-5 font-normal"
          >
            <ArrowLeft className="mr-3 h-5 w-5" />
            Volver
          </Button>
        </div>

        {children}
      </main>

      <footer className="bg-card border-t border-border py-6 text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} LERM - CECAR. Todos los derechos reservados.
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Diseñado por: Omar Andres Rodriguez Sierra - Facultad de Ingeniería de Sistemas
        </p>
      </footer>
    </div>
  );
}