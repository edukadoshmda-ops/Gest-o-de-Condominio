/**
 * Gera PDF com toda a documentação detalhada do Gestor360
 * Execute: node scripts/gerar-documentacao-pdf.js
 */
import { jsPDF } from 'jspdf'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const doc = new jsPDF({ format: 'a4', unit: 'mm' })
let y = 20
const margin = 20
const pageWidth = 210
const textWidth = pageWidth - margin * 2

function addTitle(text, size = 18) {
  if (y > 270) { doc.addPage(); y = 20 }
  doc.setFontSize(size)
  doc.setFont('helvetica', 'bold')
  doc.text(text, margin, y)
  y += 10
}

function addSubtitle(text, size = 14) {
  if (y > 270) { doc.addPage(); y = 20 }
  doc.setFontSize(size)
  doc.setFont('helvetica', 'bold')
  doc.text(text, margin, y)
  y += 8
}

function addText(text, size = 11) {
  doc.setFontSize(size)
  doc.setFont('helvetica', 'normal')
  const lines = doc.splitTextToSize(text, textWidth)
  for (const line of lines) {
    if (y > 275) { doc.addPage(); y = 20 }
    doc.text(line, margin, y)
    y += 6
  }
  y += 2
}

function addCode(code, size = 9) {
  doc.setFontSize(size)
  doc.setFont('courier', 'normal')
  const lines = doc.splitTextToSize(code, textWidth)
  for (const line of lines) {
    if (y > 275) { doc.addPage(); y = 20 }
    doc.text(line, margin + 2, y)
    y += 5
  }
  y += 4
}

function addBullet(text) {
  addText('• ' + text)
}

// ========== CAPA ==========
doc.setFontSize(28)
doc.setFont('helvetica', 'bold')
doc.text('Gestor360', margin, 80)
doc.setFontSize(16)
doc.setFont('helvetica', 'normal')
doc.text('Gestão de Condomínio', margin, 92)
doc.text('Documentação Completa', margin, 102)
doc.setFontSize(10)
doc.text('Sistema de gestão com Supabase, React e Vite', margin, 115)
doc.setFontSize(9)
doc.text(new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }), margin, 280)
doc.addPage()
y = 20

// ========== 1. VISÃO GERAL ==========
addTitle('1. Visão Geral', 16)
addText('O Gestor360 é um sistema completo de gestão de condomínios, desenvolvido em React com Vite e Supabase como backend (autenticação, banco de dados, realtime e Edge Functions).')
y += 4

// ========== 2. FUNCIONALIDADES ==========
addTitle('2. Funcionalidades', 16)
addSubtitle('2.1 Dashboard')
addText('Avisos do síndico, enquetes, indicadores (encomendas pendentes, faturas vencidas, reservas).')
addSubtitle('2.2 Mural')
addText('Feed de publicações com curtidas e comentários; Achados & Perdidos; criação de posts com imagens.')
addSubtitle('2.3 Chat')
addText('Canais fixos: Síndico, Portaria, Comercial, Diversos. Mensagens privadas (DMs) entre moradores. Mensagens em tempo real e exclusão automática após 24 horas.')
addSubtitle('2.4 Encomendas')
addText('Controle de volumes na portaria por unidade/bloco, status Pendente/Entregue.')
addSubtitle('2.5 Reservas')
addText('Reserva de áreas comuns (salão, churrasqueira, etc.) com data e horário.')
addSubtitle('2.6 Financeiro')
addText('Faturas, boletos, pagamentos. Síndico pode criar faturas e confirmar pagamentos.')
addSubtitle('2.7 Chamados')
addText('Ocorrências e solicitações com filtros por status (Abertos, Em Progresso, Concluídos).')
addSubtitle('2.8 Visitantes')
addText('Cadastro e liberação de visitantes.')
addSubtitle('2.9 Patrimônio')
addText('Controle de itens e manutenções.')
addSubtitle('2.10 Notificações')
addText('Centro de notificações in-app e push no dispositivo (mesmo com o app fechado).')
y += 4

// ========== 3. INSTALAÇÃO ==========
addTitle('3. Instalação', 16)
addText('Clone o repositório, entre na pasta e instale as dependências:')
addCode(`git clone https://github.com/edukadoshmda-ops/Gest-o-de-Condominio.git
cd Gest-o-de-Condominio
npm install`)
y += 4

// ========== 4. CONFIGURAÇÃO ==========
addTitle('4. Configuração', 16)
addSubtitle('4.1 Arquivo .env')
addText('Copie o .env.example para .env e preencha:')
addCode(`cp .env.example .env`)
addText('Variáveis obrigatórias:')
addBullet('VITE_SUPABASE_URL – URL do projeto Supabase (ex: https://xxxx.supabase.co)')
addBullet('VITE_SUPABASE_ANON_KEY – Chave anônima do Supabase')
addText('Variáveis opcionais:')
addBullet('VITE_SUPERADMIN_EMAIL – E-mail para acesso como admin master')
addBullet('VITE_VAPID_PUBLIC_KEY – Chave pública para notificações push (gerar com: npm run vapid)')
y += 4

// ========== 5. BANCO DE DADOS (MIGRATIONS) ==========
addTitle('5. Banco de Dados e Migrations', 16)
addText('Execute no Supabase SQL Editor (https://supabase.com/dashboard > SQL Editor) o arquivo RODAR-MIGRACOES.sql ou as migrations individuais em supabase/migrations/ na ordem.')
addText('Principais tabelas criadas:')
addBullet('condominios, usuarios – cadastro')
addBullet('mural, comentarios – feed')
addBullet('mensagens, mensagens_privadas, conversas – chat')
addBullet('encomendas, reservas, faturas, chamados')
addBullet('visitantes, patrimonio, achados_perdidos')
addBullet('notificacoes, push_subscriptions – notificações')
addText('As migrations 013 a 015 incluem: mensagens privadas, trigger de notificação para DMs, realtime para DMs e atualização dos nomes dos canais.')
y += 4

// ========== 6. COMO RODAR O APP ==========
addTitle('6. Como Rodar o App', 16)
addText('Opção 1 – Script automático:')
addCode('npm run abrir')
addText('Ou duplo clique em ABRIR-APP.bat')
addText('Opção 2 – Manual:')
addCode(`npm run dev`)
addText('Depois abra no navegador: http://localhost:5173 (ou 5174, 5175 conforme o terminal)')
y += 4

// ========== 7. NOTIFICAÇÕES PUSH ==========
addTitle('7. Notificações Push (Passo a Passo)', 16)
addSubtitle('Passo 1 – Chave VAPID no .env')
addText('Adicione no .env: VITE_VAPID_PUBLIC_KEY=sua-chave-publica (gere com: npm run vapid)')
addSubtitle('Passo 2 – Tabela push_subscriptions')
addText('Execute o SQL da seção push_subscriptions no RODAR-MIGRACOES.sql (já incluído).')
addSubtitle('Passo 3 – Deploy da Edge Function')
addCode(`supabase login
supabase link --project-ref xarljytgieadligbrtzf
supabase functions deploy send-push`)
addText('Ou instale o Supabase CLI: winget install Supabase.CLI')
addSubtitle('Passo 4 – Secret VAPID')
addText('Supabase Dashboard > Edge Functions > send-push > Manage secrets')
addText('Nome: VAPID_KEYS_JSON | Valor: {"privateKey":"...","publicKey":"..."}')
addSubtitle('Passo 5 – Webhook')
addText('Database > Webhooks > Create hook: Tabela notificacoes, Evento Insert, Função send-push')
addSubtitle('Passo 6 – Ativar no app')
addText('Mural > ícone engrenagem nas Conversas > "Ativar notificações no dispositivo" > Permitir no navegador')
y += 4

// ========== 8. ESTRUTURA DO PROJETO ==========
addTitle('8. Estrutura do Projeto', 16)
addCode(`src/
  components/    - Componentes React (Dashboard, Mural, Financeiro, etc.)
  hooks/         - useNotifications
  lib/           - supabase, push, toast
  App.jsx, main.jsx, index.css
public/          - logo.png, sw.js (Service Worker)
supabase/
  migrations/    - Scripts SQL (001 a 015)
  functions/     - send-push (Edge Function)
docs/            - COMO-ABRIR-APP.md, NOTIFICACOES.md`)
y += 4

// ========== 9. TECNOLOGIAS ==========
addTitle('9. Tecnologias', 16)
addBullet('React 18')
addBullet('Vite')
addBullet('Tailwind CSS')
addBullet('Supabase (Auth, Database, Realtime, Edge Functions)')
addBullet('Lucide React (ícones)')
addBullet('jsPDF, xlsx')
y += 4

// ========== 10. CANAIS DE CHAT ==========
addTitle('10. Canais de Chat', 16)
addText('Os 4 canais fixos: Síndico, Portaria, Comercial, Diversos. Na aba Moradores, é possível abrir conversa privada com qualquer morador do condomínio.')
addText('Mensagens são excluídas automaticamente após 24 horas.')
y += 4

// Rodapé final
addText('— Documentação gerada automaticamente. Gestor360 © 2026 —')

// Salvar
const outputPath = join(root, 'docs', 'GESTOR360-DOCUMENTACAO-COMPLETA.pdf')
doc.save(outputPath)
console.log('PDF gerado em: docs/GESTOR360-DOCUMENTACAO-COMPLETA.pdf')
