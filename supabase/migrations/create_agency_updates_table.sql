-- Create agency_updates table for todos, notes, and updates
CREATE TABLE IF NOT EXISTS agency_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('todo', 'note', 'update')),
  title TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'archived')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT, -- Email or ID of who created it
  assigned_to TEXT -- Email or ID of who it's assigned to
);

-- Create indexes for performance
CREATE INDEX idx_agency_updates_report ON agency_updates(report_id);
CREATE INDEX idx_agency_updates_type ON agency_updates(type);
CREATE INDEX idx_agency_updates_status ON agency_updates(status);
CREATE INDEX idx_agency_updates_created ON agency_updates(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_agency_updates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER agency_updates_updated_at_trigger
  BEFORE UPDATE ON agency_updates
  FOR EACH ROW
  EXECUTE FUNCTION update_agency_updates_updated_at();

-- Add RLS policies (optional - adjust based on your security needs)
ALTER TABLE agency_updates ENABLE ROW LEVEL SECURITY;

-- Policy for public read access (clients can see updates for their reports)
CREATE POLICY "Public can view agency updates for public reports"
  ON agency_updates
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM reports
      WHERE reports.id = agency_updates.report_id
      AND reports.is_public = true
    )
  );

-- Sample data for testing (optional - remove in production)
-- INSERT INTO agency_updates (report_id, type, title, content, priority, status)
-- VALUES 
--   ('your-report-id', 'todo', 'Optimize meta descriptions', 'Review and update meta descriptions for top 10 pages', 'high', 'in_progress'),
--   ('your-report-id', 'update', 'Sitemap submitted', 'Submitted updated XML sitemap to Google Search Console', 'medium', 'completed'),
--   ('your-report-id', 'note', 'Seasonal traffic expected', 'Traffic typically increases 30% during Q4 holiday season', 'low', 'pending');