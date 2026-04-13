
// app/api/schedule-appointment/route.tsx
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/sendEmail';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { query } from "@/lib/db";

interface Participant {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface AppointmentData {
  username: string;
  date: string;
  start: string;
  end: string;
  location: string;
  notes: string;
  participants: Participant[];
}

export async function POST(request: NextRequest) {
  try {
    const body: AppointmentData = await request.json();
    const { username, date, start, end, location, notes, participants } = body;
    const locationNormalized = location.trim();

    const allowedLocations = ["Sala A", "Sala B"];

    if (!allowedLocations.includes(locationNormalized)) {
      return NextResponse.json(
        { success: false, error: "Ubicación inválida" },
        { status: 400 }
      );
    }
    

    if (!allowedLocations.includes(location)) {
      return NextResponse.json(
        { success: false, error: "Ubicación inválida" },
        { status: 400 }
      );
    }

    const validParticipants = participants?.filter(p => p.email) || [];
    const emails = validParticipants.map(p => p.email!);

    // Solo enviamos emails si hay participantes
    const sendEmails = emails.length > 0;

   

    const fechaLarga = format(new Date(date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });

    const participantesHTML = validParticipants
      .map(p => `<li>${p.firstName} ${p.lastName} (${p.email})</li>`)
      .join('');

    // Plantilla HTML profesional
    const html = `
    <div style="font-family: 'Segoe UI', Roboto, sans-serif; background-color: #f4f6f8; padding: 30px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="background-color: #004aad; color: #ffffff; padding: 20px 30px;">
          <h2 style="margin: 0; font-weight: 600;">Cita grupal programada</h2>
        </div>

        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333;">¡Hola a todos!</p>
          <p style="font-size: 15px; color: #555;">
            Se ha programado una <strong>cita grupal</strong> con <strong>${emails.length}</strong> participantes. 
            A continuación encontrarás los detalles:
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #004aad;">📅 Fecha:</td>
              <td style="padding: 8px;">${fechaLarga}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #004aad;">🕐 Horario:</td>
              <td style="padding: 8px;">${start} - ${end}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold; color: #004aad;">📍 Ubicación:</td>
              <td style="padding: 8px;">${location}</td>
            </tr>
          </table>

          <div style="margin-top: 15px;">
            <p style="font-weight: bold; color: #004aad;">👥 Participantes (${emails.length}):</p>
            <ul style="margin: 0; padding-left: 20px; color: #555;">${participantesHTML}</ul>
          </div>

          ${notes
            ? `<div style="margin-top: 15px;">
                <p style="font-weight: bold; color: #004aad;">📝 Notas:</p>
                <p style="color: #555;">${notes}</p>
              </div>`
            : ''
          }

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />

          <p style="font-size: 13px; color: #777;">
            Este es un mensaje automático. Si necesitas más información, responde a este correo.
          </p>
        </div>

        <div style="background-color: #f0f2f5; text-align: center; padding: 15px; font-size: 12px; color: #888;">
          © ${new Date().getFullYear()} <strong>Tu Empresa</strong>. Todos los derechos reservados.
        </div>
      </div>
    </div>
    `;

    // 🔹 Buscar el id del usuario autenticado
    const userResult = await query(
      `SELECT id FROM users WHERE username = $1 LIMIT 1`,
      [username]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    const userId = userResult.rows[0].id;

    // 🔹 Verificar si ya existe una cita en ese horario y sala
    const conflictCheck = await query(
      `SELECT id
      FROM appointments
      WHERE location = $1
      AND appointment_date = $2
      AND (
            ($3 BETWEEN start_time AND end_time)
            OR
            ($4 BETWEEN start_time AND end_time)
            OR
            (start_time BETWEEN $3 AND $4)
          )
      LIMIT 1`,
      [location, date, start, end]
    );

    if (conflictCheck.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: "La sala ya está reservada en ese horario." },
        { status: 400 }
      );
    }

// 🔹 Insertar la cita
    const insertResult = await query(
      `INSERT INTO appointments (user_id, location, notes, participants, appointment_date, start_time, end_time)
       VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)
       RETURNING id`,
      [userId, location, notes, JSON.stringify(participants), date, start, end]
    );

    const appointmentId = insertResult.rows[0].id;

    // Envío asíncrono (no bloqueante)
    if (sendEmails) {
      sendEmail({
        to: emails,
        subject: `Cita grupal: ${format(new Date(date), 'dd/MM/yyyy')} ${start}-${end}`,
        html,
        text: '',
        react: null,
        from: `LERM <${process.env.GMAIL_USER}>`,
      });
    }

    return NextResponse.json(
      { success: true, sentTo: emails.length },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno' },
      { status: 500 }
    );
  }
}
