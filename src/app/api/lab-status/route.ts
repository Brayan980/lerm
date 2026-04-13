import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {

    // 🔹 Traer citas separadas por sala
    const result = await query(
      `
      SELECT start_time, end_time, location
      FROM appointments
      WHERE appointment_date = CURRENT_DATE
      ORDER BY start_time ASC
      `
    );

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    // 🔹 Estados por sala
    const salas = {
      salaA: { estado: "LIBRE", ocupadoHasta: null as string | null },
      salaB: { estado: "LIBRE", ocupadoHasta: null as string | null },
    };

    for (const cita of result.rows) {
      const start = cita.start_time.slice(0, 5);
      const end = cita.end_time.slice(0, 5);
      const location = (cita.location || "").toLowerCase();

      // 🔹 Detectar sala
      let salaKey: "salaA" | "salaB" | null = null;

      if (location.includes("sala a")) salaKey = "salaA";
      if (location.includes("sala b")) salaKey = "salaB";

      if (!salaKey) continue;

      const sala = salas[salaKey];

      // 🔴 OCUPADO
      if (currentTime >= start && currentTime <= end) {
        sala.estado = "OCUPADO";
        sala.ocupadoHasta = end;
        continue;
      }

      // 🟡 RESERVADO (solo si aún no está ocupado)
      if (currentTime < start && sala.estado === "LIBRE") {
        sala.estado = "RESERVADO";
        sala.ocupadoHasta = start;
      }
    }

    return NextResponse.json({
      salaA: salas.salaA,
      salaB: salas.salaB,
    });

  } catch (error) {
    console.error("Error lab-status:", error);

    return NextResponse.json({
      salaA: { estado: "LIBRE", ocupadoHasta: null },
      salaB: { estado: "LIBRE", ocupadoHasta: null },
    });
  }
}