/**
 * Script para criar usuário no Supabase Auth
 * Uso: node criar-usuario.js
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ozwccrfzxsbsciobwhke.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im96d2NjcmZ6eHNic2Npb2J3aGtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MjI4NjIsImV4cCI6MjA4Nzk5ODg2Mn0.CNOlrKwosr6JY1Gi0uoe3gX0e_ULQaHfh6o6On3Bpd4'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const email = 'edukadoshmda@gmail.com'
const password = '123456'

async function main() {
  console.log('Criando usuário:', email)
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: undefined }
  })
  if (error) {
    if (error.message.includes('already been registered') || error.message.includes('already registered')) {
      console.log('Este e-mail já está cadastrado. Pode usar "Entrar" com a senha 123456.')
      return
    }
    console.error('Erro:', error.message)
    process.exit(1)
  }
  if (data?.user) {
    console.log('Usuário criado com sucesso.')
    console.log('Pode entrar com:', email, 'e senha 123456')
  } else {
    console.log('Verifique seu e-mail para confirmar a conta (se o projeto exige confirmação).')
  }
}

main()
