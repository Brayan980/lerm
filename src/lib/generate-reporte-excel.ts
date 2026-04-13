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

  // ================================
  // 1. INFORMACIÓN DEL PARTICIPANTE
  // ================================
  const wsInfo = wb.addWorksheet("Información Personal");

  // Variable let para construir la data dinámicamente
let participantInfoData: (string | number | null)[][] = [];

// === FUNCIÓN AUXILIAR ===
// Para agregar una fila al arreglo solo si el valor existe (no es null, undefined, o string vacío)
const addRowIfValueExists = (label: string, value: string | number | null | undefined): void => {
    // Verificamos que el valor no sea null, undefined, ni una cadena vacía
    if (value !== null && value !== undefined && value !== "") {
        // Si el valor es un número, lo convertimos a string para ser consistente si es necesario, 
        // pero para hojas de cálculo a menudo no es necesario, lo dejamos como está.
        participantInfoData.push([label, value]);
    }
};

// === INFORMACIÓN DEL PARTICIPANTE ===
participantInfoData.push(["INFORMACIÓN DEL PARTICIPANTE"]);

// 1. Nombre Completo
const fullName = `${record.participantData.first_name || ''} ${record.participantData.last_name || ''}`.trim();
addRowIfValueExists("Nombre", fullName);

// 2. Edad (redondeada a 1 decimal)
const age = record.participantData.calculated_age?.toFixed(1);
addRowIfValueExists("Edad", age);

// 3. Sexo
addRowIfValueExists("Sexo", record.participantData.sex);

// 4. ID
addRowIfValueExists("ID", record.participantData.id_number);

// Fila vacía de separación, esta siempre se agrega para mantener la estructura
participantInfoData.push([]);

// === ACTIVIDAD FÍSICA (Solo se añaden si los datos existen) ===
// Agregamos el encabezado de la sección si hay datos de PAQ/IPAQ
if (record.paq_score || record.paq_classification || record.ipaq_met_minutes || record.ipaq_classification || record.parq_requires_consultation !== undefined) {
    participantInfoData.push(["ACTIVIDAD FÍSICA"]);
}

// 5. PAQ MET-min/sem
addRowIfValueExists("PAQ MET-min/sem", record.paq_score);

// 6. Estado PAQ
addRowIfValueExists("Estado PAQ", record.paq_classification);

// 7. IPAQ MET-min/sem
addRowIfValueExists("IPAQ MET-min/sem", record.ipaq_met_minutes);

// 8. Estado IPAQ
addRowIfValueExists("Estado IPAQ", record.ipaq_classification);

// 9. PAR-Q
if (record.parq_requires_consultation !== undefined && record.parq_requires_consultation !== null) {
    const parqValue = `Requiere consulta?: ${record.parq_requires_consultation ? "Si" : "No"}`;
    participantInfoData.push(["PAR-Q", parqValue]);
}

// === TAMIZAJE ===
// 10. Tamizaje: Revisión médica previa
addRowIfValueExists("Tamizaje: Revisión médica previa", record.form_data?.revision);

// 11. Tamizaje: Intensidad sugerida
addRowIfValueExists("Tamizaje: Intensidad sugerida", record.form_data?.intensidad);

// Finalmente, agregamos todas las filas construidas dinámicamente
wsInfo.addRows(participantInfoData);

  // ================================
  // 2. MACROÍNDICES
  // ================================
  const wsMacro = wb.addWorksheet("Macroíndices");
  wsMacro.addRow(["Macroíndice", "Valor", "Clasificación"]);

  const macro = record.test_results?.calculatedIndices;

  let macroData = [
    ["IMC", macro?.imc?.value?.toFixed(2) || "N/A", macro?.imc?.classification || ""],
    ["ICC", macro?.icc?.value?.toFixed(2) || "N/A", ""],
    ["ICE", macro?.ice?.toFixed(2) || "N/A", ""],
    ["IDGC", macro?.idgc?.toFixed(2) || "N/A", ""],
    ["IC Conicidad", macro?.icConicidad?.toFixed(2) || "N/A", ""],
    ["Índice de Röher", macro?.roher?.value?.toFixed(2) || "N/A", ""],
    ["Índice de Livi", macro?.livi?.toFixed(2) || "N/A", ""],
    ["Pignet", macro?.pignet?.value?.toFixed(2) || "N/A", macro?.pignet?.classification || ""],
    ["IAI", macro?.iai?.value?.toFixed(2) || "N/A", macro?.iai?.classification || ""],
    ["IB", macro?.ibBraquial?.value?.toFixed(2) || "N/A", macro?.ibBraquial?.classification || ""],
    ["LRMS", macro?.lrms?.value?.toFixed(2) || "N/A", macro?.lrms?.classification || ""],
    ["LRMI", macro?.lrmi?.value?.toFixed(2) || "N/A", macro?.lrmi?.classification || ""],
  ]


  const macroDataExtra = [
    //Solo si es menor de 18 años
    ["Índice de maduracion", macro.indiceMaduracion, ""],
    ["Edad PHV (años)", macro.edadPhv, ""],
    ["CLAS", macro.clasMaduracion, ""],
    ["Falta de crecimiento (cm)", macro.faltaCm, ""],
    ["Estatura adulta estimada (cm)", macro.estaturaAdultaEst, ""],
    ["Edad estimada de la talla adulta", macro.edadEstimadaTallaAdulta, ""]
  ]

  const evaluation_mode: EvaluationMode = record.evaluation_mode

  if (record.participantData.calculated_age < 18 && evaluation_mode.startsWith("MULT") && evaluation_mode != "MULT_Express") {
    macroData = [...macroData, ...macroDataExtra]
  }

  // console.log(macroData)

  wsMacro.addRows(macroData);


  // ================================
  // 3. COMPOSICIÓN CORPORAL + GRÁFICO KERR
  // ================================
  const wsComp = wb.addWorksheet("Composición Corporal");
  const comp = record.test_results?.calculatedComposicion;
  wsComp.addRow(["Componente", "Masa (kg)", "Porcentaje"]);
  wsComp.addRows([
    ["Masa Grasa", comp?.masaGrasaKg?.toFixed(2) || "N/A", ""],
    ["Masa Ósea", comp?.masaOseaKg?.toFixed(2) || "N/A", ""],
    ["Masa Muscular Esquelética", comp?.masaMuscularEsqueleticaKg?.toFixed(2) || "N/A", ""],
  ]);

  if (chartsRefs.kerrChartRef) {
    const canvas = await html2canvas(chartsRefs.kerrChartRef);
    const imgData = canvas.toDataURL("image/png");
    const imageId = wb.addImage({ base64: imgData, extension: "png" });
    wsComp.addImage(imageId, { tl: { col: 0, row: 8 }, ext: { width: 500, height: 300 } });
  }

  // ================================
  // 4. SOMATOTIPO + SOMATOCARTA
  // ================================
  const wsSomato = wb.addWorksheet("Somatotipo");
  const somato = record.test_results?.calculatedSomatotype;
  wsSomato.addRows([
    ["Endomorfia", somato?.endomorfia?.toFixed(1) || "N/A"],
    ["Mesomorfia", somato?.mesomorfia?.toFixed(1) || "N/A"],
    ["Ectomorfia", somato?.ectomorfia?.toFixed(1) || "N/A"],
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
        tl: { col: 0, row: 6 },   // posición en la hoja
        ext: { width: 400, height: 300 }, // tamaño en px
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
    wsPerfil.addImage(imageId, { tl: { col: 0, row: 1 }, ext: { width: 600, height: 300 } });
  }

  // ================================
  // 6. DESCARGA
  // ================================
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `Reporte_${record.participantData.last_name || "LERM"}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
