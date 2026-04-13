import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const result = await query(`
      SELECT id, first_name, last_name, email, id_number
      FROM participants
      ORDER BY created_at DESC
    `);

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching participants:", error);

    return NextResponse.json(
      {
        success: false,
        data: [],
        error: "No se pudieron obtener los participantes",
      },
      { status: 500 }
    );
  }
}