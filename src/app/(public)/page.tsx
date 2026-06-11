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
import LoginForm from "@/components/auth/LoginForm";

export default function HomePage() {
  return (
    <main className="relative flex h-dvh w-full items-center justify-center overflow-hidden bg-[#F4F7F3] px-6 py-5">
      {/* Fondo suave institucional */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#58A900]/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#0F6B35]/20 blur-3xl" />
      </div>

      <section className="w-full max-w-5xl">
        <Card className="grid h-[calc(100dvh-2.5rem)] max-h-[620px] min-h-[520px] overflow-hidden rounded-[2rem] border-0 bg-white shadow-2xl md:grid-cols-[0.95fr_1.05fr]">
          {/* Panel institucional izquierdo */}
          <aside className="hidden flex-col justify-between bg-[#58A900] p-9 text-white md:flex">
            <div>
              <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 shadow-lg ring-1 ring-white/30">
                <ShieldCheck className="h-9 w-9 text-white" />
              </div>

              <h1 className="text-5xl font-extrabold tracking-wide">
                LERM
              </h1>

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

          {/* Panel derecho del login */}
          <section className="flex items-center justify-center bg-white px-8 py-8">
            <div className="w-full max-w-md">
              <CardHeader className="p-0 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#58A900]/10 ring-1 ring-[#58A900]/25 md:hidden">
                  <ShieldCheck className="h-8 w-8 text-[#0F6B35]" />
                </div>

                <CardTitle className="text-3xl font-extrabold tracking-wide text-[#0F6B35] md:hidden">
                  LERM
                </CardTitle>

                <CardDescription className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#425047] md:hidden">
                  Laboratorio de Evaluación del Rendimiento Morfofuncional
                </CardDescription>

                <div className="mx-auto mb-5 mt-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#58A900]/10 ring-1 ring-[#58A900]/25">
                  <UserCheck className="h-7 w-7 text-[#0F6B35]" />
                </div>

                <CardTitle className="text-2xl font-bold text-[#0F6B35]">
                  Acceso Personal
                </CardTitle>

                <CardDescription className="mt-2 text-sm text-[#5D6B63]">
                  Ingresa tus credenciales autorizadas para continuar.
                </CardDescription>
              </CardHeader>

              <CardContent className="mt-7 p-0">
                <div
                  className="
                    [&_form]:space-y-4

                    [&_label]:text-sm
                    [&_label]:font-bold
                    [&_label]:text-[#183B22]

                    [&_input]:h-12
                    [&_input]:rounded-xl
                    [&_input]:border-0
                    [&_input]:bg-[#EAF1FF]
                    [&_input]:text-[#1F2937]
                    [&_input]:shadow-sm
                    [&_input]:placeholder:text-gray-500
                    [&_input]:focus-visible:ring-2
                    [&_input]:focus-visible:ring-[#58A900]/60

                    [&_input[type=checkbox]]:h-4
                    [&_input[type=checkbox]]:w-4
                    [&_input[type=checkbox]]:accent-[#0F6B35]

                    [&_button]:transition-all

                    [&_button[type=button]]:text-[#0F6B35]
                    hover:[&_button[type=button]]:text-[#0B552A]

                    [&_button[type=submit]]:mt-2
                    [&_button[type=submit]]:h-12
                    [&_button[type=submit]]:w-full
                    [&_button[type=submit]]:rounded-xl
                    [&_button[type=submit]]:bg-[#0F6B35]
                    [&_button[type=submit]]:font-bold
                    [&_button[type=submit]]:text-white
                    [&_button[type=submit]]:shadow-lg
                    hover:[&_button[type=submit]]:bg-[#0B552A]
                    hover:[&_button[type=submit]]:shadow-xl

                    [&_a]:font-semibold
                    [&_a]:text-[#0F6B35]
                    hover:[&_a]:text-[#0B552A]
                  "
                >
                  <LoginForm />
                </div>
              </CardContent>

              <div className="mt-6 rounded-2xl bg-[#F4F7F3] px-4 py-3 text-center text-xs font-semibold text-[#0F6B35] ring-1 ring-[#58A900]/20">
                Sistema institucional LERM · Acceso restringido
              </div>
            </div>
          </section>
        </Card>
      </section>
    </main>
  );
}