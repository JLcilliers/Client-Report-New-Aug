import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { reportId, dataType, data } = await request.json();

    if (!reportId || !dataType || !data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Store SEO data in report_data table
    const { error: upsertError } = await supabase
      .from('report_data')
      .upsert({
        report_id: reportId,
        data_type: dataType,
        data,
        date_range: 'current',
        fetched_at: new Date().toISOString()
      }, {
        onConflict: 'report_id,data_type'
      });

    if (upsertError) {
      
      
      // Try insert if upsert fails
      
      const { error: insertError } = await supabase
        .from('report_data')
        .insert({
          report_id: reportId,
          data_type: dataType,
          data,
          date_range: 'current',
          fetched_at: new Date().toISOString()
        });

      if (insertError) {
        
        return NextResponse.json(
          { error: 'Failed to save SEO data', details: insertError.message },
          { status: 500 }
        );
      }
      
      
    } else {
      
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}