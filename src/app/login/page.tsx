import LoginForm from "@/components/auth/LoginForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  LockKeyhole,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

export default function LoginPage() {
  return (
    <main className="relative flex min-h-[100svh] w-full items-start justify-center overflow-y-auto bg-[#F4F7F3] px-3 py-5 md:h-dvh md:items-center md:overflow-hidden md:px-6 md:py-4">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-28 -top-28 h-72 w-72 rounded-full bg-[#58A900]/20 blur-3xl md:h-96 md:w-96" />
        <div className="absolute -bottom-28 -right-28 h-72 w-72 rounded-full bg-[#0F6B35]/20 blur-3xl md:h-96 md:w-96" />
      </div>

      <Card className="w-full max-w-[405px] overflow-hidden rounded-[1.8rem] border-0 bg-white shadow-2xl md:grid md:h-[min(620px,calc(100dvh-2rem))] md:max-w-5xl md:grid-cols-[0.95fr_1.05fr] md:rounded-[2rem]">
        {/* Panel institucional - solo computador */}
        <aside className="hidden flex-col justify-between bg-[#58A900] p-9 text-white md:flex">
          <div>
            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 shadow-lg ring-1 ring-white/30">
              <ShieldCheck className="h-9 w-9 text-white" />
            </div>

            <h1 className="text-5xl font-extrabold tracking-wide">LERM</h1>

            <p className="mt-4 max-w-sm text-lg leading-relaxed text-white/90">
              Laboratorio de Evaluación del Rendimiento Morfofuncional
            </p>

            <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-semibold ring-1 ring-white/25">
              <LockKeyhole className="h-4 w-4" />
              Acceso seguro al sistema
            </div>
          </div>

          <div className="space-y-3 rounded-3xl bg-[#0F6B35]/75 p-5 shadow-xl ring-1 ring-white/15">
            <div className="flex items-center gap-3 text-sm font-medium">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              Credenciales protegidas
            </div>

            <div className="flex items-center gap-3 text-sm font-medium">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              Acceso exclusivo para personal autorizado
            </div>

            <div className="flex items-center gap-3 text-sm font-medium">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              Validación segura de usuarios
            </div>
          </div>
        </aside>

        {/* Panel login */}
        <section className="flex items-center justify-center bg-white px-5 py-5 md:px-8 md:py-8">
          <div className="w-full max-w-md">
            <CardHeader className="p-0 text-center">
              {/* Encabezado móvil compacto */}
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#58A900]/10 ring-1 ring-[#58A900]/25 md:hidden">
                <ShieldCheck className="h-6 w-6 text-[#0F6B35]" />
              </div>

              <CardTitle className="text-3xl font-extrabold tracking-wide text-[#0F6B35] md:hidden">
                LERM
              </CardTitle>

              <CardDescription className="mx-auto mt-1 max-w-xs text-sm leading-snug text-[#425047] md:hidden">
                Laboratorio de Evaluación del Rendimiento Morfofuncional
              </CardDescription>

              {/* Ícono solo computador */}
              <div className="mx-auto mb-5 mt-5 hidden h-12 w-12 items-center justify-center rounded-2xl bg-[#58A900]/10 ring-1 ring-[#58A900]/25 md:flex">
                <UserCheck className="h-7 w-7 text-[#0F6B35]" />
              </div>

              <CardTitle className="mt-4 text-2xl font-extrabold text-[#0F6B35] md:mt-0">
                Acceso Personal
              </CardTitle>

              <CardDescription className="mt-1 text-sm leading-snug text-[#5D6B63]">
                Ingresa tus credenciales autorizadas para continuar.
              </CardDescription>
            </CardHeader>

            <CardContent className="mt-5 p-0 md:mt-7">
              <LoginForm />
            </CardContent>

            <div className="mt-6 hidden rounded-2xl bg-[#F4F7F3] px-4 py-3 text-center text-xs font-semibold text-[#0F6B35] ring-1 ring-[#58A900]/20 md:block">
              Sistema institucional LERM · Acceso restringido
            </div>
          </div>
        </section>
      </Card>
    </main>
  );
}