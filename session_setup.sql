-- 1. Table to track active franchise sessions
create table if not exists public.active_franchise_sessions (
  franchise_id text primary key,
  session_id text not null,
  last_activity timestamp with time zone default now() not null
);

-- 2. Enable Realtime (optional, but good for sync)
alter publication supabase_realtime add table public.active_franchise_sessions;

-- 3. RLS Policies
alter table public.active_franchise_sessions enable row level security;

create policy "Allow all on active_sessions" 
  on public.active_franchise_sessions for all 
  using (true);
