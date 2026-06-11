"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useEvaluationContext } from "@/contexts/EvaluationContext";
import { useToast } from "@/hooks/use-toast";
import AuthWrapper from "@/components/auth/AuthWrapper";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { EvaluationMode } from "@/lib/types";

type SeccionActiva = "antropometricas" | "fisicas";

export default function AssignTestsPage() {
  const { id } = useParams<{ id: string }>();
  const evaluationId = String(id || "");

  const evaluationContext = useEvaluationContext() as any;
  const { updateEvaluationRecord } = evaluationContext;

  const { toast } = useToast();
  const router = useRouter();

  const [selectedProtocol, setSelectedProtocol] = useState<EvaluationMode | "">(
    "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [seccionActiva, setSeccionActiva] =
    useState<SeccionActiva>("antropometricas");

  const pageFont = {
    fontFamily: '"Trebuchet MS", "Segoe UI", Arial, sans-serif',
  };

  const titleFont = {
    fontFamily: 'Georgia, "Times New Roman", serif',
  };

  const goToEvaluationDetails = () => {
    router.replace("/evaluations");
  };

  const handleSave = async () => {
    if (!evaluationId || !selectedProtocol || isSaving) return;

    setIsSaving(true);

    try {
      const result = await updateEvaluationRecord(evaluationId, {
        evaluation_mode: selectedProtocol,
        status: "Pruebas Asignadas Asistente",
      });

      if (result.success) {
        toast({
          title: "Perfil asignado",
          description: `Se asignó el perfil "${selectedProtocol}" a la evaluación.`,
        });

        setIsSaving(false);
        goToEvaluationDetails();
        return;
      }

      toast({
        title: "Error",
        description: result.message || "No se pudo asignar el perfil.",
        variant: "destructive",
      });

      setIsSaving(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un problema al guardar la asignación.",
        variant: "destructive",
      });

      setIsSaving(false);
    }
  };

  const ProtocolOption = ({
    id,
    value,
    label,
  }: {
    id: string;
    value: EvaluationMode;
    label: string;
  }) => {
    const isSelected = selectedProtocol === value;

    return (
      <div
        onClick={() => setSelectedProtocol(value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setSelectedProtocol(value);
          }
        }}
        role="button"
        tabIndex={0}
        className={`flex min-h-[42px] w-full cursor-pointer select-none items-center gap-3 rounded-xl border px-4 py-2 text-sm font-semibold outline-none transition-all ${
          isSelected
            ? "border-[#00A859] bg-emerald-50 text-[#04763f] shadow-sm ring-2 ring-[#00A859]/20"
            : "border-slate-200 bg-white text-slate-900 shadow-sm hover:border-[#00A859]/70 hover:bg-emerald-50/70"
        }`}
      >
        <RadioGroupItem
          value={value}
          id={id}
          className="pointer-events-none h-5 w-5 shrink-0 border-blue-400 text-[#00A859] data-[state=checked]:border-[#00A859]"
        />

        <span className="leading-tight">{label}</span>
      </div>
    );
  };

  return (
    <AuthWrapper allowedRoles={["Evaluator"]}>
      <div
        style={pageFont}
        className="h-[calc(100dvh-165px)] w-full overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/40"
      >
        <div className="grid h-full min-h-0 grid-cols-1 overflow-hidden lg:grid-cols-[280px_1fr]">
          <aside className="hidden h-full min-h-0 overflow-hidden border-r border-slate-200 bg-white px-5 py-3 shadow-sm lg:block">
            <div className="mb-4">
              <h2
                style={titleFont}
                className="text-xl font-bold tracking-tight text-slate-900"
              >
                Tipos de pruebas
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Seleccione una categoría
              </p>
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                variant="ghost"
                className={`h-12 w-full justify-start rounded-xl text-sm font-semibold transition-all ${
                  seccionActiva === "antropometricas"
                    ? "bg-[#00A859] text-white shadow-md hover:bg-[#059447] hover:text-white"
                    : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                }`}
                onClick={() => setSeccionActiva("antropometricas")}
              >
                Pruebas antropométricas
              </Button>

              <Button
                type="button"
                variant="ghost"
                className={`h-12 w-full justify-start rounded-xl text-sm font-semibold transition-all ${
                  seccionActiva === "fisicas"
                    ? "bg-[#00A859] text-white shadow-md hover:bg-[#059447] hover:text-white"
                    : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                }`}
                onClick={() => setSeccionActiva("fisicas")}
              >
                Pruebas físicas
              </Button>
            </div>
          </aside>

          <main className="h-full min-h-0 w-full overflow-hidden px-4 py-2">
            <div className="mx-auto h-full max-w-6xl overflow-hidden">
              {seccionActiva === "antropometricas" && (
                <Card className="flex h-full flex-col overflow-hidden rounded-2xl border-slate-200 bg-white/95 shadow-lg">
                  <CardHeader className="relative shrink-0 px-5 pb-2 pt-4 pr-40 lg:px-6 lg:pr-44">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goToEvaluationDetails}
                      className="absolute right-5 top-4 h-10 rounded-xl border-blue-500 bg-white px-5 font-semibold text-blue-600 shadow-md hover:bg-blue-50 lg:right-6"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Volver
                    </Button>
                    <CardTitle
                      style={titleFont}
                      className="text-2xl tracking-tight text-slate-900 lg:text-3xl"
                    >
                      Pruebas antropométricas
                    </CardTitle>

                    <CardDescription className="text-sm text-slate-600 lg:text-base">
                      Selecciona el perfil antropométrico con el cual se
                      evaluará al participante.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex min-h-0 flex-1 flex-col px-5 pb-4 pt-0 lg:px-6">
                    <RadioGroup
                      value={selectedProtocol}
                      onValueChange={(val) =>
                        setSelectedProtocol(val as EvaluationMode)
                      }
                      className="space-y-4"
                    >
                      <div>
                        <Label className="text-base font-bold text-slate-900">
                          2 Componentes (Químico)
                        </Label>

                        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                          <ProtocolOption
                            id="2c_slaughter"
                            value="2C_Slaughter"
                            label="Slaughter (Niños y Adolescentes)"
                          />

                          <ProtocolOption
                            id="2c_dw"
                            value="2C_DurninWomersley"
                            label="Durnin-Womersley (Adultos)"
                          />

                          <ProtocolOption
                            id="2c_faulkner"
                            value="2C_Faulkner"
                            label="Faulkner (Deportistas)"
                          />

                          <ProtocolOption
                            id="2c_carter"
                            value="2C_Carter"
                            label="Carter (Deportistas)"
                          />

                          <ProtocolOption
                            id="2c_weltman"
                            value="2C_Weltman"
                            label="Weltman (Obesos)"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-base font-bold text-slate-900">
                          Multicomponentes (Anatómico)
                        </Label>

                        <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                          <ProtocolOption
                            id="express"
                            value="MULT_Express"
                            label="Express"
                          />

                          <ProtocolOption
                            id="restringido"
                            value="MULT_Restringido"
                            label="Restringido"
                          />

                          <ProtocolOption
                            id="5c"
                            value="MULT_5Componentes"
                            label="5 Componentes"
                          />

                          <ProtocolOption
                            id="completo"
                            value="MULT_Completo"
                            label="Completo"
                          />
                        </div>
                      </div>
                    </RadioGroup>

                    <div className="mt-auto flex justify-end space-x-3 pt-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goToEvaluationDetails}
                        className="h-10 rounded-xl"
                      >
                        Cancelar
                      </Button>

                      <Button
                        type="button"
                        className="h-10 rounded-xl bg-[#00A859] text-white hover:bg-[#059447]"
                        disabled={!selectedProtocol || isSaving}
                        onClick={handleSave}
                      >
                        {isSaving && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {isSaving ? "Guardando..." : "Guardar Asignación"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {seccionActiva === "fisicas" && (
                <Card className="relative h-full overflow-hidden rounded-2xl border-slate-200 bg-white/95 shadow-lg">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToEvaluationDetails}
                    className="absolute right-5 top-4 h-10 rounded-xl border-blue-500 bg-white px-5 font-semibold text-blue-600 shadow-md hover:bg-blue-50 lg:right-6"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver
                  </Button>

                  <CardContent className="flex h-full flex-col items-center justify-center px-5 py-8 text-center">
                    <h1
                      style={titleFont}
                      className="text-3xl font-bold tracking-tight text-slate-900"
                    >
                      Pruebas físicas
                    </h1>

                    <p className="mt-4 text-base font-medium text-slate-600">
                      Este apartado de pruebas físicas estará disponible
                      próximamente.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>
        </div>
      </div>
    </AuthWrapper>
  );
}
