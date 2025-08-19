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

    // Fetch all reports with their properties
    const { data: reports, error } = await supabase
      .from("reports")
      .select(`
        *,
        report_properties (
          property_id,
          property_type
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

    // Transform the data to include properties as arrays
    const transformedReports = reports?.map(report => {
      const searchConsoleProps = report.report_properties
        ?.filter((p: any) => p.property_type === "search_console")
        .map((p: any) => p.property_id) || [];
      
      const analyticsProps = report.report_properties
        ?.filter((p: any) => p.property_type === "analytics")
        .map((p: any) => p.property_id) || [];

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
        analytics_properties: analyticsProps
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