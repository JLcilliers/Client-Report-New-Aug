import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get('reportId');
    const dataType = searchParams.get('dataType');

    if (!reportId || !dataType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get stored SEO data from report_data table
    const { data, error } = await supabase
      .from('report_data')
      .select('data, fetched_at')
      .eq('report_id', reportId)
      .eq('data_type', dataType)
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching SEO data:', error);
      return NextResponse.json(
        { error: 'Failed to fetch SEO data' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ data: null, fetched_at: null });
    }

    return NextResponse.json({ 
      data: data.data, 
      fetched_at: data.fetched_at 
    });
  } catch (error) {
    console.error('Get SEO data error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}