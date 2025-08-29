-- Create report_data table for storing fetched metrics
CREATE TABLE IF NOT EXISTS report_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL, -- 'search_console', 'analytics', 'pagespeed'
  data JSONB NOT NULL DEFAULT '{}',
  date_range TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one record per report and data type
  UNIQUE(report_id, data_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_data_report_id ON report_data(report_id);
CREATE INDEX IF NOT EXISTS idx_report_data_type ON report_data(data_type);
CREATE INDEX IF NOT EXISTS idx_report_data_fetched_at ON report_data(fetched_at);

-- Enable RLS
ALTER TABLE report_data ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Service role can manage report data" ON report_data
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Public can read report data (for client reports)
CREATE POLICY "Public can read report data" ON report_data
  FOR SELECT USING (true);