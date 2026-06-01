"use client";

import type { EvaluationRecord, FormType, TestResults, InitialRegistrationData, MacroindicesResults, ComposicionCorporalResults, SomatotipoResults, AssignedTests } from '@/lib/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';
import { calculateDecimalAge } from '@/lib/ageCalculator';
import { calculateAllMacroindices } from '@/lib/macroindicesCalculations';
import { calculateAllComposicionCorporal } from '@/lib/composicionCorporalCalculations';
import { calculateSomatotype } from '@/lib/somatotipoCalculations';
import { query } from '@/lib/db';
import { format as formatDateFn } from 'date-fns';

interface EvaluationContextType {
  evaluationRecords: EvaluationRecord[];
  addEvaluationRecord: (record: Omit<EvaluationRecord, 'id' | 'submission_date' | 'status' | 'created_at' | 'updated_at' | 'participantData'> & { participant_id: string }) => Promise<{ success: boolean; recordId?: string; message?: string }>;
  getEvaluationRecordById: (id: string) => EvaluationRecord | undefined;
  updateEvaluationRecord: (id: string, updates: Partial<Omit<EvaluationRecord, 'test_results' | 'form_data' | 'participantData' | 'participant_id'>> & { test_results?: TestResults; form_data?: any; assigned_tests_config?: AssignedTests }) => Promise<{ success: boolean; message?: string }>;
  deleteEvaluationRecord: (id: string) => Promise<{ success: boolean; message?: string }>;
  fetchRecords: () => void;
  isLoadingRecords: boolean;
  // fetchRecordsByPage: (page: number) => Promise<void>;
  fetchRecordsByPage: (page: number, statusFilter: 'completada' | 'no_completada') => Promise<void>;
  currentPage: number;
  totalRecords: number;
  recordsPerPage: number;
}

const EvaluationContext = createContext<EvaluationContextType | undefined>(undefined);

function deepSerializeDates(obj: any): any {
  if (!obj || typeof obj !== 'object' || obj instanceof Date) {
    if (obj instanceof Date) {
      return obj.toISOString();
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepSerializeDates(item));
  }

  const newObj: { [key: string]: any } = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key] = deepSerializeDates(obj[key]);
    }
  }
  return newObj;
}

export const EvaluationProvider = ({ children }: { children: ReactNode }) => {
  const [evaluationRecords, setEvaluationRecords] = useState<EvaluationRecord[]>([]);
  const [isLoadingRecords, setIsLoadingRecords] = useState(true);
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [recordsPerPage] = useState(5);

  const seedDemoData = useCallback(async () => {
    console.log("[SEEDER] Attempting to seed demo data into evaluation_records and participants...");
    try {
      const dob1 = new Date(1998, 8, 15);
      const dob2 = new Date(2003, 2, 10);

      const demoParticipant1Email = "carlos.perez.macro@example.com";
      const demoParticipant1IdNumber = "100000001";
      let participant1Id = `participant-demo-macro-${demoParticipant1IdNumber}`;

      console.log(`[SEEDER] Processing demo participant 1 (Email: ${demoParticipant1Email}, IDNum: ${demoParticipant1IdNumber})`);
      let { rows: p1ExistingByEmail } = await query('SELECT id FROM participants WHERE email = $1', [demoParticipant1Email.toLowerCase()]);
      if (p1ExistingByEmail.length > 0) {
        participant1Id = p1ExistingByEmail[0].id;
        console.log(`[SEEDER] Demo participant 1 (email: ${demoParticipant1Email}) already exists with ID: ${participant1Id}. Using existing.`);
      } else {
        let { rows: p1ExistingByIdNumber } = await query('SELECT id FROM participants WHERE id_number = $1', [demoParticipant1IdNumber]);
        if (p1ExistingByIdNumber.length > 0) {
          participant1Id = p1ExistingByIdNumber[0].id;
          console.log(`[SEEDER] Demo participant 1 (id_number: ${demoParticipant1IdNumber}) already exists with ID: ${participant1Id}. Using existing.`);
        } else {
          console.log(`[SEEDER] Demo participant 1 (email: ${demoParticipant1Email}) not found by email or ID number. Inserting with new ID: ${participant1Id}...`);
          try {
            await query(
              `INSERT INTO participants (id, first_name, last_name, dob, calculated_age, sex, email, id_number, accepted_terms)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING`,
              [participant1Id, "Carlos", "Pérez (Macro Demo)", formatDateFn(dob1, 'yyyy-MM-dd'), calculateDecimalAge(dob1.toISOString()), 'Masculino', demoParticipant1Email.toLowerCase(), demoParticipant1IdNumber, true]
            );
            console.log(`[SEEDER] Inserted demo participant 1 (ID: ${participant1Id}).`);
          } catch (insertError: any) {
            console.error(`[SEEDER] CRITICAL: Failed to insert demo participant 1 (email: ${demoParticipant1Email}) even after checks:`, insertError.message);
            throw insertError;
          }
        }
      }

      const sampleParticipantMacro: InitialRegistrationData = {
        id: participant1Id, first_name: "Carlos", last_name: "Pérez (Macro Demo)", dob: dob1.toISOString(),
        calculated_age: calculateDecimalAge(dob1.toISOString()), sex: 'Masculino', email: demoParticipant1Email.toLowerCase(), id_number: demoParticipant1IdNumber, accepted_terms: true,
      };
      const macroTestResultsInput: MacroindicesResults = {
        masaCorporal: { m1: 63.5, m2: 63.5, result: 63.5 }, talla: { m1: 167.5, m2: 167.5, result: 167.5 }, tallaSentada: { m1: 86.5, m2: 86.5, result: 86.5 }, envergaduraBrazos: { m1: 165.5, m2: 165.5, result: 165.5 },
        pliegueTriceps: { m1: 16.0, m2: 16.0, result: 16.0 }, pliegueSubescapular: { m1: 12.0, m2: 12.0, result: 12.0 }, pliegueBiceps: { m1: 6.0, m2: 6.0, result: 6.0 }, pliegueCrestaIliaca: { m1: 14.0, m2: 14.0, result: 14.0 },
        pliegueSupraespinal: { m1: 13.0, m2: 13.0, result: 13.0 }, pliegueAbdominal: { m1: 25.5, m2: 25.5, result: 25.5 }, pliegueMusloAnterior: { m1: 21.5, m2: 21.5, result: 21.5 }, plieguePiernaMedial: { m1: 14.0, m2: 14.0, result: 14.0 },
        perimetroCabeza: { m1: 56.4, m2: 56.4, result: 56.4 }, perimetroCuello: { m1: 33.3, m2: 33.3, result: 33.3 }, perimetroBrazoRelajado: { m1: 27.3, m2: 27.3, result: 27.3 },
        perimetroBrazoFlexionadoContrido: { m1: 28.4, m2: 28.4, result: 28.4 }, perimetroAntebrazo: { m1: 25.4, m2: 25.4, result: 25.4 }, perimetroMuneca: { m1: 16.6, m2: 16.6, result: 16.6 },
        perimetroTorax: { m1: 83.0, m2: 83.0, result: 83.0 }, perimetroCintura: { m1: 72.7, m2: 72.7, result: 72.7 }, perimetroCadera: { m1: 95.6, m2: 95.6, result: 95.6 },
        perimetroMusloSuperior: { m1: 56.0, m2: 56.0, result: 56.0 }, perimetroMusloMedio: { m1: 50.8, m2: 50.8, result: 50.8 }, perimetroPierna: { m1: 39.0, m2: 39.0, result: 39.0 },
        diametroBiacromial: { m1: 40.2, m2: 40.2, result: 40.2 }, diametroBiiliocristal: { m1: 29.5, m2: 29.5, result: 29.5 }, diametroAPAbdomen: { m1: 22.0, m2: 22.0, result: 22.0 },
        diametroHumero: { m1: 7.0, m2: 7.0, result: 7.0 }, diametroFemur: { m1: 9.5, m2: 9.5, result: 9.5 }, longitudAcromialeRadiale: { m1: 34.0, m2: 34.0, result: 34.0 },
        longitudRadialeStylion: { m1: 27.5, m2: 27.5, result: 27.5 }, longitudStylionMedioDactylion: { m1: 20.1, m2: 20.1, result: 20.1 }, alturaIliospinale: { m1: 95.0, m2: 95.0, result: 95.0 },
        alturaTrochanterion: { m1: 90.5, m2: 90.5, result: 90.5 }, longitudTrochanterionTibialeLaterale: { m1: 45.0, m2: 45.0, result: 45.0 },
      };
      macroTestResultsInput.calculatedIndices = calculateAllMacroindices(macroTestResultsInput, sampleParticipantMacro, undefined, undefined, undefined);
      const demoEval1Id = `eval-demo-macro-${participant1Id}`;
      console.log(`[SEEDER] Attempting to insert evaluation record 1 (ID: ${demoEval1Id}) for participant ID: ${participant1Id}...`);
      await query(
        `INSERT INTO evaluation_records (id, participant_id, form_type, submission_date, status, accepted_terms, test_results, assigned_tests_config, form_data, ipaq_met_minutes, ipaq_classification)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (id) DO NOTHING`,
        [demoEval1Id, participant1Id, 'IPAQ', new Date().toISOString(), 'Completada', true, JSON.stringify(deepSerializeDates({ macroindices: macroTestResultsInput })), JSON.stringify({ macroindices: true }), JSON.stringify(deepSerializeDates({ notes: "Registro de demostración para Macroíndices y Perfil Z." })), 1500, 'Moderado']
      );
      console.log(`[SEEDER] Inserted/Skipped demo evaluation record 1 (ID: ${demoEval1Id}).`);

      const demoParticipant2Email = "ana.gomez.somato@example.com";
      const demoParticipant2IdNumber = "100000002";
      let participant2Id = `participant-demo-somato-${demoParticipant2IdNumber}`;

      console.log(`[SEEDER] Processing demo participant 2 (Email: ${demoParticipant2Email}, IDNum: ${demoParticipant2IdNumber})`);
      let { rows: p2ExistingByEmail } = await query('SELECT id FROM participants WHERE email = $1', [demoParticipant2Email.toLowerCase()]);
      if (p2ExistingByEmail.length > 0) {
        participant2Id = p2ExistingByEmail[0].id;
        console.log(`[SEEDER] Demo participant 2 (email: ${demoParticipant2Email}) already exists with ID: ${participant2Id}. Using existing.`);
      } else {
        let { rows: p2ExistingByIdNumber } = await query('SELECT id FROM participants WHERE id_number = $1', [demoParticipant2IdNumber]);
        if (p2ExistingByIdNumber.length > 0) {
          participant2Id = p2ExistingByIdNumber[0].id;
          console.log(`[SEEDER] Demo participant 2 (id_number: ${demoParticipant2IdNumber}) already exists with ID: ${participant2Id}. Using existing.`);
        } else {
          console.log(`[SEEDER] Demo participant 2 (email: ${demoParticipant2Email}) not found by email or ID number. Inserting with new ID: ${participant2Id}...`);
          try {
            await query(
              `INSERT INTO participants (id, first_name, last_name, dob, calculated_age, sex, email, id_number, accepted_terms)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) ON CONFLICT (id) DO NOTHING`,
              [participant2Id, "Ana", "Gómez (Somato Demo)", formatDateFn(dob2, 'yyyy-MM-dd'), calculateDecimalAge(dob2.toISOString()), 'Femenino', demoParticipant2Email.toLowerCase(), demoParticipant2IdNumber, true]
            );
            console.log(`[SEEDER] Inserted demo participant 2 (ID: ${participant2Id}).`);
          } catch (insertError: any) {
            console.error(`[SEEDER] CRITICAL: Failed to insert demo participant 2 (email: ${demoParticipant2Email}) even after checks:`, insertError.message);
            throw insertError;
          }
        }
      }

      const sampleParticipantSomato: InitialRegistrationData = {
        id: participant2Id, first_name: "Ana", last_name: "Gómez (Somato Demo)", dob: dob2.toISOString(),
        calculated_age: calculateDecimalAge(dob2.toISOString()), sex: 'Femenino', email: demoParticipant2Email.toLowerCase(), id_number: demoParticipant2IdNumber, accepted_terms: true,
      };
      const somatoTestResultsInput: SomatotipoResults = {
        pliegueTriceps: { m1: 14.5, m2: 14.5, result: 14.5 }, pliegueSubescapular: { m1: 12.8, m2: 12.8, result: 12.8 }, pliegueSupraespinal: { m1: 10.3, m2: 10.3, result: 10.3 },
        diametroHumero: { m1: 6.5, m2: 6.5, result: 6.5 }, diametroFemur: { m1: 9.2, m2: 9.2, result: 9.2 }, perimetroBrazoContraido: { m1: 28.5, m2: 28.5, result: 28.5 },
        perimetroPierna: { m1: 35.1, m2: 35.1, result: 35.1 }, plieguePiernaMedial: { m1: 13.5, m2: 13.5, result: 13.5 }, talla: { m1: 165.0, m2: 165.0, result: 165.0 }, masaCorporal: { m1: 58.2, m2: 58.2, result: 58.2 },
      };

      somatoTestResultsInput.calculatedSomatotype = calculateSomatotype(somatoTestResultsInput)!;
      const demoEval2Id = `eval-demo-somato-${participant2Id}`;
      console.log(`[SEEDER] Attempting to insert evaluation record 2 (ID: ${demoEval2Id}) for participant ID: ${participant2Id}...`);
      await query(
        `INSERT INTO evaluation_records (id, participant_id, form_type, submission_date, status, accepted_terms, test_results, assigned_tests_config, form_data, paq_score, paq_classification)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (id) DO NOTHING`,
        [demoEval2Id, participant2Id, 'PAQ-A', new Date().toISOString(), 'Completada', true, JSON.stringify(deepSerializeDates({ somatotipo: somatoTestResultsInput })), JSON.stringify({ somatotipo: true }), JSON.stringify(deepSerializeDates({ notes: "Registro de demostración para Somatotipo." })), 3.5, 'Actividad física moderada']
      );
      console.log(`[SEEDER] Inserted/Skipped demo evaluation record 2 (ID: ${demoEval2Id}).`);

      console.log("[SEEDER] Demo data seeding attempt complete.");
    } catch (error) {
      console.error("[SEEDER_ERROR] Error seeding demo data:", error);
      toast({ title: "Error Sembrando Datos Demo", description: `No se pudieron sembrar los datos de demostración. Revise los logs del servidor. Error: ${(error as Error).message || 'Desconocido'}`, variant: "destructive", duration: 10000 });
    }
  }, [toast]);

  const mapDbRowToEvaluationRecord = (row: any): EvaluationRecord => {
    const submissionDate = row.submission_date ? new Date(row.submission_date).toISOString() : new Date().toISOString();
    const participantDob = row.p_dob ? new Date(row.p_dob).toISOString() : new Date().toISOString();
    const createdAt = row.created_at ? new Date(row.created_at).toISOString() : undefined;
    const updatedAt = row.updated_at ? new Date(row.updated_at).toISOString() : undefined;

    return {
      id: row.id,
      participant_id: row.participant_id,
      ethnicity: row.ethnicity,
      form_type: row.form_type,
      submission_date: submissionDate,
      status: row.status,
      evaluator_notes: row.evaluator_notes,
      assistant_notes: row.assistant_notes,
      accepted_terms: row.accepted_terms,
      paq_score: row.paq_score ? parseFloat(row.paq_score) : null,
      paq_classification: row.paq_classification,
      ipaq_met_minutes: row.ipaq_met_minutes ? parseFloat(row.ipaq_met_minutes) : null,
      ipaq_classification: row.ipaq_classification,
      parq_requires_consultation: row.parq_requires_consultation,
      evaluation_mode: row.evaluation_mode,
      form_data: row.form_data ? (typeof row.form_data === 'string' ? JSON.parse(row.form_data) : row.form_data) : null,
      test_results: row.test_results ? (typeof row.test_results === 'string' ? JSON.parse(row.test_results) : row.test_results) : null,
      assigned_tests_config: row.assigned_tests_config ? (typeof row.assigned_tests_config === 'string' ? JSON.parse(row.assigned_tests_config) : row.assigned_tests_config) : null,
      created_at: createdAt,
      updated_at: updatedAt,
      tamizaje_classification: row.tamizaje_classification,
      participantData: {
        id: row.participant_id,
        first_name: row.p_first_name,
        last_name: row.p_last_name,
        dob: participantDob,
        calculated_age: row.p_calculated_age ? parseFloat(row.p_calculated_age) : 0,
        sex: row.p_sex,
        email: row.p_email,
        id_number: row.p_id_number,
        accepted_terms: row.p_accepted_terms,
      },
    };
  };

  // Método para obtener todos los registros (sin paginación)
  const fetchRecords = useCallback(async () => {
    setIsLoadingRecords(true);
    console.log("[CONTEXT] Fetching ALL evaluation records...");
    try {
      const { rows } = await query(
        `SELECT
            er.id, er.participant_id, er.ethnicity, er.form_type, er.submission_date, er.status,
            er.evaluator_notes, er.assistant_notes, er.accepted_terms,
            er.paq_score, er.paq_classification, er.ipaq_met_minutes, er.ipaq_classification,
            er.parq_requires_consultation, er.form_data, er.test_results, er.assigned_tests_config,
            er.created_at, er.updated_at, er.evaluation_mode,
            p.first_name as "p_first_name", p.last_name as "p_last_name",
            p.dob as "p_dob", p.calculated_age as "p_calculated_age",
            p.sex as "p_sex", p.email as "p_email", p.id_number as "p_id_number",
            p.accepted_terms as "p_accepted_terms", er.tamizaje_classification
        FROM evaluation_records er
        JOIN participants p ON er.participant_id = p.id
        ORDER BY er.submission_date DESC`
      );
      console.log(`[CONTEXT] Fetched ${rows.length} evaluation records from DB.`);

      if (rows.length === 0) {
        console.log("[CONTEXT] No evaluation records found in DB. Attempting to seed demo data...");
        await seedDemoData();
        console.log("[CONTEXT] Re-fetching records after seeding attempt...");
        const { rows: rowsAfterSeed } = await query(
          `SELECT
            er.id, er.participant_id, er.ethnicity, er.form_type, er.submission_date, er.status,
            er.evaluator_notes, er.assistant_notes, er.accepted_terms,
            er.paq_score, er.paq_classification, er.ipaq_met_minutes, er.ipaq_classification,
            er.parq_requires_consultation, er.form_data, er.test_results, er.assigned_tests_config,
            er.created_at, er.updated_at, er.evaluation_mode,
            p.first_name as "p_first_name", p.last_name as "p_last_name",
            p.dob as "p_dob", p.calculated_age as "p_calculated_age",
            p.sex as "p_sex", p.email as "p_email", p.id_number as "p_id_number",
            p.accepted_terms as "p_accepted_terms", er.tamizaje_classification
          FROM evaluation_records er
          JOIN participants p ON er.participant_id = p.id
          ORDER BY er.submission_date DESC`
        );
        console.log(`[CONTEXT] Fetched ${rowsAfterSeed.length} records after seeding.`);
        setEvaluationRecords(rowsAfterSeed.map(mapDbRowToEvaluationRecord));
        // Actualizar el total de registros
        setTotalRecords(rowsAfterSeed.length);
      } else {
        setEvaluationRecords(rows.map(mapDbRowToEvaluationRecord));
        setTotalRecords(rows.length);
      }

    } catch (error) {
      console.error("[CONTEXT_ERROR] Critical error fetching evaluation records from DB:", error);
      toast({
        title: "FALLA DE CONEXIÓN BD (REGISTROS)",
        description: "No se pudieron cargar los registros. VERIFIQUE LOS LOGS DEL SERVIDOR (POSTGRES_URL, firewall, etc.).",
        variant: "destructive",
        duration: 30000,
      });
      setEvaluationRecords([]);
      setTotalRecords(0);
    } finally {
      setIsLoadingRecords(false);
      console.log("[CONTEXT] Finished fetching records. isLoadingRecords set to false.");
    }
  }, [toast, seedDemoData]);

  // Método con paginación del lado del servidor
  const fetchRecordsByPage = useCallback(async (page: number, statusFilter: 'completada' | 'no_completada') => {
    setIsLoadingRecords(true);
    console.log(`[CONTEXT] Fetching evaluation records for page ${page}...`);
    
    try {
      const offset = (page - 1) * recordsPerPage;
      
      // Construir la cláusula WHERE según el filtro
      const whereClause = statusFilter === 'completada' 
        ? `WHERE er.status = 'Completada'`
        : `WHERE er.status != 'Completada'`;

      const { rows } = await query(
        `SELECT
          er.id, er.participant_id, er.ethnicity, er.form_type, er.submission_date, er.status,
          er.evaluator_notes, er.assistant_notes, er.accepted_terms,
          er.paq_score, er.paq_classification, er.ipaq_met_minutes, er.ipaq_classification,
          er.parq_requires_consultation, er.form_data, er.test_results, er.assigned_tests_config,
          er.created_at, er.updated_at, er.evaluation_mode,
          p.first_name as "p_first_name", p.last_name as "p_last_name",
          p.dob as "p_dob", p.calculated_age as "p_calculated_age",
          p.sex as "p_sex", p.email as "p_email", p.id_number as "p_id_number",
          p.accepted_terms as "p_accepted_terms", er.tamizaje_classification, 
          COUNT(*) OVER() AS total_count
        FROM evaluation_records er
        JOIN participants p ON er.participant_id = p.id
        ${whereClause}
        ORDER BY er.submission_date DESC
        LIMIT $1 OFFSET $2`,
        [recordsPerPage, offset]
      );

      if (rows.length > 0) {
        const total = parseInt(rows[0].total_count, 10);
        setTotalRecords(total);
        setEvaluationRecords(rows.map(mapDbRowToEvaluationRecord));
        setCurrentPage(page);
        console.log(`[CONTEXT] Fetched ${rows.length} records (page ${page} of ${Math.ceil(total / recordsPerPage)})`);
      } else {
        // Si no hay registros en la primera página, intentar sembrar datos demo
        if (page === 1) {
          console.log("[CONTEXT] No records found on page 1. Attempting to seed demo data...");
          await seedDemoData();
          // Reintentar la consulta después de sembrar
          const { rows: rowsAfterSeed } = await query(
            `SELECT
              er.id, er.participant_id, er.ethnicity, er.form_type, er.submission_date, er.status,
              er.evaluator_notes, er.assistant_notes, er.accepted_terms,
              er.paq_score, er.paq_classification, er.ipaq_met_minutes, er.ipaq_classification,
              er.parq_requires_consultation, er.form_data, er.test_results, er.assigned_tests_config,
              er.created_at, er.updated_at, er.evaluation_mode,
              p.first_name as "p_first_name", p.last_name as "p_last_name",
              p.dob as "p_dob", p.calculated_age as "p_calculated_age",
              p.sex as "p_sex", p.email as "p_email", p.id_number as "p_id_number",
              p.accepted_terms as "p_accepted_terms", er.tamizaje_classification,
              COUNT(*) OVER() AS total_count
            FROM evaluation_records er
            JOIN participants p ON er.participant_id = p.id
            ORDER BY er.submission_date DESC
            LIMIT $1 OFFSET $2`,
            [recordsPerPage, offset]
          );
          
          if (rowsAfterSeed.length > 0) {
            const total = parseInt(rowsAfterSeed[0].total_count, 10);
            setTotalRecords(total);
            setEvaluationRecords(rowsAfterSeed.map(mapDbRowToEvaluationRecord));
            setCurrentPage(page);
          } else {
            setEvaluationRecords([]);
            setTotalRecords(0);
          }
        } else {
          setEvaluationRecords([]);
          setTotalRecords(0);
        }
      }

    } catch (error) {
      console.error("[CONTEXT_ERROR] Error fetching paginated records:", error);
      toast({
        title: "Error al cargar los registros paginados",
        description: `No se pudo cargar los registros paginados.`,
        variant: "destructive",
        duration: 10000,
      });
      setEvaluationRecords([]);
      setTotalRecords(0);
    } finally {
      setIsLoadingRecords(false);
    }
  }, [recordsPerPage, toast, seedDemoData]);

  // Inicializar la primera página al montar el componente
  useEffect(() => {
    fetchRecordsByPage(currentPage, 'completada');
  }, [fetchRecordsByPage]);

  const addEvaluationRecord = useCallback(async (recordData: Omit<EvaluationRecord, 'id' | 'submission_date' | 'status' | 'created_at' | 'updated_at' | 'participantData'> & { participant_id: string }): Promise<{ success: boolean; recordId?: string; message?: string }> => {
    const newRecordId = `eval-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const submissionDate = new Date().toISOString();
    const status: EvaluationRecord['status'] = 'Nueva';

    const formDataString = recordData.form_data ? JSON.stringify(deepSerializeDates(recordData.form_data)) : null;
    const testResultsString = recordData.test_results ? JSON.stringify(deepSerializeDates(recordData.test_results)) : null;
    const assignedTestsConfigString = recordData.assigned_tests_config ? JSON.stringify(recordData.assigned_tests_config) : null;

    console.log(`[CONTEXT] Adding evaluation record for participant ID: ${recordData.participant_id} with new ID: ${newRecordId}`);
    console.log(`[CONTEXT] Values being sent to DB for parq_requires_consultation:`, recordData.parq_requires_consultation);

    try {
      await query(
        `INSERT INTO evaluation_records (
          id, participant_id, ethnicity, form_type, submission_date, status, accepted_terms,
          paq_score, paq_classification, ipaq_met_minutes, ipaq_classification,
          parq_requires_consultation, form_data, test_results, assigned_tests_config,
          evaluator_notes, assistant_notes, evaluation_mode
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
        [
          newRecordId, recordData.participant_id, recordData.ethnicity, recordData.form_type, submissionDate, status, recordData.accepted_terms,
          recordData.paq_score, recordData.paq_classification, recordData.ipaq_met_minutes, recordData.ipaq_classification,
          recordData.parq_requires_consultation, formDataString, testResultsString, assignedTestsConfigString,
          recordData.evaluator_notes, recordData.assistant_notes, recordData.evaluation_mode
        ]
      );
      console.log(`[CONTEXT] Successfully added evaluation record ID: ${newRecordId}. Fetching updated records...`);
      // Recargar la página actual después de agregar
      fetchRecordsByPage(currentPage, 'completada');
      return { success: true, recordId: newRecordId };
    } catch (error: any) {
      console.error("[CONTEXT_ERROR] Failed to add evaluation record to DB:", error);
      toast({
        title: "Error al Guardar Evaluación",
        description: `No se pudo guardar el registro. Revise los logs del servidor para detalles. Error: ${error.message || 'Desconocido'}`,
        variant: "destructive",
        duration: 10000,
      });
      return { success: false, message: error.message || 'Error al guardar el registro de evaluación en la base de datos.' };
    }
  }, [currentPage, fetchRecordsByPage, toast]);

  const getEvaluationRecordById = useCallback((id: string): EvaluationRecord | undefined => {
    return evaluationRecords.find(record => record.id === id);
  }, [evaluationRecords]);

  const updateEvaluationRecord = useCallback(async (id: string, updates: Partial<Omit<EvaluationRecord, 'test_results' | 'form_data' | 'participantData' | 'participant_id'>> & { test_results?: TestResults; form_data?: any, assigned_tests_config?: AssignedTests }): Promise<{ success: boolean; message?: string }> => {
    console.log(`[CONTEXT] Updating evaluation record ID: ${id} with updates:`, updates);
    try {
      const fieldsToUpdate: string[] = [];
      const valuesToUpdate: any[] = [];
      let valueIndex = 1;

      const updateMappings: Record<string, (val: any) => any> = {
        ethnicity: val => val, //agregado
        status: val => val,
        evaluator_notes: val => val,
        assistant_notes: val => val,
        accepted_terms: val => val,
        paq_score: val => val,
        paq_classification: val => val,
        ipaq_met_minutes: val => val,
        ipaq_classification: val => val,
        evaluation_mode: val => val,
        parq_requires_consultation: val => val,
        form_data: val => val ? JSON.stringify(deepSerializeDates(val)) : null,
        test_results: val => val ? JSON.stringify(deepSerializeDates(val)) : null,
        assigned_tests_config: val => val ? JSON.stringify(val) : null,
        submission_date: val => val instanceof Date ? val.toISOString() : (typeof val === 'string' ? val : new Date().toISOString()),
      };

      for (const key in updates) {
        if (Object.prototype.hasOwnProperty.call(updates, key) && updateMappings[key]) {
          fieldsToUpdate.push(`${key} = $${valueIndex++}`);
          valuesToUpdate.push(updateMappings[key]((updates as any)[key]));
        }
      }

      if (fieldsToUpdate.length === 0) {
        console.log(`[CONTEXT] No valid fields to update for record ID: ${id}.`);
        return { success: true, message: 'No hay cambios para actualizar.' };
      }

      fieldsToUpdate.push(`updated_at = CURRENT_TIMESTAMP`);

      const queryText = `UPDATE evaluation_records SET ${fieldsToUpdate.join(', ')} WHERE id = $${valueIndex}`;
      valuesToUpdate.push(id);

      console.log(`[CONTEXT] Executing update query for record ID: ${id}: ${queryText} with values:`, valuesToUpdate);
      await query(queryText, valuesToUpdate);
      console.log(`[CONTEXT] Successfully updated evaluation record ID: ${id}. Fetching updated records...`);
      // Recargar la página actual después de actualizar
      fetchRecordsByPage(currentPage, "completada");
      return { success: true };
    } catch (error: any) {
      console.error(`[CONTEXT_ERROR] Failed to update evaluation record ID ${id} in DB:`, error);
      toast({
        title: "Error al Actualizar Evaluación",
        description: `No se pudo actualizar. Revise los logs del servidor para detalles. Error: ${error.message || 'Desconocido'}`,
        variant: "destructive",
        duration: 10000,
      });
      return { success: false, message: error.message || 'Error al actualizar el registro de evaluación.' };
    }
  }, [currentPage, fetchRecordsByPage, toast]);

  

const deleteEvaluationRecord = useCallback(async (id: string): Promise<{ success: boolean; message?: string }> => {
  console.log(`[CONTEXT] Deleting ONLY evaluation record ID: ${id}`);

  try {
    // 1. Buscar el participante asociado a la evaluación seleccionada
    const { rows } = await query(
      `
      SELECT participant_id
      FROM evaluation_records
      WHERE id = $1
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return {
        success: false,
        message: "No se encontró la evaluación para eliminar.",
      };
    }

    const participantId = rows[0].participant_id;

    // 2. Eliminar SOLO la evaluación seleccionada
    await query(
      `
      DELETE FROM evaluation_records
      WHERE id = $1
      `,
      [id]
    );

    // 3. Revisar si ese participante todavía tiene otras evaluaciones
    const remainingResult = await query(
      `
      SELECT COUNT(*)::int AS total
      FROM evaluation_records
      WHERE participant_id = $1
      `,
      [participantId]
    );

    const totalRemaining = remainingResult.rows?.[0]?.total || 0;

    // 4. Si ya no tiene más evaluaciones, eliminar también el participante
    // Esto libera la cédula y el correo para poder registrar otra vez.
    if (totalRemaining === 0) {
      await query(
        `
        DELETE FROM participants
        WHERE id = $1
        `,
        [participantId]
      );

      console.log(`[CONTEXT] Participant ${participantId} deleted because it had no remaining evaluations.`);
    }

    // 5. Actualizar la lista local sin borrar las demás evaluaciones
    setEvaluationRecords((prevRecords) =>
      prevRecords.filter((record) => record.id !== id)
    );

    toast({
      title: "Evaluación eliminada",
      description:
        totalRemaining === 0
          ? "Se eliminó la evaluación y también el participante porque ya no tenía más registros."
          : "Se eliminó solo la evaluación seleccionada.",
    });

    fetchRecordsByPage(currentPage, "completada");

    return { success: true };
  } catch (error: any) {
    console.error(`[CONTEXT_ERROR] Failed to delete evaluation record ID ${id}:`, error);

    toast({
      title: "Error al eliminar",
      description: `No se pudo eliminar. Error: ${error.message || "Desconocido"}`,
      variant: "destructive",
      duration: 10000,
    });

    return {
      success: false,
      message: error.message || "Error al eliminar la evaluación.",
    };
  }
}, [currentPage, fetchRecordsByPage, toast]);

  return (
    <EvaluationContext.Provider
      value={{
        evaluationRecords,
        addEvaluationRecord,
        getEvaluationRecordById,
        updateEvaluationRecord,
        deleteEvaluationRecord,
        fetchRecords,
        fetchRecordsByPage,
        isLoadingRecords,
        currentPage,
        totalRecords,
        recordsPerPage,
      }}
    >
      {children}
    </EvaluationContext.Provider>
  );
};

export const useEvaluationContext = () => {
  const context = useContext(EvaluationContext);
  if (context === undefined) {
    throw new Error('useEvaluationContext must be used within an EvaluationProvider');
  }
  return context;
};