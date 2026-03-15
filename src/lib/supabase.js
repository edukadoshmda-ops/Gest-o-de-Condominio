import { createClient } from '@supabase/supabase-js'

// Use variáveis de ambiente (.env: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) ou fallback do projeto atual
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ozwccrfzxsbsciobwhke.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96d2NjcmZ6eHNic2Npb2J3aGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MjI4NjIsImV4cCI6MjA4Nzk5ODg2Mn0.CNOlrKwosr6JY1Gi0uoe3gX0e_ULQaHfh6o6On3Bpd4'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
