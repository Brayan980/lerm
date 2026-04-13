// src/lib/generate-reporte.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { CalculatedComposicionCorporal, CalculatedMacroindices, EvaluationMode, EvaluationRecord, FormType } from "@/lib/types";

// Función principal para generar el PDF con plantilla mejorada
export async function generarReporte(record: any, chartsRefs: {
  perfilZRef?: HTMLDivElement | null;
  kerrChartRef?: HTMLDivElement | null;
  somatochartRef?: HTMLDivElement | null;
}) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Colores y estilos
  const colors = {
    primary: [41, 128, 185],
    secondary: [52, 152, 219],
    accent: [231, 76, 60],
    text: [44, 62, 80],
    lightGray: [236, 240, 241],
  };

  // ================================
  // 1. ENCABEZADO PRINCIPAL
  // ================================
  doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 15, 'F');

  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
  doc.line(margin, yPos + 10, pageWidth - margin, yPos + 10);

  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.setFontSize(18);
  doc.text("REPORTE DE EVALUACIÓN ANTROPOMÉTRICA", pageWidth / 2, yPos + 5, { align: "center" });
  yPos += 20;

  // ================================
  // 2. INFORMACIÓN DEL PARTICIPANTE Y ACTIVIDAD FÍSICA (DOS COLUMNAS)
  // ================================
  const colWidth = (pageWidth - 3 * margin) / 2;
  const rightColX = margin + colWidth + margin;

  // Columna izquierda: Información del participante
  doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
  doc.rect(margin, yPos, colWidth, 30, 'F');
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(margin, yPos, colWidth, 30);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMACIÓN DEL PARTICIPANTE", margin + 2, yPos + 5);
  doc.setFont("helvetica", "normal");

  const participantInfo = [
    `Nombre: ${record.participantData.first_name} ${record.participantData.last_name}`,
    `ID: ${record.participantData.id_number || "N/A"}`,
    `Edad: ${record.participantData.calculated_age?.toFixed(1) || "N/A"} años`,
    `Sexo: ${record.participantData.sex}`,
  ];

  doc.setFontSize(8);
  participantInfo.forEach((info, index) => {
    doc.text(info, margin + 2, yPos + 11 + (index * 4.5));
  });


    // Columna derecha: Actividad física
  const hasActivityData = 
    record.paq_score !== undefined || 
    record.ipaq_met_minutes !== undefined || 
    record.parq_requires_consultation !== undefined ||
    record.form_data?.revision !== undefined;


  if (hasActivityData) {
    // Función auxiliar para truncar texto
    const truncateText = (text: string, maxLength: number) => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength - 3) + '...';
    };

    // Calcular altura necesaria dinámicamente
    let lineCount = 0;
    if (record.paq_score !== undefined && record.paq_score !== null) lineCount += 2;
    if (record.ipaq_met_minutes !== undefined && record.ipaq_met_minutes !== null) lineCount += 2;
    if (record.parq_requires_consultation !== undefined) lineCount += 1;
    if (record.form_data?.revision !== undefined) lineCount += 2;
    
    const boxHeight = Math.max(30, 10 + (lineCount * 3.5));

    doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
    doc.rect(rightColX, yPos, colWidth, boxHeight, 'F');
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(rightColX, yPos, colWidth, boxHeight);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("ACTIVIDAD FÍSICA", rightColX + 2, yPos + 5);
    doc.setFont("helvetica", "normal");

    let currentLineY = yPos + 11;
    doc.setFontSize(7.5);
    const maxWidth = colWidth - 4;

    if (record.paq_score !== undefined && record.paq_score !== null) {
      doc.text(`PAQ: ${record.paq_score} MET-min/sem`, rightColX + 2, currentLineY);
      currentLineY += 3.5;
      doc.text(truncateText(`Estado: ${record.paq_classification || "N/A"}`, 40), rightColX + 2, currentLineY);
      currentLineY += 3.5;
    }
    
    if (record.ipaq_met_minutes !== undefined && record.ipaq_met_minutes !== null) {
      doc.text(`IPAQ: ${record.ipaq_met_minutes} MET-min/sem`, rightColX + 2, currentLineY);
      currentLineY += 3.5;
      doc.text(truncateText(`Estado: ${record.ipaq_classification || "N/A"}`, 40), rightColX + 2, currentLineY);
      currentLineY += 3.5;
    }
    
    if (record.parq_requires_consultation !== undefined && record.parq_requires_consultation !== null) {
      const parqText = record.parq_requires_consultation ? "PAR-Q: Requiere consulta" : "PAR-Q: No requiere consulta";
      doc.text(parqText, rightColX + 2, currentLineY);
      currentLineY += 3.5;
    }
    
    if (record.form_data?.revision !== undefined) {
      // Dividir texto largo en múltiples líneas si es necesario
      const revisionText = record.form_data.revision;
      const splitText = doc.splitTextToSize(`Rev. médica: ${revisionText}`, maxWidth);
      splitText.forEach((line: string, idx: number) => {
        if (idx < 2) { // Máximo 2 líneas
          doc.text(line, rightColX + 2, currentLineY);
          currentLineY += 3.5;
        }
      });
      
      const intensidadText = record.form_data.intensidad || "N/A";
      const splitIntensidad = doc.splitTextToSize(`Intensidad: ${intensidadText}`, maxWidth);
      splitIntensidad.forEach((line: string, idx: number) => {
        if (idx < 2) { // Máximo 2 líneas
          doc.text(line, rightColX + 2, currentLineY);
          currentLineY += 3.5;
        }
      });
    }
  }

  // Ajustar yPos basado en la altura de la sección de actividad física
  if (hasActivityData) {
    let lineCount = 0;
    if (record.paq_score !== undefined && record.paq_score !== null) lineCount += 2;
    if (record.ipaq_met_minutes !== undefined && record.ipaq_met_minutes !== null) lineCount += 2;
    if (record.parq_requires_consultation !== undefined) lineCount += 1;
    if (record.form_data?.revision !== undefined) lineCount += 4; // Puede ocupar hasta 4 líneas
    const boxHeight = Math.max(30, 10 + (lineCount * 3.5));
    yPos += boxHeight + 5;
  } else {
    yPos += 35;
  }

  // ================================
  // 3. MACROÍNDICES (TRES COLUMNAS)
  // ================================
  doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("MACROÍNDICES", margin + 2, yPos + 5);
  doc.setFont("helvetica", "normal");
  yPos += 12;

  const macroindices = record.test_results?.calculatedIndices;

  if (macroindices) {
    // Dividir macroíndices en tres columnas
    const col1Data = [
      ["IMC", macroindices.imc?.value ? macroindices.imc.value.toFixed(2) : "N/A"],
      ["Livi", macroindices.livi ? macroindices.livi.toFixed(2) : "N/A"],
      ["Röher", macroindices.roher.value ? macroindices.roher.value.toFixed(2) : "N/A"],
      ["Ponderal", macroindices.ponderal ? macroindices.ponderal.toFixed(2) : "N/A"],
      ["Bouchard", macroindices.bouchard ? macroindices.bouchard.toFixed(2) : "N/A"],
      ["Pignet", macroindices.pignet?.value ? macroindices.pignet.value.toFixed(2) : "N/A"],
      ["ICC", macroindices.icc.value ? macroindices.icc.value.toFixed(2) : "N/A"],
      ["IPC", macroindices.ipc ? macroindices.ipc.toFixed(2) + " cm" : "N/A"],
    ];

    const col2Data = [
      ["IDSU", macroindices.idsu ? macroindices.idsu.toFixed(2) + " cm" : "N/A"],
      ["ICE", macroindices.ice ? macroindices.ice.toFixed(2) : "N/A"],
      ["IDGC", macroindices.idgc ? macroindices.idgc.toFixed(2) : "N/A"],
      ["IC (Conicidad)", macroindices.icConicidad ? macroindices.icConicidad.toFixed(2) : "N/A"],
      ["IC Córmico", macroindices.icCormico?.value ? macroindices.icCormico.value.toFixed(2) : "N/A"],
      ["IAI", macroindices.iai?.value ? macroindices.iai.value.toFixed(2) : "N/A"],
      ["IB (Braquial)", macroindices.ibBraquial?.value ? macroindices.ibBraquial.value.toFixed(2) : "N/A"],
      ["LRMS", macroindices.lrms?.value ? macroindices.lrms.value.toFixed(2) : "N/A"],
    ];

    const col3Data = [
      ["IM (Manouvrier)", macroindices.imManouvrier?.value ? macroindices.imManouvrier.value.toFixed(2) : "N/A"],
      ["LRMI", macroindices.lrmi?.value ? macroindices.lrmi.value.toFixed(2) : "N/A"],
      ["IC Crural", macroindices.icCrural?.value ? macroindices.icCrural.value.toFixed(2) : "N/A"],
      ["Índice intermembral", macroindices?.iIntermembral ? macroindices?.iIntermembral.toFixed(2) : "N/A"],
      ["Musculo oseo", macroindices?.iMusculoOseo ? macroindices?.iMusculoOseo.toFixed(2) : "N/A"],
      ["Adiposo muscular", macroindices.iAdiposoMuscular ? macroindices.iAdiposoMuscular.toFixed(2) : "N/A"],
    ];

    // Añadir índices de maduración si aplica
    const evaluation_mode: EvaluationMode = record.evaluation_mode;

    // if (record.participantData.calculated_age < 18 && evaluation_mode.startsWith("MULT") && evaluation_mode !== "MULT_Express") {
    //   col3Data.push(
    //     ["Índice Maduración", macroindices.indiceMaduracion || "N/A"],
    //     ["Edad PHV", macroindices.edadPhv ? macroindices.edadPhv + " años" : "N/A"]
    //   );
    // }

    const tableWidth = (pageWidth - 4 * margin) / 3;
    const startYTables = yPos;

    // Columna 1
    autoTable(doc, {
      startY: startYTables,
      head: [["Índice", "Valor"]],
      body: col1Data,
      theme: "striped",
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
      },
      headStyles: {
        fillColor: [colors.secondary[0], colors.secondary[1], colors.secondary[2]],
        textColor: 255,
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]],
      },
      margin: { left: margin },
      tableWidth: tableWidth,
      columnStyles: {
        0: { cellWidth: tableWidth * 0.6 },
        1: { cellWidth: tableWidth * 0.4, halign: 'center' },
      },
    });

    // Columna 2
    autoTable(doc, {
      startY: startYTables,
      head: [["Índice", "Valor"]],
      body: col2Data,
      theme: "striped",
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
      },
      headStyles: {
        fillColor: [colors.secondary[0], colors.secondary[1], colors.secondary[2]],
        textColor: 255,
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]],
      },
      margin: { left: margin + tableWidth + margin },
      tableWidth: tableWidth,
      columnStyles: {
        0: { cellWidth: tableWidth * 0.6 },
        1: { cellWidth: tableWidth * 0.4, halign: 'center' },
      },
    });

    // Columna 3
    autoTable(doc, {
      startY: startYTables,
      head: [["Índice", "Valor"]],
      body: col3Data,
      theme: "striped",
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
      },
      headStyles: {
        fillColor: [colors.secondary[0], colors.secondary[1], colors.secondary[2]],
        textColor: 255,
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]],
      },
      margin: { left: margin + 2 * (tableWidth + margin) },
      tableWidth: tableWidth,
      columnStyles: {
        0: { cellWidth: tableWidth * 0.6 },
        1: { cellWidth: tableWidth * 0.4, halign: 'center' },
      },
    });

    yPos = Math.max(
      (doc as any).lastAutoTable.finalY,
      startYTables + Math.max(col1Data.length, col2Data.length, col3Data.length) * 5 + 15
    ) + 10;

    // Índices de maduración adicionales en una línea aparte si aplica
    if (record.participantData.calculated_age < 18 && evaluation_mode.startsWith("MULT") && evaluation_mode !== "MULT_Express") {
      const maduracionExtra = [
        ["Índice Maduración", macroindices.indiceMaduracion || "N/A"],
        ["Edad PHV", macroindices.edadPhv ? macroindices.edadPhv + " años" : "N/A"],
        ["Clasificación", macroindices.clasMaduracion || "N/A"],
        ["Falta de crecimiento", macroindices.faltaCm ? macroindices.faltaCm + " cm" : "N/A"],
        ["Estatura adulta estimada", macroindices.estaturaAdultaEst ? macroindices.estaturaAdultaEst + " cm" : "N/A"],
        ["Edad estimada talla adulta", macroindices.edadEstimadaTallaAdulta || "N/A"],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [["Parámetro de Maduración", "Valor"]],
        body: maduracionExtra,
        theme: "striped",
        styles: {
          fontSize: 7,
          cellPadding: 1.5,
        },
        headStyles: {
          fillColor: [colors.accent[0], colors.accent[1], colors.accent[2]],
          textColor: 255,
          fontSize: 8,
        },
        alternateRowStyles: {
          fillColor: [colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]],
        },
        margin: { left: margin, right: margin },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // ================================
  // 4. COMPOSICIÓN CORPORAL (DOS COLUMNAS CON GRÁFICO)
  // ================================
  doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("COMPOSICIÓN CORPORAL", margin + 2, yPos + 5);
  doc.setFont("helvetica", "normal");
  yPos += 12;

  const kerrData = record.test_results?.calculatedComposicion?.kerrComponents;
  const kerrData4Componentes = record.test_results?.calculatedComposicion4Componentes;
  const kerrData2Componentes = record.test_results?.calculatedComposicion2Componentes;

  const startYComposicion = yPos;
  let maxTableHeight = 0;

  // Columna izquierda: Tablas de composición
  let currentY = startYComposicion;

  if (kerrData) {
    const kerrTableData = [
      ["Masa Muscular", kerrData.masaMuscular?.masaKg?.toFixed(2) || "N/A", kerrData.masaMuscular?.porcentaje?.toFixed(1) || "N/A"],
      ["Masa Adiposa", kerrData.masaAdiposa?.masaKg?.toFixed(2) || "N/A", kerrData.masaAdiposa?.porcentaje?.toFixed(1) || "N/A"],
      ["Masa Ósea", kerrData.masaOsea?.masaKg?.toFixed(2) || "N/A", kerrData.masaOsea?.porcentaje?.toFixed(1) || "N/A"],
      ["Masa Piel", kerrData.masaPiel?.masaKg?.toFixed(2) || "N/A", kerrData.masaPiel?.porcentaje?.toFixed(1) || "N/A"],
      ["Masa Residual", kerrData.masaResidual?.masaKg?.toFixed(2) || "N/A", kerrData.masaResidual?.porcentaje?.toFixed(1) || "N/A"],
    ];

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("5 Componentes (Kerr)", margin, currentY);
    doc.setFont("helvetica", "normal");
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      head: [["Componente", "kg", "%"]],
      body: kerrTableData,
      theme: "striped",
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
      },
      headStyles: {
        fillColor: [colors.secondary[0], colors.secondary[1], colors.secondary[2]],
        textColor: 255,
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]],
      },
      margin: { left: margin },
      tableWidth: colWidth,
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'center' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  if (kerrData4Componentes) {
    const kerrTableData = [
      ["Masa Muscular", kerrData4Componentes.masaMuscular?.toFixed(2) || "N/A", kerrData4Componentes.porcentajeMuscular?.toFixed(1) || "N/A"],
      ["Masa Adiposa", kerrData4Componentes.masaAdiposa?.toFixed(2) || "N/A", kerrData4Componentes.porcentajeAdiposa?.toFixed(1) || "N/A"],
      ["Masa Ósea", kerrData4Componentes.masaOsea?.toFixed(2) || "N/A", kerrData4Componentes.porcentajeOsea?.toFixed(1) || "N/A"],
      ["Masa Residual", kerrData4Componentes.masaResidual?.toFixed(2) || "N/A", kerrData4Componentes.porcentajeResidual?.toFixed(1) || "N/A"],
    ];

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("4 Componentes (Kerr)", margin, currentY);
    doc.setFont("helvetica", "normal");
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      head: [["Componente", "kg", "%"]],
      body: kerrTableData,
      theme: "striped",
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
      },
      headStyles: {
        fillColor: [colors.secondary[0], colors.secondary[1], colors.secondary[2]],
        textColor: 255,
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]],
      },
      margin: { left: margin },
      tableWidth: colWidth,
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'center' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  if (kerrData2Componentes) {
    const kerrTableData = [
      ["Masa Muscular", kerrData2Componentes.masaMuscular?.toFixed(2) || "N/A"],
      ["Masa Adiposa", kerrData2Componentes.masaAdiposa?.toFixed(2) || "N/A"],
    ];

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("2 Componentes", margin, currentY);
    doc.setFont("helvetica", "normal");
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      head: [["Componente", "kg"]],
      body: kerrTableData,
      theme: "striped",
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
      },
      headStyles: {
        fillColor: [colors.secondary[0], colors.secondary[1], colors.secondary[2]],
        textColor: 255,
        fontSize: 8,
      },
      alternateRowStyles: {
        fillColor: [colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]],
      },
      margin: { left: margin },
      tableWidth: colWidth,
      columnStyles: {
        1: { halign: 'center' },
      },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  maxTableHeight = currentY - startYComposicion;

  // Columna derecha: Gráfico de Kerr
  if (chartsRefs.kerrChartRef) {
    const chartWidth = colWidth;
    const chartHeight = Math.min(maxTableHeight, 100);
    await addChartAtPosition(chartsRefs.kerrChartRef, rightColX, startYComposicion, chartWidth);
  }

  yPos = Math.max(currentY, startYComposicion + 100) + 5;

  // ================================
  // 5. PERFIL Z - NUEVA PÁGINA
  // ================================
  doc.addPage();
  yPos = margin;

  doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("PERFIL DE VALORES Z", margin + 2, yPos + 5);
  doc.setFont("helvetica", "normal");
  yPos += 12;

  if (chartsRefs.perfilZRef) {
    await addChart(chartsRefs.perfilZRef, "", yPos);
    yPos += 170;
  }

  // ================================
  // 6. SOMATOTIPO Y SOMATOCARTA
  // ================================
  doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8);
  
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("SOMATOTIPO Y SOMATOCARTA", margin + 2, yPos + 5);
  doc.setFont("helvetica", "normal");
  yPos += 12;

  const somato = record.test_results?.calculatedSomatotype;
  if (somato) {
    doc.setFontSize(10);
    doc.text(`Endomorfia: ${somato.endomorfia?.toFixed(1) || "N/A"}`, margin + 20, yPos);
    doc.text(`Mesomorfia: ${somato.mesomorfia?.toFixed(1) || "N/A"}`, margin + 80, yPos);
    doc.text(`Ectomorfia: ${somato.ectomorfia?.toFixed(1) || "N/A"}`, margin + 140, yPos);
    yPos += 8;
  }

  if (chartsRefs.somatochartRef) {
    const canvas = chartsRefs.somatochartRef.querySelector("canvas");
    if (canvas) {
      const imgData = canvas.toDataURL("image/png");
      const chartWidth = pageWidth - 2 * margin;
      const imgHeight = (canvas.height * chartWidth) / canvas.width;
      doc.addImage(imgData, "PNG", margin, yPos, chartWidth, imgHeight);
    }
  }

  // ================================
  // FUNCIONES AUXILIARES
  // ================================
  async function addChart(ref: HTMLDivElement | null, title: string, yOffset: number) {
    if (!ref) return;
    try {
      const canvas = await html2canvas(ref);
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = pageWidth - 2 * margin;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (title) {
        doc.setFontSize(10);
        doc.text(title, margin, yOffset);
        yOffset += 5;
      }

      doc.addImage(imgData, "PNG", margin, yOffset, imgWidth, imgHeight);
    } catch (error) {
      console.error("Error adding chart:", error);
    }
  }

  async function addChartAtPosition(ref: HTMLDivElement | null, x: number, y: number, width: number) {
    if (!ref) return;
    try {
      const canvas = await html2canvas(ref);
      const imgData = canvas.toDataURL("image/png");
      const imgHeight = (canvas.height * width) / canvas.width;
      doc.addImage(imgData, "PNG", x, y, width, imgHeight);
    } catch (error) {
      console.error("Error adding chart at position:", error);
    }
  }

  // ================================
  // 7. GUARDAR PDF
  // ================================
  doc.save(`Reporte_${record.participantData.last_name || "LERM"}.pdf`);
}

export default async function addSomatocartaCropped(
  ref: HTMLDivElement | null,
  doc: jsPDF,
  yPos: number
) {
  if (!ref) return yPos;

  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - 2 * margin;

  const fullCanvas = await html2canvas(ref, {
    scale: 2,
    backgroundColor: "#ffffff",
    useCORS: true,
  });

  const ctx = fullCanvas.getContext("2d");
  if (!ctx) return yPos;

  const cropX = 50;
  const cropY = 30;
  const cropWidth = 540;
  const cropHeight = 470;

  const croppedCanvas = document.createElement("canvas");
  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;
  const croppedCtx = croppedCanvas.getContext("2d");
  if (!croppedCtx) return yPos;

  croppedCtx.putImageData(
    ctx.getImageData(cropX, cropY, cropWidth, cropHeight),
    0,
    0
  );

  const imgData = croppedCanvas.toDataURL("image/png");
  const imgProps = doc.getImageProperties(imgData);

  let imgWidth = contentWidth * 0.9;
  let imgHeight = (imgProps.height * imgWidth) / imgProps.width;

  if (imgHeight > pageHeight * 0.4) {
    imgHeight = pageHeight * 0.4;
    imgWidth = (imgProps.width * imgHeight) / imgProps.height;
  }

  doc.setFontSize(12);
  doc.text("Somatocarta", margin, yPos);
  yPos += 8;

  if (yPos + imgHeight > pageHeight - margin) {
    doc.addPage();
    yPos = margin;
  }

  const xPos = (pageWidth - imgWidth) / 2;
  doc.addImage(imgData, "PNG", xPos, yPos, imgWidth, imgHeight);

  return yPos + imgHeight + 10;
}