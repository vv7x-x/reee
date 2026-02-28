/**
 * Cosmic Living Library — Supabase configuration
 * Set your project URL and anon key from Supabase Dashboard → Settings → API
 */
const SUPABASE_URL = 'https://wjnmcofuqrppsxuvjmed.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oH8Xz4D4vdsRTde1zV70Cg_8uC3ujwV';

if (typeof window !== 'undefined') {
  window.COSMIC_SUPABASE_URL = SUPABASE_URL;
  window.COSMIC_SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;
}
