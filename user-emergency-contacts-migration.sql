-- Migration: Add user emergency contacts table
-- This allows users to manage their own personal emergency contacts

-- User emergency contacts table (for individual users to manage)
CREATE TABLE IF NOT EXISTS user_emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    relationship VARCHAR(100), -- e.g., 'Family', 'Friend', 'Colleague'
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_user_emergency_contacts_user_id ON user_emergency_contacts(user_id);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_emergency_contacts_updated_at BEFORE UPDATE ON user_emergency_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

