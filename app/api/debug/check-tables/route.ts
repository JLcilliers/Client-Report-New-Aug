import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Check which tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');

    // Check report_data table structure
    const { data: reportData, error: reportDataError } = await supabase
      .from('report_data')
      .select('*')
      .limit(1);

    // Check if agency_updates exists
    const { data: agencyUpdates, error: agencyError } = await supabase
      .from('agency_updates')
      .select('*')
      .limit(1);

    return NextResponse.json({
      tables: tables?.map(t => t.table_name) || [],
      report_data_exists: !reportDataError || reportDataError.code !== '42P01',
      agency_updates_exists: !agencyError || agencyError.code !== '42P01',
      errors: {
        tables: tablesError?.message,
        report_data: reportDataError?.message,
        agency_updates: agencyError?.message
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}