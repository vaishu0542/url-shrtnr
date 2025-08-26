-- Create table for storing shortened URLs
CREATE TABLE public.urls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_url TEXT NOT NULL,
  short_code TEXT NOT NULL UNIQUE,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.urls ENABLE ROW LEVEL SECURITY;

-- Create policies for URL access
CREATE POLICY "Anyone can view URLs for redirection" 
ON public.urls 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create URLs" 
ON public.urls 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own URLs" 
ON public.urls 
FOR UPDATE 
USING (auth.uid() = created_by);

-- Create index for fast short_code lookups
CREATE INDEX idx_urls_short_code ON public.urls(short_code);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_urls_updated_at
BEFORE UPDATE ON public.urls
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();