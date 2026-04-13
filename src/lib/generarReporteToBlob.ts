// src/lib/generate-reporte.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import { CalculatedComposicionCorporal, CalculatedMacroindices, EvaluationMode, EvaluationRecord, FormType } from "@/lib/types";

// 🎯 Función principal para generar el PDF con plantilla mejorada
export async function generarReporteToBlob(record: any, chartsRefs: {
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
        primary: [41, 128, 185], // Azul
        secondary: [52, 152, 219], // Azul claro
        accent: [231, 76, 60], // Rojo
        text: [44, 62, 80], // Gris oscuro
        lightGray: [236, 240, 241], // Gris claro
    };

    // ================================
    // 1. ENCABEZADO PRINCIPAL
    // ================================
    // Rectángulo de fondo para el título
    doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
    doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 15, 'F');

    // Línea superior e inferior del encabezado
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
    doc.line(margin, yPos + 10, pageWidth - margin, yPos + 10);

    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.setFontSize(18);
    doc.text("REPORTE", pageWidth / 2, yPos + 5, { align: "center" });
    yPos += 20;

    // ================================
    // 2. SECCIÓN INFORMACIÓN DEL PARTICIPANTE Y RESULTADOS DE ACTIVIDAD FÍSICA
    // ================================
    const sectionHeight = 35;
    const colWidth = (pageWidth - 3 * margin) / 2;

    // Información del participante (columna izquierda)
    doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
    doc.rect(margin, yPos, colWidth, sectionHeight, 'F');
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(margin, yPos, colWidth, sectionHeight);

    doc.setFontSize(10);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.text("Información del participante", margin + 2, yPos + 6);

    const participantInfo = [
        `Nombre: ${record.participantData.first_name} ${record.participantData.last_name}`,
        `Edad: ${record.participantData.calculated_age?.toFixed(1) || "N/A"} años`,
        `Sexo: ${record.participantData.sex || "N/A"}`,
        `ID: ${record.participantData.id_number || "N/A"}`
    ];

    doc.setFontSize(8);
    participantInfo.forEach((info, index) => {
        doc.text(info, margin + 2, yPos + 12 + (index * 4));
    });

    // Resultados de actividad física (columna derecha)
    const rightColX = margin + colWidth + margin;
    doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
    doc.rect(rightColX, yPos, colWidth, sectionHeight, 'F');
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(rightColX, yPos, colWidth, sectionHeight);

    doc.setFontSize(10);
    doc.text("Resultados de actividad física", rightColX + 2, yPos + 6);

    const activityInfo = [];
    if (record.paq_score !== undefined && record.paq_score !== null) {
        activityInfo.push(`PAQ MET-min/sem: ${record.paq_score}`);
        activityInfo.push(`Estado: ${record.paq_classification || "N/A"}`);
    }
    if (record.ipaq_met_minutes !== undefined && record.ipaq_met_minutes !== null) {
        activityInfo.push(`IPAQ MET-min/sem: ${record.ipaq_met_minutes}`);
        activityInfo.push(`Estado: ${record.ipaq_classification || "N/A"}`);
    }

    if (record.parq_requires_consultation !== undefined && record.parq_requires_consultation !== null) {
        activityInfo.push(`PAR-Q:`);
        activityInfo.push(`Requiere consulta?: ${record.parq_requires_consultation ? "Si" : "No"}`);
    }


    if (record.form_data?.revision !== undefined && record.form_data?.intensidad !== null) {
        activityInfo.push("Tamizaje")
        activityInfo.push(`Revisión médica previa: ${record.form_data.revision}`) //se sale del cuadro. mejorar
        activityInfo.push(`Intensidad sugerida: ${record.form_data.intensidad}`)
    }

    if (activityInfo.length === 0) {
        activityInfo.push("No disponible");
    }

    doc.setFontSize(8);
    activityInfo.forEach((info, index) => {
        doc.text(info, rightColX + 2, yPos + 12 + (index * 4));
    });

    yPos += sectionHeight + 10;

    // ================================
    // 3. TABLAS DE MACROÍNDICES (DOS COLUMNAS)
    // ================================
    doc.setFontSize(12);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.text("Resultados de macroíndices", margin, yPos);
    yPos += 8;

    const macroindices = record.test_results?.calculatedIndices;

    if (macroindices) {
        // Primera tabla (columna izquierda) - Macroíndices básicos
        const macroData1 = [
            ["IMC", macroindices.imc?.value ? macroindices.imc.value.toFixed(2) : "N/A"],
            ["Índice de Livi (IL)", macroindices.livi ? macroindices.livi.toFixed(2) : "N/A"],
            ["Índice de Röher (IR)", macroindices.roher?.value ? macroindices.roher.value.toFixed(2) : "N/A"],
            ["Índice Ponderal (IP)", macroindices.ponderal ? macroindices.ponderal.toFixed(2) : "N/A"],
            ["Índice de Bouchard (IB)", macroindices.bouchard ? macroindices.bouchard.toFixed(2) : "N/A"],
            ["Índice de Pignet", macroindices.pignet?.value ? macroindices.pignet.value.toFixed(2) : "N/A"],
            ["Índice cintura-cadera (ICC)", macroindices.icc?.value ? macroindices.icc.value.toFixed(2) : "N/A"],
            ["Índice perímetro de cintura (IPC)", macroindices.ipc ? macroindices.ipc.toFixed(2) + " cm" : "N/A"],
            ["Índice diámetro sagital umbilical (IDSU)", macroindices.idsu ? macroindices.idsu.toFixed(2) + " cm" : "N/A"],
            ["Índice cintura-estatura (ICE)", macroindices.ice ? macroindices.ice.toFixed(2) : "N/A"],
        ];

        // Segunda tabla (columna derecha) - Macroíndices con clasificaciones
        let macroData2 = [
            ["Índice de distribución grasa corporal (IDGC)", macroindices.idgc ? macroindices.idgc.toFixed(2) : "N/A"],
            ["Índice de conicidad (IC)", macroindices.icConicidad ? macroindices.icConicidad.toFixed(2) : "N/A"],
            ["Índice córmico (IC)", macroindices.icCormico?.value ? macroindices.icCormico.value.toFixed(2) : "N/A"],
            ["Índice acromio-iliaco (IAI)", macroindices.iai?.value ? macroindices.iai.value.toFixed(2) : "N/A"],
            ["Índice braquial (IB)", macroindices.ibBraquial?.value ? macroindices.ibBraquial.value.toFixed(2) : "N/A"],
            ["Longitud relativa miembro superior (LRMS)", macroindices.lrms?.value ? macroindices.lrms.value.toFixed(2) : "N/A"],
            ["Índice de Manouvrier (IM)", macroindices.imManouvrier?.value ? macroindices.imManouvrier.value.toFixed(2) : "N/A"],
            ["Longitud relativa miembro inferior (LRMI)", macroindices.lrmi?.value ? macroindices.lrmi.value.toFixed(2) : "N/A"],
            ["Índice crural (IC)", macroindices.icCrural?.value ? macroindices.icCrural.value.toFixed(2) : "N/A"]
        ];

        const macroData3 = [
            //Solo si es menor de 18 años
            ["Índice de maduracion", macroindices.indiceMaduracion ? macroindices.indiceMaduracion : "N/A"],
            ["Edad PHV (años)", macroindices.edadPhv ? macroindices.edadPhv : "N/A"],
            ["CLAS", macroindices.clasMaduracion ? macroindices.clasMaduracion : "N/A"],
            ["Falta de crecimiento (cm)", macroindices.faltaCm],
            ["Estatura adulta estimada (cm)", macroindices.estaturaAdultaEst],
            ["Edad estimada de la talla adulta", macroindices.edadEstimadaTallaAdulta]
        ]

        const evaluation_mode: EvaluationMode = record.evaluation_mode

        if (record.participantData.calculated_age < 18 && evaluation_mode.startsWith("MULT") && evaluation_mode != "MULT_Express") {
            macroData2 = [...macroData2, macroData3]
        }

        const tableWidth = (pageWidth - 3 * margin) / 2;
        const startYTables = yPos;

        // Primera tabla (izquierda)
        autoTable(doc, {
            startY: startYTables,
            head: [["Macroíndice", "Valor"]],
            body: macroData1,
            theme: "grid",
            styles: {
                fontSize: 7,
                cellPadding: 1.5,
            },
            headStyles: {
                fillColor: [colors.primary[0], colors.primary[1], colors.primary[2]],
                textColor: 255,
                fontSize: 8,
            },
            alternateRowStyles: {
                fillColor: [colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]],
            },
            margin: { left: margin },
            tableWidth: tableWidth,
            columnStyles: {
                0: { cellWidth: tableWidth * 0.7 },
                1: { cellWidth: tableWidth * 0.3, halign: 'center' },
            },
        });

        // Segunda tabla (derecha)
        autoTable(doc, {
            startY: startYTables,
            head: [["Macroíndice", "Valor"]],
            body: macroData2,
            theme: "grid",
            styles: {
                fontSize: 7,
                cellPadding: 1.5,
            },
            headStyles: {
                fillColor: [colors.primary[0], colors.primary[1], colors.primary[2]],
                textColor: 255,
                fontSize: 8,
            },
            alternateRowStyles: {
                fillColor: [colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]],
            },
            margin: { left: margin + tableWidth + margin },
            tableWidth: tableWidth,
            columnStyles: {
                0: { cellWidth: tableWidth * 0.7 },
                1: { cellWidth: tableWidth * 0.3, halign: 'center' },
            },
        });

        yPos = Math.max((doc as any).lastAutoTable.finalY, startYTables + Math.max(macroData1.length, macroData2.length) * 5 + 15) + 10;
    }

    // ================================
    // 4. SECCIÓN COMPOSICIÓN CORPORAL Y KERR (DOS COLUMNAS)
    // ================================
    const composicion = record.test_results?.calculatedComposicion;
    const kerrData = record.test_results?.calculatedComposicion?.kerrComponents;

    if (composicion || kerrData) {
        // Composición corporal general (columna izquierda)
        doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
        doc.rect(margin, yPos, colWidth, 40, 'F');
        doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.rect(margin, yPos, colWidth, 40);

        doc.setFontSize(10);
        doc.text("Resultados de composición corporal", margin + 2, yPos + 6);

        if (composicion) {
            const compData = [
                `MG: ${composicion.masaGrasaKg?.toFixed(2) || "N/A"} kg`,
                `MO: ${composicion.masaOseaKg?.toFixed(2) || "N/A"} kg`,
                `MME: ${composicion.masaMuscularEsqueleticaKg?.toFixed(2) || "N/A"} kg`,
                `DC: ${composicion.densidadCorporalDurnin?.toFixed(4) || "N/A"} g/cm³`,
            ];

            doc.setFontSize(8);
            compData.forEach((info, index) => {
                doc.text(info, margin + 2, yPos + 12 + (index * 4));
            });
        }

        // Resultados de 5 componentes KERR (columna derecha)
        doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
        doc.rect(rightColX, yPos, colWidth, 40, 'F');
        doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.rect(rightColX, yPos, colWidth, 40);

        doc.setFontSize(10);
        doc.text("Resultados de 5 componentes - KERR", rightColX + 2, yPos + 6);

        if (kerrData) {
            const kerrTableData = [
                ["Masa Muscular", kerrData.masaMuscular?.masaKg?.toFixed(2) || "N/A", kerrData.masaMuscular?.porcentaje?.toFixed(1) || "N/A"],
                ["Masa Adiposa", kerrData.masaAdiposa?.masaKg?.toFixed(2) || "N/A", kerrData.masaAdiposa?.porcentaje?.toFixed(1) || "N/A"],
                ["Masa Ósea", kerrData.masaOsea?.masaKg?.toFixed(2) || "N/A", kerrData.masaOsea?.porcentaje?.toFixed(1) || "N/A"],
                ["Masa Piel", kerrData.masaPiel?.masaKg?.toFixed(2) || "N/A", kerrData.masaPiel?.porcentaje?.toFixed(1) || "N/A"],
                ["Masa Residual", kerrData.masaResidual?.masaKg?.toFixed(2) || "N/A", kerrData.masaResidual?.porcentaje?.toFixed(1) || "N/A"],
            ];

            // Mini tabla dentro de la sección
            const startX = rightColX + 2;
            const startY = yPos + 10;
            const cellWidth = (colWidth - 6) / 3;
            const cellHeight = 4;

            doc.setFontSize(7);
            doc.text("Componente", startX, startY + 2);
            doc.text("Masa (kg)", startX + cellWidth, startY + 2);
            doc.text("%", startX + 2 * cellWidth, startY + 2);

            kerrTableData.forEach((row, index) => {
                const rowY = startY + 4 + (index * cellHeight);
                doc.text(row[0], startX, rowY + 2);
                doc.text(row[1], startX + cellWidth, rowY + 2);
                doc.text(row[2] + "%", startX + 2 * cellWidth, rowY + 2);
            });
        }

        yPos += 50;
    }

    // ================================
    // 5. GRÁFICOS EN NUEVA PÁGINA
    // ================================
    doc.addPage();
    yPos = margin;

    // Título de gráficos
    doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
    doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 12, 'F');
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(margin, yPos - 5, pageWidth - 2 * margin, 12);

    doc.setFontSize(14);
    doc.text("Perfil de valores Z", pageWidth / 2, yPos + 2, { align: "center" });
    yPos += 15;

    // Gráfico de perfil Z
    if (chartsRefs.perfilZRef) {
        await addChart(chartsRefs.perfilZRef, "", yPos);
        // yPos += 80;
        yPos += 165;
    }

    // Título para somatotipo y Kerr
    doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 12, 'F');
    doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(margin, yPos, pageWidth - 2 * margin, 12);

    doc.setFontSize(14);
    doc.text("Somatotipo, Somatocarta y gráfico de composición Kerr", pageWidth / 2, yPos + 7, { align: "center" });
    // yPos += 20;
    yPos += 20;

    // Mostrar datos numéricos del somatotipo
    const somato = record.test_results?.calculatedSomatotype;
    if (somato) {
        doc.setFontSize(12);
        doc.text(`Endomorfia: ${somato.endomorfia?.toFixed(1) || "N/A"}`, margin + 20, yPos);
        doc.text(`Mesomorfia: ${somato.mesomorfia?.toFixed(1) || "N/A"}`, margin + 80, yPos);
        doc.text(`Ectomorfia: ${somato.ectomorfia?.toFixed(1) || "N/A"}`, margin + 140, yPos);
        yPos += 5;
    }

    // Gráficos lado a lado
    const chartWidth = (pageWidth - 3 * margin) / 2;
    const chartStartY = yPos;

    if (chartsRefs.somatochartRef) {
        // await addChartAtPosition(chartsRefs.somatochartRef, margin, chartStartY, chartWidth);
        const canvas = chartsRefs.somatochartRef.querySelector("canvas");
        if (canvas) {
            const imgData = canvas.toDataURL("image/png");
            const imgHeight = (canvas.height * chartWidth) / canvas.width;
            doc.addImage(imgData, "PNG", margin, chartStartY, chartWidth, imgHeight);
        }
    }

    if (chartsRefs.kerrChartRef) {
        await addChartAtPosition(chartsRefs.kerrChartRef, margin + chartWidth + margin, chartStartY, chartWidth * 1.3);
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
    // 8. DEVOLVER EL PDF COMO BLOB
    // ================================
    const pdfBlob = doc.output('blob');
    return pdfBlob;
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

    // Capturar el div completo
    const fullCanvas = await html2canvas(ref, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
    });

    const ctx = fullCanvas.getContext("2d");
    if (!ctx) return yPos;

    // 🔹 Definir el área de recorte (ajusta según tu canvas de 640x530)
    const cropX = 50;     // margen izquierdo
    const cropY = 30;     // margen superior
    const cropWidth = 540; // ancho útil
    const cropHeight = 470; // alto útil

    // Crear nuevo canvas solo con el recorte
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

    // Pasar a imagen
    const imgData = croppedCanvas.toDataURL("image/png");
    const imgProps = doc.getImageProperties(imgData);

    let imgWidth = contentWidth * 0.9;
    let imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    // Controlar tamaño para que no ocupe más de media página
    if (imgHeight > pageHeight * 0.4) {
        imgHeight = pageHeight * 0.4;
        imgWidth = (imgProps.width * imgHeight) / imgProps.height;
    }

    // Agregar título
    doc.setFontSize(12);
    doc.text("Somatocarta", margin, yPos);
    yPos += 8;

    // Validar salto de página
    if (yPos + imgHeight > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
    }

    // Centrar imagen
    const xPos = (pageWidth - imgWidth) / 2;
    doc.addImage(imgData, "PNG", xPos, yPos, imgWidth, imgHeight);

    return yPos + imgHeight + 10; // dejar espacio para lo que sigue
}

