// src/app/api/categories/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db"; // tu conexión a PostgreSQL

// --- POST: Crear una nueva categoría ---
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description } = body;

    if (!name || !description) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const newCategoryId = `category-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const querySql = `
      INSERT INTO public.categories (id, name, description)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    
    const values = [newCategoryId, name, description];

    const result = await query(querySql, values);

    return NextResponse.json(
      { success: true, category: result.rows[0] },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error al guardar categoría:", error);
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "El nombre de la categoría ya existe" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// --- GET: Listar categorías (opcional para mostrar tabla luego) ---
export async function GET() {
  try {
    const result = await query("SELECT * FROM public.categories ORDER BY created_at DESC");
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return NextResponse.json(
      { error: "Error al obtener categorías" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, description } = body;

    if (!id || !name || !description) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const querySql = `
      UPDATE public.categories 
      SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *;
    `;
    
    const values = [name, description, id];

    const result = await query(querySql, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, category: result.rows[0] },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error al actualizar categoría:", error);
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "El nombre de la categoría ya existe" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// --- DELETE: Eliminar una categoría ---
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: "ID de categoría es requerido" }, { status: 400 });
    }

    // Primero verificamos si la categoría existe
    const checkQuery = "SELECT id FROM public.categories WHERE id = $1";
    const checkResult = await query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    // Eliminamos la categoría
    const deleteQuery = "DELETE FROM public.categories WHERE id = $1";
    await query(deleteQuery, [id]);

    return NextResponse.json(
      { success: true, message: "Categoría eliminada correctamente" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error al eliminar categoría:", error);
    
    // Si hay una violación de llave foránea (categoría en uso)
    if (error.code === "23503") {
      return NextResponse.json(
        { error: "No se puede eliminar la categoría porque está siendo utilizada por otros registros" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}