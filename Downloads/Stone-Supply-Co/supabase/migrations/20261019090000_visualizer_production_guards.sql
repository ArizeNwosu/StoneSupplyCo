create table if not exists public.api_rate_limits (
  key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0)
);

alter table public.api_rate_limits enable row level security;

create or replace function public.check_api_rate_limit(
  rate_key text,
  request_limit integer,
  window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  insert into public.api_rate_limits as limits (key, window_started_at, request_count)
  values (rate_key, now(), 1)
  on conflict (key) do update
  set
    window_started_at = case
      when limits.window_started_at <= now() - make_interval(secs => window_seconds)
        then now()
      else limits.window_started_at
    end,
    request_count = case
      when limits.window_started_at <= now() - make_interval(secs => window_seconds)
        then 1
      else limits.request_count + 1
    end
  returning request_count into updated_count;

  return updated_count <= request_limit;
end;
$$;

revoke all on function public.check_api_rate_limit(text, integer, integer) from public;
grant execute on function public.check_api_rate_limit(text, integer, integer) to service_role;

create or replace function public.reserve_visualizer_render(
  target_session_id uuid,
  render_limit integer
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  reserved_count integer;
begin
  update public.visualizer_sessions
  set render_count = render_count + 1
  where id = target_session_id
    and render_count < render_limit
  returning render_count into reserved_count;

  return coalesce(reserved_count, -1);
end;
$$;

revoke all on function public.reserve_visualizer_render(uuid, integer) from public;
grant execute on function public.reserve_visualizer_render(uuid, integer) to service_role;
