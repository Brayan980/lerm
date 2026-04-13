// src/lib/email/sendPdfReport.ts
import { transporter } from "./nodemailerClient";
import { Readable } from "stream";

interface SendPdfReportProps {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  pdfBuffer: Buffer; // PDF en memoria
  filename?: string;
  from?: string;
}

/**
 * Envía un correo electrónico con un PDF adjunto
 */
export async function sendPdfReport({
  to,
  subject,
  html,
  text,
  pdfBuffer,
  filename = "reporte.pdf",
  from = process.env.GMAIL_USER,
}: SendPdfReportProps) {
  try {
    // Configurar correo con adjunto
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html,
      attachments: [
        {
          filename,
          content: pdfBuffer, // Buffer o Stream
          contentType: "application/pdf",
        },
      ],
    });

    // console.log("PDF enviado por correo:", info.messageId);
    return { success: true, info };
  } catch (error) {
    // console.error("Error enviando el PDF:", error);
    return { success: false, error };
  }
}
