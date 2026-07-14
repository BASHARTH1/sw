import { createClient } from '@supabase/supabase-js';

/**
 * Public Supabase client for the Sustainability Week site.
 *
 * The publishable key is safe to ship in the browser — it only grants the
 * privileges allowed by Row Level Security. The `registrations` table accepts
 * INSERTs from anonymous visitors but cannot be read back by them.
 */
export const supabase = createClient(
  'https://xgdtzkyhznxaebknfdkd.supabase.co',
  'sb_publishable_RMgZgRhsoF4Sow5yvtfBNw_W9MRXDIn'
);
