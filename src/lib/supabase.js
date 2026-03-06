import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xarljytgieadligbrtzf.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhcmxqeXRnaWVhZGxpZ2JydHpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2NDI1MTgsImV4cCI6MjA4NzIxODUxOH0.rwODIj4r_S5rd8Y08dincentXbzfArIq6-ZYSHyc7G0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
