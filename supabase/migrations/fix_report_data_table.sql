-- Check if report_data has the correct structure
-- First, let's add any missing columns
DO $$ 
BEGIN
    -- Add date_range column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'report_data' 
                   AND column_name = 'date_range') THEN
        ALTER TABLE public.report_data ADD COLUMN date_range TEXT DEFAULT 'current';
    END IF;
    
    -- Add fetched_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'report_data' 
                   AND column_name = 'fetched_at') THEN
        ALTER TABLE public.report_data ADD COLUMN fetched_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
    END IF;
END $$;

-- Drop existing unique constraint if it exists and recreate it properly
ALTER TABLE public.report_data DROP CONSTRAINT IF EXISTS report_data_report_id_data_type_key;
ALTER TABLE public.report_data DROP CONSTRAINT IF EXISTS report_data_unique;

-- Create a proper unique constraint for upsert operations
ALTER TABLE public.report_data 
ADD CONSTRAINT report_data_unique UNIQUE (report_id, data_type);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_report_data_report_id ON public.report_data(report_id);
CREATE INDEX IF NOT EXISTS idx_report_data_data_type ON public.report_data(data_type);
CREATE INDEX IF NOT EXISTS idx_report_data_fetched_at ON public.report_data(fetched_at DESC);