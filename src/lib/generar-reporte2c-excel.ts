import ExcelJS from "exceljs";

export async function generarReporte2CExcel(record: any) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Reporte 2C");

  // ======================
  // 1. Encabezado
  // ======================
  sheet.mergeCells("A1", "B1");
  const titleCell = sheet.getCell("A1");
  titleCell.value = "REPORTE - 2 COMPONENTES";
  titleCell.font = { size: 16, bold: true, color: { argb: "2C3E50" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };
  sheet.addRow([]);

  // ======================
  // 2. Información del Participante
  // ======================
  sheet.addRow(["Información del Participante"]);
  sheet.getRow(sheet.lastRow!.number).font = { bold: true };

  const participant = record.participantData;
  sheet.addRow(["Nombre", `${participant.first_name} ${participant.last_name}`]);
  sheet.addRow(["ID", participant.id_number || "N/A"]);
  sheet.addRow([
    "Edad",
    participant.calculated_age
      ? participant.calculated_age.toFixed(1) + " años"
      : "N/A",
  ]);
  sheet.addRow(["Sexo", participant.sex || "N/A"]);
  sheet.addRow([]);

  // ======================
  // 3. Resultados de 2 componentes
  // ======================
  sheet.addRow(["Resultados de 2 Componentes"]);
  sheet.getRow(sheet.lastRow!.number).font = { bold: true };

  const dc = record.test_results?.dos_componentes;
  const detectedKey = Object.keys(dc || {}).find((k) => (dc as any)[k]);
  const resultBlock = detectedKey ? (dc as any)[detectedKey] : null;
  const calculated = resultBlock?.calculated;

  if (calculated) {
    sheet.addRow([
      "% Grasa Corporal",
      calculated.porcentaje?.toFixed(2) + "%" || "N/A",
    ]);
    sheet.addRow([
      "Masa Grasa",
      calculated.masaKg?.toFixed(2) + " kg" || "N/A",
    ]);
    sheet.addRow(["Fórmula", calculated.formula || "N/A"]);
    sheet.addRow(["Referencia", calculated.referencia || "N/A"]);
  } else {
    sheet.addRow(["No se encontraron resultados calculados."]);
  }

  // ======================
  // 4. Ajustes de estilo
  // ======================
  sheet.columns = [{ width: 30 }, { width: 50 }];

  // ======================
  // 5. Descargar Excel (sin file-saver)
  // ======================
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `Reporte2C_${record.participantData.last_name || "LERM"}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
