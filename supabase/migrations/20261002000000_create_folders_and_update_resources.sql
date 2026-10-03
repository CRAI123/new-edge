-- Create folders table
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  user_id UUID REFERENCES auth.users(id) -- Optional, if folders can be user-specific
);

-- Add folder_id to resources table
ALTER TABLE resources
ADD COLUMN folder_id UUID REFERENCES folders(id);

-- Add order_index to resources table for sorting
ALTER TABLE resources
ADD COLUMN order_index BIGINT DEFAULT EXTRACT(EPOCH FROM NOW());

-- Optional: Add an index to folder_id for faster lookups
CREATE INDEX ON resources (folder_id);

-- Optional: Add RLS policies for folders table
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON folders
FOR SELECT USING (TRUE);

CREATE POLICY "Enable insert for authenticated users" ON folders
FOR INSERT TO authenticated WITH CHECK (TRUE);

CREATE POLICY "Enable update for authenticated users" ON folders
FOR UPDATE TO authenticated USING (TRUE);

CREATE POLICY "Enable delete for authenticated users" ON folders
FOR DELETE TO authenticated USING (TRUE);