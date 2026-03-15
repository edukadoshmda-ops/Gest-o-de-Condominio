import { spawn } from 'child_process'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)
const openMod = require('open')
const open = (openMod?.default ?? openMod)

// Aguarda o Vite iniciar e abre o navegador
setTimeout(() => {
  open('http://localhost:5173').catch(err => {
    console.warn('Tentando 5174...')
    open('http://localhost:5174').catch(console.error)
  })
}, 6000)

// Inicia o Vite
const vite = spawn('npx', ['vite'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
})

vite.on('error', (err) => {
  console.error('Erro ao iniciar Vite:', err)
  process.exit(1)
})

vite.on('exit', (code) => {
  process.exit(code)
})
