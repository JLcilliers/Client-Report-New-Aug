# Setup Report Data Table

To store the fetched Google Search Console and Analytics data, run this SQL in your Supabase SQL Editor:

```sql
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

-- Create policy for public read (so client reports can access the data)
CREATE POLICY "Public can read report data" ON report_data
  FOR SELECT USING (true);
```

## Steps to Execute:
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Paste the above SQL
4. Click "Run"

This table will store:
- Search Console metrics (clicks, impressions, CTR, position, top pages, top queries)
- Analytics metrics (users, sessions, pageviews, bounce rate, etc.)
- PageSpeed insights (when implemented)

The data is stored as JSONB for flexibility and is automatically refreshed when the "Refresh Data" button is clicked on reports.