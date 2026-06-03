// Initializes window.SUPABASE_CLIENT if SUPABASE_URL and SUPABASE_ANON_KEY are provided.
(function(){
  if (typeof supabase === 'undefined') { window.SUPABASE_CLIENT = null; return; }
  try {
    if (typeof SUPABASE_URL !== 'undefined' && SUPABASE_URL && typeof SUPABASE_ANON_KEY !== 'undefined' && SUPABASE_ANON_KEY) {
      window.SUPABASE_CLIENT = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      window.SUPABASE_ENABLED = true;
    } else {
      window.SUPABASE_CLIENT = null;
      window.SUPABASE_ENABLED = false;
    }
  } catch (e) {
    console.error('Supabase init error', e);
    window.SUPABASE_CLIENT = null;
    window.SUPABASE_ENABLED = false;
  }
})();
