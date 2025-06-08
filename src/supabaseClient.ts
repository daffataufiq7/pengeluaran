import { createClient } from '@supabase/supabase-js';

// Ganti dengan URL dan anon key dari dashboard Supabase project kamu
const supabase = createClient(
  'https://bokqxtiiesjeexxmvgmr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJva3F4dGlpZXNqZWV4eG12Z21yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwMTI5MDgsImV4cCI6MjA2NDU4ODkwOH0.4Sl5kP_433s429TW3kq55pLGHCA8BM7dHq3HQR81eEI'
);

export default supabase;
