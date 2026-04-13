// src/utils/generarReporte2C.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export async function generarReporte2C(record: any) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = margin;

  // ======================
  // 1. Encabezado
  // ======================
  doc.setFontSize(18);
  doc.text("REPORTE - 2 COMPONENTES", pageWidth / 2, yPos, { align: "center" });
  yPos += 15;

  // ======================
  // 2. Información del participante
  // ======================
  doc.setFontSize(12);
  doc.text("Información del Participante", margin, yPos);
  yPos += 8;

  const participant = record.participantData;
  autoTable(doc, {
    startY: yPos,
    head: [["Campo", "Valor"]],
    body: [
      ["Nombre", `${participant.first_name} ${participant.last_name}`],
      ["ID", participant.id_number || "N/A"],
      ["Edad", participant.calculated_age?.toFixed(1) + " años" || "N/A"],
      ["Sexo", participant.sex || "N/A"],
    ],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ======================
  // 3. Resultados de 2 componentes
  // ======================
  doc.setFontSize(12);
  doc.text("Resultados de 2 Componentes", margin, yPos);
  yPos += 8;

  const dc = record.test_results?.dos_componentes;
  const detectedKey = Object.keys(dc || {}).find((k) => (dc as any)[k]);
  const resultBlock = detectedKey ? (dc as any)[detectedKey] : null;
  const calculated = resultBlock?.calculated;

  if (calculated) {
    autoTable(doc, {
      startY: yPos,
      head: [["Indicador", "Valor"]],
      body: [
        ["% Grasa Corporal", calculated.porcentaje?.toFixed(2) + "%" || "N/A"],
        ["Masa Grasa", calculated.masaKg?.toFixed(2) + " kg" || "N/A"],
        ["Fórmula", calculated.formula || "N/A"],
        ["Referencia", calculated.referencia || "N/A"],
      ],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 2 },
    });
  } else {
    doc.setFontSize(10);
    doc.text("No se encontraron resultados calculados.", margin, yPos);
  }

  // ======================
  // 4. Guardar PDF
  // ======================
  doc.save(`Reporte2C_${record.participantData.last_name || "LERM"}.pdf`);
}
