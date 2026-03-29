-- THE "NUCLEAR SYNC" FIX --
-- Run this in the Supabase SQL Editor to solve all data alignment issues.

-- 1. Rename column if it exists as mixed-case "finalPrice"
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='auction_records' AND column_name='finalPrice'
  ) THEN
    ALTER TABLE auction_records RENAME COLUMN "finalPrice" TO final_price;
  END IF;
END $$;

-- 2. Ensure table has final_price column (if it didn't exist at all)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='auction_records' AND column_name='final_price'
  ) THEN
    ALTER TABLE auction_records ADD COLUMN final_price text;
  END IF;
END $$;

-- 3. Ensure player_id is the primary key (Text type)
-- (If it's already PK, this might need manual intervention if type differs)
-- ALTER TABLE auction_records ALTER COLUMN player_id TYPE text;

-- 4. Enable Realtime Replication
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'auction_records'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE auction_records;
  END IF;
END $$;

-- 5. CRITICAL: Set replica identity to FULL
-- This is the most common reason only one device sees updates.
ALTER TABLE auction_records REPLICA IDENTITY FULL;

-- 6. Ensure RLS allows all actions (for this specific simple app)
ALTER TABLE auction_records DISABLE ROW LEVEL SECURITY;
-- OR if you want to keep RLS:
-- DROP POLICY IF EXISTS "public_access" ON auction_records;
-- CREATE POLICY "public_access" ON auction_records FOR ALL USING (true) WITH CHECK (true);
