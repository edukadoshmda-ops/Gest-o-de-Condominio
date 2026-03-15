/**
 * Cria o usuário super admin edukadoshmda@gmail.com / 123456 no Supabase Auth.
 * Usa a chave service_role (API Admin) para criar o usuário já confirmado.
 *
 * Uso:
 *   1. No Supabase Dashboard: Settings > API > copie "service_role" (secret).
 *   2. Rode: set SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui && node criar-superadmin.js
 *      (No PowerShell: $env:SUPABASE_SERVICE_ROLE_KEY="sua_chave"; node criar-superadmin.js)
 *   3. Se ainda der "Database error", execute antes o SQL em supabase/CORRIGIR-ERRO-CRIAR-USUARIO.sql
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

// Carrega .env se existir (apenas para este script; não use VITE_ para service_role)
function loadEnv() {
  const path = resolve(process.cwd(), '.env')
  if (!existsSync(path)) return
  try {
    const content = readFileSync(path, 'utf8')
    content.split('\n').forEach((line) => {
      const i = line.indexOf('=')
      if (i <= 0) return
      const key = line.slice(0, i).trim()
      const val = line.slice(i + 1).trim().replace(/^["']|["']$/g, '')
      if (key && !process.env[key]) process.env[key] = val
    })
  } catch (_) {}
}
loadEnv()

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ozwccrfzxsbsciobwhke.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!serviceRoleKey) {
  console.error('Defina SUPABASE_SERVICE_ROLE_KEY (Dashboard > Settings > API > service_role).')
  console.error('Exemplo PowerShell: $env:SUPABASE_SERVICE_ROLE_KEY="sua_chave"; node criar-superadmin.js')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const email = 'edukadoshmda@gmail.com'
const password = '123456'

async function main() {
  console.log('Criando super admin:', email)
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })
  if (error) {
    if (error.message.includes('already been registered') || error.message.includes('already exists')) {
      console.log('Este e-mail já está cadastrado. Use "Entrar" com a senha definida (ex.: 123456).')
      return
    }
    console.error('Erro:', error.message)
    if (error.message.includes('Database error')) {
      console.error('Execute antes: supabase/CORRIGIR-ERRO-CRIAR-USUARIO.sql (passos C e D) no SQL Editor.')
    }
    process.exit(1)
  }
  if (data?.user) {
    console.log('Super admin criado com sucesso.')
    console.log('Entre no app com:', email, 'e senha', password)
  }
}

main()
