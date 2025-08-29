-- Step 1: View duplicates (optional - just to see what we're dealing with)
-- Run this first to see the duplicates:
/*
SELECT report_id, data_type, COUNT(*) as count
FROM public.report_data
GROUP BY report_id, data_type
HAVING COUNT(*) > 1;
*/

-- Step 2: Clean up duplicates - keep only the most recent entry for each report_id/data_type combination
-- This will delete older duplicates and keep the newest one
WITH duplicates AS (
  SELECT 
    id,
    report_id,
    data_type,
    fetched_at,
    ROW_NUMBER() OVER (
      PARTITION BY report_id, data_type 
      ORDER BY fetched_at DESC NULLS LAST, id DESC
    ) as rn
  FROM public.report_data
)
DELETE FROM public.report_data
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Step 3: Add missing columns if they don't exist
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

-- Step 4: Now add the unique constraint (should work after removing duplicates)
ALTER TABLE public.report_data DROP CONSTRAINT IF EXISTS report_data_report_id_data_type_key;
ALTER TABLE public.report_data DROP CONSTRAINT IF EXISTS report_data_unique;

ALTER TABLE public.report_data 
ADD CONSTRAINT report_data_unique UNIQUE (report_id, data_type);

-- Step 5: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_report_data_report_id ON public.report_data(report_id);
CREATE INDEX IF NOT EXISTS idx_report_data_data_type ON public.report_data(data_type);
CREATE INDEX IF NOT EXISTS idx_report_data_fetched_at ON public.report_data(fetched_at DESC);

-- Step 6: Update the upsert behavior in our API to handle this properly
-- The constraint will now prevent duplicates and our upsert will work correctly