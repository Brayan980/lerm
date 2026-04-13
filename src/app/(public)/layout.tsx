
import AppLogo from '@/components/AppLogo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" passHref>
            <AppLogo />
          </Link>
          <nav>
            <Button variant="ghost" asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-8">
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
