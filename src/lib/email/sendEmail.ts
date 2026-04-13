
// src/lib/email/sendEmail.ts
import type { ReactNode } from 'react';
import { transporter } from './nodemailerClient';

interface SendEmailProps {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string; // ✅ NUEVO: permite HTML
  react?: ReactNode;
  from?: string;
  replyTo?: string;
}

export async function sendEmail({
  to,
  subject,
  text,
  html,
  from = process.env.GMAIL_USER,
  replyTo,
}: SendEmailProps) {
  try {
    const info = await transporter.sendMail({
      from,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text,
      html, // se envía el HTML si existe
      replyTo,
    });

    console.log('📧 Email enviado correctamente:', info.messageId);
    return { success: true, info };
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return { success: false, error };
  }
}
