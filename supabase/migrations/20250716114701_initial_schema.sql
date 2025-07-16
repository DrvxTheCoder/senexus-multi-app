-- Initial schema for Senexus multi-app platform
-- This migration creates the foundational tables for the multi-company platform

-- Create senexus_groups table (top-level organization)
CREATE TABLE IF NOT EXISTS senexus_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create firms table (companies within a group)
CREATE TABLE IF NOT EXISTS firms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    senexus_group_id UUID NOT NULL REFERENCES senexus_groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT, -- 'Holding', 'SARL', 'SAS', etc.
    description TEXT,
    logo TEXT, -- URL to logo image
    theme_color TEXT, -- Hex color code for firm branding
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(senexus_group_id, name) -- Prevent duplicate firm names within the same group
);

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    firm_id UUID REFERENCES firms(id) ON DELETE SET NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user', -- 'admin', 'manager', 'user'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE senexus_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_firms_senexus_group_id ON firms(senexus_group_id);
CREATE INDEX IF NOT EXISTS idx_firms_active ON firms(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_profiles_firm_id ON profiles(firm_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Create basic RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for firms (users can see firms they belong to)
CREATE POLICY "Users can view their firm" ON firms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.firm_id = firms.id 
            AND profiles.id = auth.uid()
        )
    );

-- Create RLS policies for senexus_groups (users can see their group)
CREATE POLICY "Users can view their group" ON senexus_groups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            JOIN firms ON profiles.firm_id = firms.id
            WHERE firms.senexus_group_id = senexus_groups.id 
            AND profiles.id = auth.uid()
        )
    );

-- Insert initial data
INSERT INTO senexus_groups (name, description) 
VALUES ('Senexus Group', 'Main holding group for all companies')
ON CONFLICT (name) DO NOTHING;

-- Insert initial firms
INSERT INTO firms (senexus_group_id, name, type, description, logo, theme_color, is_active) 
SELECT 
    sg.id,
    firm_data.name,
    firm_data.type,
    firm_data.description,
    firm_data.logo,
    firm_data.theme_color,
    firm_data.is_active
FROM senexus_groups sg,
(VALUES 
    ('Senexus Group', 'Holding', 'Groupe holding principal', '/assets/img/icons/senexus-icon.png', '#000000', true),
    ('Connect Interim', 'SARL', 'Agence d''intérim spécialisée', '/assets/img/icons/connectinterim-icon.png', '#f59e0b', true),
    ('SynergiePro', 'SAS', 'Services professionnels en synergie', '/assets/img/icons/synergie-icon.png', '#3b82f6', true),
    ('IPM Tawfeikh', 'SARL', 'Institut de préparation et de management', '/assets/img/icons/ipmtawfeikh-icon.png', '#10b981', true)
) AS firm_data(name, type, description, logo, theme_color, is_active)
WHERE sg.name = 'Senexus Group'
ON CONFLICT (senexus_group_id, name) DO UPDATE SET
    logo = EXCLUDED.logo,
    theme_color = EXCLUDED.theme_color,
    type = EXCLUDED.type,
    description = EXCLUDED.description;

-- Add comments for documentation
COMMENT ON TABLE senexus_groups IS 'Top-level organization groups';
COMMENT ON TABLE firms IS 'Individual companies/firms within a group';
COMMENT ON TABLE profiles IS 'User profiles extending Supabase auth';
COMMENT ON COLUMN firms.logo IS 'URL to the firm logo image';
COMMENT ON COLUMN firms.theme_color IS 'Hex color code for the firm theme (e.g., #FF5733)';
COMMENT ON COLUMN profiles.role IS 'User role: admin, manager, or user';