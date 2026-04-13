// src/app/api/send-pdf-email/route.ts
import { generarReporteToBuffer } from "@/lib/generarReporteToBuffer";
import { sendPdfReport } from "@/lib/email/sendPdfReport";

export async function POST(req: Request) {
  try {
    const record = await req.json();

    // Generar el PDF en memoria
    const pdfBuffer = await generarReporteToBuffer(record, {});

    // Enviar el PDF por correo
    const result = await sendPdfReport({
      to: record.participantData.email,
      subject: "Tu reporte corporal personalizado 🧍‍♂️",
      html: `
        <h2>Hola ${record.participantData.first_name},</h2>
        <p>Adjunto encontrarás tu reporte de evaluación física en formato PDF.</p>
        <p>Gracias por confiar en <b>LERM</b>.</p>
      `,
      pdfBuffer,
      filename: `Reporte_${record.participantData.last_name}.pdf`,
    });

    return new Response(JSON.stringify({ success: true, info: result.info }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    // console.error("Error en /api/send-pdf-email:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Error interno del servidor",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
