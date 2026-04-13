import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Obtener los datos del formulario
    const pdfFile = formData.get('pdf') as File;
    const participantName = formData.get('participantName') as string;
    const participantEmail = formData.get('participantEmail') as string;
    const evaluationId = formData.get('evaluationId') as string;

    if (!pdfFile || !participantEmail) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: PDF o correo electrónico' },
        { status: 400 }
      );
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(participantEmail)) {
      return NextResponse.json(
        { error: 'El formato del correo electrónico no es válido' },
        { status: 400 }
      );
    }

    // Verificar variables de entorno
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      return NextResponse.json(
        { error: 'Configuración de correo no disponible' },
        { status: 500 }
      );
    }

    // Configurar el transporter de nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Verificar la configuración del transporter
    try {
      await transporter.verify();
      // console.log('Servidor de correo configurado correctamente');
    } catch (verifyError) {
      // console.error('Error en la configuración del correo:', verifyError);
      return NextResponse.json(
        { 
          error: 'Error en la configuración del servidor de correo',
          details: verifyError instanceof Error ? verifyError.message : 'Error de verificación'
        },
        { status: 500 }
      );
    }

    // Convertir el File a Buffer para el attachment
    const pdfBuffer = Buffer.from(await pdfFile.arrayBuffer());

    // Configurar el correo electrónico
    const mailOptions = {
      from: process.env.SMTP_FROM || `"Sistema de Evaluaciones" <${process.env.SMTP_USER}>`,
      to: participantEmail,
      subject: `📊 Reporte de Evaluación - ${participantName || 'Participante'}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
                .footer { margin-top: 20px; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📊 Reporte de Evaluación</h1>
                </div>
                <div class="content">
                    <h2>Hola ${participantName || 'Estimado/a'},</h2>
                    <p>Adjuntamos el reporte completo de tu evaluación física y composición corporal.</p>
                    
                    <p><strong>Detalles del reporte:</strong></p>
                    <ul>
                        <li><strong>ID de Evaluación:</strong> ${evaluationId || 'N/A'}</li>
                        <li><strong>Fecha de envío:</strong> ${new Date().toLocaleDateString('es-ES', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}</li>
                        <li><strong>Contenido:</strong> Resultados completos de macroíndices, composición corporal y somatotipo</li>
                    </ul>
                    
                    <p>Este documento contiene información importante sobre tu estado físico actual. Te recomendamos:</p>
                    <ul>
                        <li>Revisar cuidadosamente todos los resultados</li>
                        <li>Consultar con un profesional de la salud si tienes dudas</li>
                        <li>Mantener este reporte para futuras referencias</li>
                    </ul>
                    
                    <p><strong>¿Preguntas?</strong><br>
                    Si no solicitaste este reporte o necesitas aclaraciones, por favor contacta con nuestro equipo.</p>
                    
                    <p>Saludos cordiales,<br><strong>Equipo de Evaluaciones Físicas</strong></p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} Sistema de Evaluaciones Físicas</p>
                    <p><em>Este es un mensaje automático, por favor no respondas a este correo.</em></p>
                </div>
            </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: `reporte_evaluacion_${(participantName || 'participante').replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };

    // Enviar el correo
    const result = await transporter.sendMail(mailOptions);

    console.log('Correo enviado exitosamente:', {
      messageId: result.messageId,
      to: participantEmail,
      subject: mailOptions.subject
    });
    
    return NextResponse.json({
      success: true,
      message: 'Correo enviado exitosamente',
      messageId: result.messageId,
      to: participantEmail
    });

  } catch (error) {
    // console.error('Error al enviar el correo:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al enviar el correo';
    
    return NextResponse.json(
      { 
        error: 'Error al enviar el correo',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

// Opcional: Agregar método OPTIONS para CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}