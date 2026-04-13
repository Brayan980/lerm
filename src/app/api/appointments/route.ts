import { NextRequest, NextResponse } from "next/server";
import {query} from "@/lib/db"; // tu conexión a PostgreSQL

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    let querySQL = `
      SELECT *
      FROM public.appointments
      WHERE (
        appointment_date > CURRENT_DATE
        OR (appointment_date = CURRENT_DATE AND end_time > CURRENT_TIME)
      )
    `;

    if (start && end) {
      querySQL = `
        SELECT *
        FROM public.appointments
        WHERE appointment_date BETWEEN '${start}' AND '${end}'
        ORDER BY appointment_date, start_time
      `;
    }

    const result = await query(querySQL);

    console.log(result.rows)

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error obteniendo citas:", error);
    return NextResponse.json(
      { success: false, error: "Error al obtener las citas" },
      { status: 500 }
    );
  }
}
