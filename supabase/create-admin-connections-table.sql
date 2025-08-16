-- Create admin_google_connections table
CREATE TABLE IF NOT EXISTS admin_google_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_email TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  email TEXT NOT NULL,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE admin_google_connections ENABLE ROW LEVEL SECURITY;

-- Create policy for admins to read their own connections
CREATE POLICY "Admins can read own connections" ON admin_google_connections
  FOR SELECT USING (
    admin_email = auth.jwt() ->> 'email'
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- Create policy for service role to manage all connections
CREATE POLICY "Service role can manage all connections" ON admin_google_connections
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create function to execute SQL (useful for creating tables from API)
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;