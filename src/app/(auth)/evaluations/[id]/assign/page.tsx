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
import { ArrowLeft, Loader2, UserRound } from "lucide-react";
import type { EvaluationMode } from "@/lib/types";

type SeccionActiva = "inicio" | "antropometricas" | "fisicas";

export default function AssignTestsPage() {
  const { id } = useParams<{ id: string }>();

  const evaluationContext = useEvaluationContext() as any;
  const { updateEvaluationRecord } = evaluationContext;

  const evaluations =
    evaluationContext.evaluationRecords ||
    evaluationContext.evaluations ||
    evaluationContext.records ||
    [];

  const currentEvaluation = evaluations.find(
    (item: any) => String(item.id) === String(id)
  );

  const rawParticipant =
    currentEvaluation?.participant ||
    currentEvaluation?.participants ||
    currentEvaluation?.participantData ||
    currentEvaluation?.participant_data ||
    {};

  const participant = Array.isArray(rawParticipant)
    ? rawParticipant[0] || {}
    : rawParticipant;

  const getValue = (...values: any[]) => {
    const value = values.find(
      (item) => item !== undefined && item !== null && item !== ""
    );

    return value ?? "N/A";
  };

  const participantName = getValue(
    currentEvaluation?.participant_name,
    currentEvaluation?.participantName,
    currentEvaluation?.name,
    `${getValue(
      participant?.first_name,
      participant?.firstName,
      participant?.nombre,
      ""
    )} ${getValue(
      participant?.last_name,
      participant?.lastName,
      participant?.apellido,
      ""
    )}`.trim()
  );

  const participantAge = getValue(
    currentEvaluation?.calculated_age,
    currentEvaluation?.calculatedAge,
    participant?.calculated_age,
    participant?.calculatedAge,
    participant?.age,
    participant?.edad
  );

  const participantSex = getValue(
    currentEvaluation?.sex,
    currentEvaluation?.sexo,
    participant?.sex,
    participant?.sexo
  );

  const participantIdNumber = getValue(
    currentEvaluation?.id_number,
    currentEvaluation?.idNumber,
    participant?.id_number,
    participant?.idNumber,
    participant?.documento,
    participant?.identification
  );

  const participantEmail = getValue(
    currentEvaluation?.email,
    participant?.email,
    participant?.correo
  );

  const formType = getValue(
    currentEvaluation?.form_type,
    currentEvaluation?.formType,
    currentEvaluation?.tipo_formulario,
    currentEvaluation?.tipoFormulario,
    currentEvaluation?.questionnaire_type
  );

  const questionnaireResult = getValue(
    currentEvaluation?.questionnaire_result,
    currentEvaluation?.questionnaireResult,
    currentEvaluation?.resultado_cuestionario,
    currentEvaluation?.resultadoCuestionario,
    currentEvaluation?.result
  );

  const sentDate = getValue(
    currentEvaluation?.submitted_at,
    currentEvaluation?.submittedAt,
    currentEvaluation?.created_at,
    currentEvaluation?.createdAt,
    currentEvaluation?.fecha_envio,
    currentEvaluation?.fechaEnvio
  );

  const { toast } = useToast();
  const router = useRouter();

  const [selectedProtocol, setSelectedProtocol] = useState<EvaluationMode | "">("");
  const [isSaving, setIsSaving] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState<SeccionActiva>("inicio");

  const pageFont = {
    fontFamily: '"Trebuchet MS", "Segoe UI", Arial, sans-serif',
  };

  const titleFont = {
    fontFamily: 'Georgia, "Times New Roman", serif',
  };

  const handleGoBack = () => {
    if (id) {
      router.push(`/evaluations/${id}`);
      return;
    }

    router.push("/evaluations");
  };

  const handleSave = async () => {
    if (!id || !selectedProtocol) return;

    setIsSaving(true);

    const result = await updateEvaluationRecord(String(id), {
      evaluation_mode: selectedProtocol,
      status: "Pruebas Asignadas Asistente",
    });

    if (result.success) {
      toast({
        title: "Perfil asignado",
        description: `Se asignó el perfil "${selectedProtocol}" a la evaluación.`,
      });

      handleGoBack();
    } else {
      toast({
        title: "Error",
        description: result.message || "No se pudo asignar el perfil.",
        variant: "destructive",
      });
    }

    setIsSaving(false);
  };

  return (
    <AuthWrapper allowedRoles={["Evaluator"]}>
      <div
        style={pageFont}
        className="w-full min-h-[calc(100vh-88px)] bg-gradient-to-br from-slate-50 via-white to-blue-50/40"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] min-h-[calc(100vh-88px)]">
          
          {/* BARRA LATERAL */}
          <aside className="bg-white border-r border-slate-200 shadow-sm min-h-[calc(100vh-88px)] px-6 py-5 lg:sticky lg:top-[88px] lg:self-start">
            <div className="mb-6">
              <h2
                style={titleFont}
                className="text-2xl font-bold text-slate-900 tracking-tight"
              >
                Tipos de pruebas
              </h2>

              <p className="text-sm text-slate-500 mt-2">
                Seleccione una categoría
              </p>
            </div>

            <div className="space-y-4">
              <Button
                type="button"
                variant="ghost"
                className={`w-full justify-start h-14 rounded-xl text-base font-semibold transition-all ${
                  seccionActiva === "antropometricas"
                    ? "bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:text-white"
                    : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                }`}
                onClick={() => setSeccionActiva("antropometricas")}
              >
                Pruebas antropométricas
              </Button>

              <Button
                type="button"
                variant="ghost"
                className={`w-full justify-start h-14 rounded-xl text-base font-semibold transition-all ${
                  seccionActiva === "fisicas"
                    ? "bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:text-white"
                    : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                }`}
                onClick={() => setSeccionActiva("fisicas")}
              >
                Pruebas físicas
              </Button>
            </div>
          </aside>

          {/* CONTENIDO PRINCIPAL */}
          <main className="w-full px-5 sm:px-7 lg:px-8 py-3 lg:py-4">
            <div className="max-w-6xl mx-auto">
              
              {/* BOTÓN VOLVER */}
              <div className="sticky top-[92px] z-40 mb-3 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoBack}
                  className="rounded-xl border-blue-500 bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-md"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </div>

              {/* PANTALLA INICIAL */}
              {seccionActiva === "inicio" && (
                <Card className="shadow-lg rounded-2xl border-slate-200 bg-white/95">
                  <CardContent className="py-7 px-6 lg:px-8">
                    <div className="text-center mb-5">
                      <h1
                        style={titleFont}
                        className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight"
                      >
                        Bienvenido
                      </h1>

                      <p className="text-slate-600 mt-3 text-base lg:text-lg font-medium">
                        Elija el tipo de prueba en la barra lateral que va a realizar.
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 lg:p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <UserRound className="h-6 w-6 text-blue-600" />
                        </div>

                        <div>
                          <h2
                            style={titleFont}
                            className="text-xl lg:text-2xl font-bold text-slate-900"
                          >
                            Datos del participante
                          </h2>

                          <p className="text-sm text-slate-500">
                            Información del participante seleccionado para la evaluación.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white rounded-xl border p-3.5">
                          <p className="text-xs uppercase text-slate-500 font-bold">
                            Nombre completo
                          </p>
                          <p className="text-lg font-semibold text-slate-900 mt-1">
                            {participantName}
                          </p>
                        </div>

                        <div className="bg-white rounded-xl border p-3.5">
                          <p className="text-xs uppercase text-slate-500 font-bold">
                            Edad
                          </p>
                          <p className="text-lg font-semibold text-slate-900 mt-1">
                            {participantAge}
                          </p>
                        </div>

                        <div className="bg-white rounded-xl border p-3.5">
                          <p className="text-xs uppercase text-slate-500 font-bold">
                            Sexo
                          </p>
                          <p className="text-lg font-semibold text-slate-900 mt-1">
                            {participantSex}
                          </p>
                        </div>

                        <div className="bg-white rounded-xl border p-3.5">
                          <p className="text-xs uppercase text-slate-500 font-bold">
                            Documento
                          </p>
                          <p className="text-lg font-semibold text-slate-900 mt-1">
                            {participantIdNumber}
                          </p>
                        </div>

                        <div className="bg-white rounded-xl border p-3.5">
                          <p className="text-xs uppercase text-slate-500 font-bold">
                            Correo
                          </p>
                          <p className="text-lg font-semibold text-slate-900 mt-1">
                            {participantEmail}
                          </p>
                        </div>

                        <div className="bg-white rounded-xl border p-3.5">
                          <p className="text-xs uppercase text-slate-500 font-bold">
                            Tipo de formulario
                          </p>
                          <p className="text-lg font-semibold text-slate-900 mt-1">
                            {formType}
                          </p>
                        </div>

                        <div className="bg-white rounded-xl border p-3.5">
                          <p className="text-xs uppercase text-slate-500 font-bold">
                            Resultado cuestionario
                          </p>
                          <p className="text-lg font-semibold text-slate-900 mt-1">
                            {questionnaireResult}
                          </p>
                        </div>

                        <div className="bg-white rounded-xl border p-3.5">
                          <p className="text-xs uppercase text-slate-500 font-bold">
                            Fecha de envío
                          </p>
                          <p className="text-lg font-semibold text-slate-900 mt-1">
                            {sentDate}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* PRUEBAS ANTROPOMÉTRICAS */}
              {seccionActiva === "antropometricas" && (
                <Card className="shadow-lg rounded-2xl border-slate-200 bg-white/95">
                  <CardHeader className="pb-3">
                    <CardTitle
                      style={titleFont}
                      className="text-2xl lg:text-3xl text-slate-900 tracking-tight"
                    >
                      Asignar Perfil de Evaluación
                    </CardTitle>

                    <CardDescription className="text-base text-slate-600">
                      Selecciona el perfil con el cual se evaluará al participante.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <RadioGroup
                      value={selectedProtocol}
                      onValueChange={(val) =>
                        setSelectedProtocol(val as EvaluationMode)
                      }
                      className="space-y-5"
                    >
                      <div>
                        <Label className="font-bold text-slate-900 text-base">
                          2 Componentes (Químico)
                        </Label>

                        <div className="mt-3 space-y-3 pl-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="2C_Slaughter" id="2c_slaughter" />
                            <Label htmlFor="2c_slaughter">
                              Slaughter (Niños y Adolescentes)
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="2C_DurninWomersley" id="2c_dw" />
                            <Label htmlFor="2c_dw">
                              Durnin-Womersley (Adultos)
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="2C_Faulkner" id="2c_faulkner" />
                            <Label htmlFor="2c_faulkner">
                              Faulkner (Deportistas)
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="2C_Carter" id="2c_carter" />
                            <Label htmlFor="2c_carter">
                              Carter (Deportistas)
                            </Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="2C_Weltman" id="2c_weltman" />
                            <Label htmlFor="2c_weltman">
                              Weltman (Obesos)
                            </Label>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="font-bold text-slate-900 text-base">
                          Multicomponentes (Anatómico)
                        </Label>

                        <div className="mt-3 space-y-3 pl-4">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="MULT_Express" id="express" />
                            <Label htmlFor="express">Express</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="MULT_Restringido" id="restringido" />
                            <Label htmlFor="restringido">Restringido</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="MULT_5Componentes" id="5c" />
                            <Label htmlFor="5c">5 Componentes</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="MULT_Completo" id="completo" />
                            <Label htmlFor="completo">Completo</Label>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>

                    <div className="mt-6 flex justify-end space-x-3">
                      <Button
                        variant="outline"
                        onClick={handleGoBack}
                        className="rounded-xl"
                      >
                        Cancelar
                      </Button>

                      <Button
                        className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={!selectedProtocol || isSaving}
                        onClick={handleSave}
                      >
                        {isSaving && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Guardar Asignación
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* PRUEBAS FÍSICAS */}
              {seccionActiva === "fisicas" && (
                <Card className="shadow-lg rounded-2xl border-slate-200 bg-white/95">
                  <CardContent className="py-10 lg:py-12 text-center">
                    <h1
                      style={titleFont}
                      className="text-4xl font-bold text-slate-900 tracking-tight"
                    >
                      Bienvenido
                    </h1>

                    <p className="text-slate-600 mt-5 text-lg font-medium">
                      Este apartado de pruebas físicas estará disponible próximamente.
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