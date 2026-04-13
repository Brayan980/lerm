import { Medidas4Componentes, Resultados4Componentes } from "./medidas4Componentes";
import { Resultados2Componentes } from "./composicionCorporal2Componentes";

export type UserRole = 'Admin' | 'Evaluator' | 'Assistant';

// Corresponds to the 'users' table
export interface AuthUser {
  id: string; // Primary Key
  username: string; // email, will be stored in lowercase, UNIQUE
  password: string; // In a real app, this should be a hash
  role: UserRole; // Uses user_role_enum
  created_at?: string; // TIMESTAMPTZ
  updated_at?: string; // TIMESTAMPTZ
}

export interface MGResult {
  porcentaje: number | null;
  masaKg?: number | null; // opcional si quieres convertir a kg
  formula: string;
  referencia: string;
}

export interface Calculated2CResult {
  porcentaje: number | null;
  masaKg?: number | null;
  formula: string;
  referencia: string;
}

export interface TwoComponentAssignment {
  MG: FormulaName;  // Masa Grasa
  MO?: FormulaName;  // Masa Ósea
  MM?: FormulaName;  // Masa Muscular
}

export const GROUP_FORMULAS: Record<string, TwoComponentAssignment> = {
  niños:       { MG: "Slaughter",MO: "Rocha",  MM: "Poortmans" },
  adolescentes:{ MG: "Slaughter",MO: "Rocha",  MM: "Poortmans" },
  adultos1:    { MG: "DurninWomersley",  MO: "Rocha",  MM: "Lee" },
  adultos2:    { MG: "DurninWomersley",  MO: "Rocha",  MM: "Lee" },
  adultos3:    { MG: "DurninWomersley",  MO: "Martin", MM: "Lee" },
  mayores:     { MG: "DurninWomersley",  MO: "Martin", MM: "Lee" },
  deportistas: { MG: "Faulkner", MO: "Rocha",  MM: "Lee" },
  obesos:      { MG: "Weltmann", MO: "Rocha",  MM: "Lee" }, // o Martin en MO
};

export type EvaluationMode =
  | "2C_Slaughter"
  | "2C_DurninWomersley"
  | "2C_Faulkner"
  | "2C_Carter"
  | "2C_Weltman"
  | "MULT_Express"
  | "MULT_Restringido"
  | "MULT_5Componentes"
  | "MULT_Completo";

  export type FormulaName =
  | "Slaughter"
  | "DurninWomersley"
  | "Faulkner"
  | "JacksonPollock"
  | "Carter"
  | "Withers"
  | "Weltmann"
  | "Rocha"
  | "Martin"
  | "Poortmans"
  | "Lee";


// Corresponds to the 'participants' table
export interface InitialRegistrationData {
  id: string; // Primary Key
  first_name: string; // Changed from firstName
  last_name: string; // Changed from lastName
  dob: string; // DATE in SQL, string (YYYY-MM-DD) in TS for transfer
  calculated_age: number; // NUMERIC(5,2)
  sex: 'Femenino' | 'Masculino' | 'Otro'; // TEXT in SQL
  email: string; // UNIQUE
  id_number: string; // UNIQUE (National ID or similar)
  accepted_terms: boolean; // From participant registration, not evaluation_records directly
  created_at?: string; // TIMESTAMPTZ
  updated_at?: string; // TIMESTAMPTZ
}

// Data specific to forms that might be filled by a representative
export interface RepresentativeData {
  repFirstName: string;
  repLastName: string;
  repEmail: string;
  repPhone: string;
  repIdNumber: string;
}

// Data specific to the evaluated person in child/adolescent forms
export interface EvaluatedPersonData {
  evalFirstName: string;
  evalLastName: string;
  evalIdNumber: string;
  evalSex: 'Femenino' | 'Masculino' | 'Otro';
  evalDob: string; // ISO string for form, will be Date in form state
  evalCalculatedAge: number;
  evalWeight: number;
  evalHeight: number;
}

export type Frequency = 'no' | '1-2' | '3-4' | '5-6' | '7+';
export const frequencyOptions: { value: Frequency, label: string, score: number }[] = [
  { value: 'no', label: 'No', score: 1 },
  { value: '1-2', label: '1-2 veces', score: 2 },
  { value: '3-4', label: '3-4 veces', score: 3 },
  { value: '5-6', label: '5-6 veces', score: 4 },
  { value: '7+', label: '7 o más veces', score: 5 },
];

export type DailyActivityFrequency = 'Ninguna' | 'Poca' | 'Normal' | 'Bastante' | 'Mucha';
export const dailyActivityOptions: { value: DailyActivityFrequency, label: string, score: number }[] = [
    { value: 'Ninguna', label: 'Ninguna', score: 1 },
    { value: 'Poca', label: 'Poca', score: 2 },
    { value: 'Normal', label: 'Normal', score: 3 },
    { value: 'Bastante', label: 'Bastante', score: 4 },
    { value: 'Mucha', label: 'Mucha', score: 5 },
];

// Types for Evaluation Records
export type FormType = 'PAQ-C' | 'PAQ-A' | 'IPAQ' | 'PAR-Q'  | 'TAMIZAJE'; // Corresponds to form_type_enum
export type EvaluationStatus = // Corresponds to evaluation_status_enum
  'Nueva' |
  'Pendiente Revisión Evaluador' |
  'Pruebas Asignadas Asistente' |
  'Resultados Parciales' |
  'Completada' |
  'Archivada';

// Configuration for assigned tests (to be stored in assigned_tests_config JSONB)
export interface AssignedTests {
  macroindices?: boolean;
  composicionCorporal?: boolean;
  somatotipo?: boolean;
}

// --- Assistant Test Data Structures (to be stored in test_results JSONB) ---
export interface GenericMeasure {
  m1: number | null;
  m2: number | null;
  m3?: number | null;
  result?: number | null;
}

export interface ZScoreData {
  id: string;
  label: string;
  zScore: number | null;
  originalValue: number | null;
  phantomMean: number;
  phantomSD: number;
  unit: string;
}

export interface CalculatedMacroindices {
  imc?: { value: number | null; classification?: string };
  livi?: number | null;
  roher?: { value: number | null; classification?: string };
  ponderal?: number | null;
  bouchard?: number | null;
  pignet?: { value: number | null; classification?: string };
  icc?: { value: number | null; classification?: string };
  ipc?: number | null;
  idsu?: number | null;
  ice?: number | null;
  idgc?: number | null;
  icConicidad?: number | null;
  icCormico?: { value: number | null; classification?: string };
  iai?: { value: number | null; classification?: string, interpretation?: string };
  ibBraquial?: { value: number | null; classification?: string, interpretation?: string };
  lrms?: { value: number | null; classification?: string, interpretation?: string };
  imManouvrier?: { value: number | null; classification?: string };
  lrmi?: { value: number | null; classification?: string, interpretation?: string };
  icCrural?: { value: number | null; classification?: string; interpretation?: string };
  iIntermembral?: number | null;
  iMusculoOseo? : number | null;
  iAdiposoMuscular?: number | null;

  // Esto solo aplica para niños y adolescentes menores de 18 años
  indiceMaduracion?: number | null; // Calculated maturity index
  edadPhv?: number | null; // Age at Peak Height Velocity
  clasMaduracion?: string | null; // Maturity classification
  faltaCm?: number | null; // Height deficit in cm
  estaturaAdultaEst ?: number | null; // Estimated adult height in cm
  edadEstimadaTallaAdulta?: number | null; // Estimated age for adult height in years

  zScoreProfile?: ZScoreData[];
}

export interface MacroindicesResults {
  masaCorporal: GenericMeasure;
  talla: GenericMeasure;
  tallaSentada?: GenericMeasure;
  envergaduraBrazos?: GenericMeasure;
  pliegueTriceps?: GenericMeasure;
  pliegueSubescapular?: GenericMeasure;
  pliegueBiceps?: GenericMeasure;
  pliegueCrestaIliaca?: GenericMeasure;
  pliegueSupraespinal?: GenericMeasure;
  pliegueAbdominal?: GenericMeasure;
  pliegueMusloAnterior?: GenericMeasure;
  plieguePiernaMedial?: GenericMeasure;
  perimetroCabeza?: GenericMeasure;
  perimetroCuello?: GenericMeasure;
  perimetroTorax?: GenericMeasure;
  perimetroCintura?: GenericMeasure;
  perimetroCadera?: GenericMeasure;
  perimetroBrazoRelajado?: GenericMeasure;
  perimetroBrazoFlexionadoContrido?: GenericMeasure;
  perimetroAntebrazo?: GenericMeasure;
  perimetroMuneca?: GenericMeasure;
  perimetroMusloSuperior?: GenericMeasure;
  perimetroMusloMedio?: GenericMeasure;
  perimetroPierna?: GenericMeasure;
  diametroBiacromial?: GenericMeasure;
  diametroBiiliocristal?: GenericMeasure;
  diametroAPAbdomen?: GenericMeasure;
  diametroHumero?: GenericMeasure;
  diametroFemur?: GenericMeasure;
  longitudAcromialeRadiale?: GenericMeasure;
  longitudRadialeStylion?: GenericMeasure;
  longitudStylionMedioDactylion?: GenericMeasure;
  alturaIliospinale?: GenericMeasure;
  alturaTrochanterion?: GenericMeasure;
  longitudTrochanterionTibialeLaterale?: GenericMeasure;
  longitudTibialeMedialeSphyrionTibiale?: GenericMeasure;
  calculatedIndices?: CalculatedMacroindices;

}



export const EXPRESS_DEFINITIONS = [
  // Medidas Básicas
  { id: "masa_corporal", label: "Masa Corporal", unit: "kg" },
  { id: "talla", label: "Talla", unit: "cm" },
  
  // Pliegues Cutáneos
  { id: "triceps", label: "Pliegue Tríceps", unit: "mm" },
  { id: "subescapular", label: "Pliegue Subescapular", unit: "mm" },
  { id: "supraespinal", label: "Pliegue Supraespinal", unit: "mm" },
  { id: "abdominal", label: "Pliegue Abdominal", unit: "mm" },
  { id: "muslo", label: "Pliegue Muslo", unit: "mm" },
  { id: "pierna", label: "Pliegue Pierna", unit: "mm" },

  // Perímetros
  { id: "brazo_relajado", label: "Brazo Relajado", unit: "cm" },
  { id: "brazo_flexionado_contraido", label: "Brazo Flexionado y Contraído", unit: "cm" },
  { id: "cintura", label: "Cintura", unit: "cm" },
  { id: "caderas", label: "Caderas", unit: "cm" },
  { id: "muslo_medio", label: "Muslo Medio", unit: "cm" },
  { id: "pierna_perimetro", label: "Perímetro Pierna", unit: "cm" },
];

export const MACROINDICES_DEFINITIONS: Array<{id: keyof Omit<MacroindicesResults, 'calculatedIndices'>; label: string; unit: string; threshold: number}> = [
    { id: "masaCorporal", label: "Masa Corporal ®", unit: "kg", threshold: 0.2 },
    { id: "talla", label: "Talla ®", unit: "cm", threshold: 0.5 },
    { id: "tallaSentada", label: "Talla Sentado ®", unit: "cm", threshold: 0.5 },
    { id: "envergaduraBrazos", label: "Envergadura de Brazos ®", unit: "cm", threshold: 0.5 },
    { id: "pliegueTriceps", label: "PL Tríceps ®", unit: "mm", threshold: 1.0 },
    { id: "pliegueSubescapular", label: "PL Subescapular ®", unit: "mm", threshold: 1.0 },
    { id: "pliegueBiceps", label: "PL Bíceps ®", unit: "mm", threshold: 1.0 },
    { id: "pliegueCrestaIliaca", label: "PL Cresta Ilíaca ®", unit: "mm", threshold: 1.0 },
    { id: "pliegueSupraespinal", label: "PL Supraespinal ®", unit: "mm", threshold: 1.0 },
    { id: "pliegueAbdominal", label: "PL Abdominal ®", unit: "mm", threshold: 1.0 },
    { id: "pliegueMusloAnterior", label: "PL Muslo Anterior ®", unit: "mm", threshold: 1.0 },
    { id: "plieguePiernaMedial", label: "PL Pierna Medial ®", unit: "mm", threshold: 1.0 },
    { id: "perimetroCabeza", label: "PR Cabeza", unit: "cm", threshold: 0.5 },
    { id: "perimetroCuello", label: "PR Cuello", unit: "cm", threshold: 0.5 },
    { id: "perimetroBrazoRelajado", label: "PR Brazo Relajado ®", unit: "cm", threshold: 0.5 },
    { id: "perimetroBrazoFlexionadoContrido", label: "PR Brazo Flexionado y Contraído ®", unit: "cm", threshold: 0.5 },
    { id: "perimetroAntebrazo", label: "PR Antebrazo", unit: "cm", threshold: 0.5 },
    { id: "perimetroMuneca", label: "PR Muñeca", unit: "cm", threshold: 0.5 },
    { id: "perimetroTorax", label: "PR Tórax", unit: "cm", threshold: 1.0 },
    { id: "perimetroCintura", label: "PR Cintura ®", unit: "cm", threshold: 1.0 },
    { id: "perimetroCadera", label: "PR Caderas ®", unit: "cm", threshold: 1.0 },
    { id: "perimetroMusloSuperior", label: "PR Muslo 1cm Glúteo", unit: "cm", threshold: 1.0 },
    { id: "perimetroMusloMedio", label: "PR Muslo Medio ®", unit: "cm", threshold: 1.0 },
    { id: "perimetroPierna", label: "PR Pierna (Pantorrilla) ®", unit: "cm", threshold: 1.0 },
    { id: "diametroBiacromial", label: "Diámetro biacromial", unit: "cm", threshold: 0.3 },
    { id: "diametroBiiliocristal", label: "Diámetro biiliocristal", unit: "cm", threshold: 0.3 },
    { id: "diametroAPAbdomen", label: "Diámetro antero-posterior del abdomen", unit: "cm", threshold: 0.5 },
    { id: "diametroHumero", label: "Diámetro Húmero (epicóndilo)", unit: "cm", threshold: 0.3 },
    { id: "diametroFemur", label: "Diámetro Fémur (epicóndilo)", unit: "cm", threshold: 0.3 },
    { id: "longitudAcromialeRadiale", label: "Longitud acromiale-radiale (brazo)", unit: "cm", threshold: 0.5 },
    { id: "longitudRadialeStylion", label: "Longitud radiale-stylion (antebrazo)", unit: "cm", threshold: 0.5 },
    { id: "longitudStylionMedioDactylion", label: "Longitud stylion medio-dactylion (mano)", unit: "cm", threshold: 0.5 },
    { id: "alturaIliospinale", label: "Altura iliospinale (ileoespinal)", unit: "cm", threshold: 0.5 },
    { id: "alturaTrochanterion", label: "Altura trochanterion", unit: "cm", threshold: 0.5 },
    { id: "longitudTrochanterionTibialeLaterale", label: "Longitud trochanterion-tibiale laterale (muslo)", unit: "cm", threshold: 0.5 },
];

export type ComposicionCorporalCategoria = 'Hombre Adulto' | 'Mujer Adulta' | 'Niño/Adolescente' | 'No Aplicable';

interface KerrBodyComponentModel {
  masaKg: number | null;
  porcentaje: number | null;
}

export interface KerrBodyComposition {
  masaMuscular: KerrBodyComponentModel;
  masaAdiposa: KerrBodyComponentModel;
  masaOsea: KerrBodyComponentModel;
  masaPiel: KerrBodyComponentModel;
  masaResidual: KerrBodyComponentModel;
  masaTotalKg: number | null;
}
export interface CalculatedComposicionCorporal {
  densidadCorporalDurnin?: number | null;
  porcentajeMasaGrasaSiri?: number | null;
  masaOseaRocha?: number | null;
  porcentajeGrasaObesosHombres?: number | null;
  porcentajeGrasaObesosMujeres?: number | null;
  masaGrasaKg?: number | null;
  masaOseaKg?: number | null;
  masaMuscularEsqueleticaKg?: number | null;
  categoriaCalculo?: ComposicionCorporalCategoria;
  kerrComponents?: KerrBodyComposition;
}

export interface ComposicionCorporalResults {
  
  peso: GenericMeasure;
  estatura: GenericMeasure;
  talla_sentado: GenericMeasure;
  pliegue_triceps: GenericMeasure;
  pliegue_subescapular: GenericMeasure;
  pliegue_supraespinal: GenericMeasure;
  pliegue_abdominal: GenericMeasure;
  pliegue_muslo_frontal: GenericMeasure;
  pliegue_pantorrilla: GenericMeasure;
  perimetro_cabeza: GenericMeasure;
  perimetro_brazo_relajado: GenericMeasure;
  perimetro_antebrazo: GenericMeasure;
  perimetro_muslo: GenericMeasure;
  perimetro_pantorrilla: GenericMeasure;
  perimetro_caja_toracica: GenericMeasure;
  perimetro_cintura: GenericMeasure;
  diametro_biacromial: GenericMeasure;
  diametro_biiliocristal: GenericMeasure;
  diametro_humero: GenericMeasure;
  diametro_femur: GenericMeasure;
  diametro_ap_caja_toracica: GenericMeasure;
  diametro_transversal_caja_toracica: GenericMeasure;

    /** @deprecated */
  circBrazoRelajado?: GenericMeasure;
    /** @deprecated */
  circBrazoContraido?: GenericMeasure;
    /** @deprecated */
  circCintura?: GenericMeasure;
    /** @deprecated */
  circCadera?: GenericMeasure;
    /** @deprecated */
  circMuslo?: GenericMeasure;
    /** @deprecated */
  circPantorrilla?: GenericMeasure;
    /** @deprecated */  
  pliegueTricipital?: GenericMeasure;
    /** @deprecated */
  pliegueSubescapular?: GenericMeasure;
    /** @deprecated */
  pliegueSuprailíaco?: GenericMeasure;
    /** @deprecated */
  pliegueAbdominal?: GenericMeasure;
    /** @deprecated */
  plieguePectoral?: GenericMeasure;
    /** @deprecated */
  pliegueMusloAnterior?: GenericMeasure;
    /** @deprecated */
  pliegueAxilarMedio?: GenericMeasure;
    /** @deprecated */
  pliegueBiceps?: GenericMeasure;
    /** @deprecated */
  diametroBiestiloideo?: GenericMeasure;
    /** @deprecated */
  diametroFemur?: GenericMeasure;
    /** @deprecated */
  diametroHumero?: GenericMeasure;
    /** @deprecated */
  circMuneca?: GenericMeasure;
    /** @deprecated */
  plieguePantorrillaMedial?: GenericMeasure;
    /** @deprecated */
  calculatedComposicion?: CalculatedComposicionCorporal;
}


export const COMPOSICION_CORPORAL_DEFINITIONS: Array<{id: keyof Omit<ComposicionCorporalResults, 'calculatedComposicion'>; label: string; unit: string; threshold: number}> = [
    { id: "peso", label: "Peso", unit: "kg", threshold: 0.2 },
    { id: "estatura", label: "Estatura", unit: "cm", threshold: 0.5 },
    { id: "circBrazoRelajado", label: "Circunferencia del brazo relajado", unit: "cm", threshold: 1.0 },
    { id: "circBrazoContraido", label: "Circunferencia del brazo contraído", unit: "cm", threshold: 1.0 },
    { id: "circCintura", label: "Circunferencia de la cintura", unit: "cm", threshold: 1.0 },
    { id: "circCadera", label: "Circunferencia de la cadera", unit: "cm", threshold: 1.0 },
    { id: "circMuslo", label: "Circunferencia del muslo", unit: "cm", threshold: 1.0 },
    { id: "circPantorrilla", label: "Circunferencia de la pantorrilla", unit: "cm", threshold: 1.0 },
    { id: "pliegueTricipital", label: "Pliegue tricipital", unit: "mm", threshold: 1.0 },
    { id: "pliegueSubescapular", label: "Pliegue subescapular", unit: "mm", threshold: 1.0 },
    { id: "pliegueSuprailíaco", label: "Pliegue suprailíaco", unit: "mm", threshold: 1.0 },
    { id: "pliegueAbdominal", label: "Pliegue abdominal", unit: "mm", threshold: 1.0 },
    { id: "plieguePectoral", label: "Pliegue pectoral", unit: "mm", threshold: 1.0 },
    { id: "pliegueMusloAnterior", label: "Pliegue muslo anterior", unit: "mm", threshold: 1.0 },
    { id: "pliegueAxilarMedio", label: "Pliegue axilar medio", unit: "mm", threshold: 1.0 },
    { id: "pliegueBiceps", label: "Pliegue bíceps", unit: "mm", threshold: 1.0 },
    { id: "diametroBiestiloideo", label: "Diámetro biestiloideo (muñeca)", unit: "cm", threshold: 0.3 },
    { id: "diametroFemur", label: "Diámetro fémur (epicóndilo)", unit: "cm", threshold: 0.3 },
    { id: "diametroHumero", label: "Diámetro húmero (epicóndilo)", unit: "cm", threshold: 0.3 },
    { id: "circMuneca", label: "Circunferencia de muñeca", unit: "cm", threshold: 0.5 },
    { id: "plieguePantorrillaMedial", label: "Pliegue pantorrilla medial", unit: "mm", threshold: 1.0 },
];

export interface CalculatedSomatotype {
  endomorfia: number | null;
  mesomorfia: number | null;
  ectomorfia: number | null;
  somatotypeString?: string;
}
export interface  SomatotipoResults {
  pliegueTriceps: GenericMeasure;
  pliegueSubescapular: GenericMeasure;
  pliegueSupraespinal: GenericMeasure;
  diametroHumero: GenericMeasure;
  diametroFemur: GenericMeasure;
  perimetroBrazoContraido: GenericMeasure;
  perimetroPierna: GenericMeasure;
  plieguePiernaMedial: GenericMeasure;
  talla: GenericMeasure;
  masaCorporal: GenericMeasure;
  calculatedSomatotype?: CalculatedSomatotype;
}

export const SOMATOTIPO_DEFINITIONS: Array<{id: keyof Omit<SomatotipoResults, 'calculatedSomatotype'>; label: string; unit: string; threshold: number}> = [
    { id: "pliegueTriceps", label: "Pliegue del tríceps", unit: "mm", threshold: 1.0 },
    { id: "pliegueSubescapular", label: "Pliegue subescapular", unit: "mm", threshold: 1.0 },
    { id: "pliegueSupraespinal", label: "Pliegue supraespinal", unit: "mm", threshold: 1.0 },
    { id: "diametroHumero", label: "Diámetro del húmero", unit: "cm", threshold: 0.3 },
    { id: "diametroFemur", label: "Diámetro del fémur", unit: "cm", threshold: 0.3 },
    { id: "perimetroBrazoContraido", label: "Perímetro del brazo flexionado y contraído", unit: "cm", threshold: 1.0 },
    { id: "perimetroPierna", label: "Perímetro de la pierna", unit: "cm", threshold: 1.0 },
    { id: "plieguePiernaMedial", label: "Pliegue de la pierna (pantorrilla medial)", unit: "mm", threshold: 1.0 },
    { id: "talla", label: "Talla", unit: "cm", threshold: 0.5 },
    { id: "masaCorporal", label: "Masa corporal", unit: "kg", threshold: 0.2 },
];

// Combined Test Results (to be stored in evaluation_records.test_results JSONB)
export interface TestResults {
  
    /** @deprecated Usar otros modos de evaluacion */
  macroindices?: MacroindicesResults;
      /** @deprecated Usar otros modos de evaluacion */
  composicionCorporal?: ComposicionCorporalResults;
      /** @deprecated Usar otros modos de evaluacion */

  somatotipo?: SomatotipoResults;

  express?: ExpressResults; 
  restringido?: RestringidoResults; 
  cinco_componentes?: CincoComponentesResults;
  completo?: CompletoResults; 

  dos_componentes?: DosComponentesResults;
  
  calculatedIndices?: CalculatedMacroindices;
  calculatedComposicion?: CalculatedComposicionCorporal; //Esto es para la composicion kerr
  calculatedSomatotype?: CalculatedSomatotype;

  calculatedComposicion4Componentes?: Resultados4Componentes,
  calculatedComposicion2Componentes?: Resultados2Componentes


}

// Corresponds to the 'evaluation_records' table
export interface EvaluationRecord {
  id: string; // PK
  participant_id: string; // FK to participants table
  form_type: FormType; // Uses form_type_enum
  submission_date: string; // TIMESTAMPTZ in DB, string (ISO) in TS
  status: EvaluationStatus; // Uses evaluation_status_enum
  evaluator_notes?: string | null;
  assistant_notes?: string | null;
  accepted_terms: boolean; // This is now at the root, as per your SQL

    // NUEVO CAMPO - etnia directa en la evaluación
  ethnicity?: Ethnicity | null;

  paq_score?: number | null; // NUMERIC
  paq_classification?: string | null; // TEXT
  ipaq_met_minutes?: number | null; // NUMERIC
  ipaq_classification?: string | null; // TEXT
  parq_requires_consultation?: boolean | null; // BOOLEAN

  // JSONB columns from SQL
  form_data?: any; // JSONB - Stores the raw submitted form data (e.g., PaqCFormValues, ParQFormValues)
  test_results?: TestResults | null; // JSONB - Stores results from assistant tests 
 
  /** @deprecated Usar evaluation_mode en lugar de este campo */
  assigned_tests_config?: AssignedTests | null; // JSONB - Stores the boolean config for which tests are assigned

  evaluation_mode?: EvaluationMode;
  // Optional: Populated during fetches by joining with 'participants' table
  participantData?: InitialRegistrationData;

  tamizaje_classification?: string; 

  created_at?: string; // TIMESTAMPTZ
  updated_at?: string; // TIMESTAMPTZ
}

// express

export const EXPRESS_SECTIONS = {
  medidas_basicas: [
    // 1% error allowed
    { id: "masa_corporal", label: "Masa Corporal", unit: "kg", threshold: 1 }, 
    { id: "talla", label: "Talla", unit: "cm", threshold: 1 },
  ],

    // 5% error allowed
  pliegues_cutaneos: [
    { id: "triceps", label: "Pliegue Tríceps", unit: "mm", threshold: 5 },
    { id: "subescapular", label: "Pliegue Subescapular", unit: "mm", threshold: 5 },
    { id: "supraespinal", label: "Pliegue Supraespinal", unit: "mm", threshold: 5 },
    { id: "abdominal", label: "Pliegue Abdominal", unit: "mm", threshold: 5 },
    { id: "muslo", label: "Pliegue Muslo", unit: "mm", threshold: 5 },
    { id: "pierna_pliegue", label: "Pliegue Pierna (Pantorrilla)", unit: "mm", threshold: 5 },
  ],

  // 1% error allowed
  perimetros: [
    { id: "brazo_relajado", label: "Perímetro Brazo Relajado", unit: "cm", threshold: 1 },
    { id: "brazo_flexionado_contraido", label: "Perímetro Brazo Flexionado y Contraído", unit: "cm", threshold: 1 },
    { id: "cintura", label: "Perímetro Cintura", unit: "cm", threshold: 1 },
    { id: "caderas", label: "Perímetro Caderas", unit: "cm", threshold: 1 },
    { id: "muslo_medio", label: "Perímetro Muslo Medio", unit: "cm", threshold: 1 },
    { id: "pierna_perimetro", label: "Perímetro Pierna (Pantorrilla)", unit: "cm", threshold: 1 },
  ],
};

export interface ExpressResults {
  etnia: Ethnicity;
  medidas_basicas: {
    masa_corporal: GenericMeasure;
    talla: GenericMeasure;
  };
  pliegues_cutaneos: {
    triceps: GenericMeasure;
    subescapular: GenericMeasure;
    supraespinal: GenericMeasure;
    abdominal: GenericMeasure;
    muslo: GenericMeasure;
    pierna_pliegue: GenericMeasure;
  };
  perimetros: {
    brazo_relajado: GenericMeasure;
    brazo_flexionado_contraido: GenericMeasure;
    cintura: GenericMeasure;
    caderas: GenericMeasure;
    muslo_medio: GenericMeasure;
    pierna_perimetro: GenericMeasure;
  };
  //   // 👇 calculables
  // calculatedIndices?: CalculatedMacroindices;
  // calculatedComposicion?: CalculatedComposicionCorporal;
  // calculatedSomatotype?: CalculatedSomatotype;
}

export const RESTRINGIDO_SECTIONS = {
  // 1% error allowed
  medidas_basicas: [
    { id: "masa_corporal", label: "Masa Corporal", unit: "kg", threshold: 1 },
    { id: "talla", label: "Talla", unit: "cm", threshold: 1 },
    { id: "talla_sentado", label: "Talla Sentado", unit: "cm", threshold: 1 },
    { id: "envergadura_brazos", label: "Envergadura de Brazos", unit: "cm", threshold: 1 },
  ],
    // 5% error allowed
  pliegues_cutaneos: [
    { id: "triceps", label: "Tríceps", unit: "mm", threshold: 5},
    { id: "subescapular", label: "Subescapular", unit: "mm", threshold: 5 },
    { id: "biceps", label: "Bíceps", unit: "mm", threshold: 5 },
    { id: "cresta_iliaca", label: "Cresta Ilíaca", unit: "mm", threshold: 5 },
    { id: "supraespinal", label: "Supraespinal", unit: "mm", threshold: 5 },
    { id: "abdominal", label: "Abdominal", unit: "mm", threshold: 5 },
    { id: "muslo", label: "Muslo", unit: "mm", threshold: 5 },
    { id: "pierna_pliegue", label: "Pliegue Pierna (Pantorrilla)", unit: "mm", threshold: 5 },
  ],
  // 1% error allowed
  perimetros: [
    { id: "brazo_relajado", label: "Brazo Relajado", unit: "cm", threshold: 1 },
    { id: "brazo_flexionado_contraido", label: "Brazo Flexionado Contraído", unit: "cm", threshold: 1 },
    { id: "cintura", label: "Cintura", unit: "cm", threshold: 1 },
    { id: "caderas", label: "Caderas", unit: "cm", threshold: 1 },
    { id: "muslo_medio", label: "Muslo Medio", unit: "cm", threshold: 1 },
    { id: "pierna_perimetro", label: "Perímetro Pierna (Pantorrilla)", unit: "cm", threshold: 1 },
  ],
  // 1% error allowed
  diametros: [
    { id: "humero", label: "Húmero", unit: "cm", threshold: 1 },
    { id: "biestiloideo", label: "Biestiloideo", unit: "cm", threshold: 1 },
    { id: "femur", label: "Fémur", unit: "cm", threshold: 1 },
  ],
}

export interface RestringidoResults {
  etnia: Ethnicity;
  medidas_basicas: {
    masa_corporal: GenericMeasure;
    talla: GenericMeasure;
    talla_sentado: GenericMeasure;
    envergadura_brazos: GenericMeasure;
  };
  pliegues_cutaneos: {
    triceps: GenericMeasure;
    subescapular: GenericMeasure;
    biceps: GenericMeasure;
    cresta_iliaca: GenericMeasure;
    supraespinal: GenericMeasure;
    abdominal: GenericMeasure;
    muslo: GenericMeasure;
    pierna_pliegue: GenericMeasure;
  };
  perimetros: {
    brazo_relajado: GenericMeasure;
    brazo_flexionado_contraido: GenericMeasure;
    cintura: GenericMeasure;
    caderas: GenericMeasure;
    muslo_medio: GenericMeasure;
    pierna_perimetro: GenericMeasure;
  };
  diametros: {
    humero: GenericMeasure;
    biestiloideo: GenericMeasure;
    femur: GenericMeasure;
  };
}

export const CINCOCOMPONENTES_SECTIONS = {

  // 1% error allowed
  medidas_basicas: [
    { id: "masa_corporal", label: "Masa corporal", unit: "kg", threshold: 1 },
    { id: "talla", label: "Talla", unit: "cm", threshold: 1 },
    { id: "talla_sentado", label: "Talla sentado", unit: "cm", threshold: 1 },
  ],
  // 5% error allowed
  pliegues_cutaneos: [
    { id: "triceps", label: "Tríceps", unit: "mm", threshold: 5 },
    { id: "subescapular", label: "Subescapular", unit: "mm", threshold: 5 },
    { id: "biceps", label: "Bíceps", unit: "mm", threshold: 5 },
    { id: "cresta_iliaca", label: "Cresta Ilíaca", unit: "mm", threshold: 5 },
    { id: "supraespinal", label: "Supraespinal", unit: "mm", threshold: 5 },
    { id: "abdominal", label: "Abdominal", unit: "mm", threshold: 5 },
    { id: "muslo", label: "Muslo", unit: "mm", threshold: 5 },
    { id: "pierna_pliegue", label: "Pliegue Pierna (Pantorrilla)", unit: "mm", threshold: 5 },
  ],
  // 1% error allowed
  perimetros: [
    { id: "cabeza", label: "Cabeza", unit: "cm", threshold: 1 },
    { id: "brazo_relajado", label: "Brazo relajado", unit: "cm", threshold: 1 },
    { id: "brazo_flexionado_contraido", label: "Brazo flexionado/contraído", unit: "cm", threshold: 1 },
    { id: "antebrazo", label: "Antebrazo", unit: "cm", threshold: 1 },
    { id: "torax", label: "Tórax", unit: "cm", threshold: 1 },
    { id: "cintura", label: "Cintura", unit: "cm", threshold: 1 },
    { id: "caderas", label: "Caderas", unit: "cm", threshold: 1 },
    { id: "muslo_medio", label: "Muslo medio", unit: "cm", threshold: 1 },
    { id: "pierna_perimetro", label: "Pierna", unit: "cm", threshold: 1 },
  ],
  // 1% error allowed
  diametros: [
    { id: "biacromial", label: "Biacromial", unit: "cm", threshold: 1 },
    { id: "biliocrestal", label: "Biliocrestal", unit: "cm", threshold: 1 },
    { id: "transverso_torax", label: "Transverso tórax", unit: "cm", threshold: 1 },
    { id: "antero_posterior_torax", label: "Ántero posterior tórax", unit: "cm", threshold: 1 },
    { id: "humero", label: "Húmero", unit: "cm", threshold: 1 },
    { id: "femur", label: "Fémur", unit: "cm", threshold: 1 },
  ],
};

// --- Estructura específica para 5 Componentes ---
export interface CincoComponentesResults {
  etnia: Ethnicity;
  medidas_basicas: {
    masa_corporal: GenericMeasure;
    talla: GenericMeasure;
    talla_sentado: GenericMeasure;
  };
  pliegues_cutaneos: {
    triceps: GenericMeasure;
    subescapular: GenericMeasure;
    biceps: GenericMeasure;
    cresta_iliaca: GenericMeasure;
    supraespinal: GenericMeasure;
    abdominal: GenericMeasure;
    muslo: GenericMeasure;
    pierna_pliegue: GenericMeasure;
  };
  perimetros: {
    cabeza: GenericMeasure;
    brazo_relajado: GenericMeasure;
    brazo_flexionado_contraido: GenericMeasure;
    antebrazo: GenericMeasure;
    torax: GenericMeasure;
    cintura: GenericMeasure;
    caderas: GenericMeasure;
    muslo_medio: GenericMeasure;
    pierna_perimetro: GenericMeasure;
  };
  diametros: {
    biacromial: GenericMeasure;
    biliocrestal: GenericMeasure;
    transverso_torax: GenericMeasure;
    antero_posterior_torax: GenericMeasure;
    humero: GenericMeasure;
    femur: GenericMeasure;
  };
  
}

export const COMPLETO_SECTIONS = {
  // 1% error allowed
  medidas_basicas: [
    { id: "masa_corporal", label: "Masa corporal", unit: "kg", threshold: 1 },
    { id: "talla", label: "Talla", unit: "cm", threshold: 1 },
    { id: "talla_sentado", label: "Talla sentado", unit: "cm", threshold: 1 },
    { id: "envergadura_brazos", label: "Envergadura de brazos", unit: "cm", threshold: 1 },
  ],
  // 5% error allowed
  pliegues_cutaneos: [
    { id: "triceps", label: "Tríceps", unit: "mm", threshold: 5 },
    { id: "subescapular", label: "Subescapular", unit: "mm", threshold: 5 },
    { id: "biceps", label: "Bíceps", unit: "mm", threshold: 5 },
    { id: "cresta_iliaca", label: "Cresta ilíaca", unit: "mm", threshold: 5 },
    { id: "supraespinal", label: "Supraespinal", unit: "mm", threshold: 5 },
    { id: "abdominal", label: "Abdominal", unit: "mm", threshold: 5 },
    { id: "muslo", label: "Muslo anterior", unit: "mm", threshold: 5 },
    { id: "pierna_pliegue", label: "Pierna medial", unit: "mm", threshold: 5 },
  ],
  // 1% error allowed
  perimetros: [
    { id: "cabeza", label: "Cabeza", unit: "cm", threshold: 1 },
    { id: "cuello", label: "Cuello", unit: "cm", threshold: 1 },
    { id: "brazo_relajado", label: "Brazo relajado", unit: "cm", threshold: 1 },
    { id: "brazo_flexionado_contraido", label: "Brazo flexionado contraído", unit: "cm", threshold: 1 },
    { id: "antebrazo", label: "Antebrazo", unit: "cm", threshold: 1 },
    { id: "muneca", label: "Muñeca", unit: "cm", threshold: 1 },
    { id: "torax", label: "Tórax", unit: "cm", threshold: 1 },
    { id: "cintura", label: "Cintura", unit: "cm", threshold: 1 },
    { id: "caderas", label: "Caderas", unit: "cm", threshold: 1 },
    { id: "muslo_1cm_gluteo", label: "Muslo (1 cm bajo glúteo)", unit: "cm", threshold: 1 },
    { id: "muslo_medio", label: "Muslo medio", unit: "cm", threshold: 1 },
    { id: "pierna_perimetro", label: "Pierna", unit: "cm", threshold: 1 },
    { id: "tobillo", label: "Tobillo", unit: "cm", threshold: 1 },
  ],
  // 1% error allowed
  longitudes_alturas: [
    { id: "acromiale_radiale", label: "Acromiale Radiale", unit: "cm", threshold: 1 },
    { id: "radiale_stylion", label: "Radiale Stylion", unit: "cm", threshold: 1 },
    { id: "stylion_medio_dactylion", label: "Stylion Medio Dactylion", unit: "cm", threshold: 1 },
    { id: "altura_ilioespinale", label: "Altura Ilioespinale", unit: "cm", threshold: 1 },
    { id: "altura_trochanterion", label: "Altura Trochanterion", unit: "cm", threshold: 1 },
    { id: "trochanterion_tibiale_laterale", label: "Trochanterion Tibiale Laterale", unit: "cm", threshold: 1 },
    { id: "altura_tibiale_laterale", label: "Altura Tibiale Laterale", unit: "cm", threshold: 1 },
    { id: "pie", label: "Longitud del pie", unit: "cm", threshold: 1 },
    { id: "tibiale_mediale_sphyrion_tibiale", label: "Tibiale Mediale Sphyrion Tibiale", unit: "cm", threshold: 1 },
  ],
  // 1% error allowed
  diametros: [
    { id: "biacromial", label: "Biacromial", unit: "cm", threshold: 1 },
    { id: "antero_posterior_abdomen", label: "Ántero posterior abdomen", unit: "cm", threshold: 1 },
    { id: "biliocrestal", label: "Biliocrestal", unit: "cm", threshold: 1 },
    { id: "transverso_torax", label: "Transverso tórax", unit: "cm", threshold: 1 },
    { id: "antero_posterior_torax", label: "Ántero posterior tórax", unit: "cm", threshold: 1 },
    { id: "humero", label: "Húmero", unit: "cm", threshold: 1 },
    { id: "biestiloideo", label: "Biestiloideo", unit: "cm", threshold: 1 },
    { id: "femur", label: "Fémur", unit: "cm", threshold: 1 },
    { id: "bimaleolar", label: "Bimaleolar", unit: "cm", threshold: 1 },
  ],
};

export interface CompletoResults {
  etnia: Ethnicity;
  medidas_basicas: {
    masa_corporal: GenericMeasure;
    talla: GenericMeasure;
    talla_sentado: GenericMeasure;
    envergadura_brazos: GenericMeasure;
  };
  pliegues_cutaneos: {
    triceps: GenericMeasure;
    subescapular: GenericMeasure;
    biceps: GenericMeasure;
    cresta_iliaca: GenericMeasure;
    supraespinal: GenericMeasure;
    abdominal: GenericMeasure;
    muslo: GenericMeasure;
    pierna_pliegue: GenericMeasure;
  };
  perimetros: {
    cabeza: GenericMeasure;
    cuello: GenericMeasure;
    brazo_relajado: GenericMeasure;
    brazo_flexionado_contraido: GenericMeasure;
    antebrazo: GenericMeasure;
    muneca: GenericMeasure;
    torax: GenericMeasure;
    cintura: GenericMeasure;
    caderas: GenericMeasure;
    muslo_1cm_gluteo: GenericMeasure;
    muslo_medio: GenericMeasure;
    pierna_perimetro: GenericMeasure;
    tobillo: GenericMeasure;
  };
  longitudes_alturas: {
    acromiale_radiale: GenericMeasure;
    radiale_stylion: GenericMeasure;
    stylion_medio_dactylion: GenericMeasure;
    altura_ilioespinale: GenericMeasure;
    altura_trochanterion: GenericMeasure;
    trochanterion_tibiale_laterale: GenericMeasure;
    altura_tibiale_laterale: GenericMeasure;
    pie: GenericMeasure;
    tibiale_mediale_sphyrion_tibiale: GenericMeasure;
  };
  diametros: {
    biacromial: GenericMeasure;
    antero_posterior_abdomen: GenericMeasure;
    biliocrestal: GenericMeasure;
    transverso_torax: GenericMeasure;
    antero_posterior_torax: GenericMeasure;
    humero: GenericMeasure;
    biestiloideo: GenericMeasure;
    femur: GenericMeasure;
    bimaleolar: GenericMeasure;
  };

}
// --- Resultados de MG (Masa Grasa) por grupo ---

export interface MGNiñosResults {
  peso: GenericMeasure;
  triceps: GenericMeasure;
  pierna_medial: GenericMeasure;
  calculated?: MGResult; // 👈 opcional: resultado del cálculo
}

export interface MGAdolescentesResults {
  triceps: GenericMeasure;
  pierna_medial: GenericMeasure;
  calculated?: MGResult;
}

export interface MGAdultosResults {
  triceps: GenericMeasure;
  biceps: GenericMeasure;
  subescapular: GenericMeasure;
  cresta_iliaca: GenericMeasure;
  peso: GenericMeasure;
  calculated?: MGResult;
}

export interface MGDeportistasFaulknerResults {
  triceps: GenericMeasure;
  subescapular: GenericMeasure;
  supraespinal: GenericMeasure;
  abdominal: GenericMeasure;
  calculated?: MGResult;
  peso?: GenericMeasure; 
}

export interface MGDeportistasCarterResults {
  triceps: GenericMeasure;
  subescapular: GenericMeasure;
  supraespinal: GenericMeasure;
  abdominal: GenericMeasure;
  muslo_anterior: GenericMeasure;  
  pierna_medial: GenericMeasure;
  calculated?: MGResult;
  peso?: GenericMeasure; 
}

// export interface MGDeportistasMujeresResults {
//   triceps: GenericMeasure;
//   subescapular: GenericMeasure;
//   supraespinal: GenericMeasure;
//   abdominal: GenericMeasure;
//   muslo_anterior?: GenericMeasure;
//   pierna_medial?: GenericMeasure;
//   calculated?: MGResult;
// }

export interface MGObesosResults {
  // perimetro_abdomen: GenericMeasure;
  pabd1: GenericMeasure,
  pabd2: GenericMeasure,
  talla?: GenericMeasure
  peso: GenericMeasure;
  calculated?: MGResult;
}

// --- Resultados de Dos Componentes ---
export interface DosComponentesResults {
  // MG (Masa Grasa) por grupo
  mg_niños?: MGNiñosResults;
  mg_adolescentes?: MGAdolescentesResults;
  mg_adultos?: MGAdultosResults;
  mg_deportistas_faulkner?: MGDeportistasFaulknerResults;
  mg_deportistas_carter?: MGDeportistasCarterResults; //mismos campos que Faulkner
  mg_obesos?: MGObesosResults;

  // 🔹 Si más adelante agregas MO, MM y Resto
  // mo?: MOResults; 
  // mm?: MMResults;
  // resto?: RestoResults;
}


export const ADULTOS_SECTIONS = {
  // 1% error allowed
  medidas_basicas: [
    { id: "peso", label: "Peso", unit: "kg", threshold: 1 },
  ],
  // 5% error allowed
  pliegues_cutaneos: [
    { id: "triceps", label: "Pliegue Tríceps", unit: "mm", threshold: 5 },
    { id: "biceps", label: "Pliegue Bíceps", unit: "mm", threshold: 5 },
    { id: "subescapular", label: "Pliegue Subescapular", unit: "mm", threshold: 5 },
    { id: "cresta_iliaca", label: "Pliegue Cresta Ilíaca", unit: "mm", threshold: 5 },
  ],

};

// --- Secciones para la prueba de niños (Slaughter u otros 2C) ---
export const NINOS_SECTIONS = {
  // 1% error allowed
  medidas_basicas: [
    { id: "peso", label: "Peso", unit: "kg", threshold: 1 },
    // { id: "talla", label: "Talla", unit: "cm", threshold: 0.5 },
  ],
  // 5% error allowed
  pliegues_cutaneos: [
    { id: "triceps", label: "Pliegue Tríceps", unit: "mm", threshold: 5 },
    { id: "pierna_medial", label: "Pliegue Pierna Medial", unit: "mm", threshold: 5 },
  ],

};

export const OBESOS_SECTIONS = {
  // 1% error allowed
  medidas_basicas: [
    { id: "peso", label: "Peso Corporal", unit: "kg", threshold: 1 },
    { id: "talla", label: "Talla", unit: "cm", threshold: 1 }, //no deberia pedirlo en hombres
  ],
  // 1% error allowed
  perimetros: [
    {
      id: "pabd1",
      label: "Perímetro Abdominal 1. Entre últimas costillas y cresta ilíaca, por delante entre xifoides y ombligo",
      unit: "cm",
      threshold: 1,
    },
    {
      id: "pabd2",
      label: "Perímetro Abdominal 2. A nivel de crestas ilíacas y por delante a nivel del ombligo",
      unit: "cm",
      threshold: 1,
    },
  ],
};

export const DEPORTISTAS_FAULKNER_SECTIONS = {
  medidas_basicas: [
    { id: "peso", label: "Peso corporal", unit: "kg", threshold: 1 },
  ],
  pliegues_cutaneos: [
    { id: "triceps", label: "Tríceps", unit: "mm", threshold: 5 },
    { id: "subescapular", label: "Subescapular", unit: "mm", threshold: 5 },
    { id: "supraespinal", label: "Supraespinal", unit: "mm", threshold: 5 },
    { id: "abdominal", label: "Abdominal", unit: "mm", threshold: 5 },
  ],
};

export const DEPORTISTAS_CARTER_SECTIONS = {
  medidas_basicas: [
    { id: "peso", label: "Peso Corporal", unit: "kg", threshold: 1 },
  ],
  pliegues_cutaneos: [
    { id: "triceps", label: "Pliegue Tríceps", unit: "mm", threshold: 5 },
    { id: "subescapular", label: "Pliegue Subescapular", unit: "mm", threshold: 5 },
    { id: "supraespinal", label: "Pliegue Supraespinal", unit: "mm", threshold: 5 },
    { id: "abdominal", label: "Pliegue Abdominal", unit: "mm", threshold: 5 },
    { id: "muslo_anterior", label: "Pliegue Muslo Anterior", unit: "mm", threshold: 5 },
    { id: "pierna_medial", label: "Pliegue Pierna Medial", unit: "mm", threshold: 5 },
  ],
};

export enum Ethnicity {
  ASIATICO = "asiatico",
  AFROMEAMERICANO = "afroamericano",
  CAUSASICO_HISPANO = "caucasico_hispano",
}