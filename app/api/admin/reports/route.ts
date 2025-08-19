import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Fetch all reports with their properties and stored audit data
    const { data: reports, error } = await supabase
      .from("reports")
      .select(`
        *,
        report_properties (
          property_id,
          property_type
        ),
        report_data (
          data_type,
          data,
          fetched_at
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching reports:", error);
      return NextResponse.json(
        { error: "Failed to fetch reports" },
        { status: 500 }
      );
    }

    // Transform the data to include properties as arrays and audit data
    const transformedReports = reports?.map(report => {
      const searchConsoleProps = report.report_properties
        ?.filter((p: any) => p.property_type === "search_console")
        .map((p: any) => p.property_id) || [];
      
      const analyticsProps = report.report_properties
        ?.filter((p: any) => p.property_type === "analytics")
        .map((p: any) => p.property_id) || [];

      // Extract audit data
      const auditData = report.report_data?.find((rd: any) => rd.data_type === "technical_seo");
      const lastDataFetch = report.report_data?.find((rd: any) => rd.data_type === "combined");

      let auditSummary = null;
      if (auditData?.data) {
        // Calculate audit summary from stored data
        const data = auditData.data;
        const totalChecks = Object.keys(data).length;
        const passCount = Object.values(data).filter((check: any) => check.status === 'pass').length;
        const warningCount = Object.values(data).filter((check: any) => check.status === 'warning').length;
        const failCount = Object.values(data).filter((check: any) => check.status === 'fail').length;
        
        auditSummary = {
          score: Math.round((passCount / totalChecks) * 100),
          totalChecks,
          passCount,
          warningCount,
          failCount,
          lastRun: auditData.fetched_at
        };
      }

      return {
        id: report.id,
        slug: report.slug,
        name: report.name,
        report_name: report.report_name,
        client_name: report.client_name,
        domain: report.client?.domain || report.client_name,
        created_at: report.created_at,
        updated_at: report.updated_at,
        is_public: report.is_public !== false,
        google_account_id: report.google_account_id,
        search_console_properties: searchConsoleProps,
        analytics_properties: analyticsProps,
        audit_summary: auditSummary,
        last_data_fetch: lastDataFetch?.fetched_at
      };
    }) || [];

    return NextResponse.json(transformedReports);
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}