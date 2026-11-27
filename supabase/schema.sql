-- Ejecutar completo en Supabase: SQL Editor -> New query -> Run.

-- Forma canónica del correo para detectar alias: sin mayúsculas, sin el sufijo "+etiqueta"
-- y, en Gmail, sin puntos (ana.perez+x@gmail.com y anaperez@gmail.com son el mismo buzón).
create or replace function public.normalize_email(e text)
returns text
language sql
immutable
as $$
  select case
    when split_part(lower(btrim(e)), '@', 2) in ('gmail.com', 'googlemail.com')
      then replace(split_part(split_part(lower(btrim(e)), '@', 1), '+', 1), '.', '') || '@gmail.com'
    else split_part(split_part(lower(btrim(e)), '@', 1), '+', 1) || '@' || split_part(lower(btrim(e)), '@', 2)
  end;
$$;

create table if not exists public.claims (
  topic_id     text primary key check (topic_id ~ '^[a-z0-9-]{1,60}$'),
  student_name text not null check (char_length(btrim(student_name)) between 3 and 120),
  email        text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 150
                                    and public.normalize_email(email) ~ '^[^@]+@'),
  created_at   timestamptz not null default now()
);

-- Candado: un correo (en su forma canónica) solo puede tener un tema.
drop index if exists public.claims_email_unique;
create unique index claims_email_unique on public.claims (public.normalize_email(email));

-- La tabla no es accesible directamente con la clave pública; solo vía las funciones de abajo.
alter table public.claims enable row level security;
revoke all on public.claims from anon, authenticated;

create or replace function public.taken_topics()
returns setof text
language sql
security definer
set search_path = public
as $$
  select topic_id from public.claims;
$$;

create or replace function public.claim_topic(p_topic text, p_name text, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c text;
begin
  insert into public.claims (topic_id, student_name, email)
  values (p_topic, btrim(p_name), btrim(p_email));
exception
  when unique_violation then
    get stacked diagnostics c = constraint_name;
    if c = 'claims_pkey' then
      raise exception 'topic_taken' using errcode = 'P0001';
    else
      raise exception 'email_already_used' using errcode = 'P0001';
    end if;
  when check_violation then
    raise exception 'invalid_input' using errcode = 'P0001';
end;
$$;

revoke all on function public.taken_topics() from public;
revoke all on function public.claim_topic(text, text, text) from public;
grant execute on function public.taken_topics() to anon;
grant execute on function public.claim_topic(text, text, text) to anon;
