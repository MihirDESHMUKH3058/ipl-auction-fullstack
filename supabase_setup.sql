-- 1. Create the table
create table public.auction_records (
  player_id text primary key,
  team text not null,
  final_price text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Realtime for the table so the dashboard instantly updates
alter publication supabase_realtime add table public.auction_records;

-- 3. Set up Row Level Security (RLS) policies 
-- (For this app, we will allow all reads and writes if you want easy access, 
-- or you can lock it down later. Here we allow anonymous access for simplicity)
alter table public.auction_records enable row level security;

create policy "Allow public read access" 
  on public.auction_records for select 
  using (true);

create policy "Allow public insert access" 
  on public.auction_records for insert 
  with check (true);

create policy "Allow public update access" 
  on public.auction_records for update 
  using (true);

create policy "Allow public delete access" 
  on public.auction_records for delete 
  using (true);
