// // app/api/evaluations/filter/route.ts
// import { NextResponse } from "next/server";
// import { query } from "@/lib/db";

// type ReqBody = {
//   category: string | null; // id de categoria o null
//   evaluations: string[]; // ids (si category == null)
//   profile: string; // obligatorio
//   ageMin: number;
//   ageMax: number;
//   ethnicity: string | null;
// };

// export async function POST(req: Request) {
//   try {
//     const body: ReqBody = await req.json();

//     // profile obligatorio
//     if (!body.profile || body.profile === "") {
//       return NextResponse.json(
//         { success: false, message: "El filtro 'profile' es obligatorio." },
//         { status: 400 }
//       );
//     }

//     const params: any[] = [];
//     const whereClauses: string[] = [];

//     // solo completadas y excluir 2C (CAST A TEXT)
//     whereClauses.push(`er.status = 'Completada'`);
//     whereClauses.push(`er.evaluation_mode::text NOT LIKE '2C%'`);

//     // profile -> buscar en evaluation_mode (CAST A TEXT)
//     params.push(`%${body.profile}%`);
//     whereClauses.push(`er.evaluation_mode::text ILIKE $${params.length}`);

//     // Edad minima
//     if (body.ageMin != null || body.ageMin != undefined) {
//       params.push(body.ageMin);
//       whereClauses.push(
//         `(p.calculated_age IS NOT NULL AND p.calculated_age >= $${params.length})`
//       );
//     }

//     // Edad maxima
//     if (body.ageMax != null || body.ageMax != undefined) {
//       params.push(body.ageMax);
//       whereClauses.push(
//         `(p.calculated_age IS NOT NULL AND p.calculated_age <= $${params.length})`
//       );
//     }

//     // etnia
//     if (body.ethnicity) {
//       params.push(body.ethnicity);
//       whereClauses.push(`er.ethnicity = $${params.length}`);
//     }

//     // CATEGORY → ÚNICO FILTRO A IMPLEMENTAR POR AHORA
//     if (body.category) {
//       params.push(body.category);
//       whereClauses.push(`
//         EXISTS (
//           SELECT 1
//           FROM evaluation_categories ec
//           WHERE ec.evaluation_record_id = er.id
//           AND ec.category_id = $${params.length}
//         )
//       `);
//     }

//     // SQL FINAL
//     const sql = `
//       SELECT
//         er.id,
//         er.participant_id,
//         er.form_type,
//         er.submission_date,
//         er.status,
//         er.evaluation_mode,
//         er.test_results,
//         er.ethnicity,
//         p.first_name AS p_first_name,
//         p.last_name AS p_last_name,
//         p.calculated_age AS p_calculated_age,
//         p.id_number AS p_id_number,
//         COALESCE(
//           json_agg(
//             DISTINCT jsonb_build_object('id', c.id, 'name', c.name)
//           ) FILTER (WHERE c.id IS NOT NULL),
//           '[]'
//         ) AS categories

//       FROM evaluation_records er
//       JOIN participants p ON p.id = er.participant_id
//       LEFT JOIN evaluation_categories ec ON ec.evaluation_record_id = er.id
//       LEFT JOIN categories c ON c.id = ec.category_id

//       WHERE ${whereClauses.join(" AND ")}

//       GROUP BY er.id, p.first_name, p.last_name, p.calculated_age, p.id_number
//       ORDER BY er.submission_date DESC
//       LIMIT 1000;
//     `;

//     const result = await query(sql, params);

//     const rows = result.rows.map((r: any) => {
//       if (r.p_calculated_age !== null && typeof r.p_calculated_age === "string") {
//         r.p_calculated_age = parseFloat(r.p_calculated_age);
//       }
//       return r;
//     });

//     return NextResponse.json({ success: true, records: rows });

//   } catch (err: any) {
//     console.error("API advanced-filters error:", err);
//     return NextResponse.json(
//       { success: false, message: err.message || "Error interno" },
//       { status: 500 }
//     );
//   }
// }

// app/api/evaluations/filter/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { buildEvaluationStatistics } from "@/lib/stats/buildEvaluationStatistics";

type ReqBody = {
  category: string | null;
  evaluations: string[];
  profile: string;
  ageMin: number;
  ageMax: number;
  ethnicity: string | null;
};

export async function POST(req: Request) {
  try {
    const body: ReqBody = await req.json();

    if (!body.profile || body.profile === "") {
      return NextResponse.json(
        { success: false, message: "El filtro 'profile' es obligatorio." },
        { status: 400 }
      );
    }

    const params: any[] = [];
    const whereClauses: string[] = [];

    whereClauses.push(`er.status = 'Completada'`);
    whereClauses.push(`er.evaluation_mode::text NOT LIKE '2C%'`);

    params.push(`%${body.profile}%`);
    whereClauses.push(`er.evaluation_mode::text ILIKE $${params.length}`);

    if (body.ageMin != null || body.ageMin != undefined) {
      params.push(body.ageMin);
      whereClauses.push(
        `(p.calculated_age IS NOT NULL AND p.calculated_age >= $${params.length})`
      );
    }

    if (body.ageMax != null || body.ageMax != undefined) {
      params.push(body.ageMax);
      whereClauses.push(
        `(p.calculated_age IS NOT NULL AND p.calculated_age <= $${params.length})`
      );
    }

    if (body.ethnicity) {
      params.push(body.ethnicity);
      whereClauses.push(`er.ethnicity = $${params.length}`);
    }

    if (body.category) {
      params.push(body.category);
      whereClauses.push(`
        EXISTS (
          SELECT 1
          FROM evaluation_categories ec
          WHERE ec.evaluation_record_id = er.id
          AND ec.category_id = $${params.length}
        )
      `);
    }

    const sql = `
      SELECT
        er.id,
        er.participant_id,
        er.form_type,
        er.submission_date,
        er.status,
        er.evaluation_mode,
        er.test_results,
        er.ethnicity,
        p.first_name AS p_first_name,
        p.last_name AS p_last_name,
        p.calculated_age AS p_calculated_age,
        p.id_number AS p_id_number,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', c.id, 'name', c.name)
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) AS categories

      FROM evaluation_records er
      JOIN participants p ON p.id = er.participant_id
      LEFT JOIN evaluation_categories ec ON ec.evaluation_record_id = er.id
      LEFT JOIN categories c ON c.id = ec.category_id

      WHERE ${whereClauses.join(" AND ")}

      GROUP BY er.id, p.first_name, p.last_name, p.calculated_age, p.id_number
      ORDER BY er.submission_date DESC
      LIMIT 1000;
    `;

    const result = await query(sql, params);

    const rows = result.rows.map((r: any) => {
      if (r.p_calculated_age !== null && typeof r.p_calculated_age === "string") {
        r.p_calculated_age = parseFloat(r.p_calculated_age);
      }
      return r;
    });

    // 🔥 Generar estadísticas basado en las medidas reales
    const statistics = buildEvaluationStatistics(rows);

    console.log(statistics)

    return NextResponse.json({
      success: true,
      records: rows,
      statistics
    });

  } catch (err: any) {
    console.error("API advanced-filters error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Error interno" },
      { status: 500 }
    );
  }
}
