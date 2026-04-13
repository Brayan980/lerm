
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';
import { FormDataProvider } from '@/contexts/FormDataContext';
import { EvaluationProvider } from '@/contexts/EvaluationContext'; // Added
import { ParticipantProvider } from "@/contexts/ParticipantContext";

export const metadata: Metadata = {
  title: 'LERM Evaluator',
  description: 'Laboratorio de Evaluación del Rendimiento Morfofuncional',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen flex flex-col" suppressHydrationWarning={true}>
        <AuthProvider>
          <FormDataProvider>
            <EvaluationProvider> {/* Added */}
              {children}
              <Toaster />
            </EvaluationProvider> {/* Added */}



          </FormDataProvider>
            {/* <ParticipantProvider>
              {children}
              <Toaster />
            </ParticipantProvider> */}


        </AuthProvider>



      </body>
    </html>
  );
}
