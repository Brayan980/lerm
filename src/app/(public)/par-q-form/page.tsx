import { Suspense } from 'react';
import ParQForm from "@/components/forms/ParQForm";
import { Loader2 } from 'lucide-react';

// Fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
    <p className="ml-4 text-muted-foreground">Cargando formulario...</p>
  </div>
);

export default function ParQFormPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <Suspense fallback={<LoadingFallback />}>
        <ParQForm />
      </Suspense>
    </div>
  );
}
