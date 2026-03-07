-- Cole no Supabase SQL Editor e execute para APAGAR dados de teste.
-- Se alguma tabela não existir, aquele DELETE será ignorado.
-- https://supabase.com/dashboard > SQL Editor > New query

DO $$ BEGIN DELETE FROM public.enquete_votos; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN DELETE FROM public.enquetes; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN DELETE FROM public.avisos; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN DELETE FROM public.comentarios; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN DELETE FROM public.mural; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN DELETE FROM public.achados_perdidos; EXCEPTION WHEN undefined_table THEN NULL; END $$;
DO $$ BEGIN DELETE FROM public.faturas; EXCEPTION WHEN undefined_table THEN NULL; END $$;
