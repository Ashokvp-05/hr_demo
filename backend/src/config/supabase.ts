
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Storage Bucket name
export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'hr-documents';

// Initialize only if credentials are provided to prevent "supabaseUrl is required" error
export const supabase = (supabaseUrl && (supabaseServiceKey || supabaseKey))
    ? createClient(supabaseUrl, supabaseServiceKey || supabaseKey)
    : null as any;
