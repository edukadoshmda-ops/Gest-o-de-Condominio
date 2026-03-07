# Gestor360 – Gestão de Condomínio

Sistema de gestão de condomínios com Supabase, React e Vite.

## Funcionalidades

- **Dashboard** – Avisos, enquetes, indicadores
- **Mural** – Feed de publicações, comentários, Achados & Perdidos
- **Chat** – Canais (Síndico, Portaria, Comercial, Diversos) e mensagens privadas entre moradores
- **Encomendas** – Controle de volumes na portaria
- **Reservas** – Áreas comuns (salão, churrasqueira etc.)
- **Financeiro** – Faturas, boletos, pagamentos
- **Chamados** – Ocorrências e solicitações
- **Visitantes** – Cadastro e liberação
- **Patrimônio** – Itens e manutenções
- **Notificações** – Centro de notificações e push no dispositivo

## Instalação

```bash
git clone https://github.com/edukadoshmda-ops/Gest-o-de-Condominio.git
cd Gest-o-de-Condominio
npm install
```

## Configuração

1. Copie o arquivo de exemplo e preencha com suas credenciais:

   ```bash
   cp .env.example .env
   ```

2. No `.env`, defina:
   - `VITE_SUPABASE_URL` – URL do seu projeto Supabase
   - `VITE_SUPABASE_ANON_KEY` – Chave anônima do Supabase

3. Execute as migrations no Supabase (SQL Editor ou `supabase db push`):
   - Todas as migrations em `supabase/migrations/`
   - Ou o arquivo `RODAR-MIGRACOES.sql`

## Rodar o projeto

```bash
npm run dev
```

Ou use o script para abrir automaticamente:

```bash
npm run abrir
```

## Documentação

- [Como abrir o app](docs/COMO-ABRIR-APP.md)
- [Notificações push](docs/NOTIFICACOES.md)

## Tecnologias

- React 18
- Vite
- Tailwind CSS
- Supabase (Auth, Database, Realtime, Edge Functions)
