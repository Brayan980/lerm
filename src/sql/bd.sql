-- Drop existing types if they exist
DROP TYPE IF EXISTS "public"."user_role_enum";
DROP TYPE IF EXISTS "public"."form_type_enum";
DROP TYPE IF EXISTS "public"."evaluation_status_enum";
DROP TYPE IF EXISTS "public"."evaluation_mode_enum";

-- Create ENUM types
CREATE TYPE "public"."user_role_enum" AS ENUM ('Admin', 'Evaluator', 'Assistant');

CREATE TYPE "public"."form_type_enum" AS ENUM ('PAQ-C', 'PAQ-A', 'IPAQ', 'PAR-Q');

CREATE TYPE "public"."evaluation_status_enum" AS ENUM (
    'Nueva',
    'Pendiente Revisión Evaluador',
    'Pruebas Asignadas Asistente',
    'Resultados Parciales',
    'Completada',
    'Archivada'
);

CREATE TYPE "public"."evaluation_mode_enum" AS ENUM (
    '2C_F1',
    '2C_F2',
    '2C_F3',
    '2C_F4',
    'MULT_Express',
    'MULT_Restringido',
    'MULT_5Componentes',
    'MULT_Completo'
);

-- Create tables
CREATE TABLE "public"."users" (
    "id" varchar(255) NOT NULL,
    "username" varchar(255) NOT NULL,
    "password" varchar(255) NOT NULL,
    "role" "public"."user_role_enum" NOT NULL,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

-- Users indices
CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);
CREATE INDEX idx_users_username ON public.users USING btree (lower((username)::text));

CREATE TABLE "public"."participants" (
    "id" varchar(255) NOT NULL,
    "first_name" varchar(255) NOT NULL,
    "last_name" varchar(255) NOT NULL,
    "dob" date NOT NULL,
    "calculated_age" numeric(5,2) NOT NULL,
    "sex" text NOT NULL,
    "email" varchar(255) NOT NULL,
    "id_number" varchar(50) NOT NULL,
    "accepted_terms" bool DEFAULT false,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("id")
);

-- Participants indices
CREATE UNIQUE INDEX participants_email_key ON public.participants USING btree (email);
CREATE UNIQUE INDEX participants_id_number_key ON public.participants USING btree (id_number);
CREATE INDEX idx_participants_email ON public.participants USING btree (lower((email)::text));

CREATE TABLE "public"."evaluation_records" (
    "id" varchar(255) NOT NULL,
    "participant_id" varchar(255) NOT NULL,
    "form_type" "public"."form_type_enum" NOT NULL,
    "submission_date" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "status" "public"."evaluation_status_enum" DEFAULT 'Nueva'::evaluation_status_enum,
    "evaluator_notes" text,
    "assistant_notes" text,
    "accepted_terms" bool DEFAULT false,
    "paq_score" numeric(5,2),
    "paq_classification" varchar(255),
    "ipaq_met_minutes" numeric(10,2),
    "ipaq_classification" varchar(255),
    "parq_requires_consultation" bool,
    "form_data" jsonb,
    "test_results" jsonb,
    "assigned_tests_config" jsonb,
    "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "evaluation_mode" "public"."evaluation_mode_enum",
    CONSTRAINT "evaluation_records_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);
);

-- Evaluation records indices
CREATE INDEX idx_eval_records_form_type ON public.evaluation_records USING btree (form_type);
CREATE INDEX idx_eval_records_participant_id ON public.evaluation_records USING btree (participant_id);
CREATE INDEX idx_eval_records_status ON public.evaluation_records USING btree (status);

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_email_key UNIQUE (email);

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_id_number_key UNIQUE (id_number);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);

ALTER TABLE ONLY public.evaluation_records
    ADD CONSTRAINT evaluation_records_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.participants(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX idx_eval_records_form_type ON public.evaluation_records USING btree (form_type);

CREATE INDEX idx_eval_records_participant_id ON public.evaluation_records USING btree (participant_id);

CREATE INDEX idx_eval_records_status ON public.evaluation_records USING btree (status);

CREATE INDEX idx_participants_email ON public.participants USING btree (lower(email::text));

CREATE INDEX idx_users_username ON public.users USING btree (lower(username::text));

-- Create triggers
CREATE TRIGGER update_evaluation_records_updated_at
    BEFORE UPDATE ON public.evaluation_records
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_participants_updated_at
    BEFORE UPDATE ON public.participants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
