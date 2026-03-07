-- Execute UMA VEZ no Supabase SQL Editor.
-- https://supabase.com/dashboard > Seu projeto > SQL Editor > New query > Cole e execute.

DROP FUNCTION IF EXISTS public.delete_condominio(uuid);

CREATE OR REPLACE FUNCTION public.delete_condominio(p_condo_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado.';
  END IF;
  IF (SELECT tipo FROM public.usuarios WHERE id = auth.uid() LIMIT 1) <> 'admin_master' THEN
    RAISE EXCEPTION 'Apenas admin master pode excluir condomínios.';
  END IF;

  -- Tabelas que podem não existir (migrations opcionais) - ignora se não existir
  BEGIN
    DELETE FROM public.enquete_votos WHERE enquete_id IN (SELECT id FROM public.enquetes WHERE condominio_id = p_condo_id);
  EXCEPTION WHEN undefined_table THEN NULL;
  END;
  DELETE FROM public.enquetes WHERE condominio_id = p_condo_id;
  DELETE FROM public.avisos WHERE condominio_id = p_condo_id;

  BEGIN
    DELETE FROM public.comentarios WHERE post_id IN (SELECT id FROM public.mural WHERE condominio_id = p_condo_id);
  EXCEPTION WHEN undefined_table THEN NULL;
  END;
  DELETE FROM public.mural WHERE condominio_id = p_condo_id;

  DELETE FROM public.achados_perdidos WHERE condominio_id = p_condo_id;
  BEGIN
    DELETE FROM public.notificacoes WHERE condominio_id = p_condo_id;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;
  DELETE FROM public.faturas WHERE condominio_id = p_condo_id;
  DELETE FROM public.reservas WHERE condominio_id = p_condo_id;
  DELETE FROM public.encomendas WHERE condominio_id = p_condo_id;
  BEGIN
    DELETE FROM public.documentos WHERE condominio_id = p_condo_id;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  BEGIN
    DELETE FROM public.patrimonio_execucoes WHERE condominio_id = p_condo_id;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;
  BEGIN
    DELETE FROM public.patrimonio_checklists WHERE condominio_id = p_condo_id;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;
  BEGIN
    DELETE FROM public.patrimonio WHERE condominio_id = p_condo_id;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  BEGIN
    DELETE FROM public.mensagens WHERE condominio_id = p_condo_id;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;
  BEGIN
    DELETE FROM public.mensagens_privadas WHERE condominio_id = p_condo_id;
  EXCEPTION WHEN undefined_table THEN NULL;
  END;

  DELETE FROM public.visitantes WHERE condominio_id = p_condo_id;
  DELETE FROM public.chamados WHERE condominio_id = p_condo_id;
  DELETE FROM public.comunicados WHERE condominio_id = p_condo_id;
  DELETE FROM public.usuarios WHERE condominio_id = p_condo_id;
  DELETE FROM public.condominios WHERE id = p_condo_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Nenhum condomínio foi excluído. ID: %', p_condo_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_condominio(uuid) TO authenticated;
