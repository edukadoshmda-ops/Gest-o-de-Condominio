-- Cole no Supabase SQL Editor e execute.
-- Exclui "Meu Primeiro Condomínio" e todos os dados vinculados.
-- Roda diretamente no banco (ignora RLS).

DO $$
DECLARE
  cid uuid;
BEGIN
  SELECT id INTO cid FROM public.condominios WHERE nome = 'Meu Primeiro Condomínio' LIMIT 1;
  IF cid IS NULL THEN
    RAISE NOTICE 'Condomínio não encontrado.';
    RETURN;
  END IF;

  BEGIN DELETE FROM public.enquete_votos WHERE enquete_id IN (SELECT id FROM public.enquetes WHERE condominio_id = cid); EXCEPTION WHEN undefined_table THEN NULL; END;
  DELETE FROM public.enquetes WHERE condominio_id = cid;
  DELETE FROM public.avisos WHERE condominio_id = cid;
  BEGIN DELETE FROM public.comentarios WHERE post_id IN (SELECT id FROM public.mural WHERE condominio_id = cid); EXCEPTION WHEN undefined_table THEN NULL; END;
  DELETE FROM public.mural WHERE condominio_id = cid;
  DELETE FROM public.achados_perdidos WHERE condominio_id = cid;
  BEGIN DELETE FROM public.notificacoes WHERE condominio_id = cid; EXCEPTION WHEN undefined_table THEN NULL; END;
  DELETE FROM public.faturas WHERE condominio_id = cid;
  DELETE FROM public.reservas WHERE condominio_id = cid;
  DELETE FROM public.encomendas WHERE condominio_id = cid;
  BEGIN DELETE FROM public.documentos WHERE condominio_id = cid; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM public.patrimonio_execucoes WHERE condominio_id = cid; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM public.patrimonio_checklists WHERE condominio_id = cid; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM public.patrimonio WHERE condominio_id = cid; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM public.mensagens WHERE condominio_id = cid; EXCEPTION WHEN undefined_table THEN NULL; END;
  BEGIN DELETE FROM public.mensagens_privadas WHERE condominio_id = cid; EXCEPTION WHEN undefined_table THEN NULL; END;
  DELETE FROM public.visitantes WHERE condominio_id = cid;
  DELETE FROM public.chamados WHERE condominio_id = cid;
  DELETE FROM public.comunicados WHERE condominio_id = cid;
  DELETE FROM public.usuarios WHERE condominio_id = cid;
  DELETE FROM public.condominios WHERE id = cid;

  RAISE NOTICE 'Condomínio excluído.';
END $$;
