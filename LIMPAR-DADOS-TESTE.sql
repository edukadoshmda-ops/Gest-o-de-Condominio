-- Cole no Supabase SQL Editor e execute para APAGAR todos os dados de teste
-- O app ficará vazio e pronto para uso com dados reais
-- https://supabase.com/dashboard > SQL Editor > New query

-- Remove votos de enquetes
DELETE FROM public.enquete_votos;

-- Remove enquetes
DELETE FROM public.enquetes;

-- Remove avisos
DELETE FROM public.avisos;

-- Remove posts do mural
DELETE FROM public.mural;

-- Remove comentários do mural
DELETE FROM public.comentarios;

-- Remove achados e perdidos
DELETE FROM public.achados_perdidos;

-- Opcional: remova as linhas abaixo se quiser manter encomendas e faturas
-- DELETE FROM public.encomendas;
-- DELETE FROM public.faturas;
