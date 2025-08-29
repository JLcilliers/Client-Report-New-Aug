-- Add google_account_id column to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS google_account_id UUID REFERENCES google_accounts(id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reports_google_account ON reports(google_account_id);