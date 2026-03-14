create extension if not exists pgcrypto;

create table if not exists public.leads (
    id uuid primary key default gen_random_uuid(),
    nome_sindico text not null,
    telefone text not null,
    email text not null,
    nome_condominio text not null,
    condominio_id uuid references public.condominios(id) on delete set null,
    origem text not null default 'landing-30-dias',
    status text not null default 'novo',
    trial_started_at timestamptz not null default timezone('utc', now()),
    trial_ends_at timestamptz not null,
    created_at timestamptz not null default timezone('utc', now())
);

alter table public.leads enable row level security;

do $$
begin
    if exists (
        select 1
        from information_schema.tables
        where table_schema = 'public'
          and table_name = 'usuarios'
    ) then
        drop policy if exists "admin_master_select_leads" on public.leads;
        create policy "admin_master_select_leads"
        on public.leads
        for select
        to authenticated
        using (
            exists (
                select 1
                from public.usuarios u
                where u.id = auth.uid()
                  and u.tipo = 'admin_master'
            )
        );
    end if;
end $$;

drop function if exists public.start_trial_lead(text, text, text, text);
create or replace function public.start_trial_lead(
    p_nome_sindico text,
    p_telefone text,
    p_email text,
    p_nome_condominio text
)
returns table (
    lead_id uuid,
    condominio_id uuid,
    nome_condominio text,
    trial_ends_at date
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_condominio_id uuid;
    v_lead_id uuid;
    v_trial_end date := current_date + 30;
    v_codigo text;
begin
    if trim(coalesce(p_nome_sindico, '')) = '' then
        raise exception 'Informe o nome do síndico.';
    end if;

    if trim(coalesce(p_telefone, '')) = '' then
        raise exception 'Informe o telefone.';
    end if;

    if trim(coalesce(p_email, '')) = '' then
        raise exception 'Informe o e-mail.';
    end if;

    if trim(coalesce(p_nome_condominio, '')) = '' then
        raise exception 'Informe o nome do condomínio.';
    end if;

    if exists (
        select 1
        from public.condominios c
        where lower(trim(c.nome)) = lower(trim(p_nome_condominio))
    ) then
        raise exception 'Já existe um condomínio com esse nome. Use outro nome ou faça login.';
    end if;

    v_codigo := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

    insert into public.condominios (
        nome,
        codigo_acesso,
        status,
        data_vencimento
    )
    values (
        trim(p_nome_condominio),
        v_codigo,
        'ativo',
        v_trial_end
    )
    returning id into v_condominio_id;

    insert into public.leads (
        nome_sindico,
        telefone,
        email,
        nome_condominio,
        condominio_id,
        trial_ends_at
    )
    values (
        trim(p_nome_sindico),
        trim(p_telefone),
        lower(trim(p_email)),
        trim(p_nome_condominio),
        v_condominio_id,
        v_trial_end::timestamptz
    )
    returning id into v_lead_id;

    return query
    select
        v_lead_id,
        v_condominio_id,
        trim(p_nome_condominio),
        v_trial_end;
end;
$$;

grant execute on function public.start_trial_lead(text, text, text, text) to anon, authenticated;
