-- Update RLS policy to allow anonymous users to create URLs
DROP POLICY IF EXISTS "Authenticated users can create URLs" ON public.urls;

CREATE POLICY "Anyone can create URLs" 
ON public.urls 
FOR INSERT 
WITH CHECK (true);

-- Also update the created_by column to be nullable for anonymous users
ALTER TABLE public.urls ALTER COLUMN created_by DROP NOT NULL;