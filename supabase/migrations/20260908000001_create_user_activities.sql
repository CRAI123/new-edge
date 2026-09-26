-- Create user_activities table
CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own activities" 
ON public.user_activities FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all activities" 
ON public.user_activities FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can insert their own activities" 
ON public.user_activities FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create a function to keep only the last 50 activities per user
CREATE OR REPLACE FUNCTION public.trim_user_activities()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.user_activities
  WHERE id IN (
    SELECT id FROM public.user_activities
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    OFFSET 50
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically trim activities after insert
DROP TRIGGER IF EXISTS trim_user_activities_trigger ON public.user_activities;
CREATE TRIGGER trim_user_activities_trigger
AFTER INSERT ON public.user_activities
FOR EACH ROW
EXECUTE FUNCTION public.trim_user_activities();

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id_created_at 
ON public.user_activities(user_id, created_at DESC);
