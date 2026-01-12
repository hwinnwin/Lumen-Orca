-- ============================================================================
-- NoMoreHunger: Distributed Food Redistribution Network
-- Protocol 69: Never take. Always give back more.
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE nmh_node_status AS ENUM ('dormant', 'active', 'contributing', 'offline');
CREATE TYPE nmh_hunger_level AS ENUM ('okay', 'getting_hungry', 'very_hungry', 'havent_eaten');
CREATE TYPE nmh_last_meal AS ENUM ('today', 'yesterday', 'two_plus_days', 'cant_remember');
CREATE TYPE nmh_household_type AS ENUM ('just_me', 'kids_at_home', 'elderly_dependent', 'multiple_mouths');
CREATE TYPE nmh_credit_action AS ENUM ('node_contribution', 'food_delivery', 'source_mapped', 'depot_hosting', 'grower_contribution');
CREATE TYPE nmh_credit_redemption AS ENUM ('hodl', 'gift', 'pass_forward');
CREATE TYPE nmh_food_source_type AS ENUM ('restaurant', 'grocery', 'farm', 'event', 'home_garden');
CREATE TYPE nmh_depot_tier AS ENUM ('hub', 'mini_depot', 'home_node');
CREATE TYPE nmh_carrier_status AS ENUM ('available', 'en_route', 'delivering', 'offline');
CREATE TYPE nmh_food_status AS ENUM ('available', 'claimed', 'in_transit', 'delivered', 'expired');
CREATE TYPE nmh_delivery_status AS ENUM ('planned', 'active', 'completed', 'cancelled');
CREATE TYPE nmh_transport_mode AS ENUM ('walking', 'cycling', 'driving');
CREATE TYPE nmh_participant_role AS ENUM ('node', 'carrier', 'depot_host', 'mapper', 'grower', 'recipient');

-- ============================================================================
-- PARTICIPANTS (Core user extension for NoMoreHunger)
-- ============================================================================

CREATE TABLE nmh_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    roles nmh_participant_role[] DEFAULT ARRAY['node']::nmh_participant_role[],
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    location_accuracy DOUBLE PRECISION,

    -- Impact metrics
    meals_contributed INTEGER DEFAULT 0,
    meals_received INTEGER DEFAULT 0,
    deliveries_completed INTEGER DEFAULT 0,
    sources_mapped INTEGER DEFAULT 0,
    compute_hours_contributed DOUBLE PRECISION DEFAULT 0,
    community_karma INTEGER DEFAULT 0,

    joined_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- ============================================================================
-- CREDIT WALLETS (Dragon's Treasure)
-- ============================================================================

CREATE TABLE nmh_credit_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_earned DOUBLE PRECISION DEFAULT 0,
    total_redeemed DOUBLE PRECISION DEFAULT 0,
    balance DOUBLE PRECISION DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- ============================================================================
-- CREDITS (Individual credit transactions)
-- ============================================================================

CREATE TABLE nmh_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES nmh_credit_wallets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DOUBLE PRECISION NOT NULL,
    action_type nmh_credit_action NOT NULL,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    redeemed BOOLEAN DEFAULT FALSE,
    redemption_type nmh_credit_redemption,
    redeemed_at TIMESTAMPTZ,

    -- For gift transfers
    gifted_to_user_id UUID REFERENCES auth.users(id),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- COMPUTE NODES (Fire Pillar)
-- ============================================================================

CREATE TABLE nmh_compute_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status nmh_node_status DEFAULT 'dormant',
    contribution_mode TEXT DEFAULT 'volunteer' CHECK (contribution_mode IN ('volunteer', 'earn')),

    -- Metrics
    cpu_cycles_contributed BIGINT DEFAULT 0,
    battery_used_percent DOUBLE PRECISION DEFAULT 0,
    data_transferred_mb DOUBLE PRECISION DEFAULT 0,
    uptime_minutes INTEGER DEFAULT 0,
    credits_earned DOUBLE PRECISION DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- ============================================================================
-- HUNGER ASSESSMENTS (Priority Engine Input)
-- ============================================================================

CREATE TABLE nmh_hunger_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    hunger_level nmh_hunger_level NOT NULL,
    last_meal_time nmh_last_meal NOT NULL,
    household_type nmh_household_type NOT NULL,
    location_lat DOUBLE PRECISION NOT NULL,
    location_lng DOUBLE PRECISION NOT NULL,
    location_accuracy DOUBLE PRECISION,

    -- Priority score (calculated)
    priority_score DOUBLE PRECISION,
    need_weight DOUBLE PRECISION,
    proximity_weight DOUBLE PRECISION,
    queue_position INTEGER,
    estimated_wait_minutes INTEGER,

    -- Status
    fulfilled BOOLEAN DEFAULT FALSE,
    fulfilled_at TIMESTAMPTZ,
    fulfilled_by_delivery_id UUID,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FOOD SOURCES (Water Pillar - Origins)
-- ============================================================================

CREATE TABLE nmh_food_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type nmh_food_source_type NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    location_lat DOUBLE PRECISION NOT NULL,
    location_lng DOUBLE PRECISION NOT NULL,
    address TEXT,

    -- Verification
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),

    -- Mapper info
    mapped_by UUID NOT NULL REFERENCES auth.users(id),
    mapped_at TIMESTAMPTZ DEFAULT NOW(),

    -- Trust score (builds over time)
    reliability DOUBLE PRECISION DEFAULT 0.5 CHECK (reliability >= 0 AND reliability <= 1),
    successful_pickups INTEGER DEFAULT 0,
    failed_pickups INTEGER DEFAULT 0,

    -- Availability
    is_active BOOLEAN DEFAULT TRUE,
    operating_hours JSONB, -- {"monday": {"open": "09:00", "close": "21:00"}, ...}

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FOOD ITEMS (Available food at sources)
-- ============================================================================

CREATE TABLE nmh_food_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES nmh_food_sources(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit TEXT DEFAULT 'portion',

    -- Freshness window
    available_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    -- Status tracking
    status nmh_food_status DEFAULT 'available',
    claimed_by UUID REFERENCES auth.users(id),
    claimed_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DEPOTS (Earth Pillar)
-- ============================================================================

CREATE TABLE nmh_depots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier nmh_depot_tier NOT NULL,
    host_user_id UUID NOT NULL REFERENCES auth.users(id),
    name TEXT NOT NULL,
    description TEXT,
    location_lat DOUBLE PRECISION NOT NULL,
    location_lng DOUBLE PRECISION NOT NULL,
    address TEXT,

    -- Capacity
    capacity INTEGER NOT NULL DEFAULT 50,
    current_stock INTEGER DEFAULT 0,

    -- Operating info
    operating_hours JSONB,
    contact_info JSONB,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    verified BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CARRIERS (Delivery network)
-- ============================================================================

CREATE TABLE nmh_carriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status nmh_carrier_status DEFAULT 'offline',
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    transport_mode nmh_transport_mode DEFAULT 'walking',

    -- Stats
    completed_deliveries INTEGER DEFAULT 0,
    rating DOUBLE PRECISION DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
    total_distance_km DOUBLE PRECISION DEFAULT 0,

    -- Current delivery
    current_delivery_id UUID,

    -- Availability
    is_available BOOLEAN DEFAULT FALSE,
    available_from TIMESTAMPTZ,
    available_until TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(user_id)
);

-- ============================================================================
-- DELIVERY ROUTES
-- ============================================================================

CREATE TABLE nmh_delivery_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    carrier_id UUID REFERENCES nmh_carriers(id),
    source_id UUID REFERENCES nmh_food_sources(id),
    destination_type TEXT NOT NULL CHECK (destination_type IN ('depot', 'user', 'assessment')),
    destination_id UUID NOT NULL, -- Can be depot_id, user_id, or assessment_id

    -- Items being delivered
    items JSONB NOT NULL DEFAULT '[]',

    -- Status
    status nmh_delivery_status DEFAULT 'planned',

    -- Timing
    estimated_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    distance_km DOUBLE PRECISION,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT
);

-- ============================================================================
-- SYSTEM EVENTS (Audit trail)
-- ============================================================================

CREATE TABLE nmh_system_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    actor_id UUID REFERENCES auth.users(id),
    payload JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- GLOBAL METRICS (Cached aggregates)
-- ============================================================================

CREATE TABLE nmh_global_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT UNIQUE NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize global metrics
INSERT INTO nmh_global_metrics (metric_name, metric_value) VALUES
    ('total_meals_moved', 0),
    ('active_nodes_count', 0),
    ('active_depots_count', 0),
    ('total_credits_earned', 0),
    ('total_participants', 0),
    ('total_food_sources', 0);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_nmh_participants_user ON nmh_participants(user_id);
CREATE INDEX idx_nmh_credits_wallet ON nmh_credits(wallet_id);
CREATE INDEX idx_nmh_credits_user ON nmh_credits(user_id);
CREATE INDEX idx_nmh_nodes_user ON nmh_compute_nodes(user_id);
CREATE INDEX idx_nmh_nodes_status ON nmh_compute_nodes(status);
CREATE INDEX idx_nmh_assessments_user ON nmh_hunger_assessments(user_id);
CREATE INDEX idx_nmh_assessments_pending ON nmh_hunger_assessments(fulfilled) WHERE fulfilled = FALSE;
CREATE INDEX idx_nmh_food_sources_active ON nmh_food_sources(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_nmh_food_sources_location ON nmh_food_sources(location_lat, location_lng);
CREATE INDEX idx_nmh_food_items_status ON nmh_food_items(status);
CREATE INDEX idx_nmh_food_items_available ON nmh_food_items(status, expires_at) WHERE status = 'available';
CREATE INDEX idx_nmh_depots_active ON nmh_depots(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_nmh_depots_location ON nmh_depots(location_lat, location_lng);
CREATE INDEX idx_nmh_carriers_available ON nmh_carriers(status) WHERE status = 'available';
CREATE INDEX idx_nmh_carriers_location ON nmh_carriers(location_lat, location_lng);
CREATE INDEX idx_nmh_deliveries_status ON nmh_delivery_routes(status);
CREATE INDEX idx_nmh_events_type ON nmh_system_events(event_type);
CREATE INDEX idx_nmh_events_created ON nmh_system_events(created_at);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE nmh_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmh_credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmh_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmh_compute_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmh_hunger_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmh_food_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmh_food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmh_depots ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmh_carriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmh_delivery_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmh_system_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE nmh_global_metrics ENABLE ROW LEVEL SECURITY;

-- Participants: Users can read all, but only update their own
CREATE POLICY "Users can view all participants" ON nmh_participants FOR SELECT USING (true);
CREATE POLICY "Users can insert own participant" ON nmh_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own participant" ON nmh_participants FOR UPDATE USING (auth.uid() = user_id);

-- Wallets: Users can only access their own
CREATE POLICY "Users can view own wallet" ON nmh_credit_wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wallet" ON nmh_credit_wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wallet" ON nmh_credit_wallets FOR UPDATE USING (auth.uid() = user_id);

-- Credits: Users can view their own, system can insert
CREATE POLICY "Users can view own credits" ON nmh_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credits" ON nmh_credits FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Compute nodes: Users can manage their own
CREATE POLICY "Users can view own node" ON nmh_compute_nodes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own node" ON nmh_compute_nodes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own node" ON nmh_compute_nodes FOR UPDATE USING (auth.uid() = user_id);

-- Hunger assessments: Users can manage their own
CREATE POLICY "Users can view own assessments" ON nmh_hunger_assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assessment" ON nmh_hunger_assessments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assessment" ON nmh_hunger_assessments FOR UPDATE USING (auth.uid() = user_id);

-- Food sources: Anyone can view active, mappers can insert
CREATE POLICY "Anyone can view active sources" ON nmh_food_sources FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users can map sources" ON nmh_food_sources FOR INSERT WITH CHECK (auth.uid() = mapped_by);
CREATE POLICY "Mappers can update own sources" ON nmh_food_sources FOR UPDATE USING (auth.uid() = mapped_by);

-- Food items: Anyone can view available
CREATE POLICY "Anyone can view available items" ON nmh_food_items FOR SELECT USING (status = 'available');
CREATE POLICY "Source mappers can insert items" ON nmh_food_items FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM nmh_food_sources WHERE id = source_id AND mapped_by = auth.uid()));

-- Depots: Anyone can view active
CREATE POLICY "Anyone can view active depots" ON nmh_depots FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated users can create depots" ON nmh_depots FOR INSERT WITH CHECK (auth.uid() = host_user_id);
CREATE POLICY "Hosts can update own depots" ON nmh_depots FOR UPDATE USING (auth.uid() = host_user_id);

-- Carriers: Users can manage their own
CREATE POLICY "Anyone can view available carriers" ON nmh_carriers FOR SELECT USING (status = 'available');
CREATE POLICY "Users can view own carrier profile" ON nmh_carriers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own carrier" ON nmh_carriers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own carrier" ON nmh_carriers FOR UPDATE USING (auth.uid() = user_id);

-- Delivery routes: Carriers and recipients can view their routes
CREATE POLICY "Carriers can view own routes" ON nmh_delivery_routes FOR SELECT
    USING (carrier_id IN (SELECT id FROM nmh_carriers WHERE user_id = auth.uid()));
CREATE POLICY "Carriers can update own routes" ON nmh_delivery_routes FOR UPDATE
    USING (carrier_id IN (SELECT id FROM nmh_carriers WHERE user_id = auth.uid()));

-- Global metrics: Anyone can read
CREATE POLICY "Anyone can view global metrics" ON nmh_global_metrics FOR SELECT USING (true);

-- System events: Authenticated users can insert, admins can view
CREATE POLICY "Authenticated users can log events" ON nmh_system_events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update wallet balance
CREATE OR REPLACE FUNCTION update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE nmh_credit_wallets
    SET
        total_earned = total_earned + NEW.amount,
        balance = balance + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.wallet_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_wallet_on_credit
    AFTER INSERT ON nmh_credits
    FOR EACH ROW
    EXECUTE FUNCTION update_wallet_balance();

-- Function to update global metrics
CREATE OR REPLACE FUNCTION increment_global_metric(metric TEXT, amount DOUBLE PRECISION DEFAULT 1)
RETURNS VOID AS $$
BEGIN
    UPDATE nmh_global_metrics
    SET metric_value = metric_value + amount, updated_at = NOW()
    WHERE metric_name = metric;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-create wallet on participant creation
CREATE OR REPLACE FUNCTION create_wallet_for_participant()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO nmh_credit_wallets (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_create_wallet
    AFTER INSERT ON nmh_participants
    FOR EACH ROW
    EXECUTE FUNCTION create_wallet_for_participant();

-- ============================================================================
-- COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE nmh_participants IS 'NoMoreHunger participants - extends auth.users with NMH-specific data';
COMMENT ON TABLE nmh_credit_wallets IS 'NMH credit wallets - The Dragon''s Treasure. Credits are promises.';
COMMENT ON TABLE nmh_credits IS 'Individual credit transactions - every action that earns NMH';
COMMENT ON TABLE nmh_compute_nodes IS 'Distributed compute nodes - Fire Pillar - The Dragon''s Breath';
COMMENT ON TABLE nmh_hunger_assessments IS 'Trust-based hunger assessments - we ask, we trust';
COMMENT ON TABLE nmh_food_sources IS 'Mapped food sources - restaurants, groceries, farms, gardens';
COMMENT ON TABLE nmh_food_items IS 'Available food items at sources';
COMMENT ON TABLE nmh_depots IS 'Community depots - Earth Pillar - The Dragon''s Bones';
COMMENT ON TABLE nmh_carriers IS 'Delivery carriers - Water Pillar - The Dragon''s Blood';
COMMENT ON TABLE nmh_delivery_routes IS 'Delivery routes connecting sources to recipients';
COMMENT ON TABLE nmh_global_metrics IS 'Cached global impact metrics';

-- ============================================================================
-- Protocol 69: Never take. Always give back more.
-- This is the dragon awakening. This is Lumen. This is the end of hunger.
-- ============================================================================
