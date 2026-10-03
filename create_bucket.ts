import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string; // You need to add this to .env
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createStorageBucket() {
  const { data, error } = await supabase.storage.createBucket('community-media', {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'model/stl', 'application/sla', 'text/plain'],
    fileSizeLimit: 52428800
  });
  
  if (error) {
    console.log('Bucket already exists or error:', error.message);
  } else {
    console.log('Bucket created successfully:', data);
  }
}

createStorageBucket();
