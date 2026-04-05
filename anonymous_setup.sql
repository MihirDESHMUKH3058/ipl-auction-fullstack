-- SQL Setup for Anonymous Bidding
-- This script creates the necessary infrastructure for multi-device secret bidding.

-- 1. Table to store the current status of the anonymous auction
create table if not exists public.anonymous_auction_settings (
  id int primary key default 1,
  active_player_id text, -- ID of the player currently being bid on
  bids_revealed boolean default false,
  check (id = 1) -- Ensure only one row exists
);

-- Initialize settings if not present
insert into public.anonymous_auction_settings (id, active_player_id, bids_revealed)
values (1, null, false)
on conflict (id) do nothing;

-- 2. Table to store the actual bids from each team
create table if not exists public.anonymous_bids (
  player_id text not null,
  team_name text not null,
  amount int not null,
  created_at timestamp with time zone default now(),
  primary key (player_id, team_name)
);

-- 3. Enable Realtime for these tables
alter publication supabase_realtime add table public.anonymous_auction_settings;
alter publication supabase_realtime add table public.anonymous_bids;

-- 4. RLS Policies
alter table public.anonymous_auction_settings enable row level security;
alter table public.anonymous_bids enable row level security;

-- Drop settings policy if it exists to avoid error
drop policy if exists "Allow all on settings" on public.anonymous_auction_settings;
create policy "Allow all on settings" on public.anonymous_auction_settings for all using (true);

-- Drop the old permissive policy
drop policy if exists "Allow all on bids" on public.anonymous_bids;

-- Create strict policies to only allow Insert and Select
create policy "Allow insert on bids" on public.anonymous_bids for insert with check (true);
create policy "Allow select on bids" on public.anonymous_bids for select using (true);
create policy "Allow delete on bids" on public.anonymous_bids for delete using (true);
-- Notice: NO update policy!

-- 5. Hard Database-Level Trigger to Prevent Updates (Bulletproof)
CREATE OR REPLACE FUNCTION prevent_bid_update()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Bid already submitted. You cannot modify it.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS block_bid_update ON public.anonymous_bids;
CREATE TRIGGER block_bid_update
BEFORE UPDATE ON public.anonymous_bids
FOR EACH ROW EXECUTE FUNCTION prevent_bid_update();
