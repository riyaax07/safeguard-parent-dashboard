
-- Drop the restrictive ALL policy and replace with permissive per-operation policies
DROP POLICY IF EXISTS "Parents manage own blocklist" ON public.blocked_sites;

CREATE POLICY "Parents read own blocklist" ON public.blocked_sites
  FOR SELECT TO authenticated
  USING (auth.uid() = parent_id);

CREATE POLICY "Parents insert own blocklist" ON public.blocked_sites
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents delete own blocklist" ON public.blocked_sites
  FOR DELETE TO authenticated
  USING (auth.uid() = parent_id);

-- Ensure realtime works for deletes
ALTER TABLE public.blocked_sites REPLICA IDENTITY FULL;
