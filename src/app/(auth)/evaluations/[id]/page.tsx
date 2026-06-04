


"use client";

import { Info, Send } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import AuthWrapper from "@/components/auth/AuthWrapper";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useEvaluationContext } from "@/contexts/EvaluationContext";
import type { EvaluationRecord, FormType, AssignedTests, CalculatedMacroindices, CalculatedComposicionCorporal, ComposicionCorporalCategoria, CalculatedSomatotype, KerrBodyComposition } from "@/lib/types";
import { ArrowLeft, CheckCircle, Edit, Loader2, PackageCheck, Trash2, XCircle, Calculator, Activity, Users, Shapes, BarChart3, PieChart as PieChartIcon, TrendingUp, Download, PlayCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { format, isValid } from "date-fns"; // Import isValid
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import Somatochart from "@/components/charts/Somatochart";
import BodyCompositionPieChart from "@/components/charts/BodyCompositionPieChart";
import PhantomZScoreTable from "@/components/charts/PhantomZScoreChart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import addSomatocartaCropped, { generarReporte } from "@/lib/generate-reporte";
import { generarReporteExcel } from "@/lib/generate-reporte-excel";
import BodyComposition4CPieChart from "@/components/charts/BodyComposition4CPieChart";
import BodyCompositionExpressChart from "@/components/charts/BodyCompositionExpressChart";
import { generarReporteToBlob } from "@/lib/generarReporteToBlob";
import { useAuth } from "@/contexts/AuthContext";

// Helper to render form data in a readable way
//Antes estaba EvaluationRecord['formType']
const RenderFormData = ({ data, formType }: { data: any, formType: EvaluationRecord['form_type'] }) => {
  if (!data) return <p className="text-muted-foreground">No hay datos adicionales para este formulario.</p>;

  // CASO ESPECIAL: Mostrar TAMIZAJE en detalle
  if (formType === "TAMIZAJE") {
    const {
      actividadFisica,
      tieneEnfermedad,
      enfermedades,
      otraEnfermedad,
      tieneSintomas,
      sintomas,
      otroSintoma,
      revision,
      intensidad,
    } = data;

    return (
      <div className="space-y-3 text-sm text-foreground">
        <p><strong>Participa en actividad física:</strong> {actividadFisica?.toUpperCase() || "Sin responder"}</p>
        <p><strong>Enfermedad:</strong> {tieneEnfermedad?.toUpperCase() || "Sin responder"}</p>
        <p><strong>Síntomas:</strong> {tieneSintomas?.toUpperCase() || "Sin responder"}</p>

        {Array.isArray(enfermedades) && enfermedades.length > 0 && (
          <div>
            <strong>Tipos de enfermedad:</strong>
            <ul className="list-disc ml-6 text-muted-foreground">
              {enfermedades.map((e: string) => <li key={e}>{e}</li>)}
            </ul>
          </div>
        )}

        {otraEnfermedad && (
          <p>
            <strong>Otra enfermedad:</strong> {otraEnfermedad}
          </p>
        )}

        {Array.isArray(sintomas) && sintomas.length > 0 && (
          <div>
            <strong>Signos o síntomas:</strong>
            <ul className="list-disc ml-6 text-muted-foreground">
              {sintomas.map((s: string) => <li key={s}>{s}</li>)}
            </ul>
          </div>
        )}

        {otroSintoma && (
          <p>
            <strong>Otro signo o síntoma:</strong> {otroSintoma}
          </p>
        )}

        {(revision || intensidad) && (
          <div className="mt-4 p-3 rounded-md border bg-muted/30">
            {revision && (
              <>
                <div className="font-semibold mb-1">🩺 Revisión médica previa:</div>
                <div className="text-muted-foreground">{revision}</div>
              </>
            )}
            {intensidad && (
              <>
                <div className="font-semibold mt-2">🏃 Intensidad sugerida:</div>
                <div className="text-muted-foreground">{intensidad}</div>
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  const summaryFormTypes: FormType[] = ['PAQ-C', 'PAQ-A', 'IPAQ', 'PAR-Q'];

  if (formType && summaryFormTypes.includes(formType)) {
    return <p className="text-sm text-muted-foreground">Los detalles específicos del cuestionario se reflejan en los puntajes y clasificaciones resumidas.</p>;
  }

  // Fallback for other form types or if formType is not one of the summarized ones.
  // This part will effectively not run for PAQ-C, PAQ-A, IPAQ, PAR-Q due to the check above.
  const keysToSkip = [
    'evalFirstName', 'evalLastName', 'evalIdNumber', 'evalDob', 'evalCalculatedAge', 'evalSex',
    'firstName', 'lastName', 'idNumber', 'dob', 'sex', 'email', 'calculatedAge', 'acceptedTerms',
    'repFirstName', 'repLastName', 'repEmail', 'repPhone', 'repIdNumber',
    'paqC1_activities', 'paqC1_other_activity_text', 'paqC2_educacion_fisica', 'paqC3_recreo',
    'paqC4_antes_despues_comer', 'paqC5_despues_colegio', 'paqC6_noche', 'paqC7_fin_semana',
    'paqC8_descripcion_semana', 'paqC9_daily_freq', 'paqC10_enfermo', 'paqC10_enfermo_razon',
    'paqA1_activities', 'paqA1_other_activity_text', 'paqA2_educacion_fisica', 'paqA3_hasta_almuerzo',
    'paqA4_despues_colegio', 'paqA5_tardes', 'paqA6_fin_semana', 'paqA7_descripcion_semana',
    'paqA8_daily_freq', 'paqA9_enfermo', 'paqA9_enfermo_razon',
    'vigorous_days', 'no_vigorous_activity', 'vigorous_hours_per_day', 'vigorous_minutes_per_day', 'vigorous_dont_know',
    'moderate_days', 'no_moderate_activity', 'moderate_hours_per_day', 'moderate_minutes_per_day', 'moderate_dont_know',
    'walk_days', 'no_walk_activity', 'walk_hours_per_day', 'walk_minutes_per_day', 'walk_dont_know',
    'sit_hours_weekday', 'sit_minutes_weekday', 'sit_dont_know',
    'q1_heart_condition', 'q2_chest_pain_activity', 'q3_chest_pain_rest', 'q4_dizziness_balance',
    'q5_bone_joint_problem', 'q6_drug_prescription', 'q7_other_reason',
    'phone', 'address', 'city', 'emergencyFirstName', 'emergencyLastName', 'emergencyRelationship', 'emergencyPhone',
    'weight', 'height', 'evalWeight', 'evalHeight',
  ];

  const dataToShow = Object.fromEntries(
    Object.entries(data || {})
      .filter(([key]) => !keysToSkip.includes(key))
  );

  if (Object.keys(dataToShow).length === 0) {
    return <p className="text-sm text-muted-foreground">No hay datos adicionales del formulario para mostrar.</p>;
  }

  return (
    <div className="space-y-2 text-sm">
      {Object.entries(dataToShow).map(([key, value]) => (
        <p key={key}>
          <strong className="capitalize text-foreground">{key.replace(/_/g, ' ')}:</strong> {String(value)}
        </p>
      ))}
    </div>
  );

};

const CalculatedMacroindicesDisplay = ({
  calculatedIndices,
  age
}: {
  calculatedIndices: CalculatedMacroindices;
  age?: number;
}) => {
  const allDisplayItems = [
    { label: "IMC", value: calculatedIndices.imc?.value, unit: "kg/m²", classification: calculatedIndices.imc?.classification },
    { label: "Índice de Livi (IL)", value: calculatedIndices.livi },
    { label: "Índice de Röher (IR)", value: calculatedIndices.roher?.value, classification: calculatedIndices.roher?.classification },
    { label: "Índice Ponderal (IP)", value: calculatedIndices.ponderal },
    { label: "Índice de Bouchard (IB)", value: calculatedIndices.bouchard },
    { label: "Índice de Pignet (IP)", value: calculatedIndices.pignet?.value, classification: calculatedIndices.pignet?.classification },
    { label: "Índice cintura-cadera (ICC)", value: calculatedIndices.icc?.value, classification: calculatedIndices.icc?.classification },
    { label: "Índice perímetro de cintura (IPC)", value: calculatedIndices.ipc, unit: "cm" },
    { label: "Índice diámetro sagital umbilical (IDSU)", value: calculatedIndices.idsu, unit: "cm" },
    { label: "Índice cintura-estatura (ICE)", value: calculatedIndices.ice },
    { label: "Índice de distribución de grasa corporal (IDGC)", value: calculatedIndices.idgc },
    { label: "Índice de conicidad (IC)", value: calculatedIndices.icConicidad },
    { label: "Índice córmico (IC)", value: calculatedIndices.icCormico?.value, classification: calculatedIndices.icCormico?.classification },
    { label: "Índice acromio-iliaco (IAI)", value: calculatedIndices.iai?.value, classification: calculatedIndices.iai?.classification, interpretation: calculatedIndices.iai?.interpretation },
    { label: "Índice braquial (IB)", value: calculatedIndices.ibBraquial?.value, classification: calculatedIndices.ibBraquial?.classification, interpretation: calculatedIndices.ibBraquial?.interpretation },
    { label: "Longitud relativa miembro superior (LRMS)", value: calculatedIndices.lrms?.value, classification: calculatedIndices.lrms?.classification, interpretation: calculatedIndices.lrms?.interpretation },
    { label: "Índice de Manouvrier (IM)", value: calculatedIndices.imManouvrier?.value, classification: calculatedIndices.imManouvrier?.classification, },
    { label: "Longitud relativa miembro inferior (LRMI)", value: calculatedIndices.lrmi?.value, classification: calculatedIndices.lrmi?.classification, interpretation: calculatedIndices.lrmi?.interpretation },
    { label: "Índice crural (IC)", value: calculatedIndices.icCrural?.value, classification: calculatedIndices.icCrural?.classification },
    { label: "Índice intermembral (II)", value: calculatedIndices.iIntermembral },
    { label: "Índice musculo oseo (IMO)", value: calculatedIndices.iMusculoOseo },
    { label: "Índice adiposo muscular (IAM)", value: calculatedIndices.iAdiposoMuscular },

  ];

  const maturationIndices = [
    { label: "Índice de maduración", value: calculatedIndices.indiceMaduracion, interpretation: "" },
    { label: "Edad PHV", value: calculatedIndices.edadPhv, unit: "años" },
    { label: "CLAS", value: calculatedIndices.clasMaduracion, classification: calculatedIndices.clasMaduracion },
    { label: "Falta de crecimiento", value: calculatedIndices.faltaCm, unit: "cm" },
    { label: "Estatura adulta estimada", value: calculatedIndices.estaturaAdultaEst, unit: "cm" },
    { label: "Edad estimada talla adulta", value: calculatedIndices.edadEstimadaTallaAdulta, unit: "años" },
  ];

  const displayItems = age && age < 18 ? [...allDisplayItems, ...maturationIndices] : allDisplayItems;

  // Dividir en dos columnas equilibradas
  const mid = Math.ceil(displayItems.length / 2);
  const leftItems = displayItems.slice(0, mid);
  const rightItems = displayItems.slice(mid);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[leftItems, rightItems].map((column, idx) => (
          <div key={idx} className="space-y-2 border rounded-lg p-3 bg-muted/10 shadow-sm">
            {column.map(item => (
              <div key={item.label} className="flex justify-between items-start text-sm border-b pb-1 last:border-b-0">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-foreground">{item.label}:</span>

                  {item.interpretation && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-primary" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs text-sm p-2">
                        {item.interpretation}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                <div className="text-right">
                  {item.value !== null && item.value !== undefined
                    ? `${typeof item.value === 'number' ? item.value.toFixed(2) : item.value}${item.unit ? ` ${item.unit}` : ''}`
                    : <span className="text-muted-foreground italic">No calculable</span>
                  }
                  {item.classification && item.classification !== "No clasificable" && (
                    <span className="block text-xs text-muted-foreground">{item.classification}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </TooltipProvider>
  );
};


const CalculatedSomatotypeDisplay = ({ calculatedSomatotype }: { calculatedSomatotype: CalculatedSomatotype }) => {
  const displayItems = [
    { label: "Endomorfia", value: calculatedSomatotype.endomorfia, precision: 1 },
    { label: "Mesomorfia", value: calculatedSomatotype.mesomorfia, precision: 1 },
    { label: "Ectomorfia", value: calculatedSomatotype.ectomorfia, precision: 1 },
  ];

  return (
    <div className="space-y-3">
      {calculatedSomatotype.somatotypeString && (
        <div className="flex justify-between items-start text-sm p-2 border-b last:border-b-0">
          <span className="font-medium text-foreground">Somatotipo:</span>
          <span className="font-semibold text-green-700">{calculatedSomatotype.somatotypeString}</span>
        </div>
      )}
      {displayItems.map(item => (
        <div key={item.label} className="flex justify-between items-start text-sm p-2 border-b last:border-b-0">
          <span className="font-medium text-foreground">{item.label}:</span>
          <div className="text-right">
            {item.value !== null && item.value !== undefined
              ? item.value.toFixed(item.precision || 1)
              : <span className="text-muted-foreground italic">No calculable</span>
            }
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground pt-2">Nota: Los componentes del somatotipo se calculan según las fórmulas de Heath-Carter.</p>
    </div>
  );
};


export default function EvaluationDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { getEvaluationRecordById, updateEvaluationRecord, deleteEvaluationRecord } = useEvaluationContext();
  const { toast } = useToast();
  const { selectedRole } = useAuth();

  const [record, setRecord] = useState<EvaluationRecord | null | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showNoAssignedTestDialog, setShowNoAssignedTestDialog] = useState(false);
  const [showChangeAssignedTestDialog, setShowChangeAssignedTestDialog] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isDownloadingChart, setIsDownloadingChart] = useState(false);

  const somatochartRef = useRef<HTMLDivElement>(null);
  const phantomZScoreTableRef = useRef<HTMLDivElement>(null);
  const kerrBodyCompChartRef = useRef<HTMLDivElement>(null);

  async function enviarReportePorCorreo(record: any) {
    try {
      setIsGeneratingPdf(true);

      // Pasar las referencias actuales de los gráficos
      const chartsRefs = {
        perfilZRef: phantomZScoreTableRef.current,
        kerrChartRef: kerrBodyCompChartRef.current,
        somatochartRef: somatochartRef.current
      };

      // Generar el PDF y obtener el Blob
      const pdfBlob = await generarReporteToBlob(record, chartsRefs);

      // Crear FormData para enviar el PDF
      const formData = new FormData();
      formData.append('pdf', pdfBlob, `reporte_${record.participantData?.id_number || record.id}.pdf`);
      formData.append('participantName', `${record.participantData?.first_name} ${record.participantData?.last_name}`);
      formData.append('participantEmail', record.participantData?.email || '');
      formData.append('evaluationId', record.id);

      // Enviar el correo
      const response = await fetch('/api/send-email', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Correo enviado",
          description: "El reporte PDF ha sido enviado por correo electrónico."
        });
      } else {
        throw new Error(result.error || 'Error al enviar el correo');
      }
    } catch (error) {
      console.error('Error al enviar por correo:', error);
      toast({
        title: "Error al enviar correo",
        description: "No se pudo enviar el reporte por correo electrónico.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  }


  useEffect(() => {
    if (id) {
      const foundRecord = getEvaluationRecordById(id);
      setRecord(foundRecord);
    }
  }, [id, getEvaluationRecordById, updateEvaluationRecord]);

  const handleDelete = async () => {
    if (!record) return;
    setIsDeleting(true);
    const result = await deleteEvaluationRecord(record.id);
    if (result.success) {
      toast({ title: "Registro Eliminado", description: "La evaluación ha sido eliminada." });
      router.push("/evaluations");
    } else {
      toast({ title: "Error al Eliminar", description: result.message || "No se pudo eliminar el registro.", variant: "destructive" });
    }
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  const handleDownloadChartAsImage = async (chartRef: React.RefObject<HTMLDivElement>, filename: string) => {
    console.log(`[handleDownloadChartAsImage] Attempting to download: ${filename}`);
    if (!chartRef.current) {
      console.error(`[handleDownloadChartAsImage] chartRef.current is null for ${filename}`);
      toast({ title: "Error de Referencia", description: "No se pudo encontrar el elemento del gráfico para descargar.", variant: "destructive" });
      return;
    }

    const elementToCapture = chartRef.current;
    console.log(`[handleDownloadChartAsImage] Element to capture for ${filename}:`, elementToCapture);
    console.log(`[handleDownloadChartAsImage] Element dimensions - offsetWidth: ${elementToCapture.offsetWidth}, offsetHeight: ${elementToCapture.offsetHeight}, scrollWidth: ${elementToCapture.scrollWidth}, scrollHeight: ${elementToCapture.scrollHeight}`);

    if (elementToCapture.offsetWidth === 0 || elementToCapture.offsetHeight === 0) {
      console.error(`[handleDownloadChartAsImage] Element ${filename} has zero offset dimensions. It might not be visible or rendered correctly.`);
      toast({ title: "Error de Elemento", description: `El elemento del gráfico "${filename}" no tiene dimensiones visibles.`, variant: "destructive" });
      return;
    }

    setIsDownloadingChart(true);
    toast({ title: "Generando Imagen...", description: "Esto puede tardar un momento." });

    try {
      const canvas = await html2canvas(elementToCapture, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: true,
        onclone: (document) => {
          Array.from(document.getElementsByTagName('svg')).forEach(svg => {
            svg.setAttribute('font-family', 'PT Sans, sans-serif');
          });
        }
      });

      console.log(`[handleDownloadChartAsImage] Canvas for ${filename} dimensions: ${canvas.width}x${canvas.height}`);
      if (canvas.width === 0 || canvas.height === 0) {
        console.error(`[handleDownloadChartAsImage] Captured canvas for ${filename} has 0 dimensions.`);
        toast({ title: "Error de Captura", description: `La imagen generada para "${filename}" está vacía.`, variant: "destructive" });
        setIsDownloadingChart(false);
        return;
      }

      const dataUrl = canvas.toDataURL('image/png', 0.9);
      console.log(`[handleDownloadChartAsImage] Generated dataUrl for ${filename} (first 100 chars): ${dataUrl.substring(0, 100)}`);

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log(`[handleDownloadChartAsImage] Download initiated for ${filename}`);
      toast({ title: "Imagen Descargada", description: `${filename} se ha guardado.` });
    } catch (error) {
      console.error(`[handleDownloadChartAsImage] Error downloading chart ${filename}:`, error);
      toast({ title: "Error de Descarga", description: `No se pudo generar la imagen del gráfico "${filename}". Detalles: ${(error as Error).message}`, variant: "destructive" });
    } finally {
      setIsDownloadingChart(false);
    }
  };

  const participant = record?.participantData;
  const participantName = participant ?
    (participant.first_name && participant.last_name ? `${participant.first_name} ${participant.last_name}` : (participant.first_name || participant.last_name || "Participante Desconocido"))
    : "Cargando...";
  const evaluationModeLabels: Record<string, string> = {
    "2C_Slaughter": "2 Componentes - Fórmula Slaughter",
    "2C_DurninWomersley": "2 Componentes - Fórmula Durnin - Womersley",
    "2C_Faulkner": "2 Componentes - Fórmula Faulkner",
    "2C_Carter": "2 Componentes - Fórmula Carter",
    "2C_Weltman": "2 Componentes - Weltman",
    "MULT_Express": "Multicomponente - Express",
    "MULT_Restringido": "Multicomponente - Restringido",
    "MULT_5Componentes": "Multicomponente - 5 Componentes",
    "MULT_Completo": "Multicomponente - Completo",
  };

  const getEvaluationModeLabel = (record: EvaluationRecord) => {
    const mode = String(record.evaluation_mode || "");

    if (mode && evaluationModeLabels[mode]) {
      return evaluationModeLabels[mode];
    }

    return record.evaluation_mode || "";
  };

  const getFormTypeLabel = (formType?: EvaluationRecord['form_type']) => {
    const labels: Record<string, string> = {
      "TAMIZAJE": "Tamizaje Preparticipativo",
      "PAR-Q": "PAR-Q",
      "PAQ-C": "PAQ-C",
      "PAQ-A": "PAQ-A",
      "IPAQ": "IPAQ",
    };

    return labels[String(formType || "")] || String(formType || "Sin test registrado");
  };

  const getTestRoute = (record: EvaluationRecord) => {
    const mode = String(record.evaluation_mode || "");

    const routes: Record<string, string> = {
      "2C_Slaughter": `/assistant/tests/2componentes/ninos/${record.id}`,
      "2C_DurninWomersley": `/assistant/tests/2componentes/adultos/${record.id}`,
      "2C_Faulkner": `/assistant/tests/2componentes/deportistas/faulkner/${record.id}`,
      "2C_Carter": `/assistant/tests/2componentes/deportistas/carter/${record.id}`,
      "2C_Weltman": `/assistant/tests/2componentes/obesos/${record.id}`,
      "MULT_Express": `/assistant/tests/express/${record.id}`,
      "MULT_Restringido": `/assistant/tests/restringido/${record.id}`,
      "MULT_5Componentes": `/assistant/tests/5componentes/${record.id}`,
      "MULT_Completo": `/assistant/tests/completo/${record.id}`,
    };

    // Mantiene la función original del botón:
    // si no encuentra una ruta específica, envía al test completo.
    return routes[mode] || `/assistant/tests/completo/${record.id}`;
  };


  if (record === undefined) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  if (record === null) {
    return (
      <AuthWrapper allowedRoles={["Evaluator"]}>
        <Card className="shadow-lg">
          <CardHeader><CardTitle>Registro no Encontrado</CardTitle></CardHeader>
          <CardContent><p>No se pudo encontrar el registro de evaluación solicitado.</p>
            <Button variant="outline" asChild className="mt-4">
              <Link href="/evaluations">
                <ArrowLeft className="mr-2 h-4 w-4" />Volver a Evaluaciones
              </Link>
            </Button>
          </CardContent>
        </Card>
      </AuthWrapper>
    );
  }

  const submissionDateObject = record.submission_date ? new Date(record.submission_date) : null;
  const participantDobObject = participant?.dob ? new Date(participant.dob) : null;
  const testRoute = getTestRoute(record);
  const completeTestRoute = `/assistant/tests/completo/${record.id}`;
  const assignTestRoute = `/evaluations/${record.id}/assign`;
  const hasAssignedTest = Boolean(String(record.evaluation_mode || "").trim());
  const tipoPruebaLabel = getEvaluationModeLabel(record);
  const testRealizadoLabel = getFormTypeLabel(record.form_type);

  const calculatedMacroindices = record.test_results?.calculatedIndices || record.test_results?.macroindices?.calculatedIndices;
  const zScoreProfile = calculatedMacroindices?.zScoreProfile;

  const calculatedComposicion = record.test_results?.calculatedComposicion || record.test_results?.composicionCorporal?.calculatedComposicion;
  const categoriaComposicion = record.test_results?.calculatedComposicion?.categoriaCalculo || record.test_results?.composicionCorporal?.calculatedComposicion?.categoriaCalculo;
  const kerrBodyCompData = record.test_results?.calculatedComposicion?.kerrComponents || record.test_results?.composicionCorporal?.calculatedComposicion?.kerrComponents;
  const calculatedSomatotypeData = record.test_results?.calculatedSomatotype || record.test_results?.somatotipo?.calculatedSomatotype;

  const kerrTableData = kerrBodyCompData ? [
    { name: "Masa Muscular", P: kerrBodyCompData.masaMuscular.porcentaje, MR: kerrBodyCompData.masaMuscular.masaKg },
    { name: "Masa Adiposa", P: kerrBodyCompData.masaAdiposa.porcentaje, MR: kerrBodyCompData.masaAdiposa.masaKg },
    { name: "Masa Ósea", P: kerrBodyCompData.masaOsea.porcentaje, MR: kerrBodyCompData.masaOsea.masaKg },
    { name: "Masa Piel", P: kerrBodyCompData.masaPiel.porcentaje, MR: kerrBodyCompData.masaPiel.masaKg },
    { name: "Masa Residual", P: kerrBodyCompData.masaResidual.porcentaje, MR: kerrBodyCompData.masaResidual.masaKg },
  ] : [];

  const restringidoBodyCompData = record.test_results?.calculatedComposicion4Componentes

  const restringidoTableData = restringidoBodyCompData ? [
    { name: "Masa Muscular", P: restringidoBodyCompData.porcentajeMuscular, MR: restringidoBodyCompData.masaMuscular },
    { name: "Masa Adiposa", P: restringidoBodyCompData.porcentajeAdiposa, MR: restringidoBodyCompData.masaAdiposa },
    { name: "Masa Ósea", P: restringidoBodyCompData.porcentajeOsea, MR: restringidoBodyCompData.masaOsea },
    { name: "Masa Residual", P: restringidoBodyCompData.porcentajeResidual, MR: restringidoBodyCompData.masaResidual },
  ] : [];

  const expressBodyCompData = record.test_results?.calculatedComposicion2Componentes

  const expressTableData = expressBodyCompData ? [
    { name: "Masa Muscular", MR: expressBodyCompData.masaMuscular },
    { name: "Masa Adiposa", MR: expressBodyCompData.masaAdiposa },
  ] : [];



    return (
      <AuthWrapper allowedRoles={["Evaluator", "Assistant"]}>
        <div className="mx-auto -mt-6 w-full max-w-[1700px] space-y-3 px-3 pt-0 pb-8 sm:-mt-8 sm:px-4 lg:-mt-10">
        {/* Encabezado compacto: Volver, detalles y test realizado en la misma fila */}
        <div className="-mx-3 border-b border-border/70 bg-background px-3 pt-3 pb-2 shadow-sm sm:-mx-4 sm:px-4 print:mx-0 print:bg-background print:px-0 print:shadow-none">
          <div className="grid grid-cols-1 gap-2 xl:grid-cols-[220px_minmax(0,1fr)_380px] xl:items-center">
            <div className="print:hidden">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/evaluations")}
                className="h-10 w-full rounded-xl border-pink-500 px-5 text-base font-semibold text-pink-600 hover:bg-pink-50 xl:w-auto xl:min-w-[135px]"
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Volver
              </Button>
            </div>

            <div className="space-y-1">
              <CardTitle className="text-2xl font-headline leading-tight text-primary sm:text-3xl">
                Detalles de Evaluación: {participantName}
              </CardTitle>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="inline-flex items-center rounded-full border bg-background px-3 py-0.5 text-muted-foreground">
                  ID de Registro: <span className="ml-1 font-medium text-foreground">{record.id}</span>
                </span>
                <span className="inline-flex items-center rounded-full border bg-background px-3 py-0.5 text-muted-foreground">
                  Estado: <span className="ml-1 font-medium text-foreground">{record.status || "Sin estado"}</span>
                </span>
              </div>
            </div>

            <div className="rounded-xl border bg-background/90 px-4 py-2 shadow-sm xl:justify-self-stretch">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Test realizado</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{testRealizadoLabel}</p>
            </div>
          </div>
        </div>

        <Card className="overflow-hidden rounded-2xl border-border/60 shadow-md" id="evaluationDetailCard">
          <CardContent className="px-4 pt-3 pb-5 sm:px-5">
            <div className="grid grid-cols-1 gap-3 2xl:grid-cols-[280px_minmax(0,1fr)_320px] xl:grid-cols-[260px_minmax(0,1fr)]">
              <aside className="print:hidden">
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
                    <div className="border-b bg-muted/30 px-5 py-4">
                      <p className="text-lg font-semibold text-foreground">Menú</p>
                      <p className="text-sm text-muted-foreground">Acciones del reporte</p>
                    </div>

                    <div className="space-y-3 p-4">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={async () => generarReporte(
                          record,
                          {
                            perfilZRef: phantomZScoreTableRef.current,
                            kerrChartRef: kerrBodyCompChartRef.current,
                            somatochartRef: somatochartRef.current
                          }
                        )}
                        disabled={isGeneratingPdf}
                        className="h-12 w-full justify-start rounded-2xl px-4"
                      >
                        {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Descargar PDF
                      </Button>

                      <Button
                        variant="default"
                        size="sm"
                        onClick={async () => generarReporteExcel(
                          record,
                          {
                            perfilZRef: phantomZScoreTableRef.current,
                            kerrChartRef: kerrBodyCompChartRef.current,
                            somatochartRef: somatochartRef.current
                          }
                        )}
                        disabled={isGeneratingPdf}
                        className="h-12 w-full justify-start rounded-2xl px-4"
                      >
                        {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        Descargar Excel
                      </Button>

                      <Button
                        variant="default"
                        size="sm"
                        onClick={async () => await enviarReportePorCorreo(record)}
                        disabled={isGeneratingPdf}
                        className="h-12 w-full justify-start rounded-2xl px-4"
                      >
                        {isGeneratingPdf ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Enviar por Correo
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-3xl border bg-muted/20 p-4 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Información rápida</p>
                    <div className="mt-3 space-y-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Participante</p>
                        <p className="font-semibold text-foreground">{participantName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Estado</p>
                        <p className="font-semibold text-foreground">{record.status || "Sin estado"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Test realizado</p>
                        <p className="font-semibold text-foreground">{testRealizadoLabel}</p>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting || isGeneratingPdf}
                    className="h-12 w-full justify-start rounded-2xl border-destructive px-4 text-destructive hover:bg-destructive/10"
                  >
                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                    Eliminar evaluación
                  </Button>
                </div>
              </aside>

              <main className="space-y-3">
                <section id="participantInfoSection" className="rounded-2xl border bg-muted/20 p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Información del Participante</h3>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-xl border bg-background p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Nombre completo</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{participantName}</p>
                </div>
                <div className="rounded-xl border bg-background p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Identificación</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{participant?.id_number || 'N/A'}</p>
                </div>
                <div className="rounded-xl border bg-background p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Sexo</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{participant?.sex || 'N/A'}</p>
                </div>
                <div className="rounded-xl border bg-background p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Fecha de nacimiento</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{participantDobObject && isValid(participantDobObject) ? format(participantDobObject, "PPP", { locale: es }) : 'N/A'}</p>
                </div>
                <div className="rounded-xl border bg-background p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Edad</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{typeof participant?.calculated_age === 'number' ? participant.calculated_age.toFixed(1) : 'N/A'}</p>
                </div>
                <div className="rounded-xl border bg-background p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Términos aceptados</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{record.accepted_terms ? 'Sí' : 'No'}</p>
                </div>
                <div className="rounded-xl border bg-background p-4 shadow-sm md:col-span-2 xl:col-span-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Correo electrónico</p>
                  <p className="mt-1 break-all text-sm font-semibold text-foreground">{participant?.email || 'N/A'}</p>
                </div>
              </div>
            </section>

            <section id="formDataSection" className="rounded-2xl border bg-muted/20 p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Datos del Formulario ({record.form_type})</h3>
              </div>

              <div className="rounded-xl border bg-background p-4 shadow-sm">
                <RenderFormData data={record.form_data} formType={record.form_type} />

                {(record.paq_score !== undefined && record.paq_score !== null) ||
                 (record.ipaq_met_minutes !== undefined && record.ipaq_met_minutes !== null) ||
                 (record.parq_requires_consultation !== undefined && record.parq_requires_consultation !== null) ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {record.paq_score !== undefined && record.paq_score !== null && (
                      <div className="rounded-lg border bg-muted/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Puntaje PAQ</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{record.paq_score} <span className="font-normal text-muted-foreground">({record.paq_classification})</span></p>
                      </div>
                    )}
                    {record.ipaq_met_minutes !== undefined && record.ipaq_met_minutes !== null && (
                      <div className="rounded-lg border bg-muted/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">IPAQ MET-min/sem</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{record.ipaq_met_minutes} <span className="font-normal text-muted-foreground">({record.ipaq_classification})</span></p>
                      </div>
                    )}
                    {record.parq_requires_consultation !== undefined && record.parq_requires_consultation !== null && (
                      <div className="rounded-lg border bg-muted/20 p-3">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">PAR-Q Requiere Consulta</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{record.parq_requires_consultation ? 'Sí' : 'No'}</p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </section>

            {calculatedMacroindices && (
              <section className="pt-2" id="macroindicesResultsSection">
                <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center">
                  <Calculator className="mr-2 h-5 w-5 text-primary" />
                  Resultados Calculados de Macroíndices
                </h3>
                <CalculatedMacroindicesDisplay
                  calculatedIndices={calculatedMacroindices}
                  age={participant?.calculated_age}
                />
              </section>
            )}

            {zScoreProfile && zScoreProfile.length > 0 && (
              <section className="pt-3" id="phantomZScoreTableSectionContainer">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                  {/* TABLA DE PERFIL Z - MITAD IZQUIERDA */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-foreground flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-indigo-600">
                          <path d="M3 3v18h18" />
                          <path d="m19 9-5 5-4-4-3 3" />
                        </svg>
                        Perfil de Valores Z (Phantom)
                      </h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadChartAsImage(phantomZScoreTableRef, `perfil_z_scores_${record.participantData?.id_number || record.id}.png`)}
                        disabled={isDownloadingChart || !phantomZScoreTableRef.current}
                        className="print:hidden"
                      >
                        {isDownloadingChart ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Descargar Tabla (PNG)
                      </Button>
                    </div>
                    <div ref={phantomZScoreTableRef} className="border rounded-lg overflow-hidden bg-white">
                      <PhantomZScoreTable zScoreProfile={zScoreProfile} />
                    </div>
                  </div>

                  {/* COMPOSICIÓN CORPORAL - MITAD DERECHA */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center">
                      <PieChartIcon className="mr-2 h-5 w-5 text-blue-600" />
                      Composición Corporal
                    </h3>

                    {/* Kerr Body Composition */}
                    {kerrBodyCompData && (
                      <div className="space-y-4">
                        <div className="border rounded-md p-2 sm:p-4 bg-card">
                          <div ref={kerrBodyCompChartRef}>
                            <BodyCompositionPieChart kerrData={kerrBodyCompData} />
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="px-2">Componente</TableHead>
                                <TableHead className="text-right px-2">%</TableHead>
                                <TableHead className="text-right px-2">Masa (kg)</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {kerrTableData.map((item) => (
                                <TableRow key={item.name}>
                                  <TableCell className="font-medium px-2 text-sm">{item.name}</TableCell>
                                  <TableCell className="text-right px-2 text-sm">
                                    {typeof item.P === 'number' ? item.P.toFixed(2) : 'N/A'}%
                                  </TableCell>
                                  <TableCell className="text-right px-2 text-sm">
                                    {typeof item.MR === 'number' ? item.MR.toFixed(2) : 'N/A'}
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="font-semibold bg-muted/50">
                                <TableCell className="px-2">Masa Total</TableCell>
                                <TableCell className="text-right px-2">
                                  {kerrTableData.reduce((sum, item) => sum + (item.P || 0), 0).toFixed(2)}%
                                </TableCell>
                                <TableCell className="text-right px-2">
                                  {typeof kerrBodyCompData.masaTotalKg === 'number' ? kerrBodyCompData.masaTotalKg.toFixed(2) : 'N/A'}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* 4 Componentes Body Composition */}
                    {restringidoBodyCompData && !kerrBodyCompData && (
                      <div className="space-y-4">
                        <div className="border rounded-md p-2 sm:p-4 bg-card">
                          <div ref={kerrBodyCompChartRef}>
                            <BodyComposition4CPieChart data4C={restringidoBodyCompData} />
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="px-2">Componente</TableHead>
                                <TableHead className="text-right px-2">%</TableHead>
                                <TableHead className="text-right px-2">Masa (kg)</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {restringidoTableData.map((item) => (
                                <TableRow key={item.name}>
                                  <TableCell className="font-medium px-2 text-sm">{item.name}</TableCell>
                                  <TableCell className="text-right px-2 text-sm">
                                    {typeof item.P === 'number' ? item.P.toFixed(2) : 'N/A'}%
                                  </TableCell>
                                  <TableCell className="text-right px-2 text-sm">
                                    {typeof item.MR === 'number' ? item.MR.toFixed(2) : 'N/A'}
                                  </TableCell>
                                </TableRow>
                              ))}
                              <TableRow className="font-semibold bg-muted/50">
                                <TableCell className="px-2">Masa Total</TableCell>
                                <TableCell className="text-right px-2">
                                  {restringidoTableData.reduce((sum, item) => sum + (item.P || 0), 0).toFixed(2)}%
                                </TableCell>
                                <TableCell className="text-right px-2">
                                  {typeof restringidoBodyCompData.masaTotal === 'number' ? restringidoBodyCompData.masaTotal?.toFixed(2) : 'N/A'}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* Express Body Composition */}
                    {expressBodyCompData && !kerrBodyCompData && !restringidoBodyCompData && (
                      <div className="space-y-4">
                        <div className="border rounded-md p-2 sm:p-4 bg-card">
                          <div ref={kerrBodyCompChartRef}>
                            <BodyCompositionExpressChart resultados={expressBodyCompData} />
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="px-2">Componente</TableHead>
                                <TableHead className="text-right px-2">Masa (kg)</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {expressTableData.map((item) => (
                                <TableRow key={item.name}>
                                  <TableCell className="font-medium px-2 text-sm">{item.name}</TableCell>
                                  <TableCell className="text-right px-2 text-sm">
                                    {typeof item.MR === 'number' ? item.MR.toFixed(2) : 'N/A'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </section>
            )}

            {calculatedSomatotypeData && (
              <section className="pt-4 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                  {/* --- Panel de Resultados --- */}
                  <section
                    id="somatotypeResultsSection"
                    className="p-6 rounded-2xl border shadow-sm bg-card flex flex-col justify-between"
                  >
                    <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                      <Shapes className="mr-2 h-6 w-6 text-green-700" />
                      Resultados Calculados de Somatotipo
                    </h3>

                    <CalculatedSomatotypeDisplay calculatedSomatotype={calculatedSomatotypeData} />

                    <p className="text-xs text-muted-foreground mt-4 border-t pt-2">
                      Nota: Los componentes del somatotipo se calculan según las fórmulas de Heath-Carter.
                    </p>
                  </section>

                  {/* --- Panel de Somatocarta --- */}
                  <section
                    id="somatochartSectionContainer"
                    className="p-6 rounded-2xl border shadow-sm bg-card"
                  >
                    <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
                      <BarChart3 className="mr-2 h-6 w-6 text-green-700" />
                      Somatocarta
                    </h3>

                    <div
                      className="border rounded-xl p-3 sm:p-4 bg-background flex items-center justify-center"
                      ref={somatochartRef}
                    >
                      <Somatochart calculatedSomatotype={calculatedSomatotypeData} />
                    </div>
                  </section>

                </div>
              </section>
            )}

              </main>

              <aside className="print:hidden xl:col-span-2 2xl:col-span-1">
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
                    <div className="border-b bg-muted/30 px-5 py-5">
                      <h3 className="text-2xl font-headline font-semibold text-foreground">Tipos de pruebas</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Seleccione una categoría</p>
                    </div>

                    <div className="space-y-4 p-4">
                      <Button
                        type="button"
                        variant="default"
                        className="h-12 w-full justify-start rounded-2xl px-4 shadow-sm"
                        onClick={() => {
                          if (hasAssignedTest) {
                            setShowChangeAssignedTestDialog(true);
                            return;
                          }

                          router.push(assignTestRoute);
                        }}
                      >
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Ir a asignar su tipo de prueba
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-3xl border bg-card shadow-sm">
                    <div className="border-b bg-muted/30 px-5 py-5">
                      <h3 className="text-2xl font-headline font-semibold text-foreground">Ir a realizar prueba</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Realice la prueba que ya fue asignada.</p>
                    </div>

                    <div className="space-y-4 p-4">
                      <div className="rounded-2xl border bg-muted/30 p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tipo de prueba</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {tipoPruebaLabel || "Sin prueba asignada"}
                        </p>
                      </div>

                      <Button
                        type="button"
                        variant="default"
                        className="h-12 w-full justify-start rounded-2xl px-4 shadow-sm"
                        onClick={() => {
                          if (!hasAssignedTest) {
                            setShowNoAssignedTestDialog(true);
                            return;
                          }

                          router.push(testRoute);
                        }}
                      >
                        <PlayCircle className="mr-2 h-4 w-4" />
                        Realizar prueba asignada
                      </Button>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </CardContent>
          <CardFooter className="border-t bg-muted/20 px-5 py-3">
            <p className="text-xs text-muted-foreground">
              Enviado el: {submissionDateObject && isValid(submissionDateObject) ? format(submissionDateObject, "PPPp", { locale: es }) : 'Fecha no disponible'}
              {record.assistant_notes && <span className="block mt-1">Última nota del asistente: {record.assistant_notes}</span>}
            </p>
          </CardFooter>
        </Card>

        <AlertDialog open={showChangeAssignedTestDialog} onOpenChange={setShowChangeAssignedTestDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ya tiene prueba asignada</AlertDialogTitle>
              <AlertDialogDescription>
                Este participante ya tiene una prueba asignada. ¿Desea cambiarla?
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="gap-2 sm:gap-2">
              <AlertDialogCancel onClick={() => setShowChangeAssignedTestDialog(false)}>
                Cancelar
              </AlertDialogCancel>

              <AlertDialogAction
                type="button"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => router.push(assignTestRoute)}
              >
                Listo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showNoAssignedTestDialog} onOpenChange={setShowNoAssignedTestDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>No hay prueba asignada</AlertDialogTitle>
              <AlertDialogDescription>
                Este participante todavía no tiene un tipo de prueba asignado.
                Puede continuar directamente con la prueba completa o ir primero a asignar una prueba específica.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <AlertDialogFooter className="gap-2 sm:gap-2">
              <AlertDialogCancel onClick={() => setShowNoAssignedTestDialog(false)}>
                Cancelar
              </AlertDialogCancel>

              <AlertDialogAction
                type="button"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => router.push(completeTestRoute)}
              >
                Listo
              </AlertDialogAction>

              <AlertDialogAction
                type="button"
                className="bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => router.push(assignTestRoute)}
              >
                Ir a asignar prueba
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>¿Está seguro?</AlertDialogTitle><AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente el registro de evaluación.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteConfirm(false)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className={buttonVariants({ variant: "destructive" })}>
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AuthWrapper>
  );
}