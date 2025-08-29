import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
    
    // Create report_data table
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    })
    
    if (error) {
      // Try a simpler approach
      const { error: createError } = await supabase
        .from('report_data')
        .select('id')
        .limit(1)
      
      if (createError && createError.code === '42P01') {
        // Table doesn't exist, return info
        return NextResponse.json({ 
          message: "Table needs to be created manually in Supabase dashboard",
          sql: `
-- Create report_data table for storing fetched metrics
CREATE TABLE IF NOT EXISTS report_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  data_type TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  date_range TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(report_id, data_type)
);

-- Create indexes
CREATE INDEX idx_report_data_report_id ON report_data(report_id);
CREATE INDEX idx_report_data_type ON report_data(data_type);

-- Enable RLS
ALTER TABLE report_data ENABLE ROW LEVEL SECURITY;

-- Create policy for public read
CREATE POLICY "Public can read report data" ON report_data
  FOR SELECT USING (true);
          `
        })
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: "Table exists or was created successfully" 
    })
    
  } catch (error: any) {
    
    return NextResponse.json({ 
      error: "Failed to ensure table exists", 
      details: error.message 
    }, { status: 500 })
  }
}