// src/app/api/categories/[categoryId]/evaluations/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET: Obtener evaluaciones de una categoría
export async function GET(
  request: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    const { categoryId } = params;

    const result = await query(
      `SELECT evaluation_record_id 
       FROM public.evaluation_categories 
       WHERE category_id = $1`,
      [categoryId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching category evaluations:", error);
    return NextResponse.json(
      { error: "Error al obtener evaluaciones de la categoría" },
      { status: 500 }
    );
  }
}

// POST: Guardar asignaciones de evaluaciones a categoría
export async function POST(
  request: Request,
  { params }: { params: { categoryId: string } }
) {
  try {
    const { categoryId } = params;
    const body = await request.json();
    const { evaluationIds } = body;

    if (!categoryId || !Array.isArray(evaluationIds)) {
      return NextResponse.json(
        { error: "Datos inválidos: categoryId y evaluationIds son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que la categoría existe
    const categoryCheck = await query(
      'SELECT id FROM public.categories WHERE id = $1',
      [categoryId]
    );

    if (categoryCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "La categoría no existe" },
        { status: 404 }
      );
    }

    // Usar transacción para asegurar consistencia
    await query('BEGIN');

    try {
      // Eliminar asignaciones existentes para esta categoría
      await query(
        'DELETE FROM public.evaluation_categories WHERE category_id = $1',
        [categoryId]
      );

      // Insertar nuevas asignaciones si hay evaluaciones seleccionadas
      if (evaluationIds.length > 0) {
        // Verificar que las evaluaciones existen
        const placeholders = evaluationIds.map((_, index) => `$${index + 1}`).join(', ');
        const evaluationsCheck = await query(
          `SELECT id FROM public.evaluation_records WHERE id IN (${placeholders})`,
          evaluationIds
        );

        if (evaluationsCheck.rows.length !== evaluationIds.length) {
          throw new Error("Algunas evaluaciones no existen en la base de datos");
        }

        // CORRECCIÓN: Definir tipos explícitamente
        const values: string[] = [];
        const valuePlaceholders: string[] = [];
        
        evaluationIds.forEach((evaluationId: string, index: number) => {
          values.push(evaluationId, categoryId);
          valuePlaceholders.push(`($${index * 2 + 1}, $${index * 2 + 2})`);
        });

        await query(
          `INSERT INTO public.evaluation_categories 
           (evaluation_record_id, category_id) 
           VALUES ${valuePlaceholders.join(', ')}`,
          values
        );
      }

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Se asignaron ${evaluationIds.length} evaluaciones a la categoría`,
        assignedCount: evaluationIds.length
      });

    } catch (error: any) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error: any) {
    console.error("Error saving category evaluations:", error);
    
    let errorMessage = "Error al guardar asignaciones";
    if (error.message.includes("no existe")) {
      errorMessage = "Algunas evaluaciones no existen en la base de datos";
    } else if (error.message.includes("violates foreign key constraint")) {
      errorMessage = "Error de integridad referencial - verifique que las evaluaciones y categoría existan";
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}