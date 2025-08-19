-- Create report_properties table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.report_properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
    property_id TEXT NOT NULL,
    property_type TEXT NOT NULL CHECK (property_type IN ('search_console', 'analytics')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(report_id, property_id, property_type)
);

-- Create agency_updates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.agency_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id UUID REFERENCES public.reports(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('todo', 'note', 'update')),
    title TEXT NOT NULL,
    content TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_report_properties_report_id ON public.report_properties(report_id);
CREATE INDEX IF NOT EXISTS idx_agency_updates_report_id ON public.agency_updates(report_id);
CREATE INDEX IF NOT EXISTS idx_agency_updates_type ON public.agency_updates(type);
CREATE INDEX IF NOT EXISTS idx_agency_updates_status ON public.agency_updates(status);

-- Enable RLS
ALTER TABLE public.report_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_updates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for report_properties
CREATE POLICY "Public can read report_properties" 
    ON public.report_properties FOR SELECT 
    USING (true);

CREATE POLICY "Service role can manage report_properties" 
    ON public.report_properties 
    USING (auth.role() = 'service_role');

-- Create RLS policies for agency_updates
CREATE POLICY "Public can read agency_updates" 
    ON public.agency_updates FOR SELECT 
    USING (true);

CREATE POLICY "Service role can manage agency_updates" 
    ON public.agency_updates 
    USING (auth.role() = 'service_role');

-- Add search_console_properties and analytics_properties columns to reports table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' 
                   AND column_name = 'search_console_properties') THEN
        ALTER TABLE public.reports ADD COLUMN search_console_properties TEXT[];
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'reports' 
                   AND column_name = 'analytics_properties') THEN
        ALTER TABLE public.reports ADD COLUMN analytics_properties TEXT[];
    END IF;
END $$;