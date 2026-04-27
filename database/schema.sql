-- Supabase PostgreSQL Schema for Dawat-e-Quran Project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom Types
CREATE TYPE user_role AS ENUM ('murabbi', 'moawin_dawat', 'zone_nazim', 'admin');
CREATE TYPE participant_type AS ENUM ('haazir_arkan', 'aam_afraad');
CREATE TYPE event_category AS ENUM ('quran_circle', 'ijtima_arkan', 'dars_e_quran', 'other');

-- 1. Geography / Structure
CREATE TABLE zones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE sectors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    zone_id UUID REFERENCES zones(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE union_councils (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    sector_id UUID REFERENCES sectors(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE quran_circles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    uc_id UUID REFERENCES union_councils(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Users (Extending Supabase Auth)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    role user_role NOT NULL DEFAULT 'murabbi',
    assigned_circle_id UUID REFERENCES quran_circles(id) ON DELETE SET NULL, -- For Murabbi
    assigned_sector_id UUID REFERENCES sectors(id) ON DELETE SET NULL, -- For Moawin Dawat
    assigned_zone_id UUID REFERENCES zones(id) ON DELETE SET NULL, -- For Zone Nazim
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Syllabus
CREATE TABLE syllabus_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_number INT NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    reference TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Participants
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    type participant_type NOT NULL DEFAULT 'haazir_arkan',
    circle_id UUID REFERENCES quran_circles(id) ON DELETE CASCADE,
    remarks TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Sessions / Jaiza
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_date DATE NOT NULL,
    category event_category NOT NULL DEFAULT 'quran_circle',
    location VARCHAR(255),
    notes TEXT,
    circle_id UUID REFERENCES quran_circles(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES syllabus_topics(id) ON DELETE SET NULL,
    logged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Attendance
CREATE TABLE attendance (
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
    status BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (session_id, participant_id)
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE union_councils ENABLE ROW LEVEL SECURITY;
ALTER TABLE quran_circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE syllabus_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Utility Function to get user role
CREATE OR REPLACE FUNCTION get_user_role() RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Structure and Syllabus are readable by everyone
CREATE POLICY "Public Read Access for Structure" ON zones FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read Access for Sectors" ON sectors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read Access for UCs" ON union_councils FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read Access for Circles" ON quran_circles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read Access for Syllabus" ON syllabus_topics FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can manage syllabus" ON syllabus_topics FOR ALL TO authenticated USING (get_user_role() = 'admin' OR get_user_role() = 'zone_nazim');

-- Participants RLS
CREATE POLICY "Public Read Access for Participants" ON participants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can manage participants" ON participants FOR ALL TO authenticated USING (get_user_role() = 'admin' OR get_user_role() = 'zone_nazim');

-- Sessions RLS
-- During dev/demo, allow anyone to insert and view sessions
CREATE POLICY "Public Insert for Sessions" ON sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public Select for Sessions" ON sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can manage all sessions" ON sessions FOR ALL TO authenticated USING (get_user_role() = 'admin' OR get_user_role() = 'zone_nazim');

-- Attendance RLS
-- During dev/demo, allow anyone to insert and view attendance
CREATE POLICY "Public Insert for Attendance" ON attendance FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Public Select for Attendance" ON attendance FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can manage all attendance" ON attendance FOR ALL TO authenticated USING (get_user_role() = 'admin' OR get_user_role() = 'zone_nazim');

