
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useEvaluationContext } from "@/contexts/EvaluationContext";
import { useToast } from "@/hooks/use-toast";
import AuthWrapper from "@/components/auth/AuthWrapper";
import { Loader2 } from "lucide-react";
import type { EvaluationMode } from "@/lib/types";

export default function AssignTestsPage() {
  const { id } = useParams<{ id: string }>();
  const { updateEvaluationRecord } = useEvaluationContext();
  const { toast } = useToast();
  const router = useRouter();

  const [selectedProtocol, setSelectedProtocol] = useState<EvaluationMode | "">("");
  const [isSaving, setIsSaving] = useState(false);

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
      router.push("/evaluations");
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
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Asignar Perfil de Evaluación</CardTitle>
            <CardDescription>
              Selecciona el perfil con el cual se evaluará al participante.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={selectedProtocol}
              onValueChange={(val) => setSelectedProtocol(val as EvaluationMode)}
              className="space-y-4"
            >
              {/* 2 Componentes */}
              <div>
                <Label className="font-semibold">2 Componentes (Químico)</Label>
                <div className="mt-2 space-y-2 pl-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2C_Slaughter" id="2c_slaughter" />
                    <Label htmlFor="2c_slaughter">Slaughter (Niños y Adolescentes)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2C_DurninWomersley" id="2c_dw" />
                    <Label htmlFor="2c_dw">Durnin-Womersley (Adultos)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2C_Faulkner" id="2c_faulkner" />
                    <Label htmlFor="2c_faulkner">Faulkner (Deportistas)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2C_Carter" id="2c_carter" />
                    <Label htmlFor="2c_carter">Carter (Deportistas)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2C_Weltman" id="2c_weltman" />
                    <Label htmlFor="2c_weltman">Weltman (Obesos)</Label>
                  </div>
                </div>
              </div>

              {/* Multicomponentes */}
              <div>
                <Label className="font-semibold">Multicomponentes (Anatómico)</Label>
                <div className="mt-2 space-y-2 pl-4">
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

            {/* Botones */}
            <div className="mt-6 flex justify-end space-x-3">
              <Button variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button
                className="bg-primary hover:bg-primary/90"
                disabled={!selectedProtocol || isSaving}
                onClick={handleSave}
              >
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Asignación
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AuthWrapper>
  );
}
