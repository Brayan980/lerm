import ExcelJS from "exceljs";
import html2canvas from "html2canvas";
import { EvaluationMode } from "./types";

export async function generarReporteExcel(
  record: any,
  chartsRefs: {
    perfilZRef?: HTMLDivElement | null;
    kerrChartRef?: HTMLDivElement | null;
    somatochartRef?: HTMLDivElement | null;
  }
) {
  const wb = new ExcelJS.Workbook();

  const participantData = record?.participantData ?? {};
  const formData = record?.form_data ?? {};
  const macro = record?.test_results?.calculatedIndices;
  const comp = record?.test_results?.calculatedComposicion;
  const somato = record?.test_results?.calculatedSomatotype;

  const formatNumber = (value: any, decimals = 2) => {
    const num = Number(value);
    return Number.isFinite(num) ? num.toFixed(decimals) : "N/A";
  };

  // ================================
  // 1. INFORMACIÓN DEL PARTICIPANTE
  // ================================
  const wsInfo = wb.addWorksheet("Información Personal");

  let participantInfoData: (string | number | null)[][] = [];

  const addRowIfValueExists = (
    label: string,
    value: string | number | null | undefined
  ): void => {
    if (value !== null && value !== undefined && value !== "") {
      participantInfoData.push([label, value]);
    }
  };

  participantInfoData.push(["INFORMACIÓN DEL PARTICIPANTE"]);

  const fullName = `${participantData.first_name || ""} ${
    participantData.last_name || ""
  }`.trim();

  addRowIfValueExists("Nombre", fullName);
  addRowIfValueExists("Edad", formatNumber(participantData.calculated_age, 1));
  addRowIfValueExists("Sexo", participantData.sex);
  addRowIfValueExists("ID", participantData.id_number);

  participantInfoData.push([]);

  if (
    record?.paq_score ||
    record?.paq_classification ||
    record?.ipaq_met_minutes ||
    record?.ipaq_classification ||
    record?.parq_requires_consultation !== undefined
  ) {
    participantInfoData.push(["ACTIVIDAD FÍSICA"]);
  }

  addRowIfValueExists("PAQ MET-min/sem", record?.paq_score);
  addRowIfValueExists("Estado PAQ", record?.paq_classification);
  addRowIfValueExists("IPAQ MET-min/sem", record?.ipaq_met_minutes);
  addRowIfValueExists("Estado IPAQ", record?.ipaq_classification);

  if (
    record?.parq_requires_consultation !== undefined &&
    record?.parq_requires_consultation !== null
  ) {
    const parqValue = `Requiere consulta?: ${
      record.parq_requires_consultation ? "Sí" : "No"
    }`;
    participantInfoData.push(["PAR-Q", parqValue]);
  }

  addRowIfValueExists("Tamizaje: Revisión médica previa", formData?.revision);
  addRowIfValueExists("Tamizaje: Intensidad sugerida", formData?.intensidad);

  wsInfo.addRows(participantInfoData);

  // ================================
  // 2. MACROÍNDICES
  // ================================
  const wsMacro = wb.addWorksheet("Macroíndices");
  wsMacro.addRow(["Macroíndice", "Valor", "Clasificación"]);

  let macroData: (string | number)[][] = [
    [
      "IMC",
      formatNumber(macro?.imc?.value),
      macro?.imc?.classification || "",
    ],
    ["ICC", formatNumber(macro?.icc?.value), ""],
    ["ICE", formatNumber(macro?.ice), ""],
    ["IDGC", formatNumber(macro?.idgc), ""],
    ["IC Conicidad", formatNumber(macro?.icConicidad), ""],
    ["Índice de Röher", formatNumber(macro?.roher?.value), ""],
    ["Índice de Livi", formatNumber(macro?.livi), ""],
    [
      "Pignet",
      formatNumber(macro?.pignet?.value),
      macro?.pignet?.classification || "",
    ],
    [
      "IAI",
      formatNumber(macro?.iai?.value),
      macro?.iai?.classification || "",
    ],
    [
      "IB",
      formatNumber(macro?.ibBraquial?.value),
      macro?.ibBraquial?.classification || "",
    ],
    [
      "LRMS",
      formatNumber(macro?.lrms?.value),
      macro?.lrms?.classification || "",
    ],
    [
      "LRMI",
      formatNumber(macro?.lrmi?.value),
      macro?.lrmi?.classification || "",
    ],
  ];

  const macroDataExtra: (string | number)[][] = [
    ["Índice de maduración", macro?.indiceMaduracion ?? "N/A", ""],
    ["Edad PHV (años)", macro?.edadPhv ?? "N/A", ""],
    ["CLAS", macro?.clasMaduracion ?? "N/A", ""],
    ["Falta de crecimiento (cm)", macro?.faltaCm ?? "N/A", ""],
    ["Estatura adulta estimada (cm)", macro?.estaturaAdultaEst ?? "N/A", ""],
    [
      "Edad estimada de la talla adulta",
      macro?.edadEstimadaTallaAdulta ?? "N/A",
      "",
    ],
  ];

  const evaluationMode = record?.evaluation_mode as EvaluationMode | undefined;
  const age = Number(participantData?.calculated_age);

  if (
    Number.isFinite(age) &&
    age < 18 &&
    evaluationMode?.startsWith("MULT") &&
    evaluationMode !== "MULT_Express"
  ) {
    macroData = [...macroData, ...macroDataExtra];
  }

  wsMacro.addRows(macroData);

  // ================================
  // 3. COMPOSICIÓN CORPORAL + GRÁFICO KERR
  // ================================
  const wsComp = wb.addWorksheet("Composición Corporal");

  wsComp.addRow(["Componente", "Masa (kg)", "Porcentaje"]);
  wsComp.addRows([
    ["Masa Grasa", formatNumber(comp?.masaGrasaKg), ""],
    ["Masa Ósea", formatNumber(comp?.masaOseaKg), ""],
    ["Masa Muscular Esquelética", formatNumber(comp?.masaMuscularEsqueleticaKg), ""],
  ]);

  if (chartsRefs.kerrChartRef) {
    const canvas = await html2canvas(chartsRefs.kerrChartRef);
    const imgData = canvas.toDataURL("image/png");
    const imageId = wb.addImage({ base64: imgData, extension: "png" });

    wsComp.addImage(imageId, {
      tl: { col: 0, row: 8 },
      ext: { width: 500, height: 300 },
    });
  }

  // ================================
  // 4. SOMATOTIPO + SOMATOCARTA
  // ================================
  const wsSomato = wb.addWorksheet("Somatotipo");

  wsSomato.addRows([
    ["Endomorfia", formatNumber(somato?.endomorfia, 1)],
    ["Mesomorfia", formatNumber(somato?.mesomorfia, 1)],
    ["Ectomorfia", formatNumber(somato?.ectomorfia, 1)],
  ]);

  if (chartsRefs.somatochartRef) {
    const canvas = chartsRefs.somatochartRef.querySelector("canvas");

    if (canvas) {
      const imgData = canvas.toDataURL("image/png");
      const imageId = wb.addImage({
        base64: imgData,
        extension: "png",
      });

      wsSomato.addImage(imageId, {
        tl: { col: 0, row: 6 },
        ext: { width: 400, height: 300 },
      });
    }
  }

  // ================================
  // 5. PERFIL Z EN HOJA SEPARADA
  // ================================
  if (chartsRefs.perfilZRef) {
    const wsPerfil = wb.addWorksheet("Perfil Z");
    const canvas = await html2canvas(chartsRefs.perfilZRef);
    const imgData = canvas.toDataURL("image/png");
    const imageId = wb.addImage({ base64: imgData, extension: "png" });

    wsPerfil.addImage(imageId, {
      tl: { col: 0, row: 1 },
      ext: { width: 600, height: 300 },
    });
  }

  // ================================
  // 6. DESCARGA
  // ================================
  const buffer = await wb.xlsx.writeBuffer();

  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `Reporte_${participantData?.last_name || "LERM"}.xlsx`;
  a.click();

  URL.revokeObjectURL(url);
}