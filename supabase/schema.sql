-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  report_token TEXT UNIQUE DEFAULT gen_random_uuid(),
  settings JSONB DEFAULT '{"reportSections": ["overview", "traffic", "keywords", "technical", "content"]}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Google credentials storage (encrypted)
CREATE TABLE IF NOT EXISTS google_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMP WITH TIME ZONE,
  gsc_site_url TEXT, -- e.g., "https://example.com"
  ga4_property_id TEXT, -- e.g., "properties/123456789"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id)
);

-- Metrics cache with auto-cleanup
CREATE TABLE IF NOT EXISTS metrics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'gsc_performance', 'ga4_traffic', 'pagespeed', etc.
  date_range TEXT, -- '7d', '30d', '90d'
  data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Historical data for trends
CREATE TABLE IF NOT EXISTS historical_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  metrics JSONB NOT NULL, -- {clicks, impressions, users, sessions, etc.}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(client_id, date)
);

-- Admin users (just me)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_metrics_cache_client ON metrics_cache(client_id);
CREATE INDEX IF NOT EXISTS idx_metrics_cache_expires ON metrics_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_historical_client_date ON historical_metrics(client_id, date);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE google_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public can read client reports with valid token" ON clients;
DROP POLICY IF EXISTS "Admin full access to clients" ON clients;
DROP POLICY IF EXISTS "Public can read clients" ON clients;
DROP POLICY IF EXISTS "Admin can insert clients" ON clients;
DROP POLICY IF EXISTS "Admin can update clients" ON clients;
DROP POLICY IF EXISTS "Admin can delete clients" ON clients;

DROP POLICY IF EXISTS "Admin access to google_credentials" ON google_credentials;
DROP POLICY IF EXISTS "Admin can select google_credentials" ON google_credentials;
DROP POLICY IF EXISTS "Admin can insert google_credentials" ON google_credentials;
DROP POLICY IF EXISTS "Admin can update google_credentials" ON google_credentials;
DROP POLICY IF EXISTS "Admin can delete google_credentials" ON google_credentials;

DROP POLICY IF EXISTS "Public read metrics_cache" ON metrics_cache;
DROP POLICY IF EXISTS "Public can read metrics_cache" ON metrics_cache;
DROP POLICY IF EXISTS "Admin write metrics_cache" ON metrics_cache;
DROP POLICY IF EXISTS "Admin can insert metrics_cache" ON metrics_cache;
DROP POLICY IF EXISTS "Admin update metrics_cache" ON metrics_cache;
DROP POLICY IF EXISTS "Admin can update metrics_cache" ON metrics_cache;
DROP POLICY IF EXISTS "Admin delete metrics_cache" ON metrics_cache;
DROP POLICY IF EXISTS "Admin can delete metrics_cache" ON metrics_cache;

DROP POLICY IF EXISTS "Public read historical_metrics" ON historical_metrics;
DROP POLICY IF EXISTS "Public can read historical_metrics" ON historical_metrics;
DROP POLICY IF EXISTS "Admin write historical_metrics" ON historical_metrics;
DROP POLICY IF EXISTS "Admin can insert historical_metrics" ON historical_metrics;
DROP POLICY IF EXISTS "Admin update historical_metrics" ON historical_metrics;
DROP POLICY IF EXISTS "Admin can update historical_metrics" ON historical_metrics;
DROP POLICY IF EXISTS "Admin can delete historical_metrics" ON historical_metrics;

DROP POLICY IF EXISTS "Admin users read own" ON admin_users;
DROP POLICY IF EXISTS "Admin users can read own" ON admin_users;
DROP POLICY IF EXISTS "Service role manage admin users" ON admin_users;
DROP POLICY IF EXISTS "Service role can insert admin users" ON admin_users;
DROP POLICY IF EXISTS "Service role can update admin users" ON admin_users;
DROP POLICY IF EXISTS "Service role can delete admin users" ON admin_users;

-- RLS Policies for clients table
-- Public can read
CREATE POLICY "Public can read clients" ON clients
  FOR SELECT USING (true);

-- Admin can do everything
CREATE POLICY "Admin can insert clients" ON clients
  FOR INSERT WITH CHECK (
    auth.email() IN (SELECT email FROM admin_users)
    OR auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Admin can update clients" ON clients
  FOR UPDATE USING (
    auth.email() IN (SELECT email FROM admin_users)
    OR auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Admin can delete clients" ON clients
  FOR DELETE USING (
    auth.email() IN (SELECT email FROM admin_users)
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- RLS Policies for google_credentials
CREATE POLICY "Admin can select google_credentials" ON google_credentials
  FOR SELECT USING (
    auth.email() IN (SELECT email FROM admin_users)
    OR auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Admin can insert google_credentials" ON google_credentials
  FOR INSERT WITH CHECK (
    auth.email() IN (SELECT email FROM admin_users)
    OR auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Admin can update google_credentials" ON google_credentials
  FOR UPDATE USING (
    auth.email() IN (SELECT email FROM admin_users)
    OR auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Admin can delete google_credentials" ON google_credentials
  FOR DELETE USING (
    auth.email() IN (SELECT email FROM admin_users)
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- RLS Policies for metrics_cache
CREATE POLICY "Public can read metrics_cache" ON metrics_cache
  FOR SELECT USING (true);

CREATE POLICY "Admin can insert metrics_cache" ON metrics_cache
  FOR INSERT WITH CHECK (
    auth.email() IN (SELECT email FROM admin_users)
    OR auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Admin can update metrics_cache" ON metrics_cache
  FOR UPDATE USING (
    auth.email() IN (SELECT email FROM admin_users)
    OR auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Admin can delete metrics_cache" ON metrics_cache
  FOR DELETE USING (
    auth.email() IN (SELECT email FROM admin_users)
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- RLS Policies for historical_metrics
CREATE POLICY "Public can read historical_metrics" ON historical_metrics
  FOR SELECT USING (true);

CREATE POLICY "Admin can insert historical_metrics" ON historical_metrics
  FOR INSERT WITH CHECK (
    auth.email() IN (SELECT email FROM admin_users)
    OR auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Admin can update historical_metrics" ON historical_metrics
  FOR UPDATE USING (
    auth.email() IN (SELECT email FROM admin_users)
    OR auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Admin can delete historical_metrics" ON historical_metrics
  FOR DELETE USING (
    auth.email() IN (SELECT email FROM admin_users)
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- RLS Policies for admin_users
CREATE POLICY "Admin users can read own" ON admin_users
  FOR SELECT USING (
    auth.email() = email
    OR auth.jwt() ->> 'role' = 'service_role'
  );

CREATE POLICY "Service role can insert admin users" ON admin_users
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can update admin users" ON admin_users
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can delete admin users" ON admin_users
  FOR DELETE USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_google_credentials_updated_at ON google_credentials;
CREATE TRIGGER update_google_credentials_updated_at BEFORE UPDATE ON google_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean expired cache
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM metrics_cache WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- Insert your admin user (only if it doesn't already exist)
INSERT INTO admin_users (email) 
VALUES ('johanlcilliers@gmail.com')
ON CONFLICT (email) DO NOTHING;