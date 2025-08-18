-- Create table for multiple Google accounts
CREATE TABLE IF NOT EXISTS google_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_email TEXT NOT NULL UNIQUE,
  account_name TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  scopes TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table to link reports to specific Google accounts
CREATE TABLE IF NOT EXISTS report_google_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  google_account_id UUID NOT NULL REFERENCES google_accounts(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL CHECK (account_type IN ('search_console', 'analytics', 'both')),
  properties JSONB, -- Store selected properties for this report
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id, google_account_id, account_type)
);

-- Add indexes
CREATE INDEX idx_google_accounts_email ON google_accounts(account_email);
CREATE INDEX idx_google_accounts_active ON google_accounts(is_active);
CREATE INDEX idx_report_google_accounts_report ON report_google_accounts(report_id);
CREATE INDEX idx_report_google_accounts_account ON report_google_accounts(google_account_id);

-- Add RLS policies
ALTER TABLE google_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_google_accounts ENABLE ROW LEVEL SECURITY;

-- Only admin can manage Google accounts (you can adjust this policy as needed)
CREATE POLICY "Admin can manage Google accounts" ON google_accounts
  FOR ALL USING (true);

CREATE POLICY "Admin can manage report Google accounts" ON report_google_accounts
  FOR ALL USING (true);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_google_accounts_updated_at
  BEFORE UPDATE ON google_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();