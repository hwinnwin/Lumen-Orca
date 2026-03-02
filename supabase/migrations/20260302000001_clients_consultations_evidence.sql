-- ============================================================================
-- Clients, Consultations, and Evidence persistence tables
-- ============================================================================

-- 1. CLIENTS TABLE - Admin client management
CREATE TABLE IF NOT EXISTS public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  package text NOT NULL DEFAULT 'Professional'
    CHECK (package IN ('Starter', 'Professional', 'Enterprise')),
  status text NOT NULL DEFAULT 'discovery'
    CHECK (status IN ('discovery', 'design', 'build', 'launch', 'completed', 'paused')),
  progress integer NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  start_date date,
  launch_date date,
  total_value numeric NOT NULL DEFAULT 0,
  paid_amount numeric NOT NULL DEFAULT 0,
  success_manager text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_email ON public.clients(email);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view clients"
  ON public.clients FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage clients"
  ON public.clients FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 2. CONSULTATIONS TABLE - Booking form submissions
CREATE TABLE IF NOT EXISTS public.consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  business_name text,
  business_type text,
  current_revenue text,
  target_revenue text,
  biggest_challenge text,
  timeline text,
  budget text,
  preferred_date date,
  preferred_time text,
  how_did_you_hear text,
  additional_info text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_consultations_status ON public.consultations(status);
CREATE INDEX idx_consultations_email ON public.consultations(email);

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a consultation (even unauthenticated via anon key)
CREATE POLICY "Anyone can create consultations"
  ON public.consultations FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view consultations"
  ON public.consultations FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can update consultations"
  ON public.consultations FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- 3. EVIDENCE BUNDLES TABLE - Persistent evidence storage
CREATE TABLE IF NOT EXISTS public.evidence_bundles (
  id text PRIMARY KEY, -- e.g. BUNDLE-1709...
  epoch integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'passed'
    CHECK (status IN ('passed', 'failed')),
  f_total numeric NOT NULL DEFAULT 0,
  gates jsonb NOT NULL DEFAULT '[]',
  artifacts text[] NOT NULL DEFAULT '{}',
  orchestrator_state jsonb,
  html_content text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_evidence_bundles_user ON public.evidence_bundles(user_id);
CREATE INDEX idx_evidence_bundles_status ON public.evidence_bundles(status);

ALTER TABLE public.evidence_bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view evidence bundles"
  ON public.evidence_bundles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create evidence bundles"
  ON public.evidence_bundles FOR INSERT TO authenticated
  WITH CHECK (true);

-- 4. CLIENT MESSAGES TABLE - for Client Portal messaging
CREATE TABLE IF NOT EXISTS public.client_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  sender_name text NOT NULL,
  message text NOT NULL,
  is_team boolean NOT NULL DEFAULT false,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_messages_client ON public.client_messages(client_id, created_at DESC);

ALTER TABLE public.client_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view messages"
  ON public.client_messages FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can send messages"
  ON public.client_messages FOR INSERT TO authenticated
  WITH CHECK (true);

-- 5. CLIENT DOCUMENTS TABLE - for Client Portal documents
CREATE TABLE IF NOT EXISTS public.client_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_path text,
  file_size text,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_documents_client ON public.client_documents(client_id);

ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view documents"
  ON public.client_documents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can upload documents"
  ON public.client_documents FOR INSERT TO authenticated
  WITH CHECK (true);
