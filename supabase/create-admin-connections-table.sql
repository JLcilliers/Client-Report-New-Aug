-- Create admin_google_connections table
CREATE TABLE IF NOT EXISTS admin_google_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_google_connections_email 
ON admin_google_connections(admin_email);

-- Enable RLS
ALTER TABLE admin_google_connections ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to manage
CREATE POLICY "Service role can manage admin connections" 
ON admin_google_connections 
FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');
